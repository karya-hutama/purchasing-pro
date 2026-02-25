import { useState, useRef, ChangeEvent } from 'react';
import { useAppContext, StoreLocation } from '../context/AppContext';
import { Plus, Edit2, Trash2, Upload, Download, Search } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { downloadExcel, uploadExcel } from '../utils/excel';

export const Locations = () => {
  const { locations, setLocations, showNotification } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<{ oldName: string; newName: string } | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLocations = locations.filter(loc => 
    loc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (loc: string) => {
    setLocationToDelete(loc);
  };

  const confirmDelete = () => {
    if (locationToDelete) {
      setLocations(locations.filter(l => l !== locationToDelete));
      showNotification('warning', `Lokasi "${locationToDelete}" berhasil dihapus.`);
      setLocationToDelete(null);
    }
  };

  const handleEdit = (loc: string) => {
    setEditingLocation({ oldName: loc, newName: loc });
    setNewLocationName(loc);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingLocation(null);
    setNewLocationName('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!newLocationName.trim()) return;

    if (editingLocation) {
      // Edit existing
      const updatedLocations = locations.map(loc => 
        loc === editingLocation.oldName ? newLocationName : loc
      );
      setLocations(updatedLocations);
      showNotification('success', `Lokasi berhasil diubah menjadi "${newLocationName}".`);
    } else {
      // Add new
      if (locations.includes(newLocationName)) {
        alert('Lokasi sudah ada!');
        return;
      }
      setLocations([...locations, newLocationName]);
      showNotification('success', `Lokasi "${newLocationName}" berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { 'Nama Lokasi Toko': 'Toko Contoh 1' },
      { 'Nama Lokasi Toko': 'Toko Contoh 2' }
    ];
    downloadExcel(templateData, 'Template_Lokasi_Toko');
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadExcel(file, (data) => {
      const newLocations = data
        .map((row: any) => row['Nama Lokasi Toko'])
        .filter((name: string) => name && !locations.includes(name));

      if (newLocations.length > 0) {
        setLocations([...locations, ...newLocations]);
        showNotification('success', `${newLocations.length} lokasi berhasil ditambahkan.`);
      } else {
        showNotification('warning', 'Tidak ada lokasi baru yang ditambahkan.');
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#0B2D72]">Daftar Lokasi Toko</h1>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleDownloadTemplate} className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={18} />
            <span>Download Template</span>
          </button>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <Upload size={18} />
            <span>Upload Excel</span>
          </button>
          <button onClick={handleAdd} className="flex items-center space-x-2 px-4 py-2 bg-[#0B2D72] text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm">
            <Plus size={18} />
            <span>Tambah Lokasi</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Lokasi Toko..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                <th className="p-4 font-semibold w-16 text-center">No</th>
                <th className="p-4 font-semibold">Nama Lokasi Toko</th>
                <th className="p-4 font-semibold text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLocations.map((loc, index) => (
                <tr key={loc} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 text-center text-gray-500">{index + 1}</td>
                  <td className="p-4 font-medium text-gray-900">{loc}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => handleEdit(loc)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(loc)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLocations.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    Tidak ada data lokasi toko ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#0B2D72]">{editingLocation ? 'Edit Lokasi Toko' : 'Tambah Lokasi Toko'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lokasi</label>
                <input 
                  type="text" 
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Contoh: Toko Jakarta Selatan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" 
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-white bg-[#0B2D72] rounded-lg hover:bg-blue-800">Simpan</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!locationToDelete}
        title="Hapus Lokasi"
        message={`Apakah Anda yakin ingin menghapus lokasi "${locationToDelete}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDelete}
        onCancel={() => setLocationToDelete(null)}
      />
    </div>
  );
};

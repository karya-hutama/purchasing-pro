import { useState, FormEvent, useRef, ChangeEvent } from 'react';
import { useAppContext, Supplier } from '../context/AppContext';
import { Plus, Edit2, Trash2, Upload, Download, Search } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { downloadExcel, uploadExcel } from '../utils/excel';

export const Suppliers = () => {
  const { suppliers, setSuppliers, showNotification } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (id: string) => {
    setSupplierToDelete(id);
  };

  const confirmDelete = () => {
    if (supplierToDelete) {
      setSuppliers(suppliers.filter(s => s.id !== supplierToDelete));
      showNotification('warning', `Supplier dengan ID ${supplierToDelete} berhasil dihapus.`);
      setSupplierToDelete(null);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const top = Number(formData.get('top'));

    const newSupplier: Supplier = { id, name, phone, address, top };

    if (editingSupplier) {
      setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? newSupplier : s));
      showNotification('success', `Supplier ${name} berhasil diubah.`);
    } else {
      if (suppliers.some(s => s.id === id)) {
        alert('ID Supplier sudah ada!');
        return;
      }
      setSuppliers([...suppliers, newSupplier]);
      showNotification('success', `Supplier ${name} berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'ID Supplier': 'SUP001',
        'Nama Supplier': 'PT Contoh Supplier',
        'No Telp': '08123456789',
        'Alamat': 'Jl. Contoh No. 1',
        'TOP (Hari)': 30
      }
    ];
    downloadExcel(templateData, 'Template_Daftar_Supplier');
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadExcel(file, (data) => {
      const newSuppliers: Supplier[] = [];
      
      data.forEach((row: any) => {
        const id = row['ID Supplier'];
        const name = row['Nama Supplier'];
        const phone = row['No Telp'];
        const address = row['Alamat'];
        const top = Number(row['TOP (Hari)']);
        
        if (!id || !name) return;

        newSuppliers.push({
          id: String(id),
          name: String(name),
          phone: String(phone || ''),
          address: String(address || ''),
          top: top || 0
        });
      });

      if (newSuppliers.length > 0) {
        const updatedSuppliers = [...suppliers];
        let addedCount = 0;
        let updatedCount = 0;

        newSuppliers.forEach(newSup => {
          const existingIndex = updatedSuppliers.findIndex(s => s.id === newSup.id);
          if (existingIndex >= 0) {
            updatedSuppliers[existingIndex] = newSup;
            updatedCount++;
          } else {
            updatedSuppliers.push(newSup);
            addedCount++;
          }
        });

        setSuppliers(updatedSuppliers);
        showNotification('success', `${addedCount} supplier ditambahkan, ${updatedCount} supplier diupdate.`);
      } else {
        showNotification('warning', 'Tidak ada data supplier yang valid ditemukan.');
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#0B2D72]">Daftar Supplier</h1>
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
            <span>Tambah Supplier</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari ID atau Nama Supplier..." 
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
                <th className="p-4 font-semibold">ID Supplier</th>
                <th className="p-4 font-semibold">Nama Supplier</th>
                <th className="p-4 font-semibold">No Telp</th>
                <th className="p-4 font-semibold">Alamat</th>
                <th className="p-4 font-semibold text-center">TOP (Hari)</th>
                <th className="p-4 font-semibold text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 font-mono text-sm text-gray-600">{supplier.id}</td>
                  <td className="p-4 font-medium text-gray-900">{supplier.name}</td>
                  <td className="p-4 text-gray-600">{supplier.phone}</td>
                  <td className="p-4 text-gray-600 max-w-xs truncate" title={supplier.address}>{supplier.address}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {supplier.top} Hari
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => handleEdit(supplier)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(supplier.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Tidak ada data supplier ditemukan.
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
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#0B2D72]">{editingSupplier ? 'Edit Supplier' : 'Tambah Supplier'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Supplier</label>
                <input name="id" required type="text" defaultValue={editingSupplier?.id} readOnly={!!editingSupplier} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72] read-only:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Supplier</label>
                <input name="name" required type="text" defaultValue={editingSupplier?.name} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No Telp</label>
                <input name="phone" required type="text" defaultValue={editingSupplier?.phone} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea name="address" required defaultValue={editingSupplier?.address} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term of Payment (Hari)</label>
                <input name="top" required type="number" defaultValue={editingSupplier?.top} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" className="px-4 py-2 text-white bg-[#0B2D72] rounded-lg hover:bg-blue-800">Simpan</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!supplierToDelete}
        title="Hapus Supplier"
        message={`Apakah Anda yakin ingin menghapus supplier dengan ID "${supplierToDelete}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDelete}
        onCancel={() => setSupplierToDelete(null)}
      />
    </div>
  );
};

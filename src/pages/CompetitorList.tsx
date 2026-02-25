import { useState, FormEvent } from 'react';
import { useAppContext, Competitor } from '../context/AppContext';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { SearchableSelect } from '../components/SearchableSelect';

export const CompetitorList = () => {
  const { competitorList, setCompetitorList, locations, showNotification } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [competitorToDelete, setCompetitorToDelete] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState('');

  const filteredCompetitors = competitorList.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.nearLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (id: string) => {
    setCompetitorToDelete(id);
  };

  const confirmDelete = () => {
    if (competitorToDelete) {
      setCompetitorList(competitorList.filter(c => c.id !== competitorToDelete));
      showNotification('warning', 'Data kompetitor berhasil dihapus.');
      setCompetitorToDelete(null);
    }
  };

  const handleEdit = (comp: Competitor) => {
    setEditingCompetitor(comp);
    setSelectedLocation(comp.nearLocation);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCompetitor(null);
    setSelectedLocation('');
    setIsModalOpen(true);
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const nearLocation = formData.get('nearLocation') as string;

    if (!nearLocation) {
      alert('Lokasi Toko harus dipilih');
      return;
    }

    const newCompetitor: Competitor = {
      id: editingCompetitor ? editingCompetitor.id : `C${Date.now()}`,
      name,
      nearLocation
    };

    if (editingCompetitor) {
      setCompetitorList(competitorList.map(c => c.id === editingCompetitor.id ? newCompetitor : c));
      showNotification('success', `Data kompetitor berhasil diubah.`);
    } else {
      setCompetitorList([...competitorList, newCompetitor]);
      showNotification('success', `Data kompetitor berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#0B2D72]">Daftar Kompetitor</h1>
        <button onClick={handleAdd} className="flex items-center space-x-2 px-4 py-2 bg-[#0B2D72] text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm">
          <Plus size={18} />
          <span>Tambah Kompetitor</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Nama Kompetitor atau Lokasi..." 
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
                <th className="p-4 font-semibold">Nama Kompetitor</th>
                <th className="p-4 font-semibold">Dekat Lokasi Toko</th>
                <th className="p-4 font-semibold text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompetitors.map((comp) => (
                <tr key={comp.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{comp.name}</td>
                  <td className="p-4 text-gray-600">{comp.nearLocation}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => handleEdit(comp)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(comp.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCompetitors.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    Tidak ada data kompetitor ditemukan.
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
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#0B2D72]">{editingCompetitor ? 'Edit Kompetitor' : 'Tambah Kompetitor'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kompetitor</label>
                <input name="name" required type="text" defaultValue={editingCompetitor?.name} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dekat Lokasi Toko</label>
                <SearchableSelect
                  name="nearLocation"
                  required
                  value={selectedLocation}
                  onChange={setSelectedLocation}
                  placeholder="Pilih Lokasi"
                  options={locations.map(loc => ({ value: loc, label: loc }))}
                />
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
        isOpen={!!competitorToDelete}
        title="Hapus Kompetitor"
        message="Apakah Anda yakin ingin menghapus data kompetitor ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={confirmDelete}
        onCancel={() => setCompetitorToDelete(null)}
      />
    </div>
  );
};

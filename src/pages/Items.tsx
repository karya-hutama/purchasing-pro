import { useState, FormEvent, useRef, ChangeEvent } from 'react';
import { useAppContext, Item } from '../context/AppContext';
import { Plus, Edit2, Trash2, Upload, Download, Search, Eye } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { downloadExcel, uploadExcel } from '../utils/excel';
import { MultiSelect } from '../components/MultiSelect';

export const Items = () => {
  const { items, locations, suppliers, setItems, showNotification } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (sku: string) => {
    setItemToDelete(sku);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setItems(items.filter(i => i.sku !== itemToDelete));
      showNotification('warning', `Barang dengan SKU ${itemToDelete} berhasil dihapus.`);
      setItemToDelete(null);
    }
  };

  const handleView = (item: Item) => {
    setViewingItem(item);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setSelectedSuppliers(item.suppliers || []);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setSelectedSuppliers([]);
    setIsModalOpen(true);
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const sku = formData.get('sku') as string;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const hpp = Number(formData.get('hpp'));
    
    const newPrices: Record<string, any> = {};
    locations.forEach(loc => {
      newPrices[loc] = {
        retail: Number(formData.get(`retail_${loc}`)),
        reseller: Number(formData.get(`reseller_${loc}`))
      };
    });

    const newItem: Item = {
      sku,
      name,
      category,
      hpp,
      prices: newPrices,
      suppliers: selectedSuppliers
    };

    if (editingItem) {
      setItems(items.map(i => i.sku === editingItem.sku ? newItem : i));
      showNotification('success', `Barang ${name} berhasil diubah.`);
    } else {
      if (items.some(i => i.sku === sku)) {
        alert('SKU sudah ada!');
        return;
      }
      setItems([...items, newItem]);
      showNotification('success', `Barang ${name} berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const handleDownloadTemplate = () => {
    const templateData: any = {
      'SKU': 'ITM001',
      'Nama Barang': 'Barang Contoh',
      'Kategori': 'Kategori Contoh',
      'HPP': 50000,
      'Supplier IDs (pisahkan dengan koma)': 'SUP001, SUP002'
    };
    
    locations.forEach(loc => {
      templateData[`Retail ${loc}`] = 60000;
      templateData[`Reseller ${loc}`] = 55000;
    });

    downloadExcel([templateData], 'Template_Daftar_Barang');
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadExcel(file, (data) => {
      const newItems: Item[] = [];
      
      data.forEach((row: any) => {
        const sku = row['SKU'];
        const name = row['Nama Barang'];
        const category = row['Kategori'];
        const hpp = Number(row['HPP']);
        const supplierIdsStr = row['Supplier IDs (pisahkan dengan koma)'];
        
        if (!sku || !name) return;

        const prices: Record<string, any> = {};
        locations.forEach(loc => {
          prices[loc] = {
            retail: Number(row[`Retail ${loc}`]) || 0,
            reseller: Number(row[`Reseller ${loc}`]) || 0
          };
        });

        const supplierIds = supplierIdsStr ? String(supplierIdsStr).split(',').map(s => s.trim()) : [];

        newItems.push({
          sku,
          name,
          category: category || 'Uncategorized',
          hpp: hpp || 0,
          prices,
          suppliers: supplierIds
        });
      });

      if (newItems.length > 0) {
        // Merge with existing items, overwrite if SKU exists
        const updatedItems = [...items];
        let addedCount = 0;
        let updatedCount = 0;

        newItems.forEach(newItem => {
          const existingIndex = updatedItems.findIndex(i => i.sku === newItem.sku);
          if (existingIndex >= 0) {
            updatedItems[existingIndex] = newItem;
            updatedCount++;
          } else {
            updatedItems.push(newItem);
            addedCount++;
          }
        });

        setItems(updatedItems);
        showNotification('success', `${addedCount} barang ditambahkan, ${updatedCount} barang diupdate.`);
      } else {
        showNotification('warning', 'Tidak ada data barang yang valid ditemukan.');
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const getSupplierNames = (supplierIds: string[]) => {
    return supplierIds.map(id => suppliers.find(s => s.id === id)?.name || id).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#0B2D72]">Daftar Barang</h1>
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
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari SKU atau Nama Barang..." 
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
                <th className="p-4 font-semibold">SKU</th>
                <th className="p-4 font-semibold">Nama Barang</th>
                <th className="p-4 font-semibold">Kategori</th>
                <th className="p-4 font-semibold">HPP</th>
                <th className="p-4 font-semibold border-l border-gray-200">Supplier</th>
                <th className="p-4 font-semibold text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.sku} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 font-mono text-sm text-gray-600">{item.sku}</td>
                  <td className="p-4 font-medium text-gray-900">{item.name}</td>
                  <td className="p-4 text-gray-600">{item.category}</td>
                  <td className="p-4 text-gray-600">Rp {item.hpp.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-sm text-gray-600 border-l border-gray-100 max-w-[200px] truncate" title={getSupplierNames(item.suppliers)}>
                    {getSupplierNames(item.suppliers)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => handleView(item)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors" title="Lihat Detail Harga">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Edit Barang">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(item.sku)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Hapus Barang">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Tidak ada data barang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-[#0B2D72]">Detail Harga: {viewingItem.name}</h2>
              <button type="button" onClick={() => setViewingItem(null)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">SKU</p>
                  <p className="font-mono font-medium text-gray-900">{viewingItem.sku}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Kategori</p>
                  <p className="font-medium text-gray-900">{viewingItem.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">HPP</p>
                  <p className="font-medium text-gray-900">Rp {viewingItem.hpp.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Supplier</p>
                  <p className="font-medium text-gray-900">{getSupplierNames(viewingItem.suppliers) || '-'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Harga per Lokasi</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {locations.map(loc => (
                    <div key={loc} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <h4 className="font-medium text-[#0B2D72] mb-3">{loc}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Retail</span>
                          <span className="font-medium text-gray-900">Rp {viewingItem.prices[loc]?.retail?.toLocaleString('id-ID') || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Reseller</span>
                          <span className="font-medium text-gray-900">Rp {viewingItem.prices[loc]?.reseller?.toLocaleString('id-ID') || '0'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50 sticky bottom-0">
              <button type="button" onClick={() => setViewingItem(null)} className="px-4 py-2 text-white bg-[#0B2D72] rounded-lg hover:bg-blue-800">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form (Simplified for prototype) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-[#0B2D72]">{editingItem ? 'Edit Barang' : 'Tambah Barang'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input name="sku" required type="text" defaultValue={editingItem?.sku} readOnly={!!editingItem} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72] read-only:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
                  <input name="name" required type="text" defaultValue={editingItem?.name} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <input name="category" required type="text" defaultValue={editingItem?.category} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HPP</label>
                  <input name="hpp" required type="number" defaultValue={editingItem?.hpp} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <MultiSelect
                  options={suppliers.map(sup => ({ value: sup.id, label: sup.name }))}
                  value={selectedSuppliers}
                  onChange={setSelectedSuppliers}
                  placeholder="Pilih Supplier"
                />
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Harga per Lokasi</h3>
                {locations.map(loc => (
                  <div key={loc} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center mb-4 sm:mb-3 p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none">
                    <span className="text-sm font-medium sm:font-normal text-gray-700 sm:text-gray-600">{loc}</span>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Retail</label>
                      <input name={`retail_${loc}`} required type="number" defaultValue={editingItem?.prices[loc]?.retail} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Reseller</label>
                      <input name={`reseller_${loc}`} required type="number" defaultValue={editingItem?.prices[loc]?.reseller} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 sticky bottom-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" className="px-4 py-2 text-white bg-[#0B2D72] rounded-lg hover:bg-blue-800">Simpan</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!itemToDelete}
        title="Hapus Barang"
        message={`Apakah Anda yakin ingin menghapus barang dengan SKU "${itemToDelete}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};

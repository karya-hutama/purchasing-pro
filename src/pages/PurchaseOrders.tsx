import { useState, FormEvent, useRef, ChangeEvent } from 'react';
import { useAppContext, PurchaseOrder, PurchaseOrderItem, parseSafeNumber } from '../context/AppContext';
import { Plus, Edit2, Trash2, Upload, Search, Download, X, FileText } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { downloadExcel, uploadExcel } from '../utils/excel';
import { SearchableSelect } from '../components/SearchableSelect';

export const PurchaseOrders = () => {
  const { purchaseOrders, setPurchaseOrders, locations, items, showNotification } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [poToDelete, setPoToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedLocation, setSelectedLocation] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([{ sku: '', qty: 0 }]);

  const filteredPOs = purchaseOrders.filter(po => 
    po.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    po.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (id: string) => {
    setPoToDelete(id);
  };

  const confirmDelete = () => {
    if (poToDelete) {
      setPurchaseOrders(purchaseOrders.filter(po => po.id !== poToDelete));
      showNotification('warning', 'Data Purchase Order berhasil dihapus.');
      setPoToDelete(null);
    }
  };

  const handleEdit = (po: PurchaseOrder) => {
    setEditingPO(po);
    setSelectedLocation(po.location);
    setPoItems(po.items.length > 0 ? po.items : [{ sku: '', qty: 0 }]);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingPO(null);
    setSelectedLocation('');
    setPoItems([{ sku: '', qty: 0 }]);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setPoItems([...poItems, { sku: '', qty: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (poItems.length > 1) {
      const newItems = [...poItems];
      newItems.splice(index, 1);
      setPoItems(newItems);
    }
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const newItems = [...poItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setPoItems(newItems);
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get('id') as string;
    const date = formData.get('date') as string;
    const location = formData.get('location') as string;

    if (!id || !date || !location) {
      alert('Semua field harus diisi');
      return;
    }

    const validItems = poItems.filter(item => item.sku && item.qty > 0);
    if (validItems.length === 0) {
      alert('Minimal satu produk dengan QTY > 0 harus diisi');
      return;
    }

    const newPO: PurchaseOrder = {
      id,
      date,
      location,
      items: validItems
    };

    if (editingPO) {
      // If ID changed, we need to handle that, but usually ID is the unique key
      setPurchaseOrders(purchaseOrders.map(po => po.id === editingPO.id ? newPO : po));
      showNotification('success', 'Purchase Order berhasil diperbarui.');
    } else {
      if (purchaseOrders.some(po => po.id === id)) {
        alert('ID Dokumen sudah ada');
        return;
      }
      setPurchaseOrders([...purchaseOrders, newPO]);
      showNotification('success', 'Purchase Order berhasil ditambahkan.');
    }
    setIsModalOpen(false);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'ID Dokumen': 'PO-202310-001',
        'Tanggal PO (YYYY-MM-DD)': '2023-10-01',
        'Lokasi Toko': 'Toko Jakarta',
        'Produk SKU': 'ITM001',
        'QTY': 100
      },
      {
        'ID Dokumen': 'PO-202310-001',
        'Tanggal PO (YYYY-MM-DD)': '2023-10-01',
        'Lokasi Toko': 'Toko Jakarta',
        'Produk SKU': 'ITM002',
        'QTY': 50
      }
    ];
    downloadExcel(templateData, 'Template_Purchase_Order');
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadExcel(file, (data) => {
      const poMap: Record<string, PurchaseOrder> = {};
      
      data.forEach((row: any) => {
        const id = String(row['ID Dokumen'] || '').trim();
        const date = String(row['Tanggal PO (YYYY-MM-DD)'] || '').trim();
        const location = String(row['Lokasi Toko'] || '').trim();
        const sku = String(row['Produk SKU'] || '').trim();
        const qty = parseSafeNumber(row['QTY'] || 0);
        
        if (!id || !date || !location || !sku || qty <= 0) return;

        if (!poMap[id]) {
          poMap[id] = { id, date, location, items: [] };
        }
        poMap[id].items.push({ sku, qty });
      });

      const newPOs = Object.values(poMap);
      if (newPOs.length > 0) {
        // Merge with existing, replacing if ID matches
        const existingIds = new Set(newPOs.map(po => po.id));
        const updatedPOs = [
          ...purchaseOrders.filter(po => !existingIds.has(po.id)),
          ...newPOs
        ];
        setPurchaseOrders(updatedPOs);
        showNotification('success', `${newPOs.length} Purchase Order berhasil diunggah.`);
      } else {
        showNotification('warning', 'Tidak ada data Purchase Order yang valid ditemukan.');
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#0B2D72]">Purchase Order</h1>
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
            <span>Tambah PO</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari ID Dokumen atau Lokasi..." 
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
                <th className="p-4 font-semibold">ID Dokumen</th>
                <th className="p-4 font-semibold">Tanggal PO</th>
                <th className="p-4 font-semibold">Lokasi Toko</th>
                <th className="p-4 font-semibold">Jumlah Item</th>
                <th className="p-4 font-semibold text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPOs.map((po) => (
                <tr key={po.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 text-gray-900 font-bold">{po.id}</td>
                  <td className="p-4 text-gray-600 whitespace-nowrap">{new Date(po.date).toLocaleDateString('id-ID')}</td>
                  <td className="p-4 text-gray-900 font-medium">{po.location}</td>
                  <td className="p-4 text-gray-600">{po.items.length} Produk</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => handleEdit(po)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(po.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPOs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Tidak ada data Purchase Order ditemukan.
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
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#0B2D72]">{editingPO ? 'Edit Purchase Order' : 'Tambah Purchase Order'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Dokumen</label>
                  <input 
                    name="id" 
                    required 
                    type="text" 
                    defaultValue={editingPO?.id} 
                    disabled={!!editingPO}
                    placeholder="Contoh: PO-202310-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72] disabled:bg-gray-100" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal PO</label>
                  <input name="date" required type="date" defaultValue={editingPO?.date} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Toko</label>
                  <SearchableSelect
                    name="location"
                    required
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    placeholder="Pilih Lokasi"
                    options={locations.map(loc => ({ value: loc, label: loc }))}
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Daftar Produk</h3>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="text-xs flex items-center gap-1 text-[#0B2D72] hover:text-blue-800 font-medium"
                  >
                    <Plus size={14} /> Tambah Produk
                  </button>
                </div>
                
                <div className="space-y-3">
                  {poItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-gray-50 p-3 rounded-xl border border-gray-100 relative">
                      <div className="sm:col-span-7">
                        <label className="block text-xs text-gray-500 mb-1">Produk</label>
                        <SearchableSelect
                          value={item.sku}
                          onChange={(val) => handleItemChange(index, 'sku', val)}
                          placeholder="Pilih Produk"
                          options={items.map(i => ({ value: i.sku, label: `${i.sku} - ${i.name}` }))}
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-xs text-gray-500 mb-1">QTY</label>
                        <input 
                          type="number" 
                          required 
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" 
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end sm:justify-center sm:pt-6">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                          disabled={poItems.length <= 1}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
        isOpen={!!poToDelete}
        title="Hapus Purchase Order"
        message="Apakah Anda yakin ingin menghapus Purchase Order ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={confirmDelete}
        onCancel={() => setPoToDelete(null)}
      />
    </div>
  );
};

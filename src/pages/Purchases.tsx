import { useState, FormEvent, useRef, ChangeEvent } from 'react';
import { useAppContext, Purchase } from '../context/AppContext';
import { Plus, Edit2, Trash2, Upload, Search, Download } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { downloadExcel, uploadExcel } from '../utils/excel';
import { SearchableSelect } from '../components/SearchableSelect';

export const Purchases = () => {
  const { purchases, setPurchases, locations, items, suppliers, showNotification } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');

  const filteredPurchases = purchases.filter(p => 
    p.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (id: string) => {
    setPurchaseToDelete(id);
  };

  const confirmDelete = () => {
    if (purchaseToDelete) {
      setPurchases(purchases.filter(p => p.id !== purchaseToDelete));
      showNotification('warning', 'Data pembelian berhasil dihapus.');
      setPurchaseToDelete(null);
    }
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setSelectedLocation(purchase.location);
    setSelectedSku(purchase.sku);
    setSelectedSupplier(purchase.supplierId);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingPurchase(null);
    setSelectedLocation('');
    setSelectedSku('');
    setSelectedSupplier('');
    setIsModalOpen(true);
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const date = formData.get('date') as string;
    const location = formData.get('location') as string;
    const sku = formData.get('sku') as string;
    const supplierId = formData.get('supplierId') as string;
    const qty = Number(formData.get('qty'));
    const value = Number(formData.get('value'));

    if (!location || !sku || !supplierId) {
      alert('Lokasi, Produk, dan Supplier harus dipilih');
      return;
    }

    const item = items.find(i => i.sku === sku);
    const itemName = item?.name || sku;
    const pricePerQty = qty > 0 ? value / qty : 0;

    const newPurchase: Purchase = {
      id: editingPurchase ? editingPurchase.id : `PUR${Date.now()}`,
      date,
      location,
      sku,
      itemName,
      qty,
      value,
      pricePerQty,
      supplierId
    };

    if (editingPurchase) {
      setPurchases(purchases.map(p => p.id === editingPurchase.id ? newPurchase : p));
      showNotification('success', `Data pembelian berhasil diubah.`);
    } else {
      setPurchases([...purchases, newPurchase]);
      showNotification('success', `Data pembelian berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Tanggal Beli (YYYY-MM-DD)': '2023-10-01',
        'Lokasi Toko': 'Toko Jakarta',
        'Produk SKU': 'ITM001',
        'Supplier ID': 'SUP001',
        'QTY Pembelian': 100,
        'Nilai Pembelian (Total)': 5000000
      }
    ];
    downloadExcel(templateData, 'Template_Data_Pembelian');
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadExcel(file, (data) => {
      const newPurchases: Purchase[] = [];
      
      data.forEach((row: any) => {
        const date = row['Tanggal Beli (YYYY-MM-DD)'];
        const location = row['Lokasi Toko'];
        const sku = row['Produk SKU'];
        const supplierId = row['Supplier ID'];
        const qty = Number(row['QTY Pembelian']);
        const value = Number(row['Nilai Pembelian (Total)']);
        
        if (!date || !location || !sku || !supplierId || !qty || !value) return;

        const item = items.find(i => i.sku === sku);
        const itemName = item?.name || sku;
        const pricePerQty = qty > 0 ? value / qty : 0;

        newPurchases.push({
          id: `PUR${Date.now()}${Math.floor(Math.random() * 1000)}`,
          date: String(date),
          location: String(location),
          sku: String(sku),
          itemName,
          qty,
          value,
          pricePerQty,
          supplierId: String(supplierId)
        });
      });

      if (newPurchases.length > 0) {
        setPurchases([...purchases, ...newPurchases]);
        showNotification('success', `${newPurchases.length} data pembelian berhasil ditambahkan.`);
      } else {
        showNotification('warning', 'Tidak ada data pembelian yang valid ditemukan.');
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  const getSupplierName = (id: string) => {
    return suppliers.find(s => s.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#0B2D72]">Data Pembelian</h1>
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
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari SKU, Nama Barang, atau Lokasi..." 
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
                <th className="p-4 font-semibold">Tanggal Beli</th>
                <th className="p-4 font-semibold">Lokasi Toko</th>
                <th className="p-4 font-semibold">Barang</th>
                <th className="p-4 font-semibold text-right">QTY</th>
                <th className="p-4 font-semibold text-right">Harga / QTY</th>
                <th className="p-4 font-semibold text-right">Nilai Pembelian</th>
                <th className="p-4 font-semibold">Supplier</th>
                <th className="p-4 font-semibold text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 text-gray-600 whitespace-nowrap">{new Date(purchase.date).toLocaleDateString('id-ID')}</td>
                  <td className="p-4 text-gray-900 font-medium">{purchase.location}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{purchase.itemName}</span>
                      <span className="text-xs text-gray-500 font-mono">{purchase.sku}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-gray-900 font-medium">{purchase.qty.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right text-gray-600">Rp {purchase.pricePerQty.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right text-gray-900 font-semibold">Rp {purchase.value.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-gray-600 max-w-[150px] truncate" title={getSupplierName(purchase.supplierId)}>
                    {getSupplierName(purchase.supplierId)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => handleEdit(purchase)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(purchase.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Tidak ada data pembelian ditemukan.
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
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#0B2D72]">{editingPurchase ? 'Edit Data Pembelian' : 'Tambah Data Pembelian'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Beli</label>
                  <input name="date" required type="date" defaultValue={editingPurchase?.date} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
                </div>
                <div>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produk</label>
                  <SearchableSelect
                    name="sku"
                    required
                    value={selectedSku}
                    onChange={setSelectedSku}
                    placeholder="Pilih Produk"
                    options={items.map(item => ({ value: item.sku, label: `${item.sku} - ${item.name}` }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <SearchableSelect
                    name="supplierId"
                    required
                    value={selectedSupplier}
                    onChange={setSelectedSupplier}
                    placeholder="Pilih Supplier"
                    options={suppliers.map(sup => ({ value: sup.id, label: sup.name }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">QTY Pembelian</label>
                  <input name="qty" required type="number" defaultValue={editingPurchase?.qty} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Pembelian (Total)</label>
                  <input name="value" required type="number" defaultValue={editingPurchase?.value} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
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
        isOpen={!!purchaseToDelete}
        title="Hapus Data Pembelian"
        message="Apakah Anda yakin ingin menghapus data pembelian ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={confirmDelete}
        onCancel={() => setPurchaseToDelete(null)}
      />
    </div>
  );
};

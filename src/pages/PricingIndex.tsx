import { useState, FormEvent, useMemo } from 'react';
import { useAppContext, CompetitorPrice } from '../context/AppContext';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { SearchableSelect } from '../components/SearchableSelect';

export const PricingIndex = () => {
  const { competitors, setCompetitors, locations, items, competitorList, showNotification } = useAppContext();
  const [activeTab, setActiveTab] = useState<'data' | 'summary'>('data');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<CompetitorPrice | null>(null);
  const [competitorToDelete, setCompetitorToDelete] = useState<string | null>(null);

  // Summary filters
  const [summaryLocation, setSummaryLocation] = useState('');
  const [summarySku, setSummarySku] = useState('');
  const [summaryGrade, setSummaryGrade] = useState<'retail' | 'reseller' | ''>('');

  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [selectedCompetitorId, setSelectedCompetitorId] = useState('');

  const filteredCompetitors = competitors.filter(c => 
    c.competitorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.productSku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (id: string) => {
    setCompetitorToDelete(id);
  };

  const confirmDelete = () => {
    if (competitorToDelete) {
      setCompetitors(competitors.filter(c => c.id !== competitorToDelete));
      showNotification('warning', 'Data pricing index berhasil dihapus.');
      setCompetitorToDelete(null);
    }
  };

  const handleEdit = (comp: CompetitorPrice) => {
    setEditingCompetitor(comp);
    setSelectedLocation(comp.nearLocation);
    setSelectedSku(comp.productSku);
    setSelectedCompetitorId(comp.competitorId);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCompetitor(null);
    setSelectedLocation('');
    setSelectedSku('');
    setSelectedCompetitorId('');
    setIsModalOpen(true);
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const competitorId = formData.get('competitorId') as string;
    const nearLocation = formData.get('nearLocation') as string;
    const productSku = formData.get('productSku') as string;
    const grade = formData.get('grade') as 'retail' | 'reseller';
    const competitorPrice = Number(formData.get('competitorPrice'));

    if (!nearLocation || !productSku || !competitorId) {
      alert('Lokasi, Kompetitor, dan Produk harus dipilih');
      return;
    }

    const item = items.find(i => i.sku === productSku);
    const ownPrice = item?.prices[nearLocation]?.[grade] || 0;
    const hpp = item?.hpp || 0;
    const pricingIndex = ownPrice > 0 ? competitorPrice / ownPrice : 0;
    
    const competitor = competitorList.find(c => c.id === competitorId);
    if (!competitor) return;

    const newCompetitor: CompetitorPrice = {
      id: editingCompetitor ? editingCompetitor.id : `COMP${Date.now()}`,
      competitorId,
      competitorName: competitor.name,
      nearLocation,
      productSku,
      grade,
      competitorPrice,
      ownPrice,
      hpp,
      pricingIndex
    };

    if (editingCompetitor) {
      setCompetitors(competitors.map(c => c.id === editingCompetitor.id ? newCompetitor : c));
      showNotification('success', `Data pricing index berhasil diubah.`);
    } else {
      setCompetitors([...competitors, newCompetitor]);
      showNotification('success', `Data pricing index berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const getItemName = (sku: string) => {
    return items.find(i => i.sku === sku)?.name || sku;
  };

  const summaryData = useMemo(() => {
    let filtered = competitors;
    if (summaryLocation) filtered = filtered.filter(c => c.nearLocation === summaryLocation);
    if (summarySku) filtered = filtered.filter(c => c.productSku === summarySku);
    if (summaryGrade) filtered = filtered.filter(c => c.grade === summaryGrade);

    // Group by SKU, Location, Grade
    const grouped = filtered.reduce((acc, curr) => {
      const key = `${curr.productSku}-${curr.nearLocation}-${curr.grade}`;
      if (!acc[key]) {
        acc[key] = {
          sku: curr.productSku,
          location: curr.nearLocation,
          grade: curr.grade,
          ownPrice: curr.ownPrice,
          competitors: []
        };
      }
      acc[key].competitors.push({
        name: curr.competitorName,
        price: curr.competitorPrice,
        index: curr.pricingIndex
      });
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }, [competitors, summaryLocation, summarySku, summaryGrade]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#0B2D72]">Pricing Index</h1>
        {activeTab === 'data' && (
          <button onClick={handleAdd} className="flex items-center space-x-2 px-4 py-2 bg-[#0B2D72] text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm">
            <Plus size={18} />
            <span>Tambah Data</span>
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'data'
              ? 'border-[#0B2D72] text-[#0B2D72]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('data')}
        >
          Data Pricing Index
        </button>
        <button
          className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'summary'
              ? 'border-[#0B2D72] text-[#0B2D72]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('summary')}
        >
          Ringkasan Pricing Index
        </button>
      </div>

      {activeTab === 'data' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari Kompetitor atau Produk..." 
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
                  <th className="p-4 font-semibold">Produk</th>
                  <th className="p-4 font-semibold">Grade</th>
                  <th className="p-4 font-semibold text-right">Harga Kompetitor</th>
                  <th className="p-4 font-semibold text-right">Harga Toko Sendiri</th>
                  <th className="p-4 font-semibold text-right">HPP</th>
                  <th className="p-4 font-semibold text-center">Pricing Index</th>
                  <th className="p-4 font-semibold text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCompetitors.map((comp) => (
                  <tr key={comp.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{comp.competitorName}</td>
                    <td className="p-4 text-gray-600">{comp.nearLocation}</td>
                    <td className="p-4 text-gray-600">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{getItemName(comp.productSku)}</span>
                        <span className="text-xs text-gray-500 font-mono">{comp.productSku}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 capitalize">{comp.grade}</td>
                    <td className="p-4 text-right text-gray-900 font-medium">Rp {comp.competitorPrice.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right text-gray-600">Rp {comp.ownPrice.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right text-gray-600">Rp {comp.hpp?.toLocaleString('id-ID') || 0}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comp.pricingIndex < 1 ? 'bg-red-100 text-red-800' : 
                        comp.pricingIndex > 1 ? 'bg-emerald-100 text-emerald-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(comp.pricingIndex * 100).toFixed(2)}%
                      </span>
                    </td>
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
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      Tidak ada data pricing index ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-4 text-gray-700 font-medium">
              <Filter size={18} />
              <span>Filter Ringkasan</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Lokasi Toko</label>
                <SearchableSelect
                  value={summaryLocation}
                  onChange={setSummaryLocation}
                  placeholder="Semua Lokasi"
                  options={[{ value: '', label: 'Semua Lokasi' }, ...locations.map(loc => ({ value: loc, label: loc }))]}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Produk</label>
                <SearchableSelect
                  value={summarySku}
                  onChange={setSummarySku}
                  placeholder="Semua Produk"
                  options={[{ value: '', label: 'Semua Produk' }, ...items.map(item => ({ value: item.sku, label: `${item.sku} - ${item.name}` }))]}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Grade</label>
                <select 
                  value={summaryGrade}
                  onChange={(e) => setSummaryGrade(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]"
                >
                  <option value="">Semua Grade</option>
                  <option value="retail">Retail</option>
                  <option value="reseller">Reseller</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Produk</th>
                  <th className="p-4 font-semibold">Lokasi</th>
                  <th className="p-4 font-semibold">Grade</th>
                  <th className="p-4 font-semibold text-right">Harga Sendiri</th>
                  <th className="p-4 font-semibold">Kompetitor & Pricing Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summaryData.map((group, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{getItemName(group.sku)}</span>
                        <span className="text-xs text-gray-500 font-mono">{group.sku}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{group.location}</td>
                    <td className="p-4 text-gray-600 capitalize">{group.grade}</td>
                    <td className="p-4 text-right font-medium text-gray-900">Rp {group.ownPrice.toLocaleString('id-ID')}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        {group.competitors.map((comp: any, cIdx: number) => (
                          <div key={cIdx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded border border-gray-100">
                            <span className="font-medium text-gray-700">{comp.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-600">Rp {comp.price.toLocaleString('id-ID')}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                comp.index < 1 ? 'bg-red-100 text-red-800' : 
                                comp.index > 1 ? 'bg-emerald-100 text-emerald-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {(comp.index * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {summaryData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Tidak ada data ringkasan ditemukan dengan filter saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#0B2D72]">{editingCompetitor ? 'Edit Pricing Index' : 'Tambah Pricing Index'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dekat Lokasi Toko</label>
                <SearchableSelect
                  name="nearLocation"
                  required
                  value={selectedLocation}
                  onChange={(val) => {
                    setSelectedLocation(val);
                    setSelectedCompetitorId(''); // Reset competitor when location changes
                  }}
                  placeholder="Pilih Lokasi"
                  options={locations.map(loc => ({ value: loc, label: loc }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kompetitor</label>
                <SearchableSelect
                  name="competitorId"
                  required
                  value={selectedCompetitorId}
                  onChange={setSelectedCompetitorId}
                  placeholder="Pilih Kompetitor"
                  options={competitorList.filter(c => c.nearLocation === selectedLocation).map(c => ({ value: c.id, label: c.name }))}
                />
                {!selectedLocation && <p className="text-xs text-gray-500 mt-1">Pilih lokasi toko terlebih dahulu</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produk</label>
                <SearchableSelect
                  name="productSku"
                  required
                  value={selectedSku}
                  onChange={setSelectedSku}
                  placeholder="Pilih Produk"
                  options={items.map(item => ({ value: item.sku, label: `${item.sku} - ${item.name}` }))}
                />
                {selectedSku && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    HPP: Rp {items.find(i => i.sku === selectedSku)?.hpp?.toLocaleString('id-ID') || 0}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Harga</label>
                  <select name="grade" required defaultValue={editingCompetitor?.grade} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]">
                    <option value="retail">Retail</option>
                    <option value="reseller">Reseller</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Kompetitor</label>
                  <input name="competitorPrice" required type="number" defaultValue={editingCompetitor?.competitorPrice} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72]" />
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
        isOpen={!!competitorToDelete}
        title="Hapus Pricing Index"
        message="Apakah Anda yakin ingin menghapus data pricing index ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={confirmDelete}
        onCancel={() => setCompetitorToDelete(null)}
      />
    </div>
  );
};

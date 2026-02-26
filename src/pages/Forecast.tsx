import { useState, useRef, ChangeEvent, useMemo } from 'react';
import { useAppContext, SalesData } from '../context/AppContext';
import { Upload, Download, Search, Filter, TrendingUp, Calendar, Info, Trash2 } from 'lucide-react';
import { downloadExcel, uploadExcel } from '../utils/excel';
import { SearchableSelect } from '../components/SearchableSelect';

export const Forecast = () => {
  const { salesData, setSalesData, locations, items, showNotification } = useAppContext();
  const [activeTab, setActiveTab] = useState<'data' | 'summary'>('data');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filterLocation, setFilterLocation] = useState('');
  const [filterSku, setFilterSku] = useState('');

  // Summary filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summaryLocation, setSummaryLocation] = useState('');
  const [summaryCategory, setSummaryCategory] = useState('');

  const categories = useMemo(() => {
    const cats = new Set(items.map(item => item.category));
    return Array.from(cats);
  }, [items]);

  const lastUpdatedDate = useMemo(() => {
    if (salesData.length === 0) return null;
    const dates = salesData.map(s => new Date(s.date).getTime());
    const maxDate = new Date(Math.max(...dates));
    return maxDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [salesData]);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Tanggal Penjualan (YYYY-MM-DD)': '2023-10-01',
        'Lokasi Toko': 'Toko Jakarta',
        'Produk SKU': 'ITM001',
        'QTY Terjual': 15
      }
    ];
    downloadExcel(templateData, 'Template_Data_Penjualan');
  };

  const handleClearData = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua data penjualan? Data yang dihapus tidak dapat dikembalikan.')) {
      setSalesData([]);
      showNotification('success', 'Semua data penjualan berhasil dihapus.');
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadExcel(file, (data) => {
      const newSalesData: SalesData[] = [];
      
      data.forEach((row: any) => {
        const date = row['Tanggal Penjualan (YYYY-MM-DD)'];
        const location = row['Lokasi Toko'];
        const sku = row['Produk SKU'];
        const qty = Number(row['QTY Terjual']);
        
        if (!date || !location || !sku || !qty) return;

        newSalesData.push({
          date: String(date),
          location: String(location),
          sku: String(sku),
          qty
        });
      });

      if (newSalesData.length > 0) {
        setSalesData([...salesData, ...newSalesData]);
        showNotification('success', `${newSalesData.length} data penjualan berhasil ditambahkan.`);
      } else {
        showNotification('warning', 'Tidak ada data penjualan yang valid ditemukan.');
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  const getItemName = (sku: string) => {
    return items.find(i => i.sku === sku)?.name || sku;
  };

  const forecastData = useMemo(() => {
    let filtered = salesData;
    if (filterLocation) filtered = filtered.filter(s => s.location === filterLocation);
    if (filterSku) filtered = filtered.filter(s => s.sku === filterSku);

    // Group by SKU and Location
    const grouped = filtered.reduce((acc, curr) => {
      const key = `${curr.sku}-${curr.location}`;
      if (!acc[key]) {
        acc[key] = {
          sku: curr.sku,
          location: curr.location,
          totalQty: 0,
          dates: new Set<string>()
        };
      }
      acc[key].totalQty += curr.qty;
      acc[key].dates.add(curr.date);
      return acc;
    }, {} as Record<string, { sku: string; location: string; totalQty: number; dates: Set<string> }>);

    return Object.values(grouped).map((group: any) => {
      const daysWithSales = group.dates.size;
      const averagePerDay = daysWithSales > 0 ? group.totalQty / daysWithSales : 0;
      const forecast30Days = Math.ceil(averagePerDay * 30);

      return {
        sku: group.sku,
        location: group.location,
        totalQty: group.totalQty,
        daysWithSales,
        averagePerDay,
        forecast30Days
      };
    }).filter(item => 
      getItemName(item.sku).toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.forecast30Days - a.forecast30Days);

  }, [salesData, filterLocation, filterSku, searchTerm, items]);

  const summaryData = useMemo(() => {
    let filtered = salesData;
    
    if (startDate) {
      filtered = filtered.filter(s => s.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(s => s.date <= endDate);
    }
    if (summaryLocation) {
      filtered = filtered.filter(s => s.location === summaryLocation);
    }

    // Group by SKU only
    const grouped = filtered.reduce((acc, curr) => {
      const key = curr.sku;
      if (!acc[key]) {
        acc[key] = {
          sku: curr.sku,
          totalQty: 0,
          dates: new Set<string>()
        };
      }
      acc[key].totalQty += curr.qty;
      acc[key].dates.add(curr.date);
      return acc;
    }, {} as Record<string, { sku: string; totalQty: number; dates: Set<string> }>);

    return Object.values(grouped).map((group: any) => {
      const daysWithSales = group.dates.size;
      const averagePerDay = daysWithSales > 0 ? group.totalQty / daysWithSales : 0;
      const forecast30Days = Math.ceil(averagePerDay * 30);
      const item = items.find(i => i.sku === group.sku);

      return {
        sku: group.sku,
        category: item?.category || '-',
        totalQty: group.totalQty,
        daysWithSales,
        averagePerDay,
        forecast30Days
      };
    }).filter(item => {
      const matchesSearch = getItemName(item.sku).toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = summaryCategory ? item.category === summaryCategory : true;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => b.forecast30Days - a.forecast30Days);

  }, [salesData, startDate, endDate, summaryLocation, summaryCategory, searchTerm, items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#0B2D72]">Forecast Kebutuhan</h1>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleDownloadTemplate} className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={18} />
            <span>Download Template</span>
          </button>
          <button onClick={handleClearData} className="flex items-center space-x-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm">
            <Trash2 size={18} />
            <span>Hapus Semua Data</span>
          </button>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-4 py-2 bg-[#0B2D72] text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm">
            <Upload size={18} />
            <span>Upload Data Penjualan</span>
          </button>
        </div>
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
          Data Forecast
        </button>
        <button
          className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'summary'
              ? 'border-[#0B2D72] text-[#0B2D72]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('summary')}
        >
          Ringkasan Forecast
        </button>
      </div>

      {activeTab === 'data' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Filter size={18} />
              <span>Filter Analisa</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Lokasi Toko</label>
                <SearchableSelect
                  value={filterLocation}
                  onChange={setFilterLocation}
                  placeholder="Semua Lokasi"
                  options={[{ value: '', label: 'Semua Lokasi' }, ...locations.map(loc => ({ value: loc, label: loc }))]}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Produk</label>
                <SearchableSelect
                  value={filterSku}
                  onChange={setFilterSku}
                  placeholder="Semua Produk"
                  options={[{ value: '', label: 'Semua Produk' }, ...items.map(item => ({ value: item.sku, label: `${item.sku} - ${item.name}` }))]}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cari Produk</label>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari SKU atau Nama..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72] transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Produk</th>
                  <th className="p-4 font-semibold">Lokasi Toko</th>
                  <th className="p-4 font-semibold text-right">Total Terjual</th>
                  <th className="p-4 font-semibold text-right">Hari Penjualan</th>
                  <th className="p-4 font-semibold text-right">Rata-rata / Hari</th>
                  <th className="p-4 font-semibold text-right bg-blue-50/50 text-[#0B2D72]">Forecast (30 Hari)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {forecastData.map((data, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{getItemName(data.sku)}</span>
                        <span className="text-xs text-gray-500 font-mono">{data.sku}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{data.location}</td>
                    <td className="p-4 text-right text-gray-600">{data.totalQty.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right text-gray-600">{data.daysWithSales} hari</td>
                    <td className="p-4 text-right text-gray-600">{data.averagePerDay.toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-[#0B2D72] bg-blue-50/30">
                      <div className="flex items-center justify-end gap-2">
                        <TrendingUp size={16} className="text-blue-500" />
                        {data.forecast30Days.toLocaleString('id-ID')}
                      </div>
                    </td>
                  </tr>
                ))}
                {forecastData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Tidak ada data analisa forecast ditemukan. Silakan upload data penjualan terlebih dahulu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <Filter size={18} />
                <span>Filter Ringkasan</span>
              </div>
              {lastUpdatedDate && (
                <div className="flex items-center gap-1.5 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                  <Calendar size={14} />
                  <span>Data penjualan terakhir diupdate: <strong>{lastUpdatedDate}</strong></span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tanggal Mulai</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72] transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tanggal Akhir</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72] transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
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
                <label className="block text-xs text-gray-500 mb-1">Kategori Barang</label>
                <SearchableSelect
                  value={summaryCategory}
                  onChange={setSummaryCategory}
                  placeholder="Semua Kategori"
                  options={[{ value: '', label: 'Semua Kategori' }, ...categories.map(cat => ({ value: cat, label: cat }))]}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cari Produk</label>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari SKU atau Nama..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B2D72]/20 focus:border-[#0B2D72] transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Produk</th>
                  <th className="p-4 font-semibold">Kategori</th>
                  <th className="p-4 font-semibold text-right">Total Terjual</th>
                  <th className="p-4 font-semibold text-right">Hari Penjualan</th>
                  <th className="p-4 font-semibold text-right">Rata-rata / Hari</th>
                  <th className="p-4 font-semibold text-right bg-blue-50/50 text-[#0B2D72]">Forecast Kebutuhan (30 Hari)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summaryData.map((data, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{getItemName(data.sku)}</span>
                        <span className="text-xs text-gray-500 font-mono">{data.sku}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                        {data.category}
                      </span>
                    </td>
                    <td className="p-4 text-right text-gray-600">{data.totalQty.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right text-gray-600">{data.daysWithSales} hari</td>
                    <td className="p-4 text-right text-gray-600">{data.averagePerDay.toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-[#0B2D72] bg-blue-50/30">
                      <div className="flex items-center justify-end gap-2">
                        <TrendingUp size={16} className="text-blue-500" />
                        {data.forecast30Days.toLocaleString('id-ID')}
                      </div>
                    </td>
                  </tr>
                ))}
                {summaryData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Tidak ada data ringkasan forecast ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Store, TrendingUp, Users } from 'lucide-react';

export const Dashboard = () => {
  const { locations, purchases, suppliers, items, competitors } = useAppContext();

  // Aggregate purchases per location
  const purchasesByLocation = locations.map(loc => {
    const total = purchases
      .filter(p => p.location === loc)
      .reduce((sum, p) => sum + p.value, 0);
    return { name: loc, total };
  });

  // Top suppliers by TOP
  const topSuppliersByTop = [...suppliers]
    .sort((a, b) => b.top - a.top)
    .slice(0, 5)
    .map(s => ({ name: s.name, top: s.top }));

  // Aggregate purchases by category
  const categoryStats: Record<string, { qty: number; value: number }> = {};
  
  purchases.forEach(p => {
    const item = items.find(i => i.sku === p.sku);
    const category = item?.category || 'Uncategorized';
    
    if (!categoryStats[category]) {
      categoryStats[category] = { qty: 0, value: 0 };
    }
    categoryStats[category].qty += p.qty;
    categoryStats[category].value += p.value;
  });

  const categoryChartData = Object.entries(categoryStats).map(([name, stats]) => ({
    name,
    qty: stats.qty,
    value: stats.value
  })).sort((a, b) => b.qty - a.qty);

  const totalPurchases = purchases.reduce((sum, p) => sum + p.value, 0);
  const activeSuppliers = new Set(purchases.map(p => p.supplierId)).size;

  // Pricing Index where own price is higher than competitor (index < 1)
  const higherPricedItems = competitors
    .filter(c => c.pricingIndex < 1)
    .map(c => ({
      name: `${c.competitorName} - ${c.nearLocation}`,
      index: Number((c.pricingIndex * 100).toFixed(2)),
      product: items.find(i => i.sku === c.productSku)?.name || c.productSku
    }))
    .sort((a, b) => a.index - b.index)
    .slice(0, 10); // Top 10 worst pricing indexes

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0B2D72]">Dashboard</h1>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
          Overview & Analytics
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-blue-50 rounded-xl text-[#0B2D72]">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Pembelian</p>
            <p className="text-2xl font-bold text-gray-900">Rp {totalPurchases.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
            <Store size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Lokasi Toko</p>
            <p className="text-2xl font-bold text-gray-900">{locations.length} Lokasi</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-purple-50 rounded-xl text-purple-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Supplier Aktif</p>
            <p className="text-2xl font-bold text-gray-900">{activeSuppliers} Supplier</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase History Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">History Pembelian per Lokasi</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purchasesByLocation} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `Rp ${value / 1000000}M`} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Total']}
                />
                <Bar dataKey="total" fill="#0B2D72" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Suppliers by TOP Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Supplier berdasarkan TOP (Hari)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSuppliersByTop} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} width={100} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} Hari`, 'TOP']}
                />
                <Bar dataKey="top" fill="#3b82f6" radius={[0, 6, 6, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category by QTY Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Kategori Paling Banyak Dibeli (QTY)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toLocaleString('id-ID')}`, 'QTY']}
                />
                <Bar dataKey="qty" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category by Value Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Kategori Paling Banyak Dibeli (Nominal)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `Rp ${value / 1000000}M`} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Nominal']}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pricing Index Chart */}
      {higherPricedItems.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Pricing Index (Harga Toko Lebih Mahal)</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={higherPricedItems} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} width={100} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string, props: any) => [`${value}%`, `Index (${props.payload.product})`]}
                />
                <Bar dataKey="index" fill="#ef4444" radius={[0, 6, 6, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Store Locations List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daftar Lokasi Toko</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {locations.map((loc, idx) => (
            <div key={idx} className="flex items-center space-x-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0B2D72]">
                <Store size={18} />
              </div>
              <span className="font-medium text-gray-700">{loc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

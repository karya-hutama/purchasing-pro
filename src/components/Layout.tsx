import { ReactNode, useState } from 'react';
import { LayoutDashboard, Package, Users, TrendingUp, ShoppingCart, Store, CheckCircle2, AlertTriangle, Building2, Menu, X, LineChart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ currentPath, onNavigate, isOpen, setIsOpen }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'locations', label: 'Daftar Lokasi Toko', icon: Store },
    { id: 'items', label: 'Daftar Barang', icon: Package },
    { id: 'suppliers', label: 'Daftar Supplier', icon: Users },
    { id: 'competitors', label: 'Daftar Kompetitor', icon: Building2 },
    { id: 'pricing', label: 'Pricing Index', icon: TrendingUp },
    { id: 'purchases', label: 'Data Pembelian', icon: ShoppingCart },
    { id: 'forecast', label: 'Forecast', icon: LineChart },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0B2D72] text-white min-h-screen flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wider">PURCHASING<br/><span className="text-blue-300">PRO</span></h1>
          <button className="lg:hidden text-white hover:text-blue-200" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-[#0B2D72] shadow-md font-semibold' 
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#0B2D72]' : 'text-blue-200'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 text-xs text-blue-300 text-center border-t border-white/10 mt-auto">
          &copy; 2026 Ubaidillah Dev
        </div>
      </div>
    </>
  );
};

export const Layout = ({ children, currentPath, onNavigate }: { children: ReactNode, currentPath: string, onNavigate: (path: string) => void }) => {
  const { notification } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans relative overflow-hidden">
      {/* Global Notification Toast */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-[60] flex items-center space-x-3 px-6 py-4 rounded-xl shadow-lg border transform transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={24} className="text-emerald-500" /> : <AlertTriangle size={24} className="text-amber-500" />}
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      <Sidebar currentPath={currentPath} onNavigate={onNavigate} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-30">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-[#0B2D72]">PURCHASING<span className="text-blue-400">PRO</span></h1>
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

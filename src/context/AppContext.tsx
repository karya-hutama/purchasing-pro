import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { fetchFromGoogleSheets, syncToGoogleSheets } from '../services/api';

export type StoreLocation = string;

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  top: number; // Term of Payment in days
}

export interface ItemPrice {
  retail: number;
  reseller: number;
}

export interface Item {
  sku: string;
  name: string;
  category: string;
  hpp: number;
  prices: Record<StoreLocation, ItemPrice>;
  suppliers: string[]; // Supplier IDs
}

export interface Purchase {
  id: string;
  date: string;
  location: StoreLocation;
  sku: string;
  itemName: string;
  qty: number;
  value: number;
  pricePerQty: number;
  supplierId: string;
  poId?: string;
  poQty?: number;
}

export interface PurchaseOrderItem {
  sku: string;
  qty: number;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  location: StoreLocation;
  items: PurchaseOrderItem[];
}

export interface Competitor {
  id: string;
  name: string;
  nearLocation: StoreLocation;
}

export interface CompetitorPrice {
  id: string;
  competitorId: string;
  competitorName: string;
  nearLocation: StoreLocation;
  productSku: string;
  grade: 'retail' | 'reseller';
  competitorPrice: number;
  ownPrice: number;
  hpp: number;
  pricingIndex: number;
}

export interface SalesData {
  date: string;
  location: StoreLocation;
  sku: string;
  qty: number;
}

interface AppContextType {
  locations: StoreLocation[];
  suppliers: Supplier[];
  items: Item[];
  purchases: Purchase[];
  purchaseOrders: PurchaseOrder[];
  competitors: CompetitorPrice[];
  competitorList: Competitor[];
  salesData: SalesData[];
  notification: { show: boolean; type: 'success' | 'warning'; message: string };
  dbStatus: 'idle' | 'connecting' | 'connected' | 'error';
  dbMessage: string;
  setLocations: (locations: StoreLocation[]) => void;
  setSuppliers: (suppliers: Supplier[]) => void;
  setItems: (items: Item[]) => void;
  setPurchases: (purchases: Purchase[]) => void;
  setPurchaseOrders: (orders: PurchaseOrder[]) => void;
  setCompetitors: (competitors: CompetitorPrice[]) => void;
  setCompetitorList: (competitors: Competitor[]) => void;
  setSalesData: (salesData: SalesData[]) => void;
  showNotification: (type: 'success' | 'warning', message: string) => void;
}

const defaultLocations: StoreLocation[] = [];

const defaultSuppliers: Supplier[] = [];

const defaultItems: Item[] = [];

const defaultPurchases: Purchase[] = [];

const defaultPurchaseOrders: PurchaseOrder[] = [];

const defaultCompetitorList: Competitor[] = [];

const defaultCompetitors: CompetitorPrice[] = [];

const defaultSalesData: SalesData[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const parseSafeNumber = (val: any) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = String(val).trim();
  if (!str) return 0;
  
  // Handle Indonesian format: 1.000.000,50 -> 1000000.50
  // If it has both . and , assume . is thousand and , is decimal
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // If it only has , it might be decimal (Indonesian) or thousand (US)
    // We assume decimal if it looks like a decimal
    if (str.split(',')[1]?.length <= 2) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(',', '');
    }
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [locations, setLocationsState] = useState<StoreLocation[]>(defaultLocations);
  const [suppliers, setSuppliersState] = useState<Supplier[]>(defaultSuppliers);
  const [items, setItemsState] = useState<Item[]>(defaultItems);
  const [purchases, setPurchasesState] = useState<Purchase[]>(defaultPurchases);
  const [purchaseOrders, setPurchaseOrdersState] = useState<PurchaseOrder[]>(defaultPurchaseOrders);
  const [competitors, setCompetitorsState] = useState<CompetitorPrice[]>(defaultCompetitors);
  const [competitorList, setCompetitorListState] = useState<Competitor[]>(defaultCompetitorList);
  const [salesData, setSalesDataState] = useState<SalesData[]>(defaultSalesData);
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'warning'; message: string }>({ show: false, type: 'success', message: '' });
  const [dbStatus, setDbStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [dbMessage, setDbMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setDbStatus('connecting');
      setDbMessage('Menghubungkan ke database...');
      try {
        const data = await fetchFromGoogleSheets();
        if (data && !data.error) {
          setDbStatus('connected');
          setDbMessage('Database berhasil terhubung!');
          setTimeout(() => setDbStatus('idle'), 3000);

          if (data.locations && data.locations.length > 0) {
            setLocationsState(data.locations.map((l: any) => String(l.Name || '').trim()).filter(Boolean));
          }
          if (data.suppliers && data.suppliers.length > 0) {
            setSuppliersState(data.suppliers.map((s: any) => ({
              ...s,
              id: String(s.id || '').trim(),
              name: String(s.name || '').trim(),
              top: parseSafeNumber(s.top)
            })));
          }
          if (data.items && data.items.length > 0) {
            setItemsState(data.items.map((item: any) => ({
              ...item,
              sku: String(item.sku || '').trim(),
              name: String(item.name || '').trim(),
              hpp: parseSafeNumber(item.hpp),
              prices: typeof item.prices === 'string' ? JSON.parse(item.prices) : item.prices,
              suppliers: typeof item.suppliers === 'string' ? JSON.parse(item.suppliers) : item.suppliers,
            })));
          }
          if (data.purchases && data.purchases.length > 0) {
            setPurchasesState(data.purchases.map((p: any) => ({
              ...p,
              id: String(p.id || '').trim(),
              location: String(p.location || '').trim(),
              sku: String(p.sku || '').trim(),
              qty: parseSafeNumber(p.qty),
              value: parseSafeNumber(p.value),
              pricePerQty: parseSafeNumber(p.pricePerQty),
              poQty: p.poQty ? parseSafeNumber(p.poQty) : undefined
            })));
          }
          if (data.purchaseOrders && data.purchaseOrders.length > 0) {
            setPurchaseOrdersState(data.purchaseOrders.map((po: any) => ({
              ...po,
              id: String(po.id || '').trim(),
              items: typeof po.items === 'string' ? JSON.parse(po.items) : po.items
            })));
          }
          if (data.competitors && data.competitors.length > 0) {
            setCompetitorsState(data.competitors.map((c: any) => ({
              ...c,
              competitorPrice: parseSafeNumber(c.competitorPrice),
              ownPrice: parseSafeNumber(c.ownPrice),
              hpp: parseSafeNumber(c.hpp),
              pricingIndex: parseSafeNumber(c.pricingIndex)
            })));
          }
          if (data.competitorList && data.competitorList.length > 0) {
            setCompetitorListState(data.competitorList);
          }
          if (data.salesData && data.salesData.length > 0) {
            setSalesDataState(data.salesData.map((s: any) => ({
              ...s,
              qty: parseSafeNumber(s.qty)
            })));
          }
        } else if (data && data.error) {
          setDbStatus('error');
          setDbMessage(data.error);
        }
      } catch (error) {
        setDbStatus('error');
        setDbMessage('Gagal terhubung ke database.');
        console.error("Failed to load from Google Sheets, using default data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const setLocations = (newLocations: StoreLocation[]) => {
    setLocationsState(newLocations);
    syncToGoogleSheets('syncLocations', newLocations.map(name => ({ Name: name })));
  };

  const setSuppliers = (newSuppliers: Supplier[]) => {
    setSuppliersState(newSuppliers);
    syncToGoogleSheets('syncSuppliers', newSuppliers);
  };

  const setItems = (newItems: Item[]) => {
    setItemsState(newItems);
    syncToGoogleSheets('syncItems', newItems);
  };

  const setPurchases = (newPurchases: Purchase[]) => {
    setPurchasesState(newPurchases);
    syncToGoogleSheets('syncPurchases', newPurchases);
  };

  const setPurchaseOrders = (newOrders: PurchaseOrder[]) => {
    setPurchaseOrdersState(newOrders);
    syncToGoogleSheets('syncPurchaseOrders', newOrders);
  };

  const setCompetitors = (newCompetitors: CompetitorPrice[]) => {
    setCompetitorsState(newCompetitors);
    syncToGoogleSheets('syncCompetitors', newCompetitors);
  };

  const setCompetitorList = (newList: Competitor[]) => {
    setCompetitorListState(newList);
    syncToGoogleSheets('syncCompetitorList', newList);
  };

  const setSalesData = (newData: SalesData[]) => {
    setSalesDataState(newData);
    syncToGoogleSheets('syncSalesData', newData);
  };

  const showNotification = (type: 'success' | 'warning', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: 'success', message: '' });
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#0B2D72] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ locations, suppliers, items, purchases, purchaseOrders, competitors, competitorList, salesData, notification, dbStatus, dbMessage, setLocations, setSuppliers, setItems, setPurchases, setPurchaseOrders, setCompetitors, setCompetitorList, setSalesData, showNotification }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

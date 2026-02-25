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
  competitors: CompetitorPrice[];
  competitorList: Competitor[];
  salesData: SalesData[];
  notification: { show: boolean; type: 'success' | 'warning'; message: string };
  setLocations: (locations: StoreLocation[]) => void;
  setSuppliers: (suppliers: Supplier[]) => void;
  setItems: (items: Item[]) => void;
  setPurchases: (purchases: Purchase[]) => void;
  setCompetitors: (competitors: CompetitorPrice[]) => void;
  setCompetitorList: (competitors: Competitor[]) => void;
  setSalesData: (salesData: SalesData[]) => void;
  showNotification: (type: 'success' | 'warning', message: string) => void;
}

const defaultLocations = ['Toko Jakarta', 'Toko Bandung', 'Toko Surabaya'];

const defaultSuppliers: Supplier[] = [
  { id: 'SUP001', name: 'PT Sumber Makmur', phone: '08123456789', address: 'Jl. Raya No 1', top: 30 },
  { id: 'SUP002', name: 'CV Maju Jaya', phone: '08987654321', address: 'Jl. Industri No 2', top: 45 },
  { id: 'SUP003', name: 'UD Bintang Terang', phone: '08567890123', address: 'Jl. Niaga No 3', top: 60 },
];

const defaultItems: Item[] = [
  {
    sku: 'ITM001',
    name: 'Beras Premium 5kg',
    category: 'Sembako',
    hpp: 50000,
    prices: {
      'Toko Jakarta': { retail: 60000, reseller: 55000 },
      'Toko Bandung': { retail: 58000, reseller: 54000 },
      'Toko Surabaya': { retail: 59000, reseller: 54500 },
    },
    suppliers: ['SUP001', 'SUP002'],
  },
  {
    sku: 'ITM002',
    name: 'Minyak Goreng 2L',
    category: 'Sembako',
    hpp: 28000,
    prices: {
      'Toko Jakarta': { retail: 35000, reseller: 32000 },
      'Toko Bandung': { retail: 34000, reseller: 31000 },
      'Toko Surabaya': { retail: 34500, reseller: 31500 },
    },
    suppliers: ['SUP002', 'SUP003'],
  },
];

const defaultPurchases: Purchase[] = [
  { id: 'PUR001', date: '2023-10-01', location: 'Toko Jakarta', sku: 'ITM001', itemName: 'Beras Premium 5kg', qty: 100, value: 5000000, pricePerQty: 50000, supplierId: 'SUP001' },
  { id: 'PUR002', date: '2023-10-05', location: 'Toko Bandung', sku: 'ITM002', itemName: 'Minyak Goreng 2L', qty: 200, value: 5600000, pricePerQty: 28000, supplierId: 'SUP002' },
  { id: 'PUR003', date: '2023-10-10', location: 'Toko Surabaya', sku: 'ITM001', itemName: 'Beras Premium 5kg', qty: 150, value: 7500000, pricePerQty: 50000, supplierId: 'SUP001' },
  { id: 'PUR004', date: '2023-10-15', location: 'Toko Jakarta', sku: 'ITM002', itemName: 'Minyak Goreng 2L', qty: 300, value: 8400000, pricePerQty: 28000, supplierId: 'SUP003' },
];

const defaultCompetitorList: Competitor[] = [
  { id: 'C001', name: 'Toko Sebelah', nearLocation: 'Toko Jakarta' },
  { id: 'C002', name: 'Toko Maju', nearLocation: 'Toko Bandung' }
];

const defaultCompetitors: CompetitorPrice[] = [
  { id: 'COMP001', competitorId: 'C001', competitorName: 'Toko Sebelah', nearLocation: 'Toko Jakarta', productSku: 'ITM001', grade: 'retail', competitorPrice: 59000, ownPrice: 60000, hpp: 50000, pricingIndex: 59000 / 60000 },
];

const defaultSalesData: SalesData[] = [
  { date: '2023-10-01', location: 'Toko Jakarta', sku: 'ITM001', qty: 10 },
  { date: '2023-10-02', location: 'Toko Jakarta', sku: 'ITM001', qty: 15 },
  { date: '2023-10-03', location: 'Toko Jakarta', sku: 'ITM001', qty: 12 },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [locations, setLocationsState] = useState<StoreLocation[]>(defaultLocations);
  const [suppliers, setSuppliersState] = useState<Supplier[]>(defaultSuppliers);
  const [items, setItemsState] = useState<Item[]>(defaultItems);
  const [purchases, setPurchasesState] = useState<Purchase[]>(defaultPurchases);
  const [competitors, setCompetitorsState] = useState<CompetitorPrice[]>(defaultCompetitors);
  const [competitorList, setCompetitorListState] = useState<Competitor[]>(defaultCompetitorList);
  const [salesData, setSalesDataState] = useState<SalesData[]>(defaultSalesData);
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'warning'; message: string }>({ show: false, type: 'success', message: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchFromGoogleSheets();
        if (data) {
          let hasData = false;
          
          if (data.locations && data.locations.length > 0) {
            setLocationsState(data.locations.map((l: any) => l.Name));
            hasData = true;
          }
          if (data.suppliers && data.suppliers.length > 0) {
            setSuppliersState(data.suppliers.map((s: any) => ({
              ...s,
              top: Number(s.top)
            })));
            hasData = true;
          }
          if (data.items && data.items.length > 0) {
            setItemsState(data.items.map((item: any) => ({
              ...item,
              hpp: Number(item.hpp),
              prices: typeof item.prices === 'string' ? JSON.parse(item.prices) : item.prices,
              suppliers: typeof item.suppliers === 'string' ? JSON.parse(item.suppliers) : item.suppliers,
            })));
            hasData = true;
          }
          if (data.purchases && data.purchases.length > 0) {
            setPurchasesState(data.purchases.map((p: any) => ({
              ...p,
              qty: Number(p.qty),
              value: Number(p.value),
              pricePerQty: Number(p.pricePerQty)
            })));
            hasData = true;
          }
          if (data.competitors && data.competitors.length > 0) {
            setCompetitorsState(data.competitors.map((c: any) => ({
              ...c,
              competitorPrice: Number(c.competitorPrice),
              ownPrice: Number(c.ownPrice),
              hpp: Number(c.hpp),
              pricingIndex: Number(c.pricingIndex)
            })));
            hasData = true;
          }
          if (data.competitorList && data.competitorList.length > 0) {
            setCompetitorListState(data.competitorList);
            hasData = true;
          }
          if (data.salesData && data.salesData.length > 0) {
            setSalesDataState(data.salesData.map((s: any) => ({
              ...s,
              qty: Number(s.qty)
            })));
            hasData = true;
          }

          if (!hasData) {
            // Spreadsheet is empty, sync default data to it
            console.log("Spreadsheet is empty, syncing default data...");
            syncToGoogleSheets('syncLocations', defaultLocations.map(name => ({ Name: name })));
            syncToGoogleSheets('syncSuppliers', defaultSuppliers);
            syncToGoogleSheets('syncItems', defaultItems);
            syncToGoogleSheets('syncPurchases', defaultPurchases);
            syncToGoogleSheets('syncCompetitorList', defaultCompetitorList);
            syncToGoogleSheets('syncCompetitors', defaultCompetitors);
            syncToGoogleSheets('syncSalesData', defaultSalesData);
          }
        }
      } catch (error) {
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
    <AppContext.Provider value={{ locations, suppliers, items, purchases, competitors, competitorList, salesData, notification, setLocations, setSuppliers, setItems, setPurchases, setCompetitors, setCompetitorList, setSalesData, showNotification }}>
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

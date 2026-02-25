/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { DbNotification } from './components/DbNotification';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Locations } from './pages/Locations';
import { Items } from './pages/Items';
import { Suppliers } from './pages/Suppliers';
import { PricingIndex } from './pages/PricingIndex';
import { Purchases } from './pages/Purchases';
import { CompetitorList } from './pages/CompetitorList';
import { Forecast } from './pages/Forecast';

export default function App() {
  const [currentPath, setCurrentPath] = useState('dashboard');

  const renderContent = () => {
    switch (currentPath) {
      case 'dashboard':
        return <Dashboard />;
      case 'locations':
        return <Locations />;
      case 'items':
        return <Items />;
      case 'suppliers':
        return <Suppliers />;
      case 'pricing':
        return <PricingIndex />;
      case 'competitors':
        return <CompetitorList />;
      case 'purchases':
        return <Purchases />;
      case 'forecast':
        return <Forecast />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <DbNotification />
      <Layout currentPath={currentPath} onNavigate={setCurrentPath}>
        {renderContent()}
      </Layout>
    </AppProvider>
  );
}


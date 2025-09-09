import React, { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Productos } from '@/pages/Productos';
import { Entradas } from '@/pages/Entradas';
import { Proveedores } from '@/pages/Proveedores';
import { Reportes } from '@/pages/Reportes';
import { Configuracion } from '@/pages/Configuracion';
import { Salidas } from '@/pages/Salidas';
import { useAppStore } from '@/stores/useAppStore';

function App() {
  const { currentPage, darkMode } = useAppStore();

  // Aplicar tema oscuro al cargar
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'productos':
        return <Productos />;
      case 'entradas':
        return <Entradas />;
      case 'salidas':
        return <Salidas />;
      case 'proveedores':
        return <Proveedores />;
      case 'reportes':
        return <Reportes />;
      case 'configuracion':
        return <Configuracion />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderCurrentPage()}
    </Layout>
  );
}

export default App;
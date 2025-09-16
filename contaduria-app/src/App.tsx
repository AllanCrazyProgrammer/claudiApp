import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Productos } from '@/pages/Productos';
import { Entradas } from '@/pages/Entradas';
import { Proveedores } from '@/pages/Proveedores';
import { Existencias } from '@/pages/Existencias';
import { Salidas } from '@/pages/Salidas';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { Login } from '@/pages/Login';

function App() {
  const { currentPage, darkMode } = useAppStore();
  const { user, loading } = useAuth();

  // Aplicar tema oscuro al cargar
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  if (!user) {
    return <Login />;
  }

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
      case 'existencias':
        return <Existencias />;
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

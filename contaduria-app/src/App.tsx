import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Productos } from '@/pages/Productos';
import { Entradas } from '@/pages/Entradas';
import { Proveedores } from '@/pages/Proveedores';
import { Existencias } from '@/pages/Existencias';
import { Salidas } from '@/pages/Salidas';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { useDarkMode } from '@/hooks/useDarkMode';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Login } from '@/pages/Login';

function App() {
  const { currentPage, darkMode } = useAppStore();
  const { user, loading } = useAuth();
  
  // Usar el hook personalizado para manejar el dark mode de manera segura
  useDarkMode(darkMode);

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
    <ErrorBoundary>
      <Layout>
        {renderCurrentPage()}
      </Layout>
    </ErrorBoundary>
  );
}

export default App;

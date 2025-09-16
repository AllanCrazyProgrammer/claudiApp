import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Package,
  TrendingUp,
  TrendingDown,
  Settings,
  Moon,
  Sun,
  Warehouse
} from 'lucide-react';
import { ConnectionStatus, ConnectionIndicator } from './ConnectionStatus';
// import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'proveedores', label: 'Proveedores', icon: Users },
  { id: 'entradas', label: 'Entradas', icon: TrendingUp },
  { id: 'salidas', label: 'Salidas', icon: TrendingDown },
  { id: 'existencias', label: 'Existencias', icon: Warehouse },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];

export function Layout({ children }: LayoutProps) {
  const { 
    sidebarOpen, 
    toggleSidebar, 
    darkMode, 
    toggleDarkMode, 
    currentPage, 
    setCurrentPage,
    configuracion 
  } = useAppStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-foreground">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-2xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Header del sidebar con gradiente */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-yellow-500 p-6">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center justify-between text-white">
            <h1 className="text-xl font-bold truncate">{configuracion.nombreEmpresa}</h1>
            <button
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors lg:hidden"
              onClick={toggleSidebar}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10 blur-xl"></div>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-yellow-400 text-white shadow-lg transform scale-[1.02]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setCurrentPage(item.id)}
              >
                <div className={`p-2 rounded-lg mr-3 transition-colors ${
                  isActive 
                    ? 'bg-white/20' 
                    : 'bg-gray-200 group-hover:bg-gray-300'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 transition-all duration-300 ease-in-out">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors lg:hidden"
                onClick={toggleSidebar}
              >
                <Menu className="h-5 w-5 text-gray-700" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900 capitalize">
                  {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500">Gestiona tu negocio de manera eficiente</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Indicador de conexión */}
              <ConnectionIndicator />
              
              <button
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                onClick={toggleDarkMode}
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-gray-700" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700" />
                )}
              </button>
              
              {/* Avatar/Profile placeholder */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-yellow-400 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {configuracion.nombreEmpresa.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Componente de estado de conexión */}
      <ConnectionStatus />
    </div>
  );
}

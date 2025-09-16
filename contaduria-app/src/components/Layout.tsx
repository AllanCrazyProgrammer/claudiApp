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
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: Home,
    color: 'text-blue-600',
    gradient: 'from-blue-600 via-purple-600 to-pink-600',
    bgHover: 'hover:bg-blue-50',
    iconBg: 'bg-blue-100 group-hover:bg-blue-200'
  },
  { 
    id: 'productos', 
    label: 'Productos', 
    icon: Package,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-cyan-500',
    bgHover: 'hover:bg-blue-50',
    iconBg: 'bg-blue-100 group-hover:bg-blue-200'
  },
  { 
    id: 'proveedores', 
    label: 'Proveedores', 
    icon: Users,
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-500',
    bgHover: 'hover:bg-emerald-50',
    iconBg: 'bg-emerald-100 group-hover:bg-emerald-200'
  },
  { 
    id: 'entradas', 
    label: 'Entradas', 
    icon: TrendingUp,
    color: 'text-green-600',
    gradient: 'from-green-500 to-emerald-500',
    bgHover: 'hover:bg-green-50',
    iconBg: 'bg-green-100 group-hover:bg-green-200'
  },
  { 
    id: 'salidas', 
    label: 'Salidas', 
    icon: TrendingDown,
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-red-500',
    bgHover: 'hover:bg-orange-50',
    iconBg: 'bg-orange-100 group-hover:bg-orange-200'
  },
  { 
    id: 'existencias', 
    label: 'Existencias', 
    icon: Warehouse,
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-pink-500',
    bgHover: 'hover:bg-purple-50',
    iconBg: 'bg-purple-100 group-hover:bg-purple-200'
  },
];

export function Layout({ children }: LayoutProps) {
  const { 
    sidebarOpen, 
    toggleSidebar, 
    darkMode, 
    toggleDarkMode, 
    currentPage, 
    setCurrentPage,
  } = useAppStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-foreground">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-2xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Header del sidebar con gradiente dinámico */}
        <div className={`relative overflow-hidden bg-gradient-to-r ${menuItems.find(item => item.id === currentPage)?.gradient || 'from-blue-600 to-yellow-500'} p-6 transition-all duration-500`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                {React.createElement(menuItems.find(item => item.id === currentPage)?.icon || Home, {
                  className: "h-4 w-4 text-white"
                })}
              </div>
              <h1 className="text-xl font-bold truncate">ClaudiApp</h1>
            </div>
            <button
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors lg:hidden backdrop-blur-sm"
              onClick={toggleSidebar}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10 blur-xl animate-pulse"></div>
          <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-white/5 blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg transform scale-[1.02] hover:shadow-xl` 
                    : `text-gray-700 ${item.bgHover} hover:text-gray-900 hover:scale-[1.01]`
                }`}
                onClick={() => setCurrentPage(item.id)}
              >
                {/* Efecto de brillo para item activo */}
                {isActive && (
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
                
                <div className={`relative p-2 rounded-lg mr-3 transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20 shadow-sm' 
                    : item.iconBg
                }`}>
                  <Icon className={`h-4 w-4 transition-all duration-300 ${
                    isActive 
                      ? 'text-white' 
                      : item.color
                  }`} />
                </div>
                
                <span className={`font-medium transition-all duration-300 ${
                  isActive 
                    ? 'text-white' 
                    : item.color
                }`}>
                  {item.label}
                </span>
                
                {isActive && (
                  <div className="ml-auto flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div className="w-1 h-4 bg-white/50 rounded-full"></div>
                  </div>
                )}
                
                {!isActive && (
                  <div className={`ml-auto w-1 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-b ${item.gradient}`}></div>
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
              <div className="flex items-center space-x-3">
                {/* Icono de la sección activa */}
                <div className={`p-2 rounded-xl bg-gradient-to-br ${menuItems.find(item => item.id === currentPage)?.gradient || 'from-gray-500 to-slate-500'} shadow-lg`}>
                  {React.createElement(menuItems.find(item => item.id === currentPage)?.icon || Home, {
                    className: "h-5 w-5 text-white"
                  })}
                </div>
                <div>
                  <h2 className={`text-xl font-bold capitalize bg-gradient-to-r ${menuItems.find(item => item.id === currentPage)?.gradient || 'from-gray-500 to-slate-500'} bg-clip-text text-transparent`}>
                    {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
                  </h2>
                  <p className="text-sm text-gray-500">Gestiona tu negocio de manera eficiente</p>
                </div>
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
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${menuItems.find(item => item.id === currentPage)?.gradient || 'from-blue-500 to-yellow-400'} flex items-center justify-center text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                C
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

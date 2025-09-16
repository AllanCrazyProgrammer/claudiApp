import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TipoProducto {
  id: string;
  nombre: string;
  codigo: string;
}

interface AppState {
  // UI State
  sidebarOpen: boolean;
  darkMode: boolean;
  
  // Navigation
  currentPage: string;
  
  // Configuración
  configuracion: {
    nombreEmpresa: string;
    rfc: string;
    direccion: string;
    telefono: string;
    email: string;
  };

  // Tipos de Productos
  tiposProductos: TipoProducto[];

  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  setCurrentPage: (page: string) => void;
  updateConfiguracion: (config: Partial<AppState['configuracion']>) => void;
  
  // Tipos de Productos Actions
  agregarTipoProducto: (nombre: string) => void;
  eliminarTipoProducto: (id: string) => void;
  actualizarTipoProducto: (id: string, nombre: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      sidebarOpen: true,
      darkMode: false,
      currentPage: 'dashboard',
      configuracion: {
        nombreEmpresa: 'ClaudiApp',
        rfc: '',
        direccion: '',
        telefono: '',
        email: ''
      },
      tiposProductos: [
        { id: '1', nombre: 'S/C (Sin Cabeza)', codigo: 'sc' },
        { id: '2', nombre: 'C/C (Con Cabeza)', codigo: 'cc' }
      ],

      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),
      
      setDarkMode: (dark) => {
        set({ darkMode: dark });
        // Aplicar clase dark al documento
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      toggleDarkMode: () => {
        const newDarkMode = !get().darkMode;
        get().setDarkMode(newDarkMode);
      },
      
      setCurrentPage: (page) => set({ currentPage: page }),
      
      updateConfiguracion: (config) => set((state) => ({
        configuracion: { ...state.configuracion, ...config }
      })),

      // Tipos de Productos Actions
      agregarTipoProducto: (nombre) => set((state) => {
        // Generar código automáticamente basado en el nombre
        const codigo = nombre
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
          .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
          .substring(0, 10); // Limitar a 10 caracteres
        
        return {
          tiposProductos: [
            ...state.tiposProductos,
            {
              id: Date.now().toString(),
              nombre,
              codigo
            }
          ]
        };
      }),

      eliminarTipoProducto: (id) => set((state) => ({
        tiposProductos: state.tiposProductos.filter(tipo => tipo.id !== id)
      })),

      actualizarTipoProducto: (id, nombre) => set((state) => {
        // Generar nuevo código basado en el nombre actualizado
        const codigo = nombre
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
          .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
          .substring(0, 10); // Limitar a 10 caracteres
        
        return {
          tiposProductos: state.tiposProductos.map(tipo =>
            tipo.id === id ? { ...tipo, nombre, codigo } : tipo
          )
        };
      })
    }),
    {
      name: 'contaduria-app-storage',
      version: 1,
      migrate: (persistedState: any) => {
        if (persistedState?.configuracion?.nombreEmpresa === 'Mi Empresa') {
          return {
            ...persistedState,
            configuracion: {
              ...persistedState.configuracion,
              nombreEmpresa: 'ClaudiApp'
            }
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        darkMode: state.darkMode,
        configuracion: state.configuracion,
        tiposProductos: state.tiposProductos
      })
    }
  )
);

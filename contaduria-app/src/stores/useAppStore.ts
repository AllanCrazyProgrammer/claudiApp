import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TipoProducto {
  id: string;
  nombre: string;
}

interface AppState {
  // UI State
  sidebarOpen: boolean;
  darkMode: boolean;
  
  // Navigation
  currentPage: string;
  
  // Tipos de Productos
  tiposProductos: TipoProducto[];

  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  setCurrentPage: (page: string) => void;
  
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
      tiposProductos: [],

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
      
      // Tipos de Productos Actions
      agregarTipoProducto: (nombre) => set((state) => ({
        tiposProductos: [
          ...state.tiposProductos,
          {
            id: Date.now().toString(),
            nombre
          }
        ]
      })),

      eliminarTipoProducto: (id) => set((state) => ({
        tiposProductos: state.tiposProductos.filter(tipo => tipo.id !== id)
      })),

      actualizarTipoProducto: (id, nombre) => set((state) => ({
        tiposProductos: state.tiposProductos.map(tipo =>
          tipo.id === id ? { ...tipo, nombre } : tipo
        )
      }))
    }),
    {
      name: 'contaduria-app-storage',
      version: 1,
      migrate: (persistedState: any) => {
        return persistedState;
      },
      partialize: (state) => ({
        darkMode: state.darkMode,
        tiposProductos: state.tiposProductos
      })
    }
  )
);

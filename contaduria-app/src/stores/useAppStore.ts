import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tiposProductosRepo } from '@/lib/repositories/tiposProductosRepo';

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
  cargarTiposProductos: () => Promise<void>;
  agregarTipoProducto: (nombre: string) => Promise<void>;
  eliminarTipoProducto: (id: string) => Promise<void>;
  actualizarTipoProducto: (id: string, nombre: string) => Promise<void>;
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
      cargarTiposProductos: async () => {
        try {
          const tiposData = await tiposProductosRepo.obtenerTiposProductos();
          const tipos = tiposData.map(tipo => ({
            id: tipo.id!,
            nombre: tipo.nombre
          }));
          set({ tiposProductos: tipos });
        } catch (error) {
          console.error('Error al cargar tipos de productos:', error);
          throw error;
        }
      },

      agregarTipoProducto: async (nombre: string) => {
        try {
          const id = await tiposProductosRepo.crearTipoProducto({
            nombre,
            activo: true
          });
          
          set((state) => ({
            tiposProductos: [
              ...state.tiposProductos,
              { id, nombre }
            ]
          }));
        } catch (error) {
          console.error('Error al agregar tipo de producto:', error);
          throw error;
        }
      },

      eliminarTipoProducto: async (id: string) => {
        try {
          await tiposProductosRepo.eliminarTipoProducto(id);
          set((state) => ({
            tiposProductos: state.tiposProductos.filter(tipo => tipo.id !== id)
          }));
        } catch (error) {
          console.error('Error al eliminar tipo de producto:', error);
          throw error;
        }
      },

      actualizarTipoProducto: async (id: string, nombre: string) => {
        try {
          await tiposProductosRepo.actualizarTipoProducto(id, { nombre });
          set((state) => ({
            tiposProductos: state.tiposProductos.map(tipo =>
              tipo.id === id ? { ...tipo, nombre } : tipo
            )
          }));
        } catch (error) {
          console.error('Error al actualizar tipo de producto:', error);
          throw error;
        }
      }
    }),
    {
      name: 'contaduria-app-storage',
      version: 1,
      migrate: (persistedState: any) => {
        return persistedState;
      },
      partialize: (state) => ({
        darkMode: state.darkMode
        // Removemos tiposProductos del persist ya que ahora se cargan desde la DB
      })
    }
  )
);

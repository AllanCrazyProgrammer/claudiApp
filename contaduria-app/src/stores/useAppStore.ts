import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  setCurrentPage: (page: string) => void;
  updateConfiguracion: (config: Partial<AppState['configuracion']>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      sidebarOpen: true,
      darkMode: false,
      currentPage: 'dashboard',
      configuracion: {
        nombreEmpresa: 'Mi Empresa',
        rfc: '',
        direccion: '',
        telefono: '',
        email: ''
      },

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
      }))
    }),
    {
      name: 'contaduria-app-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        configuracion: state.configuracion
      })
    }
  )
);

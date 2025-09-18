import { useEffect } from 'react';

/**
 * Hook personalizado para manejar el dark mode de manera segura
 * Evita errores de manipulación del DOM durante el renderizado
 */
export function useDarkMode(darkMode: boolean) {
  useEffect(() => {
    // Verificar que estamos en el cliente y que el DOM está disponible
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Usar requestAnimationFrame para evitar problemas de timing
    const applyDarkMode = () => {
      try {
        const documentElement = document.documentElement;
        if (!documentElement) {
          console.warn('document.documentElement no está disponible');
          return;
        }

        if (darkMode) {
          documentElement.classList.add('dark');
        } else {
          documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('Error al aplicar dark mode:', error);
      }
    };

    // Aplicar cambios en el próximo frame de animación
    const frameId = requestAnimationFrame(applyDarkMode);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [darkMode]);
}

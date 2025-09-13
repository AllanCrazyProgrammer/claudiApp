import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function ConnectionStatus() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      setIsSyncing(true);
      
      // Simular sincronización
      setTimeout(() => {
        setIsSyncing(false);
      }, 3000);

      // Ocultar mensaje después de 5 segundos
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Mostrar cuando está offline
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-pulse">
        <div className="bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
          <WifiOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Sin conexión a internet
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Trabajando en modo offline - Los datos se sincronizarán cuando vuelva la conexión
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar cuando se reconecta después de estar offline
  if (showReconnected) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
          {isSyncing ? (
            <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400 animate-spin" />
          ) : (
            <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
              {isSyncing ? 'Sincronizando datos...' : 'Conexión restaurada'}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              {isSyncing 
                ? 'Actualizando información con el servidor' 
                : 'Todos los cambios han sido sincronizados'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Componente adicional para mostrar estado en el header (opcional)
export function ConnectionIndicator() {
  const { isOnline } = useOnlineStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900 rounded-full">
        <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
          Offline
        </span>
      </div>
    );
  }

  return null;
}

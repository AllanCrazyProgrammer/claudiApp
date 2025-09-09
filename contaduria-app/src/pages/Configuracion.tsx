import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/useAppStore';

export function Configuracion() {
  const { configuracion, updateConfiguracion } = useAppStore();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateConfiguracion({
      nombreEmpresa: formData.get('nombreEmpresa') as string,
      rfc: formData.get('rfc') as string,
      direccion: formData.get('direccion') as string,
      telefono: formData.get('telefono') as string,
      email: formData.get('email') as string,
    });

    // Mostrar mensaje de éxito (temporal)
    alert('Configuración guardada exitosamente');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Configura la información de tu empresa
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Información de la Empresa</div>
          <div className="card-description">
            Esta información aparecerá en tus facturas y reportes
          </div>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nombreEmpresa" className="block text-sm font-medium mb-2">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                id="nombreEmpresa"
                name="nombreEmpresa"
                defaultValue={configuracion.nombreEmpresa}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="rfc" className="block text-sm font-medium mb-2">
                RFC
              </label>
              <input
                type="text"
                id="rfc"
                name="rfc"
                defaultValue={configuracion.rfc}
                className="input"
                placeholder="XAXX010101000"
              />
            </div>

            <div>
              <label htmlFor="direccion" className="block text-sm font-medium mb-2">
                Dirección
              </label>
              <textarea
                id="direccion"
                name="direccion"
                defaultValue={configuracion.direccion}
                rows={3}
                className="input"
                placeholder="Calle, número, colonia, ciudad, estado, CP"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  defaultValue={configuracion.telefono}
                  className="input"
                  placeholder="(55) 1234-5678"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  defaultValue={configuracion.email}
                  className="input"
                  placeholder="contacto@empresa.com"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn">
                Guardar Configuración
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Información de la Aplicación</div>
          <div className="card-description">
            Detalles técnicos de la aplicación
          </div>
        </div>
        <div className="card-content">
          <div className="space-y-2 text-sm">
            <p><strong>Versión:</strong> 1.0.0</p>
            <p><strong>Base de Datos:</strong> Local (IndexedDB)</p>
            <p><strong>Estado:</strong> Funcionando sin conexión</p>
            <p><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-MX')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

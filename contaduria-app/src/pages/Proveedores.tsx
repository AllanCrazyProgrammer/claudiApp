import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Edit, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import { dbUtils, type Proveedor } from '@/lib/database';

export function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null);

  const [formulario, setFormulario] = useState({
    nombre: ''
  });

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    try {
      const proveedoresData = await dbUtils.obtenerProveedores();
      setProveedores(proveedoresData);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (proveedorEditando) {
        // Actualizar proveedor existente
        await dbUtils.actualizarProveedor(proveedorEditando.id!, {
          nombre: formulario.nombre
        });
      } else {
        // Crear nuevo proveedor
        await dbUtils.crearProveedor({
          nombre: formulario.nombre,
          activo: true
        });
      }
      
      setFormulario({ nombre: '' });
      setMostrarFormulario(false);
      setProveedorEditando(null);
      cargarProveedores();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
    }
  };

  const editarProveedor = (proveedor: Proveedor) => {
    setProveedorEditando(proveedor);
    setFormulario({
      nombre: proveedor.nombre
    });
    setMostrarFormulario(true);
  };

  const cancelarEdicion = () => {
    setFormulario({ nombre: '' });
    setMostrarFormulario(false);
    setProveedorEditando(null);
  };

  const eliminarProveedor = async (proveedor: Proveedor) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el proveedor "${proveedor.nombre}"?`)) {
      try {
        await dbUtils.eliminarProveedor(proveedor.id!);
        cargarProveedores();
      } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        alert('Error al eliminar el proveedor');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="animate-pulse">
          <div className="bg-white rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">
            Gestiona tu directorio de proveedores
          </p>
        </div>
        <Button onClick={() => setMostrarFormulario(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>

      {mostrarFormulario && (
        <Card>
          <CardHeader>
            <CardTitle>
              {proveedorEditando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </CardTitle>
            <CardDescription>
              {proveedorEditando ? 'Modifica el nombre del proveedor' : 'Ingresa el nombre del nuevo proveedor'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nombre del Proveedor *
                </label>
                <input
                  type="text"
                  required
                  value={formulario.nombre}
                  onChange={(e) => setFormulario({ nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Distribuidora ABC S.A."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {proveedorEditando ? 'Actualizar' : 'Crear'} Proveedor
                </Button>
                <Button type="button" variant="outline" onClick={cancelarEdicion}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
          <CardDescription>
            Proveedores registrados en tu sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proveedores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No hay proveedores registrados aún.</p>
              <p className="text-sm mt-2">Haz clic en "Nuevo Proveedor" para agregar tu primer proveedor.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {proveedores.map((proveedor) => (
                <div key={proveedor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{proveedor.nombre}</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editarProveedor(proveedor)}
                        title="Editar proveedor"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => eliminarProveedor(proveedor)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        title="Eliminar proveedor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {proveedor.contacto && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{proveedor.contacto}</span>
                      </div>
                    )}
                    
                    {proveedor.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{proveedor.telefono}</span>
                      </div>
                    )}
                    
                    {proveedor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{proveedor.email}</span>
                      </div>
                    )}
                    
                    {proveedor.direccion && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{proveedor.direccion}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

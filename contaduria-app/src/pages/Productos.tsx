import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, Edit, Trash2 } from 'lucide-react';
import { dbUtils, type Producto } from '@/lib/database';
import { formatCurrency } from '@/lib/utils';

export function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);

  const [formulario, setFormulario] = useState({
    nombre: '',
    tipoCorte: 'sc' as 'sc' | 'cc'
  });

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const productosData = await dbUtils.obtenerProductos();
      setProductos(productosData);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (productoEditando) {
        // Actualizar producto existente
        await dbUtils.actualizarProducto(productoEditando.id!, {
          nombre: formulario.nombre,
          tipoCorte: formulario.tipoCorte
        });
      } else {
        // Crear nuevo producto
        await dbUtils.crearProducto({
          nombre: formulario.nombre,
          unidadMedida: 'kg',
          tipoCorte: formulario.tipoCorte,
          activo: true
        });
      }
      
      setFormulario({ nombre: '', tipoCorte: 'sc' });
      setMostrarFormulario(false);
      setProductoEditando(null);
      cargarProductos();
    } catch (error) {
      console.error('Error al guardar producto:', error);
    }
  };

  const editarProducto = (producto: Producto) => {
    setProductoEditando(producto);
    setFormulario({
      nombre: producto.nombre,
      tipoCorte: producto.tipoCorte || 'sc'
    });
    setMostrarFormulario(true);
  };

  const cancelarEdicion = () => {
    setFormulario({ nombre: '', tipoCorte: 'sc' });
    setMostrarFormulario(false);
    setProductoEditando(null);
  };

  const eliminarProducto = async (producto: Producto) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar el producto "${producto.nombre}"?\n\nEsta acción no se puede deshacer.`
    );
    
    if (confirmacion) {
      try {
        await dbUtils.eliminarProducto(producto.id!);
        cargarProductos();
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('Error al eliminar el producto. Inténtalo de nuevo.');
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
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Gestiona tu catálogo de productos
          </p>
        </div>
        <Button onClick={() => setMostrarFormulario(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {mostrarFormulario && (
        <Card>
          <CardHeader>
            <CardTitle>
              {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
            </CardTitle>
            <CardDescription>
              {productoEditando ? 'Modifica el nombre y tipo del producto' : 'Ingresa el nombre del producto y especifica el tipo'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formulario.nombre}
                    onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Camarón Jumbo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo *
                  </label>
                  <select
                    required
                    value={formulario.tipoCorte}
                    onChange={(e) => setFormulario({ ...formulario, tipoCorte: e.target.value as 'sc' | 'cc' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sc">S/C (Sin Cabeza)</option>
                    <option value="cc">C/C (Con Cabeza)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {productoEditando ? 'Actualizar' : 'Crear'} Producto
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
          <CardTitle>Lista de Productos</CardTitle>
          <CardDescription>
            Productos registrados en tu inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No hay productos registrados aún.</p>
              <p className="text-sm mt-2">Haz clic en "Nuevo Producto" para agregar tu primer producto.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Producto</th>
                    <th className="text-left py-3 px-4">Tipo</th>
                    <th className="text-left py-3 px-4">Existencia</th>
                    <th className="text-left py-3 px-4">Precio Promedio</th>
                    <th className="text-left py-3 px-4">Valor Total</th>
                    <th className="text-left py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{producto.nombre}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          producto.tipoCorte === 'sc' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {producto.tipoCorte === 'sc' ? 'S/C (Sin Cabeza)' : 'C/C (Con Cabeza)'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          producto.existenciaActual < 10 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {producto.existenciaActual}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {formatCurrency(producto.precioPromedio)}
                      </td>
                      <td className="py-3 px-4">
                        {formatCurrency(producto.existenciaActual * producto.precioPromedio)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editarProducto(producto)}
                            title="Editar producto"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => eliminarProducto(producto)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                            title="Eliminar producto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

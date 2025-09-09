import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Calendar, Package } from 'lucide-react';
import { dbUtils, type Entrada, type Producto, type Proveedor } from '@/lib/database';
import { formatCurrency } from '@/lib/utils';

export function Entradas() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState({
    productoId: '',
    proveedorId: '',
    fecha: new Date().toISOString().split('T')[0],
    cantidad: '',
    precio: '',
    numeroFactura: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [entradasData, productosData, proveedoresData] = await Promise.all([
        dbUtils.obtenerEntradas(),
        dbUtils.obtenerProductos(),
        dbUtils.obtenerProveedores()
      ]);
      
      setEntradas(entradasData);
      setProductos(productosData);
      setProveedores(proveedoresData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbUtils.crearEntrada({
        productoId: parseInt(formulario.productoId),
        proveedorId: parseInt(formulario.proveedorId),
        fecha: new Date(formulario.fecha),
        cantidad: parseFloat(formulario.cantidad),
        precio: parseFloat(formulario.precio),
        numeroFactura: formulario.numeroFactura || undefined
      });
      
      setFormulario({
        productoId: '',
        proveedorId: '',
        fecha: new Date().toISOString().split('T')[0],
        cantidad: '',
        precio: '',
        numeroFactura: ''
      });
      setMostrarFormulario(false);
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar entrada:', error);
      alert('Error al registrar la entrada. Verifica los datos.');
    }
  };

  const obtenerNombreProducto = (productoId: number) => {
    const producto = productos.find(p => p.id === productoId);
    return producto?.nombre || 'Producto no encontrado';
  };

  const obtenerNombreProveedor = (proveedorId: number) => {
    const proveedor = proveedores.find(p => p.id === proveedorId);
    return proveedor?.nombre || 'Proveedor no encontrado';
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
          <h1 className="text-3xl font-bold tracking-tight">Entradas de Inventario</h1>
          <p className="text-muted-foreground">
            Registra las compras y entradas de productos
          </p>
        </div>
        <Button onClick={() => setMostrarFormulario(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Entrada
        </Button>
      </div>

      {mostrarFormulario && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Entrada de Inventario</CardTitle>
            <CardDescription>
              Registra una compra o entrada de productos al inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Producto *
                  </label>
                  <select
                    required
                    value={formulario.productoId}
                    onChange={(e) => setFormulario({ ...formulario, productoId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar producto...</option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre} ({producto.unidadMedida})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Proveedor *
                  </label>
                  <select
                    required
                    value={formulario.proveedorId}
                    onChange={(e) => setFormulario({ ...formulario, proveedorId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {proveedores.map((proveedor) => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={formulario.fecha}
                    onChange={(e) => setFormulario({ ...formulario, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formulario.cantidad}
                    onChange={(e) => setFormulario({ ...formulario, cantidad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Precio Unitario *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formulario.precio}
                    onChange={(e) => setFormulario({ ...formulario, precio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Número de Factura
                  </label>
                  <input
                    type="text"
                    value={formulario.numeroFactura}
                    onChange={(e) => setFormulario({ ...formulario, numeroFactura: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: FAC-2024-001"
                  />
                </div>
              </div>

              {formulario.cantidad && formulario.precio && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Total: {formatCurrency(parseFloat(formulario.cantidad) * parseFloat(formulario.precio))}</strong>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit">
                  Registrar Entrada
                </Button>
                <Button type="button" variant="outline" onClick={() => setMostrarFormulario(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historial de Entradas</CardTitle>
          <CardDescription>
            Registro de todas las entradas de inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No hay entradas registradas aún.</p>
              <p className="text-sm mt-2">Haz clic en "Nueva Entrada" para registrar tu primera compra.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Fecha</th>
                    <th className="text-left py-3 px-4">Producto</th>
                    <th className="text-left py-3 px-4">Proveedor</th>
                    <th className="text-left py-3 px-4">Cantidad</th>
                    <th className="text-left py-3 px-4">Precio Unit.</th>
                    <th className="text-left py-3 px-4">Total</th>
                    <th className="text-left py-3 px-4">Factura</th>
                  </tr>
                </thead>
                <tbody>
                  {entradas.map((entrada) => (
                    <tr key={entrada.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(entrada.fecha).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          {obtenerNombreProducto(entrada.productoId)}
                        </div>
                      </td>
                      <td className="py-3 px-4">{obtenerNombreProveedor(entrada.proveedorId)}</td>
                      <td className="py-3 px-4 font-medium">{entrada.cantidad}</td>
                      <td className="py-3 px-4">{formatCurrency(entrada.precio)}</td>
                      <td className="py-3 px-4 font-semibold text-green-600">
                        {formatCurrency(entrada.total)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {entrada.numeroFactura || '-'}
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

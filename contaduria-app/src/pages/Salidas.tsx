import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingDown, Calendar, Package, AlertTriangle } from 'lucide-react';
import { dbUtils, type Salida, type Producto } from '@/lib/database';
import { formatCurrency } from '@/lib/utils';

export function Salidas() {
  const [salidas, setSalidas] = useState<Salida[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState({
    productoId: '',
    fecha: new Date().toISOString().split('T')[0],
    cantidad: '',
    precio: '',
    numeroFactura: '',
    motivo: 'venta'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [salidasData, productosData] = await Promise.all([
        dbUtils.obtenerSalidas(),
        dbUtils.obtenerProductos()
      ]);
      
      setSalidas(salidasData);
      setProductos(productosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbUtils.crearSalida({
        productoId: parseInt(formulario.productoId),
        fecha: new Date(formulario.fecha),
        cantidad: parseFloat(formulario.cantidad),
        precio: parseFloat(formulario.precio),
        numeroFactura: formulario.numeroFactura || undefined,
        motivo: formulario.motivo
      });
      
      setFormulario({
        productoId: '',
        fecha: new Date().toISOString().split('T')[0],
        cantidad: '',
        precio: '',
        numeroFactura: '',
        motivo: 'venta'
      });
      setMostrarFormulario(false);
      cargarDatos();
    } catch (error: any) {
      console.error('Error al guardar salida:', error);
      alert(error.message || 'Error al registrar la salida. Verifica los datos.');
    }
  };

  const obtenerNombreProducto = (productoId: number) => {
    const producto = productos.find(p => p.id === productoId);
    return producto?.nombre || 'Producto no encontrado';
  };


  const productoSeleccionado = productos.find(p => p.id === parseInt(formulario.productoId));
  const cantidadSolicitada = parseFloat(formulario.cantidad) || 0;
  const existenciaInsuficiente = productoSeleccionado && cantidadSolicitada > productoSeleccionado.existenciaActual;

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
          <h1 className="text-3xl font-bold tracking-tight">Salidas de Inventario</h1>
          <p className="text-muted-foreground">
            Registra las ventas y salidas de productos
          </p>
        </div>
        <Button onClick={() => setMostrarFormulario(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Salida
        </Button>
      </div>

      {mostrarFormulario && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Salida de Inventario</CardTitle>
            <CardDescription>
              Registra una venta o salida de productos del inventario
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
                        {producto.nombre} ({producto.unidadMedida}) - Stock: {producto.existenciaActual}
                      </option>
                    ))}
                  </select>
                  {productoSeleccionado && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Existencia actual: {productoSeleccionado.existenciaActual} {productoSeleccionado.unidadMedida}</strong>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Motivo *
                  </label>
                  <select
                    required
                    value={formulario.motivo}
                    onChange={(e) => setFormulario({ ...formulario, motivo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="venta">Venta</option>
                    <option value="merma">Merma</option>
                    <option value="donacion">Donación</option>
                    <option value="uso_interno">Uso Interno</option>
                    <option value="devolucion">Devolución</option>
                    <option value="otro">Otro</option>
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      existenciaInsuficiente 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="0.00"
                  />
                  {existenciaInsuficiente && (
                    <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Cantidad solicitada excede la existencia disponible</span>
                    </div>
                  )}
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
                    placeholder="Ej: VEN-2024-001"
                  />
                </div>
              </div>

              {formulario.cantidad && formulario.precio && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-red-800">
                    <strong>Total: {formatCurrency(parseFloat(formulario.cantidad) * parseFloat(formulario.precio))}</strong>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={existenciaInsuficiente}>
                  Registrar Salida
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
          <CardTitle>Historial de Salidas</CardTitle>
          <CardDescription>
            Registro de todas las salidas de inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salidas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingDown className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No hay salidas registradas aún.</p>
              <p className="text-sm mt-2">Haz clic en "Nueva Salida" para registrar tu primera venta.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Fecha</th>
                    <th className="text-left py-3 px-4">Producto</th>
                    <th className="text-left py-3 px-4">Motivo</th>
                    <th className="text-left py-3 px-4">Cantidad</th>
                    <th className="text-left py-3 px-4">Precio Unit.</th>
                    <th className="text-left py-3 px-4">Total</th>
                    <th className="text-left py-3 px-4">Factura</th>
                  </tr>
                </thead>
                <tbody>
                  {salidas.map((salida) => (
                    <tr key={salida.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(salida.fecha).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          {obtenerNombreProducto(salida.productoId)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {salida.motivo?.replace('_', ' ') || 'venta'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{salida.cantidad}</td>
                      <td className="py-3 px-4">{formatCurrency(salida.precio)}</td>
                      <td className="py-3 px-4 font-semibold text-red-600">
                        -{formatCurrency(salida.total)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {salida.numeroFactura || '-'}
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

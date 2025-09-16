import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, Edit, Trash2, Settings } from 'lucide-react';
import { productosRepo, type ProductoFS } from '@/lib/repositories/productosRepo';
import { lotesRepo, type LoteFS } from '@/lib/repositories/lotesRepo';
import { proveedoresRepo } from '@/lib/repositories/proveedoresRepo';
import { formatCurrency, formatDateShort, formatNumber } from '@/lib/utils';
import { TiposProductosModal } from '@/components/TiposProductosModal';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/contexts/AuthContext';

export function Productos() {
  const { user } = useAuth();
  const { tiposProductos, setCurrentPage } = useAppStore();
  const [productos, setProductos] = useState<(ProductoFS & { id: string })[]>([]);
  const [proveedores, setProveedores] = useState<Array<{ id: string; nombre: string }>>([]);
  const [lotes, setLotes] = useState<Record<string, (LoteFS & { id: string })[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState<(ProductoFS & { id: string }) | null>(null);
  const [modalTiposAbierto, setModalTiposAbierto] = useState(false);
  const [mostrarLotes, setMostrarLotes] = useState<Record<string, boolean>>({});

  const [formulario, setFormulario] = useState({
    nombre: '',
    tipoCorte: tiposProductos.length > 0 ? tiposProductos[0].nombre : '',
    proveedorId: ''
  });

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      if (!user) return;
      const [productosData, proveedoresData] = await Promise.all([
        productosRepo.obtenerProductos(user.uid),
        proveedoresRepo.obtenerProveedores(user.uid)
      ]);
      
      setProductos(productosData);
      setProveedores(proveedoresData.map(p => ({ id: p.id!, nombre: p.nombre })));
      
      // Cargar lotes para cada producto
      const lotesData: Record<string, (LoteFS & { id: string })[]> = {};
      for (const producto of productosData) {
        const lotesProducto = await lotesRepo.obtenerLotesPorProducto(user.uid, producto.id!);
        lotesData[producto.id!] = lotesProducto as any;
      }
      setLotes(lotesData);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formulario.nombre.trim()) {
      alert('El nombre del producto es requerido');
      return;
    }
    
    if (!formulario.tipoCorte && tiposProductos.length > 0) {
      alert('Debe seleccionar un tipo de producto');
      return;
    }
    
    setSubmitting(true);
    try {
      if (productoEditando) {
        // Actualizar producto existente
        console.log('Actualizando producto:', productoEditando.id);
        await productosRepo.actualizarProducto(productoEditando.id!, { 
          nombre: formulario.nombre.trim(), 
          tipoCorte: formulario.tipoCorte,
          proveedorId: formulario.proveedorId || undefined
        });
        alert('Producto actualizado exitosamente');
      } else {
        // Crear nuevo producto
        if (!user) {
          alert('Usuario no autenticado');
          return;
        }
        console.log('Creando producto:', { 
          nombre: formulario.nombre.trim(), 
          tipoCorte: formulario.tipoCorte, 
          ownerUid: user.uid 
        });
        
        const productoId = await productosRepo.crearProducto({ 
          nombre: formulario.nombre.trim(), 
          unidadMedida: 'kg', 
          tipoCorte: formulario.tipoCorte || 'default',
          proveedorId: formulario.proveedorId || undefined,
          activo: true, 
          ownerUid: user.uid 
        });
        console.log('Producto creado con ID:', productoId);
        alert('Producto creado exitosamente');
      }
      
      setFormulario({ 
        nombre: '', 
        tipoCorte: tiposProductos.length > 0 ? tiposProductos[0].nombre : '',
        proveedorId: ''
      });
      setMostrarFormulario(false);
      setProductoEditando(null);
      await cargarProductos(); // Esperar a que se recarguen los datos
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
      alert(error.message || 'Error al guardar el producto. Verifica los datos.');
    } finally {
      setSubmitting(false);
    }
  };

  const editarProducto = (producto: ProductoFS & { id: string }) => {
    setProductoEditando(producto);
    setFormulario({
      nombre: producto.nombre,
      tipoCorte: producto.tipoCorte || (tiposProductos.length > 0 ? tiposProductos[0].nombre : ''),
      proveedorId: producto.proveedorId || ''
    });
    setMostrarFormulario(true);
  };

  const cancelarEdicion = () => {
    setFormulario({ 
      nombre: '', 
      tipoCorte: tiposProductos.length > 0 ? tiposProductos[0].nombre : '',
      proveedorId: ''
    });
    setMostrarFormulario(false);
    setProductoEditando(null);
  };

  const eliminarProducto = async (producto: ProductoFS & { id: string }) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar el producto "${producto.nombre}"?\n\nEsta acción no se puede deshacer.`
    );
    
    if (confirmacion) {
      try {
        await productosRepo.eliminarProducto(producto.id!);
        cargarProductos();
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('Error al eliminar el producto. Inténtalo de nuevo.');
      }
    }
  };

  const toggleLotes = (productoId: string) => {
    setMostrarLotes(prev => ({
      ...prev,
      [productoId]: !prev[productoId]
    }));
  };

  const obtenerNombreProveedor = (proveedorId?: string) => {
    if (!proveedorId) return 'Sin proveedor asignado';
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
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Gestiona tu catálogo de productos
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setModalTiposAbierto(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Tipos de Productos
          </Button>
          <Button onClick={() => setMostrarFormulario(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
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
                    onChange={(e) => setFormulario({ ...formulario, tipoCorte: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {tiposProductos.length === 0 ? (
                      <option value="">No hay tipos configurados</option>
                    ) : (
                      tiposProductos.map((tipo) => (
                        <option key={tipo.id} value={tipo.nombre}>
                          {tipo.nombre}
                        </option>
                      ))
                    )}
                  </select>
                  {tiposProductos.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Configura tipos de productos desde el botón "Tipos de Productos"
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Proveedor Principal
                  </label>
                  <select
                    value={formulario.proveedorId}
                    onChange={(e) => setFormulario({ ...formulario, proveedorId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin proveedor asignado</option>
                    {proveedores.map((proveedor) => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    Opcional: Asigna un proveedor principal para filtrar en entradas/salidas
                    {proveedores.length === 0 && (
                      <span className="block text-amber-600 font-medium mt-1">
                        ⚠️ No hay proveedores registrados. <button 
                          type="button" 
                          onClick={() => setCurrentPage('proveedores')} 
                          className="underline hover:text-amber-700"
                        >
                          Crear uno aquí
                        </button>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : (productoEditando ? 'Actualizar' : 'Crear')} Producto
                </Button>
                <Button type="button" variant="outline" onClick={cancelarEdicion} disabled={submitting}>
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
                    <th className="text-left py-3 px-4">Proveedor</th>
                    <th className="text-left py-3 px-4">Existencia Total</th>
                    <th className="text-left py-3 px-4">Precio Promedio</th>
                    <th className="text-left py-3 px-4">Valor Total</th>
                    <th className="text-left py-3 px-4">Lotes</th>
                    <th className="text-left py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <React.Fragment key={producto.id}>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{producto.nombre}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {producto.tipoCorte}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {obtenerNombreProveedor(producto.proveedorId)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${
                            producto.existenciaActual < 10 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatNumber(producto.existenciaActual, 2)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {formatCurrency(producto.precioPromedio)}
                        </td>
                        <td className="py-3 px-4">
                          {formatCurrency((producto.existenciaActual || 0) * (producto.precioPromedio || 0))}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleLotes(producto.id!)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {mostrarLotes[producto.id!] ? 'Ocultar' : 'Ver'} Lotes ({lotes[producto.id!]?.length || 0})
                          </Button>
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
                      
                      {/* Fila expandida para mostrar lotes */}
                      {mostrarLotes[producto.id!] && lotes[producto.id!] && (
                        <tr>
                          <td colSpan={7} className="px-4 py-2 bg-gray-50">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700 mb-3">
                                Lotes de {producto.nombre} (ordenados por fecha - FIFO):
                              </h4>
                              {lotes[producto.id!].length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No hay lotes disponibles</p>
                              ) : (
                                <div className="grid gap-2">
                                  {lotes[producto.id!].map((lote, index) => (
                                    <div key={lote.id} className="flex items-center justify-between bg-white p-3 rounded border text-sm">
                                      <div className="flex items-center gap-4">
                                        <span className="font-medium text-blue-600">#{index + 1}</span>
                                        <span>Fecha: {formatDateShort((lote.fecha as any).toDate?.() ?? (lote.fecha as any))}</span>
                                        <span>Disponible: <strong>{formatNumber(lote.cantidadDisponible, 2)}</strong></span>
                                        <span>Precio: <strong>{formatCurrency(lote.precioUnitario)}</strong></span>
                                        {lote.numeroFactura && (
                                          <span className="text-gray-600">Factura: {lote.numeroFactura}</span>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <div className="text-green-600 font-medium">
                                          Valor: {formatCurrency(lote.cantidadDisponible * lote.precioUnitario)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para gestionar tipos de productos */}
      <TiposProductosModal
        isOpen={modalTiposAbierto}
        onClose={() => setModalTiposAbierto(false)}
      />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Calendar, Package, Trash2, ChevronDown, ChevronRight, Eye, EyeOff, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { proveedoresRepo, type ProveedorFS } from '@/lib/repositories/proveedoresRepo';
import { productosRepo, type ProductoFS } from '@/lib/repositories/productosRepo';
import { entradasRepo, type EntradaFS } from '@/lib/repositories/entradasRepo';
import { formatCurrency, formatDateShort, createLocalDate, formatNumber, calcularTotal, formatCurrencyPrecise } from '@/lib/utils';

interface EntradaPorDiaFS {
  fecha: string;
  fechaFormateada: string;
  entradas: (EntradaFS & { id: string })[];
  totalEntradas: number;
  valorTotal: number;
}

export function Entradas() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<(ProductoFS & { id: string })[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<(ProductoFS & { id: string })[]>([]);
  const [productosConHistorial, setProductosConHistorial] = useState<(ProductoFS & { id: string })[]>([]);
  const [proveedores, setProveedores] = useState<(ProveedorFS & { id: string })[]>([]);
  const [entradasPorDia, setEntradasPorDia] = useState<EntradaPorDiaFS[]>([]);
  const [diasExpandidos, setDiasExpandidos] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [entradaEditando, setEntradaEditando] = useState<(EntradaFS & { id: string }) | null>(null);

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
      if (!user) return;
      const [entradasData, productosData, proveedoresData] = await Promise.all([
        entradasRepo.obtenerEntradas(),
        productosRepo.obtenerProductos(),
        proveedoresRepo.obtenerProveedores()
      ]);
      
      setProductos(productosData);
      setProveedores(proveedoresData);

      // Agrupar entradas por día
      const entradasAgrupadas = agruparEntradasPorDia(entradasData as (EntradaFS & { id: string })[]);
      setEntradasPorDia(entradasAgrupadas);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const agruparEntradasPorDia = (entradas: (EntradaFS & { id: string })[]): EntradaPorDiaFS[] => {
    const grupos = new Map<string, EntradaPorDiaFS>();

    entradas.forEach(entrada => {
      // Convertir Timestamp a Date
      const fechaDate = (entrada.fecha as any).toDate ? (entrada.fecha as any).toDate() : new Date(entrada.fecha as any);
      const fechaStr = fechaDate.toISOString().split('T')[0];
      const fechaFormateada = formatDateShort(fechaDate);

      if (!grupos.has(fechaStr)) {
        grupos.set(fechaStr, {
          fecha: fechaStr,
          fechaFormateada,
          entradas: [],
          totalEntradas: 0,
          valorTotal: 0
        });
      }

      const grupo = grupos.get(fechaStr)!;
      grupo.entradas.push(entrada);
      grupo.totalEntradas += entrada.cantidad;
      grupo.valorTotal += entrada.total;
    });

    // Convertir a array y ordenar por fecha (más reciente primero)
    return Array.from(grupos.values()).sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (entradaEditando) {
        // Actualizar entrada existente
        await entradasRepo.actualizarEntrada(entradaEditando.id, {
          fecha: createLocalDate(formulario.fecha) as any,
          cantidad: parseFloat(formulario.cantidad),
          precio: parseFloat(formulario.precio),
          numeroFactura: formulario.numeroFactura || undefined
        });
      } else {
        // Crear nueva entrada
        if (!user) return;
        await entradasRepo.crearEntrada({
          productoId: formulario.productoId,
          proveedorId: formulario.proveedorId,
          fecha: createLocalDate(formulario.fecha) as any,
          cantidad: parseFloat(formulario.cantidad),
          precio: parseFloat(formulario.precio),
          numeroFactura: formulario.numeroFactura || undefined
        });
      }
      
      cancelarEdicion();
      cargarDatos();
    } catch (error: any) {
      console.error('Error al guardar entrada:', error);
      alert(error.message || 'Error al registrar la entrada. Verifica los datos.');
    }
  };

  const eliminarEntrada = async (entrada: EntradaFS & { id: string }) => {
    const nombreProducto = obtenerNombreProducto(entrada.productoId);
    const esProductoNoEncontrado = nombreProducto === 'Producto no encontrado';
    
    const mensaje = esProductoNoEncontrado
      ? `¿Estás seguro de que deseas eliminar esta entrada?\n\n` +
        `Producto: ${nombreProducto}\n` +
        `Cantidad: ${entrada.cantidad}\n` +
        `Total: ${formatCurrency(entrada.total)}\n\n` +
        `Nota: El producto asociado ya no existe en el sistema.\n` +
        `Esta acción eliminará la entrada huérfana y no afectará las existencias.`
      : `¿Estás seguro de que deseas eliminar esta entrada?\n\n` +
        `Producto: ${nombreProducto}\n` +
        `Cantidad: ${entrada.cantidad}\n` +
        `Total: ${formatCurrency(entrada.total)}\n\n` +
        `Esta acción no se puede deshacer y recalculará automáticamente las existencias del producto.`;
    
    const confirmacion = window.confirm(mensaje);
    
    if (confirmacion) {
      try {
        await entradasRepo.eliminarEntrada(entrada.id);
        cargarDatos();
        
        if (esProductoNoEncontrado) {
          alert('Entrada huérfana eliminada exitosamente.');
        }
      } catch (error: any) {
        console.error('Error al eliminar entrada:', error);
        alert(error.message || 'Error al eliminar la entrada. Inténtalo de nuevo.');
      }
    }
  };

  const toggleDia = (fecha: string) => {
    setDiasExpandidos(prev => ({
      ...prev,
      [fecha]: !prev[fecha]
    }));
  };

  const editarEntrada = async (entrada: EntradaFS & { id: string }) => {
    setEntradaEditando(entrada);
    const fechaDate = (entrada.fecha as any).toDate ? (entrada.fecha as any).toDate() : new Date(entrada.fecha as any);
    
    // Primero cargar productos para el proveedor seleccionado
    await cargarProductosParaProveedor(entrada.proveedorId);
    
    // Luego establecer todos los datos del formulario
    const datosFormulario = {
      productoId: entrada.productoId,
      proveedorId: entrada.proveedorId,
      fecha: fechaDate.toISOString().split('T')[0],
      cantidad: entrada.cantidad.toString(),
      precio: entrada.precio.toString(),
      numeroFactura: entrada.numeroFactura || ''
    };
    
    console.log('Cargando datos de entrada para edición:', datosFormulario);
    setFormulario(datosFormulario);
    
    setMostrarFormulario(true);
  };

  const cancelarEdicion = () => {
    setEntradaEditando(null);
    setFormulario({
      productoId: '',
      proveedorId: '',
      fecha: new Date().toISOString().split('T')[0],
      cantidad: '',
      precio: '',
      numeroFactura: ''
    });
    setProductosDisponibles([]);
    setProductosConHistorial([]);
    setMostrarFormulario(false);
  };

  const obtenerNombreProducto = (productoId: string) => {
    const producto = productos.find(p => p.id === productoId);
    return producto?.nombre || 'Producto no encontrado';
  };

  const obtenerNombreProveedor = (proveedorId: string) => {
    const proveedor = proveedores.find(p => p.id === proveedorId);
    return proveedor?.nombre || 'Proveedor no encontrado';
  };

  const cargarProductosParaProveedor = async (proveedorId: string) => {
    if (proveedorId) {
      try {
        // Filtrar productos por proveedor seleccionado
        const productosDelProveedor = productos.filter(producto => 
          producto.proveedorId === proveedorId
        );
        
        // Obtener productos con historial de compras de este proveedor
        const entradasDelProveedor = await entradasRepo.obtenerEntradas();
        const productosConHistorialIds = new Set(
          entradasDelProveedor
            .filter(entrada => entrada.proveedorId === proveedorId)
            .map(entrada => entrada.productoId)
        );
        
        const productosConHistorial = productosDelProveedor.filter(producto =>
          productosConHistorialIds.has(producto.id!)
        );
        
        const productosDisponibles = productosDelProveedor.filter(producto =>
          !productosConHistorialIds.has(producto.id!)
        );

        setProductosConHistorial(productosConHistorial);
        setProductosDisponibles([...productosConHistorial, ...productosDisponibles]);
        
        // Si no hay productos específicos del proveedor, mostrar todos como opción
        if (productosDelProveedor.length === 0) {
          setProductosDisponibles(productos);
        }
      } catch (error) {
        console.error('Error al cargar productos del proveedor:', error);
        setProductosConHistorial([]);
        setProductosDisponibles(productos); // Fallback a todos los productos
      }
    } else {
      setProductosDisponibles([]);
      setProductosConHistorial([]);
    }
  };

  const handleProveedorChange = async (proveedorId: string) => {
    setFormulario({ ...formulario, proveedorId, productoId: '' });
    await cargarProductosParaProveedor(proveedorId);
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
            <CardTitle>
              {entradaEditando ? 'Editar Entrada de Inventario' : 'Nueva Entrada de Inventario'}
            </CardTitle>
            <CardDescription>
              {entradaEditando 
                ? 'Modifica fecha, cantidad, precio y número de factura. El proveedor y producto no se pueden cambiar.' 
                : 'Registra una compra o entrada de productos al inventario'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Proveedor *
                  </label>
                  <select
                    required
                    value={formulario.proveedorId}
                    onChange={(e) => handleProveedorChange(e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      entradaEditando ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    disabled={!!entradaEditando}
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
                    Producto *
                  </label>
                  <select
                    required
                    value={formulario.productoId}
                    onChange={(e) => setFormulario({ ...formulario, productoId: e.target.value })}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      (!formulario.proveedorId || entradaEditando) ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    disabled={!formulario.proveedorId || !!entradaEditando}
                  >
                    <option value="">
                      {!formulario.proveedorId 
                        ? "Primero selecciona un proveedor..." 
                        : "Seleccionar producto..."
                      }
                    </option>
                    {productosConHistorial.length > 0 && (
                      <optgroup label="📦 Productos con historial de compras">
                        {productosConHistorial.map((producto) => (
                          <option key={`hist-${producto.id}`} value={producto.id}>
                            {producto.nombre} ({producto.unidadMedida})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {productosDisponibles.filter(p => !productosConHistorial.some(ph => ph.id === p.id)).length > 0 && (
                      <optgroup label="📋 Otros productos disponibles">
                        {productosDisponibles
                          .filter(p => !productosConHistorial.some(ph => ph.id === p.id))
                          .map((producto) => (
                            <option key={`other-${producto.id}`} value={producto.id}>
                              {producto.nombre} ({producto.unidadMedida})
                            </option>
                          ))
                        }
                      </optgroup>
                    )}
                  </select>
                  {formulario.proveedorId && productosDisponibles.length > 0 && (
                    <p className="text-sm text-blue-600 mt-1">
                      {productos.filter(p => p.proveedorId === formulario.proveedorId).length > 0 
                        ? `✓ Mostrando productos asignados a este proveedor`
                        : `ℹ️ Este proveedor no tiene productos asignados. Mostrando todos los productos disponibles.`
                      }
                    </p>
                  )}
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
              </div>

              {formulario.cantidad && formulario.precio && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Total: {formatCurrencyPrecise(calcularTotal(formulario.cantidad, formulario.precio))}</strong>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit">
                  {entradaEditando ? 'Actualizar Entrada' : 'Registrar Entrada'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelarEdicion}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!mostrarFormulario && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Entradas por Día</CardTitle>
            <CardDescription>
              Entradas agrupadas por fecha - haz clic en un día para ver el detalle
            </CardDescription>
          </CardHeader>
        <CardContent>
          {entradasPorDia.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No hay entradas registradas aún.</p>
              <p className="text-sm mt-2">Haz clic en "Nueva Entrada" para registrar tu primera compra.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entradasPorDia.map((dia) => {
                const isExpanded = diasExpandidos[dia.fecha];
                
                return (
                  <div key={dia.fecha} className="border rounded-lg overflow-hidden">
                    {/* Header del día */}
                    <div 
                      className="cursor-pointer hover:bg-gray-50 transition-colors p-4 border-b bg-gray-50"
                      onClick={() => toggleDia(dia.fecha)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <div>
                              <h3 className="font-semibold text-gray-800">{dia.fechaFormateada}</h3>
                              <p className="text-sm text-gray-600">
                                {dia.entradas.length} entrada{dia.entradas.length !== 1 ? 's' : ''} • 
                                Total: {formatCurrency(dia.valorTotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Cantidad Total</div>
                          <div className="text-lg font-bold text-green-600">{formatNumber(dia.totalEntradas, 2)}</div>
                        </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDia(dia.fecha);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {isExpanded ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Detalle
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Detalle de entradas del día */}
                    {isExpanded && (
                      <div className="p-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Producto</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Proveedor</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Cantidad</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Precio Unit.</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Total</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Factura</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dia.entradas.map((entrada) => (
                                <tr key={entrada.id} className="border-b hover:bg-gray-50">
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-2">
                                      <Package className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm">{obtenerNombreProducto(entrada.productoId)}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-sm">{obtenerNombreProveedor(entrada.proveedorId)}</td>
                                  <td className="py-2 px-3 text-sm font-medium">{formatNumber(entrada.cantidad, 2)}</td>
                                  <td className="py-2 px-3 text-sm">{formatCurrency(entrada.precio)}</td>
                                  <td className="py-2 px-3 text-sm font-semibold text-green-600">
                                    {formatCurrency(entrada.total)}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-500">
                                    {entrada.numeroFactura || '-'}
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => editarEntrada(entrada)}
                                        className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                                        title="Editar entrada"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => eliminarEntrada(entrada)}
                                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                                        title="Eliminar entrada"
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}

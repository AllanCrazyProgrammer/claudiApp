import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingDown, Calendar, Package, AlertTriangle, Trash2, ChevronDown, ChevronRight, Eye, EyeOff, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { proveedoresRepo, type ProveedorFS } from '@/lib/repositories/proveedoresRepo';
import { productosRepo, type ProductoFS } from '@/lib/repositories/productosRepo';
import { lotesRepo, type LoteFS } from '@/lib/repositories/lotesRepo';
import { salidasRepo, type SalidaFS } from '@/lib/repositories/salidasRepo';
import { formatCurrency, formatDateShort, createLocalDate, formatDecimal, calcularTotal, formatCurrencyPrecise } from '@/lib/utils';

interface SalidaPorDiaFS {
  fecha: string;
  fechaFormateada: string;
  salidas: (SalidaFS & { id: string })[];
  totalSalidas: number;
  valorTotal: number;
}

export function Salidas() {
  const { user } = useAuth();
  // const [salidas, setSalidas] = useState<(SalidaFS & { id: string })[]>([]);
  const [productos, setProductos] = useState<(ProductoFS & { id: string })[]>([]);
  const [lotesDisponibles, setLotesDisponibles] = useState<(LoteFS & { id: string })[]>([]);
  const [proveedores, setProveedores] = useState<(ProveedorFS & { id: string })[]>([]);
  const [salidasPorDia, setSalidasPorDia] = useState<SalidaPorDiaFS[]>([]);
  const [diasExpandidos, setDiasExpandidos] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [salidaEditando, setSalidaEditando] = useState<(SalidaFS & { id: string }) | null>(null);

  const [formulario, setFormulario] = useState({
    loteId: '',
    proveedorId: '',
    fecha: new Date().toISOString().split('T')[0],
    cantidad: '',
    numeroFactura: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      if (!user) return;
      const [salidasData, productosData, proveedoresData] = await Promise.all([
        salidasRepo.obtenerSalidas(),
        productosRepo.obtenerProductos(),
        proveedoresRepo.obtenerProveedores(),
      ]);
      
      // setSalidas(salidasData);
      setProductos(productosData);
      setProveedores(proveedoresData);

      // Agrupar salidas por día
      const salidasAgrupadas = agruparSalidasPorDia(salidasData as (SalidaFS & { id: string })[]);
      setSalidasPorDia(salidasAgrupadas);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const agruparSalidasPorDia = (salidas: (SalidaFS & { id: string })[]): SalidaPorDiaFS[] => {
    const grupos = new Map<string, SalidaPorDiaFS>();

    salidas.forEach(salida => {
      const fechaDate = (salida.fecha as any).toDate ? (salida.fecha as any).toDate() : new Date(salida.fecha as any);
      const fechaStr = fechaDate.toISOString().split('T')[0];
      const fechaFormateada = formatDateShort(fechaDate);

      if (!grupos.has(fechaStr)) {
        grupos.set(fechaStr, {
          fecha: fechaStr,
          fechaFormateada,
          salidas: [],
          totalSalidas: 0,
          valorTotal: 0
        });
      }

      const grupo = grupos.get(fechaStr)!;
      grupo.salidas.push(salida);
      grupo.totalSalidas += salida.cantidad;
      grupo.valorTotal += salida.total;
    });

    // Convertir a array y ordenar por fecha (más reciente primero)
    return Array.from(grupos.values()).sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones del formulario
    if (!formulario.proveedorId) {
      alert('Por favor selecciona un proveedor');
      return;
    }
    
    if (!formulario.loteId || formulario.loteId.trim() === '') {
      alert('Por favor selecciona un lote específico del producto');
      return;
    }
    
    const cantidad = parseFloat(formulario.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      alert('Por favor ingresa una cantidad válida mayor a cero');
      return;
    }
    
    if (!formulario.fecha) {
      alert('Por favor selecciona una fecha');
      return;
    }
    
    try {
      if (salidaEditando) {
        // Actualizar salida existente
        if (!user) return;
        
        const lote = lotesDisponibles.find(l => l.id === formulario.loteId);
        if (!lote) {
          alert('El lote seleccionado no es válido');
          return;
        }
        
        // Verificar stock disponible (considerando que la salida original liberará su cantidad)
        const cantidadOriginal = salidaEditando.cantidad;
        const stockDisponibleConOriginal = lote.cantidadDisponible + cantidadOriginal;
        
        if (cantidad > stockDisponibleConOriginal) {
          alert(`Stock insuficiente. Disponible (incluyendo cantidad original): ${stockDisponibleConOriginal} unidades`);
          return;
        }
        
        await salidasRepo.actualizarSalida(salidaEditando.id, {
          loteId: formulario.loteId,
          fecha: createLocalDate(formulario.fecha) as any,
          cantidad,
          precio: lote.precioUnitario,
          numeroFactura: formulario.numeroFactura || undefined,
          total: cantidad * lote.precioUnitario
        });
        
        alert('Salida actualizada exitosamente');
        cancelarEdicion();
        cargarDatos();
        return;
      }
        
      // Crear nueva salida
      if (!user) return;
      
      const lote = lotesDisponibles.find(l => l.id === formulario.loteId);
      if (!lote) {
        alert('El lote seleccionado no es válido');
        return;
      }
      
      // Verificar stock disponible
      if (cantidad > lote.cantidadDisponible) {
        alert(`Stock insuficiente. Disponible: ${lote.cantidadDisponible} unidades`);
        return;
      }
      
      await salidasRepo.crearSalidaDirecta({
        productoId: lote.productoId,
        loteId: formulario.loteId,
        fecha: createLocalDate(formulario.fecha) as any,
        cantidad,
        precio: lote.precioUnitario,
        numeroFactura: formulario.numeroFactura || undefined,
        motivo: 'venta'
      });
      
      alert('Salida registrada exitosamente');
      cancelarEdicion();
      cargarDatos();
    } catch (error: any) {
      console.error('Error al guardar salida:', error);
      alert(error.message || 'Error al registrar la salida. Verifica los datos.');
    }
  };

  const eliminarSalida = async (salida: SalidaFS & { id: string }) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar esta salida?\n\n` +
      `Producto: ${obtenerNombreProducto(salida.productoId)}\n` +
      `Cantidad: ${salida.cantidad}\n` +
      `Total: ${formatCurrency(salida.total)}\n\n` +
      `Esta acción restaurará el stock al lote original y no se puede deshacer.`
    );
    
    if (confirmacion) {
      try {
        await salidasRepo.eliminarSalida(salida.id!);
        alert('Salida eliminada exitosamente. El stock ha sido restaurado.');
        cargarDatos();
      } catch (error: any) {
        console.error('Error al eliminar salida:', error);
        alert(error.message || 'Error al eliminar la salida. Inténtalo de nuevo.');
      }
    }
  };

  const toggleDia = (fecha: string) => {
    setDiasExpandidos(prev => ({
      ...prev,
      [fecha]: !prev[fecha]
    }));
  };

  const editarSalida = async (salida: SalidaFS & { id: string }) => {
    setSalidaEditando(salida);
    const fechaSalida = (salida.fecha as any).toDate ? (salida.fecha as any).toDate() : new Date(salida.fecha as any);
    
    // Buscar el lote para obtener el proveedorId
    let proveedorId = '';
    let lotesDelProveedor: (LoteFS & { id: string })[] = [];
    
    if (salida.loteId) {
      try {
        // Buscar el lote específico para obtener su proveedorId
        const todosLosLotes = await Promise.all(
          proveedores.map(async (proveedor) => {
            const lotes = await lotesRepo.obtenerLotesConExistenciaPorProveedor(proveedor.id);
            return lotes.map(lote => ({ ...lote, proveedorId: proveedor.id }));
          })
        );
        
        const loteEncontrado = todosLosLotes.flat().find(lote => lote.id === salida.loteId);
        if (loteEncontrado) {
          proveedorId = loteEncontrado.proveedorId;
          // Cargar todos los lotes de este proveedor
          lotesDelProveedor = await lotesRepo.obtenerLotesConExistenciaPorProveedor(proveedorId) as any;
        }
      } catch (error) {
        console.error('Error al cargar información del lote:', error);
      }
    }
    
    setFormulario({
      loteId: salida.loteId?.toString() || '',
      proveedorId,
      fecha: fechaSalida.toISOString().split('T')[0],
      cantidad: salida.cantidad.toString(),
      numeroFactura: salida.numeroFactura || ''
    });
    
    // Establecer los lotes disponibles si se encontró el proveedor
    if (lotesDelProveedor.length > 0) {
      setLotesDisponibles(lotesDelProveedor);
    }
    
    setMostrarFormulario(true);
  };

  const cancelarEdicion = () => {
    setSalidaEditando(null);
    setFormulario({
      loteId: '',
      proveedorId: '',
      fecha: new Date().toISOString().split('T')[0],
      cantidad: '',
      numeroFactura: ''
    });
    setLotesDisponibles([]);
    setMostrarFormulario(false);
  };

  const obtenerNombreProducto = (productoId: string | number) => {
    const producto = productos.find(p => p.id === String(productoId));
    return producto?.nombre || 'Producto no encontrado';
  };

  // const obtenerNombreProveedor = (proveedorId: string | number) => {
  //   const proveedor = proveedores.find(p => p.id === String(proveedorId));
  //   return proveedor?.nombre || 'Proveedor no encontrado';
  // };

  const handleProveedorChange = async (proveedorId: string) => {
    setFormulario({ ...formulario, proveedorId, loteId: '', numeroFactura: '' });
    
    if (proveedorId) {
      try {
        if (!user) return;
        const lotes = await lotesRepo.obtenerLotesConExistenciaPorProveedor(proveedorId);
        setLotesDisponibles(lotes as any);
      } catch (error) {
        console.error('Error al cargar lotes del proveedor:', error);
        setLotesDisponibles([]);
      }
    } else {
      setLotesDisponibles([]);
    }
  };

  const handleLoteChange = (loteId: string) => {
    const lote = lotesDisponibles.find(l => l.id === loteId);
    setFormulario({ 
      ...formulario, 
      loteId, 
      numeroFactura: lote?.numeroFactura || '' // Asignar automáticamente el número de factura del lote
    });
  };


  const loteSeleccionado = lotesDisponibles.find(l => l.id === formulario.loteId);
  const cantidadSolicitada = parseFloat(formulario.cantidad) || 0;
  const existenciaInsuficiente = loteSeleccionado && cantidadSolicitada > loteSeleccionado.cantidadDisponible;

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
            <CardTitle>
              {salidaEditando ? 'Editar Salida de Inventario' : 'Nueva Salida de Inventario'}
            </CardTitle>
            <CardDescription>
              {salidaEditando 
                ? 'Modifica los datos de la salida seleccionada' 
                : 'Registra una venta o salida de productos del inventario'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Fecha centrada primero */}
              <div className="flex justify-center">
                <div className="w-full max-w-xs">
                  <label className="block text-sm font-medium mb-2 text-center">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={formulario.fecha}
                    onChange={(e) => setFormulario({ ...formulario, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </div>
              </div>

              {salidaEditando && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Información de la Salida</h4>
                  <div className="text-sm text-blue-700">
                    <p><strong>Producto:</strong> {obtenerNombreProducto(salidaEditando.productoId)}</p>
                    <p><strong>Precio Unitario Original:</strong> {formatCurrency(salidaEditando.precio)}</p>
                    <p><strong>Total Original:</strong> {formatCurrency(salidaEditando.total)}</p>
                    {salidaEditando.loteId && (
                      <p className="text-xs mt-1 text-blue-600">
                        * Puedes cambiar el proveedor, lote, fecha, cantidad y número de factura
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Proveedor *
                  </label>
                  <select
                    required
                    value={formulario.proveedorId}
                    onChange={(e) => handleProveedorChange(e.target.value)}
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
                    Lote de Producto *
                    <span className="text-xs text-gray-500">(ordenado por FIFO - más antiguo primero)</span>
                  </label>
                  <select
                    required
                    value={formulario.loteId}
                    onChange={(e) => handleLoteChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!formulario.proveedorId}
                  >
                    <option value="">
                      {!formulario.proveedorId 
                        ? "Primero selecciona un proveedor..." 
                        : lotesDisponibles.length === 0
                          ? "No hay lotes con stock de este proveedor..."
                          : "Seleccionar lote (FIFO - más antiguo primero)..."
                      }
                    </option>
                    {lotesDisponibles.map((lote, index) => {
                      const producto = productos.find(p => p.id === lote.productoId);
                      const fechaLote = (lote.fecha as any).toDate ? (lote.fecha as any).toDate() : new Date(lote.fecha as any);
                      return (
                        <option key={lote.id} value={lote.id}>
                          #{index + 1} - {producto?.nombre} | {formatDateShort(fechaLote)} | Stock: {lote.cantidadDisponible} | {formatCurrency(lote.precioUnitario)}
                        </option>
                      );
                    })}
                  </select>
                  {formulario.proveedorId && lotesDisponibles.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      ⚠️ Este proveedor no tiene lotes con stock disponible para salidas.
                    </p>
                  )}
                  {formulario.proveedorId && lotesDisponibles.length > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      ✅ Mostrando lotes ordenados por FIFO - el más antiguo aparece primero ({lotesDisponibles.length} lotes disponibles).
                    </p>
                  )}
                  {loteSeleccionado && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <strong>Lote seleccionado:</strong><br/>
                        📦 Producto: {productos.find(p => p.id === loteSeleccionado.productoId)?.nombre}<br/>
                        📅 Fecha entrada: {formatDateShort((loteSeleccionado.fecha as any).toDate ? (loteSeleccionado.fecha as any).toDate() : new Date(loteSeleccionado.fecha as any))}<br/>
                        📊 Disponible: <strong>{loteSeleccionado.cantidadDisponible}</strong><br/>
                        💰 Precio original: <strong>{formatCurrency(loteSeleccionado.precioUnitario)}</strong>
                        {loteSeleccionado.numeroFactura && (
                          <><br/>🧾 Factura: {loteSeleccionado.numeroFactura}</>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
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
                      <span>Cantidad solicitada excede la existencia disponible en el lote</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Número de Factura automático del lote */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Número de Factura (de la entrada original)
                </label>
                <input
                  type="text"
                  value={formulario.numeroFactura}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder={!formulario.loteId ? "Se asignará automáticamente al seleccionar lote..." : "Sin número de factura registrado"}
                />
                {formulario.numeroFactura && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Número de factura de la entrada original asignado automáticamente
                  </p>
                )}
              </div>

              {formulario.cantidad && loteSeleccionado && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-800">
                    <div className="flex justify-between items-center">
                      <span>Precio unitario (del lote): <strong>{formatCurrency(loteSeleccionado.precioUnitario)}</strong></span>
                      <span>Cantidad: <strong>{formulario.cantidad}</strong></span>
                    </div>
                    <hr className="my-2 border-green-200" />
                    <div className="text-lg font-bold text-center">
                      Total: {formatCurrencyPrecise(calcularTotal(formulario.cantidad, loteSeleccionado.precioUnitario))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={existenciaInsuficiente}>
                  {salidaEditando ? 'Actualizar Salida' : 'Registrar Salida'}
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
            <CardTitle>Historial de Salidas por Día</CardTitle>
            <CardDescription>
              Salidas agrupadas por fecha - haz clic en un día para ver el detalle
            </CardDescription>
          </CardHeader>
        <CardContent>
          {salidasPorDia.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingDown className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No hay salidas registradas aún.</p>
              <p className="text-sm mt-2">Haz clic en "Nueva Salida" para registrar tu primera venta.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {salidasPorDia.map((dia) => {
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
                            <Calendar className="h-5 w-5 text-red-600" />
                            <div>
                              <h3 className="font-semibold text-gray-800">{dia.fechaFormateada}</h3>
                              <p className="text-sm text-gray-600">
                                {dia.salidas.length} salida{dia.salidas.length !== 1 ? 's' : ''} • 
                                Total: {formatCurrency(dia.valorTotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Cantidad Total</div>
                          <div className="text-lg font-bold text-red-600">{formatDecimal(dia.totalSalidas)}</div>
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

                    {/* Detalle de salidas del día */}
                    {isExpanded && (
                      <div className="p-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Producto</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Motivo</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Cantidad</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Precio Unit.</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Total</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Factura</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dia.salidas.map((salida) => (
                                <tr key={salida.id} className="border-b hover:bg-gray-50">
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-2">
                                      <Package className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm">{obtenerNombreProducto(salida.productoId)}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                      {salida.motivo?.replace('_', ' ') || 'venta'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-sm font-medium">{formatDecimal(salida.cantidad)}</td>
                                  <td className="py-2 px-3 text-sm">{formatCurrency(salida.precio)}</td>
                                  <td className="py-2 px-3 text-sm font-semibold text-red-600">
                                    -{formatCurrency(salida.total)}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-500">
                                    {salida.numeroFactura || '-'}
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => editarSalida(salida)}
                                        className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                                        title="Editar salida"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => eliminarSalida(salida)}
                                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                                        title="Eliminar salida"
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

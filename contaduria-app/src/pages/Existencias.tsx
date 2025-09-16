import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDateShort, formatNumber } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { PDFReporteExistencias } from '@/components/PDFReporteExistencias';
import { useAuth } from '@/contexts/AuthContext';
import { productosRepo, type ProductoFS } from '@/lib/repositories/productosRepo';
import { lotesRepo, type LoteFS } from '@/lib/repositories/lotesRepo';
import { proveedoresRepo } from '@/lib/repositories/proveedoresRepo';
import { entradasRepo } from '@/lib/repositories/entradasRepo';
import { Input } from '@/components/ui/input';
import { firestore } from '@/lib/firebase';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';

interface ProductoConLotes extends ProductoFS {
  id: string;
  lotes: (LoteFS & { id: string })[];
  valorInventario: number;
}

interface ExistenciasPorTipoUI {
  tipoId: string;
  tipoNombre: string;
  productos: ProductoConLotes[];
  totalExistencia: number;
  valorTotal: number;
}

interface ProductoAgrupado {
  nombre: string;
  variaciones: Array<{
    producto: ProductoConLotes;
    precioPromedio: number;
    existencia: number;
    valor: number;
  }>;
  totalExistencia: number;
  totalValor: number;
}

export function Existencias() {
  const { user } = useAuth();
  const { tiposProductos } = useAppStore();
  const [existenciasPorTipo, setExistenciasPorTipo] = useState<ExistenciasPorTipoUI[]>([]);
  const [proveedores, setProveedores] = useState<Array<{ id: string; nombre: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [tiposExpandidos, setTiposExpandidos] = useState<Record<string, boolean>>({});
  const [productosExpandidos, setProductosExpandidos] = useState<Record<string, boolean>>({});
  const [mostrarLotes, setMostrarLotes] = useState<Record<string, boolean>>({});
  const [cantidadPrueba, setCantidadPrueba] = useState(25);
  const [generandoPrueba, setGenerandoPrueba] = useState(false);
  const [borrandoPrueba, setBorrandoPrueba] = useState(false);

  const TEST_STORAGE_KEY = 'existencias-test-data';

  const obtenerDatosPruebaGuardados = () => {
    if (typeof window === 'undefined') {
      return { proveedores: [] as string[], productos: [] as string[], entradas: [] as string[] };
    }
    try {
      const raw = window.localStorage.getItem(TEST_STORAGE_KEY);
      if (!raw) {
        return { proveedores: [] as string[], productos: [] as string[], entradas: [] as string[] };
      }
      const parsed = JSON.parse(raw);
      return {
        proveedores: Array.isArray(parsed?.proveedores) ? parsed.proveedores as string[] : [],
        productos: Array.isArray(parsed?.productos) ? parsed.productos as string[] : [],
        entradas: Array.isArray(parsed?.entradas) ? parsed.entradas as string[] : [],
      };
    } catch (error) {
      console.warn('No se pudo leer el almacenamiento de pruebas, se reiniciará.', error);
      return { proveedores: [] as string[], productos: [] as string[], entradas: [] as string[] };
    }
  };

  const guardarDatosPrueba = (data: { proveedores: string[]; productos: string[]; entradas: string[] }) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(data));
  };

  useEffect(() => {
    cargarExistencias();
  }, [tiposProductos]);

  const cargarExistencias = async () => {
    try {
      if (!user) return;
      const [productosAll, proveedoresData] = await Promise.all([
        productosRepo.obtenerProductos(user.uid),
        proveedoresRepo.obtenerProveedores(user.uid)
      ]);

      setProveedores(proveedoresData.map(p => ({ id: p.id!, nombre: p.nombre })));

      // Solo productos con existencia
      const productos = productosAll.filter(p => (p.existenciaActual || 0) > 0);

      // Cargar lotes para cada producto
      const productosConLotes: ProductoConLotes[] = [];
      for (const producto of productos) {
        const lotes = await lotesRepo.obtenerLotesPorProducto(user.uid, producto.id!);
        productosConLotes.push({
          ...(producto as any),
          lotes: lotes as any,
          valorInventario: (producto.existenciaActual || 0) * (producto.precioPromedio || 0)
        });
      }

      // Agrupar por tipo de producto
      const existenciasPorTipoMap = new Map<string, ExistenciasPorTipoUI>();
      
      // Inicializar con todos los tipos configurados
      tiposProductos.forEach(tipo => {
        existenciasPorTipoMap.set(tipo.codigo, {
          tipoId: tipo.codigo,
          tipoNombre: tipo.nombre,
          productos: [],
          totalExistencia: 0,
          valorTotal: 0
        });
      });

      // Agregar productos a sus tipos correspondientes
      productosConLotes.forEach(producto => {
        const tipoCorte = producto.tipoCorte || 'sin_tipo';
        
        if (!existenciasPorTipoMap.has(tipoCorte)) {
          // Si el producto tiene un tipo que ya no existe en la configuración
          existenciasPorTipoMap.set(tipoCorte, {
            tipoId: tipoCorte,
            tipoNombre: tipoCorte.toUpperCase(),
            productos: [],
            totalExistencia: 0,
            valorTotal: 0
          });
        }

        const tipoData = existenciasPorTipoMap.get(tipoCorte)!;
        tipoData.productos.push(producto);
        tipoData.totalExistencia += producto.existenciaActual;
        tipoData.valorTotal += producto.valorInventario;
      });

      // Convertir a array y filtrar tipos sin productos
      const existenciasArray = Array.from(existenciasPorTipoMap.values())
        .filter(tipo => tipo.productos.length > 0)
        .sort((a, b) => a.tipoNombre.localeCompare(b.tipoNombre));

      setExistenciasPorTipo(existenciasArray);
    } catch (error) {
      console.error('Error al cargar existencias:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTipo = (tipoId: string) => {
    setTiposExpandidos(prev => ({
      ...prev,
      [tipoId]: !prev[tipoId]
    }));
  };

  const toggleProducto = (key: string) => {
    setProductosExpandidos(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleLotes = (productoId: string) => {
    setMostrarLotes(prev => ({
      ...prev,
      [productoId]: !prev[productoId]
    }));
  };

  const generarDatosDePrueba = async () => {
    if (!user) {
      alert('Debes iniciar sesión para generar datos de prueba.');
      return;
    }

    if (!tiposProductos.length) {
      alert('Configura al menos un tipo de producto antes de generar datos de prueba.');
      return;
    }

    const cantidad = Number(cantidadPrueba);
    if (!cantidad || cantidad <= 0) {
      alert('Ingresa una cantidad válida de existencias de prueba.');
      return;
    }

    setGenerandoPrueba(true);
    try {
      const batchId = Date.now();
      const proveedoresACrear = Math.max(3, Math.round(cantidad / 10));
      const productosACrear = Math.max(5, Math.round(cantidad / 5));

      const nuevosProveedores: string[] = [];
      for (let i = 0; i < proveedoresACrear; i++) {
        const proveedorId = await proveedoresRepo.crearProveedor({
          nombre: `Proveedor Prueba ${batchId}-${i + 1}`,
          activo: true,
          ownerUid: user.uid,
        });
        nuevosProveedores.push(proveedorId);
      }

      const nuevosProductos: string[] = [];
      for (let i = 0; i < productosACrear; i++) {
        const tipoAsignado = tiposProductos[i % tiposProductos.length]?.codigo || 'generico';
        const productoId = await productosRepo.crearProducto({
          nombre: `Producto Prueba ${batchId}-${i + 1}`,
          unidadMedida: 'kg',
          tipoCorte: tipoAsignado,
          activo: true,
          ownerUid: user.uid,
        });
        nuevosProductos.push(productoId);
      }

      if (!nuevosProductos.length || !nuevosProveedores.length) {
        throw new Error('No se pudieron crear productos o proveedores de prueba.');
      }

      const nuevasEntradas: string[] = [];
      for (let i = 0; i < cantidad; i++) {
        const productoId = nuevosProductos[i % nuevosProductos.length];
        const proveedorId = nuevosProveedores[i % nuevosProveedores.length];
        const kilos = Number((Math.random() * 75 + 5).toFixed(2));
        const precioUnitario = Number((Math.random() * 40 + 5).toFixed(2));
        const diasAtras = Math.floor(Math.random() * 180);
        const fecha = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);
        const numeroFactura = `TEST-${batchId}-${i + 1}`;

        const entradaId = await entradasRepo.crearEntrada({
          productoId,
          proveedorId,
          fecha,
          cantidad: kilos,
          precio: precioUnitario,
          numeroFactura,
          ownerUid: user.uid,
        } as any);

        nuevasEntradas.push(entradaId);
      }

      const almacenados = obtenerDatosPruebaGuardados();
      const combinar = (prev: string[], nuevos: string[]) => Array.from(new Set([...prev, ...nuevos]));
      guardarDatosPrueba({
        proveedores: combinar(almacenados.proveedores, nuevosProveedores),
        productos: combinar(almacenados.productos, nuevosProductos),
        entradas: combinar(almacenados.entradas, nuevasEntradas),
      });

      await cargarExistencias();
    } catch (error) {
      console.error('Error generando datos de prueba:', error);
      alert('No se pudieron generar los datos de prueba. Revisa la consola para más detalles.');
    } finally {
      setGenerandoPrueba(false);
    }
  };

  const borrarDatosDePrueba = async () => {
    const almacenados = obtenerDatosPruebaGuardados();
    const noHayDatos = !almacenados.proveedores.length && !almacenados.productos.length && !almacenados.entradas.length;
    if (noHayDatos) {
      alert('No hay datos de prueba guardados para eliminar.');
      return;
    }

    const confirmar = window.confirm('¿Deseas borrar los datos de prueba generados? Esta acción es irreversible.');
    if (!confirmar) return;

    setBorrandoPrueba(true);
    try {
      for (const entradaId of almacenados.entradas) {
        try {
          const lotesSnap = await getDocs(query(collection(firestore, 'lotes'), where('entradaId', '==', entradaId)));
          for (const loteDoc of lotesSnap.docs) {
            await deleteDoc(loteDoc.ref);
          }
          await deleteDoc(doc(firestore, 'entradas', entradaId));
        } catch (error) {
          console.warn(`No se pudo eliminar la entrada de prueba ${entradaId}`, error);
        }
      }

      for (const productoId of almacenados.productos) {
        try {
          const lotesProducto = await getDocs(query(collection(firestore, 'lotes'), where('productoId', '==', productoId)));
          for (const loteDoc of lotesProducto.docs) {
            await deleteDoc(loteDoc.ref);
          }
          await deleteDoc(doc(firestore, 'productos', productoId));
        } catch (error) {
          console.warn(`No se pudo eliminar el producto de prueba ${productoId}`, error);
        }
      }

      for (const proveedorId of almacenados.proveedores) {
        try {
          await deleteDoc(doc(firestore, 'proveedores', proveedorId));
        } catch (error) {
          console.warn(`No se pudo eliminar el proveedor de prueba ${proveedorId}`, error);
        }
      }

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(TEST_STORAGE_KEY);
      }

      await cargarExistencias();
    } catch (error) {
      console.error('Error al eliminar los datos de prueba:', error);
      alert('Ocurrió un error al borrar los datos de prueba. Revisa la consola para más detalles.');
    } finally {
      setBorrandoPrueba(false);
    }
  };

  // Función para agrupar productos por nombre y precio
  const agruparProductosPorNombreYPrecio = (productos: ProductoConLotes[]): ProductoAgrupado[] => {
    const grupos = new Map<string, ProductoAgrupado>();

    productos.forEach(producto => {
      const key = `${producto.nombre}_${producto.precioPromedio}`;
      
      if (!grupos.has(key)) {
        grupos.set(key, {
          nombre: producto.nombre,
          variaciones: [],
          totalExistencia: 0,
          totalValor: 0
        });
      }

      const grupo = grupos.get(key)!;
      grupo.variaciones.push({
        producto,
        precioPromedio: producto.precioPromedio,
        existencia: producto.existenciaActual,
        valor: producto.valorInventario
      });
      grupo.totalExistencia += producto.existenciaActual;
      grupo.totalValor += producto.valorInventario;
    });

    return Array.from(grupos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  };

  const obtenerNombreProveedor = (proveedorId: string) => {
    const proveedor = proveedores.find(p => p.id === proveedorId);
    return proveedor?.nombre || 'Proveedor no encontrado';
  };

  // Calcular totales (antes del loading check para mantener orden de hooks)
  const totalExistenciaGeneral = existenciasPorTipo.reduce((sum, tipo) => sum + tipo.totalExistencia, 0);
  const valorTotalGeneral = existenciasPorTipo.reduce((sum, tipo) => sum + tipo.valorTotal, 0);

  // Preparar datos para PDF (debe estar antes del loading check para mantener orden de hooks)
  const memoPDF = useMemo(() => {
    // Mapear proveedores string->number
    const idMap = new Map<string, number>();
    const proveedoresPDF = proveedores.map((p, idx) => {
      idMap.set(p.id, idx + 1);
      return { id: idx + 1, nombre: p.nombre } as any;
    });

    const tiposPDF = existenciasPorTipo.map((tipo) => ({
      tipoId: tipo.tipoId,
      tipoNombre: tipo.tipoNombre,
      productos: tipo.productos.map((prod) => ({
        nombre: prod.nombre,
        existenciaActual: prod.existenciaActual,
        precioPromedio: prod.precioPromedio,
        valorInventario: prod.existenciaActual * prod.precioPromedio,
        lotes: (prod.lotes || []).map((l: any) => ({
          id: l.id,
          fecha: (l.fecha?.toDate?.() ?? new Date(l.fecha)) as Date,
          cantidadDisponible: l.cantidadDisponible,
          precioUnitario: l.precioUnitario,
          numeroFactura: l.numeroFactura,
          proveedorId: idMap.get(l.proveedorId) ?? 0,
        })),
      })),
      totalExistencia: tipo.totalExistencia,
      valorTotal: tipo.valorTotal,
    }));

    return { existenciasParaPDF: tiposPDF, proveedoresParaPDF: proveedoresPDF };
  }, [existenciasPorTipo, proveedores]);

  // Loading check después de todos los hooks
  if (loading) {
    return (
      <div className="space-y-6 p-6">
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
          <h1 className="text-3xl font-bold tracking-tight">Existencias por Tipo</h1>
          <p className="text-muted-foreground">
            Inventario organizado por tipos de producto
          </p>
        </div>
        <PDFReporteExistencias 
          existenciasPorTipo={memoPDF.existenciasParaPDF as any}
          proveedores={memoPDF.proveedoresParaPDF as any}
          totalExistenciaGeneral={totalExistenciaGeneral}
          valorTotalGeneral={valorTotalGeneral}
        />
      </div>

      <div className="bg-white border border-dashed rounded-lg p-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:w-56">
          <label htmlFor="cantidad-prueba" className="block text-sm font-medium text-gray-600 mb-1">
            Cantidad de lotes de prueba
          </label>
          <Input
            id="cantidad-prueba"
            type="number"
            min={1}
            value={cantidadPrueba}
            onChange={(event) => setCantidadPrueba(Number(event.target.value))}
          />
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            onClick={generarDatosDePrueba}
            disabled={generandoPrueba || borrandoPrueba}
            className="w-full sm:w-auto"
          >
            {generandoPrueba ? 'Generando…' : 'Generar existencias de prueba'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={borrarDatosDePrueba}
            disabled={generandoPrueba || borrandoPrueba}
            className="w-full sm:w-auto"
          >
            {borrandoPrueba ? 'Borrando…' : 'Borrar datos de prueba'}
          </Button>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Existencias</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(totalExistenciaGeneral, 2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(valorTotalGeneral)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Tipos de Producto</p>
                <p className="text-2xl font-bold text-amber-600">{existenciasPorTipo.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existencias por Tipo */}
      {existenciasPorTipo.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No hay productos con existencias disponibles.</p>
              <p className="text-sm mt-2">Los productos aparecerán aquí cuando tengan stock disponible.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {existenciasPorTipo.map((tipo) => {
            const productosAgrupados = agruparProductosPorNombreYPrecio(tipo.productos);
            const isExpanded = tiposExpandidos[tipo.tipoId];
            
            return (
              <Card key={tipo.tipoId} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleTipo(tipo.tipoId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <CardTitle className="text-xl">{tipo.tipoNombre}</CardTitle>
                        <CardDescription>
                        {tipo.productos.length} producto{tipo.productos.length !== 1 ? 's' : ''} • 
                        {formatNumber(tipo.totalExistencia, 2)} Kg • {formatCurrency(tipo.valorTotal)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Existencia Total</div>
                      <div className="text-lg font-bold text-blue-600">{formatNumber(tipo.totalExistencia, 2)}</div>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {productosAgrupados.map((grupo) => {
                        // Si hay múltiples variaciones del mismo producto, mostrarlas por separado
                        if (grupo.variaciones.length > 1) {
                          return (
                            <div key={`${tipo.tipoId}_${grupo.nombre}`} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-800">{grupo.nombre}</h4>
                                <div className="text-sm text-gray-600">
                                  {grupo.variaciones.length} variaciones de precio
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {grupo.variaciones.map((variacion, index) => (
                                  <div key={`${variacion.producto.id}_${index}`} className="bg-white rounded p-3 border">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        <span className="text-sm font-medium text-blue-600">
                                          Variación #{index + 1}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                          Precio: {formatCurrency(variacion.precioPromedio)}
                                        </span>
                                        <span className={`font-medium ${
                                          variacion.existencia < 10 ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                          {formatNumber(variacion.existencia, 2)} Kg
                                        </span>
                                        <span className="text-sm font-medium text-amber-600">
                                          Valor: {formatCurrency(variacion.valor)}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => toggleLotes(variacion.producto.id!)}
                                          className="text-blue-600 hover:text-blue-700"
                                        >
                                          {mostrarLotes[variacion.producto.id!] ? (
                                            <>
                                              <EyeOff className="h-4 w-4 mr-1" />
                                              Ocultar
                                            </>
                                          ) : (
                                            <>
                                              <Eye className="h-4 w-4 mr-1" />
                                              Ver
                                            </>
                                          )} Lotes ({variacion.producto.lotes.length})
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Mostrar lotes si están expandidos */}
                                    {mostrarLotes[variacion.producto.id!] && variacion.producto.lotes.length > 0 && (
                                      <div className="mt-3 pt-3 border-t">
                                        <div className="grid gap-2">
                                          {variacion.producto.lotes.map((lote, loteIndex) => (
                                            <div key={lote.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                              <div className="flex items-center gap-3">
                                                <span className="font-medium text-blue-600">#{loteIndex + 1}</span>
                                                <span>Fecha: {formatDateShort((lote.fecha as any).toDate?.() ?? (lote.fecha as any))}</span>
                                                <span><strong>{obtenerNombreProveedor(lote.proveedorId as any)}</strong></span>
                                                <span>Disponible: <strong>{formatNumber(lote.cantidadDisponible, 2)}</strong></span>
                                                <span>Precio: <strong>{formatCurrency(lote.precioUnitario)}</strong></span>
                                                {lote.numeroFactura && (
                                                  <span className="text-gray-600">Factura: {lote.numeroFactura}</span>
                                                )}
                                              </div>
                                              <div className="text-green-600 font-medium">
                                                {formatCurrency(lote.cantidadDisponible * lote.precioUnitario)}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        } else {
                          // Producto único sin variaciones de precio
                          const variacion = grupo.variaciones[0];
                          return (
                            <div key={variacion.producto.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div>
                                    <h4 className="font-medium text-gray-800">{grupo.nombre}</h4>
                                    <div className="text-sm text-gray-500">
                                      Precio: {formatCurrency(variacion.precioPromedio)}
                                    </div>
                                  </div>
                                  <span className={`font-medium ${
                                    variacion.existencia < 10 ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {formatNumber(variacion.existencia, 2)} Kg
                                  </span>
                                  <span className="text-sm font-medium text-amber-600">
                                    Valor: {formatCurrency(variacion.valor)}
                                  </span>
                                </div>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleLotes(variacion.producto.id!)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  {mostrarLotes[variacion.producto.id!] ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-1" />
                                      Ocultar
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-1" />
                                      Ver
                                    </>
                                  )} Lotes ({variacion.producto.lotes.length})
                                </Button>
                              </div>

                              {/* Mostrar lotes si están expandidos */}
                              {mostrarLotes[variacion.producto.id!] && variacion.producto.lotes.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                  <div className="grid gap-2">
                                    {variacion.producto.lotes.map((lote, loteIndex) => (
                                      <div key={lote.id} className="flex items-center justify-between bg-white p-3 rounded border text-sm">
                                        <div className="flex items-center gap-4">
                                          <span className="font-medium text-blue-600">#{loteIndex + 1}</span>
                                          <span>Fecha: {formatDateShort((lote.fecha as any).toDate?.() ?? (lote.fecha as any))}</span>
                                          <span><strong>{obtenerNombreProveedor(lote.proveedorId as any)}</strong></span>
                                          <span>Disponible: <strong>{formatNumber(lote.cantidadDisponible, 2)}</strong></span>
                                          <span>Precio: <strong>{formatCurrency(lote.precioUnitario)}</strong></span>
                                          {lote.numeroFactura && (
                                            <span className="text-gray-600">Factura: {lote.numeroFactura}</span>
                                          )}
                                        </div>
                                        <div className="text-green-600 font-medium">
                                          {formatCurrency(lote.cantidadDisponible * lote.precioUnitario)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

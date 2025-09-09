import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, TrendingUp, Download } from 'lucide-react';
import { dbUtils, type Producto } from '@/lib/database';
import { formatCurrency } from '@/lib/utils';

interface ProductoConValor extends Producto {
  valorInventario: number;
}

export function Reportes() {
  const [productos, setProductos] = useState<ProductoConValor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'bajo_stock' | 'sin_stock'>('todos');

  useEffect(() => {
    cargarReporte();
  }, []);

  const cargarReporte = async () => {
    try {
      const reporteExistencias = await dbUtils.obtenerReporteExistencias();
      setProductos(reporteExistencias);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter(producto => {
    switch (filtro) {
      case 'bajo_stock':
        return producto.existenciaActual > 0 && producto.existenciaActual < 10;
      case 'sin_stock':
        return producto.existenciaActual === 0;
      default:
        return true;
    }
  });

  const estadisticas = {
    totalProductos: productos.length,
    valorTotalInventario: productos.reduce((sum, p) => sum + p.valorInventario, 0),
    productosSinStock: productos.filter(p => p.existenciaActual === 0).length,
    productosConBajoStock: productos.filter(p => p.existenciaActual > 0 && p.existenciaActual < 10).length,
  };

  const exportarReporte = () => {
    const csvContent = [
      ['Producto', 'Descripción', 'Unidad', 'Existencia', 'Precio Promedio', 'Valor Total'].join(','),
      ...productosFiltrados.map(p => [
        `"${p.nombre}"`,
        `"${p.descripcion || ''}"`,
        p.unidadMedida,
        p.existenciaActual,
        p.precioPromedio.toFixed(2),
        p.valorInventario.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_existencias_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporte de Existencias</h1>
          <p className="text-muted-foreground">
            Control y análisis del inventario actual
          </p>
        </div>
        <Button onClick={exportarReporte} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{estadisticas.totalProductos}</div>
                <div className="text-sm text-gray-600">Total Productos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(estadisticas.valorTotalInventario)}</div>
                <div className="text-sm text-gray-600">Valor Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{estadisticas.productosSinStock}</div>
                <div className="text-sm text-gray-600">Sin Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{estadisticas.productosConBajoStock}</div>
                <div className="text-sm text-gray-600">Bajo Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filtro === 'todos' ? 'default' : 'outline'}
          onClick={() => setFiltro('todos')}
          size="sm"
        >
          Todos ({productos.length})
        </Button>
        <Button
          variant={filtro === 'bajo_stock' ? 'default' : 'outline'}
          onClick={() => setFiltro('bajo_stock')}
          size="sm"
        >
          Bajo Stock ({estadisticas.productosConBajoStock})
        </Button>
        <Button
          variant={filtro === 'sin_stock' ? 'default' : 'outline'}
          onClick={() => setFiltro('sin_stock')}
          size="sm"
        >
          Sin Stock ({estadisticas.productosSinStock})
        </Button>
      </div>

      {/* Tabla de Productos */}
      <Card>
        <CardHeader>
          <CardTitle>Existencias por Producto</CardTitle>
          <CardDescription>
            Detalle de existencias y valores del inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No hay productos que coincidan con el filtro seleccionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Producto</th>
                    <th className="text-left py-3 px-4">Unidad</th>
                    <th className="text-left py-3 px-4">Existencia</th>
                    <th className="text-left py-3 px-4">Precio Promedio</th>
                    <th className="text-left py-3 px-4">Valor Total</th>
                    <th className="text-left py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((producto) => {
                    let estadoColor = 'text-green-600 bg-green-50';
                    let estadoTexto = 'En Stock';
                    
                    if (producto.existenciaActual === 0) {
                      estadoColor = 'text-red-600 bg-red-50';
                      estadoTexto = 'Sin Stock';
                    } else if (producto.existenciaActual < 10) {
                      estadoColor = 'text-yellow-600 bg-yellow-50';
                      estadoTexto = 'Bajo Stock';
                    }

                    return (
                      <tr key={producto.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{producto.nombre}</div>
                            {producto.descripcion && (
                              <div className="text-sm text-gray-500">{producto.descripcion}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">{producto.unidadMedida}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${
                            producto.existenciaActual === 0 ? 'text-red-600' :
                            producto.existenciaActual < 10 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {producto.existenciaActual}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {formatCurrency(producto.precioPromedio)}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {formatCurrency(producto.valorInventario)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColor}`}>
                            {estadoTexto}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td className="py-3 px-4" colSpan={4}>
                      <strong>TOTAL INVENTARIO:</strong>
                    </td>
                    <td className="py-3 px-4">
                      <strong>{formatCurrency(productosFiltrados.reduce((sum, p) => sum + p.valorInventario, 0))}</strong>
                    </td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

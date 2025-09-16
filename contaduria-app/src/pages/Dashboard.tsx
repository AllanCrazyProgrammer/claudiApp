import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dbUtils } from '@/lib/database';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Package, Users, TrendingUp, TrendingDown } from 'lucide-react';

interface ResumenDashboard {
  totalProductos: number;
  totalProveedores: number;
  valorInventario: number;
  productosConBajoStock: number;
  entradasMes: number;
  salidasMes: number;
  diferenciaMes: number;
}

export function Dashboard() {
  const [resumen, setResumen] = useState<ResumenDashboard>({
    totalProductos: 0,
    totalProveedores: 0,
    valorInventario: 0,
    productosConBajoStock: 0,
    entradasMes: 0,
    salidasMes: 0,
    diferenciaMes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        const fechaActual = new Date();
        const fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        const fechaFin = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

        // Obtener datos generales
        const productos = await dbUtils.obtenerProductos();
        const proveedores = await dbUtils.obtenerProveedores();
        const reporteExistencias = await dbUtils.obtenerReporteExistencias();

        // Obtener movimientos del mes actual
        const movimientosMes = await dbUtils.obtenerMovimientosPorPeriodo(fechaInicio, fechaFin);

        // Calcular productos con bajo stock (menos de 10 unidades)
        const productosConBajoStock = productos.filter(p => p.existenciaActual < 10).length;

        // Calcular valor total del inventario
        const valorInventario = reporteExistencias.reduce((sum, p) => sum + p.valorInventario, 0);

        setResumen({
          totalProductos: productos.length,
          totalProveedores: proveedores.length,
          valorInventario,
          productosConBajoStock,
          entradasMes: movimientosMes.valorEntradas,
          salidasMes: movimientosMes.valorSalidas,
          diferenciaMes: movimientosMes.diferencia
        });
      } catch (error) {
        console.error('Error al cargar resumen:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarResumen();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        {/* Header skeleton */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 p-8 shadow-2xl animate-pulse">
          <div className="h-8 bg-gray-400/50 rounded-lg w-48 mb-2"></div>
          <div className="h-6 bg-gray-400/30 rounded-lg w-64"></div>
        </div>
        
        {/* Cards skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gray-200 w-12 h-12"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded-lg w-32 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded-lg w-24"></div>
            </div>
          ))}
        </div>
        
        {/* Financial cards skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border border-gray-100 animate-pulse">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-200 rounded-lg mr-3 w-9 h-9"></div>
                <div>
                  <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-4 bg-gray-100 rounded w-40"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tarjetas = [
    {
      titulo: 'Total Productos',
      valor: resumen.totalProductos.toString(),
      descripcion: 'Productos registrados',
      icono: Package,
      color: 'text-blue-600'
    },
    {
      titulo: 'Total Proveedores',
      valor: resumen.totalProveedores.toString(),
      descripcion: 'Proveedores activos',
      icono: Users,
      color: 'text-green-600'
    },
    {
      titulo: 'Valor del Inventario',
      valor: formatCurrency(resumen.valorInventario),
      descripcion: 'Valor total en existencias',
      icono: TrendingUp,
      color: 'text-amber-600'
    },
    {
      titulo: 'Productos con Bajo Stock',
      valor: resumen.productosConBajoStock.toString(),
      descripcion: 'Menos de 10 unidades',
      icono: TrendingDown,
      color: resumen.productosConBajoStock > 0 ? 'text-red-600' : 'text-green-600'
    }
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-500 to-amber-400 p-8 text-white shadow-2xl animate-fade-in-scale">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard de Inventario</h1>
          <p className="text-blue-100 text-lg">
            Control y seguimiento de tu inventario
          </p>
        </div>
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl animate-pulse"></div>
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-2xl animate-pulse"></div>
      </div>

      {/* Tarjetas de resumen con gradientes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((tarjeta, index) => {
          const Icono = tarjeta.icono;
          const gradients = [
            'from-blue-500 to-blue-600',
            'from-sky-500 to-blue-500', 
            'from-amber-400 to-yellow-500',
            'from-blue-400 to-amber-400'
          ];
          
          return (
            <div 
              key={index} 
              className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 animate-slide-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${gradients[index]} shadow-lg transform transition-transform group-hover:scale-110`}>
                    <Icono className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 transition-colors group-hover:text-gray-700">{tarjeta.valor}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{tarjeta.titulo}</h3>
                  <p className="text-sm text-gray-600">{tarjeta.descripcion}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen de movimientos del mes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-blue-500/10"></div>
          <div className="relative">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-500 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900">Entradas del Mes</h3>
                <p className="text-sm text-blue-700">Valor de compras registradas</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(resumen.entradasMes)}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-lg border border-amber-200 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-amber-500/10"></div>
          <div className="relative">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-amber-500 rounded-lg mr-3">
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900">Salidas del Mes</h3>
                <p className="text-sm text-amber-700">Valor de ventas/salidas</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {formatCurrency(resumen.salidasMes)}
            </div>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg border hover:shadow-xl transition-all duration-300 ${
          resumen.diferenciaMes >= 0 
            ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' 
            : 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200'
        }`}>
          <div className={`absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full ${
            resumen.diferenciaMes >= 0 ? 'bg-blue-500/10' : 'bg-amber-500/10'
          }`}></div>
          <div className="relative">
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-lg mr-3 ${
                resumen.diferenciaMes >= 0 ? 'bg-blue-500' : 'bg-amber-500'
              }`}>
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className={`font-bold ${
                  resumen.diferenciaMes >= 0 ? 'text-blue-900' : 'text-amber-900'
                }`}>Diferencia del Mes</h3>
                <p className={`text-sm ${
                  resumen.diferenciaMes >= 0 ? 'text-blue-700' : 'text-amber-700'
                }`}>Entradas - Salidas</p>
              </div>
            </div>
            <div className={`text-3xl font-bold ${
              resumen.diferenciaMes >= 0 ? 'text-blue-600' : 'text-amber-600'
            }`}>
              {formatCurrency(resumen.diferenciaMes)}
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de bienvenida para nuevos usuarios */}
      {resumen.totalProductos === 0 && resumen.totalProveedores === 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-amber-400 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm mr-4">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">¡Bienvenido a tu Sistema de Inventario!</h2>
                <p className="text-white/80 text-lg">
                  Comienza registrando tus primeros productos y proveedores
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <p className="text-white/90 mb-4 text-base">
                Esta aplicación te ayudará a controlar tu inventario de manera eficiente. 
                Puedes comenzar por:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center text-white/90">
                  <div className="w-2 h-2 bg-white/60 rounded-full mr-3"></div>
                  <span>Registrar tus proveedores</span>
                </div>
                <div className="flex items-center text-white/90">
                  <div className="w-2 h-2 bg-white/60 rounded-full mr-3"></div>
                  <span>Agregar productos al catálogo</span>
                </div>
                <div className="flex items-center text-white/90">
                  <div className="w-2 h-2 bg-white/60 rounded-full mr-3"></div>
                  <span>Registrar entradas de inventario</span>
                </div>
                <div className="flex items-center text-white/90">
                  <div className="w-2 h-2 bg-white/60 rounded-full mr-3"></div>
                  <span>Controlar salidas y existencias</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5 blur-xl"></div>
        </div>
      )}
    </div>
  );
}

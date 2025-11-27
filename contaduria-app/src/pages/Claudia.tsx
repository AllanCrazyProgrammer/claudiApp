import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Plus, 
  Trash2, 
  Calculator, 
  Download, 
  Fish,
  DollarSign,
  Package,
  TrendingUp,
  Edit3,
  Save,
  X,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Interfaces
interface ViajeDetalle {
  concepto: string;
  monto: number;
}

interface InventarioItem {
  no: number;
  descripcion: string;
  unidadMedida: string;
  cantidadInicial: number;
  entradas: number;
  salidas: number;
  cantidadFinal: number;
  costoUnitario: number;
  total: number;
}

export function Claudia() {
  // Estados
  const [viajeDetalles, setViajeDetalles] = useState<ViajeDetalle[]>([
    { concepto: 'Combustible', monto: 400000 },
    { concepto: 'Sueldos', monto: 100000 },
    { concepto: 'Hielo', monto: 20000 },
    { concepto: 'Mantenimiento', monto: 50000 },
    { concepto: 'Alimentos', monto: 20000 }
  ]);

  const [kilosCapturados, setKilosCapturados] = useState<number>(4000);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<Partial<InventarioItem>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  // Cálculos
  const totalCostoViaje = viajeDetalles.reduce((sum, item) => sum + item.monto, 0);
  const costoUnitario = kilosCapturados > 0 ? totalCostoViaje / kilosCapturados : 0;

  // Inicializar inventario
  useEffect(() => {
    if (inventario.length === 0) {
      const itemInicial: InventarioItem = {
        no: 1,
        descripcion: 'Pescado fresco / producto pesquero',
        unidadMedida: 'kg',
        cantidadInicial: 0,
        entradas: kilosCapturados,
        salidas: 0,
        cantidadFinal: kilosCapturados,
        costoUnitario: costoUnitario,
        total: kilosCapturados * costoUnitario
      };
      setInventario([itemInicial]);
    }
  }, [kilosCapturados, costoUnitario, inventario.length]);

  // Actualizar inventario cuando cambien los valores
  useEffect(() => {
    setInventario(prev => prev.map(item => ({
      ...item,
      costoUnitario: costoUnitario,
      total: item.cantidadFinal * costoUnitario
    })));
  }, [costoUnitario]);

  // Funciones para manejar viaje detalles
  const agregarViajeDetalle = () => {
    setViajeDetalles([...viajeDetalles, { concepto: '', monto: 0 }]);
  };

  const actualizarViajeDetalle = (index: number, field: keyof ViajeDetalle, value: string | number) => {
    const nuevosDetalles = [...viajeDetalles];
    nuevosDetalles[index] = { ...nuevosDetalles[index], [field]: value };
    setViajeDetalles(nuevosDetalles);
  };

  const eliminarViajeDetalle = (index: number) => {
    setViajeDetalles(viajeDetalles.filter((_, i) => i !== index));
  };

  // Funciones para manejar inventario
  const agregarInventarioItem = () => {
    if (newItem.descripcion && newItem.unidadMedida !== undefined) {
      const cantidadFinal = (newItem.cantidadInicial || 0) + (newItem.entradas || 0) - (newItem.salidas || 0);
      const item: InventarioItem = {
        no: inventario.length + 1,
        descripcion: newItem.descripcion,
        unidadMedida: newItem.unidadMedida,
        cantidadInicial: newItem.cantidadInicial || 0,
        entradas: newItem.entradas || 0,
        salidas: newItem.salidas || 0,
        cantidadFinal: cantidadFinal,
        costoUnitario: costoUnitario,
        total: cantidadFinal * costoUnitario
      };
      setInventario([...inventario, item]);
      setNewItem({});
      setShowAddForm(false);
    }
  };

  const actualizarInventarioItem = (index: number, field: keyof InventarioItem, value: string | number) => {
    const nuevosItems = [...inventario];
    nuevosItems[index] = { ...nuevosItems[index], [field]: value };
    
    // Recalcular cantidad final y total
    if (field === 'cantidadInicial' || field === 'entradas' || field === 'salidas') {
      const item = nuevosItems[index];
      item.cantidadFinal = item.cantidadInicial + item.entradas - item.salidas;
      item.total = item.cantidadFinal * item.costoUnitario;
    }
    
    setInventario(nuevosItems);
  };

  const eliminarInventarioItem = (index: number) => {
    setInventario(inventario.filter((_, i) => i !== index));
  };

  // Función para exportar a Excel real
  const exportarAExcel = () => {
    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Detalle de Costos
    const costosData = [
      ['DETALLE DE COSTOS DEL VIAJE'],
      [''],
      ['Concepto', 'Monto ($)'],
      ...viajeDetalles.map(detalle => [detalle.concepto, detalle.monto]),
      [''],
      ['TOTAL COSTO DEL VIAJE', totalCostoViaje],
      [''],
      ['DATOS CALCULADOS'],
      ['Kilos Capturados', kilosCapturados],
      ['Costo Unitario ($/kg)', parseFloat(costoUnitario.toFixed(2))]
    ];

    const costosWorksheet = XLSX.utils.aoa_to_sheet(costosData);
    
    // Aplicar estilos a la hoja de costos
    const costosRange = XLSX.utils.decode_range(costosWorksheet['!ref'] || 'A1');
    
    // Establecer anchos de columna
    costosWorksheet['!cols'] = [
      { width: 25 }, // Columna A - Concepto
      { width: 15 }  // Columna B - Monto
    ];

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(workbook, costosWorksheet, 'Detalle de Costos');

    // Hoja 2: Inventario
    const inventarioHeaders = [
      'No.',
      'Descripción del Bien',
      'Unidad de Medida',
      'Cantidad Inicial',
      'Entradas (Captura)',
      'Salidas (Ventas)',
      'Cantidad Final',
      'Costo Unitario ($)',
      'Total ($)'
    ];

    const inventarioData = [
      ['INVENTARIO PESQUERO'],
      [''],
      inventarioHeaders,
      ...inventario.map(item => [
        item.no,
        item.descripcion,
        item.unidadMedida,
        item.cantidadInicial,
        item.entradas,
        item.salidas,
        item.cantidadFinal,
        parseFloat(item.costoUnitario.toFixed(2)),
        parseFloat(item.total.toFixed(2))
      ]),
      [''],
      ['RESUMEN'],
      ['Total Valor del Inventario', inventario.reduce((sum, item) => sum + item.total, 0)]
    ];

    const inventarioWorksheet = XLSX.utils.aoa_to_sheet(inventarioData);
    
    // Establecer anchos de columna para inventario
    inventarioWorksheet['!cols'] = [
      { width: 5 },  // No.
      { width: 30 }, // Descripción
      { width: 12 }, // Unidad
      { width: 12 }, // Inicial
      { width: 12 }, // Entradas
      { width: 12 }, // Salidas
      { width: 12 }, // Final
      { width: 15 }, // Costo Unit.
      { width: 15 }  // Total
    ];

    XLSX.utils.book_append_sheet(workbook, inventarioWorksheet, 'Inventario');

    // Hoja 3: Resumen Ejecutivo
    const resumenData = [
      ['RESUMEN EJECUTIVO - INVENTARIO PESQUERO'],
      [''],
      ['Fecha de Generación', new Date().toLocaleDateString('es-ES')],
      [''],
      ['COSTOS DEL VIAJE'],
      ['Total de Gastos', `$${totalCostoViaje.toLocaleString()}`],
      ['Kilos Capturados', `${kilosCapturados.toLocaleString()} kg`],
      ['Costo por Kilogramo', `$${costoUnitario.toFixed(2)}`],
      [''],
      ['INVENTARIO'],
      ['Número de Items', inventario.length],
      ['Valor Total del Inventario', `$${inventario.reduce((sum, item) => sum + item.total, 0).toFixed(2)}`],
      [''],
      ['ANÁLISIS'],
      ['Rentabilidad por Kg', `$${costoUnitario.toFixed(2)}`],
      ['Margen Sugerido (30%)', `$${(costoUnitario * 1.3).toFixed(2)}`],
      ['Precio de Venta Sugerido', `$${(costoUnitario * 1.3).toFixed(2)} por kg`]
    ];

    const resumenWorksheet = XLSX.utils.aoa_to_sheet(resumenData);
    
    // Establecer anchos de columna para resumen
    resumenWorksheet['!cols'] = [
      { width: 30 }, // Descripción
      { width: 20 }  // Valor
    ];

    XLSX.utils.book_append_sheet(workbook, resumenWorksheet, 'Resumen Ejecutivo');

    // Generar el archivo y descargarlo
    const fechaActual = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Inventario_Pesquero_${fechaActual}.xlsx`;
    
    XLSX.writeFile(workbook, nombreArchivo);
    
    // Mostrar mensaje de éxito (opcional)
    console.log(`Archivo ${nombreArchivo} generado con éxito.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
            <Fish className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Inventario Pesquero
          </h1>
          <p className="text-lg text-gray-600">
            Gestión de costos de viaje e inventario de productos pesqueros
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sección de Costos de Viaje */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Costos de Viaje</h2>
              </div>
              <button
                onClick={agregarViajeDetalle}
                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {viajeDetalles.map((detalle, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={detalle.concepto}
                    onChange={(e) => actualizarViajeDetalle(index, 'concepto', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Concepto"
                  />
                  <input
                    type="number"
                    value={detalle.monto}
                    onChange={(e) => actualizarViajeDetalle(index, 'monto', parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Monto"
                  />
                  <button
                    onClick={() => eliminarViajeDetalle(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Costo del Viaje:</span>
                <span className="text-green-600">${totalCostoViaje.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Sección de Datos del Inventario */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Datos del Inventario</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kilos Capturados
                </label>
                <input
                  type="number"
                  value={kilosCapturados}
                  onChange={(e) => setKilosCapturados(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Costo Unitario:</span>
                  <span className="text-lg font-semibold text-blue-600">
                    ${costoUnitario.toFixed(2)}/kg
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Calculado: Total Costos ÷ Kilos Capturados
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Inventario */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Inventario Detallado</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Item</span>
              </button>
              <button
                onClick={exportarAExcel}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                title="Exportar a Excel"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>

          {/* Formulario para agregar nuevo item */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <input
                  type="text"
                  placeholder="Descripción"
                  value={newItem.descripcion || ''}
                  onChange={(e) => setNewItem({...newItem, descripcion: e.target.value})}
                  className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Unidad"
                  value={newItem.unidadMedida || ''}
                  onChange={(e) => setNewItem({...newItem, unidadMedida: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Inicial"
                  value={newItem.cantidadInicial || ''}
                  onChange={(e) => setNewItem({...newItem, cantidadInicial: parseFloat(e.target.value) || 0})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Entradas"
                  value={newItem.entradas || ''}
                  onChange={(e) => setNewItem({...newItem, entradas: parseFloat(e.target.value) || 0})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Salidas"
                  value={newItem.salidas || ''}
                  onChange={(e) => setNewItem({...newItem, salidas: parseFloat(e.target.value) || 0})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-3">
                <button
                  onClick={() => {setShowAddForm(false); setNewItem({});}}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={agregarInventarioItem}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          )}

          {/* Tabla responsive */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-700">No.</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Descripción</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Unidad</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Inicial</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Entradas</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Salidas</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Final</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Costo Unit.</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Total</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inventario.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">{item.no}</td>
                    <td className="py-3 px-2">
                      {editingItem === index ? (
                        <input
                          type="text"
                          value={item.descripcion}
                          onChange={(e) => actualizarInventarioItem(index, 'descripcion', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        item.descripcion
                      )}
                    </td>
                    <td className="py-3 px-2">{item.unidadMedida}</td>
                    <td className="py-3 px-2">
                      {editingItem === index ? (
                        <input
                          type="number"
                          value={item.cantidadInicial}
                          onChange={(e) => actualizarInventarioItem(index, 'cantidadInicial', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        item.cantidadInicial
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {editingItem === index ? (
                        <input
                          type="number"
                          value={item.entradas}
                          onChange={(e) => actualizarInventarioItem(index, 'entradas', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        item.entradas
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {editingItem === index ? (
                        <input
                          type="number"
                          value={item.salidas}
                          onChange={(e) => actualizarInventarioItem(index, 'salidas', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        item.salidas
                      )}
                    </td>
                    <td className="py-3 px-2 font-medium">{item.cantidadFinal}</td>
                    <td className="py-3 px-2">${item.costoUnitario.toFixed(2)}</td>
                    <td className="py-3 px-2 font-medium text-green-600">${item.total.toFixed(2)}</td>
                    <td className="py-3 px-2">
                      <div className="flex space-x-1">
                        {editingItem === index ? (
                          <button
                            onClick={() => setEditingItem(null)}
                            className="p-1 text-green-500 hover:bg-green-50 rounded transition-colors"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingItem(index)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => eliminarInventarioItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  ${totalCostoViaje.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Costos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {kilosCapturados.toLocaleString()} kg
                </div>
                <div className="text-sm text-gray-600">Capturados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  ${inventario.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Valor Total Inventario</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

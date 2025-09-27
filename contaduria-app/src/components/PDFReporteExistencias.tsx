import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink
} from '@react-pdf/renderer';

// Función auxiliar para formatear moneda (simplificada para PDF)
const formatCurrencyPDF = (amount: number): string => {
  if (!amount || isNaN(amount)) return '$0.00';
  return `$${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

// Función auxiliar para formatear números (simplificada para PDF)
const formatNumberPDF = (number: number, decimals: number = 2, maxDecimals: number = 8): string => {
  const maximumFractionDigits = Math.max(decimals, maxDecimals);

  const value = !number || isNaN(number) ? 0 : number;

  return value.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits
  });
};

// Ajusta los tamaños de letra según la cantidad de filas que se mostrarán
const calculateFontScale = (totalRows: number): number => {
  if (totalRows <= 10) return 1.05;
  if (totalRows <= 20) return 1;
  if (totalRows <= 40) return 0.92;
  if (totalRows <= 60) return 0.88;
  return 0.8;
};


// Estilos inspirados en formato de inventario impreso
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#f5f6fb',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 26,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },

  header: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#111827',
  },

  headerSubtitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 4,
    color: '#4b5563',
  },

  headerDate: {
    fontSize: 9,
    marginTop: 6,
    textTransform: 'uppercase',
    color: '#6b7280',
  },

  typeSection: {
    marginBottom: 14,
  },

  typeCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    padding: 12,
  },

  typeTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
    color: '#111827',
  },

  typeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  metaGroup: {
    flexDirection: 'row',
  },

  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
  },

  metaBadgeLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#1d4ed8',
    letterSpacing: 0.4,
  },

  metaBadgeValue: {
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 4,
  },

  table: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },

  tableHeaderCell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#ffffff',
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },

  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },

  tableCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 9,
    color: '#1f2937',
  },

  tableCellRight: {
    textAlign: 'right',
  },

  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#dbeafe',
    backgroundColor: '#f3f4f6',
  },

  totalLabelCell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#0f172a',
  },

  colProveedor: { width: '38%' },
  colFactura: { width: '12%' },
  colFecha: { width: '12%' },
  colCantidad: { width: '12%' },
  colPrecio: { width: '13%' },
  colTotal: { width: '13%' },

  footer: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
  },

  globalTotalsCard: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 8,
    overflow: 'hidden',
  },
});

interface ExistenciasPorTipo {
  tipoId: string;
  tipoNombre: string;
  productos: Array<{
    nombre: string;
    existenciaActual: number;
    precioPromedio: number;
    valorInventario: number;
    lotes: Array<{
      id?: number;
      fecha: Date;
      cantidadDisponible: number;
      precioUnitario: number;
      numeroFactura?: string;
      proveedorId: number;
    }>;
  }>;
  totalExistencia: number;
  valorTotal: number;
}

interface PDFReporteExistenciasProps {
  existenciasPorTipo: ExistenciasPorTipo[];
  proveedores: any[];
  totalExistenciaGeneral: number;
  valorTotalGeneral: number;
}

// Función para sanitizar datos
const sanitizeData = (existenciasPorTipo: any[], proveedores: any[]) => {
  const sanitizedExistencias = (existenciasPorTipo || []).filter(Boolean).map(tipo => ({
    tipoId: String(tipo?.tipoId || ''),
    tipoNombre: String(tipo?.tipoNombre || 'Sin nombre'),
    totalExistencia: Number(tipo?.totalExistencia || 0),
    valorTotal: Number(tipo?.valorTotal || 0),
    productos: (tipo?.productos || []).filter(Boolean).map((producto: any) => ({
      nombre: String(producto?.nombre || 'Sin nombre'),
      existenciaActual: Number(producto?.existenciaActual || 0),
      precioPromedio: Number(producto?.precioPromedio || 0),
      valorInventario: Number(producto?.valorInventario || 0),
      lotes: (producto?.lotes || []).filter(Boolean).map((lote: any) => ({
        id: lote?.id || Math.random(),
        fecha: lote?.fecha ? new Date(lote.fecha) : new Date(),
        cantidadDisponible: Number(lote?.cantidadDisponible || 0),
        precioUnitario: Number(lote?.precioUnitario || 0),
        numeroFactura: String(lote?.numeroFactura || ''),
        proveedorId: Number(lote?.proveedorId || 0)
      }))
    }))
  }));

  const sanitizedProveedores = (proveedores || []).filter(Boolean).map(proveedor => ({
    id: Number(proveedor?.id || 0),
    nombre: String(proveedor?.nombre || 'Sin nombre')
  }));

  return { sanitizedExistencias, sanitizedProveedores };
};

// Componente del documento PDF simplificado
const ReporteExistenciasPDF = ({ 
  existenciasPorTipo, 
  proveedores, 
  totalExistenciaGeneral, 
  valorTotalGeneral 
}: PDFReporteExistenciasProps) => {
  
  try {
    // Sanitizar y validar datos
    const { sanitizedExistencias, sanitizedProveedores } = sanitizeData(existenciasPorTipo, proveedores);
    const safeTotal = Number(totalExistenciaGeneral || 0);
    const safeValor = Number(valorTotalGeneral || 0);

    // Validación básica
    if (!Array.isArray(sanitizedExistencias) || !Array.isArray(sanitizedProveedores)) {
      throw new Error('Datos inválidos');
    }

    const fechaReporte = new Date();
    const fechaGeneracion = fechaReporte.toLocaleDateString('es-MX');
    const fechaEncabezado = fechaReporte
      .toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
      .toUpperCase();
    
    const proveedorIdToNombre: Record<number, string> = sanitizedProveedores.reduce(
      (acc: Record<number, string>, proveedor) => {
        acc[proveedor.id] = proveedor.nombre;
        return acc;
      },
      {}
    );

    const totalLotes = sanitizedExistencias.reduce((sum, tipo) => {
      const lotesPorTipo = tipo.productos.reduce((acum: number, producto: any) => {
        return acum + (producto.lotes?.length || 0);
      }, 0);
      return sum + lotesPorTipo;
    }, 0);

  const fontScale = calculateFontScale(totalLotes);
  const scaleValue = (value: number, min: number): number => {
    const scaled = Number((value * fontScale).toFixed(2));
    return Math.max(min, scaled);
  };

  const dynamicStyles = StyleSheet.create({
    page: {
      fontSize: scaleValue(9, 7),
      paddingHorizontal: Math.max(20, Number((26 * (fontScale >= 1 ? 1 : 0.9)).toFixed(0))),
      paddingTop: Math.max(20, Number((28 * (fontScale >= 1 ? 1 : 0.9)).toFixed(0))),
      paddingBottom: Math.max(18, Number((24 * (fontScale >= 1 ? 1 : 0.9)).toFixed(0))),
    },
    headerTitle: {
      fontSize: scaleValue(16, 12)
    },
    headerSubtitle: {
      fontSize: scaleValue(10, 8)
    },
    headerDate: {
      fontSize: scaleValue(9, 7)
    },
    typeTitle: {
      fontSize: scaleValue(11, 9)
    },
    metaBadgeLabel: {
      fontSize: scaleValue(8, 7)
    },
    metaBadgeValue: {
      fontSize: scaleValue(9, 7)
    },
    tableHeaderCell: {
      fontSize: scaleValue(9, 7)
    },
    tableCell: {
      fontSize: scaleValue(9, 6)
    },
    totalLabel: {
      fontSize: scaleValue(9, 7)
    },
    footer: {
      fontSize: scaleValue(8, 6)
    }
  });

  return (
    <Document>
      <Page size="A4" style={[styles.page, dynamicStyles.page]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Inventario de Existencias</Text>
          <Text style={[styles.headerSubtitle, dynamicStyles.headerSubtitle]}>Resumen por tipo de producto</Text>
          <Text style={[styles.headerDate, dynamicStyles.headerDate]}>{fechaEncabezado}</Text>
        </View>

        {sanitizedExistencias.map((tipo, tipoIndex) => (
          <View key={`tipo-${tipoIndex}`} style={styles.typeSection} wrap={false}>
            <View style={styles.typeCard}>
              <Text style={[styles.typeTitle, dynamicStyles.typeTitle]}>
                {tipo.tipoNombre || `Tipo ${tipoIndex + 1}`}
              </Text>

              <View style={styles.typeMetaRow}>
                <View style={styles.metaGroup}>
                  <View style={styles.metaBadge}>
                    <Text style={[styles.metaBadgeLabel, dynamicStyles.metaBadgeLabel]}>Productos</Text>
                    <Text style={[styles.metaBadgeValue, dynamicStyles.metaBadgeValue]}>{tipo.productos?.length || 0}</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Text style={[styles.metaBadgeLabel, dynamicStyles.metaBadgeLabel]}>Total kg</Text>
                    <Text style={[styles.metaBadgeValue, dynamicStyles.metaBadgeValue]}>{formatNumberPDF(tipo.totalExistencia || 0, 2)}</Text>
                  </View>
                </View>
                <View style={styles.metaBadge}>
                  <Text style={[styles.metaBadgeLabel, dynamicStyles.metaBadgeLabel]}>Valor $</Text>
                  <Text style={[styles.metaBadgeValue, dynamicStyles.metaBadgeValue]}>{formatCurrencyPDF(tipo.valorTotal || 0)}</Text>
                </View>
              </View>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.colProveedor, dynamicStyles.tableHeaderCell]}>Proveedor</Text>
                  <Text style={[styles.tableHeaderCell, styles.colFactura, dynamicStyles.tableHeaderCell]}>No. fact</Text>
                  <Text style={[styles.tableHeaderCell, styles.colFecha, dynamicStyles.tableHeaderCell]}>Fecha</Text>
                  <Text style={[styles.tableHeaderCell, styles.colCantidad, styles.tableCellRight, dynamicStyles.tableHeaderCell]}>Cantidad</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrecio, styles.tableCellRight, dynamicStyles.tableHeaderCell]}>Precio</Text>
                <Text style={[styles.tableHeaderCell, styles.colTotal, styles.tableCellRight, dynamicStyles.tableHeaderCell]}>Total</Text>
              </View>

              {(() => {
                const lotes = (tipo.productos || []).flatMap((producto: any) =>
                  (producto.lotes || []).map((lote: any) => ({ lote, productoNombre: producto.nombre }))
                );

                const rows: any[] = [];

                if (!lotes.length) {
                  rows.push(
                    <View style={styles.tableRow} key={`tipo-${tipoIndex}-empty`}>
                      <Text style={[styles.tableCell, styles.colProveedor, dynamicStyles.tableCell]}>Sin registros</Text>
                      <Text style={[styles.tableCell, styles.colFactura, dynamicStyles.tableCell]}></Text>
                      <Text style={[styles.tableCell, styles.colFecha, dynamicStyles.tableCell]}></Text>
                      <Text style={[styles.tableCell, styles.colCantidad, styles.tableCellRight, dynamicStyles.tableCell]}>0.00</Text>
                      <Text style={[styles.tableCell, styles.colPrecio, styles.tableCellRight, dynamicStyles.tableCell]}>$0.00</Text>
                      <Text style={[styles.tableCell, styles.colTotal, styles.tableCellRight, dynamicStyles.tableCell]}>$0.00</Text>
                    </View>
                  );
                } else {
                  lotes.forEach(({ lote, productoNombre }: any, idx: number) => {
                    const rowStyle = idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : [styles.tableRow];
                    const proveedorNombre = proveedorIdToNombre[lote.proveedorId] || '—';
                    const proveedorTexto = productoNombre ? `${proveedorNombre} – ${productoNombre}` : proveedorNombre;
                    const total = (lote.cantidadDisponible || 0) * (lote.precioUnitario || 0);
                    const fechaStr = new Date(lote.fecha).toLocaleDateString('es-MX');

                    rows.push(
                      <View key={`lote-${lote.id ?? idx}`} style={rowStyle}>
                        <Text style={[styles.tableCell, styles.colProveedor, dynamicStyles.tableCell]}>{proveedorTexto}</Text>
                        <Text style={[styles.tableCell, styles.colFactura, dynamicStyles.tableCell]}>{lote.numeroFactura || '—'}</Text>
                        <Text style={[styles.tableCell, styles.colFecha, dynamicStyles.tableCell]}>{fechaStr}</Text>
                        <Text style={[styles.tableCell, styles.colCantidad, styles.tableCellRight, dynamicStyles.tableCell]}>{formatNumberPDF(lote.cantidadDisponible || 0, 2)}</Text>
                        <Text style={[styles.tableCell, styles.colPrecio, styles.tableCellRight, dynamicStyles.tableCell]}>{formatCurrencyPDF(lote.precioUnitario || 0)}</Text>
                        <Text style={[styles.tableCell, styles.colTotal, styles.tableCellRight, dynamicStyles.tableCell]}>{formatCurrencyPDF(total)}</Text>
                      </View>
                    );
                  });
                }

                rows.push(
                  <View style={styles.totalRow} key={`tipo-${tipoIndex}-totals`}>
                    <Text style={[styles.totalLabelCell, styles.colProveedor, dynamicStyles.totalLabel]}>Total Kg</Text>
                    <Text style={[styles.tableCell, styles.colFactura, dynamicStyles.tableCell]}></Text>
                    <Text style={[styles.tableCell, styles.colFecha, dynamicStyles.tableCell]}></Text>
                    <Text style={[styles.tableCell, styles.colCantidad, styles.tableCellRight, dynamicStyles.tableCell]}>{formatNumberPDF(tipo.totalExistencia || 0, 2)}</Text>
                    <Text style={[styles.totalLabelCell, styles.colPrecio, styles.tableCellRight, dynamicStyles.totalLabel]}>Total $</Text>
                    <Text style={[styles.tableCell, styles.colTotal, styles.tableCellRight, dynamicStyles.tableCell]}>{formatCurrencyPDF(tipo.valorTotal || 0)}</Text>
                  </View>
                );

                return rows;
              })()}
              </View>
            </View>
          </View>
        ))}

        <View style={styles.globalTotalsCard} wrap={false}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colProveedor, dynamicStyles.tableHeaderCell]}>Total general</Text>
            <Text style={[styles.tableHeaderCell, styles.colFactura, dynamicStyles.tableHeaderCell]}></Text>
            <Text style={[styles.tableHeaderCell, styles.colFecha, dynamicStyles.tableHeaderCell]}></Text>
            <Text style={[styles.tableHeaderCell, styles.colCantidad, styles.tableCellRight, dynamicStyles.tableHeaderCell]}>Kg</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrecio, styles.tableCellRight, dynamicStyles.tableHeaderCell]}>Etiqueta</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal, styles.tableCellRight, dynamicStyles.tableHeaderCell]}>Monto</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabelCell, styles.colProveedor, dynamicStyles.totalLabel]}>Total general kg</Text>
            <Text style={[styles.tableCell, styles.colFactura, dynamicStyles.tableCell]}></Text>
            <Text style={[styles.tableCell, styles.colFecha, dynamicStyles.tableCell]}></Text>
            <Text style={[styles.tableCell, styles.colCantidad, styles.tableCellRight, dynamicStyles.tableCell]}>{formatNumberPDF(safeTotal, 2)}</Text>
            <Text style={[styles.totalLabelCell, styles.colPrecio, styles.tableCellRight, dynamicStyles.totalLabel]}>Total $</Text>
            <Text style={[styles.tableCell, styles.colTotal, styles.tableCellRight, dynamicStyles.tableCell]}>{formatCurrencyPDF(safeValor)}</Text>
          </View>
        </View>

        <Text style={[styles.footer, dynamicStyles.footer]}>
          Reporte generado automáticamente - {fechaGeneracion}
        </Text>
      </Page>
    </Document>
    );
  } catch (error) {
    console.error('Error generando PDF:', error);
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Error en el reporte</Text>
            <Text style={styles.headerSubtitle}>No se pudieron procesar los datos</Text>
            <Text style={styles.headerDate}>Por favor, intenta nuevamente</Text>
          </View>
        </Page>
      </Document>
    );
  }
};

export function PDFReporteExistencias({ 
  existenciasPorTipo, 
  proveedores, 
  totalExistenciaGeneral, 
  valorTotalGeneral 
}: PDFReporteExistenciasProps) {
  const nombreArchivo = `Reporte_Existencias_${new Date().toISOString().split('T')[0]}.pdf`;
  const docKey = `${totalExistenciaGeneral}-${valorTotalGeneral}-${(existenciasPorTipo || []).map(t => (t.productos || []).length).join(',')}`;

  return (
    <PDFDownloadLink 
      document={
        <ReporteExistenciasPDF 
          key={docKey}
          existenciasPorTipo={existenciasPorTipo || []}
          proveedores={proveedores || []}
          totalExistenciaGeneral={totalExistenciaGeneral || 0}
          valorTotalGeneral={valorTotalGeneral || 0}
        />
      } 
      fileName={nombreArchivo}
    >
      {({ loading, error }) => (
        <Button 
          className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          size="sm"
          disabled={loading}
          title={error ? `Error: ${error}` : undefined}
        >
          <Download className="h-4 w-4" />
          {loading ? 'Generando...' : error ? 'Error en PDF' : 'Exportar PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

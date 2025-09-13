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
const formatNumberPDF = (number: number, decimals: number = 2): string => {
  if (!number || isNaN(number)) return '0.00';
  return number.toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};


// Estilos simplificados
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontSize: 10,
  },
  
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 10
  },
  
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center'
  },
  
  subtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center'
  },

  summaryContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    marginBottom: 20,
    borderRadius: 5
  },
  
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  
  summaryLabel: {
    fontSize: 10,
    color: '#666666'
  },
  
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold'
  },

  typeSection: {
    marginBottom: 20,
  },
  
  typeHeader: {
    backgroundColor: '#4a90e2',
    color: '#ffffff',
    padding: 8,
    marginBottom: 10
  },
  
  typeTitle: {
    fontSize: 12,
    fontWeight: 'bold'
  },

  table: {
    borderWidth: 1,
    borderColor: '#cccccc'
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc'
  },
  
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    minHeight: 20
  },
  
  tableRowAlt: {
    backgroundColor: '#f9f9f9'
  },
  
  tableCell: {
    fontSize: 8,
    paddingHorizontal: 3,
    paddingVertical: 2,
    textAlign: 'left'
  },
  
  tableCellRight: {
    textAlign: 'right'
  },
  
  tableCellBold: {
    fontWeight: 'bold'
  },

  // Anchos de columna para tabla de lotes
  col1: { width: '20%' }, // Proveedor
  col2: { width: '20%' }, // Producto
  col3: { width: '14%' }, // No. factura
  col4: { width: '14%' }, // Fecha
  col5: { width: '12%' }, // Kilos
  col6: { width: '10%' }, // Precio
  col7: { width: '10%' }, // Total

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999'
  }
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

// Componente del documento PDF simplificado
const ReporteExistenciasPDF = ({ 
  existenciasPorTipo, 
  proveedores, 
  totalExistenciaGeneral, 
  valorTotalGeneral 
}: PDFReporteExistenciasProps) => {
  
  // Validación de datos
  const datosValidos = Array.isArray(existenciasPorTipo) && 
                      Array.isArray(proveedores) && 
                      !isNaN(totalExistenciaGeneral) && 
                      !isNaN(valorTotalGeneral);

  if (!datosValidos) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Error en el Reporte</Text>
            <Text style={styles.subtitle}>Los datos proporcionados no son válidos</Text>
          </View>
        </Page>
      </Document>
    );
  }

  const fechaActual = new Date().toLocaleDateString('es-MX');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Existencias</Text>
          <Text style={styles.subtitle}>Generado el {fechaActual}</Text>
        </View>

        {/* Resumen General */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Resumen General</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total de Existencias:</Text>
            <Text style={styles.summaryValue}>{formatNumberPDF(totalExistenciaGeneral, 2)} Kg</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valor Total del Inventario:</Text>
            <Text style={styles.summaryValue}>{formatCurrencyPDF(valorTotalGeneral)}</Text>
          </View>
        </View>

        {/* Tipos de Productos */}
        {existenciasPorTipo.map((tipo, tipoIndex) => (
          <View key={`tipo-${tipoIndex}`} style={styles.typeSection} wrap={false}>
            {/* Header del Tipo */}
            <View style={styles.typeHeader}>
              <Text style={styles.typeTitle}>
                {tipo.tipoNombre || `Tipo ${tipoIndex + 1}`}
              </Text>
              <Text style={{ fontSize: 9, marginTop: 2 }}>
                {tipo.productos?.length || 0} producto(s) • {formatNumberPDF(tipo.totalExistencia, 2)} Kg • {formatCurrencyPDF(tipo.valorTotal)}
              </Text>
            </View>

            {/* Tabla de Lotes */}
            <View style={styles.table}>
              {/* Header de la tabla */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.col1, { fontWeight: 'bold' }]}>Proveedor</Text>
                <Text style={[styles.tableCell, styles.col2, { fontWeight: 'bold' }]}>Producto</Text>
                <Text style={[styles.tableCell, styles.col3, { fontWeight: 'bold' }]}>No. factura</Text>
                <Text style={[styles.tableCell, styles.col4, { fontWeight: 'bold' }]}>Fecha</Text>
                <Text style={[styles.tableCell, styles.col5, { fontWeight: 'bold', textAlign: 'right' }]}>Kilos</Text>
                <Text style={[styles.tableCell, styles.col6, { fontWeight: 'bold', textAlign: 'right' }]}>Precio</Text>
                <Text style={[styles.tableCell, styles.col7, { fontWeight: 'bold', textAlign: 'right' }]}>Total</Text>
              </View>

              {/* Filas de lotes */}
              {(() => {
                const proveedorIdToNombre: Record<number, string> = (proveedores || []).reduce((acc: Record<number, string>, p: any) => {
                  if (p && typeof p.id === 'number') acc[p.id] = p.nombre || `Proveedor ${p.id}`;
                  return acc;
                }, {});

                const lotes = (tipo.productos || []).flatMap((producto) =>
                  (producto.lotes || []).map((lote) => ({ lote, productoNombre: producto.nombre }))
                );

                return lotes.map(({ lote }, idx) => {
                  const rowStyle = idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : [styles.tableRow];
                  const proveedorNombre = proveedorIdToNombre[lote.proveedorId] || '—';
                  const total = (lote.cantidadDisponible || 0) * (lote.precioUnitario || 0);
                  const fechaStr = new Date(lote.fecha).toLocaleDateString('es-MX');

                  return (
                    <View key={`lote-${lote.id ?? idx}`} style={rowStyle}>
                      <Text style={[styles.tableCell, styles.col1]}>{proveedorNombre}</Text>
                      <Text style={[styles.tableCell, styles.col2]}>{(lotes[idx].productoNombre) || '—'}</Text>
                      <Text style={[styles.tableCell, styles.col3]}>{lote.numeroFactura || '—'}</Text>
                      <Text style={[styles.tableCell, styles.col4]}>{fechaStr}</Text>
                      <Text style={[styles.tableCell, styles.tableCellRight, styles.col5]}>{formatNumberPDF(lote.cantidadDisponible || 0, 2)}</Text>
                      <Text style={[styles.tableCell, styles.tableCellRight, styles.col6]}>{formatCurrencyPDF(lote.precioUnitario || 0)}</Text>
                      <Text style={[styles.tableCell, styles.tableCellRight, styles.col7]}>{formatCurrencyPDF(total)}</Text>
                    </View>
                  );
                });
              })()}
            </View>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          Reporte generado automáticamente - {fechaActual}
        </Text>
      </Page>
    </Document>
  );
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
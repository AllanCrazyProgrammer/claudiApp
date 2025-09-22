import { firestore } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { calcularTotal } from '@/lib/utils';

export interface SalidaFS {
  id?: string;
  productoId: string;
  loteId?: string; // en FIFO se llenará por cada segmento
  fecha: Timestamp;
  cantidad: number;
  precio: number;
  total: number;
  numeroFactura?: string;
  motivo?: string;
  fechaCreacion: Timestamp;
  ownerUid: string;
}

const SALIDAS = 'salidas';
const LOTES = 'lotes';
const PRODUCTOS = 'productos';

export const salidasRepo = {
  // Crea una salida simple contra un lote específico
  async crearSalidaDirecta(data: Omit<SalidaFS, 'id' | 'fechaCreacion' | 'total' | 'ownerUid'> & { fecha: Date; loteId: string }) {
    // Validación de datos requeridos
    if (!data.loteId || data.loteId.trim() === '') {
      throw new Error('Debe seleccionar un lote específico para realizar la salida');
    }
    
    if (!data.productoId || data.productoId.trim() === '') {
      throw new Error('El producto es requerido');
    }
    
    if (data.cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a cero');
    }
    
    if (data.precio < 0) {
      throw new Error('El precio no puede ser negativo');
    }
    
    const total = calcularTotal(data.cantidad, data.precio);

    // Primero obtenemos los lotes fuera de la transacción
    const lotesQ = query(
      collection(firestore, LOTES),
      where('productoId', '==', data.productoId)
    );
    const lotesSnapshot = await getDocs(lotesQ);
    const lotesIniciales = lotesSnapshot.docs.map(d => ({ 
      id: d.id, 
      ...d.data() 
    }));

    return await runTransaction(firestore, async (tx) => {
      // PASO 1: Leer el lote específico dentro de la transacción
      const loteRef = doc(firestore, LOTES, data.loteId);
      const loteSnap = await tx.get(loteRef);
      if (!loteSnap.exists()) throw new Error('Lote no encontrado');
      const lote = loteSnap.data() as any;
      if (lote.cantidadDisponible < data.cantidad) throw new Error('Cantidad insuficiente en el lote');

      // PASO 2: Calcular nuevos valores usando los datos iniciales
      // Simular el cambio en el lote específico
      const lotesSimulados = lotesIniciales.map((l: any) => {
        if (l.id === data.loteId) {
          return { ...l, cantidadDisponible: l.cantidadDisponible - data.cantidad };
        }
        return l;
      });

      const existenciaTotal = lotesSimulados.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0), 0);
      const valorTotal = lotesSimulados.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0) * Number(l.precioUnitario || 0), 0);
      const nuevoPrecioPromedio = existenciaTotal > 0 ? valorTotal / existenciaTotal : 0;

      // PASO 3: Todas las escrituras al final
      const salidaRef = doc(collection(firestore, SALIDAS));
      tx.set(salidaRef, {
        ...data,
        fecha: Timestamp.fromDate(data.fecha),
        total,
        ownerUid: 'shared', // Todas las salidas son compartidas
        fechaCreacion: serverTimestamp(),
      });

      // Actualizar lote
      tx.update(loteRef, { cantidadDisponible: lote.cantidadDisponible - data.cantidad });

      // Actualizar producto
      tx.update(doc(firestore, PRODUCTOS, data.productoId), {
        existenciaActual: existenciaTotal,
        precioPromedio: nuevoPrecioPromedio,
      });

      return salidaRef.id;
    });
  },

  // FIFO: divide en múltiples salidas contra varios lotes en orden por fecha
  async crearSalidaFIFO(data: Omit<SalidaFS, 'id' | 'fechaCreacion' | 'total' | 'loteId' | 'ownerUid'> & { fecha: Date }) {
    // Validación de datos requeridos
    if (!data.productoId || data.productoId.trim() === '') {
      throw new Error('El producto es requerido');
    }
    
    if (data.cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a cero');
    }
    
    if (data.precio < 0) {
      throw new Error('El precio no puede ser negativo');
    }
    
    // Primero obtenemos los lotes fuera de la transacción
    const lotesQ = query(
      collection(firestore, LOTES),
      where('productoId', '==', data.productoId)
    );
    const lotesSnapshot = await getDocs(lotesQ);
    const lotesTotales = lotesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
    // Filtrar y ordenar lotes disponibles por fecha (FIFO)
    const lotes = lotesTotales
      .filter((l: any) => l.cantidadDisponible > 0)
      .sort((a: any, b: any) => {
        const fechaA = a.fecha?.toMillis?.() || 0;
        const fechaB = b.fecha?.toMillis?.() || 0;
        return fechaA - fechaB;
      });

    if (lotes.length === 0) throw new Error('No hay lotes disponibles para este producto');

    const stockTotal = lotes.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0), 0);
    if (stockTotal < data.cantidad) throw new Error('Stock insuficiente');

    return await runTransaction(firestore, async (tx) => {
      // PASO 1: Verificar que los lotes no han cambiado
      for (const lote of lotes) {
        const loteRef = doc(firestore, LOTES, lote.id);
        const loteSnap = await tx.get(loteRef);
        if (!loteSnap.exists()) throw new Error(`Lote ${lote.id} no encontrado`);
        const loteActual = loteSnap.data() as any;
        if (loteActual.cantidadDisponible < (lote as any).cantidadDisponible) {
          throw new Error('El stock ha cambiado, por favor intenta de nuevo');
        }
      }

      // PASO 2: Planificar las salidas y calcular nuevos valores
      const salidasAProcesar: any[] = [];
      const actualizacionesLotes = new Map<string, number>();
      let cantidadRestante = data.cantidad;

      for (const lote of lotes) {
        if (cantidadRestante <= 0) break;
        const cantidadADescontar = Math.min(cantidadRestante, (lote as any).cantidadDisponible);

        salidasAProcesar.push({
          ...data,
          loteId: lote.id,
          cantidad: cantidadADescontar,
          fecha: Timestamp.fromDate(data.fecha),
          total: cantidadADescontar * data.precio,
          ownerUid: 'shared', // Todas las salidas son compartidas
          fechaCreacion: serverTimestamp(),
        });

        actualizacionesLotes.set(lote.id, (lote as any).cantidadDisponible - cantidadADescontar);
        cantidadRestante -= cantidadADescontar;
      }

      // Calcular existencia y precio promedio finales
      const lotesSimulados = lotesTotales.map((l: any) => {
        if (actualizacionesLotes.has(l.id)) {
          return { ...l, cantidadDisponible: actualizacionesLotes.get(l.id) };
        }
        return l;
      });

      const existenciaTotal = lotesSimulados.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0), 0);
      const valorTotal = lotesSimulados.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0) * Number(l.precioUnitario || 0), 0);
      const nuevoPrecioPromedio = existenciaTotal > 0 ? valorTotal / existenciaTotal : 0;

      // PASO 3: Todas las escrituras al final
      // Crear todas las salidas
      for (const salida of salidasAProcesar) {
        const salidaRef = doc(collection(firestore, SALIDAS));
        tx.set(salidaRef, salida);
      }

      // Actualizar todos los lotes
      for (const [loteId, nuevaCantidad] of actualizacionesLotes.entries()) {
        tx.update(doc(firestore, LOTES, loteId), {
          cantidadDisponible: nuevaCantidad,
        });
      }

      // Actualizar producto
      tx.update(doc(firestore, PRODUCTOS, data.productoId), {
        existenciaActual: existenciaTotal,
        precioPromedio: nuevoPrecioPromedio,
      });

      return true;
    });
  },

  async obtenerSalidas() {
    // Obtener todas las salidas compartidas (sin filtrar por ownerUid)
    const q = query(
      collection(firestore, SALIDAS),
      orderBy('fechaCreacion', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...(d.data() as any) })) as SalidaFS[];
  },

  async eliminarSalida(salidaId: string) {
    // Primero obtenemos la salida y su información
    const salidaRef = doc(firestore, SALIDAS, salidaId);
    const salidaDoc = await getDoc(salidaRef);
    if (!salidaDoc.exists()) throw new Error('Salida no encontrada');
    const salida = salidaDoc.data() as any;

    // Obtener todos los lotes del producto fuera de la transacción
    const lotesQ = query(
      collection(firestore, LOTES), 
      where('productoId', '==', salida.productoId),
      where('ownerUid', '==', salida.ownerUid)
    );
    const lotesSnapshot = await getDocs(lotesQ);
    const lotesTotales = lotesSnapshot.docs.map(d => ({ 
      id: d.id, 
      ...d.data() 
    }));

    return await runTransaction(firestore, async (tx) => {
      // PASO 1: Verificar que la salida y el lote existen dentro de la transacción
      const salidaSnapTx = await tx.get(salidaRef);
      if (!salidaSnapTx.exists()) throw new Error('Salida no encontrada');
      
      if (!salida.loteId) throw new Error('Salida sin lote asociado');
      const loteRef = doc(firestore, LOTES, salida.loteId);
      const loteSnap = await tx.get(loteRef);
      if (!loteSnap.exists()) throw new Error('Lote asociado no encontrado');
      const lote = loteSnap.data() as any;

      // PASO 2: Calcular nuevos valores
      // Simular la restauración del stock
      const lotesSimulados = lotesTotales.map((l: any) => {
        if (l.id === salida.loteId) {
          return { ...l, cantidadDisponible: Number(l.cantidadDisponible || 0) + Number(salida.cantidad || 0) };
        }
        return l;
      });

      const existenciaTotal = lotesSimulados.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0), 0);
      const valorTotal = lotesSimulados.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0) * Number(l.precioUnitario || 0), 0);
      const nuevoPrecioPromedio = existenciaTotal > 0 ? valorTotal / existenciaTotal : 0;

      // PASO 3: Todas las escrituras al final
      // Restaurar cantidad al lote
      tx.update(loteRef, { 
        cantidadDisponible: Number(lote.cantidadDisponible || 0) + Number(salida.cantidad || 0) 
      });

      // Eliminar salida
      tx.delete(salidaRef);

      // Actualizar producto
      tx.update(doc(firestore, PRODUCTOS, salida.productoId), {
        existenciaActual: existenciaTotal,
        precioPromedio: nuevoPrecioPromedio,
      });

      return true;
    });
  },
}




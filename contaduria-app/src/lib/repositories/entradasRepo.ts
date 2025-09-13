import { firestore } from '@/lib/firebase';
import { collection, doc, getDocs, orderBy, query, runTransaction, serverTimestamp, Timestamp, where } from 'firebase/firestore';

export interface EntradaFS {
  id?: string;
  productoId: string;
  proveedorId: string;
  fecha: Timestamp; // fecha efectiva de la entrada
  cantidad: number;
  precio: number;
  total: number;
  numeroFactura?: string;
  fechaCreacion: Timestamp;
  ownerUid: string;
}

const ENTRADAS = 'entradas';
const LOTES = 'lotes';
const PRODUCTOS = 'productos';

export const entradasRepo = {
  async crearEntrada(data: Omit<EntradaFS, 'id' | 'fechaCreacion' | 'total'>) {
    // total calculado
    const total = data.cantidad * data.precio;

    return await runTransaction(firestore, async (tx) => {
      // refs
      const entradasCol = collection(firestore, ENTRADAS);
      const entradaRef = doc(entradasCol);

      const lotesCol = collection(firestore, LOTES);
      const loteRef = doc(lotesCol);

      const productoRef = doc(firestore, PRODUCTOS, data.productoId);
      const productoSnap = await tx.get(productoRef);
      if (!productoSnap.exists()) {
        throw new Error('Producto no encontrado');
      }
      const producto = productoSnap.data() as any;

      // crear entrada
      const fechaTimestamp = typeof data.fecha === 'string' ? Timestamp.fromDate(new Date(data.fecha)) : Timestamp.fromDate(data.fecha as Date);
      tx.set(entradaRef, {
        productoId: data.productoId,
        proveedorId: data.proveedorId,
        fecha: fechaTimestamp,
        cantidad: data.cantidad,
        precio: data.precio,
        total,
        numeroFactura: data.numeroFactura ?? null,
        fechaCreacion: serverTimestamp(),
        ownerUid: data.ownerUid,
      });

      // crear lote
      tx.set(loteRef, {
        productoId: data.productoId,
        proveedorId: data.proveedorId,
        entradaId: entradaRef.id,
        fecha: fechaTimestamp,
        cantidadInicial: data.cantidad,
        cantidadDisponible: data.cantidad,
        precioUnitario: data.precio,
        numeroFactura: data.numeroFactura ?? null,
        fechaCreacion: serverTimestamp(),
        ownerUid: data.ownerUid,
      });

      // actualizar producto (existencia y promedio ponderado)
      const existenciaAnterior = Number(producto.existenciaActual ?? 0);
      const precioPromedioAnterior = Number(producto.precioPromedio ?? 0);
      const nuevaExistencia = existenciaAnterior + data.cantidad;
      const valorAnterior = existenciaAnterior * precioPromedioAnterior;
      const valorNuevo = data.cantidad * data.precio;
      const nuevoPrecioPromedio = nuevaExistencia > 0 ? (valorAnterior + valorNuevo) / nuevaExistencia : 0;

      tx.update(productoRef, {
        existenciaActual: nuevaExistencia,
        precioPromedio: nuevoPrecioPromedio,
      });

      return entradaRef.id;
    });
  },

  async obtenerEntradas(ownerUid: string) {
    // Evitar índice compuesto: ordenar por fechaCreacion y filtrar owner en cliente
    const q = query(
      collection(firestore, ENTRADAS),
      orderBy('fechaCreacion', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...(d.data() as any) }))
      .filter((e: any) => e.ownerUid === ownerUid) as EntradaFS[];
  },

  async eliminarEntrada(entradaId: string) {
    return await runTransaction(firestore, async (tx) => {
      // obtener entrada
      const entradaRef = doc(firestore, ENTRADAS, entradaId);
      const entradaSnap = await tx.get(entradaRef);
      if (!entradaSnap.exists()) throw new Error('Entrada no encontrada');
      const entrada = entradaSnap.data() as any;

      // obtener lote asociado
      const lotesQ = query(collection(firestore, LOTES), where('entradaId', '==', entradaId));
      const lotesSnap = await tx.get(lotesQ as any);
      if (lotesSnap.docs.length === 0) throw new Error('Lote asociado no encontrado');
      const loteDoc = lotesSnap.docs[0];
      const loteData = loteDoc.data() as any;

      // verificar salidas del lote
      const salidasQ = query(collection(firestore, SALIDAS), where('loteId', '==', loteDoc.id));
      const salidasSnap = await tx.get(salidasQ as any);
      if (salidasSnap.docs.length > 0) {
        throw new Error('No se puede eliminar la entrada porque el lote ya tiene salidas registradas');
      }

      // eliminar lote y entrada
      tx.delete(doc(firestore, LOTES, loteDoc.id));
      tx.delete(entradaRef);

      // recalcular producto desde lotes restantes
      const lotesProductoQ = query(collection(firestore, LOTES), where('productoId', '==', entrada.productoId));
      const lotesProductoSnap = await tx.get(lotesProductoQ as any);
      const lotesRestantes = lotesProductoSnap.docs.map((d: any) => d.data());
      const existenciaTotal = lotesRestantes.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0), 0);
      const valorTotal = lotesRestantes.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0) * Number(l.precioUnitario || 0), 0);
      const nuevoPrecioPromedio = existenciaTotal > 0 ? valorTotal / existenciaTotal : 0;

      tx.update(doc(firestore, PRODUCTOS, entrada.productoId), {
        existenciaActual: existenciaTotal,
        precioPromedio: nuevoPrecioPromedio,
      });

      return true;
    });
  },
}



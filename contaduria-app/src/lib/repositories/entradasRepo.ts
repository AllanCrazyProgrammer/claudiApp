import { firestore } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp, Timestamp, where } from 'firebase/firestore';

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
const SALIDAS = 'salidas';

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
    // Primero obtenemos todos los datos necesarios fuera de la transacción
    const entradaRef = doc(firestore, ENTRADAS, entradaId);
    const entradaSnap = await getDoc(entradaRef);
    if (!entradaSnap.exists()) throw new Error('Entrada no encontrada');
    const entrada = entradaSnap.data() as any;

    // obtener lote asociado
    const lotesQ = query(collection(firestore, LOTES), where('entradaId', '==', entradaId));
    const lotesSnap = await getDocs(lotesQ);
    if (lotesSnap.docs.length === 0) throw new Error('Lote asociado no encontrado');
    const loteDoc = lotesSnap.docs[0];
    const loteId = loteDoc.id;

    // verificar salidas del lote
    const salidasQ = query(collection(firestore, SALIDAS), where('loteId', '==', loteId));
    const salidasSnap = await getDocs(salidasQ);
    if (salidasSnap.docs.length > 0) {
      throw new Error('No se puede eliminar la entrada porque el lote ya tiene salidas registradas');
    }

    // obtener todos los lotes del producto para recalcular
    const lotesProductoQ = query(collection(firestore, LOTES), where('productoId', '==', entrada.productoId));
    const lotesProductoSnap = await getDocs(lotesProductoQ);
    const lotesRestantes = lotesProductoSnap.docs
      .filter(d => d.id !== loteId) // excluir el lote que vamos a eliminar
      .map(d => d.data());

    // calcular nuevos valores
    const existenciaTotal = lotesRestantes.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0), 0);
    const valorTotal = lotesRestantes.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0) * Number(l.precioUnitario || 0), 0);
    const nuevoPrecioPromedio = existenciaTotal > 0 ? valorTotal / existenciaTotal : 0;

    // Ahora ejecutamos la transacción con los datos obtenidos
    return await runTransaction(firestore, async (tx) => {
      // eliminar lote y entrada
      tx.delete(doc(firestore, LOTES, loteId));
      tx.delete(entradaRef);

      // actualizar producto
      tx.update(doc(firestore, PRODUCTOS, entrada.productoId), {
        existenciaActual: existenciaTotal,
        precioPromedio: nuevoPrecioPromedio,
      });

      return true;
    });
  },

  async actualizarEntrada(entradaId: string, datosActualizados: Partial<Omit<EntradaFS, 'id' | 'fechaCreacion' | 'ownerUid'>>) {
    // Primero obtenemos la entrada actual
    const entradaRef = doc(firestore, ENTRADAS, entradaId);
    const entradaSnap = await getDoc(entradaRef);
    if (!entradaSnap.exists()) throw new Error('Entrada no encontrada');
    const entradaOriginal = entradaSnap.data() as any;

    // Obtener lote asociado
    const lotesQ = query(collection(firestore, LOTES), where('entradaId', '==', entradaId));
    const lotesSnap = await getDocs(lotesQ);
    if (lotesSnap.docs.length === 0) throw new Error('Lote asociado no encontrado');
    const loteDoc = lotesSnap.docs[0];
    const loteOriginal = loteDoc.data() as any;

    // Calcular nuevo total si se actualizaron cantidad o precio
    const nuevaCantidad = datosActualizados.cantidad ?? entradaOriginal.cantidad;
    const nuevoPrecio = datosActualizados.precio ?? entradaOriginal.precio;
    const nuevoTotal = nuevaCantidad * nuevoPrecio;

    // Verificar si hay salidas del lote antes de permitir cambios que afecten la cantidad
    if (datosActualizados.cantidad && datosActualizados.cantidad !== entradaOriginal.cantidad) {
      const salidasQ = query(collection(firestore, SALIDAS), where('loteId', '==', loteDoc.id));
      const salidasSnap = await getDocs(salidasQ);
      
      const cantidadSalidas = salidasSnap.docs.reduce((total, doc) => {
        return total + (doc.data().cantidad || 0);
      }, 0);

      if (cantidadSalidas > 0 && datosActualizados.cantidad < cantidadSalidas) {
        throw new Error(`No se puede reducir la cantidad por debajo de ${cantidadSalidas} kg porque ya hay salidas registradas de este lote`);
      }
    }

    // Ejecutar transacción
    return await runTransaction(firestore, async (tx) => {
      // Actualizar entrada
      const fechaTimestamp = datosActualizados.fecha 
        ? (typeof datosActualizados.fecha === 'string' 
          ? Timestamp.fromDate(new Date(datosActualizados.fecha)) 
          : Timestamp.fromDate(datosActualizados.fecha as Date))
        : entradaOriginal.fecha;

      tx.update(entradaRef, {
        ...datosActualizados,
        fecha: fechaTimestamp,
        total: nuevoTotal
      });

      // Actualizar lote asociado
      tx.update(doc(firestore, LOTES, loteDoc.id), {
        fecha: fechaTimestamp,
        cantidadInicial: nuevaCantidad,
        cantidadDisponible: nuevaCantidad - (loteOriginal.cantidadInicial - loteOriginal.cantidadDisponible), // Mantener las salidas
        precioUnitario: nuevoPrecio,
        numeroFactura: datosActualizados.numeroFactura ?? loteOriginal.numeroFactura
      });

      // Recalcular producto desde todos los lotes
      const lotesProductoQ = query(collection(firestore, LOTES), where('productoId', '==', entradaOriginal.productoId));
      const lotesProductoSnap = await getDocs(lotesProductoQ);
      
      const lotes = lotesProductoSnap.docs.map(d => {
        const data = d.data();
        // Si es el lote que estamos editando, usar los nuevos valores
        if (d.id === loteDoc.id) {
          return {
            ...data,
            cantidadDisponible: nuevaCantidad - (loteOriginal.cantidadInicial - loteOriginal.cantidadDisponible),
            precioUnitario: nuevoPrecio
          };
        }
        return data;
      });

      const existenciaTotal = lotes.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0), 0);
      const valorTotal = lotes.reduce((t: number, l: any) => t + Number(l.cantidadDisponible || 0) * Number(l.precioUnitario || 0), 0);
      const nuevoPrecioPromedio = existenciaTotal > 0 ? valorTotal / existenciaTotal : 0;

      tx.update(doc(firestore, PRODUCTOS, entradaOriginal.productoId), {
        existenciaActual: existenciaTotal,
        precioPromedio: nuevoPrecioPromedio,
      });

      return true;
    });
  },
}



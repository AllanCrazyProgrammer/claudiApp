import { firestore } from '@/lib/firebase';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore';

export interface LoteFS {
  id?: string;
  productoId: string;
  proveedorId: string;
  entradaId: string;
  fecha: Timestamp;
  cantidadInicial: number;
  cantidadDisponible: number;
  precioUnitario: number;
  numeroFactura?: string;
  fechaCreacion: Timestamp;
  ownerUid: string;
}

const COLLECTION_NAME = 'lotes';

export const lotesRepo = {
  async crearLote(data: Omit<LoteFS, 'id' | 'fechaCreacion' | 'ownerUid'>) {
    const ref = await addDoc(collection(firestore, COLLECTION_NAME), {
      ...data,
      ownerUid: 'shared', // Todos los lotes son compartidos
      fechaCreacion: serverTimestamp(),
    });
    return ref.id;
  },

  async actualizarLote(id: string, data: Partial<Omit<LoteFS, 'id' | 'fechaCreacion' | 'ownerUid'>>) {
    await updateDoc(doc(firestore, COLLECTION_NAME, id), data);
  },

  async obtenerLotesPorProducto(productoId: string) {
    // Obtener todos los lotes del producto (sin filtrar por ownerUid)
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where('productoId', '==', productoId)
    );
    const snap = await getDocs(q);
    const lotes = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as LoteFS[];
    return lotes
      .filter(l => {
        const cantidad = Number(l.cantidadDisponible) || 0;
        // Filtrar lotes que al formatearse a 2 decimales sean mayor a 0.00
        return Math.round(cantidad * 100) / 100 > 0;
      })
      .sort((a, b) => (a.fecha as any).toMillis?.() - (b.fecha as any).toMillis?.());
  },

  async obtenerLotesConExistenciaPorProveedor(proveedorId: string) {
    // Obtener todos los lotes del proveedor (sin filtrar por ownerUid)
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where('proveedorId', '==', proveedorId)
    );
    const snap = await getDocs(q);
    const lotes = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as LoteFS[];
    return lotes
      .filter(l => {
        const cantidad = Number(l.cantidadDisponible) || 0;
        // Filtrar lotes que al formatearse a 2 decimales sean mayor a 0.00
        return Math.round(cantidad * 100) / 100 > 0;
      })
      .sort((a, b) => (a.fecha as any).toMillis?.() - (b.fecha as any).toMillis?.());
  },
}



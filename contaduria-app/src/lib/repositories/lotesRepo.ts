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
  async crearLote(data: Omit<LoteFS, 'id' | 'fechaCreacion'>) {
    const ref = await addDoc(collection(firestore, COLLECTION_NAME), {
      ...data,
      fechaCreacion: serverTimestamp(),
    });
    return ref.id;
  },

  async actualizarLote(id: string, data: Partial<Omit<LoteFS, 'id' | 'fechaCreacion' | 'ownerUid'>>) {
    await updateDoc(doc(firestore, COLLECTION_NAME, id), data);
  },

  async obtenerLotesPorProducto(ownerUid: string, productoId: string) {
    // Evitar índices compuestos: solo filtramos por ownerUid y productoId en Firestore
    // y hacemos filtro/sort en el cliente
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where('ownerUid', '==', ownerUid),
      where('productoId', '==', productoId)
    );
    const snap = await getDocs(q);
    const lotes = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as LoteFS[];
    return lotes
      .filter(l => (l.cantidadDisponible as any) > 0)
      .sort((a, b) => (a.fecha as any).toMillis?.() - (b.fecha as any).toMillis?.());
  },

  async obtenerLotesConExistenciaPorProveedor(ownerUid: string, proveedorId: string) {
    // Evitar índices: filtrar por ownerUid y proveedorId en Firestore, resto en cliente
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where('ownerUid', '==', ownerUid),
      where('proveedorId', '==', proveedorId)
    );
    const snap = await getDocs(q);
    const lotes = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as LoteFS[];
    return lotes
      .filter(l => (l.cantidadDisponible as any) > 0)
      .sort((a, b) => (a.fecha as any).toMillis?.() - (b.fecha as any).toMillis?.());
  },
}



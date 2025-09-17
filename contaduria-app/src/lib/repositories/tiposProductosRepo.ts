import { firestore } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';

export interface TipoProductoFS {
  id?: string;
  nombre: string;
  fechaCreacion: Timestamp;
  activo: boolean;
  ownerUid: string; // para scope por usuario/empresa
}

const COLLECTION_NAME = 'tiposProductos';

export const tiposProductosRepo = {
  async crearTipoProducto(data: Omit<TipoProductoFS, 'id' | 'fechaCreacion' | 'ownerUid'>) {
    const ref = await addDoc(collection(firestore, COLLECTION_NAME), {
      ...data,
      ownerUid: 'shared', // Todos los tipos son compartidos
      fechaCreacion: serverTimestamp(),
    });
    return ref.id;
  },

  async obtenerTiposProductos() {
    const q = query(
      collection(firestore, COLLECTION_NAME)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<TipoProductoFS, 'id'>) }))
      .filter(tp => tp.activo === true)
      .sort((a, b) => {
        const ta = (a.fechaCreacion as any)?.toMillis?.() ?? 0;
        const tb = (b.fechaCreacion as any)?.toMillis?.() ?? 0;
        return ta - tb; // ascendente por fecha de creación
      });
  },

  async obtenerTipoProductoPorId(id: string) {
    const ref = doc(firestore, COLLECTION_NAME, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return undefined;
    return { id: snap.id, ...(snap.data() as Omit<TipoProductoFS, 'id'>) };
  },

  async actualizarTipoProducto(id: string, data: Partial<Omit<TipoProductoFS, 'id' | 'fechaCreacion' | 'ownerUid'>>) {
    const ref = doc(firestore, COLLECTION_NAME, id);
    await updateDoc(ref, data);
  },

  async eliminarTipoProducto(id: string) {
    const ref = doc(firestore, COLLECTION_NAME, id);
    await updateDoc(ref, { activo: false }); // Soft delete
  },

  async eliminarTipoProductoPermanente(id: string) {
    const ref = doc(firestore, COLLECTION_NAME, id);
    await deleteDoc(ref);
  }
};

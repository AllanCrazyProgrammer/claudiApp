import { firestore } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';

export interface ProveedorFS {
  id?: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fechaCreacion: Timestamp;
  activo: boolean;
  ownerUid: string; // para scope por usuario/empresa
}

const COLLECTION_NAME = 'proveedores';

export const proveedoresRepo = {
  async crearProveedor(data: Omit<ProveedorFS, 'id' | 'fechaCreacion' | 'ownerUid'>) {
    const ref = await addDoc(collection(firestore, COLLECTION_NAME), {
      ...data,
      ownerUid: 'shared', // Todos los proveedores son compartidos
      fechaCreacion: serverTimestamp(),
    });
    return ref.id;
  },

  async obtenerProveedores() {
    const q = query(
      collection(firestore, COLLECTION_NAME)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<ProveedorFS, 'id'>) }))
      .filter(p => p.activo === true)
      .sort((a, b) => {
        const ta = (a.fechaCreacion as any)?.toMillis?.() ?? 0;
        const tb = (b.fechaCreacion as any)?.toMillis?.() ?? 0;
        return tb - ta;
      });
  },

  async obtenerProveedorPorId(id: string) {
    const ref = doc(firestore, COLLECTION_NAME, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return undefined;
    return { id: snap.id, ...(snap.data() as Omit<ProveedorFS, 'id'>) };
  },

  async actualizarProveedor(id: string, data: Partial<Omit<ProveedorFS, 'id' | 'fechaCreacion' | 'ownerUid'>>) {
    const ref = doc(firestore, COLLECTION_NAME, id);
    await updateDoc(ref, data);
  },

  async eliminarProveedor(id: string) {
    const ref = doc(firestore, COLLECTION_NAME, id);
    await deleteDoc(ref);
  },

  // utilitario: desactivar en lote por owner
  async desactivarTodosPorOwner(ownerUid: string) {
    const q = query(collection(firestore, COLLECTION_NAME));
    const snap = await getDocs(q);
    const batch = writeBatch(firestore);
    snap.docs.filter(d => (d.data() as any).ownerUid === ownerUid).forEach(d => {
      batch.update(d.ref, { activo: false });
    });
    await batch.commit();
  }
}



import { firestore } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore';

export interface ProductoFS {
  id?: string;
  nombre: string;
  descripcion?: string;
  unidadMedida: string;
  tipoCorte?: string;
  proveedorId?: string;
  existenciaActual: number;
  precioPromedio: number;
  fechaCreacion: Timestamp;
  activo: boolean;
  ownerUid: string;
}

const COLLECTION_NAME = 'productos';

export const productosRepo = {
  async crearProducto(data: Omit<ProductoFS, 'id' | 'fechaCreacion' | 'existenciaActual' | 'precioPromedio'>) {
    const ref = await addDoc(collection(firestore, COLLECTION_NAME), {
      ...data,
      existenciaActual: 0,
      precioPromedio: 0,
      fechaCreacion: serverTimestamp(),
    });
    return ref.id;
  },

  async obtenerProductos(ownerUid: string) {
    // Para evitar cualquier índice compuesto, solo filtramos por ownerUid
    // y hacemos el orden/filtrado restante en el cliente.
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where('ownerUid', '==', ownerUid)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<ProductoFS, 'id'>) }))
      .filter(p => p.activo === true)
      .sort((a, b) => {
        const ta = (a.fechaCreacion as any)?.toMillis?.() ?? 0;
        const tb = (b.fechaCreacion as any)?.toMillis?.() ?? 0;
        return tb - ta; // desc
      });
  },

  async obtenerProductoPorId(id: string) {
    const ref = doc(firestore, COLLECTION_NAME, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return undefined;
    return { id: snap.id, ...(snap.data() as Omit<ProductoFS, 'id'>) };
  },

  async actualizarProducto(id: string, data: Partial<Omit<ProductoFS, 'id' | 'fechaCreacion' | 'ownerUid'>>) {
    const ref = doc(firestore, COLLECTION_NAME, id);
    await updateDoc(ref, data);
  },

  async eliminarProducto(id: string) {
    const ref = doc(firestore, COLLECTION_NAME, id);
    await deleteDoc(ref);
  },
}



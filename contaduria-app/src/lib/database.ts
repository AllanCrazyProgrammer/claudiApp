import Dexie from 'dexie';

// Interfaces para las tablas del sistema de inventario
export interface Proveedor {
  id?: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fechaCreacion: Date;
  activo: boolean;
}

export interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string;
  unidadMedida: string; // pz, kg, lt, etc.
  tipoCorte?: 'sc' | 'cc'; // s/c (sin cabeza) o c/c (con cabeza)
  existenciaActual: number;
  precioPromedio: number; // Se calcula automáticamente con las entradas
  fechaCreacion: Date;
  activo: boolean;
}

export interface Entrada {
  id?: number;
  productoId: number;
  proveedorId: number;
  fecha: Date;
  cantidad: number;
  precio: number;
  total: number;
  numeroFactura?: string;
  fechaCreacion: Date;
}

export interface Salida {
  id?: number;
  productoId: number;
  fecha: Date;
  cantidad: number;
  precio: number;
  total: number;
  numeroFactura?: string;
  motivo?: string; // venta, merma, donación, etc.
  fechaCreacion: Date;
}

// Clase de la base de datos
export class InventarioDB extends Dexie {
  proveedores!: Dexie.Table<Proveedor>;
  productos!: Dexie.Table<Producto>;
  entradas!: Dexie.Table<Entrada>;
  salidas!: Dexie.Table<Salida>;

  constructor() {
    super('InventarioDB');
    
    this.version(1).stores({
      proveedores: '++id, nombre, contacto, fechaCreacion, activo',
      productos: '++id, nombre, existenciaActual, fechaCreacion, activo',
      entradas: '++id, productoId, proveedorId, fecha, cantidad, precio, fechaCreacion',
      salidas: '++id, productoId, fecha, cantidad, precio, fechaCreacion'
    });
  }
}

// Instancia única de la base de datos
export const db = new InventarioDB();

// Funciones de utilidad para la base de datos
export const dbUtils = {
  // Proveedores
  async crearProveedor(proveedor: Omit<Proveedor, 'id' | 'fechaCreacion'>): Promise<number> {
    return await db.proveedores.add({
      ...proveedor,
      fechaCreacion: new Date()
    });
  },

  async obtenerProveedores(): Promise<Proveedor[]> {
    return await db.proveedores.filter(proveedor => proveedor.activo === true).toArray();
  },

  async obtenerProveedorPorId(id: number): Promise<Proveedor | undefined> {
    return await db.proveedores.get(id);
  },

  async actualizarProveedor(id: number, datosActualizados: Partial<Omit<Proveedor, 'id' | 'fechaCreacion'>>): Promise<void> {
    await db.proveedores.update(id, datosActualizados);
  },

  async eliminarProveedor(id: number): Promise<void> {
    await db.proveedores.update(id, { activo: false });
  },

  // Productos
  async crearProducto(producto: Omit<Producto, 'id' | 'fechaCreacion' | 'existenciaActual' | 'precioPromedio'>): Promise<number> {
    return await db.productos.add({
      ...producto,
      unidadMedida: producto.unidadMedida || 'kg', // Por defecto kg
      existenciaActual: 0,
      precioPromedio: 0,
      fechaCreacion: new Date()
    });
  },

  async obtenerProductos(): Promise<Producto[]> {
    return await db.productos.filter(producto => producto.activo === true).toArray();
  },

  async obtenerProductoPorId(id: number): Promise<Producto | undefined> {
    return await db.productos.get(id);
  },

  async actualizarExistenciaProducto(productoId: number, nuevaExistencia: number, nuevoPrecioPromedio: number): Promise<void> {
    await db.productos.update(productoId, {
      existenciaActual: nuevaExistencia,
      precioPromedio: nuevoPrecioPromedio
    });
  },

  async actualizarProducto(id: number, datosActualizados: Partial<Omit<Producto, 'id' | 'fechaCreacion'>>): Promise<void> {
    await db.productos.update(id, datosActualizados);
  },

  async eliminarProducto(id: number): Promise<void> {
    await db.productos.update(id, { activo: false });
  },

  // Entradas
  async crearEntrada(entrada: Omit<Entrada, 'id' | 'fechaCreacion' | 'total'>): Promise<number> {
    const total = entrada.cantidad * entrada.precio;
    
    // Crear la entrada
    const entradaId = await db.entradas.add({
      ...entrada,
      total,
      fechaCreacion: new Date()
    });

    // Actualizar existencia y precio promedio del producto
    const producto = await db.productos.get(entrada.productoId);
    if (producto) {
      const nuevaExistencia = producto.existenciaActual + entrada.cantidad;
      const valorAnterior = producto.existenciaActual * producto.precioPromedio;
      const valorNuevo = entrada.cantidad * entrada.precio;
      const nuevoPrecioPromedio = nuevaExistencia > 0 ? (valorAnterior + valorNuevo) / nuevaExistencia : 0;
      
      await this.actualizarExistenciaProducto(entrada.productoId, nuevaExistencia, nuevoPrecioPromedio);
    }

    return entradaId;
  },

  async obtenerEntradas(): Promise<Entrada[]> {
    return await db.entradas.orderBy('fechaCreacion').reverse().toArray();
  },

  async obtenerEntradasPorProducto(productoId: number): Promise<Entrada[]> {
    return await db.entradas.where('productoId').equals(productoId).toArray();
  },

  // Salidas
  async crearSalida(salida: Omit<Salida, 'id' | 'fechaCreacion' | 'total'>): Promise<number> {
    const producto = await db.productos.get(salida.productoId);
    
    if (!producto) {
      throw new Error('Producto no encontrado');
    }
    
    if (producto.existenciaActual < salida.cantidad) {
      throw new Error('Existencia insuficiente');
    }

    const total = salida.cantidad * salida.precio;
    
    // Crear la salida
    const salidaId = await db.salidas.add({
      ...salida,
      total,
      fechaCreacion: new Date()
    });

    // Actualizar existencia del producto (mantener precio promedio)
    const nuevaExistencia = producto.existenciaActual - salida.cantidad;
    await this.actualizarExistenciaProducto(salida.productoId, nuevaExistencia, producto.precioPromedio);

    return salidaId;
  },

  async obtenerSalidas(): Promise<Salida[]> {
    return await db.salidas.orderBy('fechaCreacion').reverse().toArray();
  },

  async obtenerSalidasPorProducto(productoId: number): Promise<Salida[]> {
    return await db.salidas.where('productoId').equals(productoId).toArray();
  },

  // Reportes
  async obtenerReporteExistencias(): Promise<Array<Producto & { valorInventario: number }>> {
    const productos = await this.obtenerProductos();
    return productos.map(producto => ({
      ...producto,
      valorInventario: producto.existenciaActual * producto.precioPromedio
    }));
  },

  async obtenerMovimientosPorPeriodo(fechaInicio: Date, fechaFin: Date) {
    const entradas = await db.entradas
      .where('fecha')
      .between(fechaInicio, fechaFin)
      .toArray();

    const salidas = await db.salidas
      .where('fecha')
      .between(fechaInicio, fechaFin)
      .toArray();

    const totalEntradas = entradas.reduce((sum, e) => sum + e.total, 0);
    const totalSalidas = salidas.reduce((sum, s) => sum + s.total, 0);

    return {
      entradas: entradas.length,
      salidas: salidas.length,
      valorEntradas: totalEntradas,
      valorSalidas: totalSalidas,
      diferencia: totalEntradas - totalSalidas
    };
  }
};

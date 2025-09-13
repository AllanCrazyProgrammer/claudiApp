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
  tipoCorte?: string; // Código del tipo de producto (configurable por el usuario)
  proveedorId?: number; // ID del proveedor principal de este producto
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

export interface LoteProducto {
  id?: number;
  productoId: number;
  proveedorId: number;
  entradaId: number; // Referencia a la entrada que creó este lote
  fecha: Date; // Fecha de la entrada que creó el lote
  cantidadInicial: number; // Cantidad original del lote
  cantidadDisponible: number; // Cantidad actual disponible
  precioUnitario: number; // Precio unitario de este lote específico
  numeroFactura?: string;
  fechaCreacion: Date;
}

export interface Salida {
  id?: number;
  productoId: number;
  loteId?: number; // Referencia al lote del que se hizo la salida
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
  lotes!: Dexie.Table<LoteProducto>;
  salidas!: Dexie.Table<Salida>;

  constructor() {
    super('InventarioDB');
    
    // Versión 1 - Esquema original
    this.version(1).stores({
      proveedores: '++id, nombre, contacto, fechaCreacion, activo',
      productos: '++id, nombre, proveedorId, existenciaActual, fechaCreacion, activo',
      entradas: '++id, productoId, proveedorId, fecha, cantidad, precio, fechaCreacion',
      salidas: '++id, productoId, fecha, cantidad, precio, fechaCreacion'
    });

    // Versión 2 - Agregar tabla de lotes y actualizar salidas
    this.version(2).stores({
      proveedores: '++id, nombre, contacto, fechaCreacion, activo',
      productos: '++id, nombre, proveedorId, existenciaActual, fechaCreacion, activo',
      entradas: '++id, productoId, proveedorId, fecha, cantidad, precio, fechaCreacion',
      lotes: '++id, productoId, proveedorId, entradaId, fecha, cantidadDisponible, precioUnitario, fechaCreacion',
      salidas: '++id, productoId, loteId, fecha, cantidad, precio, fechaCreacion'
    }).upgrade(async (tx) => {
      // Migrar datos existentes a la nueva estructura de lotes
      const entradas = await (tx.table('entradas') as Dexie.Table<Entrada>).toArray();
      const lotesPromises = entradas.map((entrada: Entrada) => {
        return (tx.table('lotes') as Dexie.Table<LoteProducto>).add({
          productoId: entrada.productoId,
          proveedorId: entrada.proveedorId,
          entradaId: entrada.id!,
          fecha: entrada.fecha,
          cantidadInicial: entrada.cantidad,
          cantidadDisponible: entrada.cantidad, // Inicialmente toda la cantidad está disponible
          precioUnitario: entrada.precio,
          numeroFactura: entrada.numeroFactura,
          fechaCreacion: entrada.fechaCreacion
        });
      });
      return Promise.all(lotesPromises);
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

  async obtenerProductosPorProveedor(proveedorId: number): Promise<Producto[]> {
    return await db.productos.filter(producto => 
      producto.activo === true && producto.proveedorId === proveedorId
    ).toArray();
  },

  async obtenerProductosConHistorialDeProveedor(proveedorId: number): Promise<Producto[]> {
    // Obtener productos que han tenido entradas de este proveedor
    const entradas = await db.entradas.where('proveedorId').equals(proveedorId).toArray();
    const productosIds = [...new Set(entradas.map(e => e.productoId))];
    
    // Obtener los productos activos que tienen historial con este proveedor
    const productos = await db.productos.where('id').anyOf(productosIds).toArray();
    return productos.filter(producto => producto.activo === true);
  },

  async obtenerProductosConExistencia(): Promise<Producto[]> {
    return await db.productos.filter(producto => 
      producto.activo === true && producto.existenciaActual > 0
    ).toArray();
  },

  async obtenerProductosConHistorialDeProveedorYExistencia(proveedorId: number): Promise<Producto[]> {
    // Obtener productos que han tenido entradas de este proveedor y tienen existencia
    const entradas = await db.entradas.where('proveedorId').equals(proveedorId).toArray();
    const productosIds = [...new Set(entradas.map(e => e.productoId))];
    
    // Obtener los productos activos que tienen historial con este proveedor y existencia > 0
    const productos = await db.productos.where('id').anyOf(productosIds).toArray();
    return productos.filter(producto => 
      producto.activo === true && producto.existenciaActual > 0
    );
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

    // Crear el lote correspondiente a esta entrada
    await db.lotes.add({
      productoId: entrada.productoId,
      proveedorId: entrada.proveedorId,
      entradaId: entradaId,
      fecha: entrada.fecha,
      cantidadInicial: entrada.cantidad,
      cantidadDisponible: entrada.cantidad,
      precioUnitario: entrada.precio,
      numeroFactura: entrada.numeroFactura,
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

  async actualizarEntrada(entradaId: number, datosActualizados: Partial<Omit<Entrada, 'id' | 'fechaCreacion' | 'total'>>): Promise<void> {
    // Obtener la entrada actual
    const entradaActual = await db.entradas.get(entradaId);
    if (!entradaActual) {
      throw new Error('Entrada no encontrada');
    }

    // Obtener el lote asociado
    const lote = await db.lotes.where('entradaId').equals(entradaId).first();
    if (!lote) {
      throw new Error('Lote asociado no encontrado');
    }

    // Verificar si el lote tiene salidas y no se puede modificar la cantidad
    const salidasDelLote = await db.salidas.where('loteId').equals(lote.id!).toArray();
    if (salidasDelLote.length > 0 && datosActualizados.cantidad && datosActualizados.cantidad !== entradaActual.cantidad) {
      throw new Error('No se puede modificar la cantidad porque el lote ya tiene salidas registradas');
    }

    // Calcular nuevo total si se actualizan cantidad o precio
    const nuevaCantidad = datosActualizados.cantidad ?? entradaActual.cantidad;
    const nuevoPrecio = datosActualizados.precio ?? entradaActual.precio;
    const nuevoTotal = nuevaCantidad * nuevoPrecio;

    // Actualizar la entrada
    await db.entradas.update(entradaId, {
      ...datosActualizados,
      total: nuevoTotal
    });

    // Actualizar el lote asociado
    await db.lotes.update(lote.id!, {
      cantidadInicial: nuevaCantidad,
      cantidadDisponible: lote.cantidadDisponible + (nuevaCantidad - entradaActual.cantidad),
      precioUnitario: nuevoPrecio,
      numeroFactura: datosActualizados.numeroFactura ?? lote.numeroFactura
    });

    // Recalcular existencias del producto
    const lotesDelProducto = await this.obtenerLotesPorProducto(entradaActual.productoId);
    const nuevaExistencia = lotesDelProducto.reduce((total, lote) => total + lote.cantidadDisponible, 0);
    
    // Recalcular precio promedio ponderado
    const valorTotal = lotesDelProducto.reduce((total, lote) => 
      total + (lote.cantidadDisponible * lote.precioUnitario), 0);
    const nuevoPrecioPromedio = nuevaExistencia > 0 ? valorTotal / nuevaExistencia : 0;
    
    await this.actualizarExistenciaProducto(entradaActual.productoId, nuevaExistencia, nuevoPrecioPromedio);
  },

  async eliminarEntrada(entradaId: number): Promise<void> {
    // Obtener la entrada antes de eliminarla
    const entrada = await db.entradas.get(entradaId);
    if (!entrada) {
      throw new Error('Entrada no encontrada');
    }

    // Obtener el lote asociado a esta entrada
    const lote = await db.lotes.where('entradaId').equals(entradaId).first();
    if (!lote) {
      throw new Error('Lote asociado no encontrado');
    }

    // Verificar si el lote tiene salidas asociadas
    const salidasDelLote = await db.salidas.where('loteId').equals(lote.id!).toArray();
    if (salidasDelLote.length > 0) {
      throw new Error('No se puede eliminar la entrada porque ya tiene salidas registradas');
    }

    // Eliminar el lote primero
    await db.lotes.delete(lote.id!);
    
    // Eliminar la entrada
    await db.entradas.delete(entradaId);

    // Recalcular existencias del producto
    const lotesRestantes = await this.obtenerLotesPorProducto(entrada.productoId);
    const nuevaExistencia = lotesRestantes.reduce((total, lote) => total + lote.cantidadDisponible, 0);
    
    // Recalcular precio promedio ponderado
    const valorTotal = lotesRestantes.reduce((total, lote) => 
      total + (lote.cantidadDisponible * lote.precioUnitario), 0);
    const nuevoPrecioPromedio = nuevaExistencia > 0 ? valorTotal / nuevaExistencia : 0;
    
    await this.actualizarExistenciaProducto(entrada.productoId, nuevaExistencia, nuevoPrecioPromedio);
  },

  // Lotes
  async obtenerLotesPorProducto(productoId: number): Promise<LoteProducto[]> {
    return await db.lotes
      .where('productoId')
      .equals(productoId)
      .filter(lote => lote.cantidadDisponible > 0)
      .sortBy('fecha'); // Ordenar por fecha (FIFO)
  },

  async obtenerLotesPorProveedor(proveedorId: number): Promise<LoteProducto[]> {
    return await db.lotes
      .where('proveedorId')
      .equals(proveedorId)
      .filter(lote => lote.cantidadDisponible > 0)
      .sortBy('fecha');
  },

  async obtenerLotesConExistenciaPorProveedor(proveedorId: number): Promise<LoteProducto[]> {
    return await db.lotes
      .where('proveedorId')
      .equals(proveedorId)
      .filter(lote => lote.cantidadDisponible > 0)
      .sortBy('fecha');
  },

  // Salidas
  async crearSalida(salida: Omit<Salida, 'id' | 'fechaCreacion' | 'total' | 'loteId'> & { loteId: number }): Promise<number> {
    const lote = await db.lotes.get(salida.loteId);
    
    if (!lote) {
      throw new Error('Lote no encontrado');
    }
    
    if (lote.cantidadDisponible < salida.cantidad) {
      throw new Error('Cantidad insuficiente en el lote');
    }

    const total = salida.cantidad * salida.precio;
    
    // Crear la salida
    const salidaId = await db.salidas.add({
      ...salida,
      total,
      fechaCreacion: new Date()
    });

    // Actualizar la cantidad disponible del lote
    await db.lotes.update(salida.loteId, {
      cantidadDisponible: lote.cantidadDisponible - salida.cantidad
    });

    // Recalcular existencia total del producto
    const lotesDelProducto = await this.obtenerLotesPorProducto(salida.productoId);
    const nuevaExistencia = lotesDelProducto.reduce((total, lote) => total + lote.cantidadDisponible, 0);
    
    // Recalcular precio promedio ponderado
    const valorTotal = lotesDelProducto.reduce((total, lote) => 
      total + (lote.cantidadDisponible * lote.precioUnitario), 0);
    const nuevoPrecioPromedio = nuevaExistencia > 0 ? valorTotal / nuevaExistencia : 0;
    
    await this.actualizarExistenciaProducto(salida.productoId, nuevaExistencia, nuevoPrecioPromedio);

    return salidaId;
  },

  // Función auxiliar para crear salida con FIFO automático
  async crearSalidaFIFO(salida: Omit<Salida, 'id' | 'fechaCreacion' | 'total' | 'loteId'>): Promise<number> {
    // Obtener lotes disponibles ordenados por fecha (FIFO)
    const lotes = await this.obtenerLotesPorProducto(salida.productoId);
    
    if (lotes.length === 0) {
      throw new Error('No hay lotes disponibles para este producto');
    }

    // Verificar que hay suficiente stock total
    const stockTotal = lotes.reduce((total, lote) => total + lote.cantidadDisponible, 0);
    if (stockTotal < salida.cantidad) {
      throw new Error('Stock insuficiente');
    }

    let cantidadRestante = salida.cantidad;
    const salidasCreadas: number[] = [];

    // Procesar lotes en orden FIFO
    for (const lote of lotes) {
      if (cantidadRestante <= 0) break;

      const cantidadADescontar = Math.min(cantidadRestante, lote.cantidadDisponible);
      
      // Crear salida para este lote
      const salidaId = await this.crearSalida({
        ...salida,
        loteId: lote.id!,
        cantidad: cantidadADescontar
      });

      salidasCreadas.push(salidaId);
      cantidadRestante -= cantidadADescontar;
    }

    return salidasCreadas[0]; // Retornar el ID de la primera salida
  },

  async obtenerSalidas(): Promise<Salida[]> {
    return await db.salidas.orderBy('fechaCreacion').reverse().toArray();
  },

  async obtenerSalidasPorProducto(productoId: number): Promise<Salida[]> {
    return await db.salidas.where('productoId').equals(productoId).toArray();
  },

  async actualizarSalida(salidaId: number, datosActualizados: Partial<Omit<Salida, 'id' | 'fechaCreacion' | 'total' | 'loteId' | 'productoId'>>): Promise<void> {
    // Obtener la salida actual
    const salidaActual = await db.salidas.get(salidaId);
    if (!salidaActual) {
      throw new Error('Salida no encontrada');
    }

    // Obtener el lote asociado
    const lote = await db.lotes.get(salidaActual.loteId!);
    if (!lote) {
      throw new Error('Lote asociado no encontrado');
    }

    // Si se actualiza la cantidad, verificar disponibilidad
    if (datosActualizados.cantidad && datosActualizados.cantidad !== salidaActual.cantidad) {
      const cantidadDisponibleConRestauracion = lote.cantidadDisponible + salidaActual.cantidad;
      
      if (datosActualizados.cantidad > cantidadDisponibleConRestauracion) {
        throw new Error('Cantidad insuficiente en el lote para esta actualización');
      }

      // Actualizar cantidad disponible en el lote
      await db.lotes.update(salidaActual.loteId!, {
        cantidadDisponible: cantidadDisponibleConRestauracion - datosActualizados.cantidad
      });
    }

    // Calcular nuevo total
    const nuevaCantidad = datosActualizados.cantidad ?? salidaActual.cantidad;
    const nuevoPrecio = datosActualizados.precio ?? salidaActual.precio;
    const nuevoTotal = nuevaCantidad * nuevoPrecio;

    // Actualizar la salida
    await db.salidas.update(salidaId, {
      ...datosActualizados,
      total: nuevoTotal
    });

    // Recalcular existencias del producto
    const lotesDelProducto = await this.obtenerLotesPorProducto(salidaActual.productoId);
    const nuevaExistencia = lotesDelProducto.reduce((total, lote) => total + lote.cantidadDisponible, 0);
    
    // Recalcular precio promedio ponderado
    const valorTotal = lotesDelProducto.reduce((total, lote) => 
      total + (lote.cantidadDisponible * lote.precioUnitario), 0);
    const nuevoPrecioPromedio = nuevaExistencia > 0 ? valorTotal / nuevaExistencia : 0;
    
    await this.actualizarExistenciaProducto(salidaActual.productoId, nuevaExistencia, nuevoPrecioPromedio);
  },

  async eliminarSalida(salidaId: number): Promise<void> {
    // Obtener la salida antes de eliminarla
    const salida = await db.salidas.get(salidaId);
    if (!salida) {
      throw new Error('Salida no encontrada');
    }

    // Obtener el lote asociado
    const lote = await db.lotes.get(salida.loteId!);
    if (!lote) {
      throw new Error('Lote asociado no encontrado');
    }

    // Restaurar la cantidad al lote
    await db.lotes.update(salida.loteId!, {
      cantidadDisponible: lote.cantidadDisponible + salida.cantidad
    });

    // Eliminar la salida
    await db.salidas.delete(salidaId);

    // Recalcular existencias del producto
    const lotesDelProducto = await this.obtenerLotesPorProducto(salida.productoId);
    const nuevaExistencia = lotesDelProducto.reduce((total, lote) => total + lote.cantidadDisponible, 0);
    
    // Recalcular precio promedio ponderado
    const valorTotal = lotesDelProducto.reduce((total, lote) => 
      total + (lote.cantidadDisponible * lote.precioUnitario), 0);
    const nuevoPrecioPromedio = nuevaExistencia > 0 ? valorTotal / nuevaExistencia : 0;
    
    await this.actualizarExistenciaProducto(salida.productoId, nuevaExistencia, nuevoPrecioPromedio);
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

// LoteProducto ya está exportado implícitamente en la interfaz

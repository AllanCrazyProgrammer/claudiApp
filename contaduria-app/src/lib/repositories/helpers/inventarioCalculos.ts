export function calcularPrecioPromedioPonderado(
  existenciaTotal: number,
  valorTotal: number
): number {
  if (existenciaTotal <= 0) return 0;
  return valorTotal / existenciaTotal;
}

export function sumarExistenciaYValor(
  lotes: Array<{ cantidadDisponible: number; precioUnitario: number }>
) {
  const existenciaTotal = lotes.reduce((acc, l) => acc + l.cantidadDisponible, 0);
  const valorTotal = lotes.reduce((acc, l) => acc + l.cantidadDisponible * l.precioUnitario, 0);
  return { existenciaTotal, valorTotal };
}



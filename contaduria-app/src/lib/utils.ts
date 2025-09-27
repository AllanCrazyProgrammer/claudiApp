import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// Función para formatear fechas cortas sin problemas de zona horaria
export function formatDateShort(date: Date | string): string {
  // Si es string (desde input date), crear fecha local
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-');
    const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return localDate.toLocaleDateString('es-MX');
  }
  
  // Si es Date object, verificar si necesita ajuste de zona horaria
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('es-MX');
}

// Función para crear Date object desde string de input sin problemas de zona horaria
export function createLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

// Función para formatear números con separador de miles
export function formatNumber(number: number, decimals: number = 0): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}

export function formatDecimal(
  number: number,
  minDecimals: number = 2,
  maxDecimals: number = 8
): string {
  const maximumFractionDigits = Math.max(minDecimals, maxDecimals);

  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits
  }).format(number);
}

// Función para calcular totales con máxima precisión decimal
export function calcularTotal(cantidad: string | number, precio: string | number): number {
  // Convertir a números manteniendo la precisión
  const cantidadNum = typeof cantidad === 'string' ? parseFloat(cantidad) : cantidad;
  const precioNum = typeof precio === 'string' ? parseFloat(precio) : precio;
  
  // Si algún valor es inválido, retornar 0
  if (isNaN(cantidadNum) || isNaN(precioNum)) return 0;
  
  // Usar multiplicación directa para mantener precisión
  return cantidadNum * precioNum;
}

// Función para formatear moneda con más decimales cuando sea necesario
export function formatCurrencyPrecise(amount: number): string {
  // Determinar cuántos decimales mostrar basado en el valor
  const decimals = amount % 1 === 0 ? 2 : Math.max(2, amount.toString().split('.')[1]?.length || 2);
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.min(decimals, 6) // Máximo 6 decimales para evitar números muy largos
  }).format(amount);
}

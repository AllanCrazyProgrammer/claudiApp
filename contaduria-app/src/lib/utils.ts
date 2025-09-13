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

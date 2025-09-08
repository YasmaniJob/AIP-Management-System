/**
 * Configuración de colores estandarizados para la aplicación
 * Utiliza las variables CSS de Tailwind y el sistema de design tokens
 */

export const colors = {
  // Estados de éxito
  success: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    button: 'bg-green-600 hover:bg-green-700',
    badge: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
    icon: 'text-green-500'
  },
  
  // Estados de advertencia
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    button: 'bg-amber-500 hover:bg-amber-600',
    badge: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
    icon: 'text-amber-600',
    card: 'border-amber-500 bg-amber-500/5',
    cardText: 'text-amber-700',
    cardSubtext: 'text-amber-800/90'
  },
  
  // Estados de error
  error: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    button: 'bg-red-600 hover:bg-red-700',
    badge: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
    icon: 'text-red-500',
    required: 'text-red-500'
  },
  
  // Estados informativos
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    button: 'bg-blue-600 hover:bg-blue-700',
    badge: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
    icon: 'text-blue-500'
  },
  
  // Colores neutros
  neutral: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    textMuted: 'text-gray-500',
    border: 'border-gray-200',
    button: 'bg-gray-600 hover:bg-gray-700',
    badge: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
  }
} as const;

/**
 * Utilidad para combinar clases de colores con clases adicionales
 */
export function combineColorClasses(colorClasses: string, additionalClasses?: string): string {
  return additionalClasses ? `${colorClasses} ${additionalClasses}` : colorClasses;
}

/**
 * Tipos para autocompletado
 */
export type ColorVariant = keyof typeof colors;
export type ColorProperty = keyof typeof colors.success;
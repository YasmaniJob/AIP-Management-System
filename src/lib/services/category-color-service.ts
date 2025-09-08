// src/lib/services/category-color-service.ts

/**
 * Servicio unificado para manejar colores de categorías
 * Centraliza la lógica de colores para mantener consistencia en toda la aplicación
 */

export type CategoryColorName = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow' | 'gray' | 'teal' | 'fuchsia' | 'indigo' | 'pink' | 'rose' | 'violet';

export interface CategoryColorConfig {
  name: CategoryColorName;
  hex: string;
  tailwindClass: string;
}

/**
 * Mapeo unificado de categorías a colores
 * Este es el único lugar donde se definen los colores de categorías
 */
const CATEGORY_COLOR_MAP: Record<string, CategoryColorConfig> = {
  'Laptops': {
    name: 'blue',
    hex: '#3b82f6',
    tailwindClass: 'blue-500'
  },
  'Tablets': {
    name: 'teal',
    hex: '#14b8a6',
    tailwindClass: 'teal-500'
  },
  'Proyectores': {
    name: 'orange',
    hex: '#f97316',
    tailwindClass: 'orange-500'
  },
  'Cámaras Fotográficas': {
    name: 'purple',
    hex: '#a855f7',
    tailwindClass: 'purple-500'
  },
  'Filmadoras': {
    name: 'fuchsia',
    hex: '#d946ef',
    tailwindClass: 'fuchsia-500'
  },
  'Periféricos': {
    name: 'indigo',
    hex: '#6366f1',
    tailwindClass: 'indigo-500'
  },
  'Redes': {
    name: 'pink',
    hex: '#ec4899',
    tailwindClass: 'pink-500'
  },
  'Cables y Adaptadores': {
    name: 'rose',
    hex: '#f43f5e',
    tailwindClass: 'rose-500'
  },
  'Audio': {
    name: 'violet',
    hex: '#8b5cf6',
    tailwindClass: 'violet-500'
  },
  'PCs de Escritorio': {
    name: 'green',
    hex: '#22c55e',
    tailwindClass: 'green-500'
  },
  'Mobiliario': {
    name: 'gray',
    hex: '#78716c',
    tailwindClass: 'stone-500'
  },
  'Otros': {
    name: 'gray',
    hex: '#6b7280',
    tailwindClass: 'gray-500'
  },
  // Alias para compatibilidad
  'Computadoras': {
    name: 'green',
    hex: '#22c55e',
    tailwindClass: 'green-500'
  },
  'Video': {
    name: 'red',
    hex: '#ef4444',
    tailwindClass: 'red-500'
  },
  'Accesorios': {
    name: 'yellow',
    hex: '#eab308',
    tailwindClass: 'yellow-500'
  }
};

/**
 * Mapeo de colores para UnifiedFilterTabs (nombres simplificados)
 * Convierte los colores complejos a los colores básicos soportados por el componente
 */
const FILTER_TAB_COLOR_MAP: Record<CategoryColorName, CategoryColorName> = {
  'blue': 'blue',
  'green': 'green',
  'orange': 'orange',
  'purple': 'purple',
  'red': 'red',
  'yellow': 'yellow',
  'gray': 'gray',
  'teal': 'blue',      // teal -> blue para UnifiedFilterTabs
  'fuchsia': 'purple', // fuchsia -> purple para UnifiedFilterTabs
  'indigo': 'blue',    // indigo -> blue para UnifiedFilterTabs
  'pink': 'red',       // pink -> red para UnifiedFilterTabs
  'rose': 'red',       // rose -> red para UnifiedFilterTabs
  'violet': 'purple'   // violet -> purple para UnifiedFilterTabs
};

class CategoryColorService {
  private static instance: CategoryColorService;

  private constructor() {}

  static getInstance(): CategoryColorService {
    if (!CategoryColorService.instance) {
      CategoryColorService.instance = new CategoryColorService();
    }
    return CategoryColorService.instance;
  }

  /**
   * Obtiene la configuración de color completa para una categoría
   */
  getCategoryColorConfig(categoryName: string): CategoryColorConfig {
    return CATEGORY_COLOR_MAP[categoryName] || {
      name: 'gray',
      hex: '#6b7280',
      tailwindClass: 'gray-500'
    };
  }

  /**
   * Obtiene el nombre del color para una categoría (para UnifiedFilterTabs)
   */
  getCategoryColorName(categoryName: string): CategoryColorName {
    const config = this.getCategoryColorConfig(categoryName);
    return FILTER_TAB_COLOR_MAP[config.name] || 'gray';
  }

  /**
   * Obtiene el valor hexadecimal del color para una categoría
   */
  getCategoryColorHex(categoryName: string): string {
    return this.getCategoryColorConfig(categoryName).hex;
  }

  /**
   * Obtiene la clase de Tailwind para una categoría
   */
  getCategoryTailwindClass(categoryName: string): string {
    return this.getCategoryColorConfig(categoryName).tailwindClass;
  }

  /**
   * Obtiene todas las configuraciones de colores disponibles
   */
  getAllCategoryColors(): Record<string, CategoryColorConfig> {
    return { ...CATEGORY_COLOR_MAP };
  }

  /**
   * Verifica si una categoría tiene un color definido
   */
  hasCategoryColor(categoryName: string): boolean {
    return categoryName in CATEGORY_COLOR_MAP;
  }

  /**
   * Obtiene el mapeo de colores en formato legacy (para compatibilidad)
   */
  getLegacyColorMap(): Record<string, string> {
    const legacyMap: Record<string, string> = {};
    Object.entries(CATEGORY_COLOR_MAP).forEach(([category, config]) => {
      legacyMap[category] = config.hex;
    });
    return legacyMap;
  }
}

// Exportar instancia singleton
export const categoryColorService = CategoryColorService.getInstance();

// Funciones de conveniencia para mantener compatibilidad
export function getCategoryColorName(categoryName: string): CategoryColorName {
  return categoryColorService.getCategoryColorName(categoryName);
}

export function getCategoryColorHex(categoryName: string): string {
  return categoryColorService.getCategoryColorHex(categoryName);
}

export function getCategoryTailwindClass(categoryName: string): string {
  return categoryColorService.getCategoryTailwindClass(categoryName);
}

export function getCategoryColorConfig(categoryName: string): CategoryColorConfig {
  return categoryColorService.getCategoryColorConfig(categoryName);
}

// Exportar el mapeo legacy para compatibilidad con código existente
export const colorMap = categoryColorService.getLegacyColorMap();
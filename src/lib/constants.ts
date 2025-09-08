// src/lib/constants.ts
import { categoryColorService } from './services/category-color-service';

// Mapeo de colores de categorías - ahora usa el servicio unificado
export const colorMap: Record<any, string> = categoryColorService.getLegacyColorMap();

export const areaColorMap: Record<string, string> = {
  'Matemática': '#ef4444', // red-500
  'Comunicación': '#3b82f6', // blue-500
  'Ciencia y Tecnología': '#22c55e', // green-500
  'Personal Social': '#eab308', // yellow-500
  'Arte y Cultura': '#a855f7', // purple-500
  'Educación Religiosa': '#f97316', // orange-500
  'Educación Física': '#14b8a6', // teal-500
  'Inglés como Lengua Extranjera': '#ec4899', // pink-500
  'Default': '#2BB788', // Accent Green for institutional use
};

export const roleColorMap: Record<string, string> = {
  'Director(a)': '#7c2d12', // orange-900
  'Sub-Director(a)': '#f97316', // orange-500
  'Coordinadores': '#22c55e', // green-500
  'Docentes': '#a855f7', // purple-500
  'Auxiliares': '#3b82f6', // blue-500
  'Otros': '#6b7280' // gray-500
};

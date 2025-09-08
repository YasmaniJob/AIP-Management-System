// src/lib/services/category-service.ts

import { createClient } from '../supabase/client';
import type { Database } from '../types';
import { categoryColorService, type CategoryColorName } from './category-color-service';

type Category = Database['public']['Tables']['categories']['Row'];

export interface CategoryWithStats extends Category {
  resourceCount: number;
  availableCount: number;
  maintenanceCount: number;
  incidentsCount: number;
}

export interface CategoryFilter {
  value: string;
  label: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow' | 'gray';
  count: number;
  icon?: any;
}

/**
 * Servicio unificado para manejo de categorías
 * Proporciona una fuente única de verdad para todas las operaciones relacionadas con categorías
 */
export class CategoryService {
  private static instance: CategoryService;
  private supabase: any;

  private constructor() {}

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  private getSupabase() {
    if (!this.supabase) {
      this.supabase = createClient();
    }
    return this.supabase;
  }

  /**
   * Obtener todas las categorías con estadísticas completas
   */
  async getCategoriesWithStats(): Promise<CategoryWithStats[]> {
    const supabase = this.getSupabase();
    
    // Obtener todas las categorías
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, type, color')
      .order('name');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return [];
    }

    // Obtener estadísticas para cada categoría en paralelo
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const [resourceStats, maintenanceStats, incidentsStats] = await Promise.all([
          this.getResourceStats(category.id),
          this.getMaintenanceStats(category.id),
          this.getIncidentsStats(category.id)
        ]);

        return {
          ...category,
          resourceCount: resourceStats.total,
          availableCount: resourceStats.available,
          maintenanceCount: maintenanceStats.active,
          incidentsCount: incidentsStats.active
        };
      })
    );

    return categoriesWithStats;
  }

  /**
   * Obtener categorías filtradas por contexto (inventario, mantenimiento, etc.)
   */
  async getCategoriesByContext(context: 'inventory' | 'maintenance' | 'incidents' | 'loans'): Promise<{ success: boolean; data?: CategoryWithStats[]; error?: string }> {
    try {
      const allCategories = await this.getCategoriesWithStats();
      
      // Filtrar categorías según el contexto
      let filteredCategories: CategoryWithStats[];
      switch (context) {
        case 'inventory':
          // Mostrar todas las categorías en inventario, incluso sin recursos
          filteredCategories = allCategories;
          break;
        case 'maintenance':
          filteredCategories = allCategories.filter(cat => cat.resourceCount > 0);
          break;
        case 'incidents':
          filteredCategories = allCategories.filter(cat => cat.incidentsCount > 0);
          break;
        case 'loans':
          filteredCategories = allCategories.filter(cat => cat.availableCount > 0);
          break;
        default:
          filteredCategories = allCategories;
      }
      
      return { success: true, data: filteredCategories };
    } catch (error) {
      console.error('Error fetching categories by context:', error);
      return { success: false, error: 'Failed to fetch categories' };
    }
  }

  /**
   * Obtener estadísticas de recursos para una categoría
   */
  private async getResourceStats(categoryId: string): Promise<{ total: number; available: number }> {
    const supabase = this.getSupabase();
    
    const { data: resources, error } = await supabase
      .from('resources')
      .select('id, status')
      .eq('category_id', categoryId);

    if (error) {
      console.error(`Error fetching resource stats for category ${categoryId}:`, error);
      return { total: 0, available: 0 };
    }

    return {
      total: resources?.length || 0,
      available: resources?.filter(r => r.status === 'Disponible').length || 0
    };
  }

  /**
   * Obtener estadísticas de mantenimiento para una categoría
   */
  private async getMaintenanceStats(categoryId: string): Promise<{ active: number; total: number }> {
    const supabase = this.getSupabase();
    
    const { data: maintenanceRecords, error } = await supabase
      .from('maintenance_tracking')
      .select(`
        id,
        current_status,
        resource:resources!inner(
          category:categories!inner(id)
        )
      `)
      .eq('resource.category.id', categoryId);

    if (error) {
      console.error(`Error fetching maintenance stats for category ${categoryId}:`, error);
      return { active: 0, total: 0 };
    }

    const total = maintenanceRecords?.length || 0;
    const active = maintenanceRecords?.filter(m => m.current_status !== 'Completado').length || 0;

    return { active, total };
  }

  /**
   * Obtener estadísticas de incidencias para una categoría
   */
  private async getIncidentsStats(categoryId: string): Promise<{ active: number; total: number }> {
    const supabase = this.getSupabase();
    
    // Con la tabla incidents simplificada, ya no tenemos resource_id
    // Por ahora retornamos estadísticas vacías hasta que se implemente una nueva lógica
    // si es necesario relacionar incidencias con categorías
    
    const { data: incidents, error } = await supabase
      .from('incidents')
      .select('id, status');

    if (error) {
      console.error(`Error fetching incidents stats for category ${categoryId}:`, error);
      return { active: 0, total: 0 };
    }

    // Como ya no hay relación directa con recursos/categorías,
    // retornamos 0 para esta categoría específica
    // TODO: Implementar nueva lógica si se necesita relacionar incidencias con categorías
    return { active: 0, total: 0 };
  }

  /**
   * Generar filtros de categorías para componentes UnifiedFilterTabs
   */
  generateCategoryFilters(
    categories: CategoryWithStats[], 
    context: 'inventory' | 'maintenance' | 'incidents' | 'loans',
    includeAll: boolean = true
  ): CategoryFilter[] {
    const filters: CategoryFilter[] = [];

    // Agregar filtro "Todos" si se solicita
    if (includeAll) {
      const totalCount = this.getTotalCountByContext(categories, context);
      filters.push({
        value: 'todos',
        label: 'Todos',
        color: 'gray',
        count: totalCount
      });
    }

    // Agregar filtros por categoría
    categories
      .filter(category => this.getCategoryCountByContext(category, context) > 0)
      .forEach(category => {
        filters.push({
          value: category.name,
          label: category.name,
          color: this.getCategoryColor(category.name),
          count: this.getCategoryCountByContext(category, context)
        });
      });

    return filters;
  }

  /**
   * Obtener color asociado a una categoría
   */
  private getCategoryColor(categoryName: string): CategoryColorName {
    return categoryColorService.getCategoryColorName(categoryName);
  }

  /**
   * Obtener conteo total según el contexto
   */
  private getTotalCountByContext(categories: CategoryWithStats[], context: 'inventory' | 'maintenance' | 'incidents' | 'loans'): number {
    return categories.reduce((total, category) => {
      return total + this.getCategoryCountByContext(category, context);
    }, 0);
  }

  /**
   * Obtener conteo de una categoría según el contexto
   */
  private getCategoryCountByContext(category: CategoryWithStats, context: 'inventory' | 'maintenance' | 'incidents' | 'loans'): number {
    switch (context) {
      case 'inventory':
        return category.resourceCount;
      case 'maintenance':
        return category.maintenanceCount;
      case 'incidents':
        return category.incidentsCount;
      case 'loans':
        return category.availableCount;
      default:
        return 0;
    }
  }

  /**
   * Obtener una categoría por ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    const supabase = this.getSupabase();
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching category by ID:', error);
      return null;
    }

    return data;
  }
}

// Exportar instancia singleton
export const categoryService = CategoryService.getInstance();

// Funciones de conveniencia para mantener compatibilidad
export async function getCategoriesWithStats(): Promise<CategoryWithStats[]> {
  return categoryService.getCategoriesWithStats();
}

export async function getCategoriesByContext(context: 'inventory' | 'maintenance' | 'incidents' | 'loans'): Promise<CategoryWithStats[]> {
  const response = await categoryService.getCategoriesByContext(context);
  return response.success ? response.data || [] : [];
}

export async function generateCategoryFilters(
  categories: CategoryWithStats[], 
  context: 'inventory' | 'maintenance' | 'incidents' | 'loans',
  includeAll: boolean = true
): Promise<CategoryFilter[]> {
  return categoryService.generateCategoryFilters(categories, context, includeAll);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  return categoryService.getCategoryById(id);
}
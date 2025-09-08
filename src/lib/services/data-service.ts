// src/lib/services/data-service.ts
import { createServerClient } from '../supabase/server';
import { Database } from '../supabase/database.types';

interface FindManyOptions {
  select?: string;
  filters?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  pagination?: {
    page: number;
    perPage: number;
  };
}

interface FindByIdOptions {
  select?: string;
  filters?: Record<string, any>;
}

class DataService {
  async findMany<T extends keyof Database['public']['Tables']>(
    table: T,
    options: FindManyOptions = {}
  ): Promise<Database['public']['Tables'][T]['Row'][]> {
    const supabase = await createServerClient();
    let query = supabase.from(table).select(options.select || '*');

    // Apply filters
    if (options.filters) {
      query = this.applyFilters(query, options.filters);
    }

    // Apply ordering
    if (options.orderBy) {
      Object.entries(options.orderBy).forEach(([column, direction]) => {
        query = query.order(column, { ascending: direction === 'asc' });
      });
    }

    // Apply pagination
    if (options.pagination) {
      const { page, perPage } = options.pagination;
      const from = (page - 1) * perPage;
      const to = page * perPage - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async findManyWithCount<T extends keyof Database['public']['Tables']>(
    table: T,
    options: FindManyOptions = {}
  ): Promise<{ data: Database['public']['Tables'][T]['Row'][], count: number }> {
    const supabase = await createServerClient();
    let query = supabase.from(table).select(options.select || '*', { count: 'exact' });

    // Apply filters
    if (options.filters) {
      query = this.applyFilters(query, options.filters);
    }

    // Apply ordering
    if (options.orderBy) {
      Object.entries(options.orderBy).forEach(([column, direction]) => {
        query = query.order(column, { ascending: direction === 'asc' });
      });
    }

    // Apply pagination
    if (options.pagination) {
      const { page, perPage } = options.pagination;
      const from = (page - 1) * perPage;
      const to = page * perPage - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  async findById<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string,
    options: FindByIdOptions = {}
  ): Promise<Database['public']['Tables'][T]['Row'] | null> {
    const supabase = await createServerClient();
    let query = supabase
      .from(table)
      .select(options.select || '*')
      .eq('id', id);

    // Apply additional filters if provided
    if (options.filters) {
      query = this.applyFilters(query, options.filters);
    }

    const { data, error } = await query.single();
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw error;
    }
    return data;
  }

  async create<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert']
  ): Promise<Database['public']['Tables'][T]['Row']> {
    const supabase = await createServerClient();
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async createMany<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert'][]
  ): Promise<Database['public']['Tables'][T]['Row'][]> {
    const supabase = await createServerClient();
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) throw error;
    return result || [];
  }

  async update<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string,
    data: Database['public']['Tables'][T]['Update']
  ): Promise<Database['public']['Tables'][T]['Row']> {
    const supabase = await createServerClient();
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async delete<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string
  ): Promise<void> {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteMany<T extends keyof Database['public']['Tables']>(
    table: T,
    filters: Record<string, any>
  ): Promise<void> {
    const supabase = await createServerClient();
    let query = supabase.from(table).delete();

    query = this.applyFilters(query, filters);

    const { error } = await query;
    if (error) throw error;
  }

  async count<T extends keyof Database['public']['Tables']>(
    table: T,
    filters?: Record<string, any>
  ): Promise<number> {
    const supabase = await createServerClient();
    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    
    if (filters) {
      query = this.applyFilters(query, filters);
    }
    
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  async exists<T extends keyof Database['public']['Tables']>(
    table: T,
    filters: Record<string, any>
  ): Promise<boolean> {
    const count = await this.count(table, filters);
    return count > 0;
  }

  private applyFilters(query: any, filters: Record<string, any>) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle comparison operators
          Object.entries(value).forEach(([operator, operatorValue]) => {
            switch (operator) {
              case 'gte':
                query = query.gte(key, operatorValue);
                break;
              case 'lte':
                query = query.lte(key, operatorValue);
                break;
              case 'gt':
                query = query.gt(key, operatorValue);
                break;
              case 'lt':
                query = query.lt(key, operatorValue);
                break;
              case 'neq':
                query = query.neq(key, operatorValue);
                break;
              case 'like':
                query = query.like(key, operatorValue);
                break;
              case 'ilike':
                query = query.ilike(key, operatorValue);
                break;
              default:
                query = query.eq(key, operatorValue);
            }
          });
        } else {
          query = query.eq(key, value);
        }
      }
    });
    return query;
  }
}

// Export a singleton instance
export const dataService = new DataService();
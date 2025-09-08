// Sistema de operaciones batch para optimizar llamadas a Supabase

import { supabaseOptimized } from '@/lib/supabase/client-optimized';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

// Tipos para operaciones batch
interface BatchOperation {
  id: string;
  type: 'insert' | 'update' | 'delete' | 'select';
  table: string;
  data?: any;
  filter?: any;
  select?: string;
  timestamp: number;
}

interface BatchResult {
  success: boolean;
  data?: any;
  error?: string;
  operationId: string;
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // ms
  retryAttempts: number;
  retryDelay: number; // ms
}

class BatchProcessor {
  private pendingOperations: Map<string, BatchOperation[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: BatchConfig = {
    maxBatchSize: 100, // Límite de Supabase para operaciones batch
    maxWaitTime: 2000, // 2 segundos máximo de espera
    retryAttempts: 3,
    retryDelay: 1000
  };

  /**
   * Agregar operación al batch
   */
  addOperation(operation: Omit<BatchOperation, 'id' | 'timestamp'>): Promise<BatchResult> {
    const batchKey = `${operation.table}-${operation.type}`;
    const operationWithId: BatchOperation = {
      ...operation,
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    // Inicializar array si no existe
    if (!this.pendingOperations.has(batchKey)) {
      this.pendingOperations.set(batchKey, []);
    }

    const operations = this.pendingOperations.get(batchKey)!;
    operations.push(operationWithId);

    // Crear promesa que se resolverá cuando se ejecute el batch
    const promise = new Promise<BatchResult>((resolve, reject) => {
      // Almacenar resolve/reject en la operación para uso posterior
      (operationWithId as any).resolve = resolve;
      (operationWithId as any).reject = reject;
    });

    // Verificar si debe ejecutarse inmediatamente
    if (operations.length >= this.config.maxBatchSize) {
      this.executeBatch(batchKey);
    } else {
      // Configurar timer si no existe
      if (!this.batchTimers.has(batchKey)) {
        const timer = setTimeout(() => {
          this.executeBatch(batchKey);
        }, this.config.maxWaitTime);
        
        this.batchTimers.set(batchKey, timer);
      }
    }

    return promise;
  }

  /**
   * Ejecutar batch de operaciones
   */
  private async executeBatch(batchKey: string, attempt = 1) {
    const operations = this.pendingOperations.get(batchKey);
    if (!operations || operations.length === 0) return;

    // Limpiar timer
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }

    // Remover operaciones del pending
    this.pendingOperations.delete(batchKey);

    console.log(`🔄 Ejecutando batch ${batchKey} con ${operations.length} operaciones`);

    try {
      const results = await this.processBatchOperations(operations);
      
      // Resolver promesas individuales
      operations.forEach((op, index) => {
        const result = results[index];
        if ((op as any).resolve) {
          (op as any).resolve(result);
        }
      });

      // Incrementar contador de uso
      performanceMonitor.incrementResourceUsage('supabaseQueries');
      
      console.log(`✅ Batch ${batchKey} ejecutado exitosamente`);
      
    } catch (error) {
      console.error(`❌ Error en batch ${batchKey}:`, error);
      
      // Reintentar si es posible
      if (attempt < this.config.retryAttempts) {
        console.log(`🔄 Reintentando batch ${batchKey} (intento ${attempt + 1})`);
        
        setTimeout(() => {
          // Volver a agregar operaciones al pending
          this.pendingOperations.set(batchKey, operations);
          this.executeBatch(batchKey, attempt + 1);
        }, this.config.retryDelay * attempt);
        
        return;
      }
      
      // Rechazar todas las promesas
      operations.forEach(op => {
        if ((op as any).reject) {
          (op as any).reject(error);
        }
      });
    }
  }

  /**
   * Procesar operaciones del batch según su tipo
   */
  private async processBatchOperations(operations: BatchOperation[]): Promise<BatchResult[]> {
    if (operations.length === 0) return [];
    
    const firstOp = operations[0];
    const { table, type } = firstOp;
    
    switch (type) {
      case 'insert':
        return this.processBatchInserts(table, operations);
      case 'update':
        return this.processBatchUpdates(table, operations);
      case 'delete':
        return this.processBatchDeletes(table, operations);
      case 'select':
        return this.processBatchSelects(table, operations);
      default:
        throw new Error(`Tipo de operación no soportado: ${type}`);
    }
  }

  /**
   * Procesar inserciones en batch
   */
  private async processBatchInserts(table: string, operations: BatchOperation[]): Promise<BatchResult[]> {
    const dataToInsert = operations.map(op => op.data).filter(Boolean);
    
    if (dataToInsert.length === 0) {
      return operations.map(op => ({
        success: false,
        error: 'No data to insert',
        operationId: op.id
      }));
    }

    try {
      const { data, error } = await supabaseOptimized
        .from(table)
        .insert(dataToInsert)
        .select();

      if (error) throw error;

      return operations.map((op, index) => ({
        success: true,
        data: data?.[index],
        operationId: op.id
      }));
    } catch (error) {
      return operations.map(op => ({
        success: false,
        error: String(error),
        operationId: op.id
      }));
    }
  }

  /**
   * Procesar actualizaciones en batch
   */
  private async processBatchUpdates(table: string, operations: BatchOperation[]): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    
    // Las actualizaciones deben procesarse individualmente debido a filtros únicos
    for (const operation of operations) {
      try {
        let query = supabaseOptimized.from(table).update(operation.data);
        
        // Aplicar filtros
        if (operation.filter) {
          Object.entries(operation.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        const { data, error } = await query.select();
        
        if (error) throw error;
        
        results.push({
          success: true,
          data,
          operationId: operation.id
        });
      } catch (error) {
        results.push({
          success: false,
          error: String(error),
          operationId: operation.id
        });
      }
    }
    
    return results;
  }

  /**
   * Procesar eliminaciones en batch
   */
  private async processBatchDeletes(table: string, operations: BatchOperation[]): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    
    // Las eliminaciones deben procesarse individualmente debido a filtros únicos
    for (const operation of operations) {
      try {
        let query = supabaseOptimized.from(table).delete();
        
        // Aplicar filtros
        if (operation.filter) {
          Object.entries(operation.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        const { data, error } = await query.select();
        
        if (error) throw error;
        
        results.push({
          success: true,
          data,
          operationId: operation.id
        });
      } catch (error) {
        results.push({
          success: false,
          error: String(error),
          operationId: operation.id
        });
      }
    }
    
    return results;
  }

  /**
   * Procesar selecciones en batch
   */
  private async processBatchSelects(table: string, operations: BatchOperation[]): Promise<BatchResult[]> {
    // Agrupar selects similares
    const groupedSelects = new Map<string, BatchOperation[]>();
    
    operations.forEach(op => {
      const key = `${op.select || '*'}-${JSON.stringify(op.filter || {})}`;
      if (!groupedSelects.has(key)) {
        groupedSelects.set(key, []);
      }
      groupedSelects.get(key)!.push(op);
    });
    
    const results: BatchResult[] = [];
    
    // Procesar cada grupo
    for (const [key, ops] of groupedSelects) {
      try {
        const firstOp = ops[0];
        let query = supabaseOptimized.from(table).select(firstOp.select || '*');
        
        // Aplicar filtros
        if (firstOp.filter) {
          Object.entries(firstOp.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Todas las operaciones del grupo obtienen el mismo resultado
        ops.forEach(op => {
          results.push({
            success: true,
            data,
            operationId: op.id
          });
        });
      } catch (error) {
        ops.forEach(op => {
          results.push({
            success: false,
            error: String(error),
            operationId: op.id
          });
        });
      }
    }
    
    return results;
  }

  /**
   * Forzar ejecución de todos los batches pendientes
   */
  async flushAll(): Promise<void> {
    const batchKeys = Array.from(this.pendingOperations.keys());
    
    await Promise.all(
      batchKeys.map(key => this.executeBatch(key))
    );
  }

  /**
   * Obtener estadísticas del procesador
   */
  getStats() {
    const pendingCount = Array.from(this.pendingOperations.values())
      .reduce((sum, ops) => sum + ops.length, 0);
    
    return {
      pendingOperations: pendingCount,
      activeBatches: this.pendingOperations.size,
      activeTimers: this.batchTimers.size,
      config: this.config
    };
  }

  /**
   * Configurar parámetros del batch
   */
  configure(newConfig: Partial<BatchConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Instancia global del procesador
export const batchProcessor = new BatchProcessor();

// Utilidades de alto nivel para operaciones comunes
export class BatchOperations {
  /**
   * Insertar múltiples registros
   */
  static async insertMany<T>(table: string, records: T[]): Promise<BatchResult[]> {
    const promises = records.map(record => 
      batchProcessor.addOperation({
        type: 'insert',
        table,
        data: record
      })
    );
    
    return Promise.all(promises);
  }

  /**
   * Actualizar múltiples registros
   */
  static async updateMany<T>(
    table: string, 
    updates: Array<{ data: Partial<T>; filter: any }>
  ): Promise<BatchResult[]> {
    const promises = updates.map(({ data, filter }) => 
      batchProcessor.addOperation({
        type: 'update',
        table,
        data,
        filter
      })
    );
    
    return Promise.all(promises);
  }

  /**
   * Eliminar múltiples registros
   */
  static async deleteMany(
    table: string, 
    filters: any[]
  ): Promise<BatchResult[]> {
    const promises = filters.map(filter => 
      batchProcessor.addOperation({
        type: 'delete',
        table,
        filter
      })
    );
    
    return Promise.all(promises);
  }

  /**
   * Obtener múltiples registros con diferentes filtros
   */
  static async selectMany(
    table: string, 
    queries: Array<{ select?: string; filter?: any }>
  ): Promise<BatchResult[]> {
    const promises = queries.map(({ select, filter }) => 
      batchProcessor.addOperation({
        type: 'select',
        table,
        select,
        filter
      })
    );
    
    return Promise.all(promises);
  }
}

// Hook React para usar operaciones batch
import { useCallback } from 'react';

export function useBatchOperations() {
  const insertMany = useCallback(async <T>(table: string, records: T[]) => {
    return BatchOperations.insertMany(table, records);
  }, []);

  const updateMany = useCallback(async <T>(
    table: string, 
    updates: Array<{ data: Partial<T>; filter: any }>
  ) => {
    return BatchOperations.updateMany(table, updates);
  }, []);

  const deleteMany = useCallback(async (table: string, filters: any[]) => {
    return BatchOperations.deleteMany(table, filters);
  }, []);

  const selectMany = useCallback(async (
    table: string, 
    queries: Array<{ select?: string; filter?: any }>
  ) => {
    return BatchOperations.selectMany(table, queries);
  }, []);

  const flushBatches = useCallback(async () => {
    return batchProcessor.flushAll();
  }, []);

  const getStats = useCallback(() => {
    return batchProcessor.getStats();
  }, []);

  return {
    insertMany,
    updateMany,
    deleteMany,
    selectMany,
    flushBatches,
    getStats
  };
}

// Ejemplos de uso
export const BatchExamples = {
  /**
   * Ejemplo: Crear múltiples préstamos
   */
  async createMultipleLoans(loans: any[]) {
    console.log('📚 Creando múltiples préstamos en batch...');
    
    const results = await BatchOperations.insertMany('loans', loans);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ ${successful.length} préstamos creados, ❌ ${failed.length} fallaron`);
    
    return { successful, failed };
  },

  /**
   * Ejemplo: Actualizar estado de múltiples recursos
   */
  async updateResourceStatuses(updates: Array<{ id: string; status: string }>) {
    console.log('📖 Actualizando estados de recursos en batch...');
    
    const batchUpdates = updates.map(({ id, status }) => ({
      data: { status, updated_at: new Date().toISOString() },
      filter: { id }
    }));
    
    const results = await BatchOperations.updateMany('resources', batchUpdates);
    
    return results;
  },

  /**
   * Ejemplo: Sincronizar datos con caché
   */
  async syncWithCache(table: string, ids: string[]) {
    console.log(`🔄 Sincronizando ${ids.length} registros de ${table}...`);
    
    const queries = ids.map(id => ({
      select: '*',
      filter: { id }
    }));
    
    const results = await BatchOperations.selectMany(table, queries);
    
    // Actualizar caché con resultados
    results.forEach(result => {
      if (result.success && result.data) {
        // Aquí se actualizaría el caché
        console.log(`💾 Datos sincronizados para operación ${result.operationId}`);
      }
    });
    
    return results;
  }
};

export default batchProcessor;
// Utilidades para procesamiento por lotes de importación de usuarios

export interface BatchProcessingOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  maxRetries?: number;
  onProgress?: (progress: BatchProgress) => void;
  onBatchComplete?: (batchResult: BatchResult) => void;
  onError?: (error: Error, batch: any[]) => void;
}

export interface BatchProgress {
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  currentBatch: number;
  totalBatches: number;
  percentage: number;
}

export interface BatchResult {
  batchNumber: number;
  successful: any[];
  failed: {
    item: any;
    error: string;
  }[];
  processingTime: number;
}

export interface BatchProcessingResult {
  success: boolean;
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
  results: BatchResult[];
  errors: string[];
  processingTime: number;
}

// Función principal para procesamiento por lotes
export async function processBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchProcessingOptions = {}
): Promise<BatchProcessingResult> {
  const {
    batchSize = 10,
    delayBetweenBatches = 100,
    maxRetries = 3,
    onProgress,
    onBatchComplete,
    onError
  } = options;

  const startTime = Date.now();
  const totalItems = items.length;
  const totalBatches = Math.ceil(totalItems / batchSize);
  
  const results: BatchResult[] = [];
  const globalErrors: string[] = [];
  
  let processedItems = 0;
  let successfulItems = 0;
  let failedItems = 0;

  // Dividir items en lotes
  const batches = chunkArray(items, batchSize);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchStartTime = Date.now();
    
    try {
      const batchResult = await processBatch(
        batch,
        processor,
        batchIndex + 1,
        maxRetries
      );
      
      results.push(batchResult);
      processedItems += batch.length;
      successfulItems += batchResult.successful.length;
      failedItems += batchResult.failed.length;
      
      // Callback de progreso
      if (onProgress) {
        const progress: BatchProgress = {
          totalItems,
          processedItems,
          successfulItems,
          failedItems,
          currentBatch: batchIndex + 1,
          totalBatches,
          percentage: Math.round((processedItems / totalItems) * 100)
        };
        onProgress(progress);
      }
      
      // Callback de lote completado
      if (onBatchComplete) {
        onBatchComplete(batchResult);
      }
      
      // Delay entre lotes para no sobrecargar el sistema
      if (batchIndex < batches.length - 1 && delayBetweenBatches > 0) {
        await delay(delayBetweenBatches);
      }
      
    } catch (error) {
      const errorMessage = `Error procesando lote ${batchIndex + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      globalErrors.push(errorMessage);
      
      // Marcar todos los items del lote como fallidos
      const failedBatchResult: BatchResult = {
        batchNumber: batchIndex + 1,
        successful: [],
        failed: batch.map(item => ({
          item,
          error: errorMessage
        })),
        processingTime: Date.now() - batchStartTime
      };
      
      results.push(failedBatchResult);
      processedItems += batch.length;
      failedItems += batch.length;
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage), batch);
      }
    }
  }

  const endTime = Date.now();
  
  return {
    success: failedItems === 0,
    totalProcessed: processedItems,
    totalSuccessful: successfulItems,
    totalFailed: failedItems,
    results,
    errors: globalErrors,
    processingTime: endTime - startTime
  };
}

// Procesar un lote individual con reintentos
async function processBatch<T, R>(
  batch: T[],
  processor: (item: T) => Promise<R>,
  batchNumber: number,
  maxRetries: number
): Promise<BatchResult> {
  const startTime = Date.now();
  const successful: R[] = [];
  const failed: { item: T; error: string }[] = [];

  for (const item of batch) {
    let lastError: Error | null = null;
    let success = false;
    
    // Intentar procesar el item con reintentos
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await processor(item);
        successful.push(result);
        success = true;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido');
        
        // Si no es el último intento, esperar antes de reintentar
        if (attempt < maxRetries) {
          await delay(attempt * 100); // Backoff exponencial
        }
      }
    }
    
    // Si no se pudo procesar después de todos los intentos
    if (!success && lastError) {
      failed.push({
        item,
        error: `Falló después de ${maxRetries} intentos: ${lastError.message}`
      });
    }
  }

  return {
    batchNumber,
    successful,
    failed,
    processingTime: Date.now() - startTime
  };
}

// Función auxiliar para dividir array en chunks
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Función auxiliar para delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Hook personalizado para procesamiento por lotes con React
export function useBatchProcessing<T, R>() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [results, setResults] = useState<BatchProcessingResult | null>(null);
  
  const processBatchesWithState = async (
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchProcessingOptions = {}
  ) => {
    setIsProcessing(true);
    setProgress(null);
    setResults(null);
    
    try {
      const result = await processBatches(items, processor, {
        ...options,
        onProgress: (progress) => {
          setProgress(progress);
          options.onProgress?.(progress);
        }
      });
      
      setResults(result);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };
  
  const reset = () => {
    setIsProcessing(false);
    setProgress(null);
    setResults(null);
  };
  
  return {
    isProcessing,
    progress,
    results,
    processBatches: processBatchesWithState,
    reset
  };
}

// Importar useState para el hook
import { useState } from 'react';

// Configuraciones predefinidas para diferentes escenarios
export const BATCH_CONFIGS = {
  // Para importaciones pequeñas (< 100 items)
  SMALL: {
    batchSize: 5,
    delayBetweenBatches: 50,
    maxRetries: 2
  },
  
  // Para importaciones medianas (100-1000 items)
  MEDIUM: {
    batchSize: 10,
    delayBetweenBatches: 100,
    maxRetries: 3
  },
  
  // Para importaciones grandes (> 1000 items)
  LARGE: {
    batchSize: 20,
    delayBetweenBatches: 200,
    maxRetries: 3
  },
  
  // Para importaciones muy grandes con prioridad en estabilidad
  EXTRA_LARGE: {
    batchSize: 50,
    delayBetweenBatches: 500,
    maxRetries: 5
  }
};

// Función para seleccionar configuración automáticamente
export function getOptimalBatchConfig(itemCount: number): BatchProcessingOptions {
  if (itemCount < 100) {
    return BATCH_CONFIGS.SMALL;
  } else if (itemCount < 1000) {
    return BATCH_CONFIGS.MEDIUM;
  } else if (itemCount < 5000) {
    return BATCH_CONFIGS.LARGE;
  } else {
    return BATCH_CONFIGS.EXTRA_LARGE;
  }
}

// Función para estimar tiempo de procesamiento
export function estimateProcessingTime(
  itemCount: number,
  avgProcessingTimePerItem: number = 200, // ms
  config?: BatchProcessingOptions
): {
  estimatedMinutes: number;
  estimatedSeconds: number;
  totalEstimatedMs: number;
} {
  const batchConfig = config || getOptimalBatchConfig(itemCount);
  const batchSize = batchConfig.batchSize || 10;
  const delayBetweenBatches = batchConfig.delayBetweenBatches || 100;
  
  const totalBatches = Math.ceil(itemCount / batchSize);
  const processingTime = itemCount * avgProcessingTimePerItem;
  const delayTime = (totalBatches - 1) * delayBetweenBatches;
  const totalEstimatedMs = processingTime + delayTime;
  
  return {
    estimatedMinutes: Math.ceil(totalEstimatedMs / 60000),
    estimatedSeconds: Math.ceil(totalEstimatedMs / 1000),
    totalEstimatedMs
  };
}
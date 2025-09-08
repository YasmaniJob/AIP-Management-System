'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X, Eye } from 'lucide-react';
import { processExcelFile, downloadExcelTemplate, getExcelFileInfo, type ExcelProcessingResult } from '@/lib/utils/excel-utils';
import { type ValidationResult, type ImportUser } from '@/lib/validation/import-user-schema';
import { addUserAction } from '@/lib/actions/users';
import { useToast } from '@/hooks/use-toast';
import { useBatchProcessing, getOptimalBatchConfig, estimateProcessingTime } from '@/lib/utils/batch-processing';

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

type ImportStep = 'upload' | 'preview' | 'processing' | 'results';

export function ImportExcelDialog({ open, onOpenChange, onImportComplete }: ImportExcelDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const { isProcessing: isBatchProcessing, progress: batchProgress, processBatches } = useBatchProcessing();
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  // Manejar drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setProcessing(true);
    setValidationResult(null);

    try {
      // Validar tipo de archivo
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls) o CSV.');
      }

      // Validar tamaño de archivo (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        throw new Error('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.');
      }

      toast({
        title: 'Procesando archivo',
        description: `Analizando ${selectedFile.name}...`,
      });

      const result = await processExcelFile(selectedFile);
      
      if (result.success && result.data) {
        if (!result.data.valid || result.data.valid.length === 0) {
          if (result.data.invalid && result.data.invalid.length > 0) {
            toast({
              title: 'Archivo procesado con advertencias',
              description: `Se encontraron ${result.data.invalid.length} filas con errores. Revisa la vista previa.`,
              variant: 'destructive',
            });
          } else {
            throw new Error('No se encontraron datos válidos en el archivo. Verifica que el formato sea correcto.');
          }
        } else {
          toast({
            title: 'Archivo procesado exitosamente',
            description: `Se encontraron ${result.data.stats.total} registros (${result.data.stats.valid} válidos, ${result.data.stats.invalid} con errores)`,
          });
        }
        
        setValidationResult(result.data);
        setStep('preview');
      } else {
        throw new Error(result.error || 'Error desconocido al procesar el archivo');
      }
    } catch (error) {
      console.error('Error procesando archivo:', error);
      
      let errorMessage = 'Error desconocido al procesar el archivo';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: 'Error al procesar archivo',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Resetear estado en caso de error
      setFile(null);
      setStep('upload');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) return;

    setStep('processing');
    setImportProgress(0);

    // Obtener configuración óptima para el lote
    const batchConfig = getOptimalBatchConfig(validationResult.valid.length);
    
    // Estimar tiempo de procesamiento
    const timeEstimate = estimateProcessingTime(validationResult.valid.length);
    
    toast({
      title: 'Iniciando importación',
      description: `Procesando ${validationResult.valid.length} usuarios en lotes. Tiempo estimado: ${timeEstimate.estimatedMinutes} minutos`,
    });

    try {
      const result = await processBatches(
        validationResult.valid,
        async (user: ImportUser) => {
          const userResult = await addUserAction({
            name: `${user.nombre} ${user.apellido}`,
            dni: user.dni,
            email: user.email || `${user.dni}@docente.edu`,
            role: 'Docente' as const,
          }, { skipRevalidation: true });
          
          if (!userResult.success) {
            throw new Error(userResult.error || 'Error al crear usuario');
          }
          
          return userResult;
        },
        {
          ...batchConfig,
          onProgress: (progress) => {
            setImportProgress(progress.percentage);
          },
          onBatchComplete: (batchResult) => {
            console.log(`Lote ${batchResult.batchNumber} completado: ${batchResult.successful.length} exitosos, ${batchResult.failed.length} fallidos`);
          },
          onError: (error, batch) => {
            console.error(`Error en lote:`, error);
          }
        }
      );

      setImportResults({
        successful: result.totalSuccessful,
        failed: result.totalFailed,
        errors: [
          ...result.errors,
          ...result.results.flatMap(r => r.failed.map(f => f.error))
        ]
      });

      setStep('results');
      
      if (result.totalSuccessful > 0) {
        toast({
          title: 'Importación completada',
          description: `Se importaron ${result.totalSuccessful} usuarios exitosamente en ${Math.round(result.processingTime / 1000)} segundos`,
        });
        
        // Notificar que la importación se completó para que el componente padre actualice
        onImportComplete?.();
      }
      
      if (result.totalFailed > 0) {
        toast({
          title: 'Importación con errores',
          description: `${result.totalFailed} usuarios no pudieron ser importados`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error en la importación',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
      
      setImportResults({
        successful: 0,
        failed: validationResult.valid.length,
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      });
      
      setStep('results');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadExcelTemplate();
      toast({
        title: 'Plantilla descargada',
        description: 'La plantilla Excel se ha descargado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo descargar la plantilla',
        variant: 'destructive',
      });
    }
  };

  const resetDialog = () => {
    setStep('upload');
    setFile(null);
    setValidationResult(null);
    setProcessing(false);
    setImportProgress(0);
    setImportResults(null);
    setDragActive(false);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Docentes desde Excel
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Botón para descargar plantilla */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar plantilla Excel
                </Button>
              </div>

              {/* Área de drag & drop */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Arrastra tu archivo Excel aquí
                </h3>
                <p className="text-gray-500 mb-4">
                  o haz clic para seleccionar un archivo
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.xlsm"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="excel-file-input"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('excel-file-input')?.click()}
                  disabled={processing}
                >
                  Seleccionar archivo
                </Button>
              </div>

              {processing && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Procesando archivo...</p>
                </div>
              )}

              {/* Información sobre el formato */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  El archivo Excel debe contener las columnas: nombre, apellido, dni, email (opcional), 
                  teléfono (opcional), dirección (opcional), fecha_nacimiento (opcional), 
                  especialidad (opcional), cargo (opcional), departamento (opcional).
                </AlertDescription>
              </Alert>
            </div>
          )}

          {step === 'preview' && validationResult && (
            <div className="space-y-4">
              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{validationResult.stats.total}</div>
                  <div className="text-sm text-blue-600">Total</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{validationResult.stats.valid}</div>
                  <div className="text-sm text-green-600">Válidos</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{validationResult.stats.invalid}</div>
                  <div className="text-sm text-red-600">Con errores</div>
                </div>
              </div>

              {/* Tabs para ver datos válidos e inválidos */}
              <Tabs defaultValue="valid" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="valid" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Válidos ({validationResult.stats.valid})
                  </TabsTrigger>
                  <TabsTrigger value="invalid" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Con errores ({validationResult.stats.invalid})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="valid" className="mt-4">
                  <ScrollArea className="h-64 w-full border rounded">
                    <div className="p-4">
                      {validationResult.valid.length > 0 ? (
                        <div className="space-y-2">
                          {validationResult.valid.slice(0, 10).map((user, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                              <span className="font-medium">{user.nombre} {user.apellido}</span>
                              <Badge variant="secondary">{user.dni}</Badge>
                            </div>
                          ))}
                          {validationResult.valid.length > 10 && (
                            <p className="text-sm text-gray-500 text-center">
                              ... y {validationResult.valid.length - 10} más
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500">No hay registros válidos</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="invalid" className="mt-4">
                  <ScrollArea className="h-64 w-full border rounded">
                    <div className="p-4">
                      {validationResult.invalid.length > 0 ? (
                        <div className="space-y-3">
                          {validationResult.invalid.slice(0, 10).map((item, index) => (
                            <div key={index} className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-red-800">Fila {item.row}</span>
                                <Badge variant="destructive">Error</Badge>
                              </div>
                              <div className="text-sm text-red-600">
                                {item.errors.join(', ')}
                              </div>
                            </div>
                          ))}
                          {validationResult.invalid.length > 10 && (
                            <p className="text-sm text-gray-500 text-center">
                              ... y {validationResult.invalid.length - 10} errores más
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500">No hay errores</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-6 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <div>
                <h3 className="text-lg font-medium mb-2">Importando usuarios...</h3>
                <Progress value={importProgress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-gray-500 mt-2">{importProgress}% completado</p>
                {isBatchProcessing && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Procesando en lotes para optimizar rendimiento
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'results' && importResults && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium">Resultados de la importación</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {importResults.successful + importResults.failed} usuarios procesados
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
                  <div className="text-sm text-green-700">Usuarios importados</div>
                  {importResults.successful > 0 && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Importación exitosa
                    </div>
                  )}
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                  <div className="text-sm text-red-700">Errores</div>
                  {importResults.failed > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      ⚠ Revisar errores
                    </div>
                  )}
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-red-700">Errores encontrados:</div>
                    <div className="text-xs text-muted-foreground">
                      {importResults.errors.length} error(es)
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md p-2 bg-red-50">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-700 bg-white p-2 rounded border-l-2 border-red-300">
                        <span className="font-medium">Error {index + 1}:</span> {error}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    💡 Tip: Revisa los datos en el archivo Excel y vuelve a intentar
                  </div>
                </div>
              )}

              {importResults.successful > 0 && importResults.failed === 0 && (
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-green-700 font-medium">
                    🎉 ¡Importación completada exitosamente!
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Todos los usuarios fueron importados correctamente
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          
          {step === 'preview' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Volver
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!validationResult || validationResult.valid.length === 0}
              >
                Importar {validationResult?.stats.valid || 0} usuarios
              </Button>
            </div>
          )}
          
          {step === 'results' && (
            <Button onClick={handleClose}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
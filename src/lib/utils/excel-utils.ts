import * as XLSX from 'xlsx';
import { validateImportedUsers, normalizeHeaders, transformExcelData, type ValidationResult } from '../validation/import-user-schema';

// Tipos para el procesamiento de Excel
export interface ExcelProcessingResult {
  success: boolean;
  data?: ValidationResult;
  error?: string;
  fileName?: string;
  sheetNames?: string[];
}

export interface ExcelParseOptions {
  sheetName?: string;
  headerRow?: number;
  maxRows?: number;
  skipEmptyRows?: boolean;
}

// Función principal para procesar archivos Excel
export async function processExcelFile(
  file: File,
  options: ExcelParseOptions = {}
): Promise<ExcelProcessingResult> {
  try {
    // Validar tipo de archivo
    if (!isValidExcelFile(file)) {
      return {
        success: false,
        error: 'Tipo de archivo no válido. Solo se permiten archivos .xlsx, .xls'
      };
    }

    // Validar tamaño de archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: 'El archivo es muy grande. Máximo permitido: 10MB'
      };
    }

    // Leer el archivo
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Obtener nombres de hojas
    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      return {
        success: false,
        error: 'El archivo Excel no contiene hojas de cálculo'
      };
    }

    // Seleccionar hoja a procesar
    const sheetName = options.sheetName || sheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      return {
        success: false,
        error: `No se encontró la hoja "${sheetName}"`
      };
    }

    // Convertir a JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: !options.skipEmptyRows
    }) as any[][];

    if (rawData.length === 0) {
      return {
        success: false,
        error: 'La hoja de cálculo está vacía'
      };
    }

    // Procesar datos
    const processedData = processRawExcelData(rawData, options);
    
    if (processedData.length === 0) {
      return {
        success: false,
        error: 'No se encontraron datos válidos para procesar'
      };
    }

    // Validar datos
    const validationResult = validateImportedUsers(processedData);

    return {
      success: true,
      data: validationResult,
      fileName: file.name,
      sheetNames
    };

  } catch (error) {
    console.error('Error procesando archivo Excel:', error);
    return {
      success: false,
      error: `Error procesando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

// Función para procesar datos crudos de Excel
function processRawExcelData(rawData: any[][], options: ExcelParseOptions): any[] {
  const headerRowIndex = (options.headerRow || 1) - 1;
  
  if (rawData.length <= headerRowIndex) {
    return [];
  }

  // Obtener headers
  const headers = rawData[headerRowIndex].map((header: any) => 
    String(header || '').trim()
  ).filter(header => header !== '');

  if (headers.length === 0) {
    return [];
  }

  // Normalizar headers para mapeo automático
  const headerMapping = normalizeHeaders(headers);

  // Procesar filas de datos
  const dataRows = rawData.slice(headerRowIndex + 1);
  const maxRows = options.maxRows || dataRows.length;
  
  const processedData = dataRows
    .slice(0, maxRows)
    .map(row => {
      const rowData: any = {};
      headers.forEach((header, index) => {
        const value = row[index];
        if (value !== undefined && value !== null && value !== '') {
          rowData[header] = String(value).trim();
        }
      });
      return rowData;
    })
    .filter(row => Object.keys(row).length > 0); // Filtrar filas vacías

  // Transformar datos usando mapeo de columnas
  return transformExcelData(processedData, headerMapping);
}

// Validar si el archivo es un Excel válido
export function isValidExcelFile(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/vnd.ms-excel.sheet.macroEnabled.12' // .xlsm
  ];
  
  const validExtensions = ['.xlsx', '.xls', '.xlsm'];
  
  return validTypes.includes(file.type) || 
         validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

// Función para generar plantilla Excel
export function generateExcelTemplate(): Uint8Array {
  const templateData = [
    // Headers
    ['nombre', 'apellido', 'dni', 'email', 'telefono', 'direccion', 'fecha_nacimiento', 'especialidad', 'cargo', 'departamento'],
    // Ejemplo de datos
    ['Juan', 'Pérez', '12345678', 'juan.perez@email.com', '123456789', 'Calle 123', '1980-01-15', 'Matemáticas', 'Profesor', 'Ciencias'],
    ['María', 'González', '87654321', 'maria.gonzalez@email.com', '987654321', 'Avenida 456', '1975-05-20', 'Historia', 'Coordinadora', 'Humanidades'],
    ['Carlos', 'López', '11223344', 'carlos.lopez@email.com', '555666777', 'Plaza 789', '1985-12-10', 'Física', 'Profesor', 'Ciencias']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(templateData);
  
  // Configurar ancho de columnas
  const columnWidths = [
    { wch: 15 }, // nombre
    { wch: 15 }, // apellido
    { wch: 12 }, // dni
    { wch: 25 }, // email
    { wch: 15 }, // telefono
    { wch: 20 }, // direccion
    { wch: 15 }, // fecha_nacimiento
    { wch: 15 }, // especialidad
    { wch: 15 }, // cargo
    { wch: 15 }  // departamento
  ];
  
  worksheet['!cols'] = columnWidths;

  // Crear workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Docentes');

  // Generar archivo
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

// Función para descargar plantilla
export function downloadExcelTemplate(filename: string = 'plantilla-docentes.xlsx'): void {
  try {
    const templateData = generateExcelTemplate();
    const blob = new Blob([templateData], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error descargando plantilla:', error);
    throw new Error('No se pudo descargar la plantilla');
  }
}

// Función para obtener información del archivo Excel sin procesarlo completamente
export async function getExcelFileInfo(file: File): Promise<{
  success: boolean;
  info?: {
    fileName: string;
    fileSize: string;
    sheetNames: string[];
    estimatedRows: number;
  };
  error?: string;
}> {
  try {
    if (!isValidExcelFile(file)) {
      return {
        success: false,
        error: 'Tipo de archivo no válido'
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Estimar número de filas en la primera hoja
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1:A1');
    const estimatedRows = Math.max(0, range.e.r - range.s.r);

    return {
      success: true,
      info: {
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        sheetNames: workbook.SheetNames,
        estimatedRows
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Error leyendo archivo Excel'
    };
  }
}

// Función auxiliar para formatear tamaño de archivo
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
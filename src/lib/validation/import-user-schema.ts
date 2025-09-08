import { z } from 'zod';

// Esquema para validar un usuario individual desde Excel
export const importUserSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  apellido: z.string().min(1, 'El apellido es requerido').max(100, 'El apellido es muy largo'),
  dni: z.string().min(7, 'DNI debe tener al menos 7 caracteres').max(10, 'DNI muy largo'),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  especialidad: z.string().optional(),
  cargo: z.string().optional(),
  departamento: z.string().optional(),
});

// Tipo TypeScript derivado del esquema
export type ImportUser = z.infer<typeof importUserSchema>;

// Esquema para validar múltiples usuarios
export const importUsersSchema = z.array(importUserSchema);

// Resultado de validación
export interface ValidationResult {
  valid: ImportUser[];
  invalid: {
    row: number;
    data: any;
    errors: string[];
  }[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
  };
}

// Función para validar usuarios importados
export function validateImportedUsers(data: any[]): ValidationResult {
  const valid: ImportUser[] = [];
  const invalid: ValidationResult['invalid'] = [];

  data.forEach((row, index) => {
    try {
      const validatedUser = importUserSchema.parse(row);
      valid.push(validatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        invalid.push({
          row: index + 1,
          data: row,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        });
      } else {
        invalid.push({
          row: index + 1,
          data: row,
          errors: ['Error desconocido de validación']
        });
      }
    }
  });

  return {
    valid,
    invalid,
    stats: {
      total: data.length,
      valid: valid.length,
      invalid: invalid.length
    }
  };
}

// Mapeo de columnas comunes en Excel
export const COLUMN_MAPPINGS = {
  // Nombres posibles para cada campo
  nombre: ['nombre', 'name', 'first_name', 'firstName', 'primer_nombre'],
  apellido: ['apellido', 'lastname', 'last_name', 'lastName', 'surname'],
  dni: ['dni', 'DNI', 'cedula', 'documento', 'id', 'identification'],
  email: ['email', 'correo', 'mail', 'e-mail', 'correo_electronico'],
  telefono: ['telefono', 'phone', 'celular', 'movil', 'tel'],
  direccion: ['direccion', 'address', 'domicilio'],
  fecha_nacimiento: ['fecha_nacimiento', 'birth_date', 'birthdate', 'nacimiento'],
  especialidad: ['especialidad', 'specialty', 'area', 'materia'],
  cargo: ['cargo', 'position', 'puesto', 'role'],
  departamento: ['departamento', 'department', 'area', 'division']
};

// Función para normalizar headers de Excel
export function normalizeHeaders(headers: string[]): Record<string, string> {
  const normalized: Record<string, string> = {};
  
  headers.forEach(header => {
    const cleanHeader = header.toLowerCase().trim();
    
    // Buscar coincidencia en los mapeos
    for (const [field, variations] of Object.entries(COLUMN_MAPPINGS)) {
      if (variations.some(variation => cleanHeader.includes(variation.toLowerCase()))) {
        normalized[header] = field;
        break;
      }
    }
  });
  
  return normalized;
}

// Función para transformar datos usando el mapeo de columnas
export function transformExcelData(data: any[], headerMapping: Record<string, string>): any[] {
  return data.map(row => {
    const transformedRow: any = {};
    
    Object.entries(row).forEach(([originalKey, value]) => {
      const mappedKey = headerMapping[originalKey] || originalKey;
      transformedRow[mappedKey] = value;
    });
    
    return transformedRow;
  });
}
// Mapeo de estados específicos para cada tipo de daño
// Cada tipo de daño tiene sus propios estados de reparación permitidos

export const damageStatusMapping = {
  // Daños de pantalla
  'Pantalla Rota': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para reparación de pantallas rotas o dañadas'
  },
  'Pantalla Táctil': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para problemas de táctil'
  },
  'No da video': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para problemas de video'
  },

  // Problemas eléctricos
  'No enciende': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para equipos que no encienden'
  },
  'Batería': {
    states: [
      'Esperando Repuestos',
      'En Reparación',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para problemas de batería'
  },

  // Componentes físicos
  'Cable/Conector': {
    states: [
      'Esperando Repuestos',
      'En Reparación',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para cables y conectores dañados'
  },
  'Carcasa Rota': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para carcasas rotas o dañadas'
  },
  'Teclado': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para teclados defectuosos'
  },
  'Mouse': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para mouse defectuoso'
  },

  // Proyectores
  'Lámpara quemada': {
    states: [
      'Esperando Repuestos',
      'En Reparación',
      'Completado'
    ],
    defaultState: 'Esperando Repuestos',
    description: 'Estados para lámparas de proyector quemadas'
  },
  'Imagen borrosa': {
    states: [
      'En Reparación',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para problemas de enfoque'
  },
  'Sobrecalentamiento': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para problemas de temperatura'
  },
  'No proyecta': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para proyectores que no proyectan'
  },

  // Cámaras y filmadoras
  'Lente': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para lentes atascados o rotos'
  },
  'No enfoca': {
    states: [
      'En Reparación',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para problemas de enfoque'
  },
  'Flash': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para flash que no funciona'
  },
  'No graba': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para filmadoras que no graban'
  },

  // Periféricos
  'No funciona': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para periféricos que no funcionan'
  },
  'Botón/Rueda': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para botones o ruedas atascados'
  },

  // Redes
  'No da señal': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para equipos de red sin señal'
  },
  'Luz/LED': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para LEDs que no encienden'
  },
  'Cable/Puerto': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para puertos dañados'
  },

  // Cables y adaptadores
  'Falso contacto': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para cables con falso contacto'
  },
  'Conector roto': {
    states: [
      'Esperando Repuestos',
      'En Reparación',
      'Completado'
    ],
    defaultState: 'Esperando Repuestos',
    description: 'Estados para conectores rotos'
  },
  'Cable pelado': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para cables pelados'
  },

  // Audio
  'No se escucha': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para equipos de audio sin sonido'
  },
  'Micrófono': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para micrófonos que no funcionan'
  },
  'Ruido/Estática': {
    states: [
      'En Reparación',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para problemas de ruido'
  },

  // Mobiliario
  'Pata coja': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para patas rotas o cojas'
  },
  'Superficie rayada': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para superficies rayadas'
  },
  'Pieza faltante': {
    states: [
      'Esperando Repuestos',
      'En Reparación',
      'Completado'
    ],
    defaultState: 'Esperando Repuestos',
    description: 'Estados para piezas faltantes'
  },

  // Componente genérico
  'Componente Roto': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para componentes rotos genéricos'
  },

  // Otros
  'Otro': {
    states: [
      'En Reparación',
      'Esperando Repuestos',
      'Completado'
    ],
    defaultState: 'En Reparación',
    description: 'Estados para otros tipos de daño'
  }
} as const;

// Función para obtener los estados permitidos para un tipo de daño
export function getAllowedStatesForDamage(damageType: string): string[] {
  const mapping = damageStatusMapping[damageType as keyof typeof damageStatusMapping];
  const baseStates = mapping ? mapping.states : damageStatusMapping['Otro'].states;
  
  // Asegurar que 'Completado' siempre esté disponible como estado final
  if (!baseStates.includes('Completado')) {
    return [...baseStates, 'Completado'];
  }
  
  return baseStates;
}

// Función para obtener el estado por defecto para un tipo de daño
export function getDefaultStateForDamage(damageType: string): string {
  const mapping = damageStatusMapping[damageType as keyof typeof damageStatusMapping];
  return mapping ? mapping.defaultState : damageStatusMapping['Otro'].defaultState;
}

// Función para validar si un estado es válido para un tipo de daño
export function isValidStateForDamage(damageType: string, status: string): boolean {
  const allowedStates = getAllowedStatesForDamage(damageType);
  return allowedStates.includes(status);
}

// Función para obtener la descripción de un mapeo de daño
export function getDamageStateDescription(damageType: string): string {
  const mapping = damageStatusMapping[damageType as keyof typeof damageStatusMapping];
  return mapping ? mapping.description : damageStatusMapping['Otro'].description;
}

// Todos los estados posibles del sistema
export const allMaintenanceStates = [
  'En Reparación',
  'Esperando Repuestos',
  'Completado'
] as const;

export type MaintenanceState = typeof allMaintenanceStates[number];
export type DamageType = keyof typeof damageStatusMapping;
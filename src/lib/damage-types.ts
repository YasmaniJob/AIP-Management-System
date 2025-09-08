import { Monitor, PowerOff, Keyboard, Cable, HardDrive, Camera, RefreshCw, ShieldX, Trash2, Plus, Speaker, Mic, Armchair, Projector, Network, MousePointerClick, Sparkles, Settings, Replace, Lightbulb, Compass, SquareStack, Wand, Battery, Wind, Droplets, GraduationCap, Package } from 'lucide-react';

const commonTechDamages = [
  { id: 'No enciende', label: 'No enciende', icon: PowerOff },
  { id: 'Cable/Conector', label: 'Cable/Conector dañado', icon: Cable },
  { id: 'Carcasa Rota', label: 'Carcasa/Cuerpo roto', icon: HardDrive },
  { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
];

export const damageTypesByCategory = {
  'Laptops': [
    { id: 'Pantalla Rota', label: 'Pantalla Rota', icon: Monitor },
    { id: 'Teclado', label: 'Teclado defectuoso', icon: Keyboard },
    { id: 'Batería', label: 'Batería no carga', icon: Battery },
    ...commonTechDamages
  ],
  'PCs de Escritorio': [
    { id: 'Pantalla Rota', label: 'Pantalla Rota', icon: Monitor },
    { id: 'No da video', label: 'No da video', icon: Monitor },
    { id: 'Teclado', label: 'Teclado defectuoso', icon: Keyboard },
    { id: 'Mouse', label: 'Mouse defectuoso', icon: MousePointerClick },
    ...commonTechDamages
  ],
  'Tablets': [
    { id: 'Pantalla Táctil', label: 'Táctil no funciona', icon: Monitor },
    { id: 'Pantalla Rota', label: 'Pantalla Rota', icon: Monitor },
    { id: 'Batería', label: 'Batería no carga', icon: Battery },
    ...commonTechDamages
  ],
  'Proyectores': [
    { id: 'Lámpara quemada', label: 'Lámpara quemada', icon: Lightbulb },
    { id: 'Imagen borrosa', label: 'Imagen borrosa', icon: Compass },
    { id: 'Sobrecalentamiento', label: 'Sobrecalentamiento', icon: Wind },
    { id: 'No proyecta', label: 'No proyecta imagen', icon: Projector },
    ...commonTechDamages
  ],
  'Cámaras Fotográficas': [
    { id: 'Lente', label: 'Lente atascado/roto', icon: Camera },
    { id: 'No enfoca', label: 'No enfoca', icon: Compass },
    { id: 'Flash', label: 'Flash no funciona', icon: Lightbulb },
    ...commonTechDamages
  ],
  'Filmadoras': [
    { id: 'Lente', label: 'Lente atascado/roto', icon: Camera },
    { id: 'No graba', label: 'No graba', icon: Mic },
    { id: 'Pantalla', label: 'Pantalla no funciona', icon: Monitor },
    ...commonTechDamages
  ],
  'Periféricos': [
    { id: 'No funciona', label: 'No funciona', icon: PowerOff },
    { id: 'Botón/Rueda', label: 'Botón/Rueda atascado', icon: MousePointerClick },
    { id: 'Cable/Conector', label: 'Cable/Conector dañado', icon: Cable },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Redes': [
    { id: 'No da señal', label: 'No da señal', icon: Network },
    { id: 'Luz/LED', label: 'Luz/LED no enciende', icon: PowerOff },
    { id: 'Cable/Puerto', label: 'Cable/Puerto dañado', icon: Cable },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Cables y Adaptadores': [
    { id: 'Falso contacto', label: 'Falso contacto', icon: Cable },
    { id: 'Conector roto', label: 'Conector roto', icon: Cable },
    { id: 'Cable pelado', label: 'Cable pelado', icon: Cable },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Audio': [
    { id: 'No se escucha', label: 'No se escucha', icon: Speaker },
    { id: 'Micrófono', label: 'Micrófono no funciona', icon: Mic },
    { id: 'Ruido/Estática', label: 'Ruido/Estática', icon: Speaker },
    { id: 'Cable/Conector', label: 'Cable/Conector dañado', icon: Cable },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Mobiliario': [
    { id: 'Pata coja', label: 'Pata coja/rota', icon: Armchair },
    { id: 'Superficie rayada', label: 'Superficie rayada/dañada', icon: Wand },
    { id: 'Pieza faltante', label: 'Pieza faltante', icon: SquareStack },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Otros': [
    { id: 'No funciona', label: 'No funciona', icon: PowerOff },
    { id: 'Componente Roto', label: 'Componente Roto', icon: HardDrive },
    { id: 'Cable/Conector', label: 'Cable/Conector dañado', icon: Cable },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
} as const;

const commonTechSuggestions = [
    { id: 'Necesita formateo', label: 'Necesita formateo', icon: RefreshCw },
    { id: 'Funciona lento', label: 'Funciona lento', icon: Trash2 },
    { id: 'Actualizar SO', label: 'Actualizar SO/Firmware', icon: Settings },
    { id: 'Instalar Software', label: 'Instalar Software Educativo', icon: GraduationCap },
    { id: 'Limpieza interna', label: 'Limpieza interna de polvo', icon: Wind },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
];

export const suggestionTypesByCategory = {
  'Laptops': [ ...commonTechSuggestions ],
  'PCs de Escritorio': [ ...commonTechSuggestions ],
  'Tablets': [ ...commonTechSuggestions ],
  'Proyectores': [
    { id: 'Limpiar lente', label: 'Limpiar lente', icon: Sparkles },
    { id: 'Calibrar color', label: 'Calibrar color', icon: Compass },
    { id: 'Revisar lámpara', label: 'Revisar horas de lámpara', icon: Lightbulb },
    { id: 'Limpiar filtros', label: 'Limpiar filtros de aire', icon: Wind },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Cámaras Fotográficas': [
    { id: 'Limpiar sensor', label: 'Limpiar sensor', icon: Sparkles },
    { id: 'Limpiar lente', label: 'Limpiar lente', icon: Sparkles },
    { id: 'Actualizar firmware', label: 'Actualizar firmware', icon: Settings },
    { id: 'Calibrar enfoque', label: 'Calibrar enfoque', icon: Compass },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Filmadoras': [
    { id: 'Limpiar lente', label: 'Limpiar lente', icon: Sparkles },
    { id: 'Revisar micrófono', label: 'Revisar calidad de micrófono', icon: Mic },
    { id: 'Actualizar firmware', label: 'Actualizar firmware', icon: Settings },
    { id: 'Formatear memoria', label: 'Formatear memoria interna/SD', icon: HardDrive },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Periféricos': [
    { id: 'Limpiar/Desinfectar', label: 'Limpiar/Desinfectar', icon: Sparkles },
    { id: 'Cambiar baterías', label: 'Cambiar baterías', icon: Battery },
    { id: 'Verificar conexión', label: 'Verificar conexión/drivers', icon: Settings },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Redes': [
    { id: 'Resetear configuración', label: 'Resetear configuración', icon: RefreshCw },
    { id: 'Actualizar firmware', label: 'Actualizar firmware', icon: Settings },
    { id: 'Revisar alcance', label: 'Revisar alcance de señal', icon: Compass },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Cables y Adaptadores': [
    { id: 'Reemplazar', label: 'Reemplazar', icon: Replace },
    { id: 'Etiquetar', label: 'Etiquetar para identificar', icon: Wand },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Audio': [
    { id: 'Limpiar/Desinfectar', label: 'Limpiar/Desinfectar', icon: Sparkles },
    { id: 'Probar en otro equipo', label: 'Probar en otro equipo', icon: Replace },
    { id: 'Revisar drivers', label: 'Revisar drivers/software', icon: Settings },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Mobiliario': [
    { id: 'Ajustar/Reforzar', label: 'Ajustar/Reforzar tornillos', icon: Settings },
    { id: 'Limpieza profunda', label: 'Limpieza profunda', icon: Droplets },
    { id: 'Pintar/Barnizar', label: 'Pintar/Barnizar', icon: Wand },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
  'Otros': [
    { id: 'Verificar funcionamiento', label: 'Verificar funcionamiento', icon: Compass },
    { id: 'Limpiar', label: 'Limpiar', icon: Sparkles },
    { id: 'Reemplazar', label: 'Reemplazar/Actualizar', icon: Replace },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
  ],
} as const;


// Kept for backwards compatibility or other uses if needed
export const quickSuggestions = [
    { id: 'Necesita formateo', label: 'Necesita formateo', icon: RefreshCw },
    { id: 'Tiene virus', label: 'Tiene virus', icon: ShieldX },
    { id: 'Funciona lento', label: 'Funciona lento', icon: Trash2 },
    { id: 'Problemas de conexión', label: 'Problemas de conexión', icon: Cable },
    { id: 'Otro', label: 'Otro (especificar)', icon: Plus },
] as const;

# UI Standards Guide

## Sistema de Colores

Utiliza el archivo `@/lib/colors` para colores consistentes en toda la aplicación.

### Variantes de Color Disponibles

- `success`: Estados exitosos (verde)
- `warning`: Advertencias (ámbar)
- `error`: Errores (rojo)
- `info`: Información (azul)
- `neutral`: Colores neutros (gris)

### Propiedades de Color

Cada variante incluye:
- `bg`: Color de fondo
- `text`: Color de texto
- `border`: Color de borde
- `button`: Estilo para botones
- `badge`: Estilo para badges
- `icon`: Color para iconos

### Ejemplo de Uso de Colores

```tsx
import { colors } from '@/lib/colors';
import { cn } from '@/lib/utils';

// Usar colores estandarizados
<div className={cn("p-4 rounded-md", colors.success.bg, colors.success.text)}>
  Operación exitosa
</div>

// Botón con color estandarizado
<Button className={colors.warning.button}>
  Advertencia
</Button>
```

## Button Component

El componente `Button` es el estándar para todos los botones en la aplicación.

### Variantes Disponibles

- `default`: Botón primario (azul)
- `destructive`: Acciones destructivas (rojo)
- `outline`: Botón con borde
- `secondary`: Botón secundario (gris)
- `ghost`: Botón transparente
- `link`: Estilo de enlace
- `success`: Acciones exitosas (verde)
- `warning`: Advertencias (ámbar)

### Tamaños Disponibles

- `xs`: Extra pequeño (h-8)
- `sm`: Pequeño (h-9)
- `default`: Estándar (h-10)
- `lg`: Grande (h-11)
- `icon`: Para iconos (h-10 w-10)

### Ejemplos de Uso

```tsx
// Botón primario estándar
<Button>Guardar</Button>

// Botón destructivo
<Button variant="destructive">Eliminar</Button>

// Botón de éxito
<Button variant="success">Completar</Button>

// Botón pequeño con icono
<Button size="sm" variant="outline">
  <Plus className="mr-2 h-4 w-4" />
  Agregar
</Button>

// Botón solo icono
<Button size="icon" variant="ghost">
  <Edit className="h-4 w-4" />
</Button>
```

## Icon Component

El componente `Icon` estandariza el uso de iconos en toda la aplicación.

### Tamaños Disponibles

- `xs`: 12px (h-3 w-3)
- `sm`: 16px (h-4 w-4)
- `md`: 20px (h-5 w-5) - por defecto
- `lg`: 24px (h-6 w-6)
- `xl`: 32px (h-8 w-8)
- `2xl`: 40px (h-10 w-10)

### Colores Predefinidos

- `primary`: Color primario
- `secondary`: Color secundario
- `muted`: Color atenuado
- `destructive`: Color destructivo
- `success`: Verde
- `warning`: Ámbar
- `info`: Azul

### Ejemplos de Uso

```tsx
import { Icon } from '@/components/atoms/icon';
import { User, Settings, AlertTriangle } from 'lucide-react';

// Icono básico
<Icon icon={User} />

// Icono con tamaño y color
<Icon icon={Settings} size="lg" color="primary" />

// Icono de advertencia
<Icon icon={AlertTriangle} color="warning" aria-label="Advertencia" />

// Icono personalizado
<Icon icon={User} size="sm" className="rotate-45" />
```

## Mejores Prácticas

### Mejores Prácticas

### Botones

1. **Consistencia**: Usa siempre el componente `Button` en lugar de elementos `<button>` nativos
2. **Colores**: Utiliza el sistema de colores centralizado en lugar de clases hardcodeadas
3. **Variantes semánticas**: 
   - `default` para acciones primarias
   - `destructive` para eliminar/cancelar
   - `success` para confirmar/completar
   - `outline` para acciones secundarias
4. **Tamaños apropiados**: 
   - `lg` para CTAs importantes
   - `default` para la mayoría de casos
   - `sm` para acciones en tablas/cards
   - `xs` para acciones muy pequeñas

### Iconos

1. **Tamaños consistentes**: Usa los tamaños predefinidos
2. **Colores semánticos**: Prefiere los colores predefinidos sobre colores custom
3. **Accesibilidad**: Siempre incluye `aria-label` para iconos sin texto
4. **Contexto**: El tamaño del icono debe coincidir con el contexto (botones, texto, etc.)

### Combinaciones Comunes

```tsx
// Botón con icono - tamaños coincidentes
<Button size="sm">
  <Icon icon={Plus} size="sm" className="mr-2" />
  Agregar
</Button>

// Botón de acción destructiva
<Button variant="destructive" size="sm">
  <Icon icon={Trash2} size="sm" className="mr-2" />
  Eliminar
</Button>

// Botón de éxito
<Button variant="success">
  <Icon icon={Check} size="sm" className="mr-2" />
  Completar
</Button>
```

## Migración

Para migrar código existente:

1. Reemplaza elementos `<button>` nativos con `<Button>`
2. Usa las variantes apropiadas en lugar de clases CSS custom
3. Reemplaza colores hardcodeados con el sistema de colores
4. Reemplaza iconos inline con el componente `<Icon>`
5. Revisa que los tamaños sean consistentes

### Antes
```tsx
<button className="bg-red-500 text-white px-4 py-2 rounded">
  <Trash2 className="h-4 w-4 mr-2" />
  Eliminar
</button>

<div className="bg-green-100 text-green-800 p-2">
  Éxito
</div>
```

### Después
```tsx
<Button variant="destructive">
  <Icon icon={Trash2} size="sm" className="mr-2" />
  Eliminar
</Button>

<div className={cn("p-2", colors.success.bg, colors.success.text)}>
  Éxito
</div>
```
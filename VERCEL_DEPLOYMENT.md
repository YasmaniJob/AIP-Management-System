# Despliegue en Vercel - AIP Manager

## Preparación para el Despliegue

Esta aplicación está configurada para desplegarse en Vercel con las siguientes optimizaciones:

### 1. Configuración de Variables de Entorno

En el dashboard de Vercel, configura las siguientes variables de entorno:

```bash
# Supabase Configuration (REQUERIDO)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Environment
NODE_ENV=production
```

### 2. Configuración del Proyecto

#### Framework Detection
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Dev Command**: `npm run dev`

#### Configuración Automática
El archivo `vercel.json` incluye:
- Configuración de funciones serverless para APIs
- Headers de seguridad
- Rewrites para rutas API
- Optimizaciones de runtime

### 3. Optimizaciones Incluidas

#### Next.js Config (`next.config.ts`)
- ✅ Compresión habilitada
- ✅ Optimización de imágenes (WebP/AVIF)
- ✅ Headers de caché para contenido estático
- ✅ Bundle optimization
- ✅ Headers de seguridad

#### Package.json
- ✅ Scripts de build optimizados
- ✅ Dependencias de producción limpias
- ✅ TypeScript y ESLint configurados

### 4. Pasos para Desplegar

1. **Conectar Repositorio**
   ```bash
   # Asegúrate de que el código esté en GitHub/GitLab/Bitbucket
   git add .
   git commit -m "Preparar para despliegue en Vercel"
   git push origin main
   ```

2. **Importar en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "New Project"
   - Importa tu repositorio
   - Vercel detectará automáticamente Next.js

3. **Configurar Variables de Entorno**
   - En el dashboard del proyecto
   - Ve a Settings > Environment Variables
   - Agrega las variables listadas arriba

4. **Desplegar**
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará automáticamente

### 5. Configuración de Supabase

Asegúrate de que tu proyecto de Supabase esté configurado para producción:

1. **URL Permitidas**
   ```
   https://tu-dominio.vercel.app
   https://tu-dominio-personalizado.com (si tienes uno)
   ```

2. **Configuración de Auth**
   - Configura los redirect URLs en Supabase
   - Verifica las políticas RLS
   - Asegúrate de que las migraciones estén aplicadas

### 6. Verificación Post-Despliegue

- [ ] La aplicación carga correctamente
- [ ] La autenticación funciona
- [ ] Las APIs responden correctamente
- [ ] Las imágenes se cargan optimizadas
- [ ] Los headers de seguridad están presentes

### 7. Monitoreo

Vercel proporciona:
- Analytics de rendimiento
- Logs de funciones
- Métricas de Core Web Vitals
- Alertas de errores

### 8. Dominios Personalizados

Para configurar un dominio personalizado:
1. Ve a Settings > Domains
2. Agrega tu dominio
3. Configura los DNS según las instrucciones
4. Actualiza las URLs permitidas en Supabase

### 9. Troubleshooting

#### Errores Comunes
- **Build Fails**: Verifica que todas las dependencias estén en `package.json`
- **API Errors**: Revisa las variables de entorno
- **Auth Issues**: Verifica las URLs permitidas en Supabase
- **Image Loading**: Confirma los `remotePatterns` en `next.config.ts`

#### Logs
- Funciones: Vercel Dashboard > Functions
- Build: Vercel Dashboard > Deployments > View Build Logs
- Runtime: Vercel Dashboard > Functions > View Logs

---

**Nota**: Esta aplicación está optimizada para el plan gratuito de Vercel con límites de:
- 100GB de bandwidth
- 1000 horas de función serverless
- 100 deployments por día
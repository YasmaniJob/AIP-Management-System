import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* Optimizaciones para planes gratuitos */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Optimización de imágenes para reducir bandwidth
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 año de caché
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Compresión para reducir bandwidth
  compress: true,
  
  // Remover header powered-by para reducir overhead
  poweredByHeader: false,
  
  // Optimizaciones experimentales
  experimental: {
    // Removido optimizeCss para evitar dependencia de 'critters'
    // Temporalmente deshabilitado optimizePackageImports para lucide-react
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast'
    ],
  },
  
  // Paquetes externos del servidor (corregido para Next.js 15)
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // Configuración de webpack para optimizar bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Reducir el tamaño del bundle del cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // Headers de caché para contenido estático
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Deshabilitar caché en desarrollo
          ...(isDev ? [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate, max-age=0',
            },
            {
              key: 'Pragma',
              value: 'no-cache',
            },
            {
              key: 'Expires',
              value: '0',
            },
          ] : []),
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev ? 'no-cache' : 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev ? 'no-cache' : 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

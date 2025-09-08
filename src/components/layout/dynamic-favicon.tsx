'use client';

import { useEffect } from 'react';
import { useAppLogo } from '@/contexts/config-context';

export function DynamicFavicon() {
  const appLogo = useAppLogo();

  useEffect(() => {
    // Función para actualizar el favicon
    const updateFavicon = (iconUrl: string) => {
      // Buscar el favicon existente
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      
      if (!favicon) {
        // Si no existe, crear uno nuevo
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      
      // Actualizar la URL del favicon
      favicon.href = iconUrl;
    };

    // Función para actualizar el apple-touch-icon
    const updateAppleIcon = (iconUrl: string) => {
      let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleIcon);
      }
      
      appleIcon.href = iconUrl;
    };

    // Si hay un logo personalizado, usarlo como favicon
    if (appLogo) {
      updateFavicon(appLogo);
      updateAppleIcon(appLogo);
    } else {
      // Si no hay logo personalizado, usar los iconos por defecto
      updateFavicon('/favicon.svg');
      updateAppleIcon('/icon.png');
    }
  }, [appLogo]);

  // Este componente no renderiza nada visible
  return null;
}
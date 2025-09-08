// Script para limpiar tokens de autenticación corruptos
// Ejecutar en la consola del navegador o como script independiente

const clearAuthTokens = () => {
  try {
    // Limpiar localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('supabase.auth.token') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed: ${key}`);
    });
    
    // Limpiar sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('supabase.auth.token') || key.includes('supabase'))) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`Removed from session: ${key}`);
    });
    
    // Limpiar cookies relacionadas con Supabase
    document.cookie.split(";").forEach(function(c) { 
      const cookie = c.trim();
      if (cookie.indexOf('supabase') === 0 || cookie.indexOf('sb-') === 0) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        console.log(`Cleared cookie: ${name}`);
      }
    });
    
    console.log('✅ Tokens de autenticación limpiados exitosamente');
    console.log('🔄 Recarga la página para aplicar los cambios');
    
  } catch (error) {
    console.error('❌ Error limpiando tokens:', error);
  }
};

// Ejecutar si estamos en el navegador
if (typeof window !== 'undefined') {
  clearAuthTokens();
}

// Exportar para uso en Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = clearAuthTokens;
}
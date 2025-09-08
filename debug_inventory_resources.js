const http = require('http');

// Test inventory page with correct admin user ID
const testInventoryWithCorrectAuth = () => {
  console.log('🔍 Testing inventory page with correct admin user ID...');
  
  // Using the correct admin user ID from database: Yasmani
  const adminUserId = '8622420e-1c98-489e-961c-146327116d35';
  
  const options = {
    hostname: 'localhost',
    port: 9002,
    path: '/inventario',
    method: 'GET',
    headers: {
      'Cookie': `user_id=${adminUserId}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Connection': 'keep-alive'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    
    // Handle redirects
    if (res.statusCode === 302 || res.statusCode === 307) {
      console.log('⚠️  Page is redirecting to:', res.headers.location);
      console.log('❌ Still having authentication issues');
      return;
    }
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n=== INVENTORY PAGE ANALYSIS ===');
      
      if (res.statusCode === 200) {
        console.log('✅ Page loaded successfully!');
        
        // Check for inventory-related content
        const hasInventoryContent = data.includes('inventario') || data.includes('Inventario');
        const hasResourcesContent = data.includes('recursos') || data.includes('Recursos');
        const hasCategoriesContent = data.includes('categorías') || data.includes('Categorías') || data.includes('categoria');
        const hasTabletsContent = data.includes('Tablets') || data.includes('tablets');
        const hasComputersContent = data.includes('Computadoras') || data.includes('computadoras');
        const hasEmptyState = data.includes('No hay') || data.includes('vacío') || data.includes('Sin recursos');
        const hasLoadingState = data.includes('Cargando') || data.includes('Loading');
        const hasErrorState = data.includes('Error') || data.includes('error');
        
        console.log('\n=== CONTENT ANALYSIS ===');
        console.log('Has inventory content:', hasInventoryContent ? '✅' : '❌');
        console.log('Has resources content:', hasResourcesContent ? '✅' : '❌');
        console.log('Has categories content:', hasCategoriesContent ? '✅' : '❌');
        console.log('Has tablets content:', hasTabletsContent ? '✅' : '❌');
        console.log('Has computers content:', hasComputersContent ? '✅' : '❌');
        console.log('Has empty state:', hasEmptyState ? '⚠️' : '✅');
        console.log('Has loading state:', hasLoadingState ? '⚠️' : '✅');
        console.log('Has error state:', hasErrorState ? '⚠️' : '✅');
        
        // Look for specific UI components
        const hasReactComponents = data.includes('data-reactroot') || data.includes('__NEXT_DATA__');
        const hasNextJS = data.includes('_next') || data.includes('__NEXT_DATA__');
        const hasCards = data.includes('card') || data.includes('Card');
        const hasButtons = data.includes('button') || data.includes('Button');
        
        console.log('\n=== TECHNICAL ANALYSIS ===');
        console.log('Has React components:', hasReactComponents ? '✅' : '❌');
        console.log('Has Next.js hydration:', hasNextJS ? '✅' : '❌');
        console.log('Has card components:', hasCards ? '✅' : '❌');
        console.log('Has button components:', hasButtons ? '✅' : '❌');
        
        // Extract relevant content snippets
        console.log('\n=== RELEVANT CONTENT SNIPPETS ===');
        const lines = data.split('\n');
        const relevantLines = lines.filter(line => {
          const lowerLine = line.toLowerCase();
          return lowerLine.includes('inventario') ||
                 lowerLine.includes('recursos') ||
                 lowerLine.includes('categorías') ||
                 lowerLine.includes('categoria') ||
                 lowerLine.includes('tablets') ||
                 lowerLine.includes('computadoras') ||
                 lowerLine.includes('no hay') ||
                 lowerLine.includes('cargando') ||
                 lowerLine.includes('error') ||
                 lowerLine.includes('empty') ||
                 lowerLine.includes('vacío');
        }).slice(0, 20);
        
        if (relevantLines.length > 0) {
          relevantLines.forEach((line, index) => {
            console.log(`${index + 1}. ${line.trim()}`);
          });
        } else {
          console.log('No relevant content found in HTML');
        }
        
        // Check page statistics
        console.log(`\n=== PAGE STATISTICS ===`);
        console.log(`Page size: ${data.length} characters`);
        console.log(`Lines count: ${lines.length}`);
        
        // Look for specific patterns that might indicate the issue
        const hasDataFetching = data.includes('fetch') || data.includes('api');
        const hasJavaScript = data.includes('<script') || data.includes('javascript');
        const hasCSS = data.includes('<style') || data.includes('.css');
        
        console.log('\n=== TECHNICAL DETAILS ===');
        console.log('Has data fetching:', hasDataFetching ? '✅' : '❌');
        console.log('Has JavaScript:', hasJavaScript ? '✅' : '❌');
        console.log('Has CSS:', hasCSS ? '✅' : '❌');
        
        if (data.length < 3000) {
          console.log('\n⚠️  Page seems small, showing first 2000 characters:');
          console.log('='.repeat(50));
          console.log(data.substring(0, 2000));
          console.log('='.repeat(50));
        }
        
      } else {
        console.log('❌ Page failed to load with status:', res.statusCode);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });
  
  req.end();
};

// Test with teacher user as well
const testInventoryWithTeacherAuth = () => {
  console.log('\n🔍 Testing inventory page with teacher user...');
  
  // Using a teacher user ID
  const teacherUserId = '15b400a2-29b1-404e-8005-3d6a712a4280';
  
  const options = {
    hostname: 'localhost',
    port: 9002,
    path: '/inventario',
    method: 'GET',
    headers: {
      'Cookie': `user_id=${teacherUserId}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Teacher access - Status Code: ${res.statusCode}`);
    
    if (res.statusCode === 302 || res.statusCode === 307) {
      console.log('⚠️  Teacher redirected to:', res.headers.location);
    } else if (res.statusCode === 200) {
      console.log('✅ Teacher can access inventory page');
    } else {
      console.log('❌ Teacher access failed');
    }
  });
  
  req.on('error', (e) => {
    console.error(`Teacher request error: ${e.message}`);
  });
  
  req.end();
};

// Run tests
console.log('Testing with correct user IDs from database...');
testInventoryWithCorrectAuth();

setTimeout(() => {
  testInventoryWithTeacherAuth();
}, 2000);
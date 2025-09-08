require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Función parseNotes copiada de utils.ts
function parseNotes(notes) {
  if (!notes || notes.trim() === '') return null;

  const lines = notes.split('\n').filter(line => line.trim() !== '');
  let timestamp = null;
  let processLines = lines;

  // Verificar si la primera línea es un timestamp
  if (lines.length > 0) {
    const firstLine = lines[0];
    const timestampMatch = firstLine.match(/^\[([^\]]+)\]$/);
    if (timestampMatch && !firstLine.includes('Recurso ID')) {
      timestamp = timestampMatch[1];
      processLines = lines.slice(1);
    }
  }

  const resourceReportsMap = new Map();
  let currentResourceId = 'default';

  processLines.forEach(line => {
    const resourceMatch = line.match(/\[Recurso ID (.*?)\]/);
    if (resourceMatch) {
      currentResourceId = resourceMatch[1];
    }

    if (!resourceReportsMap.has(currentResourceId)) {
      resourceReportsMap.set(currentResourceId, { damages: [], suggestions: [], damageNotes: '', suggestionNotes: '' });
    }
    const report = resourceReportsMap.get(currentResourceId);
        
    const damagesBlockMatch = line.match(/Daños: \[([^\]]*)\](?: \| Notas: "([^"]*)")??/);
    if (damagesBlockMatch) {
      report.damages.push(...(damagesBlockMatch[1] ? damagesBlockMatch[1].split(', ').filter(Boolean) : []));
      if (damagesBlockMatch[2]) {
        report.damageNotes = report.damageNotes ? `${report.damageNotes} ${damagesBlockMatch[2]}` : damagesBlockMatch[2];
      }
    }

    const suggestionsBlockMatch = line.match(/Sugerencias: \[([^\]]*)\](?: \| Notas Adicionales: "([^"]*)")??/);
    if (suggestionsBlockMatch) {
      report.suggestions.push(...(suggestionsBlockMatch[1] ? suggestionsBlockMatch[1].split(', ').filter(Boolean) : []));
      if (suggestionsBlockMatch[2]) {
        report.suggestionNotes = report.suggestionNotes ? `${report.suggestionNotes} ${suggestionsBlockMatch[2]}` : suggestionsBlockMatch[2];
      }
    }
  });

  const reports = [];
  for (const [resourceId, reportData] of resourceReportsMap.entries()) {
    if (reportData.damages.length > 0 || reportData.suggestions.length > 0 || reportData.damageNotes || reportData.suggestionNotes) {
      reports.push({ resourceId, ...reportData });
    }
  }

  return { timestamp, reports };
}

// Función para verificar qué botones deben aparecer
function getButtonVisibility(notes, resourceId) {
  if (!notes) return { hasDamages: false, hasSuggestions: false };
  
  const parsedNotes = parseNotes(notes);
  if (!parsedNotes) return { hasDamages: false, hasSuggestions: false };
  
  const resourceReport = parsedNotes.reports.find(report => report.resourceId === resourceId);
  if (!resourceReport) return { hasDamages: false, hasSuggestions: false };
  
  const hasDamages = resourceReport.damages.length >= 1 && resourceReport.damages.length <= 2;
  const hasSuggestions = resourceReport.suggestions.length > 0;
  
  return { hasDamages, hasSuggestions };
}

async function testButtonVisibility() {
  console.log('🔍 Probando visibilidad del botón con diferentes escenarios de daños...');
  
  // Obtener préstamos devueltos con notas
  const { data: loans, error } = await supabase
    .from('loans')
    .select(`
      id,
      notes,
      loan_resources(resource_id)
    `)
    .eq('status', 'Devuelto')
    .not('notes', 'is', null)
    .limit(5);

  if (error) {
    console.error('❌ Error obteniendo préstamos:', error);
    return;
  }

  console.log(`\n✅ Analizando ${loans.length} préstamos devueltos con notas`);
  
  loans.forEach((loan, index) => {
    console.log(`\n--- PRÉSTAMO ${index + 1} (ID: ${loan.id}) ---`);
    console.log('📝 Notas:', loan.notes);
    
    const parsedNotes = parseNotes(loan.notes);
    if (parsedNotes) {
      console.log(`\n📊 Reportes encontrados: ${parsedNotes.reports.length}`);
      
      parsedNotes.reports.forEach((report, reportIndex) => {
        console.log(`\n  📋 Reporte ${reportIndex + 1}:`);
        console.log(`     🆔 Recurso ID: ${report.resourceId}`);
        console.log(`     💥 Daños (${report.damages.length}): [${report.damages.join(', ')}]`);
        console.log(`     💡 Sugerencias (${report.suggestions.length}): [${report.suggestions.join(', ')}]`);
        
        const buttonInfo = getButtonVisibility(loan.notes, report.resourceId);
        console.log(`     🔴 Botón daños: ${buttonInfo.hasDamages ? '✅ SÍ' : '❌ NO'} (${report.damages.length} daños)`);
        console.log(`     🟠 Botón sugerencias: ${buttonInfo.hasSuggestions ? '✅ SÍ' : '❌ NO'} (${report.suggestions.length} sugerencias)`);
      });
      
      // Verificar recursos del préstamo
      if (loan.loan_resources) {
        console.log(`\n  📦 Recursos en el préstamo: ${loan.loan_resources.length}`);
        loan.loan_resources.forEach(lr => {
          const buttonInfo = getButtonVisibility(loan.notes, lr.resource_id);
          const resourceReport = parsedNotes.reports.find(r => r.resourceId === lr.resource_id);
          const damageCount = resourceReport ? resourceReport.damages.length : 0;
          const suggestionCount = resourceReport ? resourceReport.suggestions.length : 0;
          console.log(`     - Recurso ${lr.resource_id}: 🔴${buttonInfo.hasDamages ? '✅' : '❌'} 🟠${buttonInfo.hasSuggestions ? '✅' : '❌'} (${damageCount} daños, ${suggestionCount} sugerencias)`);
        });
      }
    } else {
      console.log('❌ No se pudo parsear las notas');
    }
    
    console.log('\n' + '='.repeat(60));
  });
  
  // Casos de prueba específicos
  console.log('\n\n🧪 CASOS DE PRUEBA ESPECÍFICOS:');
  
  const testCases = [
    {
      name: 'Sin daños ni sugerencias',
      notes: '[2024-01-15 10:30]\n[Recurso ID REC001]',
      resourceId: 'REC001',
      expectedDamages: false,
      expectedSuggestions: false
    },
    {
      name: 'Solo sugerencias',
      notes: '[2024-01-15 10:30]\n[Recurso ID REC001]\nSugerencias: [Limpiar pantalla]',
      resourceId: 'REC001',
      expectedDamages: false,
      expectedSuggestions: true
    },
    {
      name: '1 daño (botón rojo)',
      notes: '[2024-01-15 10:30]\n[Recurso ID REC001]\nDaños: [Pantalla rayada]',
      resourceId: 'REC001',
      expectedDamages: true,
      expectedSuggestions: false
    },
    {
      name: '2 daños (botón rojo)',
      notes: '[2024-01-15 10:30]\n[Recurso ID REC001]\nDaños: [Pantalla rayada, Botón pegajoso]',
      resourceId: 'REC001',
      expectedDamages: true,
      expectedSuggestions: false
    },
    {
      name: '3 daños (NO botón rojo)',
      notes: '[2024-01-15 10:30]\n[Recurso ID REC001]\nDaños: [Pantalla rayada, Botón pegajoso, Cable dañado]',
      resourceId: 'REC001',
      expectedDamages: false,
      expectedSuggestions: false
    },
    {
      name: '1 daño + sugerencias (ambos botones)',
      notes: '[2024-01-15 10:30]\n[Recurso ID REC001]\nDaños: [Pantalla rayada]\nSugerencias: [Limpiar regularmente]',
      resourceId: 'REC001',
      expectedDamages: true,
      expectedSuggestions: true
    },
    {
      name: '2 daños + sugerencias (ambos botones)',
      notes: '[2024-01-15 10:30]\n[Recurso ID REC001]\nDaños: [Pantalla rayada, Botón pegajoso]\nSugerencias: [Cambiar ubicación, Revisar cables]',
      resourceId: 'REC001',
      expectedDamages: true,
      expectedSuggestions: true
    }
  ];
  
  testCases.forEach((testCase, index) => {
    const result = getButtonVisibility(testCase.notes, testCase.resourceId);
    const damageStatus = result.hasDamages === testCase.expectedDamages ? '✅' : '❌';
    const suggestionStatus = result.hasSuggestions === testCase.expectedSuggestions ? '✅' : '❌';
    const overallStatus = (result.hasDamages === testCase.expectedDamages && result.hasSuggestions === testCase.expectedSuggestions) ? '✅ CORRECTO' : '❌ INCORRECTO';
    
    console.log(`\n${index + 1}. ${testCase.name}: ${overallStatus}`);
    console.log(`   🔴 Daños: Esperado ${testCase.expectedDamages ? 'SÍ' : 'NO'}, Obtenido ${result.hasDamages ? 'SÍ' : 'NO'} ${damageStatus}`);
    console.log(`   🟠 Sugerencias: Esperado ${testCase.expectedSuggestions ? 'SÍ' : 'NO'}, Obtenido ${result.hasSuggestions ? 'SÍ' : 'NO'} ${suggestionStatus}`);
    
    if (result.hasDamages !== testCase.expectedDamages || result.hasSuggestions !== testCase.expectedSuggestions) {
      console.log(`   ⚠️  FALLO EN CASO DE PRUEBA`);
      const parsed = parseNotes(testCase.notes);
      const report = parsed?.reports.find(r => r.resourceId === testCase.resourceId);
      console.log(`   Debug: ${report?.damages.length || 0} daños, ${report?.suggestions.length || 0} sugerencias`);
    }
  });
}

testButtonVisibility().catch(console.error);
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Función parseNotes actualizada (copiada del utils.ts)
function parseNotes(notes) {
  if (!notes || notes.trim() === '') return null;

  const lines = notes.split('\n').filter(line => line.trim() !== '');
  let timestamp = null;
  let processLines = lines;

  // Verificar si la primera línea es un timestamp (formato: [fecha/hora])
  if (lines.length > 0) {
    const firstLine = lines[0];
    const timestampMatch = firstLine.match(/^\[([^\]]+)\]$/);
    if (timestampMatch && !firstLine.includes('Recurso ID')) {
      timestamp = timestampMatch[1];
      processLines = lines.slice(1); // Omitir la línea del timestamp
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
        
    const damagesBlockMatch = line.match(/Daños: \[(.*?)\](?: \| Notas: "(.*?)")?/);
    if (damagesBlockMatch) {
      report.damages.push(...(damagesBlockMatch[1] ? damagesBlockMatch[1].split(', ').filter(Boolean) : []));
      if (damagesBlockMatch[2]) {
        report.damageNotes = report.damageNotes ? `${report.damageNotes} ${damagesBlockMatch[2]}` : damagesBlockMatch[2];
      }
    }

    const suggestionsBlockMatch = line.match(/Sugerencias: \[(.*?)\](?: \| Notas Adicionales: "(.*?)")?/);
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

async function testParseNotes() {
  console.log('🧪 Probando función parseNotes con diferentes formatos...');
  
  // Obtener algunos préstamos con notas reales
  const { data: loans, error } = await supabase
    .from('loans')
    .select('id, notes')
    .eq('status', 'Devuelto')
    .not('notes', 'is', null)
    .limit(3);

  if (error) {
    console.error('❌ Error obteniendo préstamos:', error);
    return;
  }

  console.log(`\n✅ Encontrados ${loans.length} préstamos con notas`);
  
  loans.forEach((loan, index) => {
    console.log(`\n--- PRÉSTAMO ${index + 1} (ID: ${loan.id}) ---`);
    console.log('📝 Notas originales:');
    console.log(loan.notes);
    
    console.log('\n🔍 Resultado del parseo:');
    const parsed = parseNotes(loan.notes);
    if (parsed) {
      console.log('⏰ Timestamp:', parsed.timestamp);
      console.log('📊 Reportes encontrados:', parsed.reports.length);
      
      parsed.reports.forEach((report, reportIndex) => {
        console.log(`\n  📋 Reporte ${reportIndex + 1}:`);
        console.log(`     🆔 Recurso ID: ${report.resourceId}`);
        console.log(`     💥 Daños (${report.damages.length}): [${report.damages.join(', ')}]`);
        console.log(`     💡 Sugerencias (${report.suggestions.length}): [${report.suggestions.join(', ')}]`);
        if (report.damageNotes) console.log(`     📝 Notas de daños: ${report.damageNotes}`);
        if (report.suggestionNotes) console.log(`     📝 Notas de sugerencias: ${report.suggestionNotes}`);
      });
    } else {
      console.log('❌ No se pudo parsear');
    }
    
    console.log('\n' + '='.repeat(50));
  });
}

testParseNotes().catch(console.error);
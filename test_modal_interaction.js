// Test script to simulate modal interaction and debug the issue
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Copy parseNotes function from utils.ts
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
  let currentResourceId = 'default'; // Use a default key for notes without an ID
  
  processLines.forEach(line => {
    const resourceMatch = line.match(/\[Recurso ID (.*?)\]/);
    if (resourceMatch) {
      currentResourceId = resourceMatch[1];
    }
    
    if (!resourceReportsMap.has(currentResourceId)) {
      resourceReportsMap.set(currentResourceId, { damages: [], suggestions: [], damageNotes: '', suggestionNotes: '' });
    }
    const report = resourceReportsMap.get(currentResourceId);
    
    const damagesBlockMatch = line.match(/Daños: \[(.*)\](?: \| Notas: \"(.*)\")?/);
    if (damagesBlockMatch) {
      report.damages.push(...(damagesBlockMatch[1] ? damagesBlockMatch[1].split(', ').filter(Boolean) : []));
      if (damagesBlockMatch[2]) {
        report.damageNotes = report.damageNotes ? `${report.damageNotes} ${damagesBlockMatch[2]}` : damagesBlockMatch[2];
      }
    }
    
    const suggestionsBlockMatch = line.match(/Sugerencias: \[(.*)\](?: \| Notas Adicionales: \"(.*)\")?/);
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

async function testModalInteraction() {
  console.log('🔍 PROBANDO INTERACCIÓN DEL MODAL\n');
  
  // Obtener préstamos con reportes
  const { data: loans, error } = await supabase
    .from('loans')
    .select(`
      id,
      notes,
      loan_resources(
        resource_id,
        resources(
          id,
          number,
          brand,
          model
        )
      )
    `)
    .not('notes', 'is', null)
    .limit(5);
  
  if (error) {
    console.error('❌ Error obteniendo préstamos:', error);
    return;
  }
  
  console.log(`📋 ENCONTRADOS ${loans.length} PRÉSTAMOS CON NOTAS\n`);
  
  loans.forEach((loan, index) => {
    console.log(`${index + 1}. PRÉSTAMO ${loan.id}`);
    console.log('   Notas:', loan.notes);
    
    const parsedLoanDetails = parseNotes(loan.notes);
    console.log('   Parsed Details:', parsedLoanDetails);
    
    if (loan.loan_resources && loan.loan_resources.length > 0) {
      loan.loan_resources.forEach((lr, resourceIndex) => {
        const resource = lr.resources;
        console.log(`\n   📦 RECURSO ${resourceIndex + 1}: ${resource.id}`);
        console.log(`      Número: ${resource.number}, Marca: ${resource.brand}, Modelo: ${resource.model}`);
        
        // Simular la lógica del botón
        const resourceReport = parsedLoanDetails?.reports.find(r => r.resourceId === resource.id);
        if (!resourceReport) {
          console.log('      ❌ No hay reporte para este recurso');
          return;
        }
        
        const hasDamages = resourceReport.damages.length >= 1 && resourceReport.damages.length <= 2;
        const hasSuggestions = resourceReport.suggestions.length > 0;
        
        console.log(`      🔴 Botón daños: ${hasDamages ? '✅ VISIBLE' : '❌ OCULTO'} (${resourceReport.damages.length} daños)`);
        console.log(`      🟠 Botón sugerencias: ${hasSuggestions ? '✅ VISIBLE' : '❌ OCULTO'} (${resourceReport.suggestions.length} sugerencias)`);
        
        // Simular clic en botón de daños
        if (hasDamages) {
          console.log('\n      🖱️  SIMULANDO CLIC EN BOTÓN ROJO (DAÑOS):');
          console.log('         handleShowDetails llamado con:');
          console.log('         - selectedLoan:', { id: loan.id, notes: loan.notes });
          console.log('         - selectedResource:', resource);
          
          // Simular lógica del modal
          const specificReport = parsedLoanDetails?.reports.find(r => r.resourceId === resource.id);
          console.log('         - specificReport encontrado:', !!specificReport);
          
          if (specificReport) {
            console.log('\n         📋 CONTENIDO DEL MODAL:');
            console.log('         ✅ Modal debería mostrar:');
            if (specificReport.damages.length > 0) {
              console.log('            🔴 Daños:', specificReport.damages);
              if (specificReport.damageNotes) {
                console.log('            📝 Notas de daños:', specificReport.damageNotes);
              }
            }
            if (specificReport.suggestions.length > 0) {
              console.log('            🟠 Sugerencias:', specificReport.suggestions);
              if (specificReport.suggestionNotes) {
                console.log('            📝 Notas de sugerencias:', specificReport.suggestionNotes);
              }
            }
          } else {
            console.log('         ❌ Modal mostraría: "No se encontraron daños o sugerencias"');
          }
        }
        
        // Simular clic en botón de sugerencias
        if (hasSuggestions) {
          console.log('\n      🖱️  SIMULANDO CLIC EN BOTÓN NARANJA (SUGERENCIAS):');
          const specificReport = parsedLoanDetails?.reports.find(r => r.resourceId === resource.id);
          if (specificReport && specificReport.suggestions.length > 0) {
            console.log('         ✅ Modal debería mostrar sugerencias:', specificReport.suggestions);
          }
        }
      });
    }
    
    console.log('\n' + '='.repeat(80));
  });
  
  console.log('\n🎯 CONCLUSIÓN:');
  console.log('Si los botones son visibles pero el modal no muestra contenido,');
  console.log('el problema está en el frontend (React/Next.js), no en la lógica de datos.');
  console.log('\nVerificar:');
  console.log('1. Estado del modal (isDetailsModalOpen)');
  console.log('2. Valores de selectedLoan y selectedResource');
  console.log('3. Renderizado condicional en el JSX');
  console.log('4. Errores en la consola del navegador');
}

testModalInteraction().catch(console.error);
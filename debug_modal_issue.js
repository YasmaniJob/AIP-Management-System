// Debug script to identify modal display issue
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

async function debugModalIssue() {
  console.log('🔍 DEPURANDO PROBLEMA DEL MODAL\n');
  
  // Obtener un préstamo específico con notas
  const { data: loan, error } = await supabase
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
    .eq('id', '2750c529-ebb7-432a-8c5e-47d9d42b1b4e')
    .single();
  
  if (error) {
    console.error('❌ Error obteniendo préstamo:', error);
    return;
  }
  
  console.log('📋 DATOS DEL PRÉSTAMO:');
  console.log('ID:', loan.id);
  console.log('Notas:', loan.notes);
  console.log('Recursos:', loan.loan_resources.map(lr => ({
    id: lr.resources.id,
    number: lr.resources.number,
    brand: lr.resources.brand,
    model: lr.resources.model
  })));
  
  console.log('\n🔍 SIMULANDO LÓGICA DEL MODAL:');
  
  // Simular selectedLoan y selectedResource
  const selectedLoan = loan;
  const selectedResource = loan.loan_resources[0].resources; // Primer recurso
  
  console.log('Selected Resource ID:', selectedResource.id);
  
  // Simular parsedLoanDetails
  const parsedLoanDetails = parseNotes(selectedLoan.notes);
  console.log('Parsed Loan Details:', parsedLoanDetails);
  
  // Simular specificReport
  const specificReport = parsedLoanDetails?.reports.find(r => r.resourceId === selectedResource.id);
  console.log('Specific Report:', specificReport);
  
  console.log('\n📊 RESULTADO:');
  if (specificReport) {
    console.log('✅ El modal DEBERÍA mostrar:');
    if (specificReport.damages.length > 0) {
      console.log('  🔴 Daños:', specificReport.damages);
      if (specificReport.damageNotes) {
        console.log('  📝 Notas de daños:', specificReport.damageNotes);
      }
    }
    if (specificReport.suggestions.length > 0) {
      console.log('  🟠 Sugerencias:', specificReport.suggestions);
      if (specificReport.suggestionNotes) {
        console.log('  📝 Notas de sugerencias:', specificReport.suggestionNotes);
      }
    }
  } else {
    console.log('❌ El modal mostrará: "No se encontraron daños o sugerencias para este recurso."');
    console.log('\n🔍 ANÁLISIS DEL PROBLEMA:');
    console.log('- Selected Resource ID:', selectedResource.id);
    console.log('- Available Resource IDs in reports:', parsedLoanDetails?.reports.map(r => r.resourceId));
    console.log('- ¿Coinciden los IDs?', parsedLoanDetails?.reports.some(r => r.resourceId === selectedResource.id));
  }
}

debugModalIssue().catch(console.error);
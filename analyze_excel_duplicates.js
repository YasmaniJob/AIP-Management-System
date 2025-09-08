const fs = require('fs');
const XLSX = require('xlsx');

// Función para analizar duplicados en un archivo Excel
function analyzeExcelDuplicates() {
  try {
    console.log('Analizando duplicados en el archivo Excel...');
    
    // Los datos que veo en la imagen del Excel
    const excelData = [
      { nombre: 'NATALIA ISABEL PAREDES RIVERA', dni: '10023465', email: 'usuario10@gemini.com' },
      { nombre: 'CARLOS EDUARDO CHÁVEZ AYALA', dni: '10023466', email: 'usuario11@gemini.com' },
      { nombre: 'PATRICIA ANTONIETA GÓMEZ CASTRO', dni: '10023467', email: 'usuario12@gemini.com' },
      { nombre: 'LUIS FERNANDO MARTÍNEZ PENA', dni: '10023468', email: 'usuario13@gemini.com' },
      { nombre: 'CLAUDIA ROCÍO REYES MORENO', dni: '10023469', email: 'usuario14@gemini.com' },
      { nombre: 'MIGUEL ÁNGEL VILCA ROJAS', dni: '10023470', email: 'usuario15@gemini.com' },
      { nombre: 'SOFÍA VERÓNICA HERRERA MORALES', dni: '10023471', email: 'usuario16@gemini.com' },
      { nombre: 'JORGE ALFONSO TORO CÁRDENAS', dni: '10023472', email: 'usuario17@gemini.com' },
      { nombre: 'KARINA ESTHER CUEVA SÁNCHEZ', dni: '10023473', email: 'usuario18@gemini.com' },
      { nombre: 'JULIO CÉSAR MEDINA AGUIRRE', dni: '10023474', email: 'usuario19@gemini.com' },
      { nombre: 'GLORIA LUCÍA CASTILLO FERNÁNDEZ', dni: '10023475', email: 'usuario20@gemini.com' },
      { nombre: 'RICARDO ENRIQUE MENDOZA RAMOS', dni: '10023476', email: 'usuario21@gemini.com' },
      { nombre: 'ANDREA BEATRIZ MARTÍNEZ GARCÍA', dni: '10023477', email: 'usuario22@gemini.com' },
      { nombre: 'OSCAR HERNÁNDEZ PÉREZ', dni: '10023478', email: 'usuario23@gemini.com' },
      { nombre: 'GABRIELA MERCEDES CORDOVA QUISPE', dni: '10023479', email: 'usuario24@gemini.com' },
      { nombre: 'DIEGO ALEJANDRO CASTAÑEDA LUNA', dni: '10023480', email: 'usuario25@gemini.com' },
      { nombre: 'ROCÍO ALEJANDRA PALACIOS MEJÍA', dni: '10023481', email: 'usuario26@gemini.com' },
      { nombre: 'FRANCISCO JAVIER GUZMÁN VARGAS', dni: '10023482', email: 'usuario27@gemini.com' },
      { nombre: 'ANGELA TERESA SUÁREZ MOLINA', dni: '10023483', email: 'usuario28@gemini.com' },
      { nombre: 'ERNESTO JOSÉ RAMÍREZ SALAS', dni: '10023484', email: 'usuario29@gemini.com' }
    ];
    
    console.log(`Total de registros: ${excelData.length}`);
    
    // Verificar duplicados por DNI
    const dniSet = new Set();
    const duplicatedDNIs = [];
    
    excelData.forEach((row, index) => {
      if (dniSet.has(row.dni)) {
        duplicatedDNIs.push({ index: index + 1, dni: row.dni, nombre: row.nombre });
      } else {
        dniSet.add(row.dni);
      }
    });
    
    // Verificar duplicados por Email
    const emailSet = new Set();
    const duplicatedEmails = [];
    
    excelData.forEach((row, index) => {
      if (emailSet.has(row.email)) {
        duplicatedEmails.push({ index: index + 1, email: row.email, nombre: row.nombre });
      } else {
        emailSet.add(row.email);
      }
    });
    
    // Verificar duplicados por Nombre
    const nombreSet = new Set();
    const duplicatedNombres = [];
    
    excelData.forEach((row, index) => {
      if (nombreSet.has(row.nombre)) {
        duplicatedNombres.push({ index: index + 1, nombre: row.nombre, dni: row.dni });
      } else {
        nombreSet.add(row.nombre);
      }
    });
    
    console.log('\n=== ANÁLISIS DE DUPLICADOS ===');
    
    if (duplicatedDNIs.length > 0) {
      console.log('\n🔴 DUPLICADOS POR DNI:');
      duplicatedDNIs.forEach(dup => {
        console.log(`  Fila ${dup.index}: DNI ${dup.dni} - ${dup.nombre}`);
      });
    } else {
      console.log('\n✅ No hay duplicados por DNI');
    }
    
    if (duplicatedEmails.length > 0) {
      console.log('\n🔴 DUPLICADOS POR EMAIL:');
      duplicatedEmails.forEach(dup => {
        console.log(`  Fila ${dup.index}: Email ${dup.email} - ${dup.nombre}`);
      });
    } else {
      console.log('\n✅ No hay duplicados por Email');
    }
    
    if (duplicatedNombres.length > 0) {
      console.log('\n🔴 DUPLICADOS POR NOMBRE:');
      duplicatedNombres.forEach(dup => {
        console.log(`  Fila ${dup.index}: Nombre "${dup.nombre}" - DNI ${dup.dni}`);
      });
    } else {
      console.log('\n✅ No hay duplicados por Nombre');
    }
    
    // Resumen
    console.log('\n=== RESUMEN ===');
    console.log(`Total de registros únicos por DNI: ${dniSet.size}`);
    console.log(`Total de registros únicos por Email: ${emailSet.size}`);
    console.log(`Total de registros únicos por Nombre: ${nombreSet.size}`);
    console.log(`Duplicados por DNI: ${duplicatedDNIs.length}`);
    console.log(`Duplicados por Email: ${duplicatedEmails.length}`);
    console.log(`Duplicados por Nombre: ${duplicatedNombres.length}`);
    
    if (duplicatedDNIs.length === 0 && duplicatedEmails.length === 0 && duplicatedNombres.length === 0) {
      console.log('\n🎉 ¡No se encontraron duplicados en el archivo!');
      console.log('El archivo debería importarse correctamente.');
    } else {
      console.log('\n⚠️  Se encontraron duplicados que deben resolverse antes de la importación.');
    }
    
  } catch (error) {
    console.error('Error al analizar duplicados:', error);
  }
}

// Ejecutar el análisis
analyzeExcelDuplicates();
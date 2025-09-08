// Análisis de duplicados en la lista de nombres proporcionada
const nombres = [
  'NATALIA ISABEL PAREDES RIVERA',
  'CARLOS EDUARDO CHÁVEZ AYALA',
  'PATRICIA ANTONIETA GÓMEZ CASTRO',
  'LUIS FERNANDO MARTÍNEZ PEÑA',
  'CLAUDIA ROCÍO REYES MORENO',
  'MIGUEL ÁNGEL VILCA ROJAS',
  'SOFÍA VERÓNICA HERRERA MORALES',
  'JORGE ALFONSO TORO CÁRDENAS',
  'KARINA ESTHER CUEVA SÁNCHEZ',
  'JULIO CÉSAR MEDINA AGUIRRE',
  'GLORIA LUCÍA CASTILLO FERNÁNDEZ',
  'RICARDO ENRIQUE MENDOZA RAMOS',
  'ANDREA BEATRIZ MARTÍNEZ GARCÍA',
  'OSCAR HERNÁNDEZ PÉREZ',
  'GABRIELA MERCEDES CORDOVA QUISPE',
  'DIEGO ALEJANDRO CASTAÑEDA LUNA',
  'ROCÍO ALEJANDRA PALACIOS MEJÍA',
  'FRANCISCO JAVIER GUZMÁN VARGAS',
  'ANGELA TERESA SUÁREZ MOLINA',
  'ERNESTO JOSÉ RAMÍREZ SALAS',
  'MILAGROS FABIOLA POMA SALAZAR',
  'FABIÁN EDUARDO REYES PONCE',
  'ISABEL CRISTINA VÁSQUEZ MORA',
  'DAVID ALONSO HUAMÁN CARRASCO',
  'CECILIA MAGDALENA VILLARREAL TORRES',
  'ALEJANDRO JOSÉ CARRILLO DELGADO',
  'YVONNE PATRICIA MARTÍNEZ ARIAS',
  'MARIO ANTONIO CASTRO VELÁSQUEZ',
  'CARLA LORENA FERNÁNDEZ GUERRERO',
  'IGNACIO ALEJANDRO MORALES SOTO'
];

console.log('=== ANÁLISIS DE DUPLICADOS EN NOMBRES ===');
console.log(`Total de nombres: ${nombres.length}`);

// Verificar duplicados exactos
const nombresSet = new Set();
const duplicadosExactos = [];

nombres.forEach((nombre, index) => {
  if (nombresSet.has(nombre)) {
    duplicadosExactos.push({ posicion: index + 1, nombre });
  } else {
    nombresSet.add(nombre);
  }
});

if (duplicadosExactos.length > 0) {
  console.log('\n🔴 DUPLICADOS EXACTOS ENCONTRADOS:');
  duplicadosExactos.forEach(dup => {
    console.log(`  Posición ${dup.posicion}: "${dup.nombre}"`);
  });
} else {
  console.log('\n✅ No hay duplicados exactos');
}

// Verificar similitudes por apellidos
console.log('\n=== ANÁLISIS DE APELLIDOS SIMILARES ===');
const apellidosMap = new Map();

nombres.forEach((nombre, index) => {
  const partes = nombre.split(' ');
  // Tomar los últimos 2 elementos como apellidos potenciales
  const apellidos = partes.slice(-2).join(' ');
  
  if (!apellidosMap.has(apellidos)) {
    apellidosMap.set(apellidos, []);
  }
  apellidosMap.get(apellidos).push({ posicion: index + 1, nombre });
});

const apellidosDuplicados = [];
apellidosMap.forEach((personas, apellidos) => {
  if (personas.length > 1) {
    apellidosDuplicados.push({ apellidos, personas });
  }
});

if (apellidosDuplicados.length > 0) {
  console.log('\n🟡 POSIBLES APELLIDOS SIMILARES:');
  apellidosDuplicados.forEach(grupo => {
    console.log(`\n  Apellidos: "${grupo.apellidos}"`);
    grupo.personas.forEach(persona => {
      console.log(`    Posición ${persona.posicion}: ${persona.nombre}`);
    });
  });
} else {
  console.log('\n✅ No hay apellidos duplicados');
}

// Verificar nombres similares (primeros nombres)
console.log('\n=== ANÁLISIS DE PRIMEROS NOMBRES ===');
const primerosNombresMap = new Map();

nombres.forEach((nombre, index) => {
  const primerNombre = nombre.split(' ')[0];
  
  if (!primerosNombresMap.has(primerNombre)) {
    primerosNombresMap.set(primerNombre, []);
  }
  primerosNombresMap.get(primerNombre).push({ posicion: index + 1, nombre });
});

const nombresDuplicados = [];
primerosNombresMap.forEach((personas, primerNombre) => {
  if (personas.length > 1) {
    nombresDuplicados.push({ primerNombre, personas });
  }
});

if (nombresDuplicados.length > 0) {
  console.log('\n🟡 PRIMEROS NOMBRES REPETIDOS:');
  nombresDuplicados.forEach(grupo => {
    console.log(`\n  Primer nombre: "${grupo.primerNombre}"`);
    grupo.personas.forEach(persona => {
      console.log(`    Posición ${persona.posicion}: ${persona.nombre}`);
    });
  });
} else {
  console.log('\n✅ No hay primeros nombres repetidos');
}

// Resumen final
console.log('\n=== RESUMEN FINAL ===');
console.log(`Total de nombres únicos: ${nombresSet.size}`);
console.log(`Duplicados exactos: ${duplicadosExactos.length}`);
console.log(`Grupos con apellidos similares: ${apellidosDuplicados.length}`);
console.log(`Grupos con primeros nombres repetidos: ${nombresDuplicados.length}`);

if (duplicadosExactos.length === 0) {
  console.log('\n🎉 ¡No hay duplicados exactos en la lista!');
} else {
  console.log('\n⚠️  Se encontraron duplicados exactos que deben resolverse.');
}
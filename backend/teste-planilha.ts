import { readFromSheet } from './src/services/GoogleSheetsService';

async function rodarTeste() {
  console.log('⏳ Conectando ao Google Sheets...');

  try {
    // Usando o nome correto da aba e aspas simples por causa do espaço
    const cidades = await readFromSheet("'Dados Geral'!D2:D10"); 
    
    console.log('✅ Leitura bem sucedida! Veja as primeiras cidades:');
    console.log(cidades);

  } catch (error) {
    console.error('❌ Falha no teste:', error);
  }
}

rodarTeste();
// backend/src/services/GoogleSheetsService.ts

import { google } from 'googleapis';
import path from 'path';

// ✅ Pegamos o ID da planilha por variável de ambiente (mais seguro e fácil de trocar)
const SPREADSHEET_ID = process.env.ORQUESTRA_SHEET_ID;

if (!SPREADSHEET_ID) {
  throw new Error(
    'ORQUESTRA_SHEET_ID não definido. ' +
      'Defina no PowerShell antes de rodar o backend: ' +
      '$env:ORQUESTRA_SHEET_ID="SEU_ID_DA_PLANILHA"'
  );
}

// ✅ IMPORTANTÍSSIMO: este caminho usa process.cwd().
// Por isso, rode o backend dentro da pasta "backend" (onde fica o credentials.json).
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function readFromSheet(range: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    return response.data.values || [];
  } catch (error) {
    console.error('Erro ao ler a planilha:', error);
    throw error;
  }
}

export async function appendToSheet(range: string, values: any[][]) {
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao escrever na planilha:', error);
    throw error;
  }
}

export async function updateSheetRange(range: string, values: any[][]) {
  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar a planilha:', error);
    throw error;
  }
}

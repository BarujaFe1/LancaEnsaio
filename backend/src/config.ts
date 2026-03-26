import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',

  googleCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  googleServiceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',

  sheetUsuariosTab: process.env.SHEET_USUARIOS_TAB || 'usuarios',
  sheetBaseGeralTab: process.env.SHEET_BASE_GERAL_TAB || 'Base Geral',
  sheetDadosGeralTab: process.env.SHEET_DADOS_GERAL_TAB || 'Dados Geral',

  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS || 12),
  maxDevicesPerUser: Number(process.env.MAX_DEVICES_PER_USER || 3),

  loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS || 5),
  loginBlockMinutes: Number(process.env.LOGIN_BLOCK_MINUTES || 5),

  usersCacheTtlMs: 30_000,
  configCacheTtlMs: 120_000
};

if (!config.spreadsheetId) {
  console.warn('⚠️ GOOGLE_SHEETS_SPREADSHEET_ID não configurado.');
}

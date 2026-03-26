import { buildApp } from './src/app';
import { config } from './src/config';

async function start() {
  const app = buildApp({ logger: true });

  try {
    await app.listen({
      port: config.port || 3000,
      host: config.host || '0.0.0.0'
    });

    console.log(`🚀 Servidor rodando em http://${config.host || '0.0.0.0'}:${config.port || 3000}`);
    console.log('✅ Backend novo carregado (sem readFromSheet legado)');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

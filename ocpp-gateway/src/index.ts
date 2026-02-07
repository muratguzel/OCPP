import 'dotenv/config';
import { createApp } from './http/index.js';
import { createOcppServer, listenOcppServer } from './ocpp/server.js';

const HTTP_PORT = Number(process.env.PORT) || 3000;
const OCPP_PORT = Number(process.env.OCPP_PORT) || 9220;

async function main() {
  const app = createApp();
  app.listen(HTTP_PORT, () => {
    console.log('[HTTP] Server listening on port', HTTP_PORT);
  });

  const ocppServer = createOcppServer(OCPP_PORT);
  await listenOcppServer(ocppServer, OCPP_PORT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

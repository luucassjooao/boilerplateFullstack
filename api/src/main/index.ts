import { makeInfra } from '#main/composition/infra';
import { makeAppConfig } from '#main/config/AppConfig';
import { loadEnv } from '#main/config/env';
import { buildServer } from '#main/server';

const config = makeAppConfig(loadEnv());
const app = await buildServer({ config, infra: makeInfra(config) });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    app.log.info({ signal }, 'Shutting down');
    await app.close();
    process.exit(0);
  });
}

await app.listen({ host: config.server.host, port: config.server.port });

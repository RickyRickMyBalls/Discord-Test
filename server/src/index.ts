import { createApp } from './app.js';
import { serverEnv } from './lib/env.js';

const app = createApp();

app.listen(serverEnv.port, () => {
  console.log(`Discord Test Farding server listening on port ${serverEnv.port}`);
});

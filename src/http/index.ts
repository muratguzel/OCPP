import express from 'express';
import routes from './routes.js';

export function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use(routes);
  return app;
}

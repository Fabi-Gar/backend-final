// src/routes/push.routes.ts
import { Router } from 'express';
import { PushController } from './push.controller';

export const pushRouter = Router();
pushRouter.post('/register', PushController.register);
pushRouter.post('/prefs', PushController.prefs);
pushRouter.post('/unregister', PushController.unregister);

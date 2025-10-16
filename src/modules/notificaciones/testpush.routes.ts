// src/app/testPush.routes.ts
import { Router } from 'express';
import { sendExpoPush } from './expoPush.service';

const router = Router();

router.post('/test-push', async (req, res) => {
  try {
    const { token } = req.body;
    await sendExpoPush([token], {
      title: '🔥 Notificación de prueba',
      body: 'Si ves esto, Expo Push funciona bien',
      data: { test: 'ok' },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

export default router;

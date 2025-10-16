// src/services/expoPush.ts
import fetch from 'node-fetch';

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function chunk<T>(arr: T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function sendExpoPush(to: string[], payload: PushPayload) {
  if (!to.length) return;
  for (const batch of chunk(to, 100)) {
    const messages = batch.map((token) => ({
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: payload.sound ?? 'default',
      channelId: 'default',
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[ExpoPush] error', res.status, text);
    } else {
      // opcional: manejar receipts
      // const json = await res.json();
    }
  }
}

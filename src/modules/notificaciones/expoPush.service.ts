// src/services/expoPush.service.ts
import fetch from 'node-fetch';
import type { PushPayload } from './push.types';

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
};

type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded';
  };
};

type ExpoPushResponse = {
  data: ExpoPushTicket[];
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_BATCH_SIZE = 100; // Expo permite hasta 100 notificaciones por request

/**
 * Divide un array en chunks del tamaño especificado
 */
function chunk<T>(arr: T[], size = MAX_BATCH_SIZE): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Valida si un token de Expo es válido
 */
function isValidExpoToken(token: string): boolean {
  return /^ExponentPushToken\[[\w-]+\]$/.test(token);
}

/**
 * Filtra tokens válidos y registra los inválidos
 */
function filterValidTokens(tokens: string[]): string[] {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const token of tokens) {
    if (isValidExpoToken(token)) {
      valid.push(token);
    } else {
      invalid.push(token);
    }
  }

  if (invalid.length > 0) {
    console.warn(`⚠️ Tokens inválidos detectados (${invalid.length}):`, 
      invalid.map(t => t.substring(0, 30) + '...')
    );
  }

  return valid;
}

/**
 * Envía notificaciones push usando Expo Push Notification Service
 * @param to Array de tokens de Expo
 * @param payload Contenido de la notificación
 */
export async function sendExpoPush(
  to: string[], 
  payload: PushPayload
): Promise<void> {
  if (!to || to.length === 0) {
    console.log('⏭️ No hay tokens para enviar notificación');
    return;
  }

  // Filtrar tokens válidos
  const validTokens = filterValidTokens(to);
  
  if (validTokens.length === 0) {
    console.warn('⚠️ No hay tokens válidos para enviar');
    return;
  }

  console.log(`📤 Enviando notificación a ${validTokens.length} dispositivo(s)`);

  // Dividir en batches si hay muchos tokens
  const batches = chunk(validTokens, MAX_BATCH_SIZE);
  
  for (const batch of batches) {
    try {
      await sendBatch(batch, payload);
    } catch (error) {
      console.error('❌ Error enviando batch de notificaciones:', error);
      // Continuar con los siguientes batches aunque falle uno
    }
  }
}

/**
 * Envía un batch de notificaciones
 */
async function sendBatch(
  tokens: string[], 
  payload: PushPayload
): Promise<void> {
  const messages: ExpoPushMessage[] = tokens.map(token => ({
    to: token,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: payload.sound ?? 'default',
    badge: payload.badge,
    channelId: payload.channelId ?? 'default',
    priority: payload.priority ?? 'high',
    ttl: payload.ttl ?? 3600, // 1 hora por defecto
  }));

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`❌ Error HTTP ${response.status}:`, text);
      throw new Error(`Expo Push failed with status ${response.status}`);
    }

    const result = (await response.json()) as ExpoPushResponse;
    
    // Analizar resultados
    const tickets = result.data || [];
    const errors = tickets.filter(t => t.status === 'error');
    const success = tickets.filter(t => t.status === 'ok');

    console.log(`✅ Notificaciones enviadas: ${success.length}/${tickets.length}`);

    if (errors.length > 0) {
      console.error(`⚠️ ${errors.length} notificación(es) fallaron:`);
      
      errors.forEach((ticket, idx) => {
        const token = tokens[idx];
        const errorType = ticket.details?.error || 'Unknown';
        
        console.error(`  - Token: ${token.substring(0, 30)}...`);
        console.error(`    Error: ${errorType}`);
        console.error(`    Mensaje: ${ticket.message || 'No message'}`);

        // TODO: Si el error es DeviceNotRegistered, marcar el token como inactivo en BD
        if (errorType === 'DeviceNotRegistered') {
          console.warn(`    ⚠️ Token debe ser removido: ${token}`);
          // Aquí podrías llamar a PushPrefsRepo.removeToken() si lo importas
        }
      });
    }

    // Opcional: Guardar tickets para verificar receipts después
    // Los receipts se pueden consultar más tarde para confirmar entrega
    const ticketIds = success
      .filter(t => t.id)
      .map(t => t.id!);
    
    if (ticketIds.length > 0) {
      console.log(`📋 Tickets generados: ${ticketIds.length}`);
      // TODO: Guardar ticketIds en BD si quieres verificar receipts después
    }

  } catch (error: any) {
    console.error('❌ Error en sendBatch:', error?.message || error);
    throw error;
  }
}

/**
 * Opcional: Verificar receipts (confirmación de entrega)
 * Se puede llamar después de enviar notificaciones
 */
export async function checkExpoPushReceipts(
  receiptIds: string[]
): Promise<void> {
  if (!receiptIds.length) return;

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: receiptIds }),
    });

    if (!response.ok) {
      console.error('❌ Error obteniendo receipts:', response.status);
      return;
    }

    const result = await response.json();
    console.log('📬 Receipts:', result);
    
    // Aquí podrías procesar los receipts para saber qué notificaciones
    // fueron entregadas exitosamente y cuáles fallaron
  } catch (error) {
    console.error('❌ Error verificando receipts:', error);
  }
}
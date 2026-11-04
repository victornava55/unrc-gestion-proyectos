/**
 * ============================================================================
 * UNRC · HOOK DE SINCRONIZACIÓN INTELIGENTE DE CHAT (ANTI-BLOQUEO SHEETS)
 * Archivo: src/hooks/useChatPolling.js
 * ============================================================================
 * - Consulta nuevos mensajes desde Code.gs únicamente cada 12 segundos (12000ms).
 * - Solo ejecuta la petición si la pestaña del navegador está activa
 *   (document.visibilityState === 'visible').
 * - Envía el timestamp del último mensaje recibido (`since`) para que Google
 *   Sheets devuelva exclusivamente el delta de mensajes nuevos.
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import useAppStore from '../store/useAppStore';

const POLL_INTERVAL_MS = 12000;

export function useChatPolling(enabled = true) {
  const pollDeltaMessages = useAppStore((s) => s.pollDeltaMessages);
  const lastChatPollAt = useAppStore((s) => s.lastChatPollAt);
  const lastDeltaCount = useAppStore((s) => s.lastDeltaCount);

  const [isTabVisible, setIsTabVisible] = useState(
    typeof document !== 'undefined'
      ? document.visibilityState === 'visible'
      : true
  );
  const isPollingRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined;

    const executeDeltaPoll = async () => {
      // Regla crítica: no consultar Google Sheets si la pestaña está oculta
      if (document.visibilityState !== 'visible') return;
      if (isPollingRef.current) return;

      isPollingRef.current = true;
      try {
        await pollDeltaMessages();
      } finally {
        isPollingRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsTabVisible(visible);
    };

    const intervalId = setInterval(executeDeltaPoll, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, pollDeltaMessages]);

  return {
    intervalSeconds: POLL_INTERVAL_MS / 1000,
    isTabVisible,
    lastChatPollAt,
    lastDeltaCount,
  };
}

export default useChatPolling;

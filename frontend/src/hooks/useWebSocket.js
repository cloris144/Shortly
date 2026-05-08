import { useEffect, useRef, useState } from 'react';

export function useWebSocket(onMessage) {
  const [status, setStatus] = useState('connecting');
  const timerRef = useRef(null);
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws`;

    function connect() {
      setStatus('connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setStatus('connected');

      ws.onmessage = (event) => {
        try { onMessageRef.current(JSON.parse(event.data)); } catch {}
      };

      ws.onclose = () => {
        setStatus('disconnected');
        timerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, []);

  return status;
}

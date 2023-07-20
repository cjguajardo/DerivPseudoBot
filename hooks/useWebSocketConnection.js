import React, { useEffect, useRef } from 'react';

const useWebSocketConnection = (url) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket(url);

    socketRef.current.onopen = () => {
      console.log('Conexión establecida');
    };

    socketRef.current.onmessage = (event) => {
      console.log('Mensaje recibido:', event.data);
    };

    socketRef.current.onclose = () => {
      console.log('Conexión cerrada');
    };

    socketRef.current.onerror = (error) => {
      console.error('Error en la conexión:', error);
    };

    return () => {
      socketRef.current.close();
    };
  }, [url]);

  return socketRef.current;
};

export default useWebSocketConnection;

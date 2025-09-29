import { useState, useRef, useCallback, useEffect } from 'react';

// Debug logging helper
const wsDebug = (message, data = '') => {
  console.log(`🔌 Frontend WebSocket DEBUG: ${message}`, data);
};

const useWebSocket = (url, options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  const {
    maxReconnectAttempts = 5,
    reconnectInterval = 3000, // Reduced from 5000ms for faster retries
    maxReconnectInterval = 30000,
    onMessage,
    onOpen,
    onClose,
    onError
  } = options;

  wsDebug('Hook initialized with options:', { url, maxReconnectAttempts, reconnectInterval });

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsDebug('WebSocket already connected, skipping connection attempt');
      return;
    }

    try {
      wsDebug('Attempting WebSocket connection...');

      // Use the nginx proxy path - connect through the frontend server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host; // This will be localhost:3001 for frontend
      const wsUrl = `${protocol}//${host}${url}`;

      wsDebug('WebSocket URL:', wsUrl);
      wsDebug('Browser location:', { protocol: window.location.protocol, host: window.location.host });

      setConnectionStatus('Connecting...');
      wsRef.current = new WebSocket(wsUrl);

      wsDebug('WebSocket object created, attaching event handlers');

      wsRef.current.onopen = (event) => {
        wsDebug('WebSocket connection opened', {
          readyState: wsRef.current.readyState,
          protocol: wsRef.current.protocol,
          url: wsRef.current.url
        });

        setIsConnected(true);
        setConnectionStatus('Connected');
        setError(null);
        setReconnectAttempts(0);

        // Start ping/pong keepalive
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsDebug('Sending ping keepalive');
            sendMessage({ type: 'ping' });
          }
        }, 30000); // Ping every 30 seconds

        if (onOpen) {
          wsDebug('Calling onOpen callback');
          onOpen(event);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          wsDebug('Received WebSocket message:', { type: data.type, dataSize: event.data.length });

          // Handle pong responses
          if (data.type === 'pong') {
            wsDebug('Received pong response');
            return;
          }

          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          wsDebug('Error parsing WebSocket message:', error);
          wsDebug('Raw message data:', event.data);
        }
      };

      wsRef.current.onclose = (event) => {
        wsDebug('WebSocket connection closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          reconnectAttempts: reconnectAttempts
        });

        setIsConnected(false);
        setConnectionStatus('Disconnected');

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        if (onClose) {
          onClose(event);
        }

        // Attempt reconnection if not a clean close and under attempt limit
        if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
          wsDebug(`Connection was not clean - attempting reconnection (wasClean: ${event.wasClean}, code: ${event.code})`);
          const backoffDelay = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttempts),
            maxReconnectInterval
          );

          wsDebug(`Scheduling reconnection attempt ${reconnectAttempts + 1}/${maxReconnectAttempts} in ${backoffDelay}ms`);
          setConnectionStatus(`Reconnecting in ${Math.round(backoffDelay / 1000)}s...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, backoffDelay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          wsDebug('Max reconnection attempts reached');
          setConnectionStatus('Connection failed');
          setError('Max reconnection attempts reached');
        }
      };

      wsRef.current.onerror = (event) => {
        wsDebug('WebSocket error occurred:', event);
        wsDebug('Error event details:', {
          type: event.type,
          readyState: wsRef.current?.readyState,
          url: wsRef.current?.url,
          currentTarget: event.currentTarget
        });
        setError('WebSocket connection error');
        setConnectionStatus('Connection error');

        if (onError) {
          onError(event);
        }
      };

    } catch (error) {
      wsDebug('Error creating WebSocket connection:', error);
      setError(error.message);
      setConnectionStatus('Connection failed');
    }
  }, [url, reconnectAttempts, maxReconnectAttempts, reconnectInterval, maxReconnectInterval, onMessage, onOpen, onClose, onError]);

  const disconnect = useCallback(() => {
    wsDebug('Manually disconnecting WebSocket');

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('Disconnected');
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(data);
      wsDebug('Sending WebSocket message:', { type: data.type, messageSize: message.length });
      wsRef.current.send(message);
      return true;
    } else {
      wsDebug('Cannot send message - WebSocket not connected', {
        readyState: wsRef.current?.readyState,
        connectionStatus
      });
      return false;
    }
  }, [connectionStatus]);

  const sendPing = useCallback(() => {
    return sendMessage({ type: 'ping' });
  }, [sendMessage]);

  const requestStats = useCallback(() => {
    return sendMessage({ type: 'requestStats' });
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    wsDebug('Manual reconnection requested');
    disconnect();
    setTimeout(() => {
      setReconnectAttempts(0);
      connect();
    }, 1000);
  }, [disconnect, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsDebug('Component unmounting, cleaning up WebSocket');
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionStatus,
    error,
    reconnectAttempts,
    sendMessage,
    sendPing,
    requestStats,
    connect,
    disconnect,
    reconnect
  };
};

export default useWebSocket;
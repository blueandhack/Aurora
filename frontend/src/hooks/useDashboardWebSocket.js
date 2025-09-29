import { useState, useCallback, useEffect } from 'react';
import useWebSocket from './useWebSocket';

const useDashboardWebSocket = () => {
  const [stats, setStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [realTimeEvents, setRealTimeEvents] = useState([]);

  const handleMessage = useCallback((data) => {
    console.log('🔌 Dashboard WebSocket received message:', data.type);

    switch (data.type) {
      case 'statsUpdate':
        console.log('📊 Updating dashboard stats:', data.data);
        setStats(data.data);
        setLastUpdate(new Date(data.timestamp));
        break;

      case 'callStarted':
        console.log('📞 Call started event:', data.callSid);
        setRealTimeEvents(prev => [
          {
            type: 'call_started',
            callSid: data.callSid,
            timestamp: new Date(data.timestamp),
            message: `Call started: ${data.callSid}`
          },
          ...prev.slice(0, 49) // Keep only last 50 events
        ]);
        break;

      case 'callEnded':
        console.log('📞 Call ended event:', data.callSid);
        setRealTimeEvents(prev => [
          {
            type: 'call_ended',
            callSid: data.callSid,
            timestamp: new Date(data.timestamp),
            message: `Call ended: ${data.callSid}`
          },
          ...prev.slice(0, 49)
        ]);
        break;

      case 'noteCreated':
        console.log('📝 Note created event:', data.callSid, data.source);
        setRealTimeEvents(prev => [
          {
            type: 'note_created',
            callSid: data.callSid,
            source: data.source,
            timestamp: new Date(data.timestamp),
            message: `Note created for call ${data.callSid} (${data.source})`
          },
          ...prev.slice(0, 49)
        ]);
        break;

      case 'userCreated':
        console.log('👤 User created event:', data.username);
        setRealTimeEvents(prev => [
          {
            type: 'user_created',
            timestamp: new Date(data.timestamp),
            message: `New user registered: ${data.username}`
          },
          ...prev.slice(0, 49)
        ]);
        break;

      case 'pong':
        // Handle keepalive response
        console.log('🏓 Received pong response');
        break;

      default:
        console.warn('🔌 Unknown dashboard message type:', data.type, data);
    }
  }, []);

  const {
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
  } = useWebSocket('/ws', {
    maxReconnectAttempts: 10, // More aggressive reconnection for dashboard
    reconnectInterval: 2000,  // Start with 2 second intervals
    maxReconnectInterval: 30000,
    onMessage: handleMessage,
    onOpen: () => {
      console.log('🟢 Dashboard WebSocket connected - real-time updates active');
      // Request initial stats after connection
      setTimeout(() => {
        console.log('📊 Requesting initial dashboard stats...');
        requestStats();
      }, 500);
    },
    onClose: (event) => {
      console.log('🔴 Dashboard WebSocket disconnected', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
    },
    onError: (error) => {
      console.error('⚠️ Dashboard WebSocket error:', error);
    }
  });

  const refreshStats = useCallback(() => {
    console.log('🔄 Manual stats refresh requested');
    return requestStats();
  }, [requestStats]);

  const clearEvents = useCallback(() => {
    console.log('🗑️ Clearing real-time events');
    setRealTimeEvents([]);
  }, []);

  // Auto-connect when component mounts with initial delay
  useEffect(() => {
    console.log('🔌 Dashboard WebSocket hook mounted, scheduling auto-connect...');

    // Add a small delay to allow page to fully load and servers to be ready
    const connectTimer = setTimeout(() => {
      console.log('🔌 Initiating dashboard WebSocket connection...');
      connect();
    }, 1000); // 1 second delay

    return () => {
      clearTimeout(connectTimer);
    };
  }, [connect]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    error,
    reconnectAttempts,

    // Data
    stats,
    lastUpdate,
    realTimeEvents,

    // Actions
    refreshStats,
    clearEvents,
    sendPing,
    connect,
    disconnect,
    reconnect
  };
};

export default useDashboardWebSocket;
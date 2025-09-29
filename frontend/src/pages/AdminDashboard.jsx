import React, { useState } from 'react';
import AdminStats from '../components/AdminStats';
import UserManagement from '../components/UserManagement';
import SystemLogs from '../components/SystemLogs';
import CallsOverview from '../components/CallsOverview';
import SystemSettings from '../components/SystemSettings';
import useDashboardWebSocket from '../hooks/useDashboardWebSocket';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // WebSocket-based dashboard updates
  const {
    stats,
    lastUpdate,
    realTimeEvents,
    isConnected,
    connectionStatus,
    error,
    reconnectAttempts,
    refreshStats,
    connect,
    disconnect,
    reconnect,
    clearEvents
  } = useDashboardWebSocket();

  const refreshData = () => {
    refreshStats();
  };

  // Show loading state while connecting initially
  if (!isConnected && !stats && !error) {
    return (
      <div className="loading">
        <p>Connecting to dashboard...</p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>{connectionStatus}</p>
        {reconnectAttempts > 0 && (
          <p style={{ fontSize: '0.8rem', color: '#ffc107' }}>
            Reconnection attempt: {reconnectAttempts}
          </p>
        )}
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div style={{
        background: '#f8d7da',
        color: '#721c24',
        padding: '1rem',
        borderRadius: '4px',
        margin: '1rem 0'
      }}>
        <p>{error}</p>
        <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>
          Connection Status: {connectionStatus}
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
          <button onClick={refreshData}>Retry Connection</button>
          <button onClick={reconnect}>Force Reconnect</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', color: '#dc3545' }}>
          🔧 Admin Dashboard
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          System administration and user management
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        borderBottom: '1px solid #ddd', 
        marginBottom: '2rem',
        display: 'flex',
        gap: '2rem'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'users', label: 'User Management', icon: '👥' },
          { id: 'calls', label: 'Calls Overview', icon: '📞' },
          { id: 'logs', label: 'System Logs', icon: '📝' },
          { id: 'settings', label: 'System Settings', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 0',
              border: 'none',
              background: 'none',
              fontSize: '16px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              color: activeTab === tab.id ? '#dc3545' : '#666',
              borderBottom: activeTab === tab.id ? '2px solid #dc3545' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <AdminStats
          stats={stats}
          onRefresh={refreshData}
          isConnected={isConnected}
          connectionStatus={connectionStatus}
          lastUpdate={lastUpdate}
          realTimeEvents={realTimeEvents}
          reconnectAttempts={reconnectAttempts}
          onReconnect={reconnect}
          onConnect={connect}
          onDisconnect={disconnect}
          onClearEvents={clearEvents}
        />
      )}
      
      {activeTab === 'users' && (
        <UserManagement onRefresh={refreshData} />
      )}
      
      {activeTab === 'calls' && (
        <CallsOverview />
      )}
      
      {activeTab === 'logs' && (
        <SystemLogs />
      )}

      {activeTab === 'settings' && (
        <SystemSettings />
      )}
    </div>
  );
}

export default AdminDashboard;
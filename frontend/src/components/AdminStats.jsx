import React from 'react';

function AdminStats({
  stats,
  onRefresh,
  isConnected = false,
  connectionStatus = 'Disconnected',
  lastUpdate = null,
  realTimeEvents = [],
  reconnectAttempts = 0,
  onReconnect,
  onConnect,
  onDisconnect,
  onClearEvents
}) {
  if (!stats || !stats.users || !stats.calls || !stats.notes) {
    return <div className="loading">Loading statistics...</div>;
  }

  // Provide default values to prevent undefined errors
  const users = stats.users || {};
  const calls = stats.calls || {};
  const notes = stats.notes || {};

  const StatCard = ({ title, value, subtitle, icon, color = '#007bff' }) => (
    <div className="card" style={{ 
      textAlign: 'center',
      padding: '1.5rem',
      borderTop: `4px solid ${color}`
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h3 style={{ 
        margin: '0 0 0.5rem 0', 
        fontSize: '2rem', 
        color: color,
        fontWeight: 'bold'
      }}>
        {value}
      </h3>
      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{title}</h4>
      {subtitle && (
        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
          {subtitle}
        </p>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0' }}>System Overview</h2>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            <span style={{
              color: isConnected ? '#28a745' : '#dc3545',
              fontWeight: 'bold'
            }}>
              {isConnected ? '🟢' : '🔴'} {connectionStatus}
            </span>
            {lastUpdate && (
              <>
                {' • '}
                <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
              </>
            )}
            {isConnected && (
              <>
                {' • '}
                <span style={{ color: '#28a745' }}>Real-time updates</span>
              </>
            )}
            {reconnectAttempts > 0 && (
              <>
                {' • '}
                <span style={{ color: '#ffc107' }}>Reconnecting... (attempt {reconnectAttempts})</span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!isConnected && onConnect && (
            <button
              onClick={onConnect}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#28a745',
                color: '#fff',
                border: 'none'
              }}
            >
              🔌 Connect
            </button>
          )}

          {isConnected && onDisconnect && (
            <button
              onClick={onDisconnect}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#dc3545',
                color: '#fff',
                border: 'none'
              }}
            >
              ⏹️ Disconnect
            </button>
          )}

          {onReconnect && (
            <button
              onClick={onReconnect}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#ffc107',
                color: '#000',
                border: 'none'
              }}
            >
              🔄 Reconnect
            </button>
          )}

          <button
            onClick={onRefresh}
            className="btn btn-secondary"
            style={{ padding: '8px 16px' }}
            disabled={!isConnected}
          >
            📊 Request Stats
          </button>
        </div>
      </div>

      {/* User Statistics */}
      <h3 style={{ marginBottom: '1rem', color: '#333' }}>👥 User Statistics</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="Total Users"
          value={users.total || 0}
          subtitle="All registered users"
          icon="👤"
          color="#28a745"
        />
        <StatCard
          title="Active Users"
          value={users.active || 0}
          subtitle="Currently active accounts"
          icon="✅"
          color="#007bff"
        />
        <StatCard
          title="Administrators"
          value={users.admins || 0}
          subtitle="Admin role accounts"
          icon="🔧"
          color="#dc3545"
        />
        <StatCard
          title="New This Week"
          value={users.recent || 0}
          subtitle="Registered in last 7 days"
          icon="🆕"
          color="#ffc107"
        />
      </div>

      {/* Call Statistics */}
      <h3 style={{ marginBottom: '1rem', color: '#333' }}>📞 Call Statistics</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="Total Calls"
          value={calls.total || 0}
          subtitle="All time call count"
          icon="📞"
          color="#17a2b8"
        />
        <StatCard
          title="Today"
          value={calls.today || 0}
          subtitle="Calls made today"
          icon="📅"
          color="#28a745"
        />
        <StatCard
          title="This Week"
          value={calls.thisWeek || 0}
          subtitle="Calls in last 7 days"
          icon="📊"
          color="#007bff"
        />
        <StatCard
          title="Assistant Calls"
          value={calls.assistantCalls || 0}
          subtitle="AI assistant interactions"
          icon="🤖"
          color="#6f42c1"
        />
      </div>

      {/* Notes Statistics */}
      <h3 style={{ marginBottom: '1rem', color: '#333' }}>📝 Notes & Transcription</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="Total Notes"
          value={notes.total || 0}
          subtitle="AI-generated notes"
          icon="📝"
          color="#fd7e14"
        />
        <StatCard
          title="From Streams"
          value={notes.fromStream || 0}
          subtitle="Real-time audio processing"
          icon="🎵"
          color="#20c997"
        />
        <StatCard
          title="From Recordings"
          value={notes.fromRecording || 0}
          subtitle="Recorded file processing"
          icon="🎙️"
          color="#6c757d"
        />
        <StatCard
          title="Recent"
          value={notes.recent || 0}
          subtitle="Generated in last 24h"
          icon="🕐"
          color="#e83e8c"
        />
      </div>

      {/* System Health Indicators */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#333' }}>🏥 System Health</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>
              ✅ Database Connection
            </h4>
            <p style={{ margin: 0, color: '#666' }}>MongoDB operational</p>
          </div>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>
              ✅ Authentication System
            </h4>
            <p style={{ margin: 0, color: '#666' }}>JWT tokens active</p>
          </div>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>
              ✅ AI Services
            </h4>
            <p style={{ margin: 0, color: '#666' }}>OpenAI integration ready</p>
          </div>
        </div>
      </div>

      {/* Real-time Events */}
      {realTimeEvents && realTimeEvents.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#333' }}>📡 Real-time Events</h3>
            {onClearEvents && (
              <button
                onClick={onClearEvents}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Clear Events
              </button>
            )}
          </div>
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            backgroundColor: '#f8f9fa'
          }}>
            {realTimeEvents.map((event, index) => (
              <div
                key={index}
                style={{
                  padding: '8px 12px',
                  borderBottom: index < realTimeEvents.length - 1 ? '1px solid #dee2e6' : 'none',
                  fontSize: '0.9rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>
                  <span style={{
                    color: event.type === 'call_started' ? '#28a745' :
                          event.type === 'call_ended' ? '#dc3545' :
                          event.type === 'note_created' ? '#007bff' : '#6c757d',
                    marginRight: '8px'
                  }}>
                    {event.type === 'call_started' ? '📞' :
                     event.type === 'call_ended' ? '📴' :
                     event.type === 'note_created' ? '📝' : '👤'}
                  </span>
                  {event.message}
                </span>
                <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                  {event.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.5rem', textAlign: 'center' }}>
            Showing last {realTimeEvents.length} events (max 50)
          </div>
        </div>
      )}

    </div>
  );
}


export default AdminStats;
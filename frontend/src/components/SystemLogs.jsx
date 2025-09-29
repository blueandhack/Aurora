import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

function SystemLogs() {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getLogs();
      setLogs(response);
      setError(null);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading system logs...</div>;
  }

  if (error) {
    return (
      <div style={{ 
        background: '#f8d7da', 
        color: '#721c24', 
        padding: '12px', 
        borderRadius: '4px' 
      }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ margin: 0 }}>System Logs</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>
            Last updated: {formatDate(logs.timestamp)}
          </span>
          <button 
            onClick={loadLogs}
            className="btn btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Recent User Activity */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#333' }}>
          👥 Recent User Activity
        </h3>
        {logs.recentActivity.users.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Username</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {logs.recentActivity.users.map((user) => (
                <tr key={user._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{user.username}</td>
                  <td style={{ padding: '8px', color: '#666' }}>{user.email}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      background: user.role === 'admin' ? '#dc3545' : '#28a745',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.8rem' }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.8rem' }}>
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            No recent user activity
          </p>
        )}
      </div>

      {/* Recent Call Activity */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#333' }}>
          📞 Recent Call Activity
        </h3>
        {logs.recentActivity.calls.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Call ID</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>From</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>To</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Started</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Ended</th>
              </tr>
            </thead>
            <tbody>
              {logs.recentActivity.calls.map((call) => (
                <tr key={call._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {call.callSid.slice(-8)}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.8rem' }}>{call.from}</td>
                  <td style={{ padding: '8px', fontSize: '0.8rem' }}>{call.to}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      background: call.status === 'completed' ? '#28a745' : '#ffc107',
                      color: call.status === 'completed' ? 'white' : '#333',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {call.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.8rem' }}>
                    {formatDate(call.startTime)}
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.8rem' }}>
                    {call.endTime ? formatDate(call.endTime) : 'In progress'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            No recent call activity
          </p>
        )}
      </div>

      {/* Recent Notes Activity */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: '#333' }}>
          📝 Recent Notes & Transcription Activity
        </h3>
        {logs.recentActivity.notes.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Call ID</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Source</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Audio Chunks</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {logs.recentActivity.notes.map((note) => (
                <tr key={note._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {note.callSid.slice(-8)}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      background: note.source === 'audio_stream' ? '#17a2b8' : '#6c757d',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {note.source === 'audio_stream' ? '🎵 Stream' : '🎙️ Recording'}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.8rem' }}>
                    {note.audioChunks} chunks
                  </td>
                  <td style={{ padding: '8px', fontSize: '0.8rem' }}>
                    {formatDate(note.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            No recent transcription activity
          </p>
        )}
      </div>

      {/* System Information */}
      <div className="card" style={{ marginTop: '2rem', background: '#f8f9fa' }}>
        <h4 style={{ marginBottom: '1rem', color: '#333' }}>
          ℹ️ System Information
        </h4>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Log Level:</strong> Info, Warning, Error
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Data Retention:</strong> Last 10 entries per category
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Refresh Rate:</strong> Manual refresh required
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Note:</strong> Full logging implementation would typically integrate with systems like ELK Stack, Splunk, or CloudWatch for production deployments.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SystemLogs;
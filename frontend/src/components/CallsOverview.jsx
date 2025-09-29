import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

function CallsOverview() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25
  });

  useEffect(() => {
    loadCalls();
  }, [filters]);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCalls(filters);
      setCalls(response.calls);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      console.error('Error loading calls:', err);
      setError('Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startTime, endTime) => {
    if (!endTime) return 'In progress';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (phoneNumber && phoneNumber.startsWith('+1')) {
      const number = phoneNumber.slice(2);
      return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    return phoneNumber;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'ringing':
        return '#ffc107';
      case 'in-progress':
      case 'answered':
        return '#28a745';
      case 'completed':
        return '#6c757d';
      case 'failed':
      case 'busy':
        return '#dc3545';
      default:
        return '#17a2b8';
    }
  };

  if (loading) {
    return <div className="loading">Loading calls...</div>;
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ margin: 0 }}>Calls Overview</h2>
        <button 
          onClick={loadCalls}
          className="btn btn-secondary"
          style={{ padding: '8px 16px' }}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Call ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>From</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>To</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Started</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Duration</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => (
              <tr key={call._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                  {call.callSid.slice(-8)}
                </td>
                <td style={{ padding: '12px' }}>
                  {formatPhoneNumber(call.from)}
                </td>
                <td style={{ padding: '12px' }}>
                  {formatPhoneNumber(call.to)}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: getStatusColor(call.status),
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {call.status}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                  {formatDate(call.startTime)}
                </td>
                <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                  {formatDuration(call.startTime, call.endTime)}
                </td>
                <td style={{ padding: '12px' }}>
                  {call.isAssistantCall ? (
                    <span style={{
                      background: '#17a2b8',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      🤖 ASSISTANT
                    </span>
                  ) : (
                    <span style={{
                      background: '#6c757d',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      📞 REGULAR
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div style={{ 
            padding: '1rem', 
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setFilters({ ...filters, page })}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #dee2e6',
                  background: page === pagination.current ? '#007bff' : 'white',
                  color: page === pagination.current ? 'white' : '#333',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}

        {calls.length === 0 && !loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            color: '#666'
          }}>
            <h3>No calls found</h3>
            <p>Call data will appear here once calls are made through the system.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CallsOverview;
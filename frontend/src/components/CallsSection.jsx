import React, { useState } from 'react';

function CallsSection({ calls, onEndCall, onRefresh }) {
  const [endingCall, setEndingCall] = useState(null);

  const handleEndCall = async (callSid) => {
    setEndingCall(callSid);
    try {
      await onEndCall(callSid);
    } finally {
      setEndingCall(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}:${diffSecs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phoneNumber) => {
    // Basic phone number formatting
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

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ margin: 0 }}>Active Calls</h2>
        <button 
          onClick={onRefresh}
          className="btn btn-secondary"
          style={{ padding: '8px 16px' }}
        >
          Refresh
        </button>
      </div>

      {calls.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3 style={{ color: '#666', marginBottom: '1rem' }}>
            No active calls
          </h3>
          <p style={{ color: '#888', margin: 0 }}>
            Active calls will appear here when in progress
          </p>
        </div>
      ) : (
        <div>
          {calls.map((call) => (
            <div key={call.callSid} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start' 
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    marginBottom: '0.75rem'
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '1.1rem',
                      color: '#333'
                    }}>
                      Call {call.callSid.slice(-8)}
                    </h3>
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
                    {call.isAssistantCall && (
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
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '0.75rem',
                    fontSize: '0.9rem',
                    color: '#666'
                  }}>
                    <div>
                      <strong>From:</strong> {formatPhoneNumber(call.from)}
                    </div>
                    <div>
                      <strong>To:</strong> {formatPhoneNumber(call.to)}
                    </div>
                    <div>
                      <strong>Started:</strong> {formatDate(call.startTime)}
                    </div>
                    <div>
                      <strong>Duration:</strong> {formatDuration(call.startTime)}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.5rem',
                  marginLeft: '1rem'
                }}>
                  <button
                    onClick={() => handleEndCall(call.callSid)}
                    disabled={endingCall === call.callSid}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: endingCall === call.callSid ? 'not-allowed' : 'pointer',
                      opacity: endingCall === call.callSid ? 0.6 : 1,
                      fontSize: '0.9rem'
                    }}
                  >
                    {endingCall === call.callSid ? 'Ending...' : 'End Call'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CallsSection;
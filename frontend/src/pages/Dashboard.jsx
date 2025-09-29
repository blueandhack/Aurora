import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import CallsSection from '../components/CallsSection';
import NotesSection from '../components/NotesSection';

function Dashboard() {
  const [activeCalls, setActiveCalls] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('notes');

  useEffect(() => {
    loadData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [callsData, notesData] = await Promise.all([
        apiService.getActiveCalls(),
        apiService.getAllNotes()
      ]);
      
      setActiveCalls(callsData);
      setNotes(notesData);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = async (callSid) => {
    try {
      await apiService.endCall(callSid);
      // Refresh active calls
      const callsData = await apiService.getActiveCalls();
      setActiveCalls(callsData);
    } catch (err) {
      console.error('Error ending call:', err);
      setError('Failed to end call');
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Aurora AI Assistant Dashboard</h1>
        <p style={{ color: '#666', margin: 0 }}>
          Manage your calls and view AI-generated notes
        </p>
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

      {/* Tab Navigation */}
      <div style={{ 
        borderBottom: '1px solid #ddd', 
        marginBottom: '2rem',
        display: 'flex',
        gap: '2rem'
      }}>
        <button
          onClick={() => setActiveTab('notes')}
          style={{
            padding: '12px 0',
            border: 'none',
            background: 'none',
            fontSize: '16px',
            fontWeight: activeTab === 'notes' ? 'bold' : 'normal',
            color: activeTab === 'notes' ? '#007bff' : '#666',
            borderBottom: activeTab === 'notes' ? '2px solid #007bff' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Call Notes ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab('calls')}
          style={{
            padding: '12px 0',
            border: 'none',
            background: 'none',
            fontSize: '16px',
            fontWeight: activeTab === 'calls' ? 'bold' : 'normal',
            color: activeTab === 'calls' ? '#007bff' : '#666',
            borderBottom: activeTab === 'calls' ? '2px solid #007bff' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Active Calls ({activeCalls.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'notes' && (
        <NotesSection notes={notes} onRefresh={loadData} />
      )}
      
      {activeTab === 'calls' && (
        <CallsSection 
          calls={activeCalls} 
          onEndCall={handleEndCall}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}

export default Dashboard;
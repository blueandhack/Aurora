import React, { useState } from 'react';
import { apiService } from '../services/apiService';

function NotesSection({ notes, onRefresh }) {
  const [expandedNote, setExpandedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingAudio, setDownloadingAudio] = useState(null);

  const filteredNotes = notes.filter(note =>
    note.transcript.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.callSid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (audioChunks) => {
    // Rough estimate: each chunk is about 20ms of audio
    const seconds = Math.round(audioChunks * 0.02);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleExpanded = (noteId) => {
    setExpandedNote(expandedNote === noteId ? null : noteId);
  };

  const handleDownloadAudio = async (callSid) => {
    try {
      setDownloadingAudio(callSid);
      await apiService.downloadAudio(callSid);
    } catch (error) {
      console.error('Error downloading audio:', error);
      alert('Failed to download audio file. Please try again.');
    } finally {
      setDownloadingAudio(null);
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
        <h2 style={{ margin: 0 }}>Call Notes & Transcripts</h2>
        <button 
          onClick={onRefresh}
          className="btn btn-secondary"
          style={{ padding: '8px 16px' }}
        >
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search notes, transcripts, or call IDs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {filteredNotes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3 style={{ color: '#666', marginBottom: '1rem' }}>
            {searchTerm ? 'No matching notes found' : 'No call notes available'}
          </h3>
          <p style={{ color: '#888', margin: 0 }}>
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Call notes will appear here after calls are completed and processed'
            }
          </p>
        </div>
      ) : (
        <div>
          {filteredNotes.map((note) => (
            <div key={note._id} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <h3 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '1.1rem',
                    color: '#333'
                  }}>
                    Call {note.callSid.slice(-8)}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    fontSize: '0.9rem', 
                    color: '#666' 
                  }}>
                    <span>📅 {formatDate(note.createdAt)}</span>
                    <span>⏱️ {formatDuration(note.audioChunks)}</span>
                    <span>🎵 {note.source}</span>
                    <span>📊 {(note.audioSize / 1024).toFixed(1)}KB</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {/* Download Audio Button - only show if audio file exists */}
                  {(note.audioFilePath || note.audioFileName) && (
                    <button
                      onClick={() => handleDownloadAudio(note.callSid)}
                      disabled={downloadingAudio === note.callSid}
                      className="btn btn-primary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.9rem',
                        backgroundColor: '#28a745',
                        borderColor: '#28a745',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Download audio file"
                    >
                      {downloadingAudio === note.callSid ? (
                        <>⏳ Downloading...</>
                      ) : (
                        <>🎵 Download</>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpanded(note._id)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                  >
                    {expandedNote === note._id ? 'Collapse' : 'Expand'}
                  </button>
                </div>
              </div>

              {/* AI Generated Notes */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ 
                  marginBottom: '0.5rem', 
                  color: '#007bff',
                  fontSize: '1rem'
                }}>
                  🤖 AI Summary
                </h4>
                <div style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '6px',
                  borderLeft: '4px solid #007bff',
                  lineHeight: '1.6'
                }}>
                  {note.notes}
                </div>
              </div>

              {/* Full Transcript (Expandable) */}
              {expandedNote === note._id && (
                <div>
                  <h4 style={{ 
                    marginBottom: '0.5rem', 
                    color: '#28a745',
                    fontSize: '1rem'
                  }}>
                    📝 Full Transcript
                  </h4>
                  <div style={{
                    background: '#f1f3f4',
                    padding: '1rem',
                    borderRadius: '6px',
                    borderLeft: '4px solid #28a745',
                    lineHeight: '1.6',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem'
                  }}>
                    {note.transcript || 'No transcript available'}
                  </div>
                  
                  {/* Technical Details */}
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '0.75rem',
                    background: '#fff3cd',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    color: '#856404'
                  }}>
                    <strong>Technical Details:</strong> {note.audioChunks} chunks processed, 
                    {(note.audioSize / 1024).toFixed(1)}KB audio data, 
                    Source: {note.source}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotesSection;
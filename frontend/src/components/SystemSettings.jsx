import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

function SystemSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null); // Track which setting is being updated

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getSystemSettings();
      setSettings(response);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleRegistration = async () => {
    try {
      setUpdating('registration_enabled');
      setError(null);

      const response = await adminService.toggleRegistration();
      console.log('Registration toggled:', response);

      // Reload settings to get updated values
      await loadSettings();

      // Show success message (you could add a toast notification here)
      console.log(response.message);
    } catch (err) {
      console.error('Error toggling registration:', err);
      setError('Failed to toggle registration setting');
    } finally {
      setUpdating(null);
    }
  };

  const updateSetting = async (settingName, newValue, description = '') => {
    try {
      setUpdating(settingName);
      setError(null);

      await adminService.updateSystemSetting(settingName, newValue, description);

      // Reload settings to get updated values
      await loadSettings();

      console.log(`Setting ${settingName} updated to ${newValue}`);
    } catch (err) {
      console.error('Error updating setting:', err);
      setError(`Failed to update ${settingName}`);
    } finally {
      setUpdating(null);
    }
  };

  const getSettingValue = (settingName) => {
    const setting = settings.find(s => s.setting === settingName);
    return setting ? setting.value : null;
  };

  const getSettingDescription = (settingName) => {
    const setting = settings.find(s => s.setting === settingName);
    return setting ? setting.description : '';
  };

  const formatLastUpdated = (setting) => {
    if (!setting.updatedAt) return 'Never';
    return new Date(setting.updatedAt).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading system settings...</div>;
  }

  if (error) {
    return (
      <div style={{
        background: '#f8d7da',
        color: '#721c24',
        padding: '1rem',
        borderRadius: '4px',
        margin: '1rem 0'
      }}>
        {error}
        <button onClick={loadSettings} style={{ marginLeft: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  const registrationEnabled = getSettingValue('registration_enabled');
  const maxUsers = getSettingValue('max_users');
  const maintenanceMode = getSettingValue('maintenance_mode');

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0' }}>⚙️ System Settings</h2>
        <p style={{ color: '#666', margin: 0 }}>
          Configure system-wide settings and preferences
        </p>
      </div>

      {/* Registration Settings */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#333' }}>👥 User Registration</h3>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          background: registrationEnabled ? '#d4edda' : '#f8d7da',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>
              New User Registration
            </h4>
            <p style={{
              margin: 0,
              color: registrationEnabled ? '#155724' : '#721c24',
              fontWeight: 'bold'
            }}>
              Currently {registrationEnabled ? 'ENABLED' : 'DISABLED'}
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
              {getSettingDescription('registration_enabled')}
            </p>
          </div>

          <button
            onClick={toggleRegistration}
            disabled={updating === 'registration_enabled'}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: registrationEnabled ? '#dc3545' : '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: updating === 'registration_enabled' ? 'not-allowed' : 'pointer',
              opacity: updating === 'registration_enabled' ? 0.6 : 1
            }}
          >
            {updating === 'registration_enabled' ? '⏳ Updating...' :
             registrationEnabled ? '🔒 Disable Registration' : '🔓 Enable Registration'}
          </button>
        </div>

        {/* Registration Status Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Registration Status</h5>
            <p style={{
              margin: 0,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: registrationEnabled ? '#28a745' : '#dc3545'
            }}>
              {registrationEnabled ? '🟢 Open' : '🔴 Closed'}
            </p>
          </div>

          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>User Limit</h5>
            <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#007bff' }}>
              {maxUsers || 'Not set'}
            </p>
          </div>

          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Last Updated</h5>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
              {formatLastUpdated(settings.find(s => s.setting === 'registration_enabled') || {})}
            </p>
          </div>
        </div>
      </div>

      {/* All System Settings */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: '#333' }}>🔧 All System Settings</h3>

        {settings.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            No system settings found
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Setting
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Value
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Description
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {settings.map((setting, index) => (
                  <tr key={setting.setting} style={{
                    borderBottom: index < settings.length - 1 ? '1px solid #dee2e6' : 'none'
                  }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {setting.setting}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: typeof setting.value === 'boolean'
                          ? (setting.value ? '#d4edda' : '#f8d7da')
                          : '#e3f2fd',
                        color: typeof setting.value === 'boolean'
                          ? (setting.value ? '#155724' : '#721c24')
                          : '#1976d2',
                        fontWeight: 'bold'
                      }}>
                        {typeof setting.value === 'boolean'
                          ? (setting.value ? '✅ True' : '❌ False')
                          : String(setting.value)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#666' }}>
                      {setting.description || 'No description'}
                    </td>
                    <td style={{ padding: '12px', color: '#666', fontSize: '0.9rem' }}>
                      {formatLastUpdated(setting)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SystemSettings;
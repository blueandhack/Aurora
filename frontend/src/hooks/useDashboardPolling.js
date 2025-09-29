import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';

const useDashboardPolling = () => {
  const [stats, setStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pollingActive, setPollingActive] = useState(true);

  const loadStats = useCallback(async () => {
    if (isLoading) return; // Prevent multiple concurrent requests

    try {
      setIsLoading(true);
      setError(null);
      const statsData = await adminService.getStats();
      setStats(statsData);
      setLastUpdate(new Date());
      console.log('📊 Dashboard stats updated via polling');
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Initial load
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Polling mechanism
  useEffect(() => {
    if (!pollingActive) return;

    const interval = setInterval(() => {
      if (!isLoading) {
        loadStats();
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [pollingActive, isLoading, loadStats]);

  const refreshStats = useCallback(() => {
    loadStats();
  }, [loadStats]);

  const togglePolling = useCallback(() => {
    setPollingActive(prev => !prev);
    console.log(`📡 Polling ${pollingActive ? 'stopped' : 'started'}`);
  }, [pollingActive]);

  return {
    // Data
    stats,
    lastUpdate,

    // State
    isLoading,
    error,
    pollingActive,
    connectionStatus: pollingActive ? 'Polling Active' : 'Polling Stopped',
    isConnected: pollingActive && !error,

    // Actions
    refreshStats,
    togglePolling
  };
};

export default useDashboardPolling;
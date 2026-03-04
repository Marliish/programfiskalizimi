'use client';

import { useState, useEffect } from 'react';
import { FiWifi, FiWifiOff, FiRefreshCw } from 'react-icons/fi';
import { syncService } from '@/lib/offline';
import { useTranslation } from '@/lib/i18n';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Initialize
    setIsOnline(navigator.onLine);
    updatePendingCount();

    // Initialize sync service
    syncService.init();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updatePendingCount();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending count periodically
    const interval = setInterval(updatePendingCount, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    const count = await syncService.getPendingCount();
    setPendingCount(count);
  };

  const handleSync = async () => {
    if (isSyncing || !isOnline) return;
    
    setIsSyncing(true);
    try {
      await syncService.syncPendingTransactions();
      await updatePendingCount();
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show anything if online and no pending
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
        isOnline ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {isOnline ? (
        <FiWifi className="text-xl" />
      ) : (
        <FiWifiOff className="text-xl" />
      )}

      <div className="flex flex-col">
        <span className="font-medium">
          {isOnline ? t('pendingSync') : t('offlineMode')}
        </span>
        {pendingCount > 0 && (
          <span className="text-sm">
            {pendingCount} {t('transactionsQueued')}
          </span>
        )}
        {!isOnline && (
          <span className="text-sm">{t('offlineMessage')}</span>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="ml-2 p-2 rounded-full bg-yellow-200 hover:bg-yellow-300 disabled:opacity-50"
          title={t('syncNow')}
        >
          <FiRefreshCw className={`text-lg ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}

// Compact version for header
export function OfflineIndicatorCompact() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    updatePendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      updatePendingCount();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(updatePendingCount, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const count = await syncService.getPendingCount();
      setPendingCount(count);
    } catch (e) {
      // Ignore errors during initialization
    }
  };

  if (isOnline && pendingCount === 0) {
    return (
      <div className="flex items-center gap-1 text-green-600" title="Online">
        <FiWifi className="text-sm" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
        isOnline ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
      }`}
      title={isOnline ? `${pendingCount} pending` : 'Offline'}
    >
      {isOnline ? <FiWifi /> : <FiWifiOff />}
      {pendingCount > 0 && <span>{pendingCount}</span>}
    </div>
  );
}

export default OfflineIndicator;

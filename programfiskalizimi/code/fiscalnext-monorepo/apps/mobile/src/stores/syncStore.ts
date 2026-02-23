import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from '../services/syncService';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
  isOnline: boolean;
  sync: () => Promise<void>;
  startAutoSync: () => void;
  stopAutoSync: () => void;
}

let syncInterval: NodeJS.Timeout | null = null;

export const useSyncStore = create<SyncState>((set, get) => ({
  isSyncing: false,
  lastSyncTime: null,
  pendingChanges: 0,
  isOnline: true,

  sync: async () => {
    if (get().isSyncing || !get().isOnline) return;

    set({ isSyncing: true });
    try {
      await syncService.syncAll();
      set({ 
        isSyncing: false, 
        lastSyncTime: Date.now(),
        pendingChanges: 0 
      });
    } catch (error) {
      console.error('Sync error:', error);
      set({ isSyncing: false });
    }
  },

  startAutoSync: () => {
    // Listen to network changes
    NetInfo.addEventListener((state) => {
      set({ isOnline: state.isConnected || false });
      if (state.isConnected) {
        get().sync();
      }
    });

    // Auto-sync every 5 minutes when online
    syncInterval = setInterval(() => {
      if (get().isOnline && !get().isSyncing) {
        get().sync();
      }
    }, 5 * 60 * 1000);
  },

  stopAutoSync: () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  },
}));

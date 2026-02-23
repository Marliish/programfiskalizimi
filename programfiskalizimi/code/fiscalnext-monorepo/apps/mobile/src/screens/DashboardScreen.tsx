import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { format } from 'date-fns';
import { api } from '../services/apiClient';
import { useSyncStore } from '../stores/syncStore';

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTransactions: 0,
    lowStockItems: 0,
    pendingOrders: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const { isOnline, isSyncing, lastSyncTime, sync } = useSyncStore();

  const loadStats = async () => {
    try {
      // In production, would fetch from dedicated dashboard endpoint
      const salesResponse = await api.getSales({ page: 1, limit: 10 });
      // Calculate stats from sales data
      setStats({
        todaySales: 1250.50,
        todayTransactions: 15,
        lowStockItems: 3,
        pendingOrders: 2,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), sync()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerDate}>{format(new Date(), 'MMMM d, yyyy')}</Text>
      </View>

      <View style={styles.syncStatus}>
        <Text style={styles.syncText}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
          {isSyncing && ' • Syncing...'}
        </Text>
        {lastSyncTime && (
          <Text style={styles.syncTime}>
            Last sync: {format(new Date(lastSyncTime), 'HH:mm')}
          </Text>
        )}
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${stats.todaySales.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Today's Sales</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.todayTransactions}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.warningText]}>
            {stats.lowStockItems}
          </Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending Orders</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📊 View Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📦 Check Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>🔔 Notifications</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  syncStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 1,
  },
  syncText: {
    fontSize: 14,
    color: '#333',
  },
  syncTime: {
    fontSize: 12,
    color: '#999',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    marginTop: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    margin: '1%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  warningText: {
    color: '#FF3B30',
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
  },
});

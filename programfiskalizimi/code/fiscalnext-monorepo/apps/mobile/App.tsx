import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from './src/stores/authStore';
import { useSyncStore } from './src/stores/syncStore';
import { initializeDatabase } from './src/database/init';
import { registerForPushNotificationsAsync } from './src/services/notificationService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import POSScreen from './src/screens/POSScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import SalesHistoryScreen from './src/screens/SalesHistoryScreen';
import CustomerScreen from './src/screens/CustomerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ScannerScreen from './src/screens/ScannerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="POS" 
        component={POSScreen}
        options={{ tabBarLabel: 'Sell' }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ tabBarLabel: 'Products' }}
      />
      <Tab.Screen 
        name="Sales" 
        component={SalesHistoryScreen}
        options={{ tabBarLabel: 'Sales' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { token, loadStoredAuth } = useAuthStore();
  const { startAutoSync } = useSyncStore();

  useEffect(() => {
    // Initialize app
    const init = async () => {
      await initializeDatabase();
      await loadStoredAuth();
      await registerForPushNotificationsAsync();
      startAutoSync();
    };
    init();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="Scanner" 
              component={ScannerScreen}
              options={{ 
                presentation: 'modal',
                headerShown: true,
                title: 'Scan Barcode'
              }}
            />
            <Stack.Screen 
              name="Customer" 
              component={CustomerScreen}
              options={{ 
                headerShown: true,
                title: 'Customer'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

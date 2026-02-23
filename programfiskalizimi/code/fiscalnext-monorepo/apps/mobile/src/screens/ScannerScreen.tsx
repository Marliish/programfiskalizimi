import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '../stores/cartStore';
import { db_operations } from '../database/init';

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const navigation = useNavigation();
  const { addItem } = useCartStore();

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: any) => {
    setScanned(true);

    try {
      // Look up product by barcode
      const product = await db_operations.getProductByBarcode(data);

      if (product) {
        addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          barcode: product.barcode,
        });

        Alert.alert('Added to Cart', product.name, [
          {
            text: 'Scan Another',
            onPress: () => setScanned(false),
          },
          {
            text: 'Go to POS',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Product Not Found', `Barcode: ${data}`, [
          {
            text: 'Try Again',
            onPress: () => setScanned(false),
          },
        ]);
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      Alert.alert('Error', 'Failed to process barcode');
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
        <Text style={styles.submessage}>
          Please enable camera permissions in settings
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.instruction}>
          Position barcode within the frame
        </Text>

        {scanned && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanButtonText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    flex: 1,
    textAlign: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: '#fff',
  },
  submessage: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    padding: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  instruction: {
    marginTop: 30,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 8,
  },
  rescanButton: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

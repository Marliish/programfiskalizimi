import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '../stores/cartStore';
import { db_operations } from '../database/init';

export default function POSScreen() {
  const navigation = useNavigation();
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    try {
      // Save sale to local database (will sync later)
      await db_operations.createSale({
        customerId: null,
        total: getTotal(),
        paymentMethod,
        items,
      });

      Alert.alert('Success', 'Sale completed!', [
        {
          text: 'OK',
          onPress: () => clearCart(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to process sale');
    }
  };

  const renderCartItem = ({ item }: any) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
      </View>

      <View style={styles.quantityControl}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity - 1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.quantity}>{item.quantity}</Text>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity + 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.id)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.itemTotal}>
        ${(item.price * item.quantity).toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Point of Sale</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scanner' as never)}
        >
          <Text style={styles.scanButtonText}>📷 Scan</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyCart}>
            <Text style={styles.emptyText}>Cart is empty</Text>
            <Text style={styles.emptySubtext}>Scan or add items to start</Text>
          </View>
        }
        contentContainerStyle={styles.cartList}
      />

      <View style={styles.footer}>
        <View style={styles.paymentMethods}>
          <TouchableOpacity
            style={[
              styles.paymentButton,
              paymentMethod === 'cash' && styles.paymentButtonActive,
            ]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Text
              style={[
                styles.paymentButtonText,
                paymentMethod === 'cash' && styles.paymentButtonTextActive,
              ]}
            >
              💵 Cash
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentButton,
              paymentMethod === 'card' && styles.paymentButtonActive,
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <Text
              style={[
                styles.paymentButtonText,
                paymentMethod === 'card' && styles.paymentButtonTextActive,
              ]}
            >
              💳 Card
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${getTotal().toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            items.length === 0 && styles.checkoutButtonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={items.length === 0}
        >
          <Text style={styles.checkoutButtonText}>Complete Sale</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cartList: {
    padding: 15,
  },
  cartItem: {
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
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    color: '#666',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#f0f0f0',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 15,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: 'auto',
    padding: 5,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#FF3B30',
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 10,
    textAlign: 'right',
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paymentMethods: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  paymentButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  paymentButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  paymentButtonText: {
    fontSize: 16,
    color: '#333',
  },
  paymentButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  checkoutButton: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

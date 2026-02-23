import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CustomerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Customer Details</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});

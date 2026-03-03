import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function DrawerMenuButton({ navigation, color = '#111' }) {
  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={() => navigation.getParent()?.openDrawer?.()}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Text style={[styles.icon, { color }]}>{'☰'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 12, paddingVertical: 6 },
  icon: { fontSize: 20, fontWeight: '800' }
});

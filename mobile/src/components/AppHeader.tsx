import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function AppHeader({
  title = 'Ensaio Regional',
  subtitle
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800'
  },
  subtitle: {
    marginTop: 4,
    color: '#D1D5DB',
    fontSize: 13
  }
});

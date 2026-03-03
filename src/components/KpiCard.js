import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function KpiCard({ title, value, subtitle }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value ?? '-'}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.colors.border
    },
    title: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '700' },
    value: { fontSize: 22, fontWeight: '900', color: theme.colors.text, marginTop: 4 },
    subtitle: { fontSize: 11, color: theme.colors.textMuted, marginTop: 4, fontWeight: '600' }
  });
}

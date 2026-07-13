// mobile/src/components/StatusBanners.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  isDemoMode: boolean;
  isOnline: boolean;
  pendingCount?: number;
};

export function StatusBanners({ isDemoMode, isOnline, pendingCount = 0 }: Props) {
  return (
    <View>
      {isDemoMode ? (
        <View style={[styles.banner, styles.demo]} accessibilityRole="text">
          <Text style={styles.demoText}>
            Modo demonstração — registros ficam só neste dispositivo
          </Text>
        </View>
      ) : null}

      {!isDemoMode && !isOnline ? (
        <View style={[styles.banner, styles.offline]} accessibilityRole="alert">
          <Text style={styles.offlineText}>
            Sem conexão — novos lançamentos entram na fila offline
          </Text>
        </View>
      ) : null}

      {!isDemoMode && pendingCount > 0 ? (
        <View style={[styles.banner, styles.pending]} accessibilityRole="text">
          <Text style={styles.pendingText}>
            {pendingCount} item(ns) aguardando sincronização com a planilha
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  demo: {
    backgroundColor: 'rgba(255, 214, 10, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.35)',
  },
  demoText: {
    color: '#FFD60A',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  offline: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.35)',
  },
  offlineText: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  pending: {
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.35)',
  },
  pendingText: {
    color: '#0A84FF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});

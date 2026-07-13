// mobile/src/components/StatusBanners.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  isDemoMode: boolean;
  isOnline: boolean;
};

export function StatusBanners({ isDemoMode, isOnline }: Props) {
  if (isDemoMode) {
    return (
      <View style={[styles.banner, styles.demo]} accessibilityRole="text">
        <Text style={styles.demoText}>Modo demonstração — registros ficam só neste dispositivo</Text>
      </View>
    );
  }

  if (!isOnline) {
    return (
      <View style={[styles.banner, styles.offline]} accessibilityRole="alert">
        <Text style={styles.offlineText}>Sem conexão — o lançamento precisa de internet</Text>
      </View>
    );
  }

  return null;
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
});

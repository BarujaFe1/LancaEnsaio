// mobile/app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { getToken, subscribeToken } from '../src/session';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [ready, setReady] = useState(false);
  const [token, setTokenState] = useState<string>('');

  // 1) Carrega token uma vez no boot
  useEffect(() => {
    (async () => {
      const t = await getToken();
      setTokenState(t || '');
      setReady(true);
    })();
  }, []);

  // 2) Mantém o token sincronizado (sem depender de AsyncStorage timing)
  useEffect(() => {
    const unsub = subscribeToken((t) => setTokenState(t || ''));
    return unsub;
  }, []);

  // 3) Guarda de rota simples
  useEffect(() => {
    if (!ready) return;

    const first = segments[0];
    const inLogin = first === 'login';

    if (!token && !inLogin) {
      router.replace('/login');
      return;
    }

    if (token && inLogin) {
      router.replace('/(tabs)');
    }
  }, [ready, token, segments, router]);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      {!ready ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1115',
  },
});

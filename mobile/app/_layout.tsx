import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { getPrefs, subscribePrefs, UserPrefs } from '../src/session';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs>({ nomeLancador: '', tipoSelecionado: null });

  useEffect(() => {
    (async () => {
      const p = await getPrefs();
      setPrefs(p);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const unsub = subscribePrefs((p) => setPrefs(p));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!ready) return;

    const isSetupCompleted = !!(prefs.nomeLancador && prefs.tipoSelecionado);
    const inSetup = segments[0] === 'setup';

    if (!isSetupCompleted && !inSetup) {
      router.replace('/setup');
      return;
    }

    if (isSetupCompleted && inSetup) {
      router.replace('/(tabs)');
    }
  }, [ready, prefs, segments, router]);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="setup" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      {!ready ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#34C759" />
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

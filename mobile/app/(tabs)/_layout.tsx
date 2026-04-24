// mobile/app/(tabs)/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPrefs, subscribePrefs, UserPrefs } from '../../src/session';

export default function TabsLayout() {
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getPrefs();
      setPrefs(p);
    })();
  }, []);

  useEffect(() => {
    const unsub = subscribePrefs((p) => setPrefs(p));
    return () => unsub();
  }, []);

  const labelMode = prefs?.tipoSelecionado === 'IRMAS' ? 'Irmãs' : 'Irmãos';

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#1A1D25' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '900' },
        tabBarStyle: { 
          backgroundColor: '#1A1D25', 
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#34C759',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: `Lançar ${labelMode}`,
          tabBarLabel: 'Lançar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alert"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configurações',
          tabBarLabel: 'Config',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alert"
        options={{
          title: 'Alerta Manual',
          tabBarLabel: 'Alerta',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="warning" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configurações',
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

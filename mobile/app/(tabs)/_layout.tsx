// mobile/app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#232732' },
        headerTintColor: '#FFFFFF',
        tabBarStyle: { backgroundColor: '#232732', borderTopColor: 'rgba(255,255,255,0.08)' },
        tabBarActiveTintColor: '#34C759',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Irmãos',
          tabBarLabel: 'Irmãos',
        }}
      />
    </Tabs>
  );
}

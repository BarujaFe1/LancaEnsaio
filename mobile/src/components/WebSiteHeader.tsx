// mobile/src/components/WebSiteHeader.tsx
import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BADGES = ['React Native', 'Expo', 'Supabase', 'TypeScript'];

const PORTFOLIO_URL = 'https://github.com/BarujaFe1';
const REPO_URL = 'https://github.com/BarujaFe1/LancaEnsaio';

function ExtLink({ href, label }: { href: string; label: string }) {
  return (
    <TouchableOpacity onPress={() => Linking.openURL(href)}>
      <Text style={styles.link}>{label}</Text>
    </TouchableOpacity>
  );
}

export function WebSiteHeader() {
  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <Text style={styles.brand}>LançaEnsaio</Text>
        <View style={styles.badges}>
          {BADGES.map((b) => (
            <Text key={b} style={styles.badge}>
              {b}
            </Text>
          ))}
          <Text style={[styles.badge, styles.badgeDemo]}>Demo</Text>
        </View>
      </View>
      <View style={styles.links}>
        <ExtLink href={PORTFOLIO_URL} label="← Portfólio" />
        <ExtLink href={REPO_URL} label="GitHub ↗" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F1115',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  badgeDemo: {
    color: '#0F1115',
    backgroundColor: '#FFD60A',
    borderColor: '#FFD60A',
  },
  links: {
    flexDirection: 'row',
    gap: 16,
  },
  link: {
    color: '#34C759',
    fontSize: 13,
    fontWeight: '700',
  },
});

// mobile/src/components/WebSiteHeader.tsx
import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BADGES = ['React Native', 'Expo', 'Supabase', 'TypeScript'];

const PORTFOLIO_URL = 'https://barujafe.vercel.app';
const REPO_URL = 'https://github.com/BarujaFe1/LancaEnsaio';

function openExternal(href: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  Linking.openURL(href);
}

function ExtLink({ href, label }: { href: string; label: string }) {
  return (
    <TouchableOpacity onPress={() => openExternal(href)} accessibilityRole="link">
      <Text style={styles.link}>{label}</Text>
    </TouchableOpacity>
  );
}

import { isDemo } from '../backend';

export function WebSiteHeader() {
  if (Platform.OS !== 'web') return null;

  const [installPrompt, setInstallPrompt] = React.useState<any>(null);
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      alert(
        '📱 Para instalar o LançaEnsaio no celular:\n\n' +
        '• No Chrome/Android: toque no menu (⋮) e escolha "Instalar aplicativo" ou "Adicionar à tela inicial".\n\n' +
        '• No Safari/iPhone: toque no botão Compartilhar (ícone com seta) e selecione "Adicionar à Tela de Início".'
      );
    }
  };

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
          {isDemo() ? (
            <Text style={[styles.badge, styles.badgeDemo]}>Demo</Text>
          ) : (
            <Text style={[styles.badge, styles.badgeLive]}>● Conectado</Text>
          )}
        </View>
      </View>
      <View style={styles.links}>
        {!isStandalone && (
          <TouchableOpacity style={styles.installBtn} onPress={handleInstall} activeOpacity={0.8}>
            <Text style={styles.installBtnText}>📲 Instalar App</Text>
          </TouchableOpacity>
        )}
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
    flexWrap: 'wrap',
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
  badgeLive: {
    color: '#34C759',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderColor: '#34C759',
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  link: {
    color: '#34C759',
    fontSize: 13,
    fontWeight: '700',
  },
  installBtn: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  installBtnText: {
    color: '#0F1115',
    fontSize: 12,
    fontWeight: '800',
  },
});

// mobile/src/components/WebSiteHeader.tsx
import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    backgroundColor: '#0F1115',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
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

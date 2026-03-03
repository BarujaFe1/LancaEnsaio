// Para que serve: Tela de login/cadastro com opção "Entrar sem e-mail (convidado)" para evitar limite de emails do Supabase.
// Onde colar: substitua este arquivo no seu projeto em /src/screens/LoginScreen.js

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';

export default function LoginScreen() {
  const { signIn, signUp, signInAnonymous } = useAuth();
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    try {
      setLoading(true);
      await signIn(email.trim(), password);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async () => {
    try {
      setLoading(true);
      const result = await signUp(email.trim(), password, fullName.trim());

      // Se a confirmação de e-mail estiver desativada no Supabase, você já entra automaticamente.
      // Se estiver ativada, o Supabase pode exigir confirmação e NÃO criar sessão imediatamente.
      if (result?.needsEmailConfirmation) {
        Alert.alert(
          'Conta criada',
          'Sua conta foi criada, mas o Supabase está exigindo confirmação de e-mail.\n\nPara NÃO precisar confirmar (e evitar limite de e-mails), desative "Confirm email" no Supabase:\nAuthentication → Providers → Email → Confirm email (OFF).'
        );
      } else {
        Alert.alert('Conta criada', 'Pronto! Você já pode usar o app.');
      }
      setMode('login');
    } catch (e) {
      const msg = e?.message || String(e);

      // Dica amigável para o caso mais comum: 429 / email rate limit exceeded
      if (msg.toLowerCase().includes('rate limit') || msg.includes('429')) {
        Alert.alert(
          'Limite de e-mails atingido',
          'O Supabase limitou o envio de e-mails (signup/recuperação).\n\nSoluções rápidas:\n1) Use "Entrar sem e-mail (convidado)"\n2) Desative "Confirm email" no Supabase (Authentication → Providers → Email)\n3) Configure SMTP próprio no Supabase (remove/ajusta limites)'
        );
      } else {
        Alert.alert('Erro', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const onAnonymous = async () => {
    try {
      if (!fullName.trim()) {
        return Alert.alert('Atenção', 'Digite seu nome para identificar você no sistema.');
      }
      setLoading(true);
      await signInAnonymous(fullName.trim());
      // Depois que entrar, vá em Configurações → Equipe e informe o código para compartilhar os dados.
    } catch (e) {
      Alert.alert(
        'Erro',
        (e?.message || 'Não foi possível entrar como convidado.') +
          '\n\nVerifique no Supabase: Authentication → Settings → General configuration → Allow anonymous sign-ins (ON).'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Maestro</Text>
        <Text style={styles.subtitle}>Acesso do instrutor</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.tabActive]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Criar conta</Text>
          </TouchableOpacity>
        </View>

        {/* Nome: usado para cadastro e para modo convidado */}
        <TextInput
          placeholder="Seu nome (ex.: Irmão João)"
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          placeholder="E-mail"
          placeholderTextColor={theme.colors.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Senha"
          placeholderTextColor={theme.colors.placeholder}
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {mode === 'login' ? (
          <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Aguarde...' : 'Entrar'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={onSignup} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Aguarde...' : 'Criar conta'}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <TouchableOpacity style={styles.secondary} onPress={onAnonymous} disabled={loading}>
          <Text style={styles.secondaryText}>
            {loading ? 'Aguarde...' : 'Entrar sem e-mail (convidado) — recomendado para evitar limite'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Dica: para compartilhar dados entre todos os instrutores, entre na equipe em{' '}
          <Text style={{ fontWeight: '900', color: theme.colors.accent }}>Configurações → Equipe</Text>.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrap: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.bg, padding: 16 },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border
    },
    title: { fontSize: 22, fontWeight: '900', color: theme.colors.text },
    subtitle: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4, marginBottom: 14, fontWeight: '700' },

    tabs: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.inputBg,
      alignItems: 'center'
    },
    tabActive: {
      borderColor: theme.colors.accent
    },
    tabText: { color: theme.colors.textMuted, fontWeight: '800' },
    tabTextActive: { color: theme.colors.text, fontWeight: '900' },

    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      backgroundColor: theme.colors.inputBg,
      color: theme.colors.inputText,
      fontWeight: '700'
    },
    button: { backgroundColor: theme.colors.accent, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4 },
    buttonText: { color: '#fff', fontWeight: '900' },

    divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },

    secondary: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center'
    },
    secondaryText: { color: theme.colors.text, fontWeight: '900', textAlign: 'center' },

    hint: { marginTop: 12, color: theme.colors.textMuted, fontWeight: '700', textAlign: 'center' }
  });
}

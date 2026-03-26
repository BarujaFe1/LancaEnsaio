// mobile/app/login.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../src/api';
import {
  clearToken,
  getLastUser,
  getOrCreateDeviceId,
  setLastUser,
  setToken,
} from '../src/session';

export default function LoginScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    (async () => {
      const did = await getOrCreateDeviceId();
      setDeviceId(did);

      // preenche o último usuário digitado (para não ficar “vazio” ao voltar)
      const last = await getLastUser();
      if (last) setUsuario(last);

      setLoading(false);
    })();
  }, []);

  const entrar = async () => {
    const u = usuario.trim();
    const s = senha.trim();

    if (!u || !s) {
      Alert.alert('Atenção', 'Digite usuário e senha.');
      return;
    }

    setEntrando(true);
    try {
      // ✅ limpa token antes de logar (evita reaproveitar token inválido)
      await clearToken();

      const res = await api.post('/auth/login', {
        usuario: u,
        senha: s,
        deviceId,
      });

      const token = String(res.data?.token || '');
      if (!token) {
        Alert.alert('Erro', 'Login não retornou token. Verifique o backend.');
        return;
      }

      await setToken(token);
      await setLastUser(u);

      // ✅ Validar imediatamente a sessão chamando /config
      // Se isso falhar (401), NÃO navega para tabs (evita “logou e voltou”)
      try {
        await api.get('/config');
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 401) {
          await clearToken();
          Alert.alert('Sessão inválida', 'Não foi possível validar a sessão. Tente novamente.');
          return;
        }
        // outros erros: mostra mas deixa tentar novamente
        const msg = e?.response?.data?.erro || e?.message || 'Falha ao carregar configuração (/config)';
        Alert.alert('Erro', String(msg));
        return;
      }

      const aviso = String(res.data?.aviso || '').trim();
      if (aviso) Alert.alert('Aviso', aviso);

      router.replace('/(tabs)');
    } catch (err: any) {
      const msg =
        err?.response?.data?.erro ||
        err?.message ||
        'Falha no login. Verifique se o backend está rodando.';
      Alert.alert('Erro', String(msg));
    } finally {
      setEntrando(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.centerText}>Preparando login...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.title}>LançaEnsaio</Text>
        <Text style={styles.subtitle}>Entre para carregar o Cérebro</Text>

        <Text style={styles.label}>Usuário</Text>
        <TextInput
          value={usuario}
          onChangeText={setUsuario}
          placeholder="ex.: eflaim"
          placeholderTextColor="#8E8E93"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          returnKeyType="next"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          value={senha}
          onChangeText={setSenha}
          placeholder="••••••••"
          placeholderTextColor="#8E8E93"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={entrar}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.button, entrando && styles.buttonDisabled]}
          onPress={entrar}
          disabled={entrando}
        >
          {entrando ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helper}>Device ID: {deviceId || '-'}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#232732',
    borderRadius: 18,
    padding: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: '#C7C7CC',
    marginBottom: 16,
  },
  label: {
    color: '#E5E7EB',
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#34C759',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  helper: { marginTop: 12, color: '#9CA3AF', fontSize: 12 },
  center: {
    flex: 1,
    backgroundColor: '#0F1115',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: { marginTop: 12, color: '#C7C7CC' },
});

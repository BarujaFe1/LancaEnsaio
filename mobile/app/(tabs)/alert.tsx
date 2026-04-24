// mobile/app/(tabs)/alert.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { getPrefs } from '../../src/session';
import { api } from '../../src/api';

export default function AlertScreen() {
  const [id, setId] = useState('');
  const [aviso, setAviso] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnviar = async () => {
    const idLimpo = id.trim();
    const avisoLimpo = aviso.trim();

    if (!idLimpo || !avisoLimpo) {
      Alert.alert('Erro', 'Preencha o ID do registro e o texto do aviso.');
      return;
    }

    setLoading(true);
    try {
      const prefs = await getPrefs();
      await api.post('/registros/alerta', {
        id: idLimpo,
        aviso: avisoLimpo,
        nomeLancador: prefs.nomeLancador,
      });

      Alert.alert('Sucesso', 'Alerta registrado com sucesso.');
      setId('');
      setAviso('');
    } catch (err: any) {
      const msg = err?.response?.data?.erro || err?.message || 'Falha ao enviar alerta.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Alerta Manual</Text>
          <Text style={styles.subtitle}>Use esta tela para corrigir ou alertar sobre um registro já enviado.</Text>

          <Text style={styles.label}>ID do Registro (Ex: MABC1234 ou F1234)</Text>
          <TextInput
            style={styles.input}
            value={id}
            onChangeText={setId}
            placeholder="Digite o ID"
            placeholderTextColor="#8E8E93"
            autoCapitalize="characters"
          />

          <Text style={[styles.label, { marginTop: 20 }]}>O que está errado?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={aviso}
            onChangeText={setAviso}
            placeholder="Descreva o problema..."
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleEnviar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Enviar Alerta</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  scrollContent: { padding: 24, justifyContent: 'center', minHeight: '100%' },
  card: {
    backgroundColor: '#232732',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: '#9CA3AF', fontSize: 14, marginBottom: 24 },
  label: { color: '#E5E7EB', fontWeight: '700', marginBottom: 8, fontSize: 15 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#FF453A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});

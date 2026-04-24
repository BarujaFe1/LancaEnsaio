// mobile/app/setup.tsx
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { savePrefs } from '../src/session';

export default function SetupScreen() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'IRMAOS' | 'IRMAS' | null>(null);

  const handleSalvar = async () => {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      Alert.alert('Faltou o nome', 'Por favor, digite seu nome para continuar.');
      return;
    }
    if (!tipo) {
      Alert.alert('Faltou o tipo', 'Por favor, selecione se vai lançar ensaios de Irmãos ou Irmãs.');
      return;
    }

    await savePrefs({ nomeLancador: nomeLimpo, tipoSelecionado: tipo });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>LançaEnsaio</Text>
        <Text style={styles.subtitle}>Configuração Inicial</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Como você se chama?</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            placeholderTextColor="#8E8E93"
            value={nome}
            onChangeText={setNome}
            autoCorrect={false}
          />

          <Text style={[styles.label, { marginTop: 24 }]}>O que você vai lançar hoje?</Text>
          <View style={styles.row}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.typeBtn, tipo === 'IRMAOS' && styles.typeBtnActive]}
              onPress={() => setTipo('IRMAOS')}
            >
              <Text style={[styles.typeBtnText, tipo === 'IRMAOS' && styles.typeBtnTextActive]}>
                Irmãos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.typeBtn, tipo === 'IRMAS' && styles.typeBtnActive]}
              onPress={() => setTipo('IRMAS')}
            >
              <Text style={[styles.typeBtnText, tipo === 'IRMAS' && styles.typeBtnTextActive]}>
                Irmãs
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.submitBtn} onPress={handleSalvar}>
            <Text style={styles.submitBtnText}>Começar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#232732',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    color: '#E5E7EB',
    fontWeight: '800',
    marginBottom: 10,
    fontSize: 15,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeBtnActive: {
    backgroundColor: 'rgba(52,199,89,0.15)',
    borderColor: '#34C759',
  },
  typeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  typeBtnTextActive: {
    color: '#34C759',
    fontWeight: '900',
  },
  submitBtn: {
    marginTop: 32,
    backgroundColor: '#34C759',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
});

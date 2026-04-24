// mobile/app/(tabs)/settings.tsx
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { getPrefs, savePrefs, clearPrefs, UserPrefs } from '../../src/session';
import { api } from '../../src/api';

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<UserPrefs>({ nomeLancador: '', tipoSelecionado: null });
  const [nome, setNome] = useState('');

  useEffect(() => {
    (async () => {
      const p = await getPrefs();
      setPrefs(p);
      setNome(p.nomeLancador);
    })();
  }, []);

  const handleSalvarNome = async () => {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      Alert.alert('Erro', 'O nome não pode ser vazio.');
      return;
    }
    await savePrefs({ nomeLancador: nomeLimpo });
    Alert.alert('Sucesso', 'Nome atualizado com sucesso.');
  };

  const handleTrocarTipo = async (novoTipo: 'IRMAOS' | 'IRMAS') => {
    await savePrefs({ tipoSelecionado: novoTipo });
    setPrefs(prev => ({ ...prev, tipoSelecionado: novoTipo }));
  };

  const handleLimparPrefs = () => {
    Alert.alert(
      'Limpar tudo',
      'Tem certeza que deseja limpar todas as preferências e voltar ao setup?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim, limpar', style: 'destructive', onPress: async () => await clearPrefs() }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação</Text>
          <Text style={styles.label}>Nome do Lançador</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome"
            placeholderTextColor="#8E8E93"
          />
          <TouchableOpacity style={styles.button} onPress={handleSalvarNome}>
            <Text style={styles.buttonText}>Salvar Nome</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modo de Operação</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.typeBtn, prefs.tipoSelecionado === 'IRMAOS' && styles.typeBtnActive]}
              onPress={() => handleTrocarTipo('IRMAOS')}
            >
              <Text style={[styles.typeBtnText, prefs.tipoSelecionado === 'IRMAOS' && styles.typeBtnTextActive]}>Irmãos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, prefs.tipoSelecionado === 'IRMAS' && styles.typeBtnActive]}
              onPress={() => handleTrocarTipo('IRMAS')}
            >
              <Text style={[styles.typeBtnText, prefs.tipoSelecionado === 'IRMAS' && styles.typeBtnTextActive]}>Irmãs</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Infraestrutura</Text>
          <Text style={styles.label}>Endpoint da API</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText} numberOfLines={1}>{api.defaults.baseURL}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.dangerButton} onPress={handleLimparPrefs}>
          <Text style={styles.dangerButtonText}>Limpar Preferências Locais</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>LançaEnsaio Unificado v2.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  content: { padding: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { color: '#34C759', fontSize: 18, fontWeight: '900', marginBottom: 16, textTransform: 'uppercase' },
  label: { color: '#E5E7EB', fontWeight: '700', marginBottom: 8, fontSize: 14 },
  input: {
    backgroundColor: '#232732',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  button: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  row: { flexDirection: 'row', gap: 12 },
  typeBtn: {
    flex: 1,
    backgroundColor: '#232732',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeBtnActive: { borderColor: '#34C759', backgroundColor: 'rgba(52,199,89,0.1)' },
  typeBtnText: { color: '#FFFFFF', fontWeight: '700' },
  typeBtnTextActive: { color: '#34C759', fontWeight: '900' },
  infoBox: { backgroundColor: '#232732', borderRadius: 12, padding: 16, opacity: 0.8 },
  infoText: { color: '#9CA3AF', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  dangerButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF453A',
    alignItems: 'center',
  },
  dangerButtonText: { color: '#FF453A', fontWeight: '800' },
  footer: { textAlign: 'center', color: '#4B5563', marginTop: 40, fontSize: 12 },
});

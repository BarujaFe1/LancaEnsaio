// mobile/app/(tabs)/index.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../src/api';
import { getPrefs } from '../../src/session';

type ConfigData = {
  instrumentos: Record<string, string[]>;
  cidades: string[];
  ministerios: string[];
  cargosMusicais: string[];
};

export default function LaunchScreen() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prefs, setPrefs] = useState<{ nomeLancador: string; tipoSelecionado: string | null }>({
    nomeLancador: '',
    tipoSelecionado: null,
  });

  // Form State
  const [cidade, setCidade] = useState('');
  const [categoria, setCategoria] = useState('');
  const [instrumento, setInstrumento] = useState('');
  const [ministerio, setMinisterio] = useState('');
  const [musicaCargo, setMusicaCargo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [ultimoId, setUltimoId] = useState<string | null>(null);

  const carregarTudo = async () => {
    try {
      const p = await getPrefs();
      setPrefs(p);

      const res = await api.get('/config');
      setConfig(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível carregar as configurações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const handleLancar = async () => {
    if (!cidade) {
      Alert.alert('Atenção', 'Selecione a cidade.');
      return;
    }

    setEnviando(true);
    try {
      const payload = {
        tipo: prefs.tipoSelecionado,
        nomeLancador: prefs.nomeLancador,
        cidade,
        categoria,
        instrumento,
        ministerio,
        musicaCargo,
      };

      const res = await api.post('/registros', payload);
      const id = res.data?.idGerado || 'SUCESSO';
      setUltimoId(id);
      
      Alert.alert('Sucesso!', `Registro enviado. ID: ${id}`);
      
      // Limpar campos secundários mas manter cidade por conveniência
      setCategoria('');
      setInstrumento('');
      setMinisterio('');
      setMusicaCargo('');
    } catch (err: any) {
      const msg = err?.response?.data?.erro || err?.message || 'Falha ao enviar registro.';
      Alert.alert('Erro', msg);
    } finally {
      setEnviando(false);
    }
  };

  const instrumentosFiltrados = useMemo(() => {
    if (!config || !categoria) return [];
    return config.instrumentos[categoria] || [];
  }, [config, categoria]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Carregando cérebro...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={carregarTudo} tintColor="#34C759" />}
      >
        <View style={styles.header}>
          <Text style={styles.welcome}>Olá, {prefs.nomeLancador}</Text>
          <Text style={styles.modeIndicator}>
            Modo: <Text style={styles.modeText}>{prefs.tipoSelecionado === 'IRMAS' ? 'IRMÃS' : 'IRMÃOS'}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Cidade</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={cidade}
              onValueChange={setCidade}
              style={styles.picker}
              dropdownIconColor="#34C759"
            >
              <Picker.Item label="Selecione uma cidade..." value="" color="#8E8E93" />
              {(config?.cidades || []).map((c) => (
                <Picker.Item key={c} label={c} value={c} color="#FFFFFF" />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={categoria}
              onValueChange={(val) => {
                setCategoria(val);
                setInstrumento('');
              }}
              style={styles.picker}
              dropdownIconColor="#34C759"
            >
              <Picker.Item label="Nenhuma (Canto)" value="" color="#8E8E93" />
              {Object.keys(config?.instrumentos || {}).map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} color="#FFFFFF" />
              ))}
            </Picker>
          </View>

          {categoria ? (
            <>
              <Text style={styles.label}>Instrumento</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={instrumento}
                  onValueChange={setInstrumento}
                  style={styles.picker}
                  dropdownIconColor="#34C759"
                >
                  <Picker.Item label="Selecione..." value="" color="#8E8E93" />
                  {instrumentosFiltrados.map((inst) => (
                    <Picker.Item key={inst} label={inst} value={inst} color="#FFFFFF" />
                  ))}
                </Picker>
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Ministério (Se houver)</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={ministerio}
              onValueChange={setMinisterio}
              style={styles.picker}
              dropdownIconColor="#34C759"
            >
              <Picker.Item label="Nenhum" value="" color="#8E8E93" />
              {(config?.ministerios || []).map((m) => (
                <Picker.Item key={m} label={m} value={m} color="#FFFFFF" />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Cargo / Função Musical</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={musicaCargo}
              onValueChange={setMusicaCargo}
              style={styles.picker}
              dropdownIconColor="#34C759"
            >
              <Picker.Item label="Selecione..." value="" color="#8E8E93" />
              {(config?.cargosMusicais || []).map((m) => (
                <Picker.Item key={m} label={m} value={m} color="#FFFFFF" />
              ))}
            </Picker>
          </View>

          <TouchableOpacity
            style={[styles.launchBtn, enviando && styles.btnDisabled]}
            onPress={handleLancar}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.launchBtnText}>LANÇAR AGORA</Text>
            )}
          </TouchableOpacity>

          {ultimoId && (
            <View style={styles.receipt}>
              <Text style={styles.receiptText}>Último ID: <Text style={styles.receiptId}>{ultimoId}</Text></Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1115' },
  loadingText: { color: '#9CA3AF', marginTop: 12, fontWeight: '600' },
  header: { marginBottom: 32 },
  welcome: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  modeIndicator: { color: '#9CA3AF', fontSize: 14, marginTop: 4 },
  modeText: { color: '#34C759', fontWeight: '800' },
  form: { gap: 16 },
  label: { color: '#E5E7EB', fontWeight: '700', fontSize: 14, marginBottom: -8 },
  pickerContainer: {
    backgroundColor: '#232732',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  picker: { color: '#FFFFFF', height: 55 },
  launchBtn: {
    backgroundColor: '#34C759',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  launchBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  receipt: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.2)',
  },
  receiptText: { color: '#FFFFFF', fontSize: 14 },
  receiptId: { color: '#34C759', fontWeight: '900' },
});

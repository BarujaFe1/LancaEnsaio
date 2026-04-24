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
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../src/api';
import { getPrefs, savePrefs } from '../../src/session';

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
  const [modoAlerta, setModoAlerta] = useState(false);
  const [textoAlerta, setTextoAlerta] = useState('');

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

  const handleTrocarTipo = async (novoTipo: 'IRMAOS' | 'IRMAS') => {
    await savePrefs({ tipoSelecionado: novoTipo });
    setPrefs(prev => ({ ...prev, tipoSelecionado: novoTipo }));
    // Limpar campos ao trocar
    setCategoria('');
    setInstrumento('');
    setMinisterio('');
    setMusicaCargo('');
  };

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
      
      Alert.alert('✓ Lançamento Registrado', `ID: ${id}`, [{ text: 'OK' }]);
      
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

  const handleAlertar = async () => {
    if (!ultimoId) {
      Alert.alert('Atenção', 'Nenhum lançamento recente para alertar.');
      return;
    }

    if (!textoAlerta.trim()) {
      Alert.alert('Atenção', 'Digite o texto do alerta.');
      return;
    }

    setEnviando(true);
    try {
      await api.post('/registros/alerta', {
        id: ultimoId,
        aviso: textoAlerta.trim(),
        nomeLancador: prefs.nomeLancador,
      });

      Alert.alert('✓ Alerta Adicionado', `Registro ${ultimoId} atualizado.`);
      setTextoAlerta('');
      setModoAlerta(false);
    } catch (err: any) {
      const msg = err?.response?.data?.erro || err?.message || 'Falha ao enviar alerta.';
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
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const isIrmaos = prefs.tipoSelecionado === 'IRMAOS';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={carregarTudo} tintColor="#34C759" />}
      >
        {/* Header Premium */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Olá,</Text>
              <Text style={styles.userName}>{prefs.nomeLancador}</Text>
            </View>
            {ultimoId && (
              <View style={styles.lastIdBadge}>
                <Text style={styles.lastIdLabel}>Último ID</Text>
                <Text style={styles.lastIdValue}>{ultimoId}</Text>
              </View>
            )}
          </View>

          {/* Seletor de Modo Premium */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, isIrmaos && styles.modeButtonActive]}
              onPress={() => handleTrocarTipo('IRMAOS')}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeButtonText, isIrmaos && styles.modeButtonTextActive]}>
                Irmãos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, !isIrmaos && styles.modeButtonActive]}
              onPress={() => handleTrocarTipo('IRMAS')}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeButtonText, !isIrmaos && styles.modeButtonTextActive]}>
                Irmãs
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!modoAlerta ? (
          <>
            {/* Formulário de Lançamento */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Novo Lançamento</Text>

              {/* Cidade */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Cidade *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={cidade}
                    onValueChange={setCidade}
                    style={styles.picker}
                    dropdownIconColor="#34C759"
                  >
                    <Picker.Item label="Selecione a cidade..." value="" />
                    {(config?.cidades || []).map((c) => (
                      <Picker.Item key={c} label={c} value={c} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Campos específicos para IRMÃOS */}
              {isIrmaos && (
                <>
                  <View style={styles.fieldGroup}>
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
                        <Picker.Item label="Nenhuma (Canto)" value="" />
                        {Object.keys(config?.instrumentos || {}).map((cat) => (
                          <Picker.Item key={cat} label={cat} value={cat} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  {categoria && (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Instrumento</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={instrumento}
                          onValueChange={setInstrumento}
                          style={styles.picker}
                          dropdownIconColor="#34C759"
                        >
                          <Picker.Item label="Selecione..." value="" />
                          {instrumentosFiltrados.map((inst) => (
                            <Picker.Item key={inst} label={inst} value={inst} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* Ministério */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Ministério</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={ministerio}
                    onValueChange={setMinisterio}
                    style={styles.picker}
                    dropdownIconColor="#34C759"
                  >
                    <Picker.Item label="Nenhum" value="" />
                    {(config?.ministerios || []).map((m) => (
                      <Picker.Item key={m} label={m} value={m} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Música/Cargo */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Música / Cargo</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={musicaCargo}
                    onValueChange={setMusicaCargo}
                    style={styles.picker}
                    dropdownIconColor="#34C759"
                  >
                    <Picker.Item label="Nenhum" value="" />
                    {(config?.cargosMusicais || []).map((cargo) => (
                      <Picker.Item key={cargo} label={cargo} value={cargo} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Botão Principal */}
              <TouchableOpacity
                style={[styles.primaryButton, enviando && styles.primaryButtonDisabled]}
                onPress={handleLancar}
                disabled={enviando}
                activeOpacity={0.8}
              >
                {enviando ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Lançar Agora</Text>
                    <Text style={styles.primaryButtonIcon}>→</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Botão de Alerta */}
            {ultimoId && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setModoAlerta(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>⚠ Adicionar Alerta ao ID {ultimoId}</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            {/* Modo Alerta */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Adicionar Alerta</Text>
              <Text style={styles.cardSubtitle}>Registro: {ultimoId}</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Texto do Alerta *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Digite o alerta..."
                  placeholderTextColor="#6B7280"
                  value={textoAlerta}
                  onChangeText={setTextoAlerta}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, enviando && styles.primaryButtonDisabled]}
                onPress={handleAlertar}
                disabled={enviando}
                activeOpacity={0.8}
              >
                {enviando ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Enviar Alerta</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModoAlerta(false);
                  setTextoAlerta('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B0E',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0B0E',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },

  // Header Premium
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  lastIdBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  lastIdLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  lastIdValue: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '900',
  },

  // Seletor de Modo Premium
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1A1D25',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modeButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },

  // Card
  card: {
    backgroundColor: '#1A1D25',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },

  // Form Fields
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerContainer: {
    backgroundColor: '#0F1115',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
    overflow: 'hidden',
  },
  picker: {
    color: '#FFFFFF',
    height: 50,
  },
  textInput: {
    backgroundColor: '#0F1115',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
    padding: 16,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#34C759',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  primaryButtonIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  secondaryButtonText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
});

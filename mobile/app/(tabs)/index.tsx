// mobile/app/(tabs)/index.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
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
import {
  getConfig,
  enviarRegistro,
  enviarAlerta,
  gerarIdRegistro,
  type ConfigData,
  type Comprovante,
} from '../../src/backend';
import { AppPicker } from '../../src/components/AppPicker';
import { getPrefs, savePrefs, type UserPrefs } from '../../src/session';
import { notify } from '../../src/utils/notify';

export default function LaunchScreen() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs>({
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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'sincronizando' | 'salvo' | 'erro'>('idle');
  const [ultimoId, setUltimoId] = useState<string | null>(null);
  const [ultimoComprovante, setUltimoComprovante] = useState<Comprovante | null>(null);
  const [modoAlerta, setModoAlerta] = useState(false);
  const [textoAlerta, setTextoAlerta] = useState('');

  const carregarTudo = async (forcarAtualizacao = false) => {
    try {
      const p = await getPrefs();
      setPrefs(p);

      const cfg = await getConfig(forcarAtualizacao);
      setConfig(cfg);
    } catch (err) {
      console.error(err);
      notify('Erro', 'Não foi possível carregar as configurações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarTudo(false);
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

  const handleLancar = () => {
    if (!cidade) {
      notify('Atenção', 'Selecione a cidade antes de lançar.');
      return;
    }

    const isIrmaos = prefs.tipoSelecionado === 'IRMAOS';
    const cargoFinal = !isIrmaos
      ? (musicaCargo || 'Cantora')
      : (categoria || instrumento || ministerio || musicaCargo)
        ? (musicaCargo || '-')
        : 'Cantor';

    // 1. Gera ID único instantâneo (0ms)
    const novoId = gerarIdRegistro(prefs.tipoSelecionado, prefs.nomeLancador);
    const agora = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const comprovanteOtimista: Comprovante = {
      id: novoId,
      horario: agora,
      cidade,
      instrumento: instrumento || '-',
      ministerio: ministerio || '-',
      musica: cargoFinal,
      auditoria: `Lançado por ${prefs.nomeLancador || 'Lançador'} • Sincronizando...`,
    };

    // 2. Resposta IMEDIATA para o operador nunca esperar em fila
    setUltimoId(novoId);
    setUltimoComprovante(comprovanteOtimista);
    setSyncStatus('sincronizando');

    // 3. Captura dados para o payload e limpa campos secundários imediatamente
    const payload = {
      id: novoId,
      tipo: prefs.tipoSelecionado,
      nomeLancador: prefs.nomeLancador,
      cidade,
      categoria,
      instrumento,
      ministerio,
      musicaCargo,
    };

    setCategoria('');
    setInstrumento('');
    setMinisterio('');
    setMusicaCargo('');

    // 4. Grava na planilha do Google Sheets em segundo plano
    enviarRegistro(payload)
      .then((res) => {
        setSyncStatus('salvo');
        if (res?.idGerado) {
          setUltimoId(res.idGerado);
        }
        if (res?.comprovante) {
          setUltimoComprovante(res.comprovante);
        } else {
          setUltimoComprovante((prev) =>
            prev
              ? {
                  ...prev,
                  auditoria: `Lançado por ${prefs.nomeLancador || 'Lançador'} • Gravado na Planilha`,
                }
              : null
          );
        }
      })
      .catch((err) => {
        console.error('Erro de background ao salvar registro:', err);
        setSyncStatus('erro');
        notify(
          'Aviso de Conexão',
          'O registro foi anotado, mas a planilha demorou a responder. Ele será reenviado assim que restabelecer.'
        );
      });
  };

  const handleAlertar = async () => {
    if (!ultimoId) {
      notify('Atenção', 'Nenhum lançamento recente para alertar.');
      return;
    }

    if (!textoAlerta.trim()) {
      notify('Atenção', 'Digite o texto do alerta.');
      return;
    }

    setEnviando(true);
    try {
      await enviarAlerta({
        id: ultimoId,
        aviso: textoAlerta.trim(),
        nomeLancador: prefs.nomeLancador,
      });

      notify('✓ Alerta Adicionado', `Registro ${ultimoId} atualizado com sucesso.`);
      setTextoAlerta('');
      setModoAlerta(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { erro?: string } }; message?: string };
      const msg = axiosErr?.response?.data?.erro || axiosErr?.message || 'Falha ao enviar alerta.';
      notify('Erro', msg);
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>Olá,</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {prefs.nomeLancador || 'Lançador'}
              </Text>
            </View>
            {ultimoId && (
              <View style={styles.lastIdBadge}>
                <Text style={styles.lastIdLabel}>Último ID</Text>
                <Text style={styles.lastIdValue}>{ultimoId}</Text>
                {syncStatus === 'sincronizando' && (
                  <Text style={styles.syncStatusPending}>⏳ Gravando...</Text>
                )}
                {syncStatus === 'salvo' && (
                  <Text style={styles.syncStatusSuccess}>✓ Na Planilha</Text>
                )}
                {syncStatus === 'erro' && (
                  <Text style={styles.syncStatusError}>⚠ Rede instável</Text>
                )}
              </View>
            )}
          </View>

          {/* Seletor de Modo */}
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
                <AppPicker
                  selectedValue={cidade}
                  onValueChange={setCidade}
                  options={[
                    { label: 'Selecione a cidade...', value: '' },
                    ...(config?.cidades || []).map((c) => ({ label: c, value: c })),
                  ]}
                />
              </View>

              {/* Campos específicos para IRMÃOS */}
              {isIrmaos && (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Categoria</Text>
                    <AppPicker
                      selectedValue={categoria}
                      onValueChange={(val) => {
                        setCategoria(val);
                        setInstrumento('');
                      }}
                      options={[
                        { label: 'Nenhuma (Canto)', value: '' },
                        ...Object.keys(config?.instrumentos || {}).map((cat) => ({
                          label: cat,
                          value: cat,
                        })),
                      ]}
                    />
                  </View>

                  {categoria && (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Instrumento</Text>
                      <AppPicker
                        selectedValue={instrumento}
                        onValueChange={setInstrumento}
                        options={[
                          { label: 'Selecione...', value: '' },
                          ...instrumentosFiltrados.map((inst) => ({ label: inst, value: inst })),
                        ]}
                      />
                    </View>
                  )}
                </>
              )}

              {/* Ministério - apenas para IRMÃOS */}
              {isIrmaos && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Ministério</Text>
                  <AppPicker
                    selectedValue={ministerio}
                    onValueChange={setMinisterio}
                    options={[
                      { label: 'Nenhum', value: '' },
                      ...(config?.ministerios || []).map((m) => ({ label: m, value: m })),
                    ]}
                  />
                </View>
              )}

              {/* Música/Cargo */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  {isIrmaos ? 'Música / Cargo' : 'Cargo Musical'}
                </Text>
                <AppPicker
                  selectedValue={musicaCargo}
                  onValueChange={setMusicaCargo}
                  options={[
                    {
                      label: isIrmaos ? 'Nenhum (Cantor)' : 'Nenhum (Cantora)',
                      value: '',
                    },
                    ...(config?.cargosMusicais || []).map((cargo) => ({
                      label: cargo,
                      value: cargo,
                    })),
                  ]}
                />
              </View>

              {/* Botão Principal Instantâneo (sem bloqueio de fila) */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLancar}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Lançar Agora</Text>
                <Text style={styles.primaryButtonIcon}>⚡</Text>
              </TouchableOpacity>
            </View>

            {/* Comprovante do Último Lançamento */}
            {ultimoComprovante && (
              <View style={styles.comprovanteCard}>
                <View style={styles.comprovanteHeader}>
                  <Text style={styles.comprovanteTitle}>📋 Último Lançamento</Text>
                  {syncStatus === 'salvo' && (
                    <View style={styles.statusPillSuccess}>
                      <Text style={styles.statusPillTextSuccess}>✓ Na Planilha</Text>
                    </View>
                  )}
                  {syncStatus === 'sincronizando' && (
                    <View style={styles.statusPillPending}>
                      <Text style={styles.statusPillTextPending}>⏳ Gravando...</Text>
                    </View>
                  )}
                </View>

                <View style={styles.comprovanteContent}>
                  <View style={styles.comprovanteRow}>
                    <Text style={styles.comprovanteLabel}>ID:</Text>
                    <Text style={styles.comprovanteValue}>{ultimoComprovante.id}</Text>
                  </View>
                  <View style={styles.comprovanteRow}>
                    <Text style={styles.comprovanteLabel}>Horário:</Text>
                    <Text style={styles.comprovanteValue}>{ultimoComprovante.horario}</Text>
                  </View>
                  <View style={styles.comprovanteRow}>
                    <Text style={styles.comprovanteLabel}>Cidade:</Text>
                    <Text style={styles.comprovanteValue}>{ultimoComprovante.cidade}</Text>
                  </View>
                  {ultimoComprovante.instrumento && ultimoComprovante.instrumento !== '-' && (
                    <View style={styles.comprovanteRow}>
                      <Text style={styles.comprovanteLabel}>Instrumento:</Text>
                      <Text style={styles.comprovanteValue}>{ultimoComprovante.instrumento}</Text>
                    </View>
                  )}
                  {ultimoComprovante.ministerio && ultimoComprovante.ministerio !== '-' && (
                    <View style={styles.comprovanteRow}>
                      <Text style={styles.comprovanteLabel}>Ministério:</Text>
                      <Text style={styles.comprovanteValue}>{ultimoComprovante.ministerio}</Text>
                    </View>
                  )}
                  <View style={styles.comprovanteRow}>
                    <Text style={styles.comprovanteLabel}>Cargo:</Text>
                    <Text style={styles.comprovanteValue}>{ultimoComprovante.musica}</Text>
                  </View>
                  {ultimoComprovante.auditoria && (
                    <View style={styles.comprovanteAuditoria}>
                      <Text style={styles.comprovanteAuditoriaText}>{ultimoComprovante.auditoria}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

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
                  <ActivityIndicator color="#0F1115" size="small" />
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
    backgroundColor: '#0F1115',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1115',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },

  // Header
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  greetingBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  greeting: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  lastIdBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  lastIdLabel: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  lastIdValue: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '900',
  },
  syncStatusPending: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  syncStatusSuccess: {
    color: '#34C759',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  syncStatusError: {
    color: '#FF453A',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  // Seletor de Modo
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#161922',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#0F1115',
    fontWeight: '900',
  },

  // Card
  card: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  cardSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
  },

  // Form Fields
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#0F1115',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
    padding: 14,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#34C759',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#0F1115',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  primaryButtonIcon: {
    color: '#0F1115',
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#FF9500',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Comprovante
  comprovanteCard: {
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.25)',
  },
  comprovanteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  comprovanteTitle: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPillSuccess: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillTextSuccess: {
    color: '#34C759',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillPending: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillTextPending: {
    color: '#FF9500',
    fontSize: 11,
    fontWeight: '700',
  },
  comprovanteContent: {
    gap: 10,
  },
  comprovanteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comprovanteLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  comprovanteValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  comprovanteAuditoria: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  comprovanteAuditoriaText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});

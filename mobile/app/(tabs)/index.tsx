// mobile/app/(tabs)/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
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
  loadLastComprovante,
  flushOfflineQueue,
  getPendingQueueCount,
  type ConfigData,
  type Comprovante,
} from '../../src/backend';
import { AppPicker } from '../../src/components/AppPicker';
import { StatusBanners } from '../../src/components/StatusBanners';
import { validarAntesDeEnviar } from '../../src/domain/auditoria';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { getPrefs, savePrefs, type UserPrefs } from '../../src/session';
import {
  loadFormDraft,
  loadTravaCidade,
  saveFormDraft,
  saveTravaCidade,
} from '../../src/storage/form-storage';
import { notify } from '../../src/utils/notify';

export default function LaunchScreen() {
  const { isOnline, isDemoMode } = useNetworkStatus();
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs>({
    nomeLancador: '',
    tipoSelecionado: null,
  });

  const [cidade, setCidade] = useState('');
  const [categoria, setCategoria] = useState('');
  const [instrumento, setInstrumento] = useState('');
  const [ministerio, setMinisterio] = useState('');
  const [musicaCargo, setMusicaCargo] = useState('');
  const [travaCidade, setTravaCidade] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [ultimoId, setUltimoId] = useState<string | null>(null);
  const [ultimoComprovante, setUltimoComprovante] = useState<Comprovante | null>(null);
  const [modoAlerta, setModoAlerta] = useState(false);
  const [textoAlerta, setTextoAlerta] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  const carregarTudo = useCallback(async () => {
    setLoadError(null);
    try {
      const [p, cfg, draft, trava, last, pending] = await Promise.all([
        getPrefs(),
        getConfig(),
        loadFormDraft(),
        loadTravaCidade(),
        loadLastComprovante(),
        getPendingQueueCount(),
      ]);

      setPrefs(p);
      setConfig(cfg);
      setTravaCidade(trava);
      setPendingCount(pending);

      if (draft) {
        if (draft.cidade) setCidade(draft.cidade);
        if (draft.categoria) setCategoria(draft.categoria);
        if (draft.instrumento) setInstrumento(draft.instrumento);
        if (draft.ministerio) setMinisterio(draft.ministerio);
        if (draft.musicaCargo) setMusicaCargo(draft.musicaCargo);
      }

      if (last) {
        setUltimoComprovante(last);
        setUltimoId(last.id);
      }

      if (!isDemoMode && isOnline && pending > 0) {
        const result = await flushOfflineQueue();
        setPendingCount(result.remaining);
        if (result.flushed > 0) {
          notify('Fila sincronizada', `${result.flushed} item(ns) enviados à planilha.`);
        }
      }
    } catch (err) {
      console.error(err);
      setLoadError('Não foi possível carregar as configurações.');
      notify('Erro', 'Não foi possível carregar as configurações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDemoMode, isOnline]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  useEffect(() => {
    void saveFormDraft({
      cidade,
      cidadeCustom: '',
      categoria,
      instrumento,
      ministerio,
      musicaCargo,
    });
  }, [cidade, categoria, instrumento, ministerio, musicaCargo]);

  const onRefresh = () => {
    setRefreshing(true);
    void carregarTudo();
  };

  const handleTrocarTipo = async (novoTipo: 'IRMAOS' | 'IRMAS') => {
    await savePrefs({ tipoSelecionado: novoTipo });
    setPrefs((prev) => ({ ...prev, tipoSelecionado: novoTipo }));
    setCategoria('');
    setInstrumento('');
    setMinisterio('');
    setMusicaCargo('');
  };

  const handleTravaCidade = async (value: boolean) => {
    setTravaCidade(value);
    await saveTravaCidade(value);
  };

  const handleLancar = async () => {
    if (!prefs.tipoSelecionado) {
      notify('Atenção', 'Selecione o modo Irmãos ou Irmãs.');
      return;
    }

    const validacao = validarAntesDeEnviar({
      tipo: prefs.tipoSelecionado,
      cidade,
      categoria,
      instrumento,
      ministerio,
      musicaCargo,
    });
    if (validacao) {
      notify('Atenção', validacao);
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

      const { idGerado: id, comprovante, queued } = await enviarRegistro(payload);
      setUltimoId(id);
      setUltimoComprovante(comprovante);
      setPendingCount(await getPendingQueueCount());

      if (queued) {
        notify('Salvo na fila offline', `Será sincronizado ao reconectar.\nRef: ${id}`);
      } else {
        notify('✓ Lançamento Registrado', `ID: ${id}`);
      }

      setCategoria('');
      setInstrumento('');
      setMinisterio('');
      setMusicaCargo('');
      if (!travaCidade) setCidade('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { erro?: string } }; message?: string };
      const msg = axiosErr?.response?.data?.erro || axiosErr?.message || 'Falha ao enviar registro.';
      notify('Erro', msg);
    } finally {
      setEnviando(false);
    }
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
      const result = await enviarAlerta({
        id: ultimoId,
        aviso: textoAlerta.trim(),
        nomeLancador: prefs.nomeLancador,
      });

      setPendingCount(await getPendingQueueCount());

      if (result.queued) {
        notify('Alerta na fila', 'Será enviado quando houver conexão.');
      } else {
        notify('✓ Alerta Adicionado', `Registro ${ultimoId} atualizado.`);
      }
      setTextoAlerta('');
      setModoAlerta(false);
      if (ultimoComprovante) {
        setUltimoComprovante({ ...ultimoComprovante, alerta: textoAlerta.trim() });
      }
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
      <View style={styles.center} accessibilityLabel="Carregando lançamento">
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (loadError && !config) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Não foi possível carregar</Text>
        <Text style={styles.errorBody}>{loadError}</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            setLoading(true);
            void carregarTudo();
          }}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
        >
          <Text style={styles.primaryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isIrmaos = prefs.tipoSelecionado === 'IRMAOS';
  const semCidades = !config?.cidades?.length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34C759" />
        }
      >
        <StatusBanners
          isDemoMode={isDemoMode}
          isOnline={isOnline}
          pendingCount={pendingCount}
        />

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Olá,</Text>
              <Text style={styles.userName} accessibilityRole="header">
                {prefs.nomeLancador}
              </Text>
            </View>
            {ultimoId && (
              <View style={styles.lastIdBadge} accessibilityLabel={`Último ID ${ultimoId}`}>
                <Text style={styles.lastIdLabel}>Último ID</Text>
                <Text style={styles.lastIdValue}>{ultimoId}</Text>
              </View>
            )}
          </View>

          <View style={styles.modeSelector} accessibilityRole="tablist">
            <TouchableOpacity
              style={[styles.modeButton, isIrmaos && styles.modeButtonActive]}
              onPress={() => handleTrocarTipo('IRMAOS')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isIrmaos }}
              accessibilityLabel="Modo Irmãos"
            >
              <Text style={[styles.modeButtonText, isIrmaos && styles.modeButtonTextActive]}>
                Irmãos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, !isIrmaos && styles.modeButtonActive]}
              onPress={() => handleTrocarTipo('IRMAS')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: !isIrmaos }}
              accessibilityLabel="Modo Irmãs"
            >
              <Text style={[styles.modeButtonText, !isIrmaos && styles.modeButtonTextActive]}>
                Irmãs
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!modoAlerta ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Novo Lançamento</Text>

              {semCidades ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>Nenhuma cidade disponível</Text>
                  <Text style={styles.emptyBody}>
                    Puxe para atualizar ou verifique a conexão com a API.
                  </Text>
                </View>
              ) : (
                <>
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

                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchLabel}>Manter cidade após lançar</Text>
                      <Text style={styles.switchHint}>Útil em sequência no mesmo local</Text>
                    </View>
                    <Switch
                      value={travaCidade}
                      onValueChange={handleTravaCidade}
                      trackColor={{ false: '#374151', true: 'rgba(52,199,89,0.5)' }}
                      thumbColor={travaCidade ? '#34C759' : '#9CA3AF'}
                      accessibilityLabel="Manter cidade após lançar"
                    />
                  </View>

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

                      {categoria ? (
                        <View style={styles.fieldGroup}>
                          <Text style={styles.label}>Instrumento</Text>
                          <AppPicker
                            selectedValue={instrumento}
                            onValueChange={setInstrumento}
                            options={[
                              { label: 'Selecione...', value: '' },
                              ...instrumentosFiltrados.map((inst) => ({
                                label: inst,
                                value: inst,
                              })),
                            ]}
                          />
                        </View>
                      ) : null}
                    </>
                  )}

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

                  <TouchableOpacity
                    style={[styles.primaryButton, enviando && styles.primaryButtonDisabled]}
                    onPress={handleLancar}
                    disabled={enviando}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Lançar ensaio agora"
                    accessibilityState={{ disabled: enviando }}
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
                </>
              )}
            </View>

            {ultimoComprovante && (
              <View
                style={styles.comprovanteCard}
                accessibilityLabel={`Comprovante ${ultimoComprovante.id}`}
              >
                <Text style={styles.comprovanteTitle}>Último Lançamento</Text>
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
                  {ultimoComprovante.auditoria ? (
                    <View style={styles.comprovanteAuditoria}>
                      <Text style={styles.comprovanteAuditoriaText}>
                        {ultimoComprovante.auditoria}
                      </Text>
                    </View>
                  ) : null}
                  {ultimoComprovante.alerta ? (
                    <View style={styles.alertaBox}>
                      <Text style={styles.alertaText}>Alerta: {ultimoComprovante.alerta}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            {ultimoId && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setModoAlerta(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Adicionar alerta ao ID ${ultimoId}`}
              >
                <Text style={styles.secondaryButtonText}>
                  Adicionar Alerta ao ID {ultimoId}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Adicionar Alerta</Text>
            <Text style={styles.cardSubtitle}>Registro: {ultimoId}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Texto do Alerta *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex.: corrigir instrumento / cidade"
                placeholderTextColor="#6B7280"
                value={textoAlerta}
                onChangeText={setTextoAlerta}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accessibilityLabel="Texto do alerta"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, enviando && styles.primaryButtonDisabled]}
              onPress={handleAlertar}
              disabled={enviando}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Enviar alerta"
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
              accessibilityRole="button"
              accessibilityLabel="Cancelar alerta"
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
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
    padding: 24,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorBody: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
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
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1A1D25',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#34C759',
  },
  modeButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingVertical: 4,
  },
  switchLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '700',
  },
  switchHint: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
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
  primaryButton: {
    backgroundColor: '#34C759',
    borderRadius: 14,
    minHeight: 52,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    minHeight: 48,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 48,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 8,
  },
  emptyBody: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 14,
  },
  comprovanteCard: {
    backgroundColor: '#1A1D25',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  comprovanteTitle: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comprovanteContent: {
    gap: 12,
  },
  comprovanteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comprovanteLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  comprovanteValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  comprovanteAuditoria: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  comprovanteAuditoriaText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  alertaBox: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    padding: 10,
    borderRadius: 10,
  },
  alertaText: {
    color: '#FF9500',
    fontSize: 13,
    fontWeight: '600',
  },
});

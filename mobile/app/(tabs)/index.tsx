// mobile/app/(tabs)/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { clearToken } from '../../src/session';

type ConfigData = {
  instrumentos: Record<string, string[]>;
  cidades: string[];
  ministerios: string[];
  cargosMusicais: string[];
};

type Comprovante = {
  id: string;
  horario: string;
  cidade: string;
  instrumento: string;
  ministerio: string;
  musica: string;
  auditoria?: string;
  origem?: 'online' | 'fila';
};

type OfflineQueueItem = {
  idLocal: string;
  payload: any;
  criadoEm: number;
};

type CitySection = {
  title: string;
  items: string[];
};

const STORAGE_KEYS = {
  CONFIG_CACHE: '@orquestra/config_cache_v3',
  CONFIG_CACHE_TS: '@orquestra/config_cache_ts_v3',
  OFFLINE_QUEUE: '@orquestra/offline_queue_v1',
  ULTIMO_LANCAMENTO: '@orquestra/ultimo_lancamento_v1',
};

const CIDADES_PROXIMAS_FIXAS = [
  'Cravinhos',
  'Sertãozinho',
  'Serrana',
  'Dumont',
  'Jardinópolis',
  'Brodowski',
  'Guatapará',
  'Pontal',
  'Batatais',
  'Bonfim Paulista (Distrito)',
];

const ORDEM_CATEGORIAS = ['Cordas', 'Metais', 'Madeiras', 'Teclas'];

const normalizeText = (value: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const uniqueClean = (arr: string[] = []) =>
  Array.from(
    new Set(
      arr
        .map((v) => (v ?? '').toString().trim())
        .filter((v) => v && v !== '-')
    )
  );

const sortPt = (arr: string[]) => [...arr].sort((a, b) => a.localeCompare(b, 'pt-BR'));

const isRibeiraoOuBairro = (cidade: string) => {
  const n = normalizeText(cidade);
  if (n === 'ribeirao preto') return true;
  if (n.startsWith('ribeirao -')) return true;
  if (n.startsWith('ribeirao')) return true;
  return false;
};

const montarSecoesCidades = (cidadesOriginais: string[], buscaTexto: string): CitySection[] => {
  const cidades = uniqueClean(cidadesOriginais);
  const busca = normalizeText(buscaTexto);

  const filtradas = !busca ? cidades : cidades.filter((c) => normalizeText(c).includes(busca));

  const ribeiraoEBairros = sortPt(filtradas.filter(isRibeiraoOuBairro));

  const mapaFiltradas = new Map(filtradas.map((c) => [normalizeText(c), c]));
  const proximas10 = CIDADES_PROXIMAS_FIXAS.map((c) => mapaFiltradas.get(normalizeText(c))).filter(
    Boolean
  ) as string[];

  const usadas = new Set([...ribeiraoEBairros, ...proximas10].map((c) => normalizeText(c)));

  const demais = sortPt(filtradas.filter((c) => !usadas.has(normalizeText(c))));

  return [
    { title: 'Ribeirão Preto e bairros', items: ribeiraoEBairros },
    { title: '10 cidades mais próximas', items: proximas10 },
    { title: 'Demais cidades', items: demais },
  ];
};

const formatCategoriaLabel = (cat: string) => {
  if (!cat) return '';
  const lower = cat.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const findCategoriaKey = (instrumentos: Record<string, string[]> | undefined, categoriaSelecionada: string) => {
  if (!instrumentos || !categoriaSelecionada) return '';
  const alvo = normalizeText(categoriaSelecionada);

  const chaveExata = Object.keys(instrumentos).find((k) => normalizeText(k) === alvo);
  if (chaveExata) return chaveExata;

  const formatada = formatCategoriaLabel(categoriaSelecionada);
  return Object.keys(instrumentos).find((k) => k === formatada) || '';
};

const isLikelyNetworkError = (err: any) => {
  if (!err) return false;
  const message = String(err?.message || '').toLowerCase();
  const hasResponse = !!err?.response;
  if (!hasResponse) return true;
  if (message.includes('network error') || message.includes('timeout')) return true;
  return false;
};

const SectionCard = ({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
    {children}
  </View>
);

const OptionTile = ({
  label,
  selected,
  onPress,
  compact = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={[styles.tile, compact && styles.tileCompact, selected && styles.tileSelected]}
    onPress={onPress}
  >
    <View style={[styles.tileCheck, selected && styles.tileCheckSelected]}>
      {selected ? <Text style={styles.tileCheckMark}>✓</Text> : null}
    </View>
    <Text numberOfLines={2} style={[styles.tileLabel, selected && styles.tileLabelSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

function CitySelectModal({
  visible,
  onClose,
  secoes,
  busca,
  setBusca,
  onSelect,
  selected,
}: {
  visible: boolean;
  onClose: () => void;
  secoes: CitySection[];
  busca: string;
  setBusca: (v: string) => void;
  onSelect: (cidade: string) => void;
  selected: string;
}) {
  // monta uma lista “achatada” para o FlatList (com headers)
  const data = useMemo(() => {
    const out: Array<{ type: 'header' | 'item'; key: string; label: string; value?: string }> = [];
    secoes.forEach((sec, idx) => {
      if (!sec.items.length) return;
      out.push({
        type: 'header',
        key: `h_${idx}_${sec.title}`,
        label: sec.title,
      });
      sec.items.forEach((c) => {
        out.push({
          type: 'item',
          key: `i_${sec.title}_${c}`,
          label: c,
          value: c,
        });
      });
    });
    return out;
  }, [secoes]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar cidade</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.modalClose}>Fechar</Text>
            </Pressable>
          </View>

          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Pesquisar na lista..."
            placeholderTextColor="#8E8E93"
            style={styles.modalSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />

          <FlatList
            data={data}
            keyExtractor={(i) => i.key}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return <Text style={styles.modalSectionHeader}>— {item.label} —</Text>;
              }

              const isSel = item.value === selected;
              return (
                <Pressable
                  onPress={() => item.value && onSelect(item.value)}
                  style={[styles.modalItem, isSel && styles.modalItemSelected]}
                >
                  <Text style={[styles.modalItemText, isSel && styles.modalItemTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function AlertNoteModal({
  visible,
  onClose,
  texto,
  setTexto,
  onSubmit,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  texto: string;
  setTexto: (t: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.alertSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Alertar lançamento</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.modalClose}>Fechar</Text>
            </Pressable>
          </View>

          <Text style={styles.alertHint}>
            Escreva um aviso curto sobre o que você percebeu de errado. Isso será salvo na coluna H.
          </Text>

          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Ex.: Cidade errada / Instrumento errado / etc."
            placeholderTextColor="#8E8E93"
            style={styles.alertInput}
            autoCorrect={false}
            multiline
          />

          <View style={styles.alertActions}>
            <TouchableOpacity activeOpacity={0.85} style={styles.secondaryButton} onPress={onClose} disabled={loading}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.warningButton, loading && styles.actionButtonDisabled]}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.warningButtonText}>Enviar alerta</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [erroConfig, setErroConfig] = useState<string>('');

  // formulário
  const [cidade, setCidade] = useState('');
  const [cidadeBusca, setCidadeBusca] = useState('');
  const [cidadeCustom, setCidadeCustom] = useState('');
  const [categoria, setCategoria] = useState('');
  const [instrumento, setInstrumento] = useState('');
  const [ministerio, setMinisterio] = useState('');
  const [musicaCargo, setMusicaCargo] = useState('');
  const [travaCidade, setTravaCidade] = useState(false);

  // estados funcionais
  const [salvando, setSalvando] = useState(false);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // comprovante
  const [ultimoLancamento, setUltimoLancamento] = useState<Comprovante | null>(null);

  // alerta manual (coluna H)
  const [alertaModalOpen, setAlertaModalOpen] = useState(false);
  const [alertaTexto, setAlertaTexto] = useState('');
  const [enviandoAlerta, setEnviandoAlerta] = useState(false);

  // modal cidades
  const [cidadeModalOpen, setCidadeModalOpen] = useState(false);

  const normalizarConfig = useCallback((raw: any): ConfigData => {
    const instrumentosRaw = raw?.instrumentos || {};
    const instrumentosNormalizados: Record<string, string[]> = {};

    Object.keys(instrumentosRaw).forEach((key) => {
      instrumentosNormalizados[formatCategoriaLabel(key)] = uniqueClean(instrumentosRaw[key] || []);
    });

    const cargosMusicais = uniqueClean(raw?.cargosMusicais || raw?.musicaCargos || []);

    return {
      instrumentos: instrumentosNormalizados,
      cidades: uniqueClean(raw?.cidades || []),
      ministerios: uniqueClean(raw?.ministerios || []).filter((m) => m !== '-'),
      cargosMusicais: cargosMusicais.filter((m) => m !== '-'),
    };
  }, []);

  const readOfflineQueue = useCallback(async (): Promise<OfflineQueueItem[]> => {
    try {
      const str = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (!str) return [];
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const writeOfflineQueue = useCallback(async (items: OfflineQueueItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(items));
    setQueueCount(items.length);
  }, []);

  const salvarUltimoLancamentoLocal = useCallback(async (comp: Comprovante) => {
    setUltimoLancamento(comp);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ULTIMO_LANCAMENTO, JSON.stringify(comp));
    } catch {}
  }, []);
const abrirModalAlerta = useCallback(() => {
  if (!ultimoLancamento?.id) {
    Alert.alert('Sem lançamento', 'Faça um lançamento antes de usar o alerta.');
    return;
  }
  setAlertaTexto('');
  setAlertaModalOpen(true);
}, [ultimoLancamento?.id]);

const enviarAlerta = useCallback(async () => {
  const id = ultimoLancamento?.id;
  const aviso = alertaTexto.trim();

  if (!id) {
    Alert.alert('Sem lançamento', 'Faça um lançamento antes de usar o alerta.');
    return;
  }
  if (!aviso) {
    Alert.alert('Atenção', 'Digite um aviso antes de enviar.');
    return;
  }

  setEnviandoAlerta(true);
  try {
    await api.post('/registros/alerta', { id, aviso });

    setUltimoLancamento((prev) => {
      if (!prev) return prev;
      const atual = prev.auditoria ? String(prev.auditoria) : '';
      const novo = atual ? `${atual} | ALERTA: ${aviso}` : `ALERTA: ${aviso}`;
      const upd = { ...prev, auditoria: novo, origem: prev.origem || 'online' };
      try {
        AsyncStorage.setItem(STORAGE_KEYS.ULTIMO_LANCAMENTO, JSON.stringify(upd));
      } catch {}
      return upd;
    });

    Alert.alert('Ok', 'Alerta registrado na planilha.');
    setAlertaModalOpen(false);
  } catch (err: any) {
    const msg = err?.response?.data?.erro || err?.message || 'Falha ao enviar alerta.';
    Alert.alert('Erro', String(msg));
  } finally {
    setEnviandoAlerta(false);
  }
}, [alertaTexto, ultimoLancamento?.id]);


  const limparFormulario = useCallback(() => {
    if (!travaCidade) setCidade('');
    setCategoria('');
    setInstrumento('');
    setMinisterio('');
    setMusicaCargo('');
    setCidadeCustom('');
  }, [travaCidade]);

  const carregarCacheLocal = useCallback(async () => {
    try {
      const [cfg, ultimo, fila] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CONFIG_CACHE),
        AsyncStorage.getItem(STORAGE_KEYS.ULTIMO_LANCAMENTO),
        AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE),
      ]);

      if (cfg) setConfig(normalizarConfig(JSON.parse(cfg)));
      if (ultimo) setUltimoLancamento(JSON.parse(ultimo));
      if (fila) {
        const parsedFila = JSON.parse(fila);
        setQueueCount(Array.isArray(parsedFila) ? parsedFila.length : 0);
      }
    } catch {}
  }, [normalizarConfig]);

  const logoutForcado = useCallback(async () => {
    await clearToken();
    setConfig(null);
    router.replace('/login');
  }, [router]);

  const buscarConfigRemoto = useCallback(
    async function buscarConfigRemoto(opts?: { silent?: boolean; retry401?: boolean }) {
      const silent = !!opts?.silent;
      if (!silent) setLoadingConfig(true);

      try {
        setErroConfig('');
        const resposta = await api.get('/config');
        const payloadNormalizado = normalizarConfig(resposta.data || {});
        setConfig(payloadNormalizado);

        await AsyncStorage.setItem(STORAGE_KEYS.CONFIG_CACHE, JSON.stringify(payloadNormalizado));
        await AsyncStorage.setItem(STORAGE_KEYS.CONFIG_CACHE_TS, String(Date.now()));
      } catch (err: any) {
        const status = err?.response?.status;

        // ✅ Corrida comum após login: primeira leitura do token pode vir vazia.
        // Tentamos 1 retry rápido antes de deslogar.
        if (status === 401 && !opts?.retry401) {
          await new Promise((r) => setTimeout(r, 350));
          return buscarConfigRemoto({ silent, retry401: true });
        }

        if (status === 401) {
          Alert.alert('Sessão expirada', 'Faça login novamente.');
          await logoutForcado();
          return;
        }

        const msg = err?.response?.data?.erro || err?.message || 'Falha ao carregar o Cérebro';
        setErroConfig(String(msg));
        console.log('Erro ao carregar /config:', err?.response?.data || err);
      } finally {
        if (!silent) setLoadingConfig(false);
        setLoading(false);
      }
    },
    [normalizarConfig, logoutForcado]
  );

  const atualizarTudo = useCallback(async () => {
    setRefreshing(true);
    await buscarConfigRemoto({ silent: false });
    setRefreshing(false);
  }, [buscarConfigRemoto]);

  const enfileirarRegistro = useCallback(
    async (payload: any) => {
      const fila = await readOfflineQueue();
      const novo: OfflineQueueItem = {
        idLocal: `fila_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        payload,
        criadoEm: Date.now(),
      };

      const novaFila = [...fila, novo];
      await writeOfflineQueue(novaFila);

      const compFila: Comprovante = {
        id: 'FILA',
        horario: new Date().toLocaleTimeString('pt-BR'),
        cidade: payload.cidade || '-',
        instrumento: payload.instrumento || '-',
        ministerio: payload.ministerio || '-',
        musica: payload.musicaCargo || '-',
        auditoria: 'Registro salvo localmente (fila offline)',
        origem: 'fila',
      };

      await salvarUltimoLancamentoLocal(compFila);
      limparFormulario();

      Alert.alert(
        'Sem internet',
        'Registro salvo na fila offline. Assim que a conexão voltar, ele será enviado automaticamente.'
      );
    },
    [readOfflineQueue, writeOfflineQueue, salvarUltimoLancamentoLocal, limparFormulario]
  );

  const sincronizarFila = useCallback(async () => {
    if (syncingQueue) return;
    if (!isConnected) return;

    const fila = await readOfflineQueue();
    if (!fila.length) {
      setQueueCount(0);
      return;
    }

    setSyncingQueue(true);

    try {
      let pendentes = [...fila];
      let enviados = 0;

      while (pendentes.length > 0) {
        const item = pendentes[0];

        try {
          const res = await api.post('/registros', item.payload);

          const comp: Comprovante =
            res.data?.comprovante || {
              id: res.data?.idGerado || '-',
              horario: new Date().toLocaleTimeString('pt-BR'),
              cidade: item.payload.cidade || '-',
              instrumento: item.payload.instrumento || '-',
              ministerio: item.payload.ministerio || '-',
              musica: res.data?.cargoFinal || item.payload.musicaCargo || '-',
              auditoria: res.data?.statusAuditoria || '',
              origem: 'online',
            };

          await salvarUltimoLancamentoLocal(comp);

          pendentes.shift();
          enviados += 1;
          await writeOfflineQueue(pendentes);
        } catch (err) {
          break;
        }
      }

      if (enviados > 0) {
        Alert.alert(
          'Fila sincronizada',
          `${enviados} registro(s) enviados com sucesso. ${
            pendentes.length ? `Ainda restam ${pendentes.length} na fila.` : ''
          }`
        );
      }
    } finally {
      setSyncingQueue(false);
    }
  }, [isConnected, syncingQueue, readOfflineQueue, writeOfflineQueue, salvarUltimoLancamentoLocal]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      await carregarCacheLocal();
      if (!mounted) return;

      setLoading((prev) => (config ? false : prev));
      await buscarConfigRemoto({ silent: !!config });
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(online);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isConnected) sincronizarFila();
  }, [isConnected, sincronizarFila]);

  const categoriasDisponiveis = useMemo(() => {
    const keys = Object.keys(config?.instrumentos || {});
    const ordenadas = [
      ...ORDEM_CATEGORIAS.filter((k) => keys.includes(k)),
      ...keys.filter((k) => !ORDEM_CATEGORIAS.includes(k)),
    ];
    return ordenadas.filter((k) => (config?.instrumentos?.[k] || []).length > 0);
  }, [config?.instrumentos]);

  const categoriaKey = useMemo(() => findCategoriaKey(config?.instrumentos, categoria), [config?.instrumentos, categoria]);

  const instrumentosDaCategoria = useMemo(() => {
    if (!categoriaKey) return [];
    return uniqueClean(config?.instrumentos?.[categoriaKey] || []);
  }, [config?.instrumentos, categoriaKey]);

  const ministeriosLista = useMemo(() => sortPt(uniqueClean(config?.ministerios || []).filter((m) => m !== '-')), [
    config?.ministerios,
  ]);

  const cargosMusicaisLista = useMemo(() => {
    const base = uniqueClean(config?.cargosMusicais || []).filter((m) => m !== '-');
    if (!base.some((m) => normalizeText(m) === 'cantor')) base.unshift('Cantor');
    return sortPt(base);
  }, [config?.cargosMusicais]);

  const secoesCidades = useMemo(() => montarSecoesCidades(config?.cidades || [], cidadeBusca), [config?.cidades, cidadeBusca]);

  const payloadAtual = useMemo(() => {
    return {
      apontamento: 'App Mobile',
      tipo: 'IRMAOS',
      cidade: cidade || cidadeCustom.trim(),
      categoria: categoria ? categoria.toUpperCase() : '',
      instrumento,
      ministerio,
      musicaCargo,
    };
  }, [cidade, cidadeCustom, categoria, instrumento, ministerio, musicaCargo]);

  const canSave = useMemo(() => {
    const temCidade = !!(cidade || cidadeCustom.trim());
    return temCidade && !salvando;
  }, [cidade, cidadeCustom, salvando]);

  const handleSelecionarCategoria = (cat: string) => {
    setCategoria(cat);
    setInstrumento('');
  };

  const handleSelecionarMinisterio = (valor: string) => {
    const novo = ministerio === valor ? '' : valor;
    setMinisterio(novo);
    if (novo) setMusicaCargo('');
  };

  const handleSelecionarMusica = (valor: string) => {
    const novo = musicaCargo === valor ? '' : valor;
    setMusicaCargo(novo);
    if (novo) setMinisterio('');
    if (normalizeText(novo) === 'cantor') {
      setCategoria('');
      setInstrumento('');
    }
  };

  const aplicarCidadeDigitada = () => {
    const cidadeLivre = cidadeCustom.trim();
    if (!cidadeLivre) return;
    setCidade(cidadeLivre);
    Alert.alert('Cidade definida', `Cidade selecionada: ${cidadeLivre}`);
  };

  const salvarRegistro = async () => {
    const cidadeFinal = (cidade || cidadeCustom.trim()).trim();

    if (!cidadeFinal) {
      Alert.alert('Atenção', 'Você precisa selecionar ou digitar uma cidade.');
      return;
    }

    const payload = { ...payloadAtual, cidade: cidadeFinal };

    setSalvando(true);

    try {
      if (!isConnected) {
        await enfileirarRegistro(payload);
        return;
      }

      const resposta = await api.post('/registros', payload);

      const comp: Comprovante =
        resposta.data?.comprovante || {
          id: resposta.data?.idGerado || '-',
          horario: new Date().toLocaleTimeString('pt-BR'),
          cidade: payload.cidade || '-',
          instrumento: payload.instrumento || '-',
          ministerio: payload.ministerio || '-',
          musica: resposta.data?.cargoFinal || payload.musicaCargo || (payload.instrumento ? '-' : 'Cantor'),
          auditoria: resposta.data?.statusAuditoria || '',
          origem: 'online',
        };

      await salvarUltimoLancamentoLocal(comp);

      let mensagem = `✅ ID: ${comp.id}`;
      if (comp.auditoria) mensagem += `\n\n⚠️ ${comp.auditoria}`;

      Alert.alert('Salvo com sucesso!', mensagem);
      limparFormulario();

      if (queueCount > 0) sincronizarFila();
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 401) {
        Alert.alert('Sessão expirada', 'Faça login novamente.');
        await logoutForcado();
        return;
      }

      if (isLikelyNetworkError(err)) {
        await enfileirarRegistro(payload);
        return;
      }

      const msg = err?.response?.data?.erro || 'Falha ao salvar na planilha.';
      Alert.alert('Erro', String(msg));
    } finally {
      setSalvando(false);
    }
  };

  if (loading && !config) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.centerText}>Carregando orquestra...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <CitySelectModal
        visible={cidadeModalOpen}
        onClose={() => setCidadeModalOpen(false)}
        secoes={secoesCidades}
        busca={cidadeBusca}
        setBusca={setCidadeBusca}
        onSelect={(c) => {
          setCidade(c);
          setCidadeModalOpen(false);
        }}
        selected={cidade}
      />

<AlertNoteModal
  visible={alertaModalOpen}
  onClose={() => setAlertaModalOpen(false)}
  texto={alertaTexto}
  setTexto={setAlertaTexto}
  onSubmit={enviarAlerta}
  loading={enviandoAlerta}
/>


      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={atualizarTudo} />}
      >
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.titulo}>Irmãos</Text>
            <Text style={styles.subtitulo}>Apontamento da orquestra</Text>
          </View>

          {loadingConfig ? (
            <View style={styles.headerBadge}>
              <ActivityIndicator size="small" color="#34C759" />
              <Text style={styles.headerBadgeText}>Atualizando</Text>
            </View>
          ) : null}
        </View>

        {/* STATUS */}
        <SectionCard
          title="Status"
          subtitle="Conectividade, fila offline e sincronização"
          right={
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#34C759' : '#F59E0B' }]} />
          }
        >
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Rede</Text>
            <Text style={[styles.statusValue, { color: isConnected ? '#34C759' : '#F59E0B' }]}>
              {isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Fila offline</Text>
            <Text style={styles.statusValue}>
              {queueCount} registro{queueCount === 1 ? '' : 's'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Sincronização</Text>
            <Text style={styles.statusValue}>{syncingQueue ? 'Em andamento...' : 'Pronta'}</Text>
          </View>

          {!!erroConfig && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>⚠️ {erroConfig}</Text>
              <TouchableOpacity style={styles.warningButton} onPress={() => buscarConfigRemoto()}>
                <Text style={styles.warningButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}
        </SectionCard>

        {/* CIDADE */}
        <SectionCard
          title="Cidade"
          subtitle="Pesquisa dentro da lista + opção de cidade nova"
          right={
            <View style={styles.switchWrap}>
              <Text style={styles.switchText}>Travar</Text>
              <Switch value={travaCidade} onValueChange={setTravaCidade} trackColor={{ true: '#34C759' }} />
            </View>
          }
        >
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.selectBtn}
            onPress={() => setCidadeModalOpen(true)}
          >
            <Text style={styles.selectBtnText}>{cidade ? `📍 ${cidade}` : 'Selecionar cidade na lista'}</Text>
          </TouchableOpacity>

          <View style={styles.inlineRow}>
            <TextInput
              value={cidadeCustom}
              onChangeText={setCidadeCustom}
              placeholder="Ou digite uma cidade que não está na lista"
              placeholderTextColor="#8E8E93"
              style={[styles.searchInput, styles.flexInput]}
            />
            <TouchableOpacity style={styles.smallActionBtn} onPress={aplicarCidadeDigitada}>
              <Text style={styles.smallActionBtnText}>Usar</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        {/* CATEGORIA */}
        <SectionCard title="Categoria" subtitle="Escolha uma categoria de instrumento">
          <View style={styles.tilesWrap}>
            {categoriasDisponiveis.map((cat) => (
              <View key={cat} style={styles.tileColHalf}>
                <OptionTile label={cat} selected={categoria === cat} onPress={() => handleSelecionarCategoria(cat)} />
              </View>
            ))}
          </View>
        </SectionCard>

        {/* INSTRUMENTOS */}
        {categoria !== '' && (
          <SectionCard title="Instrumento" subtitle={`Categoria selecionada: ${categoriaKey || categoria}`}>
            {instrumentosDaCategoria.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyBoxText}>Nenhum instrumento encontrado para “{categoria}”.</Text>
              </View>
            ) : (
              <View style={styles.tilesWrap}>
                {instrumentosDaCategoria.map((inst) => (
                  <View key={inst} style={styles.tileColHalf}>
                    <OptionTile
                      label={inst}
                      selected={instrumento === inst}
                      onPress={() => setInstrumento(instrumento === inst ? '' : inst)}
                      compact
                    />
                  </View>
                ))}
              </View>
            )}
          </SectionCard>
        )}

        {/* FUNÇÃO */}
        <SectionCard title="Função" subtitle="Ministério ou Música (seleção exclusiva)">
          <Text style={styles.fieldLabel}>👔 Ministério</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={ministerio} onValueChange={(value) => handleSelecionarMinisterio(String(value))}>
              <Picker.Item label="Nenhum" value="" />
              {ministeriosLista.map((m) => (
                <Picker.Item key={m} label={m} value={m} />
              ))}
            </Picker>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>🎼 Música</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={musicaCargo} onValueChange={(value) => handleSelecionarMusica(String(value))}>
              <Picker.Item label="Nenhum" value="" />
              {cargosMusicaisLista.map((m) => (
                <Picker.Item key={m} label={m} value={m} />
              ))}
            </Picker>
          </View>
        </SectionCard>

        {/* AÇÕES */}
        <SectionCard title="Ações" subtitle="Salvar lançamento e utilidades">
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionButton, !canSave && styles.actionButtonDisabled]}
            onPress={salvarRegistro}
            disabled={!canSave}
          >
            {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Gravar</Text>}
          
</TouchableOpacity>

<TouchableOpacity
  activeOpacity={0.85}
  style={[styles.warningButton, !ultimoLancamento?.id && styles.actionButtonDisabled]}
  onPress={abrirModalAlerta}
  disabled={!ultimoLancamento?.id}
>
  <Text style={styles.warningButtonText}>Alertar</Text>
</TouchableOpacity>

<TouchableOpacity activeOpacity={0.85} style={styles.secondaryButton} onPress={limparFormulario}>
            <Text style={styles.secondaryButtonText}>Limpar</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} style={styles.dangerButton} onPress={logoutForcado}>
            <Text style={styles.dangerButtonText}>Sair (logout)</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* COMPROVANTE */}
        {!!ultimoLancamento && (
          <SectionCard title="Último lançamento" subtitle={ultimoLancamento.origem === 'fila' ? 'Salvo na fila offline' : 'Salvo online'}>
            <View style={styles.receiptCard}>
              <Text style={styles.receiptLine}>🆔 {ultimoLancamento.id}</Text>
              <Text style={styles.receiptLine}>🕒 {ultimoLancamento.horario}</Text>
              <Text style={styles.receiptLine}>🏙️ {ultimoLancamento.cidade}</Text>
              <Text style={styles.receiptLine}>🎻 {ultimoLancamento.instrumento}</Text>
              <Text style={styles.receiptLine}>👔 {ultimoLancamento.ministerio}</Text>
              <Text style={styles.receiptLine}>🎼 {ultimoLancamento.musica}</Text>
              {!!ultimoLancamento.auditoria && (
                <Text style={styles.receiptWarning}>⚠️ {ultimoLancamento.auditoria}</Text>
              )}
            </View>
          </SectionCard>
        )}

        <View style={{ height: 26 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#0F1115' },
  scrollContent: { padding: 14, paddingBottom: 28 },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titulo: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  subtitulo: { color: '#9CA3AF', marginTop: 2 },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  headerBadgeText: { color: '#34C759', fontWeight: '800', fontSize: 12 },

  center: { flex: 1, backgroundColor: '#0F1115', justifyContent: 'center', alignItems: 'center' },
  centerText: { marginTop: 8, color: '#FFFFFF' },

  card: {
    backgroundColor: '#232732',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  cardSubtitle: { color: '#9CA3AF', marginTop: 2 },

  statusDot: { width: 10, height: 10, borderRadius: 999 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  statusLabel: { color: '#C7C7CC' },
  statusValue: { color: '#FFFFFF', fontWeight: '800' },

  warningBox: {
    marginTop: 10,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: 14,
    padding: 12,
  },
  warningText: { color: '#FDE68A', fontWeight: '700' },
  warningButton: {
    marginTop: 10,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  warningButtonText: { color: '#111827', fontWeight: '900' },

  switchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchText: { color: '#C7C7CC', fontWeight: '700' },

  selectBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  selectBtnText: { color: '#FFFFFF', fontWeight: '800' },

  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  flexInput: { flex: 1 },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
  },
  smallActionBtn: {
    backgroundColor: '#34C759',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  smallActionBtnText: { color: '#FFFFFF', fontWeight: '900' },

  tilesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tileColHalf: { width: '48%' },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tileCompact: { paddingVertical: 10 },
  tileSelected: { borderColor: 'rgba(52,199,89,0.6)', backgroundColor: 'rgba(52,199,89,0.12)' },
  tileCheck: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCheckSelected: { borderColor: '#34C759', backgroundColor: '#34C759' },
  tileCheckMark: { color: '#0F1115', fontWeight: '900' },
  tileLabel: { color: '#FFFFFF', fontWeight: '800', flex: 1 },
  tileLabelSelected: { color: '#FFFFFF' },

  emptyBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  emptyBoxText: { color: '#C7C7CC' },

  fieldLabel: { color: '#E5E7EB', fontWeight: '900', marginBottom: 6 },

  pickerContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  actionButton: {
    marginTop: 6,
    backgroundColor: '#34C759',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  actionButtonDisabled: { opacity: 0.55 },
  actionButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },


warningButton: {
  backgroundColor: '#FFD60A',
  borderRadius: 14,
  paddingVertical: 12,
  paddingHorizontal: 14,
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 110,
},
warningButtonText: {
  color: '#111111',
  fontWeight: '900',
  fontSize: 15,
},

alertSheet: {
  backgroundColor: '#232732',
  borderRadius: 18,
  padding: 16,
  width: '92%',
  maxWidth: 520,
},
alertHint: { color: '#C7C7CC', marginBottom: 10 },
alertInput: {
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: '#FFFFFF',
  minHeight: 80,
  textAlignVertical: 'top',
},
alertActions: { flexDirection: 'row', gap: 10, marginTop: 14, justifyContent: 'space-between' },

  secondaryButton: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#FFFFFF', fontWeight: '900' },

  dangerButton: {
    marginTop: 10,
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: { color: '#FCA5A5', fontWeight: '900' },

  receiptCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 12,
  },
  receiptLine: { color: '#FFFFFF', fontSize: 14, marginBottom: 2 },
  receiptWarning: { color: '#FDE68A', fontSize: 13, marginTop: 6 },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0F1115',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 14,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  modalClose: { color: '#34C759', fontWeight: '900' },
  modalSearch: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  modalSectionHeader: { color: '#9CA3AF', fontWeight: '900', marginTop: 8, marginBottom: 6 },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  modalItemSelected: { backgroundColor: 'rgba(52,199,89,0.16)', borderWidth: 1, borderColor: 'rgba(52,199,89,0.5)' },
  modalItemText: { color: '#FFFFFF', fontWeight: '800' },
  modalItemTextSelected: { color: '#FFFFFF' },
});

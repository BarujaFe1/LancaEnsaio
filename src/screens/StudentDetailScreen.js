import React, { useCallback, useState, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

import { deleteStudent, listStudents, saveStudent } from '../services/db';
import SelectModal from '../components/SelectModal';
import {
  CONGREGATIONS,
  GRADUATIONS,
  INSTRUMENTS,
  getFamilyByInstrument
} from '../data/catalogs';
import { useTheme } from '../theme/ThemeProvider';

const emptyForm = {
  id: null,
  full_name: '',
  category: '',
  instrument: '',
  level: '',
  start_date: dayjs().format('YYYY-MM-DD'),
  status: 'ativo',
  observations: '',
  congregation: '',
  address: '',
  phone: '',
  birth_date: '',
  baptism_date: '',
  instrument_change_note: ''
};

const initialFilters = {
  search: '',
  instrument: '',
  category: '',
  level: '',
  status: ''
};

export default function StudentsScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [filters, setFilters] = useState(initialFilters);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [customCongregation, setCustomCongregation] = useState('');

  const instrumentOptions = useMemo(() => INSTRUMENTS.map((i) => ({ label: i.label, value: i.label })), []);
  const familyOptions = useMemo(() => ['Cordas', 'Metais', 'Madeiras'].map((v) => ({ label: v, value: v })), []);
  const graduationOptions = useMemo(() => GRADUATIONS.map((v) => ({ label: v, value: v })), []);
  const statusOptions = useMemo(() => ['ativo', 'inativo'].map((v) => ({ label: v, value: v })), []);
  const congregationOptions = useMemo(() => CONGREGATIONS.map((v) => ({ label: v, value: v })), []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listStudents(filters);
      setStudents(data);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openNew = () => {
    setForm({ ...emptyForm });
    setCustomCongregation('');
    setModalVisible(true);
  };

  const openEdit = (student) => {
    const isCustom = student.congregation && !CONGREGATIONS.includes(student.congregation);
    setForm({
      ...emptyForm,
      ...student,
      congregation: isCustom ? 'Outra' : (student.congregation || '')
    });
    setCustomCongregation(isCustom ? student.congregation : '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setForm(emptyForm);
    setCustomCongregation('');
  };

  const onSelectInstrument = (instrument) => {
    const family = getFamilyByInstrument(instrument);
    setForm((prev) => ({ ...prev, instrument, category: family }));
  };

  const onSave = async () => {
    if (!form.full_name?.trim()) return Alert.alert('Atenção', 'Informe o nome completo.');
    if (!form.instrument) return Alert.alert('Atenção', 'Selecione o instrumento.');
    if (!form.level) return Alert.alert('Atenção', 'Selecione a graduação.');

    try {
      setSaving(true);

      const finalCongregation =
        form.congregation === 'Outra' ? customCongregation.trim() : form.congregation;

      await saveStudent({
        ...form,
        full_name: form.full_name.trim(),
        congregation: finalCongregation || null
      });

      closeModal();
      await load();
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao salvar aluno.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (student) => {
    Alert.alert('Excluir aluno', `Deseja excluir "${student.full_name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStudent(student.id);
            await load();
          } catch (e) {
            Alert.alert('Erro', e.message || 'Falha ao excluir.');
          }
        }
      }
    ]);
  };

  const clearFilters = async () => {
    const reset = { ...initialFilters };
    setFilters(reset);
    try {
      setLoading(true);
      const data = await listStudents(reset);
      setStudents(data);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao limpar filtros.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.title}>Alunos</Text>
            <Text style={styles.subtitle}>Cadastro completo + filtros</Text>

            <TextInput
              placeholder="Buscar por nome"
              placeholderTextColor={theme.colors.placeholder}
              style={styles.input}
              value={filters.search}
              onChangeText={(v) => setFilters((f) => ({ ...f, search: v }))}
            />

            <SelectModal
              label="Instrumento (filtro)"
              value={filters.instrument}
              options={[{ label: 'Todos', value: '' }, ...instrumentOptions]}
              onChange={(v) => setFilters((f) => ({ ...f, instrument: v }))}
            />

            <SelectModal
              label="Família (filtro)"
              value={filters.category}
              options={[{ label: 'Todas', value: '' }, ...familyOptions]}
              onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
            />

            <SelectModal
              label="Graduação (filtro)"
              value={filters.level}
              options={[{ label: 'Todas', value: '' }, ...graduationOptions]}
              onChange={(v) => setFilters((f) => ({ ...f, level: v }))}
            />

            <SelectModal
              label="Status (filtro)"
              value={filters.status}
              options={[{ label: 'Todos', value: '' }, ...statusOptions]}
              onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            />

            <View style={styles.rowWrap}>
              <TouchableOpacity style={styles.primaryBtn} onPress={load}>
                <Text style={styles.primaryText}>Aplicar filtros</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={clearFilters}>
                <Text style={styles.secondaryText}>Limpar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={openNew}>
              <Text style={styles.addBtnText}>+ Novo aluno</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Nenhum aluno encontrado.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })}
          >
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.meta}>
              {item.category || '-'} • {item.instrument || '-'} • {item.level || '-'}
            </Text>
            <Text style={styles.meta}>
              {item.congregation || '-'} • {item.status || '-'}
            </Text>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.smallBtn} onPress={() => openEdit(item)}>
                <Text style={styles.smallBtnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, styles.deleteBtn]} onPress={() => onDelete(item)}>
                <Text style={styles.smallBtnText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          <Text style={styles.title}>{form.id ? 'Editar Aluno' : 'Novo Aluno'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            placeholderTextColor={theme.colors.placeholder}
            value={form.full_name}
            onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))}
          />

          <View style={styles.readonlyBox}>
            <Text style={styles.readonlyLabel}>Família do instrumento</Text>
            <Text style={styles.readonlyText}>{form.category || 'Será preenchida automaticamente'}</Text>
          </View>

          <SelectModal label="Instrumento" value={form.instrument} options={instrumentOptions} onChange={onSelectInstrument} />
          <SelectModal label="Graduação" value={form.level} options={graduationOptions} onChange={(v) => setForm((f) => ({ ...f, level: v }))} />
          <SelectModal label="Comum / Congregação" value={form.congregation} options={congregationOptions} onChange={(v) => setForm((f) => ({ ...f, congregation: v }))} />

          {form.congregation === 'Outra' && (
            <TextInput
              style={styles.input}
              placeholder="Digite a congregação"
              placeholderTextColor={theme.colors.placeholder}
              value={customCongregation}
              onChangeText={setCustomCongregation}
            />
          )}

          <TextInput style={styles.input} placeholder="Dia que começou as aulas (YYYY-MM-DD)" placeholderTextColor={theme.colors.placeholder} value={form.start_date} onChangeText={(v) => setForm((f) => ({ ...f, start_date: v }))} />
          <TextInput style={styles.input} placeholder="Endereço" placeholderTextColor={theme.colors.placeholder} value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} />
          <TextInput style={styles.input} placeholder="Número de celular" placeholderTextColor={theme.colors.placeholder} value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} />
          <TextInput style={styles.input} placeholder="Data de nascimento (YYYY-MM-DD)" placeholderTextColor={theme.colors.placeholder} value={form.birth_date} onChangeText={(v) => setForm((f) => ({ ...f, birth_date: v }))} />
          <TextInput style={styles.input} placeholder="Data de batismo (YYYY-MM-DD)" placeholderTextColor={theme.colors.placeholder} value={form.baptism_date} onChangeText={(v) => setForm((f) => ({ ...f, baptism_date: v }))} />
          <TextInput style={styles.input} placeholder="Mudança de instrumento (ex.: Violino → Viola)" placeholderTextColor={theme.colors.placeholder} value={form.instrument_change_note} onChangeText={(v) => setForm((f) => ({ ...f, instrument_change_note: v }))} />

          <SelectModal label="Ativo nas aulas" value={form.status} options={statusOptions} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />

          <TextInput
            style={[styles.input, { minHeight: 110, textAlignVertical: 'top' }]}
            multiline
            placeholder="Observações"
            placeholderTextColor={theme.colors.placeholder}
            value={form.observations}
            onChangeText={(v) => setForm((f) => ({ ...f, observations: v }))}
          />

          <View style={styles.rowWrap}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={closeModal}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={onSave} disabled={saving}>
              <Text style={styles.primaryText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    title: { fontSize: 22, fontWeight: '900', color: theme.colors.text, marginBottom: 6 },
    subtitle: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 12, fontWeight: '700' },

    input: {
      backgroundColor: theme.colors.inputBg,
      color: theme.colors.inputText,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      fontWeight: '700'
    },

    rowWrap: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    primaryBtn: { flex: 1, backgroundColor: theme.colors.accent, padding: 12, borderRadius: 10, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '900' },
    secondaryBtn: { flex: 1, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 10, alignItems: 'center' },
    secondaryText: { color: theme.colors.text, fontWeight: '900' },

    addBtn: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 13, borderRadius: 12, alignItems: 'center' },
    addBtnText: { color: theme.colors.text, fontWeight: '900' },

    card: { backgroundColor: theme.colors.card, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 10 },
    name: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
    meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4, fontWeight: '700' },

    cardActions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
    smallBtn: { backgroundColor: theme.colors.accent, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    deleteBtn: { backgroundColor: theme.colors.danger },
    smallBtnText: { color: '#fff', fontWeight: '900', fontSize: 12 },

    empty: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 24, fontWeight: '800' },

    readonlyBox: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, marginBottom: 10 },
    readonlyLabel: { color: theme.colors.textMuted, fontWeight: '800', marginBottom: 4 },
    readonlyText: { color: theme.colors.text, fontWeight: '900' }
  });
}

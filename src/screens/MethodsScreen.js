import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { deleteMethod, listMethods, saveMethod } from '../services/db';
import SelectModal from '../components/SelectModal';
import { INSTRUMENTS } from '../data/catalogs';
import { useTheme } from '../theme/ThemeProvider';

const emptyForm = { id: null, name: '', instruments: [], active: true, notes: '' };

export default function MethodsScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [methods, setMethods] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [instrumentToAdd, setInstrumentToAdd] = useState('');

  const instrumentOptions = useMemo(() => INSTRUMENTS.map((i) => ({ label: i.label, value: i.label })), []);

  const load = useCallback(async () => {
    try {
      const data = await listMethods();
      setMethods(data);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao carregar métodos.');
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openNew = () => {
    setForm(emptyForm);
    setInstrumentToAdd('');
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setForm({ ...emptyForm, ...item, instruments: item.instruments || [] });
    setInstrumentToAdd('');
    setModalVisible(true);
  };

  const addInstrument = () => {
    if (!instrumentToAdd) return;
    if (form.instruments.includes(instrumentToAdd)) return;
    setForm((prev) => ({ ...prev, instruments: [...prev.instruments, instrumentToAdd] }));
    setInstrumentToAdd('');
  };

  const removeInstrument = (instrument) => {
    setForm((prev) => ({ ...prev, instruments: prev.instruments.filter((i) => i !== instrument) }));
  };

  const onSave = async () => {
    if (!form.name.trim()) return Alert.alert('Atenção', 'Informe o nome do método.');
    try {
      await saveMethod({ ...form, name: form.name.trim() });
      setModalVisible(false);
      load();
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao salvar método.');
    }
  };

  const onDelete = (item) => {
    Alert.alert('Excluir método', `Deseja excluir "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteMethod(item.id); load(); } }
    ]);
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        data={methods}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.title}>Métodos</Text>
            <Text style={styles.subtitle}>Crie métodos e associe aos instrumentos.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={openNew}>
              <Text style={styles.primaryText}>+ Novo método</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              Instrumentos: {item.instruments?.length ? item.instruments.join(', ') : 'Todos'}
            </Text>
            {!!item.notes && <Text style={styles.meta}>Obs.: {item.notes}</Text>}

            <View style={styles.row}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => openEdit(item)}>
                <Text style={styles.secondaryText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.colors.danger }]} onPress={() => onDelete(item)}>
                <Text style={[styles.secondaryText, { color: theme.colors.danger }]}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          <Text style={styles.title}>{form.id ? 'Editar Método' : 'Novo Método'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome do método"
            placeholderTextColor={theme.colors.placeholder}
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          />

          <SelectModal
            label="Adicionar instrumento compatível"
            value={instrumentToAdd}
            options={[{ label: 'Selecionar', value: '' }, ...instrumentOptions]}
            onChange={setInstrumentToAdd}
            allowClear={true}
          />

          <TouchableOpacity style={styles.secondaryBtn} onPress={addInstrument}>
            <Text style={styles.secondaryText}>Adicionar instrumento</Text>
          </TouchableOpacity>

          <View style={styles.chipsWrap}>
            {form.instruments.map((instrument) => (
              <TouchableOpacity key={instrument} style={styles.chip} onPress={() => removeInstrument(instrument)}>
                <Text style={styles.chipText}>{instrument} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
            multiline
            placeholder="Observações"
            placeholderTextColor={theme.colors.placeholder}
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
          />

          <View style={styles.row}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={onSave}>
              <Text style={styles.primaryText}>Salvar</Text>
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

    primaryBtn: { backgroundColor: theme.colors.accent, padding: 12, borderRadius: 10, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '900' },

    secondaryBtn: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 10, alignItems: 'center' },
    secondaryText: { color: theme.colors.text, fontWeight: '900' },

    card: { backgroundColor: theme.colors.card, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 10 },
    name: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
    meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4, fontWeight: '700' },

    row: { flexDirection: 'row', gap: 8, marginTop: 10 },

    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 12 },
    chip: { backgroundColor: theme.colors.chipBg, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
    chipText: { color: theme.colors.chipText, fontWeight: '900' }
  });
}

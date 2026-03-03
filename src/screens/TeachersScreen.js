import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { deleteTeacher, listTeachers, saveTeacher } from '../services/db';
import SelectModal from '../components/SelectModal';
import { CONGREGATIONS, INSTRUMENTS, TEACHER_ROLES } from '../data/catalogs';
import { useTheme } from '../theme/ThemeProvider';

const emptyForm = { id: null, full_name: '', instrument: '', congregation: '', role_kind: 'Instrutor', active: true };

export default function TeachersScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [teachers, setTeachers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [customCongregation, setCustomCongregation] = useState('');

  const instrumentOptions = useMemo(() => INSTRUMENTS.map((i) => ({ label: i.label, value: i.label })), []);
  const congregationOptions = useMemo(() => CONGREGATIONS.map((v) => ({ label: v, value: v })), []);
  const rolesOptions = useMemo(() => TEACHER_ROLES.map((v) => ({ label: v, value: v })), []);

  const load = useCallback(async () => {
    try {
      const data = await listTeachers();
      setTeachers(data);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao carregar professores.');
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openNew = () => {
    setForm(emptyForm);
    setCustomCongregation('');
    setModalVisible(true);
  };

  const openEdit = (item) => {
    const isCustom = item.congregation && !CONGREGATIONS.includes(item.congregation);
    setForm({
      ...emptyForm,
      ...item,
      congregation: isCustom ? 'Outra' : (item.congregation || '')
    });
    setCustomCongregation(isCustom ? item.congregation : '');
    setModalVisible(true);
  };

  const onSave = async () => {
    if (!form.full_name.trim()) return Alert.alert('Atenção', 'Informe o nome.');
    if (!form.instrument) return Alert.alert('Atenção', 'Selecione o instrumento.');
    try {
      const finalCongregation = form.congregation === 'Outra' ? customCongregation.trim() : form.congregation;
      await saveTeacher({ ...form, full_name: form.full_name.trim(), congregation: finalCongregation || null });
      setModalVisible(false);
      load();
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao salvar professor.');
    }
  };

  const onDelete = (item) => {
    Alert.alert('Excluir professor', `Deseja excluir "${item.full_name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteTeacher(item.id); load(); } }
    ]);
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        data={teachers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.title}>Professores / Encarregados</Text>
            <Text style={styles.subtitle}>Cadastre instrutores e encarregados.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={openNew}>
              <Text style={styles.primaryText}>+ Novo professor</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.meta}>{item.instrument || '-'} • {item.congregation || '-'}</Text>
            <Text style={styles.meta}>{item.role_kind || '-'}</Text>

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
          <Text style={styles.title}>{form.id ? 'Editar Professor' : 'Novo Professor'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome"
            placeholderTextColor={theme.colors.placeholder}
            value={form.full_name}
            onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))}
          />

          <SelectModal label="Instrumento" value={form.instrument} options={instrumentOptions} onChange={(v) => setForm((f) => ({ ...f, instrument: v }))} />
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

          <SelectModal label="Função" value={form.role_kind} options={rolesOptions} onChange={(v) => setForm((f) => ({ ...f, role_kind: v }))} />

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

    row: { flexDirection: 'row', gap: 8, marginTop: 10 }
  });
}

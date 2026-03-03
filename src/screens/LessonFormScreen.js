import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import dayjs from 'dayjs';
import { saveLesson } from '../services/db';

export default function LessonFormScreen({ route, navigation }) {
  const { studentId } = route.params;

  const [form, setForm] = useState({
    student_id: studentId,
    lesson_date: dayjs().format('YYYY-MM-DD'),
    method_name: '',
    pages: '',
    lesson_name: '',
    hymns: '',
    technical_notes: '',
    performance_score: '',
    performance_concept: '',
    difficulty_observed: '',
    strengths: '',
    attendance: true,
    skill_rhythm: '',
    skill_reading: '',
    skill_technique: '',
    skill_posture: '',
    skill_musicality: ''
  });
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    try {
      setSaving(true);
      await saveLesson(form);
      Alert.alert('Sucesso', 'Registro de aula salvo.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao salvar aula.');
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Registrar Aula</Text>

      <TextInput style={styles.input} placeholder="Data (YYYY-MM-DD)" value={form.lesson_date} onChangeText={(v) => set('lesson_date', v)} />
      <TextInput style={styles.input} placeholder="Método utilizado" value={form.method_name} onChangeText={(v) => set('method_name', v)} />
      <TextInput style={styles.input} placeholder="Página(s)" value={form.pages} onChangeText={(v) => set('pages', v)} />
      <TextInput style={styles.input} placeholder="Lição" value={form.lesson_name} onChangeText={(v) => set('lesson_name', v)} />
      <TextInput style={styles.input} placeholder="Hinos passados (separar por vírgula)" value={form.hymns} onChangeText={(v) => set('hymns', v)} />
      <TextInput style={[styles.input, { minHeight: 90 }]} multiline placeholder="Observações técnicas" value={form.technical_notes} onChangeText={(v) => set('technical_notes', v)} />

      <Text style={styles.section}>Avaliação de desempenho</Text>
      <TextInput style={styles.input} keyboardType="numeric" placeholder="Nota (0 a 10) - opcional" value={String(form.performance_score)} onChangeText={(v) => set('performance_score', v)} />
      <TextInput style={styles.input} placeholder="Conceito (Excelente/Bom/Regular/Ruim) - opcional" value={form.performance_concept} onChangeText={(v) => set('performance_concept', v)} />
      <TextInput style={styles.input} placeholder="Dificuldade observada" value={form.difficulty_observed} onChangeText={(v) => set('difficulty_observed', v)} />
      <TextInput style={styles.input} placeholder="Pontos fortes" value={form.strengths} onChangeText={(v) => set('strengths', v)} />

      <Text style={styles.section}>Habilidades técnicas (0-10) — usadas no radar</Text>
      <TextInput style={styles.input} keyboardType="numeric" placeholder="Ritmo" value={String(form.skill_rhythm)} onChangeText={(v) => set('skill_rhythm', v)} />
      <TextInput style={styles.input} keyboardType="numeric" placeholder="Leitura" value={String(form.skill_reading)} onChangeText={(v) => set('skill_reading', v)} />
      <TextInput style={styles.input} keyboardType="numeric" placeholder="Técnica" value={String(form.skill_technique)} onChangeText={(v) => set('skill_technique', v)} />
      <TextInput style={styles.input} keyboardType="numeric" placeholder="Postura" value={String(form.skill_posture)} onChangeText={(v) => set('skill_posture', v)} />
      <TextInput style={styles.input} keyboardType="numeric" placeholder="Musicalidade" value={String(form.skill_musicality)} onChangeText={(v) => set('skill_musicality', v)} />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Presença</Text>
        <Switch value={!!form.attendance} onValueChange={(v) => set('attendance', v)} />
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onSave} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? 'Salvando...' : 'Salvar registro'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  title: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 10 },
  section: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 4, color: '#111' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10
  },
  switchRow: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  switchLabel: { color: '#111', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
  secondaryBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  secondaryText: { color: '#111', fontWeight: '700' },
  primaryBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#1d4ed8', alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' }
});

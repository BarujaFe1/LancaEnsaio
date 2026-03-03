import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

import SelectModal from '../components/SelectModal';
import { useTheme } from '../theme/ThemeProvider';
import { listMethods, listRecentLessons, listStudentsBasic, listTeachers, saveLesson } from '../services/db';
import { buildContentNumberOptions, CONTENT_GROUPS, VOICES } from '../data/catalogs';

export default function LessonLaunchesScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [methods, setMethods] = useState([]);
  const [recentLessons, setRecentLessons] = useState([]);
  const [saving, setSaving] = useState(false);

  // Form principal
  const [form, setForm] = useState({
    student_id: '',
    teacher_id: '',
    method_id: '',
    lesson_date: dayjs().format('YYYY-MM-DD'),
    technical_notes: '',
    attendance: true,

    // multi
    content_items: [], // [{type:'hino'|'coro', number: 1.., voices:[], solfejo:boolean}]
    page_items: [], // ['10-12', '13']
    lesson_items: [] // ['Lição 1', 'Lição 2'] ou ['1','2']
  });

  // inputs auxiliares (para adicionar item)
  const [contentType, setContentType] = useState('');
  const [contentNumber, setContentNumber] = useState('');
  const [voices, setVoices] = useState([]);
  const [solfejo, setSolfejo] = useState(false);

  const [pageInput, setPageInput] = useState('');
  const [lessonInput, setLessonInput] = useState('');

  const nowLabel = useMemo(() => dayjs().format('DD/MM/YYYY HH:mm'), []);

  const load = useCallback(async () => {
    try {
      const [studentsData, teachersData, methodsData, lessonsData] = await Promise.all([
        listStudentsBasic(),
        listTeachers(),
        listMethods(),
        listRecentLessons(20)
      ]);
      setStudents(studentsData);
      setTeachers(teachersData);
      setMethods(methodsData);
      setRecentLessons(lessonsData);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao carregar lançamentos.');
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const selectedStudent = useMemo(() => students.find((s) => s.id === form.student_id), [students, form.student_id]);

  const studentOptions = useMemo(
    () => students.map((s) => ({ label: `${s.full_name} • ${s.instrument || '-'}`, value: s.id })),
    [students]
  );

  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ label: `${t.full_name} • ${t.instrument || '-'}`, value: t.id })),
    [teachers]
  );

  const methodOptions = useMemo(() => {
    const inst = selectedStudent?.instrument;
    return methods
      .filter((m) => {
        const list = m.instruments || [];
        if (!list.length) return true;
        if (!inst) return true;
        return list.includes(inst);
      })
      .map((m) => ({ label: m.name, value: m.id }));
  }, [methods, selectedStudent?.instrument]);

  const contentGroupOptions = useMemo(() => CONTENT_GROUPS.map((x) => ({ label: x.label, value: x.value })), []);
  const contentNumbers = useMemo(() => buildContentNumberOptions(contentType), [contentType]);
  const numberOptions = useMemo(() => contentNumbers.map((n) => ({ label: String(n), value: n })), [contentNumbers]);

  const toggleVoice = (voice) => {
    setVoices((prev) => (prev.includes(voice) ? prev.filter((v) => v !== voice) : [...prev, voice]));
  };

  const addContentItem = () => {
    if (!contentType || !contentNumber) return;
    const item = { type: contentType, number: Number(contentNumber), voices: voices || [], solfejo: !!solfejo };

    setForm((prev) => {
      const exists = prev.content_items.some((x) => x.type === item.type && x.number === item.number);
      if (exists) return prev;
      return { ...prev, content_items: [...prev.content_items, item] };
    });

    setContentType('');
    setContentNumber('');
    setVoices([]);
    setSolfejo(false);
  };

  const removeContentItem = (type, number) => {
    setForm((prev) => ({ ...prev, content_items: prev.content_items.filter((x) => !(x.type === type && x.number === number)) }));
  };

  const addPageItem = () => {
    const v = pageInput.trim();
    if (!v) return;
    setForm((prev) => (prev.page_items.includes(v) ? prev : { ...prev, page_items: [...prev.page_items, v] }));
    setPageInput('');
  };

  const removePageItem = (v) => setForm((prev) => ({ ...prev, page_items: prev.page_items.filter((x) => x !== v) }));

  const addLessonItem = () => {
    const v = lessonInput.trim();
    if (!v) return;
    setForm((prev) => (prev.lesson_items.includes(v) ? prev : { ...prev, lesson_items: [...prev.lesson_items, v] }));
    setLessonInput('');
  };

  const removeLessonItem = (v) => setForm((prev) => ({ ...prev, lesson_items: prev.lesson_items.filter((x) => x !== v) }));

  const resetForm = () => {
    setForm({
      student_id: '',
      teacher_id: '',
      method_id: '',
      lesson_date: dayjs().format('YYYY-MM-DD'),
      technical_notes: '',
      attendance: true,
      content_items: [],
      page_items: [],
      lesson_items: []
    });
    setContentType('');
    setContentNumber('');
    setVoices([]);
    setSolfejo(false);
    setPageInput('');
    setLessonInput('');
  };

  const onSave = async () => {
    if (!form.student_id) return Alert.alert('Atenção', 'Selecione o aluno.');
    if (!form.teacher_id) return Alert.alert('Atenção', 'Selecione o professor/encarregado.');
    if (!form.method_id) return Alert.alert('Atenção', 'Selecione o método.');

    try {
      setSaving(true);
      const selectedMethod = methods.find((m) => m.id === form.method_id);

      // compatibilidade: salva 1º item em content_group/content_number também
      const first = form.content_items[0] || null;
      const content_group = first?.type || null;
      const content_number = first?.number || null;

      // compatibilidade antiga "hymns": lista textual
      const hymns = form.content_items.length
        ? form.content_items.map((x) => `${x.type === 'hino' ? 'Hino' : 'Coro'} ${x.number}`).join(', ')
        : null;

      // compatibilidade antiga pages/lesson_name:
      const pages = form.page_items.length ? form.page_items.join(', ') : null;
      const lesson_name = form.lesson_items.length ? form.lesson_items.join(', ') : null;

      await saveLesson({
        student_id: form.student_id,
        teacher_id: form.teacher_id,
        method_id: form.method_id,
        lesson_date: form.lesson_date,

        method_name: selectedMethod?.name || null,
        hymns,
        pages,
        lesson_name,

        content_group,
        content_number,
        voices: first?.voices || [],
        solfejo: !!first?.solfejo,

        content_items: form.content_items,
        page_items: form.page_items,
        lesson_items: form.lesson_items,

        technical_notes: form.technical_notes || null,
        attendance: !!form.attendance
      });

      Alert.alert('Sucesso', 'Lançamento salvo com sucesso.');
      resetForm();
      load();
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao salvar lançamento.');
    } finally {
      setSaving(false);
    }
  };

  const contentPreview = (item) => {
    const label = item.type === 'hino' ? 'Hino' : 'Coro';
    const v = item.voices?.length ? ` • ${item.voices.join('/')}` : '';
    const s = item.solfejo ? ' • Solfejo' : '';
    return `${label} ${item.number}${v}${s}`;
  };

  return (
    <FlatList
      data={recentLessons}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 12, paddingBottom: 30, backgroundColor: theme.colors.bg }}
      ListHeaderComponent={
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.title}>Lançamentos</Text>
          <Text style={styles.subtitle}>Agora com múltiplos hinos/coros, páginas e lições.</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Data/hora do lançamento: {nowLabel}</Text>
            <Text style={styles.infoTextSmall}>A hora exata fica salva no banco automaticamente.</Text>
          </View>

          <SelectModal
            label="Aluno"
            value={form.student_id}
            options={studentOptions}
            onChange={(v) => setForm((f) => ({ ...f, student_id: v, method_id: '' }))}
            placeholder="Selecione o aluno"
          />

          <SelectModal
            label="Professor / Encarregado"
            value={form.teacher_id}
            options={teacherOptions}
            onChange={(v) => setForm((f) => ({ ...f, teacher_id: v }))}
            placeholder="Selecione o professor"
          />

          <SelectModal
            label="Método (filtra pelo instrumento do aluno)"
            value={form.method_id}
            options={methodOptions}
            onChange={(v) => setForm((f) => ({ ...f, method_id: v }))}
            placeholder="Selecione o método"
          />

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Páginas (múltiplas)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Ex.: 10-12"
                value={pageInput}
                onChangeText={setPageInput}
                placeholderTextColor={theme.colors.placeholder}
              />
              <TouchableOpacity style={styles.smallPrimary} onPress={addPageItem}>
                <Text style={styles.smallPrimaryText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipsWrap}>
              {form.page_items.map((p) => (
                <TouchableOpacity key={p} style={styles.chip} onPress={() => removePageItem(p)}>
                  <Text style={styles.chipText}>{p} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Lições (múltiplas)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Ex.: Lição 3"
                value={lessonInput}
                onChangeText={setLessonInput}
                placeholderTextColor={theme.colors.placeholder}
              />
              <TouchableOpacity style={styles.smallPrimary} onPress={addLessonItem}>
                <Text style={styles.smallPrimaryText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipsWrap}>
              {form.lesson_items.map((l) => (
                <TouchableOpacity key={l} style={styles.chip} onPress={() => removeLessonItem(l)}>
                  <Text style={styles.chipText}>{l} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Conteúdo musical (múltiplos)</Text>

            <SelectModal
              label="Tipo"
              value={contentType}
              options={contentGroupOptions.filter((x) => x.value)} // remove "Nenhum"
              onChange={(v) => { setContentType(v); setContentNumber(''); setVoices([]); setSolfejo(false); }}
              placeholder="Hino ou Coro"
              allowClear={true}
            />

            {!!contentType && (
              <SelectModal
                label={contentType === 'hino' ? 'Número do hino (1..480)' : 'Número do coro (1..6)'}
                value={contentNumber}
                options={numberOptions}
                onChange={setContentNumber}
                searchable={true}
              />
            )}

            {!!contentType && (
              <>
                <Text style={styles.label}>Vozes</Text>
                <View style={styles.voiceWrap}>
                  {VOICES.map((voice) => {
                    const active = voices.includes(voice);
                    return (
                      <TouchableOpacity
                        key={voice}
                        style={[styles.voiceChip, active && styles.voiceChipActive]}
                        onPress={() => toggleVoice(voice)}
                      >
                        <Text style={[styles.voiceText, active && styles.voiceTextActive]}>{voice}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Solfejo</Text>
                  <Switch value={solfejo} onValueChange={setSolfejo} />
                </View>

                <TouchableOpacity style={styles.secondaryBtn} onPress={addContentItem}>
                  <Text style={styles.secondaryBtnText}>Adicionar Hino/Coro</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.chipsWrap}>
              {form.content_items.map((ci) => {
                const key = `${ci.type}-${ci.number}`;
                return (
                  <TouchableOpacity key={key} style={styles.chip} onPress={() => removeContentItem(ci.type, ci.number)}>
                    <Text style={styles.chipText}>{contentPreview(ci)} ✕</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TextInput
            style={[styles.input, { minHeight: 110 }]}
            multiline
            placeholder="Observações do instrutor"
            value={form.technical_notes}
            onChangeText={(v) => setForm((f) => ({ ...f, technical_notes: v }))}
            placeholderTextColor={theme.colors.placeholder}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={onSave} disabled={saving}>
            <Text style={styles.primaryBtnText}>{saving ? 'Salvando...' : 'Salvar lançamento'}</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { fontSize: 18, marginTop: 18 }]}>Últimos lançamentos</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{(item.student_name || 'Aluno')} • {item.lesson_date || '-'}</Text>
          <Text style={styles.meta}>Professor: {item.teacher_name || '-'}</Text>
          <Text style={styles.meta}>Método: {item.method_name_resolved || '-'}</Text>

          <Text style={styles.meta}>
            Conteúdo: {Array.isArray(item.content_items) && item.content_items.length
              ? item.content_items.map((x) => `${x.type} ${x.number}`).join(', ')
              : (item.content_group ? `${item.content_group} ${item.content_number || ''}` : '-')}
          </Text>

          <Text style={styles.meta}>
            Páginas: {Array.isArray(item.page_items) && item.page_items.length ? item.page_items.join(', ') : '-'}
          </Text>
          <Text style={styles.meta}>
            Lições: {Array.isArray(item.lesson_items) && item.lesson_items.length ? item.lesson_items.join(', ') : '-'}
          </Text>
        </View>
      )}
    />
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    title: { fontSize: 22, fontWeight: '900', color: theme.colors.text, marginBottom: 6 },
    subtitle: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 12 },
    label: { fontSize: 13, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },

    infoBox: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, marginBottom: 10 },
    infoText: { color: theme.colors.text, fontWeight: '900' },
    infoTextSmall: { color: theme.colors.textMuted, marginTop: 4 },

    input: { backgroundColor: theme.colors.inputBg, color: theme.colors.inputText, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 12, marginBottom: 10 },

    block: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, marginBottom: 10 },
    blockTitle: { color: theme.colors.text, fontWeight: '900', marginBottom: 8 },
    row: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10 },

    smallPrimary: { backgroundColor: theme.colors.accent, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
    smallPrimaryText: { color: '#fff', fontWeight: '900' },

    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chip: { backgroundColor: theme.colors.chipBg, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
    chipText: { color: theme.colors.chipText, fontWeight: '900' },

    voiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    voiceChip: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
    voiceChipActive: { backgroundColor: theme.colors.chipBg, borderColor: theme.colors.accent },
    voiceText: { color: theme.colors.text, fontWeight: '800' },
    voiceTextActive: { color: theme.colors.accent },

    switchRow: { backgroundColor: theme.colors.inputBg, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
    switchLabel: { color: theme.colors.text, fontWeight: '900' },

    primaryBtn: { backgroundColor: theme.colors.accent, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
    primaryBtnText: { color: '#fff', fontWeight: '900' },

    secondaryBtn: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 12, alignItems: 'center' },
    secondaryBtnText: { color: theme.colors.text, fontWeight: '900' },

    card: { backgroundColor: theme.colors.card, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 10 },
    cardTitle: { fontSize: 15, fontWeight: '900', color: theme.colors.text },
    meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }
  });
}

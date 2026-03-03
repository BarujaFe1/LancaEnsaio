import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { clearLogs, exportLogsTxt, getLogs } from '../utils/logger';
import { useTheme } from '../theme/ThemeProvider';

export default function LogsScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [logs, setLogs] = useState([]);

  const load = useCallback(async () => {
    const data = await getLogs();
    setLogs(data.reverse());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onClear = async () => {
    Alert.alert('Limpar logs', 'Deseja apagar todos os logs?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => { await clearLogs(); await load(); } }
    ]);
  };

  const onExport = async () => {
    try {
      await exportLogsTxt();
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao exportar logs.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.title}>Logs</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={load}><Text style={styles.btnText}>Atualizar</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={onExport}><Text style={styles.btnText}>Exportar</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.danger }]} onPress={onClear}>
            <Text style={styles.btnText}>Limpar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item, idx) => `${item.ts}-${idx}`}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.lineTop}>{item.ts} • {item.level}</Text>
            <Text style={styles.msg}>{item.message}</Text>
            {!!item.meta && <Text style={styles.meta}>{JSON.stringify(item.meta)}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 24, color: theme.colors.textMuted, fontWeight: '700' }}>Sem logs.</Text>}
      />
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    header: { padding: 12, paddingTop: 16 },
    title: { fontSize: 22, fontWeight: '900', color: theme.colors.text, marginBottom: 10 },
    row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    btn: { backgroundColor: theme.colors.accent, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
    btnText: { color: '#fff', fontWeight: '900' },
    card: { backgroundColor: theme.colors.card, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 10 },
    lineTop: { color: theme.colors.textMuted, fontWeight: '800', marginBottom: 6, fontSize: 12 },
    msg: { color: theme.colors.text, fontWeight: '900' },
    meta: { color: theme.colors.textMuted, marginTop: 8, fontSize: 12 }
  });
}

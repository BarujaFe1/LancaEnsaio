import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { BarChart, LineChart } from 'react-native-chart-kit';
import ViewShot from 'react-native-view-shot';

import { getDatasetForReports } from '../services/db';
import { buildGroupAnalytics } from '../utils/analytics';
import { buildGroupReportHtml, exportChartAsImage, exportExcel, exportHtmlPdf } from '../utils/exporters';
import KpiCard from '../components/KpiCard';
import { useTheme } from '../theme/ThemeProvider';

const chartWidth = Dimensions.get('window').width - 32;

export default function ReportsScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const chartConfig = useMemo(() => ({
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 1,
    color: (o = 1) => `rgba(59, 130, 246, ${o})`,
    labelColor: (o = 1) => `rgba(148, 163, 184, ${o})`,
    propsForDots: { r: '3' }
  }), [theme]);

  const [filters, setFilters] = useState({
    from: dayjs().subtract(6, 'month').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD'),
    instrument: '',
    category: '',
    instructor_id: ''
  });

  const [dataset, setDataset] = useState({ students: [], lessons: [] });
  const [loading, setLoading] = useState(false);
  const chartRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDatasetForReports(filters);
      setDataset(data);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const group = useMemo(() => buildGroupAnalytics(dataset.students, dataset.lessons), [dataset]);

  const exportPdf = async () => {
    try {
      const html = buildGroupReportHtml({ filters, group });
      await exportHtmlPdf({ html, fileName: 'relatorio-coletivo-maestro.pdf' });
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao exportar PDF.');
    }
  };

  const exportXlsx = async () => {
    try {
      const rows = group.ranking.map((r, idx) => ({
        posicao: idx + 1,
        aluno: r.name,
        instrumento: r.instrument,
        categoria: r.category,
        nivel: r.level,
        evolucao_delta: r.progressDelta,
        media_desempenho: r.avgScore,
        registros: r.totalLessons,
        estagnacao: r.flags?.stagnation ? 'Sim' : 'Não',
        acelerado: r.flags?.accelerated ? 'Sim' : 'Não',
        queda: r.flags?.decline ? 'Sim' : 'Não'
      }));
      await exportExcel({ rows, sheetName: 'RankingEvolucao', fileName: 'relatorio-coletivo-maestro.xlsx' });
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao exportar Excel.');
    }
  };

  const exportGraph = async () => {
    try {
      if (!chartRef.current) return;
      await exportChartAsImage(chartRef.current, 'relatorio-coletivo-graficos.png');
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao exportar gráfico.');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={styles.title}>Relatórios Coletivos</Text>
      <Text style={styles.subtitle}>Filtros por período, instrumento e categoria</Text>

      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Período inicial (YYYY-MM-DD)" placeholderTextColor={theme.colors.placeholder} value={filters.from} onChangeText={(v) => setFilters(f => ({ ...f, from: v }))} />
        <TextInput style={styles.input} placeholder="Período final (YYYY-MM-DD)" placeholderTextColor={theme.colors.placeholder} value={filters.to} onChangeText={(v) => setFilters(f => ({ ...f, to: v }))} />
        <TextInput style={styles.input} placeholder="Instrumento (opcional)" placeholderTextColor={theme.colors.placeholder} value={filters.instrument} onChangeText={(v) => setFilters(f => ({ ...f, instrument: v }))} />
        <TextInput style={styles.input} placeholder="Categoria (opcional)" placeholderTextColor={theme.colors.placeholder} value={filters.category} onChangeText={(v) => setFilters(f => ({ ...f, category: v }))} />
        <TextInput style={styles.input} placeholder="Instrutor ID (opcional / admin)" placeholderTextColor={theme.colors.placeholder} value={filters.instructor_id} onChangeText={(v) => setFilters(f => ({ ...f, instructor_id: v }))} />

        <View style={styles.row}>
          <TouchableOpacity style={styles.primaryBtn} onPress={load}><Text style={styles.primaryText}>Atualizar</Text></TouchableOpacity>
        </View>
      </View>

      <KpiCard title="Alunos (filtro)" value={group.kpis.studentsCount} subtitle={`Ativos: ${group.kpis.activeStudents}`} />
      <KpiCard title="Registros (filtro)" value={group.kpis.lessonsCount} subtitle={`Média geral: ${group.kpis.avgGroupScore}`} />
      <KpiCard title="Ranking / Alertas" value={group.ranking.length} subtitle={`Sem registro recente: ${group.noRegisterAlerts.length}`} />

      <ViewShot ref={chartRef}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registros por mês</Text>
          <LineChart
            data={{
              labels: group.lessonsGrowth.labels.length ? group.lessonsGrowth.labels : ['-'],
              datasets: [{ data: group.lessonsGrowth.data.length ? group.lessonsGrowth.data : [0] }]
            }}
            width={chartWidth - 24}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Média por instrumento</Text>
          <BarChart
            data={{
              labels: (group.avgByInstrument.map(i => i.instrument).slice(0, 6).map(s => String(s).slice(0, 6)) || ['-']),
              datasets: [{ data: (group.avgByInstrument.map(i => i.avgScore).slice(0, 6) || [0]) }]
            }}
            width={chartWidth - 24}
            height={240}
            chartConfig={chartConfig}
            fromZero
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </View>
      </ViewShot>

      <View style={styles.rowWrap}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={exportPdf}><Text style={styles.secondaryText}>Exportar PDF</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={exportXlsx}><Text style={styles.secondaryText}>Exportar Excel</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={exportGraph}><Text style={styles.secondaryText}>Exportar PNG</Text></TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ranking de evolução</Text>
        {group.ranking.length ? group.ranking.slice(0, 20).map((r, idx) => (
          <Text key={r.student_id} style={styles.listItem}>
            {idx + 1}. {r.name} • {r.instrument || '-'} • Δ {r.progressDelta} • Média {r.avgScore}
          </Text>
        )) : <Text style={styles.listItem}>Sem dados para o filtro.</Text>}
      </View>
    </ScrollView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    title: { fontSize: 22, fontWeight: '900', color: theme.colors.text },
    subtitle: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4, marginBottom: 12 },
    card: { backgroundColor: theme.colors.card, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 12 },
    input: { backgroundColor: theme.colors.inputBg, color: theme.colors.inputText, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 12, marginBottom: 10, fontWeight: '700' },
    row: { flexDirection: 'row', gap: 8 },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    primaryBtn: { flex: 1, backgroundColor: theme.colors.accent, padding: 12, borderRadius: 10, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '900' },
    secondaryBtn: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 10, borderRadius: 10 },
    secondaryText: { color: theme.colors.text, fontWeight: '900' },
    cardTitle: { fontWeight: '900', color: theme.colors.text, marginBottom: 8 },
    chart: { borderRadius: 12 },
    listItem: { color: theme.colors.textMuted, marginBottom: 5, fontSize: 13, fontWeight: '700' }
  });
}

import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { LineChart, BarChart } from 'react-native-chart-kit';

import { getDatasetForReports } from '../services/db';
import { buildGroupAnalytics } from '../utils/analytics';
import KpiCard from '../components/KpiCard';
import { useTheme } from '../theme/ThemeProvider';

const chartWidth = Dimensions.get('window').width - 32;

export default function DashboardScreen({ navigation }) {
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

  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState({ students: [], lessons: [] });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const from = dayjs().subtract(12, 'month').format('YYYY-MM-DD');
      const to = dayjs().format('YYYY-MM-DD');
      const data = await getDatasetForReports({ from, to });
      setDataset(data);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const group = useMemo(() => buildGroupAnalytics(dataset.students, dataset.lessons), [dataset]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={styles.title}>Dashboard Geral</Text>
      <Text style={styles.subtitle}>Visão rápida do grupo e alertas</Text>

      <KpiCard title="Alunos" value={group.kpis.studentsCount} subtitle={`Ativos: ${group.kpis.activeStudents}`} />
      <KpiCard title="Registros de aula" value={group.kpis.lessonsCount} />
      <KpiCard title="Média geral de desempenho" value={group.kpis.avgGroupScore} subtitle={`Último desempenho médio: ${group.kpis.avgLastScore}`} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Crescimento de registros por mês</Text>
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
        <Text style={styles.cardTitle}>Distribuição de níveis</Text>
        <BarChart
          data={{
            labels: (group.levelDistribution.map(i => i.level).slice(0, 6).map(s => String(s).slice(0, 6)) || ['-']),
            datasets: [{ data: (group.levelDistribution.map(i => i.count).slice(0, 6) || [0]) }]
          }}
          width={chartWidth - 24}
          height={240}
          chartConfig={chartConfig}
          fromZero
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Indicadores analíticos</Text>
        <Text style={styles.listItem}>• Estagnação: {group.kpis.stagnatedCount}</Text>
        <Text style={styles.listItem}>• Progresso acelerado: {group.kpis.acceleratedCount}</Text>
        <Text style={styles.listItem}>• Queda de desempenho: {group.kpis.declineCount}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Alunos sem registro recente</Text>
        {group.noRegisterAlerts.length ? group.noRegisterAlerts.slice(0, 8).map((a, idx) => (
          <Text key={idx} style={styles.listItem}>
            • {a.name} ({a.instrument || '-'}) — {a.daysNoRegister == null ? 'sem registros' : `${a.daysNoRegister} dias`}
          </Text>
        )) : <Text style={styles.listItem}>Nenhum alerta no momento.</Text>}
      </View>

      <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate('Relatórios')}>
        <Text style={styles.ctaText}>Abrir Relatórios Coletivos</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    title: { fontSize: 22, fontWeight: '900', color: theme.colors.text },
    subtitle: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4, marginBottom: 12 },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 12,
      marginBottom: 12
    },
    cardTitle: { fontWeight: '900', color: theme.colors.text, marginBottom: 8 },
    chart: { borderRadius: 12 },
    listItem: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 4, fontWeight: '700' },
    cta: { backgroundColor: theme.colors.accent, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
    ctaText: { color: '#fff', fontWeight: '900' }
  });
}

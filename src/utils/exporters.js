import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { captureRef } from 'react-native-view-shot';

async function shareIfPossible(uri, mimeType) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return uri;
  await Sharing.shareAsync(uri, mimeType ? { mimeType } : undefined);
  return uri;
}

export async function exportHtmlPdf({ html, fileName = 'relatorio.pdf' }) {
  const { uri } = await Print.printToFileAsync({ html });
  return shareIfPossible(uri, 'application/pdf');
}

export async function exportExcel({ rows, sheetName = 'Dados', fileName = 'relatorio.xlsx' }) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const uri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });

  return shareIfPossible(uri, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export async function exportJsonBackup(data, fileName = 'gem-backup.json') {
  const uri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2), {
    encoding: FileSystem.EncodingType.UTF8
  });
  return shareIfPossible(uri, 'application/json');
}

export async function exportChartAsImage(viewRef, fileName = 'grafico.png') {
  const uriCaptured = await captureRef(viewRef, { format: 'png', quality: 1 });
  return shareIfPossible(uriCaptured, 'image/png');
}

export function buildIndividualReportHtml({ student, analytics, lessons }) {
  const k = analytics.kpis;
  const flags = analytics.flags;
  return `
  <html>
    <body style="font-family: Arial; padding: 18px;">
      <h1>Relatório Individual - ${student.full_name}</h1>
      <p><b>Instrumento:</b> ${student.instrument || '-'} | <b>Categoria:</b> ${student.category || '-'} | <b>Nível:</b> ${student.level || '-'}</p>
      <p><b>Status:</b> ${student.status} | <b>Início:</b> ${student.start_date || '-'}</p>

      <h2>KPIs</h2>
      <ul>
        <li>Total de registros: ${k.totalLessons}</li>
        <li>Média de desempenho: ${k.avgScore}</li>
        <li>Último desempenho: ${k.lastScore}</li>
        <li>Evolução (delta): ${k.progressDelta}</li>
        <li>Progresso percentual: ${k.progressPercent}%</li>
        <li>Lições concluídas (registros com lição): ${k.lessonCount}</li>
        <li>Hinos estudados (estimado): ${k.hymnCount}</li>
        <li>Frequência média mensal: ${k.frequencyMonthlyAvg}</li>
        <li>Tempo médio entre evoluções: ${k.avgDaysBetweenEvolutions ?? 'N/D'} dias</li>
      </ul>

      <h2>Indicadores</h2>
      <ul>
        <li>Estagnação: ${flags.stagnation ? 'Sim' : 'Não'}</li>
        <li>Progresso acelerado: ${flags.accelerated ? 'Sim' : 'Não'}</li>
        <li>Queda de desempenho: ${flags.decline ? 'Sim' : 'Não'}</li>
      </ul>

      <h2>Comparação dos últimos meses</h2>
      <table border="1" cellspacing="0" cellpadding="6">
        <tr><th>Mês</th><th>Aulas</th><th>Média</th></tr>
        ${analytics.monthComparison.map(m => `<tr><td>${m.month}</td><td>${m.lessons}</td><td>${m.avgScore}</td></tr>`).join('')}
      </table>

      <h2>Histórico de aulas</h2>
      <table border="1" cellspacing="0" cellpadding="6">
        <tr>
          <th>Data</th><th>Método</th><th>Páginas</th><th>Lição</th><th>Hinos</th><th>Desempenho</th>
        </tr>
        ${lessons.map(l => `
          <tr>
            <td>${l.lesson_date || ''}</td>
            <td>${l.method_name || ''}</td>
            <td>${l.pages || ''}</td>
            <td>${l.lesson_name || ''}</td>
            <td>${l.hymns || ''}</td>
            <td>${l.performance_score ?? l.performance_concept ?? ''}</td>
          </tr>
        `).join('')}
      </table>
    </body>
  </html>`;
}

export function buildGroupReportHtml({ filters, group }) {
  return `
  <html>
    <body style="font-family: Arial; padding: 18px;">
      <h1>Relatório Coletivo - GEM</h1>
      <p><b>Período:</b> ${filters.from || '-'} até ${filters.to || '-'}</p>
      <p><b>Instrumento:</b> ${filters.instrument || 'Todos'} | <b>Categoria:</b> ${filters.category || 'Todas'}</p>

      <h2>KPIs</h2>
      <ul>
        <li>Alunos totais: ${group.kpis.studentsCount}</li>
        <li>Alunos ativos: ${group.kpis.activeStudents}</li>
        <li>Registros de aula: ${group.kpis.lessonsCount}</li>
        <li>Média geral: ${group.kpis.avgGroupScore}</li>
        <li>Média do último desempenho: ${group.kpis.avgLastScore}</li>
        <li>Estagnação: ${group.kpis.stagnatedCount}</li>
        <li>Acelerados: ${group.kpis.acceleratedCount}</li>
        <li>Queda: ${group.kpis.declineCount}</li>
      </ul>

      <h2>Média por instrumento</h2>
      <table border="1" cellspacing="0" cellpadding="6">
        <tr><th>Instrumento</th><th>Média</th><th>Qtd.</th></tr>
        ${group.avgByInstrument.map(r => `<tr><td>${r.instrument}</td><td>${r.avgScore}</td><td>${r.count}</td></tr>`).join('')}
      </table>

      <h2>Ranking de evolução</h2>
      <table border="1" cellspacing="0" cellpadding="6">
        <tr><th>Aluno</th><th>Instrumento</th><th>Nível</th><th>Evolução</th><th>Média</th></tr>
        ${group.ranking.slice(0, 30).map(r => `<tr><td>${r.name}</td><td>${r.instrument || ''}</td><td>${r.level || ''}</td><td>${r.progressDelta}</td><td>${r.avgScore}</td></tr>`).join('')}
      </table>
    </body>
  </html>`;
}

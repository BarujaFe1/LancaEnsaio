import dayjs from 'dayjs';

export function conceptToScore(concept) {
  const map = {
    excelente: 9,
    bom: 7.5,
    regular: 5.5,
    ruim: 3.5
  };
  if (!concept) return null;
  return map[String(concept).toLowerCase()] ?? null;
}

export function getLessonScore(lesson) {
  if (lesson.performance_score != null && lesson.performance_score !== '') return Number(lesson.performance_score);
  return conceptToScore(lesson.performance_concept);
}

function avg(arr) {
  const valid = arr.filter(v => Number.isFinite(v));
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function groupByMonth(items, dateField) {
  const out = {};
  for (const item of items) {
    const d = item?.[dateField];
    if (!d) continue;
    const key = dayjs(d).format('YYYY-MM');
    out[key] = out[key] || [];
    out[key].push(item);
  }
  return out;
}

function monthLabel(yyyyMm) {
  return dayjs(`${yyyyMm}-01`).format('MM/YY');
}

function movingAverage(values, window = 3) {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    return avg(values.slice(start, i + 1));
  });
}

function daysBetween(a, b) {
  return dayjs(b).diff(dayjs(a), 'day');
}

export function buildStudentAnalytics(student, lessons = []) {
  const ordered = [...lessons].sort((a, b) => dayjs(a.lesson_date).valueOf() - dayjs(b.lesson_date).valueOf());
  const scores = ordered.map(getLessonScore);
  const validScores = scores.filter(v => Number.isFinite(v));

  const monthly = groupByMonth(ordered, 'lesson_date');
  const monthKeys = Object.keys(monthly).sort();

  const lessonsPerMonth = monthKeys.map(k => monthly[k].length);
  const avgScorePerMonth = monthKeys.map(k => avg(monthly[k].map(getLessonScore)));

  const lastScore = validScores.length ? validScores[validScores.length - 1] : 0;
  const firstScore = validScores.length ? validScores[0] : 0;
  const progressDelta = Number((lastScore - firstScore).toFixed(2));
  const progressPercent = Math.max(0, Math.min(100, Math.round((lastScore / 10) * 100)));

  const ma = movingAverage(validScores, 3);
  const maLast = ma.length ? ma[ma.length - 1] : 0;
  const stagnation = validScores.length >= 3
    ? (Math.max(...validScores.slice(-3)) - Math.min(...validScores.slice(-3)) <= 0.5)
    : false;

  const accelerated = validScores.length >= 4
    ? (validScores[validScores.length - 1] - avg(validScores.slice(-4, -1))) >= 1.0
    : false;

  const decline = validScores.length >= 2
    ? (validScores[validScores.length - 1] < validScores[validScores.length - 2] - 0.8)
    : false;

  const skillAverages = {
    Ritmo: avg(ordered.map(l => Number(l.skill_rhythm))),
    Leitura: avg(ordered.map(l => Number(l.skill_reading))),
    Técnica: avg(ordered.map(l => Number(l.skill_technique))),
    Postura: avg(ordered.map(l => Number(l.skill_posture))),
    Musicalidade: avg(ordered.map(l => Number(l.skill_musicality)))
  };

  const hymnCount = ordered.reduce((acc, l) => {
    if (!l.hymns) return acc;
    return acc + String(l.hymns).split(',').map(s => s.trim()).filter(Boolean).length;
  }, 0);

  const lessonCount = ordered.filter(l => l.lesson_name).length;
  const attendanceCount = ordered.filter(l => l.attendance !== false).length;

  const evolDates = ordered.filter((l, i) => i > 0 && Number.isFinite(getLessonScore(l)) && Number.isFinite(getLessonScore(ordered[i - 1])) && (getLessonScore(l) - getLessonScore(ordered[i - 1]) >= 0.5)).map(l => l.lesson_date);
  let avgDaysBetweenEvolutions = null;
  if (evolDates.length >= 2) {
    const diffs = [];
    for (let i = 1; i < evolDates.length; i++) diffs.push(daysBetween(evolDates[i - 1], evolDates[i]));
    avgDaysBetweenEvolutions = Math.round(avg(diffs));
  }

  const lastLessonDate = ordered.length ? ordered[ordered.length - 1].lesson_date : null;
  const daysNoRegister = lastLessonDate ? dayjs().diff(dayjs(lastLessonDate), 'day') : null;

  return {
    kpis: {
      studentName: student?.full_name,
      totalLessons: ordered.length,
      attendanceCount,
      lessonCount,
      hymnCount,
      avgScore: Number(avg(validScores).toFixed(2)),
      lastScore: Number(lastScore.toFixed(2)),
      progressDelta,
      progressPercent,
      avgDaysBetweenEvolutions,
      frequencyMonthlyAvg: Number(avg(lessonsPerMonth).toFixed(2)),
      daysNoRegister
    },
    flags: {
      stagnation,
      accelerated,
      decline
    },
    charts: {
      lineEvolution: {
        labels: ordered.map(l => dayjs(l.lesson_date).format('DD/MM')).slice(-8),
        data: ordered.map(getLessonScore).map(v => v ?? 0).slice(-8)
      },
      barLessonsByMonth: {
        labels: monthKeys.map(monthLabel).slice(-6),
        data: lessonsPerMonth.slice(-6)
      },
      lineAvgByMonth: {
        labels: monthKeys.map(monthLabel).slice(-6),
        data: avgScorePerMonth.map(v => Number((v || 0).toFixed(2))).slice(-6)
      },
      radarSkills: skillAverages
    },
    monthComparison: monthKeys.slice(-2).map(k => ({
      month: monthLabel(k),
      lessons: monthly[k].length,
      avgScore: Number(avg(monthly[k].map(getLessonScore)).toFixed(2))
    })),
    timeline: ordered
  };
}

export function buildGroupAnalytics(students = [], lessons = []) {
  const byStudent = {};
  for (const l of lessons) {
    byStudent[l.student_id] = byStudent[l.student_id] || [];
    byStudent[l.student_id].push(l);
  }

  const studentReports = students.map(s => ({
    student: s,
    report: buildStudentAnalytics(s, byStudent[s.id] || [])
  }));

  const validReports = studentReports.filter(r => r.report.kpis.totalLessons > 0);

  const avgGroupScore = avg(validReports.map(r => r.report.kpis.avgScore));
  const avgLastScore = avg(validReports.map(r => r.report.kpis.lastScore));

  const instrumentBuckets = {};
  for (const r of validReports) {
    const key = r.student.instrument || 'Não informado';
    instrumentBuckets[key] = instrumentBuckets[key] || [];
    instrumentBuckets[key].push(r.report.kpis.avgScore);
  }
  const avgByInstrument = Object.entries(instrumentBuckets).map(([instrument, scores]) => ({
    instrument,
    avgScore: Number(avg(scores).toFixed(2)),
    count: scores.length
  })).sort((a, b) => b.avgScore - a.avgScore);

  const levelDistMap = {};
  for (const s of students) levelDistMap[s.level || 'Não informado'] = (levelDistMap[s.level || 'Não informado'] || 0) + 1;
  const levelDistribution = Object.entries(levelDistMap).map(([level, count]) => ({ level, count }));

  const categoryBuckets = {};
  for (const r of validReports) {
    const key = r.student.category || 'Não informado';
    categoryBuckets[key] = categoryBuckets[key] || [];
    categoryBuckets[key].push(r.report.kpis.avgScore);
  }
  const avgByCategory = Object.entries(categoryBuckets).map(([category, scores]) => ({
    category,
    avgScore: Number(avg(scores).toFixed(2)),
    count: scores.length
  })).sort((a, b) => b.avgScore - a.avgScore);

  const ranking = studentReports
    .map(r => ({
      student_id: r.student.id,
      name: r.student.full_name,
      instrument: r.student.instrument,
      category: r.student.category,
      level: r.student.level,
      progressDelta: r.report.kpis.progressDelta,
      avgScore: r.report.kpis.avgScore,
      totalLessons: r.report.kpis.totalLessons,
      flags: r.report.flags
    }))
    .sort((a, b) => b.progressDelta - a.progressDelta);

  const lessonMonths = groupByMonth(lessons, 'lesson_date');
  const lessonMonthKeys = Object.keys(lessonMonths).sort();
  const lessonsGrowth = {
    labels: lessonMonthKeys.map(monthLabel).slice(-6),
    data: lessonMonthKeys.map(k => lessonMonths[k].length).slice(-6)
  };

  const startMonths = groupByMonth(students, 'start_date');
  const startMonthKeys = Object.keys(startMonths).sort();
  let running = 0;
  const growthSeries = startMonthKeys.map(k => {
    running += startMonths[k].length;
    return { month: monthLabel(k), total: running };
  });

  const noRegisterAlerts = studentReports
    .filter(r => (r.report.kpis.daysNoRegister ?? 9999) > 21 || r.report.kpis.totalLessons === 0)
    .map(r => ({
      name: r.student.full_name,
      instrument: r.student.instrument,
      daysNoRegister: r.report.kpis.daysNoRegister
    }));

  return {
    kpis: {
      studentsCount: students.length,
      activeStudents: students.filter(s => s.status === 'ativo').length,
      lessonsCount: lessons.length,
      avgGroupScore: Number(avgGroupScore.toFixed(2)),
      avgLastScore: Number(avgLastScore.toFixed(2)),
      stagnatedCount: ranking.filter(r => r.flags.stagnation).length,
      acceleratedCount: ranking.filter(r => r.flags.accelerated).length,
      declineCount: ranking.filter(r => r.flags.decline).length
    },
    ranking,
    avgByInstrument,
    avgByCategory,
    levelDistribution,
    lessonsGrowth,
    groupGrowth: growthSeries,
    noRegisterAlerts
  };
}

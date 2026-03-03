
import { supabase } from '../lib/supabase';
import { logError } from '../utils/logger'

function throwIfError(error, context = 'DB') {
  if (!error) return;
  logError(`Supabase error: ${context}`, error, {
    code: error.code,
    details: error.details,
    hint: error.hint,
    message: error.message
  });
  throw error;
}


export async function getMyProfile() {
  const { data: authData } = await supabase.auth.getUser();
  const uid = authData?.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();

  if (error && error.code === 'PGRST116') return null;
  throwIfError(error);
  return data;
}

export async function upsertMyProfileName(full_name) {
  const { data: authData } = await supabase.auth.getUser();
  const uid = authData?.user?.id;
  if (!uid) throw new Error('Usuário não autenticado');

  const { error } = await supabase.from('profiles').upsert({
    id: uid,
    full_name,
    role: 'instrutor'
  });

  throwIfError(error);
  return true;
}

export async function listStudents(filters = {}) {
  let q = supabase.from('students').select('*').order('full_name', { ascending: true });

  if (filters.search) q = q.ilike('full_name', `%${filters.search}%`);
  if (filters.instrument) q = q.eq('instrument', filters.instrument);
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.level) q = q.eq('level', filters.level);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.instructor_id) q = q.eq('owner_id', filters.instructor_id);

  const { data, error } = await q;
  throwIfError(error);
  return data || [];
}

export async function listStudentsBasic() {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, instrument, category, level, congregation, status')
    .order('full_name', { ascending: true });

  throwIfError(error);
  return data || [];
}

export async function getStudentById(id) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  throwIfError(error);
  return data;
}

export async function saveStudent(student) {
  const payload = {
    id: student.id || undefined,
    full_name: student.full_name?.trim(),
    instrument: student.instrument?.trim() || '',
    category: student.category?.trim() || '', // família
    level: student.level?.trim() || '', // graduação
    start_date: student.start_date,
    status: student.status || 'ativo',
    observations: student.observations || null,
    congregation: student.congregation || null,
    address: student.address || null,
    phone: student.phone || null,
    birth_date: student.birth_date || null,
    baptism_date: student.baptism_date || null,
    instrument_change_note: student.instrument_change_note || null
  };

  if (student.id) {
    const { data, error } = await supabase
      .from('students')
      .update(payload)
      .eq('id', student.id)
      .select()
      .single();

    throwIfError(error);
    return data;
  }

  const { data, error } = await supabase
    .from('students')
    .insert(payload)
    .select()
    .single();

  throwIfError(error);
  return data;
}

export async function deleteStudent(id) {
  const { error } = await supabase.from('students').delete().eq('id', id);
  throwIfError(error);
  return true;
}

export async function listTeachers() {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('full_name', { ascending: true });

  throwIfError(error);
  return data || [];
}

export async function saveTeacher(teacher) {
  const payload = {
    id: teacher.id || undefined,
    full_name: teacher.full_name?.trim(),
    instrument: teacher.instrument?.trim() || '',
    congregation: teacher.congregation || null,
    role_kind: teacher.role_kind || 'Instrutor',
    active: teacher.active ?? true
  };

  if (teacher.id) {
    const { data, error } = await supabase
      .from('teachers')
      .update(payload)
      .eq('id', teacher.id)
      .select()
      .single();

    throwIfError(error);
    return data;
  }

  const { data, error } = await supabase
    .from('teachers')
    .insert(payload)
    .select()
    .single();

  throwIfError(error);
  return data;
}

export async function deleteTeacher(id) {
  const { error } = await supabase.from('teachers').delete().eq('id', id);
  throwIfError(error);
  return true;
}

export async function listMethods() {
  const { data, error } = await supabase
    .from('methods')
    .select('*')
    .order('name', { ascending: true });

  throwIfError(error);
  return data || [];
}

export async function saveMethod(method) {
  const payload = {
    id: method.id || undefined,
    name: method.name?.trim(),
    instruments: method.instruments || [],
    active: method.active ?? true,
    notes: method.notes || null
  };

  if (method.id) {
    const { data, error } = await supabase
      .from('methods')
      .update(payload)
      .eq('id', method.id)
      .select()
      .single();

    throwIfError(error);
    return data;
  }

  const { data, error } = await supabase
    .from('methods')
    .insert(payload)
    .select()
    .single();

  throwIfError(error);
  return data;
}

export async function deleteMethod(id) {
  const { error } = await supabase.from('methods').delete().eq('id', id);
  throwIfError(error);
  return true;
}

export async function listLessonsByStudent(studentId) {
  const { data, error } = await supabase
    .from('lesson_records')
    .select('*')
    .eq('student_id', studentId)
    .order('lesson_date', { ascending: false })
    .order('created_at', { ascending: false });

  throwIfError(error, 'listLessonsByStudent');
  return data || [];
}

export async function listRecentLessons(limit = 30) {
  const { data: lessons, error } = await supabase
    .from('lesson_records')
    .select(`
      id, 
      lesson_date, 
      launched_at, 
      student_id, 
      teacher_id, 
      method_id, 
      content_items, 
      page_items, 
      lesson_items
    `)
    .order('launched_at', { ascending: false })
    .limit(limit);

  throwIfError(error, 'listRecentLessons');
  const list = lessons || [];

  // Coleta IDs únicos
  const studentIds = [...new Set(list.map(l => l.student_id).filter(Boolean))];
  const teacherIds = [...new Set(list.map(l => l.teacher_id).filter(Boolean))];
  const methodIds  = [...new Set(list.map(l => l.method_id).filter(Boolean))];

  let studentsMap = {};
  let teachersMap = {};
  let methodsMap = {};

  // Buscas paralelas para otimizar tempo
  if (studentIds.length) {
    const r = await supabase.from('students').select('id, full_name').in('id', studentIds);
    throwIfError(r.error, 'listRecentLessons.students');
    (r.data || []).forEach(s => { studentsMap[s.id] = s.full_name; });
  }

  if (teacherIds.length) {
    const r = await supabase.from('teachers').select('id, full_name').in('id', teacherIds);
    throwIfError(r.error, 'listRecentLessons.teachers');
    (r.data || []).forEach(t => { teachersMap[t.id] = t.full_name; });
  }

  if (methodIds.length) {
    const r = await supabase.from('methods').select('id, name').in('id', methodIds);
    throwIfError(r.error, 'listRecentLessons.methods');
    (r.data || []).forEach(m => { methodsMap[m.id] = m.name; });
  }

  return list.map(l => ({
    ...l,
    student_name: studentsMap[l.student_id] || 'N/A',
    teacher_name: teachersMap[l.teacher_id] || 'N/A',
    method_name_resolved: methodsMap[l.method_id] || 'N/A'
  }));
}


export async function saveLesson(lesson) {
  const payload = {
    student_id: lesson.student_id,
    teacher_id: lesson.teacher_id,
    method_id: lesson.method_id,
    lesson_date: lesson.lesson_date,
    content_group: lesson.content_group,
    content_number: lesson.content_number,
    voices: lesson.voices,
    solfejo: lesson.solfejo,
    observations: lesson.observations,
    // Novos campos de array para múltiplos itens
    content_items: Array.isArray(lesson.content_items) ? lesson.content_items : [],
    page_items: Array.isArray(lesson.page_items) ? lesson.page_items : [],
    lesson_items: Array.isArray(lesson.lesson_items) ? lesson.lesson_items : [],
    launched_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('lesson_records')
    .upsert(lesson.id ? { ...payload, id: lesson.id } : payload)
    .select();

  throwIfError(error, 'saveLesson');
  return data?.[0];
}

export async function deleteLesson(id) {
  const { error } = await supabase.from('lesson_records').delete().eq('id', id);
  throwIfError(error);
  return true;
}

export async function getDatasetForReports({ from, to, instrument, category, instructor_id } = {}) {
  const students = await listStudents({ instrument, category, instructor_id });

  const ids = students.map((s) => s.id);
  if (!ids.length) return { students: [], lessons: [] };

  let q = supabase.from('lesson_records').select('*').in('student_id', ids);

  if (from) q = q.gte('lesson_date', from);
  if (to) q = q.lte('lesson_date', to);

  const { data, error } = await q.order('lesson_date', { ascending: true });
  throwIfError(error);

  return { students, lessons: data || [] };
}

export async function getRawBackupData() {
  const students = await listStudents({});
  const lessonsQuery = await supabase.from('lesson_records').select('*');
  throwIfError(lessonsQuery.error);

  const teachers = await listTeachers();
  const methods = await listMethods();

  return {
    exported_at: new Date().toISOString(),
    students,
    lessons: lessonsQuery.data || [],
    teachers,
    methods
  };
}


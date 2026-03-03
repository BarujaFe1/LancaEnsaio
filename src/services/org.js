// Para que serve: funções para uso coletivo (entrar na equipe e ler organização atual).
// Onde colar: crie este arquivo em /src/services/org.js

import { supabase } from '../lib/supabase';

function throwIfError(error, ctx) {
  if (!error) return;
  const msg = ctx ? `${ctx}: ${error.message}` : error.message;
  const e = new Error(msg);
  e.original = error;
  throw e;
}

export async function joinOrgByCode(code) {
  const { data, error } = await supabase.rpc('join_org_by_code', { p_code: code });
  throwIfError(error, 'joinOrgByCode');
  return Array.isArray(data) ? data[0] : data;
}

export async function getMyOrg() {
  const { data: authData } = await supabase.auth.getUser();
  const uid = authData?.user?.id;
  if (!uid) return null;

  const { data: prof, error: e1 } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', uid)
    .single();

  throwIfError(e1, 'getMyOrg.profile');

  if (!prof?.org_id) return null;

  const { data: org, error: e2 } = await supabase
    .from('organizations')
    .select('id, name, join_code')
    .eq('id', prof.org_id)
    .single();

  throwIfError(e2, 'getMyOrg.org');
  return org;
}

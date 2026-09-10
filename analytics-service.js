(() => {
  'use strict';
  let client;
  const db = () => {
    const config = window.APP_CONFIG || {};
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY || config.SUPABASE_URL.includes('COLE_AQUI')) throw new Error('A conexão com o banco não foi configurada.');
    if (!window.supabase) throw new Error('Não foi possível carregar a conexão. Verifique sua internet e tente novamente.');
    return client || (client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY));
  };
  const unwrap = response => { if (response.error) throw response.error; return response.data; };
  window.SamplingService = {
    async session() { return unwrap(await db().auth.getSession()).session; },
    async profile(userId) { return unwrap(await db().from('profiles').select('display_name,role').eq('id', userId).single()); },
    async list() {
      // Pagination avoids silently truncating dashboards at Supabase's row limit.
      const rows = [];
      for (let offset = 0; ; offset += 500) {
        const page = unwrap(await db().from('sample_records').select('*').order('id').range(offset, offset + 499));
        rows.push(...page);
        if (page.length < 500) return rows;
      }
    },
    async save(id, values) {
      const query = id == null ? db().from('sample_records').insert(values) : db().from('sample_records').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id);
      return unwrap(await query.select().single());
    },
    async remove(id) {
      const rows = unwrap(await db().from('sample_records').delete().eq('id', id).select('id'));
      if (!rows.length) throw new Error('O registro não foi excluído. Confira sua permissão e atualize os dados.');
    },
    async signOut() { unwrap(await db().auth.signOut()); }
  };
})();

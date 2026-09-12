(() => {
  'use strict';
  let client;
  const n = value => Number(value) || 0;
  const contacted = row => n(row.confirmed) + n(row.not_confirmed) + n(row.does_not_know) + n(row.mailbox);
  const key = row => `${row.coordinator || ''}\u0000${row.leader || ''}`;
  const db = () => {
    const cfg = window.APP_CONFIG || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_URL.includes('COLE_AQUI')) throw new Error('A conexão com o Supabase não foi configurada.');
    return client || (client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY));
  };
  const unwrap = response => { if (response.error) throw response.error; return response.data; };
  async function list(table, order) {
    const rows = [];
    for (let start = 0; ; start += 500) {
      const page = unwrap(await db().from(table).select('*').order(order).range(start, start + 499));
      rows.push(...page); if (page.length < 500) return rows;
    }
  }
  function aggregate(base, daily) {
    const groups = new Map();
    base.forEach(row => {
      const id = key(row);
      if (!groups.has(id)) groups.set(id, { coordinator:row.coordinator || '', leader:row.leader || '', total_base:0, confirmed:0, not_confirmed:0, does_not_know:0, mailbox:0 });
      groups.get(id).total_base += n(row.total_base);
    });
    daily.forEach(row => {
      const id = key(row);
      if (!groups.has(id)) groups.set(id, { coordinator:row.coordinator || '', leader:row.leader || '', total_base:0, confirmed:0, not_confirmed:0, does_not_know:0, mailbox:0 });
      const target = groups.get(id);
      ['confirmed','not_confirmed','does_not_know','mailbox'].forEach(field => target[field] += n(row[field]));
    });
    return [...groups.values()].map(row => ({ ...row, contacted:contacted(row), pending:n(row.total_base) - contacted(row) }));
  }
  function summary(rows) {
    const total = rows.reduce((out, row) => { ['total_base','confirmed','not_confirmed','does_not_know','mailbox'].forEach(field => out[field] += n(row[field])); return out; }, {total_base:0,confirmed:0,not_confirmed:0,does_not_know:0,mailbox:0});
    total.contacted = contacted(total); total.pending = total.total_base - total.contacted;
    total.coverage = total.total_base ? total.contacted / total.total_base * 100 : 0;
    total.confirmation = total.contacted ? total.confirmed / total.contacted * 100 : 0;
    return total;
  }
  window.DailyData = {
    n, contacted, aggregate, summary,
    async session() { return unwrap(await db().auth.getSession()).session; },
    async profile(id) { return unwrap(await db().from('profiles').select('display_name,role').eq('id', id).single()); },
    async load() { const [base, daily] = await Promise.all([list('sample_records','id'), list('daily_records','record_date')]); return {base,daily}; },
    async saveDaily(id, value) { const query = id ? db().from('daily_records').update({...value,updated_at:new Date().toISOString()}).eq('id',id) : db().from('daily_records').insert(value); return unwrap(await query.select().single()); },
    async signOut() { unwrap(await db().auth.signOut()); }
  };
})();

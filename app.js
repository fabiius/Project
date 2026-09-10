(() => {
  const cfg = window.APP_CONFIG || {};
  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes('COLE_AQUI')) { location.replace('login.html'); return; }
  const db = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const fields = ['coordinator', 'leader', 'total_base', 'confirmed', 'not_confirmed', 'does_not_know', 'mailbox'];
  const numericFields = new Set(fields.slice(2));
  let records = [], selected = 'ALL', isAdmin = false, chart;

  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[char]);
  const contact = r => (+r.confirmed || 0) + (+r.not_confirmed || 0) + (+r.does_not_know || 0) + (+r.mailbox || 0);
  const rate = r => { const n = contact(r); return n ? ((+r.confirmed || 0) / n) * 100 : 0; };
  const visible = () => selected === 'ALL' ? records : records.filter(r => r.coordinator === selected);

  async function initialize() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) { location.replace('login.html'); return; }
    const { data: profile, error } = await db.from('profiles').select('display_name, role').single();
    if (error) { alert('Não foi possível carregar seu perfil. Verifique a configuração do banco.'); return; }
    isAdmin = profile.role === 'admin';
    document.querySelector('#user-name').textContent = profile.display_name;
    document.querySelector('#role-badge').textContent = isAdmin ? 'Administrador' : 'Usuário';
    document.querySelector('#logout').onclick = async () => { await db.auth.signOut(); location.replace('login.html'); };
    document.querySelector('#add').onclick = addRecord;
    document.querySelector('#filter').onchange = e => { selected = e.target.value; render(); };
    await loadRecords();
  }

  async function loadRecords() {
    const { data, error } = await db.from('sample_records').select('*').order('id');
    if (error) { alert('Erro ao carregar os registros: ' + error.message); return; }
    records = data; render();
  }

  function render() {
    const data = visible(), select = document.querySelector('#filter');
    const names = [...new Set(records.map(r => r.coordinator).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    select.innerHTML = `<option value="ALL">Todos os coordenadores</option>${names.map(n => `<option value="${safe(n)}">${safe(n)}</option>`).join('')}`;
    if (!names.includes(selected)) selected = 'ALL'; select.value = selected;
    document.querySelector('#info').textContent = `${data.length} registro${data.length === 1 ? '' : 's'} exibido${data.length === 1 ? '' : 's'}`;
    renderRows(data); renderCards(data); renderRanking(data); renderChart(data); lucide.createIcons();
  }

  function renderRows(data) {
    const body = document.querySelector('#rows');
    body.innerHTML = data.map(r => `<tr data-id="${r.id}">
      ${fields.map(f => `<td><input class="cell" data-field="${f}" ${numericFields.has(f) ? 'type="number" min="0"' : ''} value="${safe(r[f])}"></td>`).join('')}
      <td class="font-bold text-indigo-600">${contact(r)}</td><td class="font-bold">${rate(r).toFixed(1).replace('.', ',')}%</td>
      <td>${isAdmin ? '<button data-delete class="text-rose-600 font-semibold">Excluir</button>' : '<span class="text-slate-300">—</span>'}</td></tr>`).join('');
    body.querySelectorAll('input').forEach(input => input.addEventListener('change', saveField));
    body.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => deleteRecord(+button.closest('tr').dataset.id)));
    const total = data.reduce((a,r) => ({ total_base:a.total_base + (+r.total_base||0), confirmed:a.confirmed + (+r.confirmed||0), not_confirmed:a.not_confirmed + (+r.not_confirmed||0), does_not_know:a.does_not_know + (+r.does_not_know||0), mailbox:a.mailbox + (+r.mailbox||0) }), {total_base:0,confirmed:0,not_confirmed:0,does_not_know:0,mailbox:0});
    document.querySelector('#totals').innerHTML = `<tr class="bg-slate-50 font-bold"><td colspan="2">Consolidado</td><td>${total.total_base}</td><td>${total.confirmed}</td><td>${total.not_confirmed}</td><td>${total.does_not_know}</td><td>${total.mailbox}</td><td>${contact(total)}</td><td>${rate(total).toFixed(1).replace('.', ',')}%</td><td></td></tr>`;
  }

  function renderCards(data) {
    const groups = {};
    data.forEach(r => { const key = r.coordinator || 'Sem coordenador'; (groups[key] ||= []).push(r); });
    document.querySelector('#cards').innerHTML = Object.entries(groups).map(([name, list]) => {
      const total = list.reduce((n,r) => n + (+r.total_base || 0), 0), c = list.reduce((n,r) => n + contact(r), 0), confirmed = list.reduce((n,r) => n + (+r.confirmed || 0), 0);
      const sample = total ? c * 100 / total : 0, confirm = c ? confirmed * 100 / c : 0;
      return `<article class="card p-5"><div class="flex justify-between gap-2"><div><h3 class="font-bold text-slate-900">${safe(name)}</h3><p class="text-xs text-slate-500">${list.length} líder(es)</p></div><span class="badge">${confirm.toFixed(1).replace('.', ',')}%</span></div><div class="mt-5 text-sm text-slate-600">Amostragem: <strong>${c} / ${total}</strong> (${sample.toFixed(0)}%)</div><div class="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden"><div class="h-full bg-blue-600" style="width:${Math.min(sample,100)}%"></div></div></article>`;
    }).join('') || '<p class="text-slate-500">Nenhum registro para este filtro.</p>';
  }

  function renderRanking(data) {
    const ranking = [...data].sort((a,b) => rate(b) - rate(a));
    document.querySelector('#ranking').innerHTML = ranking.map((r,i) => `<div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span><strong class="mr-2 text-blue-600">${i + 1}º</strong>${safe(r.leader)}</span><strong>${rate(r).toFixed(1).replace('.', ',')}%</strong></div>`).join('') || '<p class="text-sm text-slate-500">Sem dados.</p>';
  }

  function renderChart(data) {
    const ctx = document.querySelector('#chart'); if (chart) chart.destroy();
    chart = new Chart(ctx, { type:'bar', data:{ labels:data.map(r => r.leader), datasets:[{ data:data.map(rate), backgroundColor:'#2563eb', borderRadius:6 }] }, options:{ maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ y:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%'}}, x:{grid:{display:false}} } } });
  }

  async function saveField(event) {
    const row = event.target.closest('tr'), id = +row.dataset.id, field = event.target.dataset.field;
    const value = numericFields.has(field) ? Math.max(0, Number(event.target.value) || 0) : event.target.value.trim();
    const { error } = await db.from('sample_records').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { alert('Não foi possível salvar: ' + error.message); await loadRecords(); return; }
    Object.assign(records.find(r => r.id === id), { [field]: value }); render();
  }

  async function addRecord() {
    const defaults = { coordinator:selected === 'ALL' ? 'Novo Coordenador' : selected, leader:'Novo Líder', total_base:0, confirmed:0, not_confirmed:0, does_not_know:0, mailbox:0 };
    const { data, error } = await db.from('sample_records').insert(defaults).select().single();
    if (error) { alert('Não foi possível adicionar: ' + error.message); return; } records.push(data); render();
  }

  async function deleteRecord(id) {
    if (!confirm('Excluir este registro?')) return;
    const { error } = await db.from('sample_records').delete().eq('id', id);
    if (error) { alert('Apenas o administrador pode excluir registros.'); return; }
    records = records.filter(r => r.id !== id); render();
  }
  initialize();
})();

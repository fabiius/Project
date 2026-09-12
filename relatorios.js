(() => {
  'use strict';
  const A = window.AppLayout, D = window.DailyData, $ = selector => document.querySelector(selector);
  let base = [], daily = [], chart;
  const enabled = option => document.querySelector(`[data-option="${option}"]`).checked;
  const iso = date => date.toLocaleDateString('en-CA');
  function selectedRows() {
    const from = $('#from').value, to = $('#to').value, coordinator = $('#coordinator').value, leader = $('#leader').value;
    return daily.filter(row => (!from || row.record_date >= from) && (!to || row.record_date <= to) && (!coordinator || row.coordinator === coordinator) && (!leader || row.leader === leader));
  }
  function render() {
    const rows = selectedRows(), total = D.summary(D.aggregate(base, rows));
    const label = `Período: ${$('#from').value.split('-').reverse().join('/')} até ${$('#to').value.split('-').reverse().join('/')}`;
    $('#period-label').textContent = label;
    const metrics = [['Base',total.total_base],['Contatados',total.contacted],['Confirmados',total.confirmed],['Pendentes',total.pending]];
    $('#kpis').innerHTML = metrics.filter(([name]) => name === 'Base' || enabled(name.toLowerCase())).map(([name,value]) => {
      const detail = name === 'Base' ? 'Pessoas únicas' : name === 'Contatados' ? A.percent(total.coverage) : name === 'Confirmados' ? A.percent(total.confirmation) : 'Ainda não contatados';
      return `<article class="kpi"><div class="kpi-heading">${name}</div><div class="kpi-value">${A.integer(value)}</div><small>${detail}</small></article>`;
    }).join('');
    const days = {};
    rows.forEach(row => { const item = days[row.record_date] ||= {contacted:0,confirmed:0}; item.contacted += D.contacted(row); item.confirmed += D.n(row.confirmed); });
    const labels = Object.keys(days).sort();
    chart?.destroy(); $('#chart-box').hidden = !enabled('bars');
    if (enabled('bars')) chart = new Chart($('#chart'), { type:'bar', data:{labels,datasets:[{label:'Contatados',data:labels.map(day => days[day].contacted),backgroundColor:'#1260ed'},{label:'Confirmados',data:labels.map(day => days[day].confirmed),backgroundColor:'#159861'}]}, options:{responsive:true,maintainAspectRatio:false} });
    const groups = {};
    rows.forEach(row => { const name = `${row.coordinator} — ${row.leader}`, item = groups[name] ||= {name,confirmed:0}; item.confirmed += D.n(row.confirmed); });
    const ranking = Object.values(groups).sort((a,b) => b.confirmed - a.confirmed).slice(0,10).map((row,index) => `<div class="rank-item"><span class="rank-number">${index + 1}º</span><div class="rank-name"><span>${A.esc(row.name)}</span><strong>${A.integer(row.confirmed)} confirmados</strong></div></div>`).join('') || '<p class="empty">Sem lançamentos no período.</p>';
    $('#ranking').innerHTML = enabled('ranking') ? `<h3>Ranking de líderes</h3>${ranking}` : '';
    return {rows,total,label,days};
  }
  function quick(kind) {
    const end = new Date(), start = new Date(end);
    if (kind === 'yesterday') { start.setDate(end.getDate() - 1); end.setDate(end.getDate() - 1); }
    if (kind === '5days') start.setDate(end.getDate() - 4);
    if (kind === 'week') start.setDate(end.getDate() - end.getDay());
    if (kind === 'month') start.setDate(1);
    $('#from').value = iso(start); $('#to').value = iso(end); render();
  }
  function exportExcel() {
    const report = render(), book = XLSX.utils.book_new();
    const summary = [{Indicador:'Período',Valor:report.label},{Indicador:'Base única',Valor:report.total.total_base},{Indicador:'Contatados',Valor:report.total.contacted},{Indicador:'Confirmados',Valor:report.total.confirmed},{Indicador:'Pendentes',Valor:report.total.pending},{Indicador:'Cobertura',Valor:A.percent(report.total.coverage)},{Indicador:'Taxa de confirmação',Valor:A.percent(report.total.confirmation)}];
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(summary), 'Resumo');
    if (enabled('daily')) XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(Object.entries(report.days).map(([date, values]) => ({Data:date,Contatados:values.contacted,Confirmados:values.confirmed}))), 'Evolução diária');
    if (enabled('details')) XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(report.rows.map(row => ({Data:row.record_date,Coordenador:row.coordinator,Líder:row.leader,Contatados:D.contacted(row),Confirmados:row.confirmed,'Não confirmados':row.not_confirmed,'Não conhece':row.does_not_know,'Caixa postal':row.mailbox,Observações:row.notes}))), 'Detalhamento');
    XLSX.writeFile(book, `Relatorio_${$('#from').value}_a_${$('#to').value}.xlsx`); $('#status').textContent = 'Excel preparado para download.';
  }
  function printPdf() { render(); document.title = `Relatório ${$('#from').value} a ${$('#to').value}`; window.print(); $('#status').textContent = 'Use “Salvar como PDF” na janela de impressão para baixar o PDF com as seleções exibidas.'; }
  async function start() {
    try {
      if (!await A.setup()) return;
      ({base,daily} = await D.load());
      $('#coordinator').innerHTML += [...new Set(base.map(row => row.coordinator))].filter(Boolean).map(value => `<option value="${A.esc(value)}">${A.esc(value)}</option>`).join('');
      $('#leader').innerHTML += [...new Set(base.map(row => row.leader))].filter(Boolean).map(value => `<option value="${A.esc(value)}">${A.esc(value)}</option>`).join('');
      quick('5days');
      document.querySelectorAll('input,select,textarea').forEach(input => input.addEventListener('change', render));
      document.querySelectorAll('[data-period]').forEach(button => button.onclick = () => quick(button.dataset.period));
      $('#excel').onclick = exportExcel; $('#print').onclick = printPdf;
      $('#notice').hidden = true; $('#content').hidden = false; window.lucide?.createIcons();
    } catch (error) { $('#notice').textContent = `Não foi possível carregar os dados: ${error.message}`; $('#notice').classList.add('error'); }
  }
  start();
})();

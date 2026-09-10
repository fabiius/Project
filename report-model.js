(() => {
  'use strict';
  const M = window.SamplingMetrics;
  const criteria = {confirmation:'Taxa de confirmação', coverage:'Cobertura', contacted:'Volume de contatos'};
  function create(records, options = {}) {
    const minimum = Number(options.minimum || 0);
    if (!Number.isSafeInteger(minimum) || minimum < 0) throw new Error('O mínimo de contatos deve ser um inteiro não negativo.');
    const data = records.map(row => ({...row}));
    const invalid = data.filter(row => M.validate(row));
    const coordinators = M.group(data, ['coordinator']);
    const leaders = M.group(data, ['coordinator','leader']);
    const rank = (groups, key) => groups.filter(group => !group.rows.some(row => M.validate(row)) && (key === 'contacted' || group.contacted >= minimum))
      .sort((a,b) => b[key] - a[key] || b.contacted - a.contacted || `${a.coordinator} ${a.leader || ''}`.localeCompare(`${b.coordinator} ${b.leader || ''}`, 'pt-BR'));
    const rankings = [];
    for (const [kind, groups] of [['Coordenadores',coordinators],['Líderes',leaders]]) {
      for (const key of Object.keys(criteria)) rankings.push({kind,key,title:criteria[key],rows:rank(groups,key)});
    }
    const generated = options.generated ? new Date(options.generated) : new Date();
    const scope = options.scope || 'Toda a base';
    const scopeDetail = options.scopeDetail || 'Todos os coordenadores; sem filtro de atualização.';
    return {data, total:M.summarize(data), invalid, coordinators, leaders, rankings, minimum, generated,
      timestamp:generated.toLocaleString('pt-BR'), scope, scopeDetail, notes:String(options.notes || '').trim().slice(0,3000),
      warning:invalid.length ? `${invalid.length} registro(s) inconsistente(s). Totais originais preservados; grupos inconsistentes não participam dos rankings.` : '',
      rankRule:`Mínimo para rankings percentuais: ${minimum ? M.integer(minimum) + ' contatos' : 'desativado'}. Volume sem mínimo. Desempate por volume e nome; posição sequencial.`,
      timeRule:'Retrato dos dados carregados na geração. Período por última atualização do registro, não por data de contato. Não mede a produção diária.'};
  }
  function summary(report) {
    const t = report.total;
    const lines = ['FECHAMENTO DE AMOSTRAGEM', report.timestamp, `${report.scope} - ${report.scopeDetail}`, '',
      `Base: ${M.integer(t.total_base)} | Contatados: ${M.integer(t.contacted)}`,
      `Cobertura: ${M.percent(t.coverage)}`,
      `Confirmados: ${M.integer(t.confirmed)} | Taxa de confirmação: ${M.percent(t.confirmation)}`,
      `Pendentes: ${M.integer(t.pending)}`, '', 'DESTAQUES DOS LÍDERES'];
    for (const ranking of report.rankings.filter(r => r.kind === 'Líderes')) {
      const first = ranking.rows[0];
      lines.push(first ? `${ranking.title}: ${first.leader || 'Sem líder'} (${first.coordinator || 'Sem coordenador'}) - ${ranking.key === 'contacted' ? M.integer(first.contacted) : M.percent(first[ranking.key])}; ${M.integer(first.confirmed)} confirmados / ${M.integer(first.contacted)} contatados / ${M.integer(first.total_base)} na base.` : `${ranking.title}: nenhum participante elegível.`);
    }
    lines.push('', report.rankRule, report.timeRule);
    if (report.warning) lines.push('',report.warning);
    if (report.notes) lines.push('','OBSERVAÇÕES',report.notes);
    return lines.join('\n');
  }
  window.SamplingReportModel = {create,summary,criteria};
})();

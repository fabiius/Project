(() => {
  'use strict';
  const M = window.SamplingMetrics;
  // Independent print canvases preserve the snapshot while on-screen charts change.
  function canvas(title, subtitle) {
    const element = document.createElement('canvas'); element.width = 1400; element.height = 680;
    const ctx = element.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,1400,680);
    ctx.fillStyle = '#162e4a'; ctx.font = 'bold 30px Arial'; ctx.fillText(title,35,46);
    ctx.fillStyle = '#5b6d83'; ctx.font = '20px Arial'; ctx.fillText(subtitle,35,82);
    return {element,ctx};
  }
  function shorten(ctx, text, width) {
    let value = String(text);
    while (value.length && ctx.measureText(value).width > width) value = value.slice(0,-1);
    return value === String(text) ? value : value.slice(0,-1) + '…';
  }
  function bars(report, key) {
    const ranking = report.rankings.find(r => r.kind === 'Coordenadores' && r.key === key);
    const title = key === 'coverage' ? 'Cobertura por coordenador' : 'Confirmação por coordenador';
    const {element,ctx} = canvas(title, 'Até 10 equipes elegíveis. Ranking completo nas tabelas.');
    const data = ranking.rows.slice(0,10);
    if (!data.length) {ctx.fillText('Nenhum participante elegível para este gráfico.',35,170);return element.toDataURL('image/png');}
    data.forEach((row,index) => {
      const y = 132 + index * 49;
      ctx.font = '20px Arial'; ctx.fillStyle = '#263f5d'; ctx.fillText(shorten(ctx,row.coordinator || 'Sem coordenador',355),35,y+21);
      ctx.fillStyle = '#e8eef7';ctx.fillRect(410,y,780,29);
      ctx.fillStyle = key === 'coverage' ? '#1761dc' : '#189362';ctx.fillRect(410,y,780 * Math.max(0,Math.min(1,row[key]/100)),29);
      ctx.font = 'bold 22px Arial'; ctx.fillText(M.percent(row[key]),1220,y+23);
    });
    ctx.fillStyle = '#5b6d83';ctx.font='18px Arial';ctx.fillText('0%',410,652);ctx.fillText('100%',1145,652);
    return element.toDataURL('image/png');
  }
  function status(report) {
    const {element,ctx}=canvas('Distribuição por status',`Base total: ${M.integer(report.total.total_base)} pessoas`);
    if (report.invalid.length || !report.total.total_base) {ctx.fillText(report.invalid.length ? 'Distribuição indisponível: há registros inconsistentes.' : 'Sem base para distribuir.',35,170);return element.toDataURL('image/png');}
    const t=report.total, values=[t.confirmed,t.not_confirmed,t.does_not_know,t.mailbox,t.pending];
    const labels=['Confirmados','Não confirmados','Não conhece','Caixa postal','Pendentes'];
    const colors=['#249b70','#d94d5e','#e5af25','#8157cc','#94a1b3'];
    let start=-Math.PI/2;
    values.forEach((value,index)=>{const end=start+value/t.total_base*2*Math.PI;ctx.beginPath();ctx.moveTo(330,380);ctx.arc(330,380,215,start,end);ctx.closePath();ctx.fillStyle=colors[index];ctx.fill();start=end;});
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(330,380,135,0,2*Math.PI);ctx.fill();
    ctx.fillStyle='#162e4a';ctx.font='bold 42px Arial';ctx.textAlign='center';ctx.fillText(M.integer(t.total_base),330,377);ctx.font='22px Arial';ctx.fillText('pessoas',330,415);ctx.textAlign='left';
    labels.forEach((label,index)=>{const y=205+index*73;ctx.fillStyle=colors[index];ctx.fillRect(650,y,20,20);ctx.fillStyle='#263f5d';ctx.font='24px Arial';ctx.fillText(label,690,y+20);ctx.textAlign='right';ctx.fillText(M.integer(values[index]),1130,y+20);ctx.fillText(M.percent(M.calculatePercentage(values[index],t.total_base)),1340,y+20);ctx.textAlign='left';});
    return element.toDataURL('image/png');
  }
  window.SamplingReportCharts = report => ({status:status(report),coverage:bars(report,'coverage'),confirmation:bars(report,'confirmation')});
})();

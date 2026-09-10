(() => {
  'use strict';
  let provider, running=false;
  const $=s=>document.querySelector(s), M=window.SamplingMetrics;
  const options=()=>{
    const state=provider(), all=$('#report-scope').value==='all';
    if(!all && state.from && state.to && state.from>state.to)throw new Error('Corrija o período do painel ou selecione toda a base.');
    return window.SamplingReportModel.create(all?state.records:state.visible,{
      scope:all?'Toda a base':'Filtros do painel',
      scopeDetail:all?'Todos os coordenadores; sem filtro de atualização.':`Coordenador: ${state.coordinator||'todos'}; atualização: ${state.from||'sem início'} a ${state.to||'sem fim'}.`,
      minimum:$('#report-minimum').value,notes:$('#report-notes').value
    });
  };
  function status(text,error=false){$('#report-status').textContent=text;$('#report-status').className=error?'form-error':'muted';}
  function update(){
    if(!provider)return;
    try {
      const r=options(),t=r.total;
      $('#report-preview').textContent=`${r.data.length} registros | Base: ${M.integer(t.total_base)} | Contatados: ${M.integer(t.contacted)} | Cobertura: ${M.percent(t.coverage)} | Confirmados: ${M.integer(t.confirmed)} | Confirmação: ${M.percent(t.confirmation)} | Pendentes: ${M.integer(t.pending)}`;
      $('#report-scope-detail').textContent=r.scopeDetail;
      if(!running)status(r.warning||(!r.data.length?'Nenhum registro neste escopo. Os arquivos indicarão a ausência de dados.':''),!!r.warning);
    }catch(error){$('#report-preview').textContent='Prévia indisponível.';status(error.message,true);}
  }
  function download(bytes,filename,type){const url=URL.createObjectURL(new Blob([bytes],{type}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  async function generate(kind){
    if(running)return;
    let snapshot;
    try {snapshot=options();}catch(error){status(error.message,true);return;}
    running=true;
    const controls=document.querySelectorAll('#report-center button, #report-center input, #report-center select, #report-center textarea');
    controls.forEach(control=>{control.disabled=true;});$('#report-center').setAttribute('aria-busy','true');
    status('Preparando relatório…');
    try {
      if(kind==='copy'){
        const content=window.SamplingReportModel.summary(snapshot);
        $('#report-text').value=content;$('#report-text-wrap').hidden=false;
        try{await navigator.clipboard.writeText(content);status('Resumo copiado. Cole no e-mail ou WhatsApp quando desejar.');}
        catch{status('Resumo preparado abaixo. Selecione e copie o texto.');}
        return;
      }
      // Yield one frame so the busy state paints before assembling large files.
      await new Promise(resolve=>setTimeout(resolve,40));
      if(kind==='xml'||kind==='json'){
        window.SamplingExports.exportReport(kind,snapshot.data,provider().records.map(row=>({...row})));
      }else{
        status('Gerando gráficos e organizando as páginas…');
        const charts=window.SamplingReportCharts(snapshot);
        const bytes=kind==='pdf'?await window.SamplingReportPDF.build(snapshot,charts):await window.SamplingReportExcel.build(snapshot,charts);
        const stamp=M.localDay(snapshot.generated),suffix=snapshot.scope==='Toda a base'?'Geral':'Filtrado';
        download(bytes,`Fechamento_Amostragem_${stamp}_${suffix}.${kind==='pdf'?'pdf':'xlsx'}`,kind==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
      status(`Arquivo preparado para download às ${snapshot.timestamp}. ${snapshot.warning}`);
    }catch(error){status(`Não foi possível gerar: ${error.message}`,true);}
    finally{running=false;controls.forEach(control=>{control.disabled=false;});$('#report-center').setAttribute('aria-busy','false');}
  }
  function mount(getState){provider=getState;$('#report-scope').addEventListener('change',update);$('#report-minimum').addEventListener('input',update);document.querySelectorAll('[data-report]').forEach(button=>{button.onclick=()=>generate(button.dataset.report);});update();}
  window.SamplingReportCenter={mount,update};
})();

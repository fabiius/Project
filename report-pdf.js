(() => {
  'use strict';
  const M=window.SamplingMetrics;
  async function build(r,charts) {
    if(!window.PDFLib)throw new Error('O gerador de PDF não carregou. Atualize a página.');
    const {PDFDocument,StandardFonts,rgb}=window.PDFLib;
    const doc=await PDFDocument.create(), font=await doc.embedFont(StandardFonts.Helvetica), bold=await doc.embedFont(StandardFonts.HelveticaBold);
    doc.setTitle('Fechamento de Amostragem');doc.setAuthor('Controle de Amostragem');doc.setCreationDate(r.generated);
    const blue=rgb(.07,.27,.51), ink=rgb(.09,.16,.25),muted=rgb(.34,.40,.48),pale=rgb(.94,.96,.98);
    const clean=value=>Array.from(String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'')).map(c=>{if(c==='\n')return c;if(c==='\t'||c==='\r')return ' ';try{font.encodeText(c);return c;}catch{return '?';}}).join('');
    let page,y,width,height;
    function text(value,x,top,size=10,strong=false,color=ink){page.drawText(clean(value),{x,y:height-top-size,font:strong?bold:font,size,color});}
    function wrap(value,maxWidth,size=10,strong=false){
      const f=strong?bold:font, output=[];
      for(const paragraph of clean(value).split('\n')){
        let line='';
        for(const word of paragraph.split(/\s+/)){
          if(line && f.widthOfTextAtSize(line+' '+word,size)>maxWidth){output.push(line);line='';}
          if(f.widthOfTextAtSize(word,size)>maxWidth){
            for(const character of word){if(line && f.widthOfTextAtSize(line+character,size)>maxWidth){output.push(line);line='';}line+=character;}
          }else line+=(line?' ':'')+word;
        }
        output.push(line);
      }
      return output;
    }
    function paragraph(value,size=10,color=muted){for(const line of wrap(value,width-80,size)){if(y+size+8>height-45)newPage('Continuação');text(line,40,y,size,false,color);y+=size+5;}y+=6;}
    function newPage(title,landscape=false){
      page=doc.addPage(landscape?[841.89,595.28]:[595.28,841.89]);width=page.getWidth();height=page.getHeight();
      page.drawRectangle({x:0,y:height-13,width,height:13,color:blue});
      text('CONTROLE DE AMOSTRAGEM',40,29,9,true,blue);text(title,40,48,21,true);
      const scopeLines=wrap(`${r.scope} | ${r.scopeDetail}`,width-80,9);
      scopeLines.forEach((line,i)=>text(line,40,80+i*12,9,false,muted));
      y=88+scopeLines.length*12;
    }
    async function image(name,top,h){const png=await doc.embedPng(charts[name]);page.drawImage(png,{x:40,y:height-top-h,width:width-80,height:h});}
    newPage('Fechamento executivo');
    paragraph(`Gerado em ${r.timestamp}. ${r.data.length} registro(s).`);
    const kpis=[['Base total',M.integer(r.total.total_base)],['Contatados',M.integer(r.total.contacted)],['Cobertura',M.percent(r.total.coverage)],['Confirmados',M.integer(r.total.confirmed)],['Taxa de confirmação',M.percent(r.total.confirmation)],['Pendentes',M.integer(r.total.pending)]];
    const cardWidth=(width-100)/3, start=y;
    kpis.forEach(([label,value],i)=>{const x=40+(i%3)*(cardWidth+10),top=start+Math.floor(i/3)*88;page.drawRectangle({x,y:height-top-76,width:cardWidth,height:76,color:pale});text(label,x+12,top+12,10);text(value,x+12,top+32,23,true,blue);});
    y=start+183; paragraph(r.timeRule,9);
    if(r.warning)paragraph(r.warning,9,rgb(.65,.17,.13));
    text('Funil de amostragem',40,y,13,true);y+=23;
    const steps=[['Base',r.total.total_base],['Contatados',r.total.contacted],['Confirmados',r.total.confirmed]];
    steps.forEach(([label,value],i)=>{const x=40+i*(cardWidth+10);text(label,x,y,10,true);text(M.integer(value),x,y+18,17,true,blue);text(`${M.percent(M.calculatePercentage(value,r.total.total_base))} da base`,x,y+43,9,false,muted);});
    y+=78;if(y+250>height-48)newPage('Distribuição por status');await image('status',y,250);
    newPage('Desempenho das equipes');paragraph(r.rankRule,9);await image('coverage',y,250);y+=270;await image('confirmation',y,250);y+=270;
    function table(title,headers,rows,widths,landscape=false){
      const size=landscape?8:9,lineHeight=size+4;
      const headerHeight=Math.max(...headers.map((v,i)=>wrap(v,widths[i]-12,size,true).length))*lineHeight+12;
      function tablePage(fresh=true){if(fresh){newPage(title,landscape);paragraph(r.rankRule,8);}else{y+=26;text(title,40,y,13,true,blue);y+=27;}page.drawRectangle({x:40,y:height-y-headerHeight,width:widths.reduce((a,b)=>a+b,0),height:headerHeight,color:blue});let x=40;headers.forEach((v,i)=>{wrap(v,widths[i]-12,size,true).forEach((line,j)=>text(line,x+6,y+6+j*lineHeight,size,true,rgb(1,1,1)));x+=widths[i];});y+=headerHeight;}
      tablePage(landscape || width>600 || y+headerHeight+130>height-45);
      if(!rows.length){paragraph('Nenhum registro elegível para esta tabela.');return;}
      rows.forEach((values,index)=>{
        const lines=values.map((value,i)=>wrap(value,widths[i]-12,size));
        const rowHeight=Math.max(...lines.map(v=>v.length))*lineHeight+12;
        if(y+rowHeight>height-45)tablePage();
        if(index%2===0)page.drawRectangle({x:40,y:height-y-rowHeight,width:widths.reduce((a,b)=>a+b,0),height:rowHeight,color:pale});
        let x=40;lines.forEach((list,i)=>{list.forEach((line,j)=>text(line,x+6,y+6+j*lineHeight,size));x+=widths[i];});y+=rowHeight;
      });
    }
    for(const rank of r.rankings){
      const rows=rank.rows.map((t,i)=>[String(i+1),rank.kind==='Líderes'?`${t.leader||'Sem líder'}\n${t.coordinator||'Sem coordenador'}`:t.coordinator||'Sem coordenador',M.integer(t.total_base),M.integer(t.contacted),M.integer(t.confirmed),rank.key==='contacted'?M.integer(t.contacted):M.percent(t[rank.key])]);
      table(`${rank.kind}: ${rank.title}`,['Pos.','Equipe / participante','Base','Contatados','Confirmados','Resultado'],rows,[32,193,65,75,75,75]);
    }
    const vals=t=>[M.integer(t.total_base),M.integer(t.contacted),M.integer(t.confirmed),M.integer(t.not_confirmed),M.integer(t.does_not_know),M.integer(t.mailbox),M.percent(t.coverage),M.percent(t.confirmation),M.integer(t.pending)];
    const matrix=r.data.map(row=>[row.coordinator||'Sem coordenador',`${row.leader||'Sem líder'}${M.validate(row)?' [!]':''}`,...vals(M.summarize([row]))]);
    matrix.push(['CONSOLIDADO','',...vals(r.total)]);
    table('Matriz de amostragem',['Coordenador','Líder','Base','Contatados','Confirm.','Não confirm.','Não conhece','Cx. postal','Cobertura','Confirmação','Pendentes'],matrix,[110,110,53,60,56,60,57,52,66,70,67],true);
    newPage('Critérios e observações');paragraph(r.timeRule);paragraph(r.rankRule);
    paragraph('Cobertura = contatados / base. Confirmação = confirmados / contatados. Percentuais consolidados calculados pelas somas. Divisão por zero retorna zero.');
    paragraph('Contatados = confirmados + não confirmados + não conhece + caixa postal. Pendentes = base - contatados.');
    paragraph('Os gráficos apresentam até 10 coordenadores elegíveis; as tabelas contêm todos os participantes elegíveis. Grupos com inconsistências não participam dos rankings.');
    if(r.warning)paragraph(`${r.warning} Na matriz, [!] identifica registros a revisar.`,10,rgb(.65,.17,.13));
    paragraph('Observações do fechamento',12,blue);paragraph(r.notes||'Nenhuma observação informada.');
    paragraph('Documento gerado localmente. Não constitui histórico salvo nem envio automático.');
    doc.getPages().forEach((p,i)=>{p.drawText(clean(`Gerado: ${r.timestamp}`),{x:40,y:22,font,size:8,color:muted});p.drawText(`${i+1} / ${doc.getPageCount()}`,{x:p.getWidth()-80,y:22,font,size:8,color:muted});});
    return doc.save();
  }
  window.SamplingReportPDF={build};
})();

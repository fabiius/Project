(() => {
'use strict';
const summary=r=>['RELATÓRIO DE AMOSTRAGEM',r.label,r.scopeDetail,...r.sections.filter(s=>s.type!=='chart').flatMap(s=>['',s.title,...(s.type==='text'?[s.text]:[s.headers.join(' | '),...s.rows.map(row=>row.join(' | '))])]),'',r.rule].join('\n');
async function excel(r){
 const numericCell=v=>typeof v==='string'&&/^-?\d+,\d+%$/.test(v)?{v:Number(v.replace('%','').replace(',','.'))/100,s:3}:v;
 const sheets=r.sections.filter(s=>s.type!=='chart').map((s,i)=>({name:(s.title==='Resumo de indicadores'?'Resumo':s.title).slice(0,31),headers:s.type==='text'?['Informação']:s.headers,rows:s.type==='text'?[[s.text]]:s.rows.map(row=>row.map(numericCell)),widths:s.type==='text'?[100]:s.headers.map(h=>/Coordenador|Líder/.test(h)?30:/Indicador/.test(h)?44:24)}));
 if(!sheets.length)sheets.push({name:'Relatório',headers:['Informação'],rows:[['Gráficos selecionados']],widths:[40,30,30,30]});
 sheets[0].images=Object.keys(r.charts).length>0;
 if(sheets[0].widths.length<4)sheets[0].widths.push(...Array(4-sheets[0].widths.length).fill(25));
 sheets.push({name:'Critérios',headers:['Item','Descrição'],widths:[25,110],rows:[['Período',r.label],['Filtros',r.scopeDetail],['Critérios',r.rule],['Gráficos','Imagens incorporadas, não editáveis.'],['Gerado em',r.generated.toLocaleString('pt-BR')]]});
 return window.SamplingReportExcel.build({...r,sheets,scope:r.label,timestamp:r.generated.toLocaleString('pt-BR'),data:r.rows,warning:''},r.charts);
}
async function pdf(r){
 if(!window.PDFLib)throw new Error('O gerador de PDF não carregou. Confira pdf-lib.min.js na raiz.');
 const {PDFDocument,StandardFonts,rgb}=window.PDFLib,doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 const ink=rgb(.08,.15,.24),blue=rgb(.07,.3,.58),muted=rgb(.35,.42,.5),pale=rgb(.94,.96,.98);
 const W=841.89,H=595.28,margin=36;let page,y;
 const clean=v=>Array.from(String(v??'')).map(c=>{if(c==='\n')return c;try{font.encodeText(c);return c;}catch{return ' ';}}).join('');
 function lines(value,width,size=10){
  const result=[];for(const paragraph of clean(value).split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(line&&font.widthOfTextAtSize(line+' '+word,size)>width){result.push(line);line='';}for(const c of (line?' ':'')+word){if(font.widthOfTextAtSize(line+c,size)>width){result.push(line);line='';}line+=c;}}result.push(line);}return result;
 }
 function text(value,x,top,size=10,strong=false,color=ink){page.drawText(clean(value),{x,y:H-top-size,size,font:strong?bold:font,color});}
 function newPage(){
  page=doc.addPage([W,H]);page.drawRectangle({x:0,y:H-9,width:W,height:9,color:blue});
  text('CONTROLE DE AMOSTRAGEM',margin,24,10,true,blue);text('Relatório de produção',margin,43,21,true);
  y=75;for(const line of lines(r.label+' • '+r.scopeDetail,W-2*margin,9)){text(line,margin,y,9,false,muted);y+=13;}y+=14;
 }
 function space(n){if(y+n>H-42)newPage();}
 function paragraph(value,size=10){for(const line of lines(value,W-2*margin,size)){space(size+6);text(line,margin,y,size);y+=size+6;}y+=8;}
 newPage();
 for(const section of r.sections){
  if(section.type==='chart'){space(328);const png=await doc.embedPng(r.charts[section.key]);page.drawImage(png,{x:margin,y:H-y-308,width:W-2*margin,height:308});y+=328;continue;}
  space(110);text(section.title,margin,y,14,true,blue);y+=26;
  if(section.type==='text'){paragraph(section.text);continue;}
  const widths=section.headers.map(h=>/Coordenador|Líder|Indicador/.test(h)?1.7:1);const unit=(W-2*margin)/widths.reduce((a,b)=>a+b,0);const cols=widths.map(w=>w*unit);const size=9;
  const header=()=>{const h=Math.max(...section.headers.map((v,i)=>lines(v,cols[i]-12,size).length))*13+12;space(h+30);page.drawRectangle({x:margin,y:H-y-h,width:W-2*margin,height:h,color:blue});let x=margin;section.headers.forEach((v,i)=>{lines(v,cols[i]-12,size).forEach((line,j)=>text(line,x+6,y+6+j*13,size,true,rgb(1,1,1)));x+=cols[i];});y+=h;};
  header();
  if(!section.rows.length){paragraph('Nenhum lançamento no período.');continue;}
  for(let i=0;i<section.rows.length;i++){
   const row=section.rows[i],wrapped=row.map((v,k)=>lines(v,cols[k]-12,size)),height=Math.max(...wrapped.map(l=>l.length))*13+12;
   if(y+height>H-42){newPage();text(section.title+' (continuação)',margin,y,13,true,blue);y+=24;header();}
   if(i%2===0)page.drawRectangle({x:margin,y:H-y-height,width:W-2*margin,height,color:pale});
   let x=margin;wrapped.forEach((list,k)=>{list.forEach((line,j)=>text(line,x+6,y+6+j*13,size));x+=cols[k];});y+=height;
  }y+=22;
 }
 space(65);paragraph(r.rule,9);
 doc.setTitle('Relatório de amostragem — '+r.label);doc.setCreationDate(r.generated);
 doc.getPages().forEach((p,i)=>{p.drawText('Gerado em '+r.generated.toLocaleString('pt-BR'),{x:margin,y:18,size:8,font,color:muted});p.drawText((i+1)+' / '+doc.getPageCount(),{x:W-80,y:18,size:8,font,color:muted});});
 return doc.save();
}
window.DailyExports={summary,excel,pdf};
})();

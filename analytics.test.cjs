const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('./analytics-metrics.js');
const fixtures = [
  { id:1, coordinator:'DANTE', leader:'MARCELO', total_base:100, confirmed:50, not_confirmed:15, does_not_know:5, mailbox:10, updated_at:'2024-04-10T12:00:00Z' },
  { id:2, coordinator:'DANTE', leader:'JOAO', total_base:123, confirmed:15, not_confirmed:2, does_not_know:1, mailbox:19, updated_at:'2024-04-20T12:00:00Z' }
];
const script = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
test('exemplo de aceite: cobertura, confirmação, pendentes e consolidado', () => {
  const total = M.summarize(fixtures);
  assert.equal(total.total_base, 223); assert.equal(total.contacted, 117); assert.equal(total.confirmed, 65);
  assert.equal(total.not_confirmed, 17); assert.equal(total.does_not_know, 6); assert.equal(total.mailbox, 29);
  assert.equal(total.pending, 106); assert.equal(M.percent(total.coverage), '52,5%'); assert.equal(M.percent(total.confirmation), '55,6%');
  const leaders = M.group(fixtures, ['coordinator','leader']);
  assert.deepEqual(leaders.map(row => row.leader), ['MARCELO','JOAO']);
  assert.deepEqual(leaders.map(row => M.percent(row.confirmation)), ['62,5%','40,5%']);
});
test('zero, valores inválidos e correção de registros legados', () => {
  assert.equal(M.calculatePercentage(1,0),0); assert.equal(M.summarize([]).confirmation,0);
  assert.equal(M.validate(fixtures[0]),'');
  for (const change of [{total_base:79},{confirmed:-1},{confirmed:1.5},{mailbox:101},{total_base:Infinity},{confirmed:NaN},{total_base:2147483648}]) assert.ok(M.validate({...fixtures[0],...change}));
  assert.equal(M.calculatePending(20,30),-10, 'não mascarar inconsistências antigas');
});
test('filtro inclusivo por atualização e coordenador, sem inventar datas', () => {
  assert.equal(M.filter(fixtures,'DANTE','2024-04-10','2024-04-10').length,1);
  assert.equal(M.filter(fixtures,'DANTE','2024-04-11','2024-04-30').length,1);
  assert.equal(M.filter(fixtures,'OUTRO','','').length,0);
  assert.equal(M.filter([{...fixtures[0],updated_at:null}], '', '2024-04-01','').length,0);
  assert.equal(M.filter(fixtures,'','','').length,2);
});
test('ranking consolida o mesmo líder dentro do coordenador e protege nomes especiais', () => {
  const grouped = M.group([fixtures[0],fixtures[0],{...fixtures[1],coordinator:'__proto__'}],['coordinator','leader']);
  assert.equal(grouped.length,2); assert.equal(grouped[0].total_base,200);
  assert.equal(M.group([{...fixtures[0],coordinator:'A|B',leader:'C'},{...fixtures[0],coordinator:'A',leader:'B|C'}],['coordinator','leader']).length,2);
});
test('componentes usam os mesmos totais, escapam HTML e restringem exclusão', () => {
  const nodes = new Map();
  const document = {querySelector(selector) { if(!nodes.has(selector)) nodes.set(selector,{innerHTML:'',textContent:''}); return nodes.get(selector); }};
  const window = {SamplingMetrics:M};
  vm.runInNewContext(script('analytics-components.js'),{window,document});
  const C = window.SamplingComponents, total = M.summarize(fixtures);
  C.kpis(total); C.funnel(total); C.matrix(fixtures,total,false); C.performance(M.group(fixtures,['coordinator']),''); C.ranking(M.group(fixtures,['coordinator','leader']));
  assert.match(nodes.get('#kpis').innerHTML,/52,5%/); assert.match(nodes.get('#kpis').innerHTML,/55,6%/);
  assert.match(nodes.get('#totals').innerHTML,/106|223/); assert.doesNotMatch(nodes.get('#rows').innerHTML,/data-action="delete"/);
  C.matrix([{...fixtures[0],leader:'<script>alert(1)</script>'}],M.summarize([fixtures[0]]),true);
  assert.match(nodes.get('#rows').innerHTML,/&lt;script&gt;/); assert.match(nodes.get('#rows').innerHTML,/data-action="delete"/);
  assert.equal(C.charts(M.group(fixtures,['coordinator','leader']),total,false),false);
});
test('exportações: escopo filtrado, resumo completo, XML válido e JSON integral', () => {
  const sheets=[], downloads=[];
  let blob;
  const XLSX={utils:{book_new:()=>({}),json_to_sheet:rows=>({rows}),book_append_sheet:(book,sheet,name)=>sheets.push({sheet,name})},writeFile:()=>{}};
  const window={SamplingMetrics:M,XLSX};
  class BlobMock {constructor(parts){this.content=parts.join('');blob=this;}}
  const document={body:{append(){}},createElement:()=>({click(){downloads.push({name:this.download,content:blob.content});},remove(){}})};
  vm.runInNewContext(script('analytics-exports.js'),{window,XLSX,document,Blob:BlobMock,URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout:callback=>callback()});
  window.SamplingExports.exportReport('excel',[fixtures[0]],fixtures); assert.equal(sheets[0].sheet.rows.length,1);
  assert.equal(sheets[0].sheet.rows[0].Cobertura,'80,0%');
  window.SamplingExports.exportReport('daily',[fixtures[0]],fixtures); assert.equal(sheets.at(-1).sheet.rows.length,2);
  window.SamplingExports.exportReport('xml',[{...fixtures[0],leader:"O'Neil & <A>"}],fixtures);
  assert.match(downloads.at(-1).content,/O&apos;Neil &amp; &lt;A&gt;/); assert.match(downloads.at(-1).content,/<contatados>80<\/contatados>/);
  window.SamplingExports.exportReport('json',[fixtures[0]],fixtures); assert.equal(JSON.parse(downloads.at(-1).content).length,2);
});
test('gráficos compartilham os totais da tabela e atualizam sem recriar instâncias', () => {
  const nodes=new Map(), instances=[];
  const document={createElement:()=>({}),querySelector(selector){
    if(!nodes.has(selector)) nodes.set(selector,{hidden:false,parentElement:{querySelector:()=>null,append(){} }});
    return nodes.get(selector);
  }};
  class Chart {constructor(canvas,config){Object.assign(this,config);instances.push(this);}update(){this.updated=true;}}
  const window={SamplingMetrics:M,Chart};
  vm.runInNewContext(script('analytics-components.js'),{window,Chart,document});
  window.SamplingComponents.charts(M.group(fixtures,['coordinator','leader']),M.summarize(fixtures),false);
  assert.equal(instances.length,2);
  assert.equal(instances[0].data.datasets[0].data[0],62.5);
  assert.equal(JSON.stringify(instances[1].data.datasets[0].data),JSON.stringify([65,17,6,29,106]));
  window.SamplingComponents.charts([],M.summarize([]),false);
  assert.equal(instances.length,2); assert.equal(instances[0].updated,true);
  assert.equal(nodes.get('#status-chart').hidden,true);
});

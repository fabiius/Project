const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('../analytics-metrics.js');
const fixtures = [
  { id:1, coordinator:'DANTE', leader:'MARCELO', total_base:100, confirmed:50, not_confirmed:15, does_not_know:5, mailbox:10, updated_at:'2024-04-10T12:00:00Z' },
  { id:2, coordinator:'DANTE', leader:'JOAO', total_base:123, confirmed:15, not_confirmed:2, does_not_know:1, mailbox:19, updated_at:'2024-04-20T12:00:00Z' }
];
const script = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
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
test('serviço pagina toda a base, filtra o perfil e detecta exclusão negada', async () => {
  let profileId, savedValues;
  const dataset = Array.from({length:1001},(_,id)=>({id}));
  const client = {
    auth:{getSession:async()=>({data:{session:{user:{id:'user-1'}}}}),signOut:async()=>({error:null})},
    from(table) {
      if(table==='profiles') return {select(){return this;},eq(field,id){profileId=id;return this;},single:async()=>({data:{role:'user'}})};
      return {select(){return this;},order(){return this;},range:async(start,end)=>({data:dataset.slice(start,end+1)}),
        update(values){savedValues=values;return this;},eq(){return this;},single:async()=>({data:{id:1,...savedValues}}),
        delete(){return {eq(){return {select:async()=>({data:[]})};}}}
      };
    }
  };
  const window = {APP_CONFIG:{SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'test'},supabase:{createClient:()=>client}};
  vm.runInNewContext(script('analytics-service.js'),{window});
  assert.equal((await window.SamplingService.list()).length,1001);
  await window.SamplingService.profile('user-1'); assert.equal(profileId,'user-1');
  await window.SamplingService.save(1,{confirmed:5}); assert.equal(savedValues.confirmed,5); assert.ok(savedValues.updated_at);
  await assert.rejects(()=>window.SamplingService.remove(1),/não foi excluído/);
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
test('fluxo do painel: sessão, filtro, criação, validação, edição, exclusão e saída', async () => {
  const nodes=new Map(), listeners=new Map(), calls=[], initial=fixtures.map(row=>({...row}));
  const node = selector => {
    if(!nodes.has(selector)) nodes.set(selector,{value:'',hidden:true,disabled:false,textContent:'',innerHTML:'',
      addEventListener(type,fn){listeners.set(`${selector}:${type}`,fn);},showModal(){this.open=true;},close(){this.open=false;},
    });
    return nodes.get(selector);
  };
  const document={querySelector:node,querySelectorAll:()=>[]};
  const C={esc:String,kpis(){},funnel(){},matrix(){},performance(){},ranking(){},charts:()=>true};
  const service={session:async()=>({user:{id:'u'}}),profile:async()=>({role:'admin',display_name:'Ana Paula'}),list:async()=>initial,
    save:async(id,data)=>{calls.push(['save',id,data]);return {...data,id:id??3,updated_at:'2024-04-20T12:00:00Z'};},
    remove:async(id)=>calls.push(['delete',id]),signOut:async()=>calls.push(['logout'])};
  const window={SamplingMetrics:M,SamplingComponents:C,SamplingService:service};
  class FormData {constructor(form){return Object.entries(form.values);}}
  let destination;
  vm.runInNewContext(script('analytics.js'),{window,document,FormData,confirm:()=>true,location:{replace:value=>{destination=value;}}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(node('#user-name').textContent,'Ana Paula'); assert.equal(node('#add').disabled,false);
  node('#add').onclick(); assert.equal(node('#record-dialog').open,true);
  const submit=values=>listeners.get('#record-form:submit')({preventDefault(){},target:{values}});
  const valid={coordinator:'DANTE',leader:'NOVO',total_base:'100',confirmed:'20',not_confirmed:'10',does_not_know:'0',mailbox:'5'};
  await submit({...valid,total_base:'2'}); assert.equal(calls.length,0); assert.match(node('#form-error').textContent,/não pode ultrapassar/);
  await submit(valid); assert.equal(calls[0][0],'save'); assert.equal(calls[0][1],null); assert.equal(node('#record-dialog').open,false);
  const action=async(kind,id)=>{
    const button={dataset:{action:kind,id:String(id)},closest:()=>({open:true})};
    return listeners.get('#rows:click')({target:{closest:()=>button}});
  };
  await action('edit',1); assert.equal(node('#dialog-title').textContent,'Editar registro');
  await submit(valid); assert.equal(calls[1][1],1);
  await action('delete',2); assert.deepEqual(calls[2],['delete',2]);
  node('#from').value='2024-05-01'; node('#to').value='2024-04-01'; listeners.get('#filters:change')();
  assert.match(node('#message').textContent,/inicial não pode ser posterior/);
  node('#clear').onclick(); assert.equal(node('#from').value,'');
  await node('#logout').onclick(); assert.equal(destination,'login.html');
});

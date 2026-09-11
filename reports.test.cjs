const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const M=require('../analytics-metrics.js'),window={SamplingMetrics:M};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../report-model.js'),'utf8'),{window});
const row={id:1,coordinator:'Dante',leader:'João',total_base:100,confirmed:50,not_confirmed:15,does_not_know:5,mailbox:10};
test('relatório captura dados independentes e preserva totais ao filtrar ranking',()=>{
  const source=[{...row}],r=window.SamplingReportModel.create(source,{minimum:90});source[0].confirmed=0;
  assert.equal(r.total.confirmed,50);assert.equal(r.data[0].confirmed,50);
  assert.equal(r.rankings.find(x=>x.key==='confirmation').rows.length,0);
  assert.equal(r.rankings.find(x=>x.key==='contacted').rows.length,1);
});
test('relatório trata mínimo inválido, conjunto vazio e inconsistências',()=>{
  assert.throws(()=>window.SamplingReportModel.create([],{minimum:-1}));
  assert.equal(window.SamplingReportModel.create([]).total.coverage,0);
  const r=window.SamplingReportModel.create([{...row,total_base:2}]);assert.equal(r.invalid.length,1);assert.ok(r.warning);assert.ok(r.rankings.every(x=>x.rows.length===0));
});
test('resumo para envio identifica escopo, critério e base de comparação',()=>{
  const r=window.SamplingReportModel.create([row],{notes:'Conferir pendências',minimum:10});
  const text=window.SamplingReportModel.summary(r);assert.match(text,/62,5%/);assert.match(text,/80 contatados/);assert.match(text,/Conferir pendências/);assert.match(text,/Não mede a produção diária/);
});

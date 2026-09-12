(() => {
'use strict';
let client;const db=()=>client||(client=window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL,window.APP_CONFIG.SUPABASE_ANON_KEY));
const unwrap=r=>{if(r.error)throw r.error;return r.data;};
async function all(table){const rows=[];for(let offset=0;;offset+=500){const r=await db().from(table).select('*').order('id').range(offset,offset+499);if(r.error){if(table==='daily_records')throw new Error('Execute ATUALIZACAO-DIARIA-V2.sql no Supabase para habilitar o histórico diário.');throw r.error;}rows.push(...r.data);if(r.data.length<500)return rows;}}
window.DailyData={
 async session(){return unwrap(await db().auth.getSession()).session;},
 async profile(id){return unwrap(await db().from('profiles').select('display_name,role').eq('id',id).single());},
 async load(){const base=await all('sample_records'),daily=await all('daily_records');if(daily.some(d=>d.record_id==null))throw new Error('Execute ATUALIZACAO-DIARIA-V2.sql para atualizar o histórico existente.');const byId=new Map(base.map(b=>[String(b.id),b]));return {base,daily:daily.map(d=>({...d,coordinator:byId.get(String(d.record_id))?.coordinator||d.coordinator,leader:byId.get(String(d.record_id))?.leader||d.leader}))};},
 async saveDaily(id,value){const query=id==null?db().from('daily_records').insert(value):db().from('daily_records').update(value).eq('id',id);return unwrap(await query.select().single());},
 async removeDaily(id){const rows=unwrap(await db().from('daily_records').delete().eq('id',id).select('id'));if(!rows.length)throw new Error('Exclusão não autorizada.');},
 async signOut(){unwrap(await db().auth.signOut());}
};
})();

(() => {
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.AppLayout={esc,
 integer:n=>new Intl.NumberFormat('pt-BR').format(n||0),
 percent:n=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}).format(n||0)+'%',
 async setup(){const session=await window.DailyData.session();if(!session){location.replace('login.html');return null;}const p=await window.DailyData.profile(session.user.id);document.querySelector('#user-name').textContent=p.display_name||'Usuário';document.querySelector('#role-badge').textContent=p.role==='admin'?'Administrador':'Usuário';document.querySelector('#avatar').textContent=(p.display_name||'U').slice(0,1);document.querySelector('#logout').onclick=async()=>{await window.DailyData.signOut();location.replace('login.html');};window.lucide?.createIcons();return p;}
};
})();

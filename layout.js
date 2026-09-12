(() => {
  'use strict';
  const page = document.body.dataset.page;
  window.AppLayout = {
    async setup() {
      const session = await window.DailyData.session(); if (!session) { location.replace('login.html'); return null; }
      const profile = await window.DailyData.profile(session.user.id);
      document.querySelector('#user-name').textContent = profile.display_name || 'Usuário';
      document.querySelector('#role-badge').textContent = profile.role === 'admin' ? 'Administrador' : 'Usuário';
      document.querySelector('#avatar').textContent = (profile.display_name || 'U').slice(0,1).toUpperCase();
      document.querySelector(`#nav-${page}`)?.classList.add('active');
      document.querySelector('#logout').onclick = async () => { await window.DailyData.signOut(); location.replace('login.html'); };
      window.lucide?.createIcons(); return profile;
    },
    percent(value) { return new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}).format(value || 0) + '%'; },
    integer(value) { return new Intl.NumberFormat('pt-BR').format(value || 0); },
    esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  };
})();

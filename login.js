(() => {
  const config = window.APP_CONFIG || {};
  const form = document.querySelector('#login-form');
  const error = document.querySelector('#login-error');
  const button = document.querySelector('#submit-button');
  if (!config.SUPABASE_URL || config.SUPABASE_URL.includes('COLE_AQUI')) {
    error.textContent = 'O sistema ainda não foi conectado ao banco de dados.';
    error.classList.remove('hidden');
    button.disabled = true;
    return;
  }
  const db = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  db.auth.getSession().then(({ data }) => { if (data.session) location.replace('index.html'); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); error.classList.add('hidden'); button.disabled = true; button.textContent = 'Entrando...';
    const { error: loginError } = await db.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
    if (loginError) { error.textContent = 'E-mail ou senha inválidos.'; error.classList.remove('hidden'); button.disabled = false; button.textContent = 'Acessar painel'; return; }
    location.replace('index.html');
  });
  lucide.createIcons();
})();

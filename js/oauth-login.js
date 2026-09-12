// ===================================================================
// OAUTH LOGIN - Google + Meta/Facebook
// ===================================================================
// O modal usa botões com visual próprio, então o Google entra pelo fluxo
// de token (initTokenClient), que pode ser disparado a partir de um clique.
// google.accounts.id.renderButton() exigiria um container para o botão
// oficial do Google e não serve para botão customizado.

const OAUTH_CONFIG = {
  google: {
    clientId: '121397262223-jkjraet5rgrs86kfkk5auec38l5kgoo1.apps.googleusercontent.com',
    scope: 'openid profile email',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  meta: {
    appId: '1517596297056063',
    scope: 'public_profile,email',
    version: 'v20.0'
  }
};

/** O app usa avatar como emoji/inicial (até 2 caracteres). */
function iniciaisDoNome(nome) {
  const limpo = (nome || '').trim();
  return limpo ? limpo[0].toUpperCase() : '👤';
}

function concluirLoginOAuth(dados) {
  usuarioSessao = {
    nome: dados.nome,
    email: dados.email,
    avatar: iniciaisDoNome(dados.nome),
    fotoUrl: dados.fotoUrl || '',
    tipo: dados.tipo,
    plano: 'free',
    provedorId: dados.provedorId,
    dataConexao: new Date().toISOString()
  };

  localStorage.setItem('loterias_nasa_user', JSON.stringify(usuarioSessao));
  atualizarPerfilUsuarioUI();
  if (typeof atualizarVisualPlano === 'function') atualizarVisualPlano();
  fecharModalAuth();
  tocarSomNasa('sucesso');
  toast(`Bem-vindo, ${usuarioSessao.nome.split(' ')[0]}!`, '🚀');
}

// ===================================================================
// GOOGLE
// ===================================================================
let googleTokenClient = null;

function loginComGoogle() {
  if (typeof google === 'undefined' || !google.accounts?.oauth2) {
    toast('Google ainda carregando. Tente em instantes.', '⏳');
    tocarBeep('alert');
    return;
  }

  if (!googleTokenClient) {
    googleTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: OAUTH_CONFIG.google.clientId,
      scope: OAUTH_CONFIG.google.scope,
      callback: handleGoogleToken
    });
  }

  googleTokenClient.requestAccessToken();
}

async function handleGoogleToken(resposta) {
  if (resposta.error || !resposta.access_token) {
    // O usuário fechar o popup cai aqui e não é erro de verdade.
    if (resposta.error !== 'popup_closed' && resposta.error !== 'access_denied') {
      toast('Não foi possível entrar com o Google', '⚠️');
      tocarBeep('alert');
    }
    return;
  }

  try {
    const perfil = await fetch(OAUTH_CONFIG.google.userInfoUrl, {
      headers: { Authorization: `Bearer ${resposta.access_token}` }
    });

    if (!perfil.ok) throw new Error(`userinfo ${perfil.status}`);

    const dados = await perfil.json();
    const email = dados.email || '';

    concluirLoginOAuth({
      nome: dados.name || dados.given_name || email.split('@')[0] || 'Usuário',
      email,
      fotoUrl: dados.picture || '',
      tipo: 'google_oauth',
      provedorId: dados.sub
    });
  } catch (err) {
    console.error('Erro no login Google:', err);
    toast('Erro ao ler seu perfil do Google', '⚠️');
    tocarBeep('alert');
  }
}

// ===================================================================
// META / FACEBOOK
// ===================================================================
function loginComMeta() {
  if (typeof FB === 'undefined') {
    toast('Meta ainda carregando. Tente em instantes.', '⏳');
    tocarBeep('alert');
    return;
  }

  FB.login((resposta) => {
    if (!resposta.authResponse) {
      toast('Login com Meta cancelado', 'ℹ️');
      return;
    }

    FB.api(
      '/me',
      { fields: 'id,name,email,picture.width(200).height(200)' },
      (perfil) => {
        if (!perfil || perfil.error) {
          console.error('Erro no perfil Meta:', perfil?.error);
          toast('Erro ao ler seu perfil da Meta', '⚠️');
          tocarBeep('alert');
          return;
        }

        // A Meta pode não devolver e-mail (conta sem e-mail confirmado
        // ou permissão recusada), então nome e e-mail precisam de fallback.
        const email = perfil.email || '';
        const nome = perfil.name || (email ? email.split('@')[0] : 'Usuário');

        concluirLoginOAuth({
          nome,
          email,
          fotoUrl: perfil.picture?.data?.url || '',
          tipo: 'meta_oauth',
          provedorId: perfil.id
        });
      }
    );
  }, { scope: OAUTH_CONFIG.meta.scope });
}

// ===================================================================
// CARREGAR SDKs
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  const googleScript = document.createElement('script');
  googleScript.src = 'https://accounts.google.com/gsi/client';
  googleScript.async = true;
  googleScript.defer = true;
  document.head.appendChild(googleScript);

  window.fbAsyncInit = function () {
    FB.init({
      appId: OAUTH_CONFIG.meta.appId,
      xfbml: false,
      version: OAUTH_CONFIG.meta.version
    });
  };

  const metaScript = document.createElement('script');
  metaScript.src = 'https://connect.facebook.net/pt_BR/sdk.js';
  metaScript.async = true;
  metaScript.defer = true;
  document.body.appendChild(metaScript);
});

console.log('🔐 OAuth carregado (Google + Meta)');

// ===================================================================
// OAUTH LOGIN - Google + Meta/Facebook Authentication
// ===================================================================

const OAUTH_CONFIG = {
  google: {
    clientId: '121397262223-jkjraet5rgrs86kfkk5auec38l5kgoo1.apps.googleusercontent.com',
    scope: 'profile email'
  },
  meta: {
    appId: '1517596297056063',
    scope: 'public_profile,email'
  }
};

// ===================================================================
// GOOGLE SIGN-IN (usando Google Identity Services)
// ===================================================================
function loginComGoogle() {
  if (typeof google === 'undefined') {
    toast('Google Sign-In não carregou. Tente novamente.', '⚠️');
    tocarBeep('alert');
    return;
  }

  google.accounts.id.initialize({
    client_id: OAUTH_CONFIG.google.clientId,
    callback: handleGoogleLogin
  });

  google.accounts.id.renderButton(
    document.getElementById('google-signin-container'),
    {
      type: 'standard',
      theme: 'dark',
      size: 'large',
      width: '100%'
    }
  );

  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      google.accounts.id.renderButton(
        document.getElementById('google-signin-container'),
        {
          type: 'standard',
          theme: 'dark',
          size: 'large',
          width: '100%'
        }
      );
    }
  });
}

function handleGoogleLogin(response) {
  if (!response.credential) {
    toast('Falha no login com Google', '⚠️');
    tocarBeep('alert');
    return;
  }

  try {
    // Decodificar JWT do Google
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const userData = JSON.parse(jsonPayload);

    // Salvar usuário
    usuarioSessao = {
      nome: userData.name || userData.email.split('@')[0],
      email: userData.email,
      avatar: userData.picture ? userData.picture.charAt(0).toUpperCase() : '👤',
      tipo: 'google_oauth',
      plano: 'free',
      googleId: userData.sub,
      dataConexao: new Date().toISOString()
    };

    localStorage.setItem('loterias_nasa_user', JSON.stringify(usuarioSessao));
    atualizarPerfilUsuarioUI();
    fecharModalAuth();
    tocarSomNasa('sucesso');
    toast(`Bem-vindo, ${usuarioSessao.nome}! 🎉`, '🚀');
  } catch (err) {
    console.error('Erro ao processar Google login:', err);
    toast('Erro ao processar login com Google', '⚠️');
    tocarBeep('alert');
  }
}

// ===================================================================
// META/FACEBOOK LOGIN (usando Meta SDK)
// ===================================================================
function loginComMeta() {
  if (typeof FB === 'undefined') {
    toast('Meta SDK não carregou. Tente novamente.', '⚠️');
    tocarBeep('alert');
    return;
  }

  FB.login((response) => {
    if (response.authResponse) {
      // Usuário autenticou
      FB.api('/me', { fields: 'id,name,email,picture.width(200).height(200)' },
        (userInfo) => {
          handleMetaLogin(userInfo, response.authResponse);
        }
      );
    } else {
      toast('Login com Meta foi cancelado', 'ℹ️');
    }
  }, { scope: OAUTH_CONFIG.meta.scope });
}

function handleMetaLogin(userInfo, authResponse) {
  try {
    usuarioSessao = {
      nome: userInfo.name || userInfo.email.split('@')[0],
      email: userInfo.email || 'nao_informado@meta.local',
      avatar: userInfo.picture?.data?.url ? userInfo.picture.data.url.charAt(0).toUpperCase() : '👤',
      tipo: 'meta_oauth',
      plano: 'free',
      metaId: userInfo.id,
      dataConexao: new Date().toISOString()
    };

    localStorage.setItem('loterias_nasa_user', JSON.stringify(usuarioSessao));
    atualizarPerfilUsuarioUI();
    fecharModalAuth();
    tocarSomNasa('sucesso');
    toast(`Bem-vindo, ${usuarioSessao.nome}! 🎉`, '🚀');
  } catch (err) {
    console.error('Erro ao processar Meta login:', err);
    toast('Erro ao processar login com Meta', '⚠️');
    tocarBeep('alert');
  }
}

// ===================================================================
// INICIALIZAR OAUTH NO CARREGAMENTO
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Google Sign-In
  const googleScript = document.createElement('script');
  googleScript.src = 'https://accounts.google.com/gsi/client';
  googleScript.async = true;
  googleScript.defer = true;
  document.head.appendChild(googleScript);

  // Meta SDK
  window.fbAsyncInit = function() {
    FB.init({
      appId: OAUTH_CONFIG.meta.appId,
      xfbml: true,
      version: 'v20.0'
    });
  };

  const metaScript = document.createElement('script');
  metaScript.src = 'https://connect.facebook.net/pt_BR/sdk.js';
  metaScript.async = true;
  metaScript.defer = true;
  document.body.appendChild(metaScript);
});

console.log('🔐 OAuth Login module loaded (Google + Meta)');

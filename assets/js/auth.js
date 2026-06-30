/* ===================================================================
   ARUNIWAVES - Shared JS: Authentication (Google GIS Handler)
   =================================================================== */

const Auth = {
  decodeJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("[Auth] Failed decoding JWT token:", e);
      return null;
    }
  },

  getUser() {
    const cached = sessionStorage.getItem("aruniwaves_user");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("[Auth] Failed parsing user from session:", e);
        sessionStorage.removeItem("aruniwaves_user");
      }
    }
    return null;
  },

  getCurrentUser() {
    return this.getUser();
  },

  async handleLoginResponse(response, successCallback, errorCallback) {
    const idToken = response.credential;
    try {
      if (typeof UI !== 'undefined' && UI.toggleSpinner) {
        UI.toggleSpinner(true);
      }
      
      const data = await API.get("checkUserByToken", { id_token: idToken });
      
      if (!data.success || !data.found) {
        const errorMsg = 'Email Gmail Anda tidak terdaftar sebagai pegawai DKP. Hubungi admin.\n\nEmail: ' + (data.email || '-');
        if (errorCallback) errorCallback(errorMsg);
        else alert(errorMsg);
        return;
      }

      const currentUser = { 
        email: data.email, 
        name: data.nama, 
        id_token: idToken,
        id_pegawai: data.id_pegawai, 
        bidang: data.bidang, 
        lokasi_kerja: data.lokasi_kerja,
        is_admin: data.is_admin || false
      };

      sessionStorage.setItem("aruniwaves_user", JSON.stringify(currentUser));
      
      if (successCallback) successCallback(currentUser);
    } catch (err) {
      console.error("[Auth] Login verification failed:", err);
      const errMsg = 'Gagal verifikasi login. Coba lagi.';
      if (errorCallback) errorCallback(errMsg);
      else alert(errMsg);
    } finally {
      if (typeof UI !== 'undefined' && UI.toggleSpinner) {
        UI.toggleSpinner(false);
      }
    }
  },

  init(buttonContainerId, successCallback, errorCallback) {
    if (typeof google === 'undefined' || !google.accounts) {
      console.warn("[Auth] Google Accounts API not loaded yet. Retrying in 500ms...");
      setTimeout(() => this.init(buttonContainerId, successCallback, errorCallback), 500);
      return;
    }

    google.accounts.id.initialize({
      client_id: CFG.GOOGLE_CLIENT_ID,
      callback: (res) => this.handleLoginResponse(res, successCallback, errorCallback),
      auto_select: false,
    });

    const btnContainer = document.getElementById(buttonContainerId);
    if (btnContainer) {
      google.accounts.id.renderButton(
        btnContainer,
        { theme: 'filled_white', size: 'medium', text: 'signin_with', shape: 'rectangular' }
      );
    }
  },

  logout(logoutCallback) {
    sessionStorage.removeItem("aruniwaves_user");
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
    if (logoutCallback) logoutCallback();
  }
};
Object.freeze(Auth);

/* ===================================================================
   ARUNIWAVES - Shared JS: API Helper (Centralized Request Engine)
   =================================================================== */

const API = {
  async request(method, action, data = {}, baseUrl = CFG.APPS_SCRIPT_URL) {
    const cachedUser = sessionStorage.getItem("aruniwaves_user");
    let token = "";
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        token = user?.id_token || "";
      } catch (e) {
        console.warn("[API] Failed parsing cached user from session:", e);
      }
    }

    let url = baseUrl;
    let options = { method };

    if (method === "POST") {
      const payload = { action, ...data };
      if (token) payload.id_token = token;
      options.body = JSON.stringify(payload);
    } else {
      const queryParams = new URLSearchParams({ action, ...data });
      if (token) queryParams.append("id_token", token);
      url = `${baseUrl}?${queryParams}`;
    }

    try {
      if (typeof UI !== 'undefined' && UI.toggleSpinner) {
        UI.toggleSpinner(true);
      }

      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const result = await res.json();
      
      if (result.success === false) {
        throw new Error(result.message || "Gagal memproses permintaan.");
      }
      return result;
    } catch (err) {
      console.error(`[API Error - ${action}]`, err);
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(err.message || "Koneksi ke server bermasalah.", "error");
      } else {
        alert(err.message || "Koneksi ke server bermasalah.");
      }
      throw err;
    } finally {
      if (typeof UI !== 'undefined' && UI.toggleSpinner) {
        UI.toggleSpinner(false);
      }
    }
  },

  async get(action, params = {}, baseUrl = CFG.APPS_SCRIPT_URL) {
    return this.request("GET", action, params, baseUrl);
  },

  async post(action, payload = {}, baseUrl = CFG.APPS_SCRIPT_URL) {
    return this.request("POST", action, payload, baseUrl);
  }
};
Object.freeze(API);

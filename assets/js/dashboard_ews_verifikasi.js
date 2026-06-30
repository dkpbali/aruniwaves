/* ===================================================================
   ARUNIWAVES - Dashboard EWS Field Verification JS
   =================================================================== */

let googleUser = null;
let activeIncidents = [];
let selectedImageBase64 = null;

// Helper shorthand selector
const $ = id => document.getElementById(id);

// ── Google Sign In (GSI) ──
function initGSI() {
  try {
    google.accounts.id.initialize({
      client_id: CFG.GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse
    });
    
    const cachedUser = localStorage.getItem("aruni_ews_user");
    if (cachedUser) {
      googleUser = JSON.parse(cachedUser);
      setAuthState("form");
      loadActiveIncidents();
    } else {
      setAuthState("login");
      google.accounts.id.renderButton(
        $("gsi-btn-container"),
        { theme: "outline", size: "large", width: 280 }
      );
    }
  } catch (err) {
    console.error("GSI Init error:", err);
    setAuthState("login");
  }
}

function decodeJwtResponse(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

async function handleCredentialResponse(response) {
  try {
    setAuthState("checking");
    const payload = decodeJwtResponse(response.credential);
    googleUser = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      id_token: response.credential
    };
    
    // Check if email is in whitelist via main Apps Script
    const json = await API.get(`checkAdmin&id_token=${encodeURIComponent(response.credential)}`);
    
    if (json.success && json.is_admin) {
      localStorage.setItem("aruni_ews_user", JSON.stringify(googleUser));
      setAuthState("form");
      showToast(`Selamat datang, ${googleUser.name}!`);
      loadActiveIncidents();
    } else {
      setAuthState("denied", googleUser.email);
    }
  } catch (err) {
    console.error("Auth process failed:", err);
    showToast("Gagal memproses autentikasi.", true);
    setAuthState("login");
  }
}

function setAuthState(state, email = "") {
  const states = ["checking", "login", "denied", "form"];
  states.forEach(s => {
    const el = $(`state-${s}`);
    if (el) el.classList.toggle("active", s === state);
  });
  
  if (state === "form" && googleUser) {
    if ($("user-photo")) $("user-photo").src = googleUser.picture;
    if ($("user-display-name")) $("user-display-name").textContent = googleUser.name;
    if ($("user-display-email")) $("user-display-email").textContent = googleUser.email;
  } else if (state === "denied") {
    if ($("denied-email-msg")) {
      $("denied-email-msg").innerHTML = `Akun <strong>${email}</strong> tidak memiliki akses sebagai staf internal/admin DKP Bali.`;
    }
  }
}

function resetAuth() {
  localStorage.removeItem("aruni_ews_user");
  googleUser = null;
  setAuthState("login");
  setTimeout(() => {
    google.accounts.id.renderButton(
      $("gsi-btn-container"),
      { theme: "outline", size: "large", width: 280 }
    );
  }, 100);
}

// ── Dropdown Data Loading ──
async function loadActiveIncidents() {
  const select = $("f-kejadian");
  if (!select) return;
  select.innerHTML = '<option value="">Memuat kejadian aktif...</option>';
  
  try {
    const [resRT, resCB] = await Promise.all([
      API.getCustom(CFG.EWS_APPS_SCRIPT_URL, "?action=getRedTide").catch(err => {
        console.error("Fetch Red Tide failed:", err);
        return [];
      }),
      API.getCustom(CFG.EWS_APPS_SCRIPT_URL, "?action=getBleaching").catch(err => {
        console.error("Fetch Bleaching failed:", err);
        return [];
      })
    ]);

    const activeRT = (resRT || []).filter(item => !item.status_final);
    const activeCB = (resCB || []).filter(item => !item.status_final);

    activeIncidents = [...activeRT, ...activeCB];

    if (activeIncidents.length === 0) {
      select.innerHTML = '<option value="">-- Tidak ada kejadian aktif --</option>';
      showToast("Tidak ada kejadian aktif saat ini.");
      return;
    }

    select.innerHTML = '<option value="">-- Pilih Kejadian Lapangan --</option>' + 
      activeIncidents.map(item => {
        const typeLabel = item.id_kejadian.startsWith("CB-") ? "[Bleaching]" : "[Red Tide]";
        const daysLabel = item.hari_ke > 0 ? ` [Pemantauan H${item.hari_ke}]` : " [Perlu Verifikasi H1]";
        return `<option value="${item.id_kejadian}">${typeLabel} ${item.id_kejadian} - ${item.lokasi}${daysLabel}</option>`;
      }).join("");
      
  } catch (err) {
    console.error("loadActiveIncidents error:", err);
    select.innerHTML = '<option value="">Gagal memuat. Muat ulang halaman.</option>';
    showToast("Gagal menghubungi server database EWS.", true);
  }
}

// ── Dropdown Selection Change Handler ──
function onEventChange() {
  const val = $("f-kejadian").value;
  const isCB = val.startsWith("CB-");
  const isRT = val.startsWith("RT-") || val.startsWith("NP-") || val.startsWith("AM-") || val.startsWith("PM-"); // Matches custom Red Tide formats
  
  const formTitle = $("form-title");
  const lblFoto = $("lbl-foto");
  const lblUploadSub = $("lbl-upload-sub");
  const lblCatatan = $("lbl-catatan");
  const fCatatan = $("f-catatan");
  const logoSub = $("logo-sub");
  
  if (isCB) {
    if (formTitle) formTitle.textContent = "Verifikasi Lapangan Coral Bleaching";
    if (lblFoto) lblFoto.textContent = "Foto Terumbu Karang";
    if (lblUploadSub) lblUploadSub.textContent = "Gunakan kamera bawah air (underwater) atau kamera HP di lokasi";
    if (lblCatatan) lblCatatan.textContent = "Catatan Penyelaman";
    if (fCatatan) fCatatan.placeholder = "Deskripsikan persentase pemutihan karang, warna memudar, kedalaman penyelaman, kekeruhan air laut, atau biota laut yang terdampak...";
    if (logoSub) logoSub.textContent = "CORAL BLEACHING EWS";
  } else {
    if (formTitle) formTitle.textContent = "Verifikasi Lapangan Red Tide";
    if (lblFoto) lblFoto.textContent = "Foto Kondisi Perairan";
    if (lblUploadSub) lblUploadSub.textContent = "Gunakan kamera HP langsung di lokasi";
    if (lblCatatan) lblCatatan.textContent = "Catatan Lapangan";
    if (fCatatan) fCatatan.placeholder = "Deskripsikan kondisi fisik air (warna, bau, busa) atau jika ada ikan mati...";
    if (logoSub) logoSub.textContent = "RED TIDE EWS";
  }
}

// ── Camera/Image Upload Handling ──
function setupImageReader() {
  const input = $("file-input");
  if (!input) return;
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa gambar.", true);
      input.value = "";
      return;
    }
    
    const uploadText = document.querySelector(".file-upload-text");
    if (uploadText) uploadText.textContent = "Membaca gambar...";
    
    const reader = new FileReader();
    reader.onload = function(evt) {
      selectedImageBase64 = evt.target.result;
      
      $("image-preview-el").src = selectedImageBase64;
      $("preview-container").style.display = "block";
      $("upload-box").style.display = "none";
    };
    reader.onerror = function() {
      showToast("Gagal membaca file gambar.", true);
      clearImagePreview();
    };
    reader.readAsDataURL(file);
  };
}

function clearImagePreview() {
  selectedImageBase64 = null;
  if ($("file-input")) $("file-input").value = "";
  if ($("image-preview-el")) $("image-preview-el").src = "";
  if ($("preview-container")) $("preview-container").style.display = "none";
  if ($("upload-box")) $("upload-box").style.display = "block";
  const uploadText = document.querySelector(".file-upload-text");
  if (uploadText) uploadText.textContent = "Ambil Foto / Upload Gambar";
}

// ── Form Submit ──
async function handleFormSubmit(event) {
  event.preventDefault();
  
  const idKejadian = $("f-kejadian").value;
  const catatan = $("f-catatan").value.trim();
  const submitBtn = $("btn-submit-el");
  
  if (!idKejadian) {
    showToast("Pilih ID Kejadian terlebih dahulu.", true);
    return;
  }
  if (!selectedImageBase64) {
    showToast("Wajib mengambil foto lokasi perairan.", true);
    return;
  }
  
  submitBtn.disabled = true;
  $("loading-overlay").style.display = "flex";
  
  const actionName = idKejadian.startsWith("CB-") ? "addBleachingVerification" : "addRedTideVerification";
  const payload = {
    action: actionName,
    id_kejadian: idKejadian,
    catatan_lapangan: catatan,
    petugas: googleUser ? googleUser.name : "Petugas DKP",
    foto_base64: selectedImageBase64
  };
  
  try {
    const result = await API.postCustom(CFG.EWS_APPS_SCRIPT_URL, payload);
    
    if (result.success) {
      showToast("Laporan verifikasi lapangan berhasil disimpan!");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } else {
      throw new Error(result.message || "Gagal menyimpan data ke server.");
    }
  } catch (err) {
    console.error("handleFormSubmit error:", err);
    showToast(err.message || "Gagal mengirim verifikasi.", true);
    submitBtn.disabled = false;
    $("loading-overlay").style.display = "none";
  }
}

// ── UI Helpers ──
function showToast(msg, isError = false) {
  const toast = $("toast-el");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.background = isError ? "var(--red)" : "var(--green)";
  toast.style.color = "#fff";
  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ── Init ──
window.onload = function() {
  initGSI();
  setupImageReader();
};

/* ===================================================================
   ARUNIWAVES - Aset Module Specific JS
   =================================================================== */

// ── State ──────────────────────────────────────
const PAGE_SIZE   = 20;
let allAset       = [];
let filteredAset  = [];
let currentPage   = 1;
let searchQuery   = "";
let hasFiltered   = false;
let selectedKondisi = "";

// Detail Modal & Edit Panel State
let activeAsetDetails = null;
let lokasiList      = [];
let pegawaiList     = [];
let editFotoB64     = null;
let editFotoNew     = false;
let googleUser      = null;
let isAdminUser     = false;

// ── Helpers ──────────────────────────────────
const tv = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || "-"; };

function kategoriIcon(kat) {
  const k = (kat || "").toUpperCase();
  
  if (k.includes("LAPTOP") || k.includes("DESKTOP") || k.includes("MONITOR")) {
    return `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--wave);"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
  }
  if (k.includes("PRINTER") || k.includes("SCANNER")) {
    return `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--wave);"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>`;
  }
  if (k.includes("JARINGAN")) {
    return `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--wave);"><path d="M2 20a10 10 0 0 1 16-8"/><path d="M2 14a6 6 0 0 1 10-5"/><path d="M2 8a2 2 0 0 1 4-2"/><circle cx="2" cy="22" r="2"/></svg>`;
  }
  if (k.includes("UPS") || k.includes("SERVER")) {
    return `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--wave);"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`;
  }
  if (k.includes("KAMERA") || k.includes("PROYEKTOR")) {
    return `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--wave);"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
  }
  return `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--wave);"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
}

function kondisiDot(k) {
  const m = {
    "BAIK":           "dot-baik",
    "KURANG BAIK":    "dot-kurang",
    "RUSAK":          "dot-rusak",
    "TIDAK DIGUNAKAN":"dot-lain",
  };
  return m[(k || "").toUpperCase()] || "dot-lain";
}

// ── Filter & Search ────────────────────────────
function applyFiltersAndSearch() {
  if (!hasFiltered) {
    updateStats();
    renderList();
    return;
  }

  const q = searchQuery.toLowerCase().trim();
  const selLokasi = document.getElementById("filter-lokasi").value;
  const selJenis = document.getElementById("filter-jenis").value;

  const locationAndJenisFiltered = allAset.filter(d => {
    if (selLokasi && d["LOKASI_ASET"] !== selLokasi) return false;
    if (selJenis && (d["KATEGORI"] || "").toUpperCase() !== selJenis.toUpperCase()) return false;
    return true;
  });

  const total  = locationAndJenisFiltered.length;
  const baik   = locationAndJenisFiltered.filter(d => (d["KONDISI"]||"").toUpperCase() === "BAIK").length;
  const kurang = locationAndJenisFiltered.filter(d => (d["KONDISI"]||"").toUpperCase() === "KURANG BAIK").length;
  const rusak  = locationAndJenisFiltered.filter(d => (d["KONDISI"]||"").toUpperCase() === "RUSAK").length;

  document.getElementById("stat-total").textContent  = total;
  document.getElementById("stat-baik").textContent   = baik;
  document.getElementById("stat-kurang").textContent = kurang;
  document.getElementById("stat-rusak").textContent  = rusak;
  document.getElementById("stats-bar").style.display = (hasFiltered && allAset.length) ? "flex" : "none";

  const lbl = document.getElementById("list-label");
  lbl.style.display = (hasFiltered && allAset.length) ? "block" : "none";

  filteredAset = locationAndJenisFiltered.filter(d => {
    if (selectedKondisi && (d["KONDISI"] || "").toUpperCase() !== selectedKondisi) return false;
    if (q) {
      const haystack = [
        d["NAMA_BARANG"] || "",
        d["KODE_ASET"] || ""
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  if (searchQuery || selectedKondisi) {
    lbl.textContent = `${filteredAset.length} aset ditemukan`;
  } else {
    lbl.textContent = `${filteredAset.length} aset terdaftar`;
  }
}

function selectKondisiPill(kondisi) {
  selectedKondisi = kondisi;
  
  document.getElementById("pill-total").classList.toggle("active", kondisi === "");
  document.getElementById("pill-baik").classList.toggle("active", kondisi === "BAIK");
  document.getElementById("pill-kurang").classList.toggle("active", kondisi === "KURANG BAIK");
  document.getElementById("pill-rusak").classList.toggle("active", kondisi === "RUSAK");
  
  applyFiltersAndSearch();
  currentPage = 1;
  renderList();
}

function populateFilterDropdowns() {
  const lokasiSelect = document.getElementById("filter-lokasi");
  const jenisSelect = document.getElementById("filter-jenis");
  if (!lokasiSelect || !jenisSelect) return;

  const lokasis = new Set();
  const jeniss = new Set();

  allAset.forEach(d => {
    if (d["LOKASI_ASET"]) lokasis.add(d["LOKASI_ASET"].trim());
    if (d["KATEGORI"]) jeniss.add(d["KATEGORI"].trim());
  });

  const sortedLokasis = [...lokasis].sort();
  lokasiSelect.innerHTML = '<option value="">- Pilih Lokasi -</option>' + 
    sortedLokasis.map(l => `<option value="${l}">${l}</option>`).join("");

  const sortedJeniss = [...jeniss].sort();
  jenisSelect.innerHTML = '<option value="">- Pilih Jenis Aset -</option>' + 
    sortedJeniss.map(j => `<option value="${j}">${j}</option>`).join("");
}

function triggerShowAset() {
  hasFiltered = true;
  selectedKondisi = "";
  document.getElementById("pill-total").className = "stat-pill active";
  document.getElementById("pill-baik").className = "stat-pill s-baik";
  document.getElementById("pill-kurang").className = "stat-pill s-kurang";
  document.getElementById("pill-rusak").className = "stat-pill s-rusak";
  document.getElementById("search-wrap").style.display = "block";
  document.getElementById("stats-bar").style.display = "flex";
  document.getElementById("list-label").style.display = "block";
  applyFiltersAndSearch();
  currentPage = 1;
  renderList();
}

function updateStats() {}

function onSearch(val) {
  searchQuery = val;
  const clearBtn = document.getElementById("search-clear");
  if (clearBtn) {
    if (val) clearBtn.classList.add("show");
    else clearBtn.classList.remove("show");
  }
  applyFiltersAndSearch();
  currentPage = 1;
  renderList();
}

function clearSearch() {
  document.getElementById("search-input").value = "";
  onSearch("");
}

// ── Render List ────────────────────────────────
function renderList() {
  const container = document.getElementById("list-container");
  if (!container) return;
  
  if (!hasFiltered) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" style="display: flex; justify-content: center; margin-bottom: 12px; color: var(--muted);"><svg style="width: 48px; height: 48px; stroke-width: 1.5; stroke: currentColor; fill: none;" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></div>
        <div class="empty-title">Filter Inventaris Aset</div>
        <p class="empty-desc">Silakan pilih kriteria filter di atas, lalu klik <strong>Tampilkan Aset</strong>.</p>
      </div>`;
    document.getElementById("btn-loadmore").classList.remove("show");
    return;
  }

  const slice     = filteredAset.slice(0, currentPage * PAGE_SIZE);
  const hasMore   = filteredAset.length > slice.length;

  if (filteredAset.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" style="display: flex; justify-content: center; margin-bottom: 12px; color: var(--muted);"><svg style="width: 48px; height: 48px; stroke-width: 1.5; stroke: currentColor; fill: none;" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
        <div class="empty-title">${searchQuery ? "Tidak ada hasil" : "Belum ada aset"}</div>
        <p class="empty-desc">${searchQuery
          ? `Tidak ditemukan aset yang cocok dengan "<strong>${searchQuery}</strong>"`
          : "Tidak ada aset yang cocok dengan kriteria filter terpilih."
        }</p>
      </div>`;
    document.getElementById("btn-loadmore").classList.remove("show");
    return;
  }

  const ul = document.createElement("div");
  ul.className = "aset-list";

  slice.forEach((d, i) => {
    const kode    = d["KODE_ASET"]   || "";
    const nama    = d["NAMA_BARANG"] || "-";
    const lokasi  = d["LOKASI_ASET"]  || "-";
    const kondisi = (d["KONDISI"] || "").toUpperCase();
    const kat     = d["SUB_KATEGORI"] || d["KATEGORI"] || "";

    const a = document.createElement("a");
    a.className = "aset-card";
    a.href      = "javascript:void(0)";
    a.onclick   = () => {
      const url = new URL(window.location.href);
      url.searchParams.set("id", kode);
      window.history.pushState({}, document.title, url.pathname + url.search);
      openDetailModal(kode);
    };
    a.style.animationDelay = `${Math.min(i, 8) * 0.04}s`;

    a.innerHTML = `
      <div class="card-icon">${kategoriIcon(kat)}</div>
      <div class="card-body">
        <div class="card-nama">${nama}</div>
        <div class="card-meta">${kode}${lokasi !== "-" ? " · " + lokasi : ""}</div>
      </div>
      <div class="card-right">
        <div class="kondisi-dot ${kondisiDot(kondisi)}"></div>
        <span class="card-chevron">›</span>
      </div>`;

    ul.appendChild(a);
  });

  container.innerHTML = "";
  container.appendChild(ul);
  document.getElementById("btn-loadmore").classList.toggle("show", hasMore);
}

function loadMore() {
  currentPage++;
  renderList();
}

// ── Fetch Aset List ────────────────────────────
async function fetchAsetList() {
  try {
    const data = await API.get("getAsetList");
    allAset = data.data || [];
    populateFilterDropdowns();
    applyFiltersAndSearch();
    checkQueryShowAll();
  } catch (err) {
    console.warn("[Aset] Fetch failed, loading fallback mock data.");
    allAset = [
      { KODE_ASET: "AST-0001", NAMA_BARANG: "Laptop Lenovo ThinkPad", LOKASI_ASET: "SEKRETARIAT", KONDISI: "BAIK", KATEGORI: "LAPTOP" },
      { KODE_ASET: "AST-0002", NAMA_BARANG: "Printer HP LaserJet", LOKASI_ASET: "SEKRETARIAT", KONDISI: "KURANG BAIK", KATEGORI: "PRINTER" },
      { KODE_ASET: "AST-0003", NAMA_BARANG: "Router Cisco", LOKASI_ASET: "RUANG IT", KONDISI: "RUSAK", KATEGORI: "JARINGAN" },
      { KODE_ASET: "AST-0004", NAMA_BARANG: "PC Desktop Dell OptiPlex", LOKASI_ASET: "BIDANG KELAUTAN", KONDISI: "BAIK", KATEGORI: "DESKTOP" },
      { KODE_ASET: "AST-0005", NAMA_BARANG: "UPS APC 700VA", LOKASI_ASET: "RUANG IT", KONDISI: "BAIK", KATEGORI: "UPS" }
    ];
    populateFilterDropdowns();
    applyFiltersAndSearch();
    checkQueryShowAll();
  }
}

function checkQueryShowAll() {
  const show = Utils.getQueryParam("show");
  if (show === "all") {
    triggerShowAset();
  }
  const assetId = Utils.getQueryParam("id");
  if (assetId) {
    openDetailModal(assetId);
  }
}

// ── Detail Modal ───────────────────────────────
function getDirectDriveUrl(url) {
  if (!url) return "";
  let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1] && url.includes("drive.google.com")) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

async function openDetailModal(assetId) {
  const modal = document.getElementById("detail-modal");
  if (!modal) return;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  
  showDetailState("loading");
  try {
    const json = await API.get(`getAset&id=${encodeURIComponent(assetId)}`);
    if (json.success && json.data) {
      activeAsetDetails = json.data;
      renderDetailAsset();
      showDetailState("content");
    } else {
      showDetailState("error");
      document.getElementById("det-error-msg").textContent = json.message || "Aset tidak ditemukan.";
    }
  } catch (err) {
    showDetailState("error");
    document.getElementById("det-error-msg").textContent = "Gagal memuat data aset dari server.";
    console.error(err);
  }
}

function closeDetailModal() {
  const modal = document.getElementById("detail-modal");
  if (modal) modal.classList.remove("open");
  document.body.style.overflow = "";
  
  const url = new URL(window.location.href);
  url.searchParams.delete("id");
  window.history.replaceState({}, document.title, url.pathname + url.search);
}

function handleDetailOverlayClick(e) {
  if (e.target.id === "detail-modal") {
    closeDetailModal();
  }
}

function showDetailState(s) {
  ["loading", "error", "content"].forEach(n => {
    const el = document.getElementById(`det-state-${n}`);
    if (el) {
      el.style.display = "none";
      el.classList.remove("active");
    }
  });
  const target = document.getElementById(`det-state-${s}`);
  if (target) {
    target.style.display = s === "loading" ? "flex" : "block";
    target.classList.add("active");
  }
}

function renderDetailAsset() {
  if (!activeAsetDetails) return;
  tv("v-kode", activeAsetDetails.KODE_ASET);
  tv("v-nama", activeAsetDetails.NAMA_BARANG);
  tv("v-kategori", activeAsetDetails.KATEGORI);
  
  const kondisi = (activeAsetDetails.KONDISI || "").toUpperCase();
  const condBadge = document.getElementById("v-kondisi-badge");
  if (condBadge) {
    condBadge.textContent = kondisi || "-";
    condBadge.className = "badge";
    if (kondisi === "BAIK") {
      condBadge.classList.add("badge-baik");
    } else if (kondisi === "KURANG BAIK") {
      condBadge.classList.add("badge-kurang");
    } else if (kondisi === "RUSAK") {
      condBadge.classList.add("badge-rusak");
    } else {
      condBadge.classList.add("badge-cat");
    }
  }
  
  const fotoWrap = document.getElementById("v-foto-wrap");
  if (fotoWrap) {
    if (activeAsetDetails.FOTO_URL) {
      fotoWrap.innerHTML = `<img src="${getDirectDriveUrl(activeAsetDetails.FOTO_URL)}" alt="Foto Aset" />`;
    } else {
      fotoWrap.innerHTML = `
        <div class="foto-placeholder">
          <svg class="svg-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          <p>Foto belum tersedia</p>
        </div>`;
    }
  }
  
  tv("v-subkat", activeAsetDetails.SUB_KATEGORI);
  tv("v-merk", activeAsetDetails.MERK);
  tv("v-spek", activeAsetDetails.SPESIFIKASI);
  tv("v-tahun", activeAsetDetails.TAHUN_PEROLEHAN);
  tv("v-tik", activeAsetDetails.KODE_TIK || activeAsetDetails.KODE_TIK_ASET);
  tv("v-lokasi", activeAsetDetails.LOKASI_ASET);
  tv("v-pengguna", activeAsetDetails.PENGGUNA_ASET);
  tv("v-kondisi", activeAsetDetails.KONDISI);
  
  const ketBox = document.getElementById("v-keterangan-box");
  if (ketBox) {
    if (activeAsetDetails.KETERANGAN) {
      tv("v-keterangan", activeAsetDetails.KETERANGAN);
      ketBox.style.display = "block";
    } else {
      ketBox.style.display = "none";
    }
  }
}

// ── Google Authentication & Edit Panel Port ──
function initGsi() {
  const loginStateDiv = document.getElementById("auth-login");
  if (loginStateDiv) {
    let btnContainer = document.getElementById("gsi-btn-container");
    if (!btnContainer) {
      btnContainer = document.createElement("div");
      btnContainer.id = "gsi-btn-container";
      btnContainer.style.margin = "16px auto";
      btnContainer.style.display = "flex";
      btnContainer.style.justifyContent = "center";
      
      const customBtn = loginStateDiv.querySelector(".btn-google");
      if (customBtn) {
        customBtn.style.display = "none";
        customBtn.parentNode.insertBefore(btnContainer, customBtn);
      } else {
        loginStateDiv.appendChild(btnContainer);
      }
    }
    // Shared Auth Google initializer
    Auth.init("gsi-btn-container", onGoogleLoginSuccess, onGoogleLoginError);
  }
  
  // Set change listeners on form elements to update the preview & button state
  ["e-lokasi", "e-pengguna", "e-kondisi"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", checkChanges);
  });
  const ketEl = document.getElementById("e-keterangan");
  if (ketEl) ketEl.addEventListener("input", checkChanges);
  
  fetchOptions();
}

async function fetchOptions() {
  try {
    const locJson = await API.get("getLokasi");
    if (locJson.success) {
      lokasiList = locJson.data;
      const select = document.getElementById("e-lokasi");
      if (select) {
        select.innerHTML = '<option value="">- Pilih Lokasi -</option>' +
          lokasiList.map(l => `<option value="${l.id}" data-nama="${l.nama}">${l.nama}</option>`).join("");
      }
    }
    
    const pegJson = await API.get("getPegawai");
    if (pegJson.success) {
      pegawaiList = pegJson.data;
      const select = document.getElementById("e-pengguna");
      if (select) {
        select.innerHTML = '<option value="">- Pilih Pengguna -</option>' +
          pegawaiList.map(p => `<option value="${p.id}" data-nama="${p.nama}">${p.nama} (${p.bidang})</option>`).join("");
      }
    }
  } catch (err) {
    console.error("[Aset] Failed to load options:", err);
  }
}

async function onGoogleLoginSuccess(currentUserObj) {
  try {
    setAuthState("checking");
    googleUser = currentUserObj;
    
    const json = await API.get(`checkAdmin&id_token=${encodeURIComponent(currentUserObj.id_token)}`);
    
    if (json.success && json.is_admin) {
      isAdminUser = true;
      setAuthState("form");
      UI.showToast(`Selamat datang, ${googleUser.name}!`);
      populateEditForm();
    } else {
      isAdminUser = false;
      setAuthState("denied", googleUser.email);
    }
  } catch (err) {
    console.error("GSI handler failed:", err);
    UI.showToast("Gagal memproses autentikasi.", "error");
    setAuthState("login");
  }
}

function onGoogleLoginError(msg) {
  UI.showToast(msg, "error");
}

function setAuthState(state, email = "") {
  const states = ["login", "denied", "checking", "form"];
  states.forEach(s => {
    const el = document.getElementById(`auth-${s}`);
    if (el) el.style.display = "none";
  });
  
  if (state === "denied" && email) {
    const emailLabel = document.getElementById("auth-denied-email");
    if (emailLabel) emailLabel.textContent = `Email Anda (${email}) tidak terdaftar sebagai admin.`;
  }
  
  const target = document.getElementById(`auth-${state}`);
  if (target) target.style.display = "block";
}

function openEdit() {
  const panel = document.getElementById("edit-panel");
  if (panel) {
    panel.classList.add("open");
    const cachedUser = Auth.getUser();
    if (!cachedUser) {
      setAuthState("login");
    } else {
      onGoogleLoginSuccess(cachedUser);
    }
  }
}

function closeEdit() {
  const panel = document.getElementById("edit-panel");
  if (panel) panel.classList.remove("open");
}

function handleOverlayClick(e) {
  if (e.target.id === "edit-panel") {
    closeEdit();
  }
}

function selectOptionByName(selectId, name) {
  const select = document.getElementById(selectId);
  if (!select || !name) return;
  const searchVal = name.toUpperCase().trim();
  for (let i = 0; i < select.options.length; i++) {
    const optName = select.options[i].getAttribute("data-nama") || select.options[i].text;
    if (optName.toUpperCase().trim() === searchVal || select.options[i].value.toUpperCase().trim() === searchVal) {
      select.selectedIndex = i;
      return;
    }
  }
  select.selectedIndex = 0;
}

function populateEditForm() {
  if (!activeAsetDetails) return;
  document.getElementById("edit-kode-label").textContent = activeAsetDetails.KODE_ASET;
  
  selectOptionByName("e-lokasi", activeAsetDetails.LOKASI_ASET);
  selectOptionByName("e-pengguna", activeAsetDetails.PENGGUNA_ASET);
  
  const condSelect = document.getElementById("e-kondisi");
  if (condSelect) condSelect.value = activeAsetDetails.KONDISI || "";
  
  const ketText = document.getElementById("e-keterangan");
  if (ketText) ketText.value = activeAsetDetails.KETERANGAN || "";
  
  const preview = document.getElementById("edit-foto-preview");
  const img = document.getElementById("edit-foto-img");
  const dropZone = document.getElementById("edit-foto-drop");
  
  if (activeAsetDetails.FOTO_URL) {
    if (img) img.src = getDirectDriveUrl(activeAsetDetails.FOTO_URL);
    if (preview) preview.style.display = "block";
    if (dropZone) dropZone.style.display = "none";
  } else {
    if (img) img.src = "";
    if (preview) preview.style.display = "none";
    if (dropZone) dropZone.style.display = "block";
  }
  
  editFotoB64 = null;
  editFotoNew = false;
  checkChanges();
}

function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = err => reject(err);
    };
    reader.onerror = err => reject(err);
  });
}

function previewEditFoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    UI.showToast("Ukuran foto maksimal 5MB.", "error");
    return;
  }
  
  compressImage(file, 1200, 1200, 0.7).then(compressedBase64 => {
    editFotoB64 = compressedBase64;
    editFotoNew = true;
    const img = document.getElementById("edit-foto-img");
    if (img) img.src = compressedBase64;
    const preview = document.getElementById("edit-foto-preview");
    if (preview) preview.style.display = "block";
    const dropZone = document.getElementById("edit-foto-drop");
    if (dropZone) dropZone.style.display = "none";
    checkChanges();
  }).catch(err => {
    console.error("Compression failed:", err);
    UI.showToast("Gagal mengompres foto.", "error");
  });
}

function removeEditFoto() {
  editFotoB64 = null;
  editFotoNew = true;
  const img = document.getElementById("edit-foto-img");
  if (img) img.src = "";
  const preview = document.getElementById("edit-foto-preview");
  if (preview) preview.style.display = "none";
  const dropZone = document.getElementById("edit-foto-drop");
  if (dropZone) dropZone.style.display = "block";
  const input = document.getElementById("edit-foto-input");
  if (input) input.value = "";
  checkChanges();
}

function handleEditDrop(e) {
  e.preventDefault();
  const dropZone = document.getElementById("edit-foto-drop");
  if (dropZone) dropZone.classList.remove("drag");
  const file = e.dataTransfer.files[0];
  if (file?.type.startsWith("image/")) {
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = document.getElementById("edit-foto-input");
    if (input) input.files = dt.files;
    previewEditFoto({ target: { files: [file] } });
  }
}

function checkChanges() {
  if (!activeAsetDetails) return;
  const changes = [];
  
  const selLok = document.getElementById("e-lokasi");
  const newLokId = selLok ? selLok.value : "";
  const newLokName = selLok && selLok.selectedIndex >= 0 ? selLok.options[selLok.selectedIndex].getAttribute("data-nama") || "" : "";
  const oldLokId = activeAsetDetails.ID_LOKASI || "";
  const oldLokName = activeAsetDetails.LOKASI_ASET || "";
  
  if (newLokId !== oldLokId || newLokName !== oldLokName) {
    changes.push({ field: "Lokasi", old: oldLokName || "-", new: newLokName || "-" });
  }
  
  const selPeg = document.getElementById("e-pengguna");
  const newPegId = selPeg ? selPeg.value : "";
  const newPegName = selPeg && selPeg.selectedIndex >= 0 ? selPeg.options[selPeg.selectedIndex].getAttribute("data-nama") || "" : "";
  const oldPegId = activeAsetDetails.ID_PENGGUNA || "";
  const oldPegName = activeAsetDetails.PENGGUNA_ASET || "";
  
  if (newPegId !== oldPegId || newPegName !== oldPegName) {
    changes.push({ field: "Pengguna", old: oldPegName || "-", new: newPegName || "-" });
  }
  
  const condSelect = document.getElementById("e-kondisi");
  const newKond = condSelect ? condSelect.value : "";
  const oldKond = activeAsetDetails.KONDISI || "";
  if (newKond !== oldKond) {
    changes.push({ field: "Kondisi", old: oldKond, new: newKond });
  }
  
  const ketText = document.getElementById("e-keterangan");
  const newKet = ketText ? ketText.value.trim() : "";
  const oldKet = (activeAsetDetails.KETERANGAN || "").trim();
  if (newKet !== oldKet) {
    changes.push({ field: "Keterangan", old: oldKet || "-", new: newKet || "-" });
  }
  
  if (editFotoNew) {
    const oldHasFoto = !!activeAsetDetails.FOTO_URL;
    const newHasFoto = !!editFotoB64;
    if (oldHasFoto !== newHasFoto || editFotoB64 !== null) {
      changes.push({
        field: "Foto",
        old: oldHasFoto ? "Ada foto" : "Tidak ada",
        new: newHasFoto ? "Foto baru" : "Hapus foto"
      });
    }
  }
  
  const previewDiv = document.getElementById("changes-preview");
  const itemsDiv = document.getElementById("changes-items");
  const saveBtn = document.getElementById("btn-save");
  
  if (changes.length > 0) {
    if (itemsDiv) {
      itemsDiv.innerHTML = changes.map(c => `<div class="change-item"><span>${c.field}:</span> ${c.old} → ${c.new}</div>`).join("");
    }
    if (previewDiv) previewDiv.style.display = "block";
    if (saveBtn) saveBtn.disabled = false;
  } else {
    if (previewDiv) previewDiv.style.display = "none";
    if (itemsDiv) itemsDiv.innerHTML = "";
    if (saveBtn) saveBtn.disabled = true;
  }
}

async function saveEdit() {
  if (!googleUser || !isAdminUser || !activeAsetDetails) return;
  
  const saveBtn = document.getElementById("btn-save");
  const oldText = saveBtn ? saveBtn.textContent : "";
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "⌛ Menyimpan Perubahan...";
  }
  
  const selLok = document.getElementById("e-lokasi");
  const selPeg = document.getElementById("e-pengguna");
  const newLokId = selLok ? selLok.value : "";
  const newLokName = selLok && selLok.selectedIndex >= 0 ? selLok.options[selLok.selectedIndex].getAttribute("data-nama") || "" : "";
  const newPegId = selPeg ? selPeg.value : "";
  const newPegName = selPeg && selPeg.selectedIndex >= 0 ? selPeg.options[selPeg.selectedIndex].getAttribute("data-nama") || "" : "";
  const newKond = document.getElementById("e-kondisi") ? document.getElementById("e-kondisi").value : "";
  const newKet = document.getElementById("e-keterangan") ? document.getElementById("e-keterangan").value.trim() : "";
  
  const payload = {
    kode_aset: activeAsetDetails.KODE_ASET,
    lokasi_aset: newLokName,
    id_lokasi: newLokId,
    pengguna_aset: newPegName,
    id_pengguna: newPegId,
    kondisi: newKond,
    keterangan: newKet,
    keterangan_log: `Diupdate oleh ${googleUser.name}`
  };
  
  if (editFotoNew) {
    if (editFotoB64) {
      payload.foto_base64 = editFotoB64;
    } else {
      payload.foto_url = "";
    }
  }
  
  try {
    const json = await API.post("updateAset", payload);
    UI.showToast("Data aset berhasil diperbarui!");
    closeEdit();
    openDetailModal(activeAsetDetails.KODE_ASET);
  } catch (err) {
    console.error("Submit failed:", err);
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = oldText;
    }
  }
}

// ── Initialization ────────────────────────────
(async function initAset() {
  // Render Dynamic navigation header/nav
  UI.renderNavigation("aset");

  // Restores session from localStorage/sessionStorage
  const cachedUser = Auth.getUser();
  if (cachedUser) {
    googleUser = cachedUser;
  }

  // Load GIS libraries
  initGsi();

  // Load Aset Inventory
  await fetchAsetList();
  
  // Keyboard viewport adjustments
  document.addEventListener("focusin", e => {
    if (["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) {
      document.body.classList.add("keyboard-open");
    }
  });
  document.addEventListener("focusout", e => {
    if (["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) {
      document.body.classList.remove("keyboard-open");
    }
  });
})();

/* ===================================================================
   ARUNIWAVES - Humas Module Specific JS
   =================================================================== */

let allPegawai = [];
let allKonten = [];
let selectedPlatform = "";
let selectedJenis = "";
let fotoB64 = null;
let hasFoto = false;
let editingHumasId = null;
let filterStatus = "SEMUA";

// Helper shorthand selector
const $ = id => document.getElementById(id);

// Jenis konten per platform
const JENIS_MAP = {
  "Website":   ["Berita"],
  "Instagram": ["Post", "Story", "Reels"],
  "YouTube":   ["Video", "Shorts"],
  "TikTok":    ["Video"],
  "Facebook":  ["Post", "Reels"],
};

const PLATFORM_ICONS = {
  "Website":   `<svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  "Instagram": `<svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  "YouTube":   `<svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>`,
  "TikTok":    `<svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>`,
  "Facebook":  `<svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`
};

// ── Tabs ────────────────────────────────────
function switchTab(tab) {
  ["submit"].forEach(t => {
    const sect = $(`section-${t}`);
    const tabEl = $(`tab-${t}`);
    if (sect) sect.classList.toggle("active", t === tab);
    if (tabEl) tabEl.classList.toggle("active", t === tab);
  });
}

// ── Platform ─────────────────────────────────
function selectPlatform(platform, el) {
  selectedPlatform = platform;
  selectedJenis = "";
  document.querySelectorAll(".platform-card").forEach(c => c.classList.remove("selected"));
  if (el) el.classList.add("selected");

  const jenis = JENIS_MAP[platform] || [];
  const grid = $("jenis-grid");
  if (!grid) return;
  grid.innerHTML = jenis.map(j => `
    <div class="jenis-btn" onclick="selectJenis('${j}', this)">${j}</div>
  `).join("");
  
  const fldJenis = $("field-jenis");
  if (fldJenis) fldJenis.style.display = "block";

  if (jenis.length === 1) {
    const btn = grid.querySelector(".jenis-btn");
    if (btn) { 
      btn.classList.add("selected"); 
      selectedJenis = jenis[0]; 
    }
  }
}

function selectJenis(jenis, el) {
  selectedJenis = jenis;
  document.querySelectorAll(".jenis-btn").forEach(b => b.classList.remove("selected"));
  if (el) el.classList.add("selected");
}

// ── Pegawai ──────────────────────────────────
async function loadPegawai() {
  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      allPegawai = [
        { id:"P0001", nama:"NI PUTU ADELIA",        bidang:"SEKRETARIAT", subBidang:"SUNPROG" },
        { id:"P0002", nama:"PANDE GDE KRISHNADANA",  bidang:"SEKRETARIAT", subBidang:"SUNPROG" },
        { id:"P0005", nama:"DEWA YOJANA",             bidang:"BIDANG P2HP", subBidang:"" },
        { id:"P0008", nama:"WAYAN SAPUTRA",           bidang:"BIDANG PERIKANAN", subBidang:"" },
      ];
    } else {
      const json = await API.get("getPegawai");
      if (json.success) allPegawai = json.data;
    }
    initAutocomplete("f-pegawai-search", "f-pegawai-list", "f-pegawai", allPegawai, () => {
      onPegawaiChange();
    });
  } catch (e) {
    console.error("Error loading employees:", e);
  }
}

function onPegawaiChange() {
  const id = $("f-pegawai").value;
  const peg = allPegawai.find(p => p.id === id);
  const el = $("display-bidang");
  if (peg) {
    $("val-bidang").textContent = peg.bidang + (peg.subBidang ? ` - ${peg.subBidang}` : "");
    el.classList.add("show");
  } else {
    el.classList.remove("show");
  }
}

// ── Foto ─────────────────────────────────────
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

async function previewFoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const previewImg = $("foto-img");
  previewImg.src = "";
  
  try {
    const compressedDataUrl = await compressImage(file, 1600, 1600, 0.8);
    fotoB64 = compressedDataUrl;
    hasFoto = true;
    previewImg.src = compressedDataUrl;
    $("foto-preview").style.display = "block";
    $("foto-zone").style.display = "none";
    $("foto-required").style.display = "none";
  } catch (err) {
    console.error("Compression error:", err);
    UI.showToast("Gagal memproses foto.", true);
  }
}

function handleDrop(e) {
  e.preventDefault();
  $("foto-zone").classList.remove("drag");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    const dt = new DataTransfer(); 
    dt.items.add(file);
    $("f-screenshot").files = dt.files;
    previewFoto({ target: { files: [file] } });
  }
}

function removeFoto() {
  fotoB64 = null; 
  hasFoto = false;
  $("foto-preview").style.display = "none";
  $("foto-zone").style.display = "block";
  $("f-screenshot").value = "";
}

// ── Submit / Update ───────────────────────────
async function submitHumas(e) {
  e.preventDefault();
  if (!selectedPlatform) { UI.showToast("Pilih platform terlebih dahulu.", true); return; }
  if (!selectedJenis) { UI.showToast("Pilih jenis konten.", true); return; }
  if (!hasFoto) {
    $("foto-required").style.display = "block";
    return;
  }

  const btn = $("btn-submit");
  btn.disabled = true;
  btn.innerHTML = '<span class="spin" style="border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; width: 16px; height: 16px; display: inline-block;"></span> <span>Menyimpan...</span>';

  const pegId = $("f-pegawai").value;
  if (!pegId) {
    UI.showToast("Pilih nama Anda dari daftar yang muncul saat mengetik.", true);
    btn.disabled = false;
    btn.innerHTML = editingHumasId ? "<span>Simpan Perubahan</span>" : "<span>Kirim untuk Divalidasi</span>";
    return;
  }
  const peg = allPegawai.find(p => p.id === pegId);
  const bidang = peg ? peg.bidang + (peg.subBidang ? ` - ${peg.subBidang}` : "") : "";

  let payload;
  if (editingHumasId) {
    const usr = Auth.getCurrentUser();
    if (!usr) {
      UI.showToast("Login Google diperlukan untuk menyimpan perubahan.", true);
      btn.disabled = false; 
      btn.innerHTML = "<span>Simpan Perubahan</span>";
      return;
    }
    payload = {
      action:           "updateHumas",
      id_konten:        editingHumasId,
      id_token:         usr.id_token,
      nama_konten:      $("f-nama-konten").value,
      tanggal_posting:  $("f-tanggal-posting").value,
      link_konten:      $("f-link").value,
      platform:         selectedPlatform,
      jenis_konten:     selectedJenis,
    };
    if (fotoB64) {
      payload.screenshot_base64 = fotoB64;
    }
  } else {
    payload = {
      action:           "submitHumas",
      id_pegawai:       pegId,
      nama_pegawai:     peg ? peg.nama : "",
      bidang,
      platform:         selectedPlatform,
      jenis_konten:     selectedJenis,
      nama_konten:      $("f-nama-konten").value,
      tanggal_posting:  $("f-tanggal-posting").value,
      link_konten:      $("f-link").value,
      screenshot_base64: fotoB64,
    };
  }

  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      await new Promise(r => setTimeout(r, 1100));
      if (editingHumasId) {
        UI.showToast("Perubahan berhasil disimpan (mode demo).");
        window.location.href = "../index.html?actTab=humas";
      } else {
        const id = "HUM-" + String(Math.floor(Math.random()*900)+100).padStart(4,"0");
        showSuccess(id);
      }
      return;
    }
    
    const data = await API.post(payload);
    if (data.success) {
      if (editingHumasId) {
        UI.showToast("Perubahan berhasil disimpan!");
        window.location.href = "../index.html?actTab=humas";
      } else {
        showSuccess(data.konten_id);
      }
    } else {
      throw new Error(data.message);
    }
  } catch(err) {
    UI.showToast("Gagal: " + err.message, true);
    btn.disabled = false;
    btn.innerHTML = editingHumasId ? "<span>Simpan Perubahan</span>" : "<span>Kirim untuk Divalidasi</span>";
  }
}

function showSuccess(id) {
  UI.showToast("Laporan berhasil dikirim! Kode Konten: " + id);
  setTimeout(() => {
    window.location.href = "../index.html?actTab=humas";
  }, 1500);
}

function resetForm() {
  $("form-humas").reset();
  $("form-humas").style.display = "block";
  $("success-screen").style.display = "none";
  $("btn-submit").disabled = false;
  $("btn-submit").textContent = "Kirim untuk Divalidasi";
  $("display-bidang").classList.remove("show");
  $("field-jenis").style.display = "none";
  document.querySelectorAll(".platform-card").forEach(c => c.classList.remove("selected"));
  selectedPlatform = ""; 
  selectedJenis = "";
  $("f-pegawai-search").value = "";
  $("f-pegawai").value = "";
  removeFoto();
}

// ── Load Konten ──────────────────────────────
async function loadKonten() {
  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      allKonten = [
        { id:"HUM-0003", namaPegawai:"PANDE GDE KRISHNADANA", bidang:"SEKRETARIAT - SUNPROG", platform:"YouTube",   jenisKonten:"Video",   namaKonten:"Sosialisasi Nelayan Tangkap 2025",        tanggalPosting:"01/06/2025", screenshotUrl:"", status:"DISETUJUI" },
        { id:"HUM-0002", namaPegawai:"NI PUTU ADELIA",        bidang:"SEKRETARIAT - SUNPROG", platform:"Instagram", jenisKonten:"Post",    namaKonten:"Monitoring Budidaya Ikan Kerapu",         tanggalPosting:"30/05/2025", screenshotUrl:"", status:"PENDING" },
        { id:"HUM-0001", namaPegawai:"DEWA YOJANA",           bidang:"BIDANG P2HP",           platform:"TikTok",    jenisKonten:"Video",   namaKonten:"Behind the scenes panen lobster",         tanggalPosting:"28/05/2025", screenshotUrl:"", status:"DITOLAK" },
      ];
    } else {
      const json = await API.get("getHumas");
      if (json.success) allKonten = json.data;
    }
  } catch (e) {
    console.error("Error loading content:", e);
  }
}

function filterKonten() {
  renderKonten();
}

function renderKonten() {
  const list = $("konten-list");
  if (!list) return;
  const qEl = $("search-konten");
  const q = qEl ? qEl.value.toLowerCase() : "";

  let filtered = allKonten.filter(k => {
    if (filterStatus !== "SEMUA" && k.status !== filterStatus) return false;
    if (q && !k.namaPegawai.toLowerCase().includes(q) &&
             !k.namaKonten.toLowerCase().includes(q)  &&
             !k.platform.toLowerCase().includes(q))   return false;
    return true;
  });

  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state"><svg class="svg-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 10px;"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="M19 16v6"/><path d="m16 19 3 3 3-3"/></svg><p>Tidak ada konten ditemukan.</p></div>';
    return;
  }

  const defaultDocIcon = `<svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  const statMap = { "PENDING":"stat-pending", "DISETUJUI":"stat-disetujui", "DITOLAK":"stat-ditolak" };
  list.innerHTML = filtered.map(k => `
    <div class="konten-card">
      <div class="konten-header">
        <div class="platform-badge" style="background:rgba(0,119,230,.1)">
          ${PLATFORM_ICONS[k.platform] || defaultDocIcon}
        </div>
        <div style="flex:1;min-width:0">
          <div class="konten-title">${k.namaKonten}</div>
          <div class="konten-meta">
            ${k.platform} · ${k.jenisKonten} · ${k.namaPegawai}
          </div>
          <div class="konten-meta" style="margin-top:2px">${k.tanggalPosting}</div>
        </div>
        <span class="konten-status ${statMap[k.status] || 'stat-pending'}">${k.status}</span>
      </div>
      ${k.screenshotUrl ? `<img class="konten-screenshot" src="${k.screenshotUrl}" alt="screenshot" onerror="this.style.display='none'"/>` : ""}
    </div>
  `).join("");
}

// ── Statistik ────────────────────────────────
async function loadStatistik() {
  const statContent = $("statistik-content");
  if (!statContent) return;
  statContent.innerHTML =
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;"><div class="shimmer-card" style="height:80px;"></div><div class="shimmer-card" style="height:80px;"></div></div>';

  if (!allKonten.length) await loadKonten();

  const approved = allKonten.filter(k => k.status === "DISETUJUI");
  const total = approved.length;

  const byPlatform = {};
  approved.forEach(k => {
    byPlatform[k.platform] = (byPlatform[k.platform] || 0) + 1;
  });

  const byBidang = {};
  approved.forEach(k => {
    const b = k.bidang.split(" - ")[0];
    byBidang[b] = (byBidang[b] || 0) + 1;
  });
  const maxBidang = Math.max(...Object.values(byBidang), 1);
  const sortedBidang = Object.entries(byBidang).sort((a,b) => b[1]-a[1]);

  const defaultDocIcon = `<svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  statContent.innerHTML = `
    <div class="stats-header">
      <div class="stats-total">${total}</div>
      <div class="stats-label">Total Konten Disetujui</div>
    </div>

    <div class="platform-stats">
      ${Object.entries(byPlatform).map(([p,n]) => `
        <div class="pstat-card">
          <span class="pstat-icon">${PLATFORM_ICONS[p] || defaultDocIcon}</span>
          <div>
            <div class="pstat-num">${n}</div>
            <div class="pstat-name">${p}</div>
          </div>
        </div>
      `).join("")}
    </div>

    <div class="bidang-section-title">Kontribusi per Bidang</div>
    ${sortedBidang.map(([b,n]) => `
      <div class="bidang-bar">
        <div class="bidang-name">${b}</div>
        <div class="bidang-track">
          <div class="bidang-fill" style="width:${Math.round(n/maxBidang*100)}%"></div>
        </div>
        <div class="bidang-count">${n}</div>
      </div>
    `).join("")}
    ${!sortedBidang.length ? '<div class="empty-state"><svg class="svg-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 10px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><p>Belum ada data statistik.</p></div>' : ""}
  `;
}

// ── Autocomplete Helper ───────────────────────
function initAutocomplete(inputId, listId, hiddenId, dataList, onSelectCallback) {
  const searchInput = $(inputId);
  const dropdownList = $(listId);
  const hiddenInput = $(hiddenId);

  document.addEventListener("click", e => {
    if (!searchInput.contains(e.target) && !dropdownList.contains(e.target)) {
      dropdownList.style.display = "none";
    }
  });

  searchInput.addEventListener("focus", () => {
    filterList();
  });

  searchInput.addEventListener("input", () => {
    hiddenInput.value = "";
    if (onSelectCallback) onSelectCallback("");
    filterList();
  });

  function filterList() {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = dataList.filter(item => 
      item.nama.toLowerCase().includes(query) || 
      item.id.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      dropdownList.innerHTML = '<div style="padding:10px 14px;color:var(--muted);font-size:13px;">Tidak ditemukan</div>';
      dropdownList.style.display = "block";
      return;
    }

    dropdownList.innerHTML = filtered.map(item => `
      <div class="autocomplete-item" data-id="${item.id}" data-nama="${item.nama}">
        <div style="font-weight:600;">${item.nama}</div>
        <div class="autocomplete-item-sub">${item.id} · ${item.bidang || ""} ${item.subBidang ? '- ' + item.subBidang : ''}</div>
      </div>
    `).join("");

    dropdownList.style.display = "block";

    dropdownList.querySelectorAll(".autocomplete-item").forEach(el => {
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const id = el.dataset.id;
        const nama = el.dataset.nama;
        searchInput.value = nama;
        hiddenInput.value = id;
        dropdownList.style.display = "none";
        if (onSelectCallback) {
          onSelectCallback(id);
        }
      });
    });
  }
}

function formatDriveImgUrl(url) {
  if (!url) return "";
  const match = url.match(/id=([^&]+)/) || url.match(/\/file\/d\/([^\/]+)/) || url.match(/\/d\/([^\/]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

function normalizeDate(dateStr) {
  if (!dateStr) return "";
  dateStr = dateStr.toString().trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}\b/.test(dateStr)) return dateStr.substring(0, 10);
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return dateStr;
}

async function handleEditParam() {
  const editId = new URLSearchParams(window.location.search).get("editHumas");
  if (!editId) return;
  
  editingHumasId = editId;
  
  if (!allPegawai.length) {
    await loadPegawai();
  }
  await loadKonten();
  
  const item = allKonten.find(k => k.id === editId);
  if (!item) {
    UI.showToast("Data konten tidak ditemukan.", true);
    return;
  }
  
  const peg = allPegawai.find(p => p.nama === item.namaPegawai || p.id === item.idPegawai);
  if (peg) {
    $("f-pegawai-search").value = peg.nama;
    $("f-pegawai").value = peg.id;
    onPegawaiChange();
  }
  
  $("f-nama-konten").value = item.namaKonten || "";
  if (item.tanggalPosting) {
    $("f-tanggal-posting").value = normalizeDate(item.tanggalPosting);
  }
  $("f-link").value = item.linkKonten || "";
  
  if (item.platform) {
    const platformCards = document.querySelectorAll(".platform-card");
    let foundCard = null;
    platformCards.forEach(c => {
      if (c.textContent.trim().includes(item.platform)) {
        foundCard = c;
      }
    });
    if (foundCard) {
      setTimeout(() => { selectPlatform(item.platform, foundCard); }, 100);
    }
  }
  
  if (item.jenisKonten) {
    const jenisGrid = $("jenis-grid");
    if (jenisGrid) {
      setTimeout(() => {
        const buttons = jenisGrid.querySelectorAll(".jenis-btn");
        buttons.forEach(btn => {
          if (btn.textContent.trim() === item.jenisKonten) {
            selectJenis(item.jenisKonten, btn);
          }
        });
      }, 150);
    }
  }
  
  if (item.screenshotUrl && item.screenshotUrl.trim() !== "" && item.screenshotUrl !== "undefined" && item.screenshotUrl !== "null") {
    const preview = $("foto-preview");
    const img = $("foto-img");
    img.src = formatDriveImgUrl(item.screenshotUrl);
    preview.style.display = "block";
    $("foto-zone").style.display = "none";
    hasFoto = true;
  }
  
  const btn = $("btn-submit");
  if (btn) btn.textContent = "Simpan Perubahan";
  
  const heroEyebrow = document.querySelector(".bbm-eyebrow");
  const heroTitle = document.querySelector(".bbm-title");
  const heroSub = document.querySelector(".bbm-sub");
  if (heroEyebrow) heroEyebrow.textContent = "EDIT KONTRIBUSI HUMAS";
  if (heroTitle) heroTitle.textContent = "Ubah Data Konten";
  if (heroSub) heroSub.textContent = "Perbarui formulir di bawah ini untuk menyimpan perubahan data konten medsos Anda.";
  document.title = "Edit Kontribusi Humas - ARUNIWAVES";
}

// ── Initializer ──
(async function initHumas() {
  UI.renderNavigation("humas");
  
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab");
  if (tabParam === "submit") {
    switchTab("submit");
  }

  // Keyboard visual viewport handler
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

  await loadPegawai();
  await handleEditParam();
})();

/* ===================================================================
   ARUNIWAVES - Dashboard Kendaraan & BBM Module Specific JS
   =================================================================== */

const BIDANG_LIST = ["SEKRETARIAT", "BIDANG PERIKANAN", "BIDANG P2HP", "BIDANG KELAUTAN", "BIDANG PSDKP"];
const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

// ── STATE ──
let allBbm = [];
let filteredBbm = [];
let allVehicles = [];
let activeRealisasiTab = "terlapor";
let currentTab = "kendaraan";
let selectedVehicleId = null;
let openBidangGroups = { 0: true }; // Open SEKRETARIAT by default

let openAccordions = {};
let bidangCharts = {};

// Helper shorthand selector
const $ = id => document.getElementById(id);

// Convert Google Drive sharing URL to embeddable direct image URL
function toDriveDirectUrl(url) {
  if (!url) return "";
  const m = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/); 
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;
  return url;
}

function parseTanggal(str) {
  if (!str) return null;
  if (str instanceof Date) return isNaN(str.getTime()) ? null : str;
  if (typeof str !== 'string') str = String(str);
  str = str.trim();
  
  const mDashes = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (mDashes) {
    return new Date(
      parseInt(mDashes[1], 10),
      parseInt(mDashes[2], 10) - 1,
      parseInt(mDashes[3], 10),
      mDashes[4] ? parseInt(mDashes[4], 10) : 0,
      mDashes[5] ? parseInt(mDashes[5], 10) : 0,
      mDashes[6] ? parseInt(mDashes[6], 10) : 0
    );
  }
  
  const mSlashes = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (mSlashes) {
    const val1 = parseInt(mSlashes[1], 10);
    const val2 = parseInt(mSlashes[2], 10);
    const year = parseInt(mSlashes[3], 10);
    const hr = mSlashes[4] ? parseInt(mSlashes[4], 10) : 0;
    const min = mSlashes[5] ? parseInt(mSlashes[5], 10) : 0;
    const sec = mSlashes[6] ? parseInt(mSlashes[6], 10) : 0;
    
    let month, day;
    if (val1 > 12) {
      day = val1;
      month = val2;
    } else if (val2 > 12) {
      month = val1;
      day = val2;
    } else {
      day = val1;
      month = val2;
    }
    
    return new Date(year, month - 1, day, hr, min, sec);
  }
  
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function formatTanggal(str) { 
  const d = parseTanggal(str); 
  if (!d) return str || "-"; 
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; 
}

async function loadDashboardData() {
  try {
    const [resBbm, resVeh] = await Promise.all([
      API.get("getBbm"),
      API.get("getVehicles")
    ]);

    if (resBbm.success && Array.isArray(resBbm.data)) {
      allBbm = resBbm.data;
      console.log("[BBM] Data loaded:", allBbm.length, "rows");
    } else {
      console.warn("[BBM] Fetch failed:", resBbm.message || "unknown error");
    }

    if (resVeh.success && Array.isArray(resVeh.data)) {
      allVehicles = resVeh.data.map(v => ({
        ID_KENDARAAN:        v.ID_KENDARAAN || v.id_kendaraan || "",
        MERK:                v.MERK        || v.merk         || "",
        NO_POLISI:           v.NO_POLISI   || v.no_polisi    || "",
        JENIS:               v.JENIS       || v.jenis        || "",
        TAHUN:               v.TAHUN       || v.tahun        || "",
        WARNA:               v.WARNA       || v.warna        || "",
        FOTO_DEPAN:          v.FOTO_DEPAN  || v.foto_depan  || v.FOTO || v.foto || v.GAMBAR_DEPAN || v.URL_FOTO_DEPAN || "",
        FOTO_BELAKANG:       v.FOTO_BELAKANG || v.foto_belakang || v.GAMBAR_BELAKANG || v.URL_FOTO_BELAKANG || "",
        TGL_PAJAK:           v.TGL_PAJAK   || v.tgl_pajak    || "",
        TGL_STNK:            v.TGL_STNK    || v.tgl_stnk     || "",
        TGL_SERVICE_TERAKHIR: v.TGL_SERVICE_TERAKHIR || v.tgl_service_terakhir || "",
        INTERVAL_SERVICE:    v.INTERVAL_SERVICE || v.interval_service || 6,
        SUPIR:               v.SUPIR       || v.supir        || "",
        BIDANG:              v.BIDANG      || v.bidang       || "",
        STATUS_PAJAK:        v.STATUS_PAJAK || v.status_pajak || "",
        STATUS_STNK:         v.STATUS_STNK  || v.status_stnk  || "",
      }));
      console.log("[Vehicles] Data loaded:", allVehicles.length, "rows");
    } else {
      console.warn("[Vehicles] Fetch failed:", resVeh.message || "unknown error");
    }

  } catch (err) {
    console.error("loadDashboardData error:", err);
    const vContainer = $("vehicles-list-container");
    if (vContainer) {
      vContainer.innerHTML = `<div style="padding:20px; text-align:center; font-size:12px; color:var(--red);">
        Gagal memuat data armada. Periksa koneksi atau URL Apps Script.<br/>
        <code style="font-size:10px; color:var(--muted);">${err.message}</code>
      </div>`;
    }
  }
}

// ── TAB SWITCHER ──
function switchTab(tabName) {
  currentTab = tabName;
  
  $("panel-kendaraan").style.display = "none";
  $("panel-bbm").style.display = "none";
  
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  
  if (tabName === "kendaraan") {
    $("panel-kendaraan").style.display = "block";
    const btn = document.querySelector('.tab-btn[onclick="switchTab(\'kendaraan\')"]');
    if (btn) btn.classList.add("active");
    renderVehicles();
    
    $("hero-eyebrow").textContent = "MONITORING ARMADA & JATUH TEMPO";
    $("hero-title").innerHTML = "Daftar Kendaraan &amp; Pajak";
    $("hero-subtitle").textContent = "Informasi lengkap kendaraan dinas operasional Sekretariat, estimasi jadwal service, jatuh tempo Pajak/STNK.";
  } else if (tabName === "bbm") {
    $("panel-bbm").style.display = "block";
    const btn = document.querySelector('.tab-btn[onclick="switchTab(\'bbm\')"]');
    if (btn) btn.classList.add("active");
    renderDashboard();
    
    $("hero-eyebrow").textContent = "ANALIS KONSUMSI BBM";
    $("hero-title").innerHTML = "Monitoring Realisasi BBM";
    $("hero-subtitle").textContent = "Statistik kuota alokasi bidang, evaluasi efisiensi rute dinas, dan pengingat pelaporan voucher lapangan.";
  }
}

// ── VEHICLE STATUS CALCULATION ──
function getVehicleOverallStatus(v) {
  const taxDays = getDaysRemaining(v.TGL_PAJAK);
  const stnkDays = getDaysRemaining(v.TGL_STNK);
  const nextServiceDate = getNextServiceDate(v.TGL_SERVICE_TERAKHIR, v.INTERVAL_SERVICE);
  
  let serviceDays = null;
  if (nextServiceDate) {
    const today = new Date();
    today.setHours(0,0,0,0);
    nextServiceDate.setHours(0,0,0,0);
    const diffTime = nextServiceDate.getTime() - today.getTime();
    serviceDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  if ((taxDays !== null && taxDays < 0) || 
      (stnkDays !== null && stnkDays < 0) || 
      (serviceDays !== null && serviceDays < 0)) {
    return { class: "danger", text: "Jatuh Tempo" };
  }
  
  if ((taxDays !== null && taxDays <= 30) || 
      (stnkDays !== null && stnkDays <= 30) || 
      (serviceDays !== null && serviceDays <= 30)) {
    return { class: "warning", text: "Perhatian" };
  }
  
  return { class: "safe", text: "Aman" };
}

function countTripsThisYear(nopol) {
  if (!nopol) return 0;
  const currentYear = new Date().getFullYear();
  const cleanNopol = nopol.toUpperCase().replace(/\s+/g, "");
  
  return allBbm.filter(b => {
    const bNopol = (b.nopol_kendaraan || b.NOPOL_KENDARAAN || "").toUpperCase().replace(/\s+/g, "");
    if (bNopol !== cleanNopol) return false;
    
    const date = parseTanggal(b.tgl_kegiatan || b.TGL_KEGIATAN || b.tgl_submit);
    return date && date.getFullYear() === currentYear;
  }).length;
}

function toggleBidangGroup(idx) {
  openBidangGroups[idx] = !openBidangGroups[idx];
  renderVehicles();
}

function selectVehicle(id) {
  selectedVehicleId = id;
  renderVehicles();
}

// ── KENDARAAN TAB RENDERING ──
function renderVehicles() {
  const container = $("vehicles-list-container");
  if (!container) return;
  
  const searchVal = $("search-kendaraan").value.toLowerCase().trim();
  const isMobile = window.innerWidth < 768;
  
  const grouped = {};
  BIDANG_LIST.forEach(b => {
    grouped[b] = [];
  });
  
  allVehicles.forEach(v => {
    const matchedBidang = getMatchedBidangKey(v.BIDANG) || "SEKRETARIAT";
    const matchSearch = (v.MERK || "").toLowerCase().includes(searchVal) ||
                        (v.NO_POLISI || "").toLowerCase().includes(searchVal) ||
                        (v.SUPIR || "").toLowerCase().includes(searchVal);
    if (matchSearch) {
      grouped[matchedBidang].push(v);
    }
  });
  
  if (!selectedVehicleId) {
    for (let b of BIDANG_LIST) {
      if (grouped[b].length > 0) {
        selectedVehicleId = grouped[b][0].ID_KENDARAAN;
        break;
      }
    }
  }

  const html = BIDANG_LIST.map((b, idx) => {
    const list = grouped[b];
    if (list.length === 0 && searchVal !== "") return "";
    
    const isOpen = openBidangGroups[idx] ? "open" : "";
    const shortName = b.replace("BIDANG ", "");
    
    let groupStatusClass = "safe";
    list.forEach(v => {
      const s = getVehicleOverallStatus(v);
      if (s.class === "danger") groupStatusClass = "danger";
      else if (s.class === "warning" && groupStatusClass !== "danger") groupStatusClass = "warning";
    });
    
    const rowsHtml = list.map(v => {
      const isSelected = v.ID_KENDARAAN === selectedVehicleId ? "selected" : "";
      const statusInfo = getVehicleOverallStatus(v);
      
      const detailMobileHtml = isMobile && isSelected ? `
        <div class="fleet-row-detail-mobile" onclick="event.stopPropagation()">
          ${renderVehicleDetailContent(v)}
        </div>
      ` : "";
      
      return `
        <div class="nested-vehicle-row ${isSelected}" onclick="selectVehicle('${v.ID_KENDARAAN}')">
          <div class="nested-vehicle-row-header">
            <div class="nested-vehicle-info">
              <span class="nested-vehicle-name">${v.MERK || "Tanpa Nama"}</span>
              <span class="nested-vehicle-sub">${v.NO_POLISI || "-"}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
            </div>
          </div>
          ${detailMobileHtml}
        </div>
      `;
    }).join("");
    
    return `
      <div class="bidang-group-accordion ${isOpen}">
        <div class="bidang-group-header" onclick="toggleBidangGroup(${idx})">
          <span class="bidang-group-title">${shortName}</span>
          <div class="bidang-group-meta">
            <span class="bidang-group-status-badge ${groupStatusClass}"></span>
            <span class="bidang-group-count">${list.length} Kendaraan</span>
            <span class="bidang-group-arrow">▼</span>
          </div>
        </div>
        <div class="bidang-group-body">
          ${rowsHtml || '<div style="font-size:11px; color:var(--muted); font-style:italic; padding:6px 0;">Tidak ada kendaraan</div>'}
        </div>
      </div>
    `;
  }).join("");
  
  container.innerHTML = html || `<div class="empty-state">Tidak ada armada dinas ditemukan.</div>`;
  
  const detailPanel = $("vehicle-detail-panel");
  if (detailPanel) {
    if (isMobile) {
      detailPanel.style.display = "none";
    } else {
      detailPanel.style.display = "block";
      const selectedVeh = allVehicles.find(v => v.ID_KENDARAAN === selectedVehicleId);
      if (selectedVeh) {
        detailPanel.innerHTML = renderVehicleDetailContent(selectedVeh);
      } else {
        detailPanel.innerHTML = `<div class="empty-state">Pilih kendaraan dari bidang di sebelah kiri untuk melihat rincian detail.</div>`;
      }
    }
  }
}

function renderVehicleDetailContent(v) {
  const trips = countTripsThisYear(v.NO_POLISI);
  const photoDepan = toDriveDirectUrl(v.FOTO_DEPAN || "");
  const photoBelakang = toDriveDirectUrl(v.FOTO_BELAKANG || "");
  
  let photosHtml = "";
  if (photoDepan || photoBelakang) {
    photosHtml = `
      <div class="vehicle-photos" style="margin-top: 10px;">
        ${photoDepan ? `<img src="${photoDepan}" class="vehicle-photo-thumbnail" onclick="openPhotoModal('${photoDepan}')" alt="Foto Depan"/>` : '<div class="photo-placeholder"><span>No Foto Depan</span></div>'}
        ${photoBelakang ? `<img src="${photoBelakang}" class="vehicle-photo-thumbnail" onclick="openPhotoModal('${photoBelakang}')" alt="Foto Belakang"/>` : '<div class="photo-placeholder"><span>No Foto Belakang</span></div>'}
      </div>
    `;
  } else {
    photosHtml = `
      <div class="vehicle-photos" style="margin-top: 10px;">
        <div class="photo-placeholder" style="grid-column: span 2; height: 90px;">
          <span>📸 Belum ada foto kendaraan</span>
        </div>
      </div>
    `;
  }

  const taxDays = getDaysRemaining(v.TGL_PAJAK);
  let taxLabel = "-", taxPercent = 0, taxClass = "safe", taxBadge = "Aman";
  if (taxDays !== null) {
    if (taxDays < 0) {
      taxLabel = `Terlambat ${Math.abs(taxDays)} hari`;
      taxPercent = 100;
      taxClass = "danger";
      taxBadge = "Terlambat";
    } else if (taxDays <= 30) {
      taxLabel = `${taxDays} hari lagi`;
      taxPercent = Math.max(10, Math.round((taxDays / 30) * 100));
      taxClass = "warning";
      taxBadge = "Penting";
    } else {
      taxLabel = `${taxDays} hari lagi`;
      taxPercent = Math.min(100, Math.round((taxDays / 365) * 100));
      taxClass = "safe";
      taxBadge = "Aman";
    }
  }
  
  const stnkDays = getDaysRemaining(v.TGL_STNK);
  let stnkLabel = "-", stnkPercent = 0, stnkClass = "safe", stnkBadge = "Aman";
  if (stnkDays !== null) {
    if (stnkDays < 0) {
      stnkLabel = `Terlambat ${Math.abs(stnkDays)} hari`;
      stnkPercent = 100;
      stnkClass = "danger";
      stnkBadge = "Ganti Plat";
    } else if (stnkDays <= 30) {
      stnkLabel = `${stnkDays} hari lagi`;
      stnkPercent = Math.max(10, Math.round((stnkDays / 30) * 100));
      stnkClass = "warning";
      stnkBadge = "Penting";
    } else {
      stnkLabel = `${stnkDays} hari lagi`;
      stnkPercent = Math.min(100, Math.round((stnkDays / 1825) * 100));
      stnkClass = "safe";
      stnkBadge = "Aman";
    }
  }
  
  const nextServiceDate = getNextServiceDate(v.TGL_SERVICE_TERAKHIR, v.INTERVAL_SERVICE);
  let serviceLabel = "-", servicePercent = 0, serviceClass = "safe", serviceBadge = "Aman", nextServiceStr = "-";
  if (nextServiceDate) {
    const year = nextServiceDate.getFullYear();
    const month = MONTHS[nextServiceDate.getMonth()];
    const day = nextServiceDate.getDate();
    nextServiceStr = `${day} ${month} ${year}`;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    nextServiceDate.setHours(0,0,0,0);
    
    const diffTime = nextServiceDate.getTime() - today.getTime();
    const sDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const intervalDays = (parseInt(v.INTERVAL_SERVICE, 10) || 6) * 30;
    
    if (sDays < 0) {
      serviceLabel = `Terlambat ${Math.abs(sDays)} hari`;
      servicePercent = 100;
      serviceClass = "danger";
      serviceBadge = "Wajib Servis";
    } else if (sDays <= 30) {
      serviceLabel = `${sDays} hari lagi`;
      servicePercent = Math.max(10, Math.round((sDays / 30) * 100));
      serviceClass = "warning";
      serviceBadge = "Segera Servis";
    } else {
      serviceLabel = `${sDays} hari lagi`;
      servicePercent = Math.min(100, Math.round((sDays / intervalDays) * 100));
      serviceClass = "safe";
      serviceBadge = "Aman";
    }
  }

  return `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div>
        <div style="font-family:var(--title-sans); font-size:16px; font-weight:850; color:var(--text);">${v.MERK || "Tanpa Merk"}</div>
        <div style="font-family:var(--mono); font-size:11.5px; color:var(--wave); font-weight:700; margin-top:2px;">${v.NO_POLISI || "-"}</div>
      </div>
      
      <div class="vehicle-details" style="border-bottom:none; padding-bottom:0;">
        <div class="detail-item">
          <span class="detail-label">Jenis Armada</span>
          <span class="detail-val">${v.JENIS || "-"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Tahun Pembuatan</span>
          <span class="detail-val">${v.TAHUN || "-"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Supir P.J</span>
          <span class="detail-val">${v.SUPIR || "-"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Bidang / Dep</span>
          <span class="detail-val">${v.BIDANG || "Umum"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status Pajak 1 Thn</span>
          <span class="detail-val" style="font-weight:600;">${v.STATUS_PAJAK || "-"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status STNK 5 Thn</span>
          <span class="detail-val" style="font-weight:600;">${v.STATUS_STNK || "-"}</span>
        </div>
      </div>
      
      <div>
        <span class="detail-label" style="display:block; margin-bottom:4px;">Dokumentasi Foto</span>
        ${photosHtml}
      </div>
      
      <div style="border-top:1px solid var(--border); padding-top:12px; display:flex; flex-direction:column; gap:12px;">
        <span class="detail-label" style="display:block; margin-bottom:-4px;">Jatuh Tempo &amp; Service</span>
        
        <div class="status-row">
          <div class="status-meta">
            <div class="status-label-wrap">
              <span class="status-label" style="font-size:11px;">Pajak Tahunan (Samsat)</span>
              <span class="status-badge ${taxClass}">${taxBadge}</span>
            </div>
            <span class="status-date">${v.TGL_PAJAK ? formatTanggal(v.TGL_PAJAK) : "-"}</span>
          </div>
          <div class="status-bar-track">
            <div class="status-bar-fill ${taxClass}" style="width: ${taxPercent}%;"></div>
          </div>
          <div style="font-size:9px; color:var(--muted); text-align:right; font-family:var(--mono); margin-top:2px;">${taxLabel}</div>
        </div>
        
        <div class="status-row">
          <div class="status-meta">
            <div class="status-label-wrap">
              <span class="status-label" style="font-size:11px;">Plat Nomor (STNK 5 Tahunan)</span>
              <span class="status-badge ${stnkClass}">${stnkBadge}</span>
            </div>
            <span class="status-date">${v.TGL_STNK ? formatTanggal(v.TGL_STNK) : "-"}</span>
          </div>
          <div class="status-bar-track">
            <div class="status-bar-fill ${stnkClass}" style="width: ${stnkPercent}%;"></div>
          </div>
          <div style="font-size:9px; color:var(--muted); text-align:right; font-family:var(--mono); margin-top:2px;">${stnkLabel}</div>
        </div>
        
        <div class="status-row">
          <div class="status-meta">
            <div class="status-label-wrap">
              <span class="status-label" style="font-size:11px;">Servis Rutin Berkala</span>
              <span class="status-badge ${serviceClass}">${serviceBadge}</span>
            </div>
            <span class="status-date">Estimasi: ${nextServiceStr}</span>
          </div>
          <div class="status-bar-track">
            <div class="status-bar-fill ${serviceClass}" style="width: ${servicePercent}%;"></div>
          </div>
          <div style="font-size:9px; color:var(--muted); text-align:right; font-family:var(--mono); margin-top:2px;">Terakhir: ${v.TGL_SERVICE_TERAKHIR ? formatTanggal(v.TGL_SERVICE_TERAKHIR) : "-"} (${serviceLabel})</div>
        </div>
      </div>
      
      <div style="border-top:1px solid var(--border); padding-top:12px; display:flex; justify-content:space-between; align-items:center;">
        <span class="detail-label">Perjalanan tahun ini</span>
        <span class="trip-badge">📊 ${trips} Perjalanan</span>
      </div>
    </div>
  `;
}

function getDaysRemaining(dateStr) {
  const targetDate = parseTanggal(dateStr);
  if (!targetDate) return null;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  targetDate.setHours(0,0,0,0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getNextServiceDate(lastServiceStr, intervalMonths) {
  const lastDate = parseTanggal(lastServiceStr);
  if (!lastDate) return null;
  
  const nextDate = new Date(lastDate);
  const interval = parseInt(intervalMonths, 10) || 6;
  nextDate.setMonth(nextDate.getMonth() + interval);
  return nextDate;
}

// ── PHOTO MODAL UTILITIES ──
function openPhotoModal(src) {
  const modal = $("photo-modal");
  const img = $("modal-photo-img");
  if (!modal || !img) return;
  img.src = src;
  modal.style.display = "flex";
}

function closePhotoModal(event) {
  if (!event || event.target.id === "photo-modal" || event.target.innerHTML === "&times;") {
    $("photo-modal").style.display = "none";
  }
}

// ── BBM TAB MONITORING FUNCTIONS ──
function populateYearFilter() {
  const selectEl = $("f-tahun");
  if (!selectEl) return;
  const years = new Set();
  allBbm.forEach(b => {
    const dateStr = b.tgl_kegiatan || b.tgl_submit || "";
    const d = parseTanggal(dateStr);
    if (d && !isNaN(d.getTime())) {
      const yr = d.getFullYear();
      if (yr >= 2020 && yr <= 2035) {
        years.add(yr);
      }
    }
  });
  const sortedYears = Array.from(years).sort((a, b) => b - a);
  selectEl.innerHTML = '<option value="">Semua Tahun</option>' +
    sortedYears.map(yr => `<option value="${yr}">Tahun ${yr}</option>`).join("");
}

function renderDashboard() {
  populateYearFilter();
  renderBidangAllocation();
  applyFilters();
}

function switchRealisasiTab(tab) {
  activeRealisasiTab = tab;
  const btnTerlapor = $("btn-tab-terlapor");
  const btnBelum = $("btn-tab-belum");
  
  if (tab === "terlapor") {
    if (btnTerlapor) {
      btnTerlapor.style.background = "var(--wave)";
      btnTerlapor.style.color = "#fff";
    }
    if (btnBelum) {
      btnBelum.style.background = "transparent";
      btnBelum.style.color = "var(--muted)";
    }
  } else {
    if (btnBelum) {
      btnBelum.style.background = "var(--wave)";
      btnBelum.style.color = "#fff";
    }
    if (btnTerlapor) {
      btnTerlapor.style.background = "transparent";
      btnTerlapor.style.color = "var(--muted)";
    }
  }
  
  destroyAllBidangCharts();
  openAccordions = {};
  renderBidangAllocation();
}

function destroyAllBidangCharts() {
  Object.keys(bidangCharts).forEach(key => {
    if (bidangCharts[key]) {
      bidangCharts[key].destroy();
      bidangCharts[key] = null;
    }
  });
  bidangCharts = {};
}

function toggleBidangAccordion(idx) {
  openAccordions[idx] = !openAccordions[idx];
  const el = $("accordion-item-" + idx);
  if (el) {
    if (openAccordions[idx]) {
      el.classList.add("open");
      setTimeout(() => renderNestedBidangChart(idx), 50);
    } else {
      el.classList.remove("open");
    }
  }
}

function renderNestedBidangChart(idx) {
  const fTahun = $("f-tahun").value;
  const fPeriode = $("f-periode").value;
  const chartContainer = $("chart-container-" + idx);
  if (!chartContainer) return;
  
  if (fPeriode.startsWith("M") || fTahun === "") {
    chartContainer.style.display = "none";
    if (bidangCharts[idx]) {
      bidangCharts[idx].destroy();
      bidangCharts[idx] = null;
    }
    return;
  }
  
  chartContainer.style.display = "block";
  const bName = BIDANG_LIST[idx];
  const monthlyData = new Array(12).fill(0);
  
  allBbm.forEach(b => {
    const status = (b.status || "").toUpperCase().trim();
    if (status !== "DISETUJUI" && status !== "DILAPORKAN" && status !== "SELESAI") return;
    
    if (getMatchedBidangKey(b.bidang) !== bName) return;
    
    const d = parseTanggal(b.tgl_kegiatan || b.tgl_submit);
    if (d && d.getFullYear().toString() === fTahun) {
      const m = d.getMonth();
      const qty = parseFloat(b.jumlah_digunakan || b.jumlah) || 0;
      const size = parseFloat(b.jenis_voucher) || 0;
      
      if (fPeriode) {
        const type = fPeriode.substring(0, 1);
        const val = parseInt(fPeriode.substring(1), 10);
        const monthNum = m + 1;
        
        if (type === "Q") {
          if (val === 1 && ![1, 2, 3].includes(monthNum)) return;
          if (val === 2 && ![4, 5, 6].includes(monthNum)) return;
          if (val === 3 && ![7, 8, 9].includes(monthNum)) return;
          if (val === 4 && ![10, 11, 12].includes(monthNum)) return;
        } else if (type === "S") {
          if (val === 1 && monthNum > 6) return;
          if (val === 2 && monthNum <= 6) return;
        }
      }
      
      monthlyData[m] += (qty * size);
    }
  });
  
  const canvas = $("chart-bidang-" + idx);
  if (!canvas) return;
  
  if (bidangCharts[idx]) {
    bidangCharts[idx].destroy();
  }
  
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 110);
  gradient.addColorStop(0, '#0077E6');
  gradient.addColorStop(1, 'rgba(0, 85, 170, 0.15)');
  
  bidangCharts[idx] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [{
        data: monthlyData,
        backgroundColor: gradient,
        borderColor: 'rgba(0, 85, 170, 0.4)',
        borderWidth: 0.5,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(30, 41, 59, 0.95)",
          padding: 6,
          cornerRadius: 6,
          titleFont: { size: 9, family: 'Inter', weight: 'bold' },
          bodyFont: { size: 9, family: 'Inter' }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 7.5, family: 'Inter' }, color: 'var(--muted)' }
        },
        y: {
          grid: { color: 'rgba(0, 85, 170, 0.03)', drawBorder: false },
          ticks: { font: { size: 7.5, family: 'Fira Code' }, color: 'var(--muted)' }
        }
      }
    }
  });
}

function renderBidangAllocation() {
  const container = $("bidang-bars-container");
  if (!container) return;

  const allocation = {};
  BIDANG_LIST.forEach(b => {
    allocation[b] = {
      totalLiters: 0,
      vouchersCount: 0,
      requests: []
    };
  });

  filteredBbm.forEach(b => {
    const status = (b.status || "").toUpperCase().trim();
    if (status !== "DISETUJUI" && status !== "DILAPORKAN" && status !== "SELESAI") return;

    const qty = parseFloat(b.jumlah) || 0;
    const used = parseFloat(b.jumlah_digunakan) || 0;
    const returned = parseFloat(b.jumlah_dikembalikan) || 0;
    const jenis = b.jenis_voucher || "";
    const liters = parseFloat(jenis) || 0;

    const isReported = (used + returned) >= qty;

    if (activeRealisasiTab === "terlapor" && !isReported) return;
    if (activeRealisasiTab === "belum-terlapor" && isReported) return;

    const bKey = getMatchedBidangKey(b.bidang);
    if (bKey && allocation[bKey]) {
      allocation[bKey].totalLiters += (liters * (isReported ? used : qty));
      allocation[bKey].vouchersCount += qty;
      allocation[bKey].requests.push(b);
    }
  });

  const maxLiters = Math.max(...Object.values(allocation).map(a => a.totalLiters), 1);
  const fTahun = $("f-tahun").value;

  const sortedBidang = [...BIDANG_LIST].sort((a, b) => (allocation[b]?.totalLiters || 0) - (allocation[a]?.totalLiters || 0));
  const html = sortedBidang.map((b, idx) => {
    const alloc = allocation[b];
    const percentage = Math.round((alloc.totalLiters / maxLiters) * 100);
    const isOpen = openAccordions[idx] ? "open" : "";
    
    let subContentHtml = "";
    
    if (activeRealisasiTab === "terlapor") {
      if (fTahun) {
        const monthlyStats = {};
        for (let m = 0; m < 12; m++) {
          monthlyStats[m] = { liters: 0, vouchers: 0, trips: 0 };
        }
        
        alloc.requests.forEach(req => {
          const d = parseTanggal(req.tgl_kegiatan || req.tgl_submit);
          if (d && d.getFullYear().toString() === fTahun) {
            const m = d.getMonth();
            const qty = parseFloat(req.jumlah_digunakan) || 0;
            const size = parseFloat(req.jenis_voucher) || 0;
            monthlyStats[m].liters += (qty * size);
            monthlyStats[m].vouchers += qty;
            monthlyStats[m].trips += 1;
          }
        });
        
        const trs = MONTHS.map((mName, mIdx) => {
          const stats = monthlyStats[mIdx];
          if (stats.trips === 0) return "";
          return `
            <tr>
              <td style="font-weight:700;">${mName}</td>
              <td style="font-family:var(--mono); font-weight:700;">${stats.liters} Ltr</td>
              <td style="font-family:var(--mono);">${stats.vouchers} Voucher</td>
            </tr>
          `;
        }).join("");
        
        subContentHtml = `
          <table class="bidang-detail-table">
            <thead>
              <tr>
                <th>Bulan (${fTahun})</th>
                <th>Volume Terpakai</th>
                <th>Jumlah Voucher</th>
              </tr>
            </thead>
            <tbody>
              ${trs || '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:14px;font-style:italic">Tidak ada realisasi pada periode ini.</td></tr>'}
            </tbody>
          </table>
        `;
      } else {
        const yearlyStats = {};
        alloc.requests.forEach(req => {
          const d = parseTanggal(req.tgl_kegiatan || req.tgl_submit);
          if (d) {
            const y = d.getFullYear();
            if (!yearlyStats[y]) yearlyStats[y] = { liters: 0, vouchers: 0, trips: 0 };
            const qty = parseFloat(req.jumlah_digunakan) || 0;
            const size = parseFloat(req.jenis_voucher) || 0;
            yearlyStats[y].liters += (qty * size);
            yearlyStats[y].vouchers += qty;
            yearlyStats[y].trips += 1;
          }
        });
        
        const sortedYears = Object.keys(yearlyStats).sort((a,b) => b - a);
        const trs = sortedYears.map(y => {
          const stats = yearlyStats[y];
          return `
            <tr>
              <td style="font-weight:700;">Tahun ${y}</td>
              <td style="font-family:var(--mono); font-weight:700;">${stats.liters} Ltr</td>
              <td style="font-family:var(--mono);">${stats.vouchers} Voucher</td>
            </tr>
          `;
        }).join("");
        
        subContentHtml = `
          <table class="bidang-detail-table">
            <thead>
              <tr>
                <th>Tahun</th>
                <th>Volume Terpakai</th>
                <th>Jumlah Voucher</th>
              </tr>
            </thead>
            <tbody>
              ${trs || '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:14px;font-style:italic">Tidak ada realisasi.</td></tr>'}
            </tbody>
          </table>
        `;
      }
    } else {
      let tableRows = alloc.requests.map(req => {
        return `
          <tr>
            <td style="font-weight:700;">${req.nama_penerima || "-"}</td>
            <td style="font-family:var(--mono);">${req.nopol_kendaraan || "-"}</td>
            <td>${req.tgl_kegiatan ? formatTanggal(req.tgl_kegiatan) : "-"}</td>
            <td style="font-family:var(--mono); font-weight:700;">${req.jumlah || 0} vchr (${req.jenis_voucher || ""})</td>
            <td>
              <span class="status-badge warning">Belum Lapor</span>
            </td>
          </tr>
        `;
      }).join("");

      if (tableRows.length === 0) {
        tableRows = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:14px;font-style:italic">Semua laporan terverifikasi (Lunas).</td></tr>`;
      }
      
      subContentHtml = `
        <table class="bidang-detail-table">
          <thead>
            <tr>
              <th>Penerima</th>
              <th>Nopol</th>
              <th>Tgl Tugas</th>
              <th>Voucher</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
    }

    const shortName = b.replace("BIDANG ", "");

    return `
      <div class="bidang-accordion-item ${isOpen}" id="accordion-item-${idx}">
        <div class="bidang-accordion-header" onclick="toggleBidangAccordion(${idx})">
          <div class="bidang-accordion-title">${shortName}</div>
          <div class="bidang-accordion-meta">
            <span class="bidang-accordion-badge">${alloc.totalLiters} Ltr</span>
            <span class="bidang-accordion-arrow">▼</span>
          </div>
        </div>
        <div class="bidang-accordion-body">
          
          <div class="bidang-chart-container" id="chart-container-${idx}" style="display: none; margin-bottom: 16px; height: 110px; width: 100%;">
            <canvas id="chart-bidang-${idx}"></canvas>
          </div>
          
          <div class="bidang-bar-row" style="margin-bottom:14px; cursor:default;">
            <div class="bidang-bar-meta">
              <span class="bidang-bar-name">Total Realisasi Volume</span>
              <span class="bidang-bar-val">${alloc.totalLiters} Ltr</span>
            </div>
            <div class="bidang-bar-track">
              <div class="bidang-bar-fill" style="width: ${percentage}%;"></div>
            </div>
          </div>
          <div style="font-size:10px; font-weight:700; color:var(--muted); text-transform:uppercase; font-family:var(--mono); margin-bottom:8px; margin-top:14px;">Detail Realisasi Penggunaan</div>
          ${subContentHtml}
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = html;
  
  Object.keys(openAccordions).forEach(key => {
    if (openAccordions[key]) {
      renderNestedBidangChart(key);
    }
  });
}

function getMatchedBidangKey(bidangStr) {
  if (!bidangStr) return null;
  const s = bidangStr.toUpperCase().trim();
  if (s.includes("SEKRETARIAT")) return "SEKRETARIAT";
  if (s.includes("PERIKANAN")) return "BIDANG PERIKANAN";
  if (s.includes("P2HP") || s.includes("PENGOLAHAN")) return "BIDANG P2HP";
  if (s.includes("KELAUTAN")) return "BIDANG KELAUTAN";
  if (s.includes("PSDKP") || s.includes("PENGAWASAN")) return "BIDANG PSDKP";
  return null;
}

// ── BBM FILTER SYSTEM ──
function applyFilters() {
  const fTahun = $("f-tahun").value;
  const fPeriode = $("f-periode").value;
  const fStatus = $("f-status").value;

  filteredBbm = allBbm.filter(b => {
    const d = parseTanggal(b.tgl_submit || b.tgl_kegiatan);
    if (fTahun && d && d.getFullYear().toString() !== fTahun) return false;
    
    if (fPeriode && d) {
      const type = fPeriode.substring(0, 1);
      const val = parseInt(fPeriode.substring(1), 10);
      const m = d.getMonth() + 1;
      
      if (type === "M") {
        if (m !== val) return false;
      } else if (type === "Q") {
        if (val === 1 && ![1, 2, 3].includes(m)) return false;
        if (val === 2 && ![4, 5, 6].includes(m)) return false;
        if (val === 3 && ![7, 8, 9].includes(m)) return false;
        if (val === 4 && ![10, 11, 12].includes(m)) return false;
      } else if (type === "S") {
        if (val === 1 && m > 6) return false;
        if (val === 2 && m <= 6) return false;
      }
    }
    
    if (fStatus) {
      const status = (b.status || "").toUpperCase().trim();
      if (fStatus === "PENDING" && status !== "PENDING") return false;
      if (fStatus === "DISETUJUI" && status !== "DISETUJUI" && status !== "DILAPORKAN" && status !== "SELESAI") return false;
    }
    
    return true;
  });

  const activeFilters = [];
  if (fTahun) activeFilters.push(`Tahun: ${fTahun}`);
  if (fPeriode) activeFilters.push(`Periode: ${$("f-periode").options[$("f-periode").selectedIndex].text}`);
  if (fStatus) activeFilters.push(`Status: ${fStatus}`);

  renderFilterMessage(activeFilters);
  renderBidangAllocation();
  calculateInsightCardValues();
}

function renderFilterMessage(fields) {
  const container = $("filter-msg-container");
  if (!container) return;
  if (fields.length === 0) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `
    <div class="filter-active-msg">
      <div>
        <strong>Filter aktif:</strong> ${fields.join(" · ")} (${filteredBbm.length} data)
      </div>
      <span style="cursor:pointer; font-weight:bold; color:var(--wave); margin-left:12px;" onclick="clearFilters()">&times; Hapus</span>
    </div>
  `;
}

function clearFilters() {
  $("f-tahun").value = "";
  $("f-periode").value = "";
  $("f-status").value = "";
  applyFilters();
}

// ── INSIGHT CARD DATA CALCULATION ──
function calculateInsightCardValues() {
  const dataMap = {};
  BIDANG_LIST.forEach(b => {
    dataMap[b] = { totalLiters: 0, count: 0 };
  });

  filteredBbm.forEach(b => {
    const status = (b.status || "").toUpperCase().trim();
    if (status !== "DISETUJUI" && status !== "DILAPORKAN" && status !== "SELESAI") return;

    const qty = parseFloat(b.jumlah_digunakan || b.jumlah) || 0;
    const size = parseFloat(b.jenis_voucher) || 0;
    const bKey = getMatchedBidangKey(b.bidang);

    if (bKey && dataMap[bKey]) {
      dataMap[bKey].totalLiters += (qty * size);
      dataMap[bKey].count += 1;
    }
  });

  let totalLiters = 0;
  let totalTrips = 0;
  let minAvg = Infinity;
  let maxAvg = -Infinity;
  let minTotal = Infinity;
  let bestBidang = "-";
  let worstBidang = "-";
  let lowestTotalBidang = "-";

  BIDANG_LIST.forEach(b => {
    const item = dataMap[b];
    const total = item.totalLiters;
    const count = item.count;
    const avg = count > 0 ? total / count : 0;

    totalLiters += total;
    totalTrips += count;

    if (count > 0) {
      if (avg < minAvg) {
        minAvg = avg;
        bestBidang = b.replace("BIDANG ", "");
      }
      if (avg > maxAvg) {
        maxAvg = avg;
        worstBidang = b.replace("BIDANG ", "");
      }
    }
    
    if (total > 0 && total < minTotal) {
      minTotal = total;
      lowestTotalBidang = b.replace("BIDANG ", "");
    }
  });

  const overallAvg = totalTrips > 0 ? totalLiters / totalTrips : 0;

  let efficiencyLabel = "N/A";
  let recommendation = "";

  if (totalTrips === 0) {
    efficiencyLabel = "Tidak Ada Data";
    recommendation = "Tidak ada data voucher bbm dilaporkan/disetujui untuk parameter periode filter saat ini.";
  } else if (overallAvg < 6) {
    efficiencyLabel = "Sangat Tinggi 🟢";
    recommendation = "Pola penggunaan bahan bakar sangat efisien. Pengambilan voucher BBM sejalan dengan rute kegiatan operasional lapangan.";
  } else if (overallAvg <= 10) {
    efficiencyLabel = "Cukup Tinggi 🟡";
    recommendation = "Indeks penggunaan bahan bakar berada pada batas normal. Direkomendasikan penggabungan rute tugas searah.";
  } else {
    efficiencyLabel = "Rendah (Evaluasi) 🔴";
    recommendation = `Konsumsi rata-rata tinggi (${overallAvg.toFixed(1)} Ltr/kegiatan). Disarankan untuk memperketat verifikasi nopol dan membatasi kuota voucher 10 liter pada Bidang ${worstBidang}.`;
  }

  $("val-indeks-efisiensi").innerHTML = efficiencyLabel;
  $("val-rata-konsumsi").innerHTML = `${overallAvg.toFixed(1)} Ltr/keg`;
  $("val-total-terdistribusi").innerHTML = `${totalLiters.toLocaleString()} Liter`;
  $("val-rerata-terkecil").innerHTML = bestBidang !== "-" ? `${bestBidang} (${minAvg.toFixed(1)} Ltr/keg)` : "-";
  $("val-volume-terhemat").innerHTML = lowestTotalBidang !== "-" ? `${lowestTotalBidang} (${minTotal} Ltr)` : "-";
  $("val-rerata-terbesar").innerHTML = worstBidang !== "-" ? `${worstBidang} (${maxAvg.toFixed(1)} Ltr/keg)` : "-";
  $("val-rekomendasi-box").innerHTML = `<strong>Rekomendasi:</strong> ${recommendation}`;
}

// ── Initializer ──
(async function initDashboardArmada() {
  UI.renderNavigation("kendaraan");
  
  // Setup window resize listener to update mobile layout details
  window.addEventListener("resize", () => {
    if (currentTab === "kendaraan") {
      renderVehicles();
    }
  });

  await loadDashboardData();
  switchTab("kendaraan");
})();

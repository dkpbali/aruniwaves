/* ===================================================================
   ARUNIWAVES - Portal Specific JS (Homepage Logic)
   =================================================================== */

// ── Batch & State Variables ──────────────────
let actHelpdesk   = [];
let actHumas      = [];
let actBbm        = [];
let actRapat      = [];
let currentActTab = 'helpdesk';

let filesData = {
  geotag:  { base64: null, name: "" },
  surat:   { base64: null, name: "" },
  laporan: { base64: null, name: "" },
  nota:    { base64: null, name: "" }
};

let editHumasFotoB64 = null;
let homeBookings = [];
let selectedHomeDate = new Date().toISOString().split("T")[0];

// ── Clock & Date Display ─────────────────────
function updateClock() {
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date-display");
  if (!clockEl || !dateEl) return;
  
  const now  = new Date();
  const days = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const mons = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const hh   = String(now.getHours()).padStart(2,"0");
  const mm   = String(now.getMinutes()).padStart(2,"0");
  const ss   = String(now.getSeconds()).padStart(2,"0");
  
  clockEl.textContent = `${hh}:${mm}:${ss}`;
  dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${mons[now.getMonth()]} ${now.getFullYear()}`;
}

// ── Value Count-up Animation ──────────────────
function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  if (!obj) return;
  if (start === end) {
    obj.textContent = end;
    return;
  }
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.textContent = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// ── Short Date Helper ────────────────────────
function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.trim().split(/\s+/);
  const datePart = parts[0];
  const timePart = parts[1];
  
  let day = "", month = "";
  if (datePart.includes("-")) {
    const [y, m, d] = datePart.split("-");
    day = d; month = m;
  } else if (datePart.includes("/")) {
    const [d, m, y] = datePart.split("/");
    day = d; month = m;
  } else {
    return datePart;
  }
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const mName = monthNames[parseInt(month, 10) - 1] || month;
  const timeFormatted = timePart ? ` · ${timePart.substring(0, 5)}` : "";
  return `${parseInt(day, 10)} ${mName}${timeFormatted}`;
}

// ── Load Stats ──────────────────────────────
async function loadStats() {
  // Homepage badges disabled for lighter weight and instant loading.
}

function updateStats({ aset, tiketOpen, bookingPending, bbmPending, kdrPending }) {
  // No-op
}

// ── 3-Tab Aktivitas Terkini ───────────────────
function switchActTab(tab) {
  currentActTab = tab;
  ['helpdesk', 'humas', 'bbm', 'rapat'].forEach(t => {
    const el = document.getElementById(`tab-act-${t}`);
    if (el) el.classList.toggle('active', t === tab);
  });
  renderActTab(tab);
}

async function loadAktivitasTerkini() {
  const listEl = document.getElementById("activity-list");
  if (!listEl) return;

  if (!listEl.innerHTML || listEl.innerHTML.includes('shimmer')) {
    listEl.innerHTML = Array(3).fill().map(() => `
      <div class="activity-item">
        <div class="act-dot dot-helpdesk"></div>
        <div class="act-content">
          <div class="shimmer" style="height:14px;width:70%;margin-bottom:6px"></div>
          <div class="shimmer" style="height:11px;width:40%"></div>
        </div>
      </div>`).join('');
  }

  try {
    const json = await API.get("getAktivitasTerkini");
    actHelpdesk = json.helpdesk || [];
    actHumas = json.humas || [];
    actBbm = json.bbm || [];
    actRapat = json.booking || [];
    renderActTab(currentActTab);
  } catch(e) { 
    console.error("[Homepage] Aktivitas Terkini load error:", e);
    listEl.innerHTML = `<div style="padding:20px;text-align:center;color:var(--red);font-size:13px">Gagal memuat aktivitas terkini.</div>`;
  }
}

function renderActTab(tab) {
  const listEl = document.getElementById("activity-list");
  if (!listEl) return;
  
  let htmlStr = '';
  const user = Auth.getUser();
  const isUserLogged = !!user;
  const loggedPegId = isUserLogged ? user.id_pegawai : '';
  const isLoggedAdmin = isUserLogged ? user.is_admin : false;

  if (tab === 'helpdesk') {
    if (!actHelpdesk.length) {
      listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">Tidak ada permohonan helpdesk yang belum tertangani.</div>';
      return;
    }
    htmlStr = actHelpdesk.map(t => {
      const isStatusOpen = (t.status || '').toUpperCase() === 'OPEN';
      const badgeColor = isStatusOpen ? 'var(--orange)' : 'var(--wave)';
      const statusLabel = isStatusOpen ? 'BARU' : t.status;
      const actions = `<div class="act-actions">
        <button class="act-btn act-btn-primary" onclick="event.stopPropagation(); editHelpdeskRedirect('${t.id}', '${Utils.escapeHtml(t.nama)}')">Edit</button>
        <button class="act-btn act-btn-danger" onclick="event.stopPropagation(); deleteHelpdesk('${t.id}', '${Utils.escapeHtml(t.nama)}')">Hapus</button>
      </div>`;

      return `
        <div class="activity-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; gap:12px; width:100%;">
          <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:0;">
            <div class="act-dot" style="background:${badgeColor}"></div>
            <div class="act-content" style="flex:1; min-width:0;">
              <div class="act-title">${Utils.escapeHtml(t.judul)}</div>
              <div class="act-meta">${Utils.escapeHtml(t.nama)} · ${Utils.escapeHtml(t.bidang)} · <span style="font-weight:700;color:${badgeColor}">${statusLabel}</span></div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
            <div class="act-time" style="margin-right:8px;">${formatShortDate(t.tanggal)}</div>
            ${actions}
          </div>
        </div>`;
    }).join('');
  } 
  
  else if (tab === 'humas') {
    if (!actHumas.length) {
      listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">Tidak ada permohonan humas.</div>';
      return;
    }

    const groups = {};
    actHumas.forEach(h => {
      const bidang = h.bidang ? h.bidang.split(" - ")[0].toUpperCase().trim() : "LAINNYA";
      if (!groups[bidang]) groups[bidang] = [];
      groups[bidang].push(h);
    });

    htmlStr = Object.entries(groups).map(([bidang, list], gIdx) => {
      const marginStyle = gIdx > 0 ? 'margin-top:20px;' : 'margin-top:8px;';
      const groupHeader = `<div style="font-size:11px; font-weight:700; color:var(--wave); ${marginStyle} margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px dashed var(--border); padding-bottom:4px;">${bidang}</div>`;
      
      const itemsHtml = list.map(h => {
        let actions = '';
        let statusLabel = h.status || 'OPEN';
        let statusColor = 'var(--muted)';

        if (statusLabel === 'OPEN' || statusLabel === 'PENDING') {
          statusLabel = 'MENUNGGU DISETUJUI';
          statusColor = 'var(--orange)';
        } else if (statusLabel === 'DISETUJUI') {
          statusLabel = 'DISETUJUI';
          statusColor = 'var(--green)';
        } else if (statusLabel === 'DITOLAK') {
          statusLabel = 'DITOLAK';
          statusColor = 'var(--red)';
        }

        if (isUserLogged && isLoggedAdmin) {
          if (h.status === 'OPEN' || h.status === 'PENDING' || !h.status) {
            actions = `<div class="act-actions">
              <button class="act-btn act-btn-success" onclick="event.stopPropagation(); valHumas('${h.id}', 'DISETUJUI')">Setujui</button>
              <button class="act-btn act-btn-danger" onclick="event.stopPropagation(); valHumas('${h.id}', 'DITOLAK')">Tolak</button>
            </div>`;
          }
        } else {
          actions = `<div class="act-actions">
            <button class="act-btn act-btn-primary" onclick="event.stopPropagation(); editHumasRedirect('${h.id}', '${Utils.escapeHtml(h.namaPegawai)}')">Edit</button>
            <button class="act-btn act-btn-danger" onclick="event.stopPropagation(); deleteHumas('${h.id}', '${Utils.escapeHtml(h.namaPegawai)}')">Hapus</button>
          </div>`;
        }

        return `
          <div class="activity-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; gap:12px; width:100%; cursor:pointer;" onclick="showDetailHumas('${h.id}')">
            <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:0;">
              <div class="act-dot" style="background:${statusColor}"></div>
              <div class="act-content" style="flex:1; min-width:0;">
                <div class="act-title">${Utils.escapeHtml(h.namaKonten)}</div>
                <div class="act-meta">${Utils.escapeHtml(h.namaPegawai)} · ${Utils.escapeHtml(h.platform)} · ${Utils.escapeHtml(h.jenisKonten)} · <span style="font-weight:700;color:${statusColor}">${statusLabel}</span></div>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0;">
              <div class="act-time" style="margin-bottom:0;">${formatShortDate(h.tanggalSubmit)}</div>
              ${actions ? actions.replace('class="act-actions"', 'class="act-actions" style="margin-left:0; margin-top:0;"') : ''}
            </div>
          </div>`;
      }).join('');

      return groupHeader + itemsHtml;
    }).join('');
  } 
  
  else if (tab === 'bbm') {
    const filteredBbmList = actBbm.filter(b => {
      const statusUpper = (b.status || '').toUpperCase();
      return statusUpper === 'OPEN' || statusUpper === 'DISETUJUI';
    });
    if (!filteredBbmList.length) {
      listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">Tidak ada permohonan BBM yang aktif.</div>';
      return;
    }

    const groups = {};
    filteredBbmList.forEach(b => {
      const bidang = b.bidang ? b.bidang.split(" - ")[0].toUpperCase().trim() : "LAINNYA";
      if (!groups[bidang]) groups[bidang] = [];
      groups[bidang].push(b);
    });

    htmlStr = Object.entries(groups).map(([bidang, list], gIdx) => {
      const marginStyle = gIdx > 0 ? 'margin-top:20px;' : 'margin-top:8px;';
      const groupHeader = `<div style="font-size:11px; font-weight:700; color:var(--wave); ${marginStyle} margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px dashed var(--border); padding-bottom:4px;">${bidang}</div>`;
      
      const itemsHtml = list.map(b => {
        const isStatusOpen = (b.status || '').toUpperCase() === 'OPEN';
        const isStatusApproved = (b.status || '').toUpperCase() === 'DISETUJUI';

        let actions = '';
        let statusLabel = b.status;
        let statusColor = 'var(--muted)';

        if (isStatusOpen) {
          statusLabel = 'MENUNGGU DISETUJUI';
          statusColor = 'var(--orange)';
          if (isUserLogged && isLoggedAdmin) {
            actions = `<div class="act-actions"><button class="act-btn act-btn-success" onclick="valBbm('${b.id_bbm}')">Setujui</button></div>`;
          } else {
            actions = `<div class="act-actions">
              <button class="act-btn" onclick="editBbmRedirect('${b.id_bbm}', '${Utils.escapeHtml(b.nama_penerima)}')">Edit</button>
              <button class="act-btn act-btn-danger" onclick="deleteBbm('${b.id_bbm}', '${Utils.escapeHtml(b.nama_penerima)}')">Hapus</button>
            </div>`;
          }
        } else if (isStatusApproved) {
          statusLabel = 'BELUM DILAPORKAN';
          statusColor = 'var(--yellow)';
          actions = `<div class="act-actions"><button class="act-btn act-btn-primary" onclick="openLaporBbmModal('${b.id_bbm}', ${b.jumlah}, '${Utils.escapeHtml(b.nama_penerima)}', '${b.jenis_voucher}', '${Utils.escapeHtml(b.lokasi_tujuan)}')">Lapor Penggunaan</button></div>`;
        }

        const name = (b.nama_penerima || '').toUpperCase();

        return `
          <div class="activity-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; gap:12px; width:100%;">
            <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:0;">
              <div class="act-dot" style="background:${statusColor}"></div>
              <div class="act-content" style="flex:1; min-width:0;">
                <div class="act-title">${name} · ${Utils.escapeHtml(b.jenis_voucher)} (${b.jumlah} Pcs)</div>
                <div class="act-meta">Tujuan: ${Utils.escapeHtml(b.lokasi_tujuan)} · <span style="font-weight:700;color:${statusColor}">${statusLabel}</span></div>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0;">
              <div class="act-time" style="margin-bottom:0;">${formatShortDate(b.tgl_submit)}</div>
              ${actions ? actions.replace('class="act-actions"', 'class="act-actions" style="margin-left:0; margin-top:0;"') : ''}
            </div>
          </div>`;
      }).join('');

      return groupHeader + itemsHtml;
    }).join('');
  }
  
  else if (tab === 'rapat') {
    listEl.innerHTML = `
      <div class="calendar-card" style="margin-top: 8px; border: 1px solid var(--border); border-radius: 16px; padding: 14px; background: var(--card);">
        <div class="date-strip" id="date-strip" style="margin-bottom:12px;"></div>
        <div class="calendar-bookings-list" id="calendar-bookings-list">
          <div class="cal-booking-empty">Memuat jadwal...</div>
        </div>
      </div>
    `;
    initHomepageCalendar(actRapat);
    return;
  }

  listEl.innerHTML = htmlStr;
}

// ── Admin Actions ───────────────────────────
async function valHumas(id, status) {
  try {
    const data = await API.post("validateHumas", { id_konten: id, status });
    UI.showToast(data.message || "Konten humas berhasil divalidasi.");
    loadAktivitasTerkini();
  } catch(e) {}
}

async function valBbm(id) {
  try {
    const data = await API.post("validateBbm", { id_bbm: id });
    UI.showToast(data.message || "Permohonan BBM berhasil disetujui.");
    loadStats();
    loadAktivitasTerkini();
  } catch(e) {}
}

async function selesaiBbm(id) {
  try {
    const data = await API.post("selesaiBbm", { id_bbm: id });
    UI.showToast(data.message || "Permohonan BBM berhasil ditandai selesai.");
    loadStats();
    loadAktivitasTerkini();
  } catch(e) {}
}

async function valBooking(id, status) {
  UI.showConfirm("Validasi Ruangan", `Tentukan status booking ini menjadi ${status}?`, async () => {
    try {
      const data = await API.post("validateBooking", { id_booking: id, status });
      UI.showToast(data.message || "Booking ruangan divalidasi.");
      loadStats();
      loadAktivitasTerkini();
    } catch(e) {}
  });
}

async function cancelBooking(id) {
  UI.showConfirm("Batalkan Booking", "Apakah Anda yakin ingin membatalkan booking ruangan ini?", async () => {
    try {
      const data = await API.post("cancelBooking", { id_booking: id });
      UI.showToast(data.message || "Booking ruangan berhasil dibatalkan.");
      loadStats();
      loadAktivitasTerkini();
    } catch(e) {}
  });
}

// ── User Redirections & Deletions ──────────────────
function editHumasRedirect(id, ownerName) {
  const user = Auth.getUser();
  if (!user) {
    UI.showToast("Silakan login dengan Google terlebih dahulu.", "error");
    return;
  }
  if (!user.is_admin && user.name.toLowerCase().trim() !== ownerName.toLowerCase().trim()) {
    UI.showToast(`Akses Ditolak. Hanya pemilik laporan (${ownerName}) atau Admin yang dapat mengedit.`, "error");
    return;
  }
  window.location.href = `humas/index.html?editHumas=${id}`;
}

function editHelpdeskRedirect(id, ownerName) {
  const user = Auth.getUser();
  if (!user) {
    UI.showToast("Silakan login dengan Google terlebih dahulu.", "error");
    return;
  }
  if (!user.is_admin && user.name.toLowerCase().trim() !== ownerName.toLowerCase().trim()) {
    UI.showToast(`Akses Ditolak. Hanya pemilik laporan (${ownerName}) atau Admin yang dapat mengedit.`, "error");
    return;
  }
  window.location.href = `helpdesk/index.html?editHelpdesk=${id}`;
}

function editBbmRedirect(id, ownerName) {
  const user = Auth.getUser();
  if (!user) {
    UI.showToast("Silakan login dengan Google terlebih dahulu.", "error");
    return;
  }
  if (!user.is_admin && user.name.toLowerCase().trim() !== ownerName.toLowerCase().trim()) {
    UI.showToast(`Akses Ditolak. Hanya pemilik permohonan (${ownerName}) atau Admin yang dapat mengedit.`, "error");
    return;
  }
  window.location.href = `bbm/index.html?editBbm=${id}`;
}

async function deleteHelpdesk(id, ownerName) {
  const user = Auth.getUser();
  if (!user) {
    UI.showToast("Silakan login dengan Google terlebih dahulu.", "error");
    return;
  }
  if (!user.is_admin && user.name.toLowerCase().trim() !== ownerName.toLowerCase().trim()) {
    UI.showToast(`Akses Ditolak. Hanya pemilik laporan (${ownerName}) atau Admin yang dapat menghapus.`, "error");
    return;
  }
  
  UI.showConfirm("Hapus Laporan", "Apakah Anda yakin ingin menghapus laporan helpdesk ini?", async () => {
    try {
      const data = await API.post("deleteHelpdesk", { id_tiket: id });
      UI.showToast(data.message || "Laporan helpdesk berhasil dihapus.");
      loadStats();
      loadAktivitasTerkini();
    } catch(e) {}
  });
}

async function deleteHumas(id, ownerName) {
  const user = Auth.getUser();
  if (!user) {
    UI.showToast("Silakan login dengan Google terlebih dahulu.", "error");
    return;
  }
  if (!user.is_admin && user.name.toLowerCase().trim() !== ownerName.toLowerCase().trim()) {
    UI.showToast(`Akses Ditolak. Hanya pemilik laporan (${ownerName}) atau Admin yang dapat menghapus.`, "error");
    return;
  }

  UI.showConfirm("Hapus Konten", "Apakah Anda yakin ingin menghapus konten humas ini?", async () => {
    try {
      const data = await API.post("deleteHumas", { id_konten: id });
      UI.showToast(data.message || "Konten humas berhasil dihapus.");
      loadStats();
      loadAktivitasTerkini();
    } catch(e) {}
  });
}

async function deleteBbm(id, ownerName) {
  const user = Auth.getUser();
  if (!user) {
    UI.showToast("Silakan login dengan Google terlebih dahulu.", "error");
    return;
  }
  if (!user.is_admin && user.name.toLowerCase().trim() !== ownerName.toLowerCase().trim()) {
    UI.showToast(`Akses Ditolak. Hanya pemilik laporan (${ownerName}) atau Admin yang dapat menghapus.`, "error");
    return;
  }

  UI.showConfirm("Hapus Permohonan", "Apakah Anda yakin ingin menghapus permohonan BBM ini?", async () => {
    try {
      const data = await API.post("deleteBbm", { id_bbm: id });
      UI.showToast(data.message || "Permohonan BBM berhasil dihapus.");
      loadStats();
      loadAktivitasTerkini();
    } catch(e) {}
  });
}

// ── Modals Trigger ───────────────────────────
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

// ── Image Compressing & Files Select ──────────
function triggerUpload(id) {
  const input = document.getElementById(id);
  if (input) input.click();
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

function handleRepFileSelect(e, type, mimeType, maxSize) {
  const file = e.target.files[0];
  if (!file) return;
  if (mimeType === 'pdf' && file.type !== 'application/pdf') {
    UI.showToast('Format file harus PDF.', 'error');
    e.target.value = '';
    return;
  }
  if (mimeType === 'image' && !file.type.startsWith('image/')) {
    UI.showToast('Format file harus Gambar.', 'error');
    e.target.value = '';
    return;
  }
  if (file.size > maxSize * 1024 * 1024) {
    UI.showToast(`Ukuran file maksimal ${maxSize}MB.`, 'error');
    e.target.value = '';
    return;
  }
  
  if (mimeType === 'image') {
    const prev = document.getElementById(`prev-rep-${type}`);
    if (prev) prev.style.display = 'flex';
    const thumb = document.getElementById(`thumb-rep-${type}`);
    if (thumb) thumb.src = '';
    
    compressImage(file, 1200, 1200, 0.7).then(compressedBase64 => {
      filesData[type].base64 = compressedBase64;
      filesData[type].name = file.name;
      if (thumb) thumb.src = compressedBase64;
    }).catch(err => {
      console.error("Compression error:", err);
      UI.showToast("Gagal mengompres gambar.", "error");
    });
  } else {
    const reader = new FileReader();
    reader.onload = ev => {
      filesData[type].base64 = ev.target.result;
      filesData[type].name = file.name;
      
      const prev = document.getElementById(`prev-rep-${type}`);
      if (prev) prev.style.display = 'flex';
      const nameEl = document.getElementById(`name-rep-${type}`);
      if (nameEl) nameEl.textContent = file.name;
    };
    reader.readAsDataURL(file);
  }
}

function clearRepFile(type) {
  filesData[type].base64 = null;
  filesData[type].name = "";
  const prev = document.getElementById(`prev-rep-${type}`);
  if (prev) prev.style.display = 'none';
  const input = document.getElementById(`f-rep-${type}`);
  if (input) input.value = '';
  const thumb = document.getElementById(`thumb-rep-${type}`);
  if (thumb) thumb.src = '';
}

// ── Detail & Lapor BBM Modals ─────────────────
function showDetailHumas(id) {
  const h = actHumas.find(item => item.id === id);
  if (!h) return;
  
  document.getElementById("det-hum-id").textContent = h.id;
  document.getElementById("det-hum-judul").textContent = h.namaKonten || "-";
  document.getElementById("det-hum-nama").textContent = h.namaPegawai || "-";
  document.getElementById("det-hum-bidang").textContent = h.bidang || "-";
  document.getElementById("det-hum-platform").textContent = h.platform || "-";
  document.getElementById("det-hum-jenis").textContent = h.jenisKonten || "-";
  document.getElementById("det-hum-tgl-post").textContent = formatShortDate(h.tanggalPosting) || "-";
  
  const linkEl = document.getElementById("det-hum-link");
  if (h.linkKonten) {
    linkEl.href = h.linkKonten;
    linkEl.textContent = h.linkKonten;
    linkEl.style.display = "inline";
  } else {
    linkEl.href = "#";
    linkEl.textContent = "-";
  }
  
  const ssEl = document.getElementById("det-hum-ss");
  if (h.screenshotUrl) {
    ssEl.src = h.screenshotUrl;
    ssEl.style.display = "block";
  } else {
    ssEl.src = "";
    ssEl.style.display = "none";
  }
  
  openModal("detail-humas-modal");
}

function openLaporBbmModal(id, maxVouchers, penerima, jenis, tujuan) {
  const user = Auth.getUser();
  if (!user) {
    UI.showToast("Silakan login dengan Google terlebih dahulu.", "error");
    const loginBar = document.getElementById("login-bar");
    if (loginBar) {
      loginBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
      loginBar.style.outline = "3px solid var(--wave)";
      setTimeout(() => { loginBar.style.outline = "none"; }, 2000);
    }
    return;
  }

  document.getElementById('rep-id-bbm').value = id;
  document.getElementById('rep-max-vouchers').value = maxVouchers;
  document.getElementById('f-rep-used').max = maxVouchers;
  document.getElementById('f-rep-used').value = maxVouchers;
  
  const isStok = (tujuan === "STOK INTERNAL");
  
  document.getElementById('report-summary-info').innerHTML = `
    <strong>ID BBM:</strong> ${id}<br/>
    <strong>Penerima:</strong> ${penerima}<br/>
    <strong>Voucher:</strong> ${jenis} (${maxVouchers} Pcs)<br/>
    ${isStok ? '<strong style="color:var(--yellow)">Tipe: Pengambilan Stok Cadangan (Tugas Mendadak)</strong>' : `<strong>Tujuan:</strong> ${tujuan}`}
  `;
  
  const stokFields = document.getElementById("rep-stok-adjust-fields");
  if (isStok) {
    stokFields.style.display = "flex";
    document.getElementById("f-rep-tanggal").required = true;
    document.getElementById("f-rep-lokasi").required = true;
    document.getElementById("f-rep-kecamatan").required = true;
    document.getElementById("f-rep-jenis-kendaraan").required = true;
    document.getElementById("f-rep-nopol").required = true;
    document.getElementById("f-rep-deskripsi").required = true;
    
    document.getElementById("f-rep-tanggal").value = "";
    document.getElementById("f-rep-lokasi").value = "";
    document.getElementById("f-rep-kecamatan").value = "";
    document.getElementById("f-rep-jenis-kendaraan").value = "dinas";
    onRepJenisKendaraanChange();
    document.getElementById("f-rep-nopol").value = "";
    document.getElementById("f-rep-deskripsi").value = "";
  } else {
    stokFields.style.display = "none";
    document.getElementById("f-rep-tanggal").required = false;
    document.getElementById("f-rep-lokasi").required = false;
    document.getElementById("f-rep-kecamatan").required = false;
    document.getElementById("f-rep-jenis-kendaraan").required = false;
    document.getElementById("f-rep-nopol").required = false;
    document.getElementById("f-rep-deskripsi").required = false;
  }
  
  ['geotag', 'surat', 'laporan', 'nota'].forEach(clearRepFile);
  updateReturnedInfo(maxVouchers, maxVouchers);
  openModal('report-bbm-modal');
}

function validateReportedVouchers(input) {
  const maxV = parseInt(document.getElementById("rep-max-vouchers").value) || 0;
  let val = parseInt(input.value) || 0;
  
  if (val > maxV) {
    UI.showToast(`Peringatan: Jumlah voucher dilaporkan (${val} pcs) tidak boleh melebihi kuota voucher diambil (${maxV} pcs)!`, "error");
    input.value = maxV;
    val = maxV;
  } else if (val < 0) {
    input.value = 1;
    val = 1;
  }
  
  updateReturnedInfo(val, maxV);
}

function updateReturnedInfo(val, maxV) {
  const warningEl = document.getElementById("rep-returned-warning");
  if (!warningEl) return;
  
  if (val > 0 && val < maxV) {
    const returnedQty = maxV - val;
    warningEl.innerHTML = `<strong>Pemberitahuan Pengembalian Voucher:</strong><br/>Anda melaporkan penggunaan <strong>${val} pcs</strong> voucher. Sisa <strong>${returnedQty} pcs</strong> voucher yang tidak digunakan wajib dikembalikan secara fisik ke Admin / Sekretariat.`;
    warningEl.style.display = "block";
  } else {
    warningEl.style.display = "none";
  }
}

function onRepJenisKendaraanChange() {
  const type = document.getElementById("f-rep-jenis-kendaraan").value;
  const nopolSelect = document.getElementById("f-rep-nopol");
  const lblNopol = document.getElementById("lbl-rep-nopol");
  if (!nopolSelect || !lblNopol) return;
  
  if (type === "pribadi") {
    lblNopol.innerHTML = 'Tipe Kendaraan Pribadi <span style="color:var(--red)">*</span>';
    nopolSelect.innerHTML = `
      <option value="" disabled selected>-- Pilih Tipe Kendaraan --</option>
      <option value="Pribadi - Motor">Motor</option>
      <option value="Pribadi - Mobil">Mobil</option>
    `;
  } else {
    lblNopol.innerHTML = 'Nomor Polisi Kendaraan <span style="color:var(--red)">*</span>';
    nopolSelect.innerHTML = `
      <option value="" disabled selected>-- Pilih Nomor Polisi --</option>
      <option value="DK 39">DK 39</option>
      <option value="DK 420 I">DK 420 I</option>
      <option value="DK 421 I">DK 421 I</option>
      <option value="DK 1702 B">DK 1702 B</option>
      <option value="DK 423 I">DK 423 I</option>
      <option value="DK 1829 A">DK 1829 A</option>
      <option value="DK 1657 A">DK 1657 A</option>
      <option value="DK 8255 D">DK 8255 D</option>
      <option value="DK 7030 D">DK 7030 D</option>
      <option value="DK 1476 D">DK 1476 D</option>
    `;
  }
}

// ── Submit Edit/Report Forms ──────────────────
async function submitEditHumas(e) {
  e.preventDefault();
  const id = document.getElementById('edit-hum-id').value;
  const nama = document.getElementById('edit-hum-nama').value;
  const tanggal = document.getElementById('edit-hum-tanggal').value;
  const link = document.getElementById('edit-hum-link').value;
  const platform = document.getElementById('edit-hum-platform').value;
  const jenis = document.getElementById('edit-hum-jenis').value;
  
  const payload = {
    id_konten: id,
    nama_konten: nama,
    tanggal_posting: tanggal,
    link_konten: link,
    platform: platform,
    jenis_konten: jenis
  };
  
  if (editHumasFotoB64) {
    payload.screenshot_base64 = editHumasFotoB64;
  }
  
  closeModal('edit-humas-modal');
  try {
    const data = await API.post("updateHumas", payload);
    UI.showToast(data.message || "Konten humas berhasil diperbarui.");
    loadAktivitasTerkini();
  } catch(e) {}
}

async function submitEditBbm(e) {
  e.preventDefault();
  const id = document.getElementById('edit-bbm-id').value;
  const jenis = document.getElementById('edit-bbm-jenis').value;
  const jumlah = document.getElementById('edit-bbm-jumlah').value;
  const tujuan = document.getElementById('edit-bbm-tujuan').value;
  closeModal('edit-bbm-modal');
  try {
    const data = await API.post("updateBbm", { id_bbm: id, jenis_voucher: jenis, jumlah, lokasi_tujuan: tujuan });
    UI.showToast(data.message || "Permohonan BBM berhasil diperbarui.");
    loadStats();
    loadAktivitasTerkini();
  } catch(e) {}
}

async function submitBbmReport(e) {
  e.preventDefault();
  const id = document.getElementById('rep-id-bbm').value;
  const used = parseInt(document.getElementById('f-rep-used').value) || 0;
  const max = parseInt(document.getElementById('rep-max-vouchers').value) || 0;
  
  if (used > max) {
    UI.showToast(`Jumlah voucher yang dilaporkan (${used}) melebihi kuota permohonan (${max}).`, "error");
    return;
  }
  
  const missingFiles = [];
  if (!filesData.geotag.base64) missingFiles.push("Foto Geotag");
  if (!filesData.surat.base64) missingFiles.push("Surat Tugas");
  if (!filesData.laporan.base64) missingFiles.push("Laporan Kegiatan");
  if (!filesData.nota.base64) missingFiles.push("Nota Bensin");

  if (missingFiles.length > 0) {
    UI.showToast(`Bukti dukung berikut wajib diunggah: ${missingFiles.join(", ")}.`, "error");
    return;
  }

  const isStok = (document.getElementById("rep-stok-adjust-fields").style.display === "flex");
  const payload = {
    id_bbm: id,
    jumlah_digunakan: used,
    foto_geotag_base64: filesData.geotag.base64,
    surat_base64: filesData.surat.base64,
    dokumen_laporan_base64: filesData.laporan.base64,
    nota_bensin_base64: filesData.nota.base64
  };

  if (isStok) {
    payload.lokasi_tujuan = document.getElementById("f-rep-lokasi").value;
    payload.kecamatan = document.getElementById("f-rep-kecamatan").value.trim();
    payload.tgl_kegiatan = document.getElementById("f-rep-tanggal").value;
    payload.deskripsi_kegiatan = document.getElementById("f-rep-deskripsi").value.trim();
    
    const repJenisKendaraan = document.getElementById("f-rep-jenis-kendaraan").value;
    let repNopol = document.getElementById("f-rep-nopol").value;
    let repPribadi = "-";
    if (repJenisKendaraan === "pribadi") {
      repPribadi = repNopol.replace("Pribadi - ", "");
      repNopol = "-";
    }
    payload.nopol_kendaraan = repNopol;
    payload.pribadi = repPribadi;
  }

  try {
    const data = await API.post("submitBbmReport", payload);
    UI.showToast(data.message || "Laporan penggunaan BBM dikirim.");
    closeModal('report-bbm-modal');
    window.location.href = window.location.pathname + "?actTab=bbm";
  } catch (err) {
    console.error(err);
  }
}

// ── Rapat Actions & Calendar ──────────────────
function normalizeDate(dateStr) {
  if (!dateStr) return "";
  dateStr = dateStr.toString().trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}\b/.test(dateStr)) return dateStr.substring(0, 10);
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}\b/.test(dateStr)) {
    const parts = dateStr.split(" ")[0].split("/");
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  if (dateStr.includes("T")) return dateStr.split("T")[0];
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {}
  return "";
}

function initHomepageCalendar(bookings) {
  homeBookings = bookings || [];
  buildHomeDateStrip();
}

function buildHomeDateStrip() {
  const strip = document.getElementById("date-strip");
  if (!strip) return;
  strip.innerHTML = "";
  const today = new Date();
  const days  = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

  for (let i = 0; i < 7; i++) {
    const d   = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    
    const dayBookings = homeBookings.filter(b => 
      normalizeDate(b.tanggal) === dateStr && b.status !== "DITOLAK" && b.status !== "DIBATALKAN"
    );
    const hasMeeting = dayBookings.length > 0;

    const btn = document.createElement("div");
    btn.className  = "date-btn" + (dateStr === selectedHomeDate ? " active" : "") + (hasMeeting ? " has-meeting" : "");
    btn.dataset.date = dateStr;
    btn.innerHTML  = `
      <div class="date-day">${days[d.getDay()]}</div>
      <div class="date-num">${d.getDate()}</div>
    `;
    btn.onclick = () => {
      document.querySelectorAll(".date-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedHomeDate = dateStr;
      renderSelectedDayBookings(dateStr, dayBookings);
    };
    strip.appendChild(btn);
  }
  
  const initialBookings = homeBookings.filter(b => 
    normalizeDate(b.tanggal) === selectedHomeDate && b.status !== "DITOLAK" && b.status !== "DIBATALKAN"
  );
  renderSelectedDayBookings(selectedHomeDate, initialBookings);
}

function formatRuanganName(name) {
  if (!name) return "";
  const upper = name.toUpperCase().trim();
  if (upper === "RUANG RAPAT TONGKOL") return "Ruang Rapat Tongkol";
  if (upper === "RUANG RAPAT TUNA") return "Ruang Rapat Tuna";
  if (upper === "RUANG LAKTASI") return "Ruang Laktasi";
  if (upper === "RUANG PPID") return "Ruang PPID";
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function renderSelectedDayBookings(dateStr, bookings) {
  const container = document.getElementById("calendar-bookings-list");
  if (!container) return;
  
  const formattedDate = formatShortDate(dateStr);
  
  if (!bookings || bookings.length === 0) {
    container.innerHTML = `
      <div style="font-size:11px; font-weight:700; color:var(--muted); font-family:var(--mono); margin-bottom:8px; text-transform:uppercase;">JADWAL ${formattedDate}</div>
      <div class="cal-booking-empty">Tidak ada booking ruang rapat</div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div style="font-size:11px; font-weight:700; color:var(--muted); font-family:var(--mono); margin-bottom:8px; text-transform:uppercase;">JADWAL ${formattedDate} (${bookings.length})</div>
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${bookings.map(b => {
        const actionsHtml = `
          <div class="act-actions" style="margin-top: 8px; display: flex; gap: 8px; justify-content: flex-start; margin-left: 0;">
            <button class="act-btn act-btn-primary" onclick="editBookingHome('${b.id}', '${Utils.escapeHtml(b.pemohon)}')">Edit</button>
            <button class="act-btn act-btn-danger" onclick="cancelBookingHome('${b.id}', '${Utils.escapeHtml(b.pemohon)}')">Hapus</button>
          </div>
        `;

        const bidangStr = (b.bidang && b.bidang.trim() !== "" && b.bidang.trim() !== "-") ? ` (${Utils.escapeHtml(b.bidang)})` : "";

        return `
          <div class="cal-booking-item" style="background: var(--ink2); border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); border-radius: 12px; padding: 16px; transition: all 0.2s ease; cursor: default;" onmouseover="this.style.borderColor='var(--border2)'; this.style.boxShadow='0 6px 16px rgba(0, 0, 0, 0.06)';" onmouseout="this.style.borderColor='var(--border)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.03)';">
            
            <div style="font-size: 11px; font-weight: 700; color: var(--wave); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
              ${Utils.escapeHtml(formatRuanganName(b.ruangan))}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px;">
              <div style="font-size: 15px; font-weight: 700; color: var(--text);">${Utils.escapeHtml(b.acara || b.keterangan || "Acara Rapat")}</div>
              <div style="font-size: 11px; font-weight: 700; color: var(--wave); background: rgba(0, 119, 230, 0.08); border-radius: 6px; padding: 4px 8px; font-family: var(--mono); white-space: nowrap;">
                ${Utils.escapeHtml(b.mulai || "--:--")} - ${Utils.escapeHtml(b.selesai || "--:--")}
              </div>
            </div>

            <div style="font-size: 12px; color: var(--muted); margin-bottom: 8px;">
              Pemohon: <span style="font-weight: 600; color: var(--text);">${Utils.escapeHtml(b.pemohon || "-")}</span>${bidangStr}
            </div>

            <div style="font-size: 11px; color: var(--muted); margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border); display: flex; align-items: center; gap: 4px;">
              <span style="color: var(--wave); display: inline-flex; align-items: center;"><svg style="width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
              <span>Fasilitas: <span style="font-style: italic; font-weight: 500; color: var(--text);">${Utils.escapeHtml(b.kebutuhan || "-")}</span></span>
            </div>

            ${actionsHtml}
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function editBookingHome(id, ownerName) {
  const user = Auth.getUser();
  if (!user) {
    UI.showToast("Silakan login dengan Google terlebih dahulu.", "error");
    return;
  }
  if (!user.is_admin && user.name.toLowerCase().trim() !== ownerName.toLowerCase().trim()) {
    UI.showToast(`Akses Ditolak. Hanya pemilik booking (${ownerName}) atau Admin yang dapat mengedit.`, "error");
    return;
  }
  window.location.href = `rapat/index.html?editBooking=${id}`;
}

async function cancelBookingHome(id, ownerName) {
  const user = Auth.getUser();
  if (!user) {
    UI.showToast("Silakan login dengan Google terlebih dahulu.", "error");
    return;
  }
  if (!user.is_admin && user.name.toLowerCase().trim() !== ownerName.toLowerCase().trim()) {
    UI.showToast(`Akses Ditolak. Hanya pemilik booking (${ownerName}) atau Admin yang dapat membatalkan.`, "error");
    return;
  }
  UI.showConfirm("Batalkan Booking", "Apakah Anda yakin ingin membatalkan booking ruang rapat ini?", async () => {
    try {
      const data = await API.post("cancelBooking", { id_booking: id });
      UI.showToast(data.message || "Booking berhasil dibatalkan.");
      loadStats();
      loadAktivitasTerkini();
    } catch(e) {}
  });
}

function editBooking(id, acara, tanggal, mulai, selesai) {
  document.getElementById('edit-book-id').value = id;
  document.getElementById('edit-book-acara').value = acara;
  document.getElementById('edit-book-tanggal').value = tanggal;
  document.getElementById('edit-book-mulai').value = mulai;
  document.getElementById('edit-book-selesai').value = selesai;
  openModal('edit-booking-modal');
}

async function submitEditBooking(e) {
  e.preventDefault();
  const id = document.getElementById('edit-book-id').value;
  const acara = document.getElementById('edit-book-acara').value;
  const tanggal = document.getElementById('edit-book-tanggal').value;
  const mulai = document.getElementById('edit-book-mulai').value;
  const selesai = document.getElementById('edit-book-selesai').value;
  closeModal('edit-booking-modal');
  try {
    const data = await API.post("updateBooking", {
      id_booking: id,
      nama_acara: acara,
      tanggal: tanggal,
      jam_mulai: mulai,
      jam_selesai: selesai
    });
    UI.showToast(data.message || "Booking berhasil diperbarui.");
    loadStats();
    loadAktivitasTerkini();
  } catch(e) {}
}

function onEditPlatformChange() {
  const p = document.getElementById("edit-hum-platform").value;
  const jSel = document.getElementById("edit-hum-jenis");
  const options = {
    "Website":   ["Berita"],
    "Instagram": ["Post", "Story", "Reels"],
    "YouTube":   ["Video", "Shorts"],
    "TikTok":    ["Video"],
    "Facebook":  ["Post", "Reels"]
  };
  const list = options[p] || [];
  jSel.innerHTML = list.map(j => `<option value="${j}">${j}</option>`).join("");
}

async function handleEditHumasFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const compressedDataUrl = await compressImage(file, 1600, 1600, 0.8);
    editHumasFotoB64 = compressedDataUrl;
    document.getElementById("edit-hum-ss-preview").src = compressedDataUrl;
    document.getElementById("edit-hum-ss-preview-container").style.display = "block";
  } catch (err) {
    console.error("Compression error:", err);
    UI.showToast("Gagal memproses foto.", "error");
  }
}

function getDriveViewUrl(url) {
  if (!url) return "#";
  const match = url.match(/id=([^&]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/view`;
  }
  return url;
}

// ── PWA Install Events ────────────────────────
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  const btnHero = document.getElementById("btn-install-hero");
  if (btnHero) btnHero.style.display = "block";
});

window.addEventListener("appinstalled", () => {
  const btnHero = document.getElementById("btn-install-hero");
  if (btnHero) btnHero.style.display = "none";
  deferredPrompt = null;
});

async function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      const btnHero = document.getElementById("btn-install-hero");
      if (btnHero) btnHero.style.display = "none";
    }
    deferredPrompt = null;
  } else {
    alert("Untuk menginstal ARUNIWAVES:\n\n" +
          "• Android (Chrome): Klik tombol Menu (titik tiga) lalu pilih 'Tambahkan ke Layar Utama' / 'Instal Aplikasi'.\n" +
          "• iPhone/iPad (Safari): Klik tombol 'Bagikan' (Share) lalu pilih 'Tambahkan ke Layar Utama'.\n" +
          "• Desktop (Chrome/Edge): Klik ikon unduh/instal di sisi kanan address bar browser Anda.");
  }
}

// ── Google Sign-in Handler Callbacks ─────────
function onGoogleLoginSuccess(currentUser) {
  window.showUserBar(currentUser);
  loadStats();
  loadAktivitasTerkini();
}

function onGoogleLoginError(msg) {
  UI.showToast(msg, "error");
}

// ── App Slider Touch/Drag Navigation ──────────
function scrollToPage(pageIndex) {
  const slider = document.querySelector('.app-grid');
  if (slider) {
    slider.scrollTo({
      left: pageIndex * slider.clientWidth,
      behavior: 'smooth'
    });
  }
}

// ── Initialization ───────────────────────────
(async function initHomepage() {
  // Render Dynamic Navigation
  UI.renderNavigation();
  
  // Set clock
  updateClock();
  setInterval(updateClock, 1000);

  // Authenticated state restoration
  const cachedUser = Auth.getUser();
  if (cachedUser) {
    window.showUserBar(cachedUser);
  }

  // Load GIS button
  Auth.init("gis-btn-container", onGoogleLoginSuccess, onGoogleLoginError);

  // Throttled initialization
  await Promise.all([loadStats(), loadAktivitasTerkini()]);
  
  // Act tab redirect checks
  const actTabParam = Utils.getQueryParam("actTab");
  if (actTabParam) {
    switchActTab(actTabParam);
    const actWidget = document.querySelector(".activity-list");
    if (actWidget) {
      setTimeout(() => {
        actWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }

  // Standalone mode install buttons
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (!isStandalone) {
    const btnHero = document.getElementById("btn-install-hero");
    if (btnHero) btnHero.style.display = "block";
  }

  // PWA Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .catch(err => console.log("SW registration failed:", err));
  }

  // Drag slider logic for homepage cards
  const slider = document.querySelector('.app-grid');
  if (slider) {
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
      isDown = true;
      slider.style.scrollSnapType = 'none';
      slider.style.cursor = 'grabbing';
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    const handleDragEnd = () => {
      if (!isDown) return;
      isDown = false;
      slider.style.cursor = 'grab';
      slider.style.scrollSnapType = 'x mandatory';
      const width = slider.clientWidth;
      if (width > 0) {
        const pageIndex = Math.round(slider.scrollLeft / width);
        slider.scrollTo({ left: pageIndex * width, behavior: 'smooth' });
      }
    };

    slider.addEventListener('mouseleave', handleDragEnd);
    slider.addEventListener('mouseup', handleDragEnd);

    slider.addEventListener('mousemove', (e) => {
      if(!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.5;
      slider.scrollLeft = scrollLeft - walk;
    });

    slider.addEventListener('scroll', () => {
      const width = slider.clientWidth;
      if (width > 0) {
        const pageIndex = Math.round(slider.scrollLeft / width);
        const dots = document.querySelectorAll('.title-page-btn');
        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === pageIndex);
        });
      }
    });

    slider.style.cursor = 'grab';
  }

  // Keyboard opening indicator
  document.addEventListener("focusin", e => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      document.body.classList.add("keyboard-open");
    }
  });
  document.addEventListener("focusout", e => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      document.body.classList.remove("keyboard-open");
    }
  });

  // Expose IIFE local functions to window object for inline HTML event handlers
  window.installPWA = installPWA;
  window.scrollToPage = scrollToPage;
  window.switchActTab = switchActTab;
  window.closeModal = closeModal;
  window.triggerUpload = triggerUpload;
  window.clearRepFile = clearRepFile;
  window.editHelpdeskRedirect = editHelpdeskRedirect;
  window.deleteHelpdesk = deleteHelpdesk;
  window.editBbmRedirect = editBbmRedirect;
  window.deleteBbm = deleteBbm;
  window.reportBbmRedirect = reportBbmRedirect;
  window.editBookingRedirect = editBookingRedirect;
  window.cancelBooking = cancelBooking;
  window.editHumasRedirect = editHumasRedirect;
  window.deleteHumas = deleteHumas;
})();

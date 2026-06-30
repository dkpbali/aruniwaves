/* ===================================================================
   ARUNIWAVES - Meeting Room Booking Module Specific JS
   =================================================================== */

let allPegawai = [];
let allLokasi = [];
let allBooking = [];
let selectedRoom = null;
let selectedTipe = "RUANG RAPAT";
let editingBookingId = null;
let jadwalDate = new Date();

// Helper shorthand selector
const $ = id => document.getElementById(id);

// Definisi ruangan
const ROOMS = {
  "RUANG RAPAT": [
    { nama:"RUANG RAPAT TUNA",    emoji:"", cap:"50 orang", fac:"AC · TV · Webcam · Sound System" },
    { nama:"RUANG RAPAT TONGKOL", emoji:"", cap:"20 orang", fac:"AC · TV · Webcam · Sound System" },
  ],
  "RUANG KHUSUS": [
    { nama:"RUANG LAKTASI", emoji:"", cap:"", fac:"Sofa · AC · Privasi" },
    { nama:"RUANG PPID",    emoji:"", cap:"", fac:"Meja · AC · Komputer" },
  ],
};

// ── Tabs ────────────────────────────────────
function switchTab(tab) {
  ["booking","jadwal"].forEach(t => {
    const sect = $(`section-${t}`);
    const tabEl = $(`tab-${t}`);
    if (sect) sect.classList.toggle("active", t === tab);
    if (tabEl) tabEl.classList.toggle("active", t === tab);
  });
  if (tab === "jadwal") {
    loadBooking().then(() => {
      buildDateStrip();
      renderJadwal();
    }).catch(err => console.error("Gagal memuat data booking:", err));
  }

  // Persist tab to URL
  const url = new URL(window.location);
  url.searchParams.set("tab", tab);
  window.history.replaceState({}, "", url);
}

function setTipe(tipe) {
  selectedTipe = tipe;
  selectedRoom = null;
  const selectEl = $("f-tipe-ruangan");
  if (selectEl) selectEl.value = tipe;

  // Show/hide conditional fields
  const fAcara = $("field-acara");
  const fKet = $("field-keterangan");
  const fKebutuhan = $("field-kebutuhan");
  if (fAcara) fAcara.classList.toggle("show", tipe === "RUANG RAPAT");
  if (fKet) fKet.classList.toggle("show", tipe === "RUANG KHUSUS");
  if (fKebutuhan) fKebutuhan.classList.toggle("show", tipe === "RUANG RAPAT");

  renderRoomCards();
  updateSubmitBtn();
  cekKetersediaan();
}

function renderRoomCards() {
  const rooms = ROOMS[selectedTipe] || [];
  const wrap = $("room-cards-wrap");
  if (!wrap) return;
  wrap.innerHTML = `<div class="room-grid">${rooms.map(r => `
    <div class="room-card" id="card-${r.nama.replace(/\s/g,'_')}"
         onclick="selectRoom('${r.nama}')">
      <div class="room-name">${r.nama.replace("RUANG RAPAT ","").replace("RUANG ","")}</div>
      ${r.cap ? `<div class="room-cap">Maks. ${r.cap}</div>` : ""}
      <div class="room-fac">${r.fac}</div>
      <div class="room-check"><svg style="width: 10px; height: 10px; stroke: white; fill: none; stroke-width: 3;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
    </div>
  `).join("")}</div>`;
}

function selectRoom(nama) {
  selectedRoom = nama;
  document.querySelectorAll(".room-card").forEach(c => c.classList.remove("selected"));
  const card = $(`card-${nama.replace(/\s/g,'_')}`);
  if (card) card.classList.add("selected");
  updateSubmitBtn();
  cekKetersediaan();
}

function updateSubmitBtn() {
  const btn = $("btn-submit");
  if (!btn) return;
  if (!selectedRoom) {
    btn.disabled = true;
    btn.textContent = "Pilih ruangan terlebih dahulu";
  } else {
    btn.disabled = false;
    btn.textContent = `Ajukan Booking - ${selectedRoom.replace("RUANG RAPAT ","").replace("RUANG ","")}`;
  }
}

// ── Load data ───────────────────────────────
async function loadPegawai() {
  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      allPegawai = [
        { id:"P0001", nama:"NI PUTU ADELIA",       bidang:"SEKRETARIAT", subBidang:"SUNPROG" },
        { id:"P0002", nama:"PANDE GDE KRISHNADANA",bidang:"SEKRETARIAT", subBidang:"SUNPROG" },
        { id:"P0005", nama:"DEWA YOJANA",           bidang:"BIDANG P2HP", subBidang:"" },
        { id:"P0008", nama:"WAYAN SAPUTRA",         bidang:"BIDANG PERIKANAN", subBidang:"" },
      ];
    } else {
      const cached = sessionStorage.getItem("aruniwaves_pegawai");
      if (cached) {
        allPegawai = JSON.parse(cached);
      } else {
        const json = await API.get("getPegawai");
        if (json.success) {
          allPegawai = json.data;
          sessionStorage.setItem("aruniwaves_pegawai", JSON.stringify(json.data));
        }
      }
    }
    initAutocomplete("f-pemohon-search", "f-pemohon-list", "f-pemohon", allPegawai, () => {
      onPemohonChange();
    });
  } catch (e) {
    console.error("Error loading employees:", e);
  }
}

async function loadBooking() {
  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      const today = new Date().toISOString().split("T")[0];
      allBooking = [
        { id:"RPT-0001", ruangan:"RUANG RAPAT TONGKOL", acara:"Rapat Koordinasi Program", pemohon:"NI PUTU ADELIA", tanggal:today, mulai:"09:00", selesai:"11:00", status:"DISETUJUI", tipe:"RUANG RAPAT", id_pemohon:"P0001", bidang:"SEKRETARIAT", kebutuhan:"", keterangan:"" },
        { id:"RPT-0002", ruangan:"RUANG RAPAT TUNA",    acara:"Evaluasi Budidaya Udang",  pemohon:"WAYAN SAPUTRA",  tanggal:today, mulai:"13:00", selesai:"15:00", status:"PENDING",   tipe:"RUANG RAPAT", id_pemohon:"P0008", bidang:"BIDANG PERIKANAN", kebutuhan:"", keterangan:"" },
      ];
    } else {
      const json = await API.get("getBooking");
      if (json.success) {
        allBooking = json.data.map(b => ({
          id:          b.id,
          ruangan:     b.ruangan,
          acara:       b.acara || b.keterangan,
          pemohon:     b.pemohon,
          tanggal:     b.tanggal,
          mulai:       b.mulai,
          selesai:     b.selesai,
          status:      b.status,
          tipe:        b.tipe,
          id_pemohon:  b.id_pemohon || b.id_pegawai || "",
          bidang:      b.bidang || b.bidang_pemohon || "",
          kebutuhan:   b.kebutuhan || b.kebutuhan_khusus || "",
          keterangan:  b.keterangan || ""
        }));
      }
    }
  } catch (e) {
    console.error("Error loading bookings:", e);
  }
}

// ── Pemohon change ──────────────────────────
function onPemohonChange() {
  const id = $("f-pemohon").value;
  const peg = allPegawai.find(p => p.id === id);
  const el = $("display-bidang");
  if (peg) {
    $("val-bidang").textContent = peg.bidang + (peg.subBidang ? ` - ${peg.subBidang}` : "");
    el.classList.add("show");
  } else {
    el.classList.remove("show");
  }
}

// Helper to normalize different date formats
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

// ── Cek ketersediaan ────────────────────────
async function cekKetersediaan() {
  if (!selectedRoom) return;
  const tgl = $("f-tanggal").value;
  const mulai = $("f-mulai").value;
  const selesai = $("f-selesai").value;
  const ind = $("avail-indicator");
  if (!ind) return;

  if (!tgl || !mulai || !selesai) { 
    ind.className = "avail"; 
    return; 
  }
  
  if (mulai >= selesai) {
    ind.className = "avail warn show";
    ind.textContent = "Jam selesai harus lebih dari jam mulai";
    return;
  }

  const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
  if (hasScriptUrl) {
    await loadBooking();
  }

  const normalizedTgl = normalizeDate(tgl);
  const clash = allBooking.find(b =>
    b.ruangan === selectedRoom &&
    normalizeDate(b.tanggal) === normalizedTgl &&
    b.id !== editingBookingId &&
    b.status !== "DITOLAK" && b.status !== "DIBATALKAN" &&
    !(selesai <= b.mulai || mulai >= b.selesai)
  );

  const btn = $("btn-submit");
  if (clash) {
    ind.className = "avail clash show";
    ind.textContent = `Bentrok: ${clash.acara} (${clash.mulai}–${clash.selesai})`;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Jam bentrok - pilih waktu lain";
    }
  } else {
    ind.className = "avail ok show";
    ind.textContent = `Tersedia pada ${mulai}–${selesai}`;
    if (btn) {
      btn.disabled = false;
      if (editingBookingId) {
        btn.textContent = `Simpan Perubahan - ${editingBookingId}`;
      } else {
        btn.textContent = `Ajukan Booking - ${selectedRoom.replace("RUANG RAPAT ","").replace("RUANG ","")}`;
      }
    }
  }
}

// ── Submit ──────────────────────────────────
function restoreSubmitBtn() {
  const btn = $("btn-submit");
  if (!btn) return;
  btn.disabled = false;
  if (editingBookingId) {
    btn.textContent = `Simpan Perubahan - ${editingBookingId}`;
  } else {
    updateSubmitBtn();
  }
}

async function submitBooking(e) {
  e.preventDefault();
  if (!selectedRoom) { UI.showToast("Pilih ruangan terlebih dahulu.", true); return; }

  const btn = $("btn-submit");
  btn.disabled = true;
  btn.innerHTML = '<span class="spin" style="border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; width: 16px; height: 16px; display: inline-block;"></span> <span>Mengirim...</span>';

  const pemId = $("f-pemohon").value;
  if (!pemId) {
    UI.showToast("Pilih nama Pemohon dari daftar yang muncul saat mengetik.", true);
    restoreSubmitBtn();
    return;
  }
  const pem = allPegawai.find(p => p.id === pemId);
  const bidang = pem ? pem.bidang + (pem.subBidang ? ` - ${pem.subBidang}` : "") : "";
  const isRapat = selectedTipe === "RUANG RAPAT";

  const acara = $("f-acara").value.trim();
  const ket = $("f-keterangan").value.trim();
  if (isRapat && !acara) { UI.showToast("Nama acara wajib diisi.", true); restoreSubmitBtn(); return; }
  if (!isRapat && !ket) { UI.showToast("Keterangan keperluan wajib diisi.", true); restoreSubmitBtn(); return; }

  const usr = Auth.getCurrentUser();
  const payload = {
    action:         editingBookingId ? "updateBooking" : "submitBooking",
    id_token:       usr ? usr.id_token : "",
    id_booking:     editingBookingId || "",
    id_pemohon:     pemId,
    nama_pemohon:   pem ? pem.nama : "",
    bidang_pemohon: bidang,
    tipe_ruangan:   selectedTipe,
    nama_ruangan:   selectedRoom,
    id_lokasi:      "",
    nama_acara:     isRapat ? acara : "",
    keterangan:     !isRapat ? ket : "",
    tanggal:        $("f-tanggal").value,
    jam_mulai:      $("f-mulai").value,
    jam_selesai:    $("f-selesai").value,
    kebutuhan:      isRapat ? $("f-kebutuhan").value : "",
  };

  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      await new Promise(r => setTimeout(r, 1000));
      showSuccess(editingBookingId || "RPT-" + String(Math.floor(Math.random()*900)+100).padStart(4,"0"), !!editingBookingId);
      return;
    }
    
    const data = await API.post(payload);
    if (data.success) {
      showSuccess(data.booking_id || editingBookingId, !!editingBookingId);
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    UI.showToast("Gagal: " + err.message, true);
    restoreSubmitBtn();
  }
}

function showSuccess(id, isUpdate = false) {
  if (isUpdate) {
    UI.showToast("Pemesanan ruang rapat berhasil diperbarui! Booking: " + id);
  } else {
    UI.showToast("Pemesanan ruang rapat berhasil dikirim! Booking: " + id);
  }
  setTimeout(() => {
    window.location.href = "../index.html?actTab=rapat";
  }, 1500);
}

function resetBooking() {
  $("form-booking").reset();
  $("form-booking").style.display = "block";
  $("success-screen").style.display = "none";
  selectedRoom = null;
  editingBookingId = null;
  document.querySelectorAll(".room-card").forEach(c => c.classList.remove("selected"));
  $("display-bidang").classList.remove("show");
  $("avail-indicator").className = "avail";
  $("f-pemohon-search").value = "";
  $("f-pemohon").value = "";
  updateSubmitBtn();
}

// ── Jadwal ──────────────────────────────────
function buildDateStrip() {
  const strip = $("date-strip");
  if (!strip) return;
  strip.innerHTML = "";
  const today = new Date();
  const days = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    
    const hasMeeting = allBooking.some(b => 
      normalizeDate(b.tanggal) === dateStr && b.status !== "DITOLAK" && b.status !== "DIBATALKAN"
    );

    const isJadwalDate = normalizeDate(dateStr) === normalizeDate(jadwalDate.toISOString().split("T")[0]);
    const btn = document.createElement("div");
    btn.className = "date-btn" + (isJadwalDate ? " active" : "") + (hasMeeting ? " has-meeting" : "");
    btn.dataset.date = dateStr;
    btn.innerHTML = `
      <div class="date-day">${days[d.getDay()]}</div>
      <div class="date-num">${d.getDate()}</div>
      ${i === 0 ? '<div class="date-today">Hari ini</div>' : ""}
    `;
    btn.onclick = () => {
      document.querySelectorAll(".date-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      jadwalDate = d;
      renderJadwal();
    };
    strip.appendChild(btn);
  }
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

function renderJadwal() {
  const tgl = jadwalDate.toISOString().split("T")[0];
  const content = $("jadwal-content");
  if (!content) return;
  const allRooms = [...ROOMS["RUANG RAPAT"], ...ROOMS["RUANG KHUSUS"]];

  const chipMap = {
    "DISETUJUI": "chip-disetujui",
    "PENDING":   "chip-pending",
    "DITOLAK":   "chip-ditolak",
  };

  let html = "";
  allRooms.forEach(room => {
    const slots = allBooking
      .filter(b => b.ruangan === room.nama && normalizeDate(b.tanggal) === tgl && b.status !== "DITOLAK" && b.status !== "DIBATALKAN")
      .sort((a,b) => a.mulai.localeCompare(b.mulai));

    html += `
      <div class="room-schedule" style="margin-bottom: 20px;">
        <div class="room-schedule-header" style="font-size: 14px; font-weight: 700; color: var(--text); padding-bottom: 8px; border-bottom: 1px solid var(--border); margin-bottom: 10px;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--indigo2); margin-right:8px; vertical-align: middle;"></span> ${formatRuanganName(room.nama)}
        </div>
        ${slots.length
          ? slots.map(s => `
            <div class="booking-slot" style="border-left: 3px solid var(--indigo2); padding-left: 12px; margin-bottom: 8px; background: var(--ink2); border-radius: 4px 10px 10px 4px; padding: 10px 12px;">
              <div class="slot-time" style="font-weight: 700; color: var(--indigo2); font-family: var(--mono); font-size: 11px; min-width: 85px; line-height: 1.5; flex-shrink: 0;">Mulai: ${s.mulai}<br/>Selesai: ${s.selesai}</div>
              <div style="flex:1; min-width:0; padding-left: 8px;">
                <div class="slot-acara" style="font-size: 14px; font-weight: 700; color: var(--text);">${s.acara || s.keterangan || "Acara Rapat"}</div>
                <div class="slot-pemohon" style="font-size: 11px; color: var(--muted); margin-top: 3px;">Pemohon: ${s.pemohon}</div>
                ${s.kebutuhan ? `
                  <div class="slot-kebutuhan" style="font-size: 11px; color: var(--muted); margin-top: 5px; padding-top: 5px; border-top: 1px dashed var(--border); display: flex; align-items: center; gap: 4px;">
                    <span style="color:var(--indigo2); display: inline-flex; align-items: center;"><svg style="width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
                    <span style="font-style: italic;">Kebutuhan: ${s.kebutuhan}</span>
                  </div>` : ""}
              </div>
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0;">
                <span class="slot-chip ${chipMap[s.status] || "chip-pending"}">${s.status}</span>
                ${s.status !== "DITOLAK" && s.status !== "DIBATALKAN" ? `
                  <div style="display:flex; gap:6px; margin-top:4px;">
                    <button type="button" class="btn-edit-slot" onclick="editBooking('${s.id}')">Edit</button>
                    <button type="button" class="btn-delete-slot" onclick="deleteBooking('${s.id}')">Hapus</button>
                  </div>
                ` : ""}
              </div>
            </div>
          `).join("")
          : `<div class="slot-empty">Tidak ada booking hari ini</div>`
        }
      </div>
    `;
  });

  content.innerHTML = html;
}

// ── Edit Booking ────────────────────────────
function editBooking(id) {
  const b = allBooking.find(x => x.id === id);
  if (!b) return;

  editingBookingId = b.id;
  setTipe(b.tipe || "RUANG RAPAT");
  selectRoom(b.ruangan);
  
  const peg = allPegawai.find(p => p.nama === b.pemohon);
  if (peg) {
    $("f-pemohon-search").value = peg.nama;
    $("f-pemohon").value = peg.id;
    onPemohonChange();
  } else {
    $("f-pemohon-search").value = b.pemohon;
    $("f-pemohon").value = b.id_pemohon || "";
  }
  
  if (b.tipe === "RUANG RAPAT") {
    $("f-acara").value = b.acara || "";
    $("f-kebutuhan").value = b.kebutuhan || "";
  } else {
    $("f-keterangan").value = b.keterangan || b.acara || "";
  }
  
  $("f-tanggal").value = normalizeDate(b.tanggal);
  $("f-mulai").value = b.mulai || "";
  $("f-selesai").value = b.selesai || "";
  
  const btn = $("btn-submit");
  if (btn) {
    btn.textContent = `Simpan Perubahan - ${b.id}`;
    btn.disabled = false;
  }
  
  const heroEyebrow = document.querySelector(".bbm-eyebrow");
  const heroTitle = document.querySelector(".bbm-title");
  const heroSub = document.querySelector(".bbm-sub");
  if (heroEyebrow) heroEyebrow.textContent = "EDIT BOOKING RUANGAN";
  if (heroTitle) heroTitle.textContent = "Ubah Booking Ruangan";
  if (heroSub) heroSub.textContent = "Perbarui formulir di bawah ini untuk menyimpan perubahan pada pesanan ruangan rapat Anda.";
  document.title = "Edit Booking Rapat - ARUNIWAVES";

  switchTab("booking");
  const indicator = $("avail-indicator");
  if (indicator) indicator.className = "avail";
}

// ── Delete Booking ──────────────────────────
async function deleteBooking(id) {
  if (!confirm("Apakah Anda yakin ingin membatalkan/menghapus booking ini?")) return;
  
  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      allBooking = allBooking.filter(b => b.id !== id);
      UI.showToast("Booking berhasil dihapus (mode demo).");
      buildDateStrip();
      renderJadwal();
      return;
    }
    
    const usr = Auth.getCurrentUser();
    if (!usr) {
      UI.showToast('Login diperlukan untuk membatalkan booking.', true);
      return;
    }
    const payload = {
      action: "cancelBooking",
      id_token: usr.id_token,
      id_booking: id
    };
    
    const data = await API.post(payload);
    if (data.success) {
      UI.showToast("Booking berhasil dibatalkan.");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      throw new Error(data.message || "Gagal membatalkan.");
    }
  } catch (err) {
    UI.showToast("Gagal menghapus: " + err.message, true);
  }
}

// ── Autocomplete Helper ───────────────────────
function initAutocomplete(inputId, listId, hiddenId, dataList, onSelectCallback) {
  const searchInput = $(inputId);
  const dropdownList = $(listId);
  const hiddenInput = $(hiddenId);
  if (!searchInput || !dropdownList || !hiddenInput) return;

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
      el.addEventListener("mousedown", e => {
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

// ── Initializer ──
(async function initRapat() {
  UI.renderNavigation("rapat");

  // Set min date = today
  const today = new Date().toISOString().split("T")[0];
  if ($("f-tanggal")) {
    $("f-tanggal").min = today;
    $("f-tanggal").value = today;
  }

  setTipe("RUANG RAPAT");

  await Promise.all([loadPegawai(), loadBooking()]);

  const editId = new URLSearchParams(window.location.search).get("editBooking");
  if (editId) {
    setTimeout(() => { editBooking(editId); }, 200);
  }

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab");
  if (tabParam === "jadwal") {
    switchTab("jadwal");
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
})();

/* ===================================================================
   ARUNIWAVES - IT Helpdesk Module Specific JS
   =================================================================== */

let allPegawai = [];
let allTiket = [];
let fotoB64 = null;
let hasFoto = false;
let editingHelpdeskId = null;

// Helper shorthand selector
const $ = id => document.getElementById(id);

// ── Tabs ────────────────────────────────────
function switchTab(tab) {
  ["form"].forEach(t => {
    const section = $(`section-${t}`);
    const tabEl = $(`tab-${t}`);
    if (section) section.classList.toggle("active", t === tab);
    if (tabEl) tabEl.classList.toggle("active", t === tab);
  });
}

// ── Load Pegawai ────────────────────────────
async function loadPegawai() {
  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      allPegawai = [
        { id:"P0001", nama:"NI PUTU ADELIA",        bidang:"SEKRETARIAT", subBidang:"SUNPROG" },
        { id:"P0002", nama:"PANDE GDE KRISHNADANA",  bidang:"SEKRETARIAT", subBidang:"SUNPROG" },
        { id:"P0003", nama:"WAYAN DENI KORIAWAN",    bidang:"SEKRETARIAT", subBidang:"KEUANGAN" },
        { id:"P0004", nama:"MADE SARI DEWI",         bidang:"SEKRETARIAT", subBidang:"UMPEG" },
        { id:"P0005", nama:"IDA BAGUS SUARDANA",     bidang:"KEPALA DINAS",subBidang:"" },
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

// ── Pegawai change ──────────────────────────
function onPegawaiChange() {
  const id = $("f-pegawai").value;
  const peg = allPegawai.find(p => p.id === id);
  const el = $("display-bidang");
  const val = $("val-bidang");

  if (peg) {
    val.textContent = peg.lokasiKerja || peg.bidang || "-";
    el.classList.add("show");
  } else {
    el.classList.remove("show");
  }
}

// ── Foto ────────────────────────────────────
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
    $("f-foto").files = dt.files;
    previewFoto({ target: { files: [file] } });
  }
}

function removeFoto() {
  fotoB64 = null;
  hasFoto = false;
  $("foto-preview").style.display = "none";
  $("foto-zone").style.display = "block";
  $("f-foto").value = "";
}

// ── Submit / Update ──────────────────────────
async function submitLaporan(e) {
  e.preventDefault();

  if (!hasFoto) {
    UI.showToast("Foto kondisi kerusakan wajib diunggah/diambil.", true);
    $("foto-required").style.display = "block";
    $("foto-zone").scrollIntoView({ behavior:"smooth" });
    return;
  }

  const btn = $("btn-submit");
  btn.disabled = true;
  btn.innerHTML = '<span class="spin" style="border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; width: 16px; height: 16px; display: inline-block;"></span> <span>Menyimpan...</span>';

  const pegId = $("f-pegawai").value;
  if (!pegId) {
    UI.showToast("Pilih nama Pegawai dari daftar yang muncul saat mengetik.", true);
    btn.disabled = false;
    btn.innerHTML = editingHelpdeskId ? "<span>Simpan Perubahan</span>" : "<span>Kirim Laporan</span>";
    return;
  }
  const peg = allPegawai.find(p => p.id === pegId);

  let payload;
  if (editingHelpdeskId) {
    const usr = Auth.getCurrentUser();
    if (!usr) {
      UI.showToast("Login Google diperlukan untuk menyimpan perubahan.", true);
      btn.disabled = false; 
      btn.innerHTML = "<span>Simpan Perubahan</span>";
      return;
    }
    payload = {
      action:       "updateHelpdesk",
      id_tiket:     editingHelpdeskId,
      id_token:     usr.id_token,
      judul:        $("f-judul").value.trim(),
      nama_barang:  $("f-aset").value.trim(),
      deskripsi:    $("f-deskripsi").value.trim(),
    };
    if (fotoB64) {
      payload.foto_base64 = fotoB64;
    }
  } else {
    payload = {
      action:         "submitHelpdesk",
      id_pelapor:     pegId,
      nama_pelapor:   peg ? peg.nama : "",
      lokasi_pelapor:  peg ? (peg.lokasiKerja || peg.bidang || "") : "",
      nama_barang:    $("f-aset").value.trim(),
      judul:          $("f-judul").value,
      deskripsi:      $("f-deskripsi").value,
      foto_base64:    fotoB64,
    };
  }

  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      await new Promise(r => setTimeout(r, 1200));
      if (editingHelpdeskId) {
        UI.showToast("Perubahan berhasil disimpan (mode demo).");
        window.location.href = "../index.html?actTab=helpdesk";
      } else {
        const demoId = "TKT-" + String(Math.floor(Math.random()*900)+100).padStart(4,"0");
        showSuccess(demoId);
      }
      return;
    }
    
    const data = await API.post(payload);
    if (data.success) {
      if (editingHelpdeskId) {
        UI.showToast("Perubahan berhasil disimpan!");
        window.location.href = "../index.html?actTab=helpdesk";
      } else {
        showSuccess(data.tiket_id);
      }
    } else {
      throw new Error(data.message || "Gagal mengirim.");
    }
  } catch (err) {
    UI.showToast("Gagal mengirim: " + err.message, true);
    btn.disabled = false;
    btn.innerHTML = editingHelpdeskId ? "<span>Simpan Perubahan</span>" : "<span>Kirim Laporan</span>";
  }
}

function showSuccess(id) {
  UI.showToast("Laporan berhasil dikirim! Tiket: " + id);
  setTimeout(() => {
    window.location.href = "../index.html?actTab=helpdesk";
  }, 1500);
}

function resetForm() {
  $("form-helpdesk").reset();
  $("form-helpdesk").style.display = "block";
  $("success-screen").style.display = "none";
  $("btn-submit").disabled = false;
  $("btn-submit").textContent = "Kirim Laporan";
  $("display-bidang").classList.remove("show");
  if ($("aset-chip")) $("aset-chip").classList.remove("show");
  $("f-pegawai-search").value = "";
  $("f-pegawai").value = "";
  removeFoto();
}

// ── Load Tiket ──────────────────────────────
async function loadTiket() {
  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      allTiket = [
        { id:"TKT-0002", tanggal:"02/06/2025 13:00", nama:"MADE SARI DEWI",    judul:"AC ruangan tidak dingin",   status:"OPEN" },
        { id:"TKT-0001", tanggal:"01/06/2025 09:30", nama:"NI PUTU ADELIA",    judul:"Laptop tidak bisa menyala", status:"SELESAI" },
      ];
    } else {
      const json = await API.get("getHelpdesk");
      if (json.success) allTiket = json.data;
    }
  } catch (e) {
    console.error("Error loading tickets:", e);
  }
}

function renderTiket(tiket) {
  const list = $("tiket-list");
  if (!list) return;
  if (!tiket.length) {
    list.innerHTML = '<div class="empty-state"><span style="display: flex; justify-content: center; margin-bottom: 12px; color: var(--muted);"><svg style="width: 48px; height: 48px; stroke-width: 1.5; stroke: currentColor; fill: none;" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><line x1="2" y1="17" x2="22" y2="17"/></svg></span><p>Belum ada tiket ditemukan.</p></div>';
    return;
  }
  const chipMap = {
    "OPEN":        "chip-open",
    "DALAM PROSES":"chip-proses",
    "SELESAI":     "chip-selesai",
    "DITOLAK":     "chip-ditolak",
  };
  list.innerHTML = tiket.map(t => `
    <div class="tiket-card">
      <div class="tiket-top">
        <span class="tiket-id">${t.id}</span>
        <span class="chip ${chipMap[t.status] || "chip-open"}">${t.status}</span>
      </div>
      <div class="tiket-judul">${t.judul}</div>
      <div class="tiket-meta">${t.nama} &nbsp;·&nbsp; ${t.tanggal}</div>
    </div>
  `).join("");
}

function filterTiket() {
  const qEl = $("search-tiket");
  if (!qEl) return;
  const q = qEl.value.toLowerCase();
  renderTiket(allTiket.filter(t =>
    t.nama.toLowerCase().includes(q) ||
    t.id.toLowerCase().includes(q) ||
    t.judul.toLowerCase().includes(q)
  ));
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

function formatDriveImgUrl(url) {
  if (!url) return "";
  const match = url.match(/id=([^&]+)/) || url.match(/\/file\/d\/([^\/]+)/) || url.match(/\/d\/([^\/]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

async function handleEditParam() {
  const editId = new URLSearchParams(window.location.search).get("editHelpdesk");
  if (!editId) return;
  
  editingHelpdeskId = editId;
  
  if (!allPegawai.length) {
    await loadPegawai();
  }
  await loadTiket();
  
  const item = allTiket.find(t => t.id === editId);
  if (!item) {
    UI.showToast(`Tiket helpdesk dengan ID "${editId}" tidak ditemukan.`, true);
    return;
  }
  
  const peg = allPegawai.find(p => p.nama === item.nama || p.id === item.idPelapor);
  if (peg) {
    $("f-pegawai-search").value = peg.nama;
    $("f-pegawai").value = peg.id;
    onPegawaiChange();
  } else {
    $("f-pegawai-search").value = item.nama;
    $("f-pegawai").value = item.idPelapor || "";
  }
  
  $("f-judul").value = item.judul || "";
  $("f-aset").value = item.namaBarang || "";
  $("f-deskripsi").value = item.deskripsi || "";
  
  if (item.fotoUrl && item.fotoUrl.trim() !== "" && item.fotoUrl !== "undefined" && item.fotoUrl !== "null") {
    const preview = $("foto-preview");
    const img = $("foto-img");
    img.src = formatDriveImgUrl(item.fotoUrl);
    preview.style.display = "block";
    $("foto-zone").style.display = "none";
    hasFoto = true;
  }
  
  const btn = $("btn-submit");
  if (btn) btn.textContent = "Simpan Perubahan";
  
  const heroEyebrow = document.querySelector(".bbm-eyebrow");
  const heroTitle = document.querySelector(".bbm-title");
  const heroSub = document.querySelector(".bbm-sub");
  if (heroEyebrow) heroEyebrow.textContent = "HELPDESK SARPRAS (EDIT)";
  if (heroTitle) heroTitle.textContent = "Ubah Laporan Kerusakan";
  if (heroSub) heroSub.textContent = "Perbarui formulir di bawah ini untuk menyimpan perubahan pada laporan sarpras Anda.";
  document.title = "Edit Laporan Helpdesk - ARUNIWAVES";
}

// ── Initializer ──
(async function initHelpdesk() {
  UI.renderNavigation("helpdesk");
  
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab");
  if (tabParam === "status") {
    switchTab("status");
  } else if (tabParam === "form") {
    switchTab("form");
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

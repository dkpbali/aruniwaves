/* ===================================================================
   ARUNIWAVES - BBM Module Specific JS
   =================================================================== */

// ── State ──────────────────────────────────────
let allBbm = [];
let editingBbmId = null;
let currentUser = null;
let allPegawai = [];

let filesData = {
  geotag:  { base64: null, name: "" },
  surat:   { base64: null, name: "" },
  laporan: { base64: null, name: "" },
  nota:    { base64: null, name: "" }
};

let repFilesData = {
  geotag:  { base64: null, name: "" },
  surat:   { base64: null, name: "" },
  laporan: { base64: null, name: "" },
  nota:    { base64: null, name: "" }
};

// Helper shorthand selector
const $ = id => document.getElementById(id);

// ── Pegawai Autocomplete ───────────────────────
async function loadPegawai() {
  try {
    const json = await API.get("getPegawai");
    if (json.success) allPegawai = json.data;
    
    initAutocomplete("f-pegawai-search", "f-pegawai-list", "f-pegawai", allPegawai, id => {
      onPegawaiChange(id);
    });
  } catch (e) {
    console.warn("[BBM] loadPegawai failed, loading fallback data.");
    allPegawai = [
      { id:"P0001", nama:"NI PUTU ADELIA",        bidang:"SEKRETARIAT", subBidang:"SUNPROG" },
      { id:"P0002", nama:"PANDE GDE KRISHNADANA",  bidang:"SEKRETARIAT", subBidang:"SUNPROG" },
      { id:"P0005", nama:"DEWA YOJANA",             bidang:"BIDANG P2HP", subBidang:"" },
      { id:"P0008", nama:"WAYAN SAPUTRA",           bidang:"BIDANG PERIKANAN", subBidang:"" },
      { id:"P0012", nama:"GEDE RYAN HADINATA",      bidang:"BIDANG KELAUTAN", subBidang:"" },
    ];
    initAutocomplete("f-pegawai-search", "f-pegawai-list", "f-pegawai", allPegawai, id => {
      onPegawaiChange(id);
    });
  }
}

function onPegawaiChange(id) {
  const peg = allPegawai.find(p => p.id === id);
  if (peg) {
    $("f-bidang-display").value = peg.bidang + (peg.subBidang ? ` - ${peg.subBidang}` : "");
  } else {
    $("f-bidang-display").value = "";
  }
}

function initAutocomplete(inputId, listId, hiddenId, dataList, onSelectCallback) {
  const searchInput = $(inputId);
  const dropdownList = $(listId);
  const hiddenInput = $(hiddenId);
  if (!searchInput || !dropdownList) return;

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
      dropdownList.innerHTML = '<div style="padding:10px 14px;color:var(--muted);font-size:12px;">Tidak ditemukan</div>';
      dropdownList.style.display = "block";
      return;
    }

    dropdownList.innerHTML = filtered.map(item => `
      <div class="autocomplete-item" data-id="${item.id}" data-nama="${item.nama}">
        <div style="font-weight:600;font-size:12px;">${item.nama}</div>
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

// ── File Handling ──────────────────────────────
function triggerUpload(inputId) {
  $(inputId).click();
}

function handleFileSelect(event, key, type, maxSizeMb) {
  const file = event.target.files[0];
  if (!file) return;

  if (type === 'image' && !file.type.startsWith('image/')) {
    UI.showToast("File harus berupa gambar (JPG/PNG)", "error");
    event.target.value = "";
    return;
  }
  if (type === 'pdf' && file.type !== 'application/pdf') {
    UI.showToast("File harus berupa PDF", "error");
    event.target.value = "";
    return;
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    UI.showToast(`Ukuran file maksimal ${maxSizeMb}MB`, "error");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    filesData[key].base64 = e.target.result;
    filesData[key].name = file.name;

    const previewEl = $(`prev-${key}`);
    const nameEl = $(`name-${key}`);
    nameEl.textContent = file.name;
    
    if (type === 'image') {
      $(`thumb-${key}`).src = e.target.result;
    }
    previewEl.style.display = "flex";
  };
  reader.readAsDataURL(file);
}

function clearFile(key) {
  filesData[key].base64 = null;
  filesData[key].name = "";
  $(`f-${key}`).value = "";
  $(`prev-${key}`).style.display = "none";
}

// ── Submit Request ──────────────────────────────
async function submitFormBbm(event) {
  event.preventDefault();

  const idPegawai = $("f-pegawai").value;
  const namaPenerima = $("f-pegawai-search").value;
  const isStok = $("f-stok-cadangan").checked;

  const tglKegiatan = isStok ? new Date().toISOString().split('T')[0] : $("f-tanggal").value;
  const lokasiTujuan = isStok ? "STOK INTERNAL" : $("f-lokasi").value;
  const kecamatan = isStok ? "-" : $("f-kecamatan").value.trim();
  
  const jenisKendaraan = isStok ? "dinas" : $("f-jenis-kendaraan").value;
  let nopol = isStok ? "STOK" : $("f-nopol").value;
  let pribadi = "-";
  if (jenisKendaraan === "pribadi") {
    pribadi = nopol.replace("Pribadi - ", "");
    nopol = "-";
  }

  const deskripsi = isStok ? "Pengambilan stok voucher untuk tugas mendadak" : $("f-deskripsi").value.trim();
  const jenisVoucher = $("f-jenis-voucher").value;
  const jumlahVoucher = parseInt($("f-jumlah").value) || 0;

  if (!idPegawai) {
    UI.showToast("Pilih nama pegawai dari daftar autocomplete", "error");
    $("f-pegawai-search").focus();
    return;
  }
  if (!jenisVoucher) {
    UI.showToast("Pilih jenis voucher terlebih dahulu", "error");
    $("f-jenis-voucher").focus();
    return;
  }
  if (jumlahVoucher <= 0) {
    UI.showToast("Jumlah voucher harus minimal 1 pcs", "error");
    $("f-jumlah").focus();
    return;
  }

  const submitBtn = $("btn-submit");
  const oldText = submitBtn ? submitBtn.textContent : "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spin"></span> <span>Mengirim Permohonan...</span>`;
  }

  const peg = allPegawai.find(p => p.id === idPegawai);
  const bidangVal = peg ? (peg.bidang + (peg.subBidang ? ` - ${peg.subBidang}` : "")) : "";

  const payload = {
    id_bbm: editingBbmId || "",
    nama_penerima: namaPenerima,
    id_pegawai: idPegawai,
    bidang: bidangVal,
    jenis_voucher: jenisVoucher,
    jumlah: jumlahVoucher,
    tgl_kegiatan: tglKegiatan,
    lokasi_tujuan: lokasiTujuan,
    kecamatan: kecamatan,
    nopol_kendaraan: nopol,
    pribadi: pribadi,
    deskripsi_kegiatan: deskripsi
  };

  if (currentUser) {
    payload.id_token = currentUser.id_token;
  }

  try {
    const action = editingBbmId ? "updateBbm" : "submitBbm";
    const json = await API.post(action, payload);
    
    if (json.success) {
      if (editingBbmId) {
        UI.showToast("Permohonan BBM berhasil diperbarui!");
      } else {
        alert("Permohonan berhasil dikirim. Silakan ambil voucher fisik Anda di Gedung Sekretariat.");
      }
      resetForm();
      editingBbmId = null;
      window.location.href = "../index.html?actTab=bbm";
    }
  } catch (err) {
    console.error("submitFormBbm failed, running demo fallback:", err);
    // Demo fallback logic
    if (editingBbmId) {
      UI.showToast(`Permohonan BBM ${editingBbmId} diperbarui (mode demo fallback).`);
    } else {
      alert("Permohonan dikirim (mode demo). Silakan ambil voucher fisik Anda.");
    }
    resetForm();
    editingBbmId = null;
    window.location.href = "../index.html?actTab=bbm";
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Kirim Permohonan</span>`;
    }
  }
}

function resetForm() {
  $("bbm-form").reset();
  $("f-pegawai").value = "";
  $("f-bidang-display").value = "";
  $("f-stok-cadangan").checked = false;
  toggleStokCadangan();
  editingBbmId = null;
  $("btn-submit").querySelector("span").textContent = "Kirim Permohonan";
}

// ── Tab Controls ───────────────────────────────
function switchTab(tab) {
  ["form"].forEach(t => {
    const sec = $(`section-${t}`);
    const tabEl = $(`tab-${t}`);
    if (sec) sec.classList.toggle("active", t === tab);
    if (tabEl) tabEl.classList.toggle("active", t === tab);
  });
}

// ── Load BBM Status ────────────────────────────
async function loadBbmStatus() {
  const list = $("bbm-status-list");
  if (list) {
    list.innerHTML = Array(3).fill().map(() => '<div class="shimmer-card" style="height:90px; margin-bottom:10px;"></div>').join('');
  }

  try {
    const json = await API.get(`getBbm&_t=${Date.now()}`);
    if (json.success) {
      allBbm = json.data;
    }
    if (list) renderBbmStatus(allBbm);
  } catch (err) {
    console.warn("loadBbmStatus failed, fallback to mock data");
    if (allBbm.length === 0) {
      allBbm = [
        {
          id_bbm: "BBM-00001",
          tgl_submit: "19/06/2026 09:12",
          nama_penerima: "PANDE GDE KRISHNADANA",
          id_pegawai: "P0002",
          bidang: "SEKRETARIAT - SUNPROG",
          jenis_voucher: "5 liter",
          jumlah: 2,
          jumlah_digunakan: 2,
          jumlah_dikembalikan: 0,
          lokasi_tujuan: "Dinas Kelautan Cabang Buleleng",
          kecamatan: "Buleleng",
          tgl_kegiatan: "2026-06-20",
          deskripsi_kegiatan: "Koordinasi program kerja triwulan II kelautan cabang buleleng.",
          nopol_kendaraan: "DK 1702 B",
          status: "DISETUJUI"
        },
        {
          id_bbm: "BBM-00002",
          tgl_submit: "18/06/2026 14:30",
          nama_penerima: "DEWA YOJANA",
          id_pegawai: "P0005",
          bidang: "BIDANG P2HP",
          jenis_voucher: "10 liter",
          jumlah: 4,
          jumlah_digunakan: "",
          jumlah_dikembalikan: "",
          lokasi_tujuan: "Pasar Ikan Kedonganan Badung",
          kecamatan: "Kuta Selatan",
          tgl_kegiatan: "2026-06-19",
          deskripsi_kegiatan: "Monitoring mutu hasil perikanan tangkap dan kestabilan harga pasar.",
          nopol_kendaraan: "DK 420 I",
          status: "DISETUJUI"
        }
      ];
    }
    if (list) renderBbmStatus(allBbm);
  }
}

function renderBbmStatus(data) {
  const list = $("bbm-status-list");
  if (!list) return;

  const activeHistory = data.filter(b => {
    const isApproved = (b.status || "").toUpperCase().trim() === "DISETUJUI";
    const qty = parseFloat(b.jumlah) || 0;
    const used = parseFloat(b.jumlah_digunakan) || 0;
    const returned = parseFloat(b.jumlah_dikembalikan) || 0;
    const alreadyReported = isApproved && ((used + returned) >= qty);
    return !alreadyReported;
  });

  if (!activeHistory.length) {
    list.innerHTML = '<div class="empty-state">Belum ada permohonan BBM ditemukan.</div>';
    return;
  }

  const chipMap = {
    "PENDING": "chip-pending",
    "DISETUJUI": "chip-disetujui"
  };

  list.innerHTML = activeHistory.map(b => {
    const statusVal = (b.status || "PENDING").toUpperCase().trim();
    const isApproved = statusVal === "DISETUJUI";
    const badgeClass = chipMap[statusVal] || "chip-pending";
    const cleanDest = (b.lokasi_tujuan || "").replace("Dinas Kelautan ", "");

    let actionButtonsHtml = "";
    if (!isApproved) {
      actionButtonsHtml = `<div class="bbm-status-actions">
        <button type="button" class="btn-action-small btn-action-edit" onclick="editBbm('${b.id_bbm}')">Ubah</button>
        <button type="button" class="btn-action-small btn-action-delete" onclick="deleteBbm('${b.id_bbm}')">Hapus</button>
      </div>`;
    } else {
      actionButtonsHtml = `<div class="bbm-status-actions" style="font-size:11px; color:var(--muted); font-style:italic; font-family:var(--sans);">
        ✓ Terkunci (Sudah disetujui Admin)
      </div>`;
    }

    const descHtml = b.deskripsi_kegiatan ? `<div><strong>Kegiatan:</strong> ${b.deskripsi_kegiatan}</div>` : "";
    const voucherHtml = b.jenis_voucher ? `<div><strong>Acc Kuota:</strong> ${b.jenis_voucher} (x${b.jumlah || 1})</div>` : "";

    let laporDetailsHtml = "";
    if (b.jumlah_digunakan !== undefined && b.jumlah_digunakan !== "") {
      const used = parseFloat(b.jumlah_digunakan) || 0;
      const returned = parseFloat(b.jumlah_dikembalikan) || 0;
      laporDetailsHtml = `<div><strong>Laporan Penggunaan:</strong> Terpakai ${used} pcs ${returned > 0 ? `, Dikembalikan ${returned} pcs` : ""}</div>`;
    }

    const isPersonal = b.pribadi && b.pribadi !== "-" && b.pribadi !== "";
    const vehDisplay = isPersonal ? `Pribadi (${b.pribadi})` : `Dinas (${b.nopol_kendaraan || "-"})`;

    return `
      <div class="bbm-status-card">
        <div class="bbm-status-top">
          <span class="bbm-status-id">${b.id_bbm}</span>
          <span class="chip ${badgeClass}">${statusVal}</span>
        </div>
        <div class="bbm-status-penerima">${b.nama_penerima}</div>
        <div class="bbm-status-details" style="font-family:var(--sans);">
          <div><strong>Tanggal:</strong> ${b.tgl_kegiatan || b.tgl_submit || "-"}</div>
          <div><strong>Kendaraan:</strong> ${vehDisplay}</div>
          <div><strong>Tujuan:</strong> ${cleanDest} (${b.kecamatan || "-"})</div>
          ${descHtml}
          ${voucherHtml}
          ${laporDetailsHtml}
        </div>
        ${actionButtonsHtml}
      </div>
    `;
  }).join("");
}

// ── Custom Form Controls ───────────────────────
function toggleStokCadangan() {
  const isChecked = $("f-stok-cadangan").checked;
  const container = $("trip-fields-container");
  if (!container) return;
  
  if (isChecked) {
    container.style.display = "none";
    $("f-tanggal").required = false;
    $("f-lokasi").required = false;
    $("f-kecamatan").required = false;
    $("f-jenis-kendaraan").required = false;
    $("f-nopol").required = false;
    $("f-deskripsi").required = false;
  } else {
    container.style.display = "";
    $("f-tanggal").required = true;
    $("f-lokasi").required = true;
    $("f-kecamatan").required = true;
    $("f-jenis-kendaraan").required = true;
    $("f-nopol").required = true;
    $("f-deskripsi").required = true;
  }
}

function onJenisKendaraanChange() {
  const type = $("f-jenis-kendaraan").value;
  const nopolSelect = $("f-nopol");
  const lblNopol = $("lbl-nopol");
  if (!nopolSelect) return;
  
  if (type === "pribadi") {
    lblNopol.innerHTML = "Tipe Kendaraan Pribadi<span>*</span>";
    nopolSelect.innerHTML = `
      <option value="" disabled selected>-- Pilih Tipe Kendaraan --</option>
      <option value="Pribadi - Motor">Motor</option>
      <option value="Pribadi - Mobil">Mobil</option>
    `;
  } else {
    lblNopol.innerHTML = "Nomor Polisi Kendaraan<span>*</span>";
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

// ── Laporan List ───────────────────────────────
async function loadBbmLaporan() {
  const container = $("bbm-laporan-list");
  if (!container) return;
  container.innerHTML = Array(3).fill().map(() => '<div class="shimmer-card" style="height:80px; margin-bottom:10px;"></div>').join('');

  try {
    await loadBbmStatus();
    
    const activeReports = allBbm.filter(b => {
      const isApproved = b.status === "DISETUJUI";
      const totalRequested = parseFloat(b.jumlah) || 0;
      const totalUsed = parseFloat(b.jumlah_digunakan) || 0;
      const totalReturned = parseFloat(b.jumlah_dikembalikan) || 0;
      return isApproved && (totalUsed + totalReturned) < totalRequested;
    });

    if (activeReports.length === 0) {
      container.innerHTML = '<div class="empty-state">Tidak ada permohonan BBM yang memerlukan pelaporan penggunaan saat ini.</div>';
      return;
    }

    const groups = {};
    activeReports.forEach(b => {
      const bidang = b.bidang ? b.bidang.split(" - ")[0].toUpperCase().trim() : "LAINNYA";
      if (!groups[bidang]) groups[bidang] = [];
      groups[bidang].push(b);
    });

    container.innerHTML = Object.entries(groups).map(([bidang, list]) => {
      const listHtml = list.map(b => {
        const isStok = (b.lokasi_tujuan === "STOK INTERNAL");
        const detailsLabel = isStok 
          ? `<span style="color:var(--yellow);font-weight:700;">[STOK CADANGAN]</span>`
          : `Tujuan: <strong>${b.lokasi_tujuan}</strong> (${b.kecamatan})`;
        
        const isPersonalReport = b.pribadi && b.pribadi !== "-" && b.pribadi !== "";
        const vehDisplayReport = isPersonalReport ? `Pribadi (${b.pribadi})` : b.nopol_kendaraan;

        return `
          <div style="background:var(--ink3);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;text-align:left;">
            <div>
              <div style="font-weight:700;font-size:12px;color:var(--text);">${b.nama_penerima}</div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px;">ID: <strong>${b.id_bbm}</strong> &middot; Kendaraan: <strong>${vehDisplayReport}</strong></div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px;">${detailsLabel}</div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px;">Kuota: <strong>${b.jenis_voucher} (x${b.jumlah} pcs)</strong></div>
            </div>
            <div>
              <button class="btn btn-primary" onclick="openReportModal('${b.id_bbm}')" style="padding:6px 12px;font-size:11px;font-weight:700;">Lapor Penggunaan</button>
            </div>
          </div>
        `;
      }).join("");

      return `
        <div style="margin-bottom:16px;border:1px solid var(--border);border-radius:12px;overflow:hidden;">
          <div style="background:rgba(0, 85, 170, 0.05);padding:10px 14px;font-weight:700;font-family:var(--title-sans);font-size:12px;color:var(--sea);border-bottom:1px solid var(--border);text-align:left;">${bidang}</div>
          <div style="padding:12px 12px 4px;">
            ${listHtml}
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("loadBbmLaporan error:", err);
    container.innerHTML = '<div class="empty-state" style="color:var(--red);">Gagal memuat daftar permohonan.</div>';
  }
}

// ── Report Modal Controls ──────────────────────
function handleRepFileSelect(event, key, type, maxSizeMb) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (type === 'image' && !file.type.startsWith('image/')) {
    UI.showToast("File harus berupa gambar", "error");
    event.target.value = "";
    return;
  }
  if (type === 'pdf' && file.type !== 'application/pdf') {
    UI.showToast("File harus berupa PDF", "error");
    event.target.value = "";
    return;
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    UI.showToast(`Ukuran file maksimal adalah ${maxSizeMb}MB`, "error");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    repFilesData[key].base64 = e.target.result;
    repFilesData[key].name = file.name;
    
    $(`prev-rep-${key}`).style.display = "flex";
    if (type === 'image') {
      $(`thumb-rep-${key}`).src = e.target.result;
    } else {
      const nameEl = $(`name-rep-${key}`);
      if (nameEl) nameEl.textContent = file.name;
    }
  };
  reader.readAsDataURL(file);
}

function clearRepFile(key) {
  repFilesData[key].base64 = null;
  repFilesData[key].name = "";
  $(`f-rep-${key}`).value = "";
  $(`prev-rep-${key}`).style.display = "none";
  const thumb = $(`thumb-rep-${key}`);
  if (thumb) thumb.src = "";
}

function openReportModal(id) {
  const b = allBbm.find(x => x.id_bbm === id);
  if (!b) return;

  $("rep-id-bbm").value = b.id_bbm;
  $("rep-max-vouchers").value = b.jumlah;
  $("rep-jumlah-used").max = b.jumlah;
  $("rep-jumlah-used").value = b.jumlah;
  
  const isStok = (b.lokasi_tujuan === "STOK INTERNAL");
  $("report-summary-info").innerHTML = `
    <div>Pemohon: <strong>${b.nama_penerima}</strong> (${b.bidang})</div>
    <div>ID BBM: <strong>${b.id_bbm}</strong></div>
    <div>Total Voucher Diambil: <strong style="color:var(--sea);font-size:13px;">${b.jumlah} pcs</strong> (${b.jenis_voucher})</div>
    ${isStok ? '<div style="color:var(--yellow);font-weight:700;">Tipe: Pengambilan Stok Cadangan (Tugas Mendadak)</div>' : `<div>Tujuan: <strong>${b.lokasi_tujuan}</strong> (${b.kecamatan})</div>`}
  `;

  const stokFields = $("stok-adjust-fields");
  if (isStok) {
    stokFields.style.display = "flex";
    $("rep-tanggal").required = true;
    $("rep-lokasi").required = true;
    $("rep-kecamatan").required = true;
    $("rep-jenis-kendaraan").required = true;
    $("rep-nopol").required = true;
    $("rep-deskripsi").required = true;
    
    $("rep-tanggal").value = "";
    $("rep-lokasi").value = "";
    $("rep-kecamatan").value = "";
    $("rep-jenis-kendaraan").value = "dinas";
    onRepJenisKendaraanChange();
    $("rep-nopol").value = "";
    $("rep-deskripsi").value = "";
  } else {
    stokFields.style.display = "none";
    $("rep-tanggal").required = false;
    $("rep-lokasi").required = false;
    $("rep-kecamatan").required = false;
    $("rep-jenis-kendaraan").required = false;
    $("rep-nopol").required = false;
    $("rep-deskripsi").required = false;
  }

  clearRepFile('geotag');
  clearRepFile('surat');
  clearRepFile('laporan');
  clearRepFile('nota');
  
  updateReturnedInfo(b.jumlah, b.jumlah);
  $("report-modal").style.display = "flex";
}

function closeReportModal() {
  $("report-modal").style.display = "none";
}

function validateReportedVouchers(input) {
  const maxV = parseInt($("rep-max-vouchers").value) || 0;
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
  const warningEl = $("rep-returned-warning");
  if (!warningEl) return;
  
  if (val > 0 && val < maxV) {
    const returnedQty = maxV - val;
    warningEl.innerHTML = `⚠️ <strong>Pemberitahuan Pengembalian Voucher:</strong><br/>Anda melaporkan penggunaan <strong>${val} pcs</strong> voucher. Sisa <strong>${returnedQty} pcs</strong> voucher yang tidak digunakan wajib dikembalikan secara fisik ke Admin.`;
    warningEl.style.display = "block";
  } else {
    warningEl.style.display = "none";
  }
}

function onRepJenisKendaraanChange() {
  const type = $("rep-jenis-kendaraan").value;
  const nopolSelect = $("rep-nopol");
  const lblNopol = $("lbl-rep-nopol");
  if (!nopolSelect) return;
  
  if (type === "pribadi") {
    lblNopol.innerHTML = "Tipe Kendaraan Pribadi<span>*</span>";
    nopolSelect.innerHTML = `
      <option value="" disabled selected>-- Pilih Tipe Kendaraan --</option>
      <option value="Pribadi - Motor">Motor</option>
      <option value="Pribadi - Mobil">Mobil</option>
    `;
  } else {
    lblNopol.innerHTML = "Nomor Polisi Kendaraan<span>*</span>";
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

async function submitBbmReport(e) {
  e.preventDefault();
  
  const idBbm = $("rep-id-bbm").value;
  const maxV = parseInt($("rep-max-vouchers").value) || 0;
  const usedV = parseInt($("rep-jumlah-used").value) || 0;
  
  if (usedV <= 0 || usedV > maxV) {
    UI.showToast(`Jumlah voucher terpakai harus di antara 1 dan ${maxV} pcs`, "error");
    return;
  }
  if (!repFilesData.geotag.base64) {
    UI.showToast("Wajib mengunggah Foto Geotag!", "error");
    return;
  }
  if (!repFilesData.surat.base64) {
    UI.showToast("Wajib mengunggah Surat Tugas!", "error");
    return;
  }

  const submitBtn = $("btn-submit-report");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim Laporan...";
  }

  const payload = {
    id_bbm: idBbm,
    jumlah_digunakan: usedV,
    foto_geotag_base64: repFilesData.geotag.base64,
    surat_base64: repFilesData.surat.base64,
    dokumen_laporan_base64: repFilesData.laporan.base64 || "",
    nota_bensin_base64: repFilesData.nota.base64 || ""
  };

  if ($("stok-adjust-fields").style.display === "flex") {
    payload.lokasi_tujuan = $("rep-lokasi").value;
    payload.kecamatan = $("rep-kecamatan").value.trim();
    payload.tgl_kegiatan = $("rep-tanggal").value;
    payload.deskripsi_kegiatan = $("rep-deskripsi").value.trim();
    
    const repJenisKendaraan = $("rep-jenis-kendaraan").value;
    let repNopol = $("rep-nopol").value;
    let repPribadi = "-";
    if (repJenisKendaraan === "pribadi") {
      repPribadi = repNopol.replace("Pribadi - ", "");
      repNopol = "-";
    }
    payload.nopol_kendaraan = repNopol;
    payload.pribadi = repPribadi;
  }

  try {
    const json = await API.post("submitBbmReport", payload);
    if (json.success) {
      UI.showToast("Laporan pertanggungjawaban BBM berhasil disimpan!");
      closeReportModal();
      allBbm = [];
      await loadBbmStatus();
      loadBbmLaporan();
    }
  } catch (err) {
    console.error("submitBbmReport failed, running mock demo fallback:", err);
    const idx = allBbm.findIndex(x => x.id_bbm === idBbm);
    if (idx >= 0) {
      allBbm[idx].jumlah_digunakan = usedV;
      allBbm[idx].foto_geotag = "mock-geotag-report";
      allBbm[idx].surat = "mock-surat-report";
      if (payload.lokasi_tujuan) {
        allBbm[idx].lokasi_tujuan = payload.lokasi_tujuan;
        allBbm[idx].kecamatan = payload.kecamatan;
        allBbm[idx].tgl_kegiatan = payload.tgl_kegiatan;
        allBbm[idx].deskripsi_kegiatan = payload.deskripsi_kegiatan;
        allBbm[idx].nopol_kendaraan = payload.nopol_kendaraan;
      }
    }
    UI.showToast("Sukses melaporkan penggunaan BBM (Mock Fallback).");
    closeReportModal();
    loadBbmLaporan();
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Kirim Laporan Penggunaan";
    }
  }
}

function filterBbmStatus() {
  const q = $("search-bbm").value.toLowerCase().trim();
  if (!q) {
    renderBbmStatus(allBbm);
    return;
  }
  const filtered = allBbm.filter(b => 
    (b.nama_penerima || "").toLowerCase().includes(q) ||
    (b.id_bbm || "").toLowerCase().includes(q) ||
    (b.nopol_kendaraan || "").toLowerCase().includes(q) ||
    (b.lokasi_tujuan || "").toLowerCase().includes(q)
  );
  renderBbmStatus(filtered);
}

// ── CRUD Actions ───────────────────────────────
function editBbm(id, skipConfirm) {
  const b = allBbm.find(x => x.id_bbm && x.id_bbm.toString().trim().toUpperCase() === id.toString().trim().toUpperCase());
  if (!b) {
    alert(`Permohonan BBM dengan ID "${id}" tidak ditemukan di database.`);
    return;
  }

  if (!skipConfirm && !confirm("Apakah Anda yakin ingin mengedit permohonan BBM ini?")) return;

  editingBbmId = b.id_bbm;
  switchTab('form');

  $("f-pegawai-search").value = b.nama_penerima || "";
  $("f-pegawai").value = b.id_pegawai || "";
  $("f-tanggal").value = b.tgl_kegiatan || "";
  $("f-lokasi").value = b.lokasi_tujuan || "";
  $("f-kecamatan").value = b.kecamatan || "";
  
  const isPersonal = b.pribadi && b.pribadi !== "-" && b.pribadi !== "";
  if (isPersonal) {
    $("f-jenis-kendaraan").value = "pribadi";
    onJenisKendaraanChange();
    $("f-nopol").value = "Pribadi - " + b.pribadi;
  } else {
    $("f-jenis-kendaraan").value = "dinas";
    onJenisKendaraanChange();
    $("f-nopol").value = b.nopol_kendaraan || "";
  }

  $("f-deskripsi").value = b.deskripsi_kegiatan || "";
  onPegawaiChange(b.id_pegawai);

  if (b.foto_geotag) {
    $("prev-geotag").style.display = "flex";
    $("name-geotag").innerHTML = `<a href="${b.foto_geotag}" target="_blank" style="color:var(--wave);text-decoration:none;font-weight:700;">📄 Lihat Foto Geotag</a>`;
    filesData.geotag.base64 = "EXISTING";
  }
  if (b.surat) {
    $("prev-surat").style.display = "flex";
    $("name-surat").innerHTML = `<a href="${b.surat}" target="_blank" style="color:var(--wave);text-decoration:none;font-weight:700;">📄 Lihat Surat Tugas</a>`;
    filesData.surat.base64 = "EXISTING";
  }
  if (b.dokumen_laporan) {
    $("prev-laporan").style.display = "flex";
    $("name-laporan").innerHTML = `<a href="${b.dokumen_laporan}" target="_blank" style="color:var(--wave);text-decoration:none;font-weight:700;">📄 Lihat Laporan</a>`;
    filesData.laporan.base64 = "EXISTING";
  }
  if (b.nota_bensin) {
    $("prev-nota").style.display = "flex";
    $("name-nota").innerHTML = `<a href="${b.nota_bensin}" target="_blank" style="color:var(--wave);text-decoration:none;font-weight:700;">📄 Lihat Resi</a>`;
    filesData.nota.base64 = "EXISTING";
  }

  $("btn-submit").querySelector("span").textContent = "Perbarui Permohonan";
  
  const heroEyebrow = document.querySelector(".bbm-eyebrow");
  const heroTitle = document.querySelector(".bbm-title");
  const heroSub = document.querySelector(".bbm-sub");
  if (heroEyebrow) heroEyebrow.textContent = "EDIT PERMOHONAN BBM";
  if (heroTitle) heroTitle.textContent = "Ubah Data BBM";
  if (heroSub) heroSub.textContent = "Perbarui formulir di bawah ini untuk menyimpan perubahan data permohonan bensin/voucher BBM Anda.";
  document.title = "Edit Laporan BBM - ARUNIWAVES";

  UI.showToast("Mengedit permohonan " + id + ". Ubah data lalu simpan.");
}

async function deleteBbm(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus permohonan BBM ini?")) return;

  try {
    const json = await API.post("deleteBbm", { id_bbm: id });
    if (json.success) {
      alert("Permohonan berhasil dihapus.");
      window.location.reload();
    }
  } catch (err) {
    console.warn("deleteBbm failed, applying local mock delete");
    allBbm = allBbm.filter(x => x.id_bbm !== id);
    UI.showToast("Permohonan berhasil dihapus (mode demo).");
    renderBbmStatus(allBbm);
    loadBbmLaporan();
  }
}

// ── Initialization ────────────────────────────
(async function initBbm() {
  UI.renderNavigation("bbm");

  const cachedUser = Auth.getUser();
  if (cachedUser) {
    currentUser = cachedUser;
  }

  // Pre-load parameters
  const tabParam = Utils.getQueryParam("tab");
  if (tabParam === "form") {
    switchTab("form");
  }

  await loadPegawai();

  // Load status
  await loadBbmStatus();
  loadBbmLaporan();

  const editId = Utils.getQueryParam("editBbm");
  if (editId) {
    setTimeout(() => {
      editBbm(editId, true);
    }, 200);
  }

  // Drag & drop zones implementation
  ['geotag', 'surat', 'laporan', 'nota'].forEach(key => {
    const card = $(`zone-${key}`);
    if (!card) return;
    
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      card.classList.add('drag');
    });
    
    card.addEventListener('dragleave', () => {
      card.classList.remove('drag');
    });
    
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag');
      
      const file = e.dataTransfer.files[0];
      if (!file) return;
      
      const input = $(`f-${key}`);
      const isImage = key === 'geotag' || key === 'nota';
      const maxSize = key === 'laporan' ? 10 : 3;
      
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      
      handleFileSelect({ target: input }, key, isImage ? 'image' : 'pdf', maxSize);
    });
  });
})();

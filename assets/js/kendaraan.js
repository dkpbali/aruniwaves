/* ===================================================================
   ARUNIWAVES - Vehicle Booking Module Specific JS
   =================================================================== */

let allPegawai = [];
let allVehicles = [];
let selectedRadioVal = "Dinas";

let canvas, ctx;
let isDrawing = false;
let lastX = 0, lastY = 0;
let hasUserSigned = false;

// Helper shorthand selector
const $ = id => document.getElementById(id);

// Fallback mock vehicles
const MOCK_VEHICLES = [
  { id: "KND0001", merk: "Toyota Avanza", no_polisi: "DK 1001 AB", jenis: "Mobil" },
  { id: "KND0002", merk: "Mitsubishi Triton", no_polisi: "DK 2002 CD", jenis: "Mobil" },
  { id: "KND0003", merk: "Honda Vario", no_polisi: "DK 3003 EF", jenis: "Motor" }
];

function selectRadio(val) {
  selectedRadioVal = val;
  document.querySelectorAll(".radio-card").forEach(c => c.classList.remove("selected"));
  if (val === "Dinas") {
    const rc = $("rc-dinas");
    const rd = $("f-jenis-dinas");
    if (rc) rc.classList.add("selected");
    if (rd) rd.checked = true;
  } else {
    const rc = $("rc-pribadi");
    const rp = $("f-jenis-pribadi");
    if (rc) rc.classList.add("selected");
    if (rp) rp.checked = true;
  }
}

// ── Load Pegawai ──────────────────────────────
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
      if (json.success) allPegawai = json.data || [];
    }
    
    initAutocomplete(
      "f-pegawai-search",
      "f-pegawai-list",
      "f-pegawai",
      allPegawai,
      onPegawaiSelect
    );
  } catch (err) {
    console.error("Gagal memuat data pegawai:", err);
  }
}

function onPegawaiSelect(id) {
  const valBidang = $("val-bidang");
  const valJabatan = $("val-jabatan");
  const fJabatan = $("f-jabatan");
  
  if (!id) {
    if (valBidang) valBidang.textContent = "-";
    if (valJabatan) valJabatan.textContent = "-";
    if (fJabatan) fJabatan.value = "";
    return;
  }
  const peg = allPegawai.find(p => p.id === id);
  if (peg) {
    if (valBidang) valBidang.textContent = peg.bidang || "SEKRETARIAT";
    if (valJabatan) valJabatan.textContent = peg.jabatan || "Staf";
    if (fJabatan) fJabatan.value = peg.jabatan || "Staf";
  }
}

// ── Load Vehicles ─────────────────────────────
async function loadVehicles() {
  const select = $("f-kendaraan");
  if (!select) return;
  
  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (hasScriptUrl) {
      const json = await API.get("getSecretariatVehicles");
      if (json.success && json.data && json.data.length > 0) {
        allVehicles = json.data;
      } else {
        console.warn("Menggunakan fallback master kendaraan...");
        allVehicles = MOCK_VEHICLES;
      }
    } else {
      allVehicles = MOCK_VEHICLES;
    }
  } catch (err) {
    console.error("Error loading vehicles, using fallback:", err);
    allVehicles = MOCK_VEHICLES;
  }
  
  select.innerHTML = '<option value="">- Pilih Kendaraan -</option>' + 
    allVehicles.map(v => `<option value="${v.id}">${v.merk} (${v.no_polisi}) [${v.jenis}]</option>`).join("");
}

// ── Signature Pad Logic ────────────────────────
function initSignature() {
  canvas = $("ttd-canvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  
  ctx.strokeStyle = "#001B44";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  
  // Mouse events
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);
  
  // Touch events
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", stopDrawing, { passive: false });
}

function resizeCanvas() {
  if (!canvas) return;
  const container = canvas.parentElement;
  const oldData = canvas.toDataURL();
  canvas.width = container.clientWidth;
  canvas.height = 160;
  
  if (ctx) {
    ctx.strokeStyle = "#001B44";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }
  
  const img = new Image();
  img.onload = () => {
    if (ctx) ctx.drawImage(img, 0, 0);
  };
  img.src = oldData;
}

function startDrawing(e) {
  if (!canvas) return;
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
}

function draw(e) {
  if (!isDrawing || !canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  
  lastX = x;
  lastY = y;
  hasUserSigned = true;
}

function handleTouchStart(e) {
  if (e.touches.length !== 1 || !canvas) return;
  e.preventDefault();
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  lastX = touch.clientX - rect.left;
  lastY = touch.clientY - rect.top;
}

function handleTouchMove(e) {
  if (!isDrawing || e.touches.length !== 1 || !canvas || !ctx) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  
  lastX = x;
  lastY = y;
  hasUserSigned = true;
}

function stopDrawing() {
  isDrawing = false;
}

function clearSignature() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasUserSigned = false;
}

function isSignatureEmpty() {
  return !hasUserSigned;
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

  searchInput.addEventListener("focus", () => filterList());
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
        <div>${item.nama}</div>
        <div class="autocomplete-item-sub">${item.id} · ${item.bidang || ""}</div>
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
        if (onSelectCallback) onSelectCallback(id);
      });
    });
  }
}

// ── Submit Form ───────────────────────────────
async function submitForm(e) {
  e.preventDefault();
  
  const idPegawai = $("f-pegawai").value;
  const namaPegawai = $("f-pegawai-search").value;
  const jabatan = $("f-jabatan").value;
  const idKendaraan = $("f-kendaraan").value;
  const tanggal = $("f-tanggal").value;
  const tanggalKembali = $("f-tanggal-kembali").value;
  const keperluan = $("f-keperluan").value;
  const agree = $("f-agree").checked;
  
  if (!idPegawai) {
    UI.showToast("Silakan pilih Pegawai dari autocomplete dropdown!", true);
    return;
  }
  if (!agree) {
    UI.showToast("Anda harus menyetujui pernyataan pertanggungjawaban!", true);
    return;
  }
  if (isSignatureEmpty()) {
    UI.showToast("Silakan tanda tangan terlebih dahulu!", true);
    return;
  }
  
  const ttdBase64 = canvas.toDataURL("image/png");
  const btn = $("btn-submit");
  btn.disabled = true;
  btn.innerHTML = `<span class="spin"></span> <span>Mengirim...</span>`;
  
  const payload = {
    action: "submitBookingCar",
    id_pegawai: idPegawai,
    nama_peminjam: namaPegawai,
    jabatan: jabatan,
    id_kendaraan: idKendaraan,
    tanggal: tanggal,
    tanggal_kembali: tanggalKembali,
    jenis_pinjam: selectedRadioVal,
    keperluan: keperluan,
    ttd_base64: ttdBase64
  };
  
  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      await new Promise(r => setTimeout(r, 1200));
      $("result-ba-id").textContent = "BA/KND/2026/DEMO";
      $("form-container").style.display = "none";
      $("success-screen").style.display = "block";
      window.scrollTo(0, 0);
      return;
    }
    
    const json = await API.post(payload);
    if (json.success) {
      if (json.ba_error) {
        UI.showToast("Peringatan: Dokumen BA gagal dibuat secara otomatis.", true);
      }
      $("result-ba-id").textContent = json.no_ba || "BA/KND/2026/0001";
      $("form-container").style.display = "none";
      $("success-screen").style.display = "block";
      window.scrollTo(0, 0);
    } else {
      UI.showToast("Gagal mengirim pengajuan: " + (json.message || "Error server"), true);
      btn.disabled = false;
      btn.innerHTML = "<span>Kirim Pengajuan Peminjaman</span>";
    }
  } catch (err) {
    UI.showToast("Koneksi gagal: " + err.message, true);
    btn.disabled = false;
    btn.innerHTML = "<span>Kirim Pengajuan Peminjaman</span>";
  }
}

function resetForm() {
  $("vehicle-form").reset();
  clearSignature();
  if ($("val-bidang")) $("val-bidang").textContent = "-";
  if ($("val-jabatan")) $("val-jabatan").textContent = "-";
  if ($("f-jabatan")) $("f-jabatan").value = "";
  if ($("f-pegawai")) $("f-pegawai").value = "";
  selectRadio("Dinas");
  
  const today = new Date().toISOString().split("T")[0];
  if ($("f-tanggal")) $("f-tanggal").value = today;
  if ($("f-tanggal-kembali")) $("f-tanggal-kembali").value = today;
  
  $("success-screen").style.display = "none";
  $("form-container").style.display = "block";
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ── Initializer ──
(async function initKendaraan() {
  UI.renderNavigation("kendaraan");
  
  await Promise.all([loadPegawai(), loadVehicles()]);
  initSignature();
  
  const today = new Date().toISOString().split("T")[0];
  if ($("f-tanggal")) $("f-tanggal").value = today;
  if ($("f-tanggal-kembali")) $("f-tanggal-kembali").value = today;
})();

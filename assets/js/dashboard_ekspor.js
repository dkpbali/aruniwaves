/* ===================================================================
   ARUNIWAVES - Dashboard Ekspor & UPI Module Specific JS
   =================================================================== */

// Data states
let rawEkspor = [];
let rawUpi = [];
let filteredEkspor = [];
let filteredUpi = [];
let allKomoditas = [];

// Pagination state
let currentPage = 1;
const rowsPerPage = 10;

// Charts instances
let trendChart = null;
let countryChart = null;
let commodityChart = null;
let exporterChart = null;
let topLimitGlobal = 5;
let activeSubTab = 'country';
let forceShowUpiList = false;

// Helper to select elements
const $ = id => document.getElementById(id);

function setTopLimitAll(val) {
  topLimitGlobal = val;
  updateCharts();
}

function switchSubTab(tab) {
  activeSubTab = tab;
  document.querySelectorAll(".tab-sub-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = $(`tab-sub-${tab}`);
  if (activeBtn) activeBtn.classList.add("active");
  
  if ($("list-country")) $("list-country").style.display = tab === 'country' ? 'flex' : 'none';
  if ($("list-commodity")) $("list-commodity").style.display = tab === 'commodity' ? 'flex' : 'none';
  if ($("list-exporter")) $("list-exporter").style.display = tab === 'exporter' ? 'flex' : 'none';
}

function switchTab(tabId) {
  const tabs = document.querySelectorAll(".tab");
  const sections = document.querySelectorAll(".tab-section");
  
  tabs.forEach(t => t.classList.remove("active"));
  sections.forEach(s => s.style.display = "none");
  
  const activeTabEl = $(`tab-${tabId}`);
  if (activeTabEl) activeTabEl.classList.add("active");
  const activeSection = $(`section-${tabId}`);
  if (activeSection) activeSection.style.display = "block";
}

// Load JSON data
async function loadAllData() {
  let hasLocalCache = false;
  
  try {
    const cached = localStorage.getItem("ekspor_upi_data");
    if (cached) {
      const data = JSON.parse(cached);
      if (data && data.ekspor && data.upi) {
        rawEkspor = data.ekspor;
        rawUpi = data.upi;
        hasLocalCache = true;
        
        initFilterOptions();
        applyFilters();
        initUpiDashboard();
        console.log("Dashboard loaded instantly from localStorage cache.");
      }
    }
  } catch (e) {
    console.warn("Failed to load localStorage cache:", e);
  }

  try {
    let json;
    // Check if script URL is custom, else load fallbacks
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      const [resEkspor, resUpi] = await Promise.all([
        fetch("data_ekspor.json"),
        fetch("data_upi.json")
      ]);
      const ekspor = await resEkspor.json();
      const upi = await resUpi.json();
      json = { success: true, ekspor, upi };
    } else {
      json = await API.get("");
    }
    
    if (json.success) {
      rawEkspor = json.ekspor || [];
      rawUpi = json.upi || [];
      
      try {
        localStorage.setItem("ekspor_upi_data", JSON.stringify({
          ekspor: rawEkspor,
          upi: rawUpi
        }));
      } catch (e) {
        console.warn("Failed to write localStorage cache:", e);
      }
      
      initFilterOptions();
      applyFilters();
      initUpiDashboard();
      console.log("Dashboard updated with fresh network data.");
    } else {
      throw new Error(json.error || "Gagal mengambil data ekspor.");
    }
  } catch (err) {
    console.error("Failed to load dashboard data from network:", err);
    if (!hasLocalCache) {
      console.warn("Attempting local files fallback...");
      try {
        const [resEkspor, resUpi] = await Promise.all([
          fetch("data_ekspor.json"),
          fetch("data_upi.json")
        ]);
        rawEkspor = await resEkspor.json();
        rawUpi = await resUpi.json();
        initFilterOptions();
        applyFilters();
        initUpiDashboard();
      } catch (e) {
        console.error("Local fallback also failed:", e);
      }
    }
  }
}

// Populate select filters dynamically based on dataset
function initFilterOptions() {
  const negaraSet = new Set();
  const komoditasSet = new Set();
  
  rawEkspor.forEach(row => {
    if (row[3]) negaraSet.add(row[3]);
    if (row[4]) komoditasSet.add(row[4]);
  });
  
  populateSelect("f-negara", Array.from(negaraSet).sort());
  
  allKomoditas = Array.from(komoditasSet).sort();
  initAutocompleteFilter("f-komoditas-search", "f-komoditas-list", "f-komoditas", allKomoditas);
}

function initAutocompleteFilter(inputId, listId, hiddenId, dataList) {
  const searchInput = $(inputId);
  const dropdownList = $(listId);
  const hiddenInput = $(hiddenId);
  if (!searchInput || !dropdownList || !hiddenInput) return;

  function renderList(query) {
    const term = (query || "").toLowerCase().trim();
    
    const filtered = dataList.filter(item => 
      item.toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
      dropdownList.innerHTML = `<div style="padding:10px;font-size:12.5px;color:var(--muted);text-align:center;">Tidak ditemukan "${query}"</div>`;
    } else {
      dropdownList.innerHTML = filtered.map(item => `
        <div class="autocomplete-item" data-value="${item}">
          ${item}
        </div>
      `).join("");

      dropdownList.querySelectorAll(".autocomplete-item").forEach(el => {
        el.addEventListener("mousedown", (e) => {
          e.preventDefault();
          const val = el.getAttribute("data-value");
          searchInput.value = val;
          hiddenInput.value = val;
          dropdownList.style.display = "none";
          applyFilters();
        });
      });
    }
  }

  searchInput.addEventListener("focus", () => {
    renderList(searchInput.value);
    dropdownList.style.display = "block";
  });

  searchInput.addEventListener("input", () => {
    if (!searchInput.value.trim()) {
      hiddenInput.value = "";
      applyFilters();
    }
    renderList(searchInput.value);
    dropdownList.style.display = "block";
  });

  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !dropdownList.contains(e.target)) {
      dropdownList.style.display = "none";
    }
  });
}

function populateSelect(selectId, list) {
  const select = $(selectId);
  if (!select) return;
  list.forEach(val => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val === "Menengah Besar" ? "Skala Menengah" : val;
    select.appendChild(opt);
  });
}

// Filter Ekspor
function applyFilters() {
  const bulan = $("f-bulan").value;
  const negara = $("f-negara").value;
  const komoditas = $("f-komoditas").value;
  const satuan = $("f-satuan").value;
  
  filteredEkspor = rawEkspor.filter(row => {
    if (bulan) {
      if (bulan.startsWith("M-")) {
        const m = bulan.substring(2);
        if (row[0] !== m) return false;
      } else if (bulan === "Q-1") {
        if (!["JANUARY", "FEBRUARY", "MARCH"].includes(row[0])) return false;
      } else if (bulan === "Q-2") {
        if (!["APRIL", "MAY", "JUNE"].includes(row[0])) return false;
      } else if (bulan === "Q-3") {
        if (!["JULY", "AUGUST", "SEPTEMBER"].includes(row[0])) return false;
      } else if (bulan === "Q-4") {
        if (!["OCTOBER", "NOVEMBER", "DECEMBER"].includes(row[0])) return false;
      } else if (bulan === "S-1") {
        if (!["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE"].includes(row[0])) return false;
      } else if (bulan === "S-2") {
        if (!["JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"].includes(row[0])) return false;
      }
    }
    if (negara && row[3] !== negara) return false;
    if (komoditas && row[4] !== komoditas) return false;
    
    const rowUnit = row[7] ? row[7].toLowerCase() : "";
    if (satuan === "KG") {
      if (!rowUnit.includes("kg") && !rowUnit.includes("kilogram")) return false;
    } else if (satuan === "EKOR") {
      if (!rowUnit.includes("ekor")) return false;
    }
    
    return true;
  });
  
  currentPage = 1;
  updateKPIs();
  updateCharts();
}

function resetFilters() {
  $("f-bulan").value = "";
  $("f-negara").value = "";
  $("f-komoditas").value = "";
  const searchInp = $("f-komoditas-search");
  if (searchInp) searchInp.value = "";
  $("f-satuan").value = "KG";
  applyFilters();
}

// Format IDR nicely
function formatIDR(val) {
  if (val >= 1e12) {
    return "Rp" + (val / 1e12).toFixed(2).replace(".", ",") + " T";
  } else if (val >= 1e9) {
    return "Rp" + (val / 1e9).toFixed(2).replace(".", ",") + " M";
  } else if (val >= 1e6) {
    return "Rp" + (val / 1e6).toFixed(2).replace(".", ",") + " jt";
  }
  return "Rp" + val.toLocaleString("id-ID");
}

function formatNum(val) {
  return Math.round(val).toLocaleString("id-ID");
}

// Update KPI Metrics
function updateKPIs() {
  const satuan = $("f-satuan").value;
  let totalVol = 0;
  let nilaiIdr = 0;
  const eksportirSet = new Set();
  const negaraSet = new Set();
  
  filteredEkspor.forEach(row => {
    const vol = parseFloat(row[6]) || 0;
    const harga = parseFloat(row[8]) || 0;
    const pengirim = row[2];
    const negara = row[3];
    
    totalVol += vol;
    nilaiIdr += harga;
    if (pengirim) eksportirSet.add(pengirim);
    if (negara) negaraSet.add(negara);
  });
  
  if (satuan === "KG") {
    $("kpi-vol-label").textContent = "Volume (KG)";
    $("kpi-vol-val").textContent = formatNum(totalVol) + " kg";
    $("kpi-vol-sub").textContent = "Total pengiriman dalam Kilogram";
  } else {
    $("kpi-vol-label").textContent = "Volume (Ekor)";
    $("kpi-vol-val").textContent = formatNum(totalVol) + " ekor";
    $("kpi-vol-sub").textContent = "Total pengiriman bibit/hidup";
  }
  
  $("kpi-nilai-idr").textContent = formatIDR(nilaiIdr);
  $("kpi-eksportir-val").textContent = formatNum(eksportirSet.size);
  $("kpi-negara-val").textContent = formatNum(negaraSet.size);
}

// Generate & Update Charts
function updateCharts() {
  const satuan = $("f-satuan").value;

  $("label-top-limit-title").textContent = topLimitGlobal;
  
  document.querySelectorAll("[id^='btn-top-limit-']").forEach(btn => btn.classList.remove("active"));
  const activeBtn = $(`btn-top-limit-${topLimitGlobal}`);
  if (activeBtn) activeBtn.classList.add("active");

  const monthsOrder = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY"];
  const monthsLabelMap = { "JANUARY": "Jan", "FEBRUARY": "Feb", "MARCH": "Mar", "APRIL": "Apr", "MAY": "Mei" };
  const monthlyValues = { "JANUARY": 0, "FEBRUARY": 0, "MARCH": 0, "APRIL": 0, "MAY": 0 };
  
  const countryValues = {};
  const commodityValues = {};
  const exporterValues = {};
  
  filteredEkspor.forEach(row => {
    const bulan = row[0];
    const negara = row[3];
    const komo = row[4];
    const pengirim = row[2];
    const vol = parseFloat(row[6]) || 0;
    const harga = parseFloat(row[8]) || 0;
    
    if (monthlyValues[bulan] !== undefined) {
      monthlyValues[bulan] += harga;
    }
    if (negara) {
      countryValues[negara] = (countryValues[negara] || 0) + harga;
    }
    if (komo) {
      commodityValues[komo] = (commodityValues[komo] || 0) + vol;
    }
    if (pengirim) {
      exporterValues[pengirim] = (exporterValues[pengirim] || 0) + harga;
    }
  });
  
  // Render Trend Chart
  const trendData = monthsOrder.map(m => monthlyValues[m] / 1e9);
  const trendLabels = monthsOrder.map(m => monthsLabelMap[m]);
  
  if (trendChart) trendChart.destroy();
  trendChart = new Chart($("chart-trend"), {
    type: 'line',
    data: {
      labels: trendLabels,
      datasets: [{
        label: 'Nilai Ekspor',
        data: trendData,
        borderColor: '#0077E6',
        backgroundColor: 'rgba(0, 119, 230, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#0077E6',
        pointBorderWidth: 2.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleFont: { family: 'Outfit', size: 12, weight: '700' },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const valInBillion = context.parsed.y;
              if (valInBillion >= 1000) {
                return ' Nilai: Rp' + (valInBillion / 1000).toFixed(2).replace('.', ',') + ' T';
              }
              return ' Nilai: Rp' + valInBillion.toFixed(2).replace('.', ',') + ' M';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 10, weight: '600' }, color: '#64748B' }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.04)' },
          ticks: {
            font: { family: 'Fira Code', size: 9 },
            color: '#64748B',
            callback: function(v) {
              if (v >= 1000) {
                return "Rp" + (v / 1000).toFixed(1).replace(".0", "") + " T";
              }
              return "Rp" + v + " M";
            }
          }
        }
      }
    }
  });
  
  // 1. Render Countries Progress List
  const topCountries = Object.entries(countryValues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topLimitGlobal);
  
  const listCountryContainer = $("list-country");
  listCountryContainer.innerHTML = "";
  if (topCountries.length === 0) {
    listCountryContainer.innerHTML = `<div style="text-align:center;color:var(--muted);padding:20px;font-size:12px;">Tidak ada data</div>`;
  } else {
    const maxVal = topCountries[0][1] || 1;
    topCountries.forEach(([name, val], idx) => {
      const pct = (val / maxVal * 100).toFixed(0);
      const item = document.createElement("div");
      item.className = "top-list-item";
      item.title = name;
      item.onclick = () => showCountryDetails(name);
      item.innerHTML = `
        <div class="top-rank-badge">${idx + 1}</div>
        <div class="top-item-content">
          <div class="top-item-header">
            <span class="top-item-name">${name}</span>
            <span class="top-item-val">${formatIDR(val)}</span>
          </div>
          <div class="top-progress-bg">
            <div class="top-progress-bar" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
      listCountryContainer.appendChild(item);
    });
  }
  
  // 2. Render Commodities Progress List
  const topCommodities = Object.entries(commodityValues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topLimitGlobal);
     
  const listCommodityContainer = $("list-commodity");
  listCommodityContainer.innerHTML = "";
  if (topCommodities.length === 0) {
    listCommodityContainer.innerHTML = `<div style="text-align:center;color:var(--muted);padding:20px;font-size:12px;">Tidak ada data</div>`;
  } else {
    const maxVal = topCommodities[0][1] || 1;
    topCommodities.forEach(([name, val], idx) => {
      const pct = (val / maxVal * 100).toFixed(0);
      const item = document.createElement("div");
      item.className = "top-list-item";
      item.title = name;
      item.onclick = () => showCommodityDetails(name);
      item.innerHTML = `
        <div class="top-rank-badge">${idx + 1}</div>
        <div class="top-item-content">
          <div class="top-item-header">
            <span class="top-item-name">${name}</span>
            <span class="top-item-val">${formatNum(val)} ${satuan === 'KG' ? 'kg' : 'ekor'}</span>
          </div>
          <div class="top-progress-bg">
            <div class="top-progress-bar" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
      listCommodityContainer.appendChild(item);
    });
  }
  
  // 3. Render Exporters Progress List
  const topExporters = Object.entries(exporterValues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topLimitGlobal);
     
  const listExporterContainer = $("list-exporter");
  listExporterContainer.innerHTML = "";
  if (topExporters.length === 0) {
    listExporterContainer.innerHTML = `<div style="text-align:center;color:var(--muted);padding:20px;font-size:12px;">Tidak ada data</div>`;
  } else {
    const maxVal = topExporters[0][1] || 1;
    topExporters.forEach(([name, val], idx) => {
      const pct = (val / maxVal * 100).toFixed(0);
      const item = document.createElement("div");
      item.className = "top-list-item";
      item.title = name;
      item.onclick = () => showExporterDetails(name);
      item.innerHTML = `
        <div class="top-rank-badge">${idx + 1}</div>
        <div class="top-item-content">
          <div class="top-item-header">
            <span class="top-item-name">${name}</span>
            <span class="top-item-val">${formatIDR(val)}</span>
          </div>
          <div class="top-progress-bg">
            <div class="top-progress-bar" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
      listExporterContainer.appendChild(item);
    });
  }

  generateInsights();
}

function generateInsights() {
  const container = $("insight-container");
  if (!container) return;
  
  if (filteredEkspor.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:15px; opacity:0.8;">Tidak ada data untuk dianalisis. Silakan sesuaikan filter Anda.</div>`;
    return;
  }
  
  let totalValue = 0;
  let totalVol = 0;
  const countryValues = {};
  const commodityValues = {};
  const exporterValues = {};
  
  filteredEkspor.forEach(row => {
    const pengirim = row[2];
    const negara = row[3];
    const komo = row[4];
    const vol = parseFloat(row[6]) || 0;
    const harga = parseFloat(row[8]) || 0;
    
    totalValue += harga;
    totalVol += vol;
    
    if (negara) countryValues[negara] = (countryValues[negara] || 0) + harga;
    if (komo) commodityValues[komo] = (commodityValues[komo] || 0) + vol;
    if (pengirim) exporterValues[pengirim] = (exporterValues[pengirim] || 0) + harga;
  });
  
  const sortedCountries = Object.entries(countryValues).sort((a, b) => b[1] - a[1]);
  const sortedCommodities = Object.entries(commodityValues).sort((a, b) => b[1] - a[1]);
  const sortedExporters = Object.entries(exporterValues).sort((a, b) => b[1] - a[1]);
  
  const satuan = $("f-satuan").value;
  
  let topCountryName = "-";
  let topCountryVal = 0;
  let topCountryPct = "0";
  if (sortedCountries.length > 0) {
    const [name, val] = sortedCountries[0];
    topCountryName = name;
    topCountryVal = val;
    topCountryPct = (val / (totalValue || 1) * 100).toFixed(1);
  }
  
  let topCommName = "-";
  let topCommVal = 0;
  let topCommPct = "0";
  if (sortedCommodities.length > 0) {
    const [name, val] = sortedCommodities[0];
    topCommName = name;
    topCommVal = val;
    topCommPct = (val / (totalVol || 1) * 100).toFixed(1);
  }
  
  let topExpName = "-";
  let topExpVal = 0;
  let topExpPct = "0";
  if (sortedExporters.length > 0) {
    const [name, val] = sortedExporters[0];
    topExpName = name;
    topExpVal = val;
    topExpPct = (val / (totalValue || 1) * 100).toFixed(1);
  }
  
  const monthlyValues = { "JANUARY": 0, "FEBRUARY": 0, "MARCH": 0, "APRIL": 0, "MAY": 0 };
  filteredEkspor.forEach(row => {
    const bulan = row[0];
    const harga = parseFloat(row[8]) || 0;
    if (monthlyValues[bulan] !== undefined) {
      monthlyValues[bulan] += harga;
    }
  });
  
  const monthsOrder = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY"];
  const activeMonths = monthsOrder.filter(m => monthlyValues[m] > 0);
  
  let growthLabel = "Statis ⎯";
  let hasGrowth = false;
  let isPositive = true;
  let pctGrowth = "0.0";
  let labelLast = "";
  let labelPrev = "";
  
  if (activeMonths.length >= 2) {
    const lastMonth = activeMonths[activeMonths.length - 1];
    const prevMonth = activeMonths[activeMonths.length - 2];
    const lastVal = monthlyValues[lastMonth];
    const prevVal = monthlyValues[prevMonth];
    const diff = lastVal - prevVal;
    pctGrowth = (Math.abs(diff) / (prevVal || 1) * 100).toFixed(1);
    
    labelLast = lastMonth === "JANUARY" ? "Januari" : lastMonth === "FEBRUARY" ? "Februari" : lastMonth === "MARCH" ? "Maret" : lastMonth === "APRIL" ? "April" : "Mei";
    labelPrev = prevMonth === "JANUARY" ? "Januari" : prevMonth === "FEBRUARY" ? "Februari" : prevMonth === "MARCH" ? "Maret" : prevMonth === "APRIL" ? "April" : "Mei";
    
    hasGrowth = true;
    isPositive = diff > 0;
    
    if (diff > 0) {
      growthLabel = `Tumbuh +${pctGrowth}% 🟢`;
    } else {
      growthLabel = `Koreksi -${pctGrowth}% 🔴`;
    }
  } else {
    growthLabel = "Satu Periode ⎯";
  }
  
  let recommendation = "";
  if (hasGrowth) {
    if (isPositive) {
      recommendation = `Pertumbuhan ekspor positif dari bulan ${labelPrev} ke ${labelLast} didominasi oleh komoditas <strong>${topCommName}</strong> ke pasar <strong>${topCountryName}</strong>. Disarankan untuk mempermudah fasilitasi dokumen ekspor dan mempercepat sertifikasi mutu UPI terkait guna menjaga momentum.`;
    } else {
      recommendation = `Mengalami koreksi ekspor dari bulan ${labelPrev} ke ${labelLast}. Direkomendasikan untuk menjajaki diversifikasi pasar baru di luar <strong>${topCountryName}</strong>, khususnya untuk komoditas utama <strong>${topCommName}</strong> yang saat ini mendominasi volume.`;
    }
  } else {
    recommendation = `Data saat ini menunjukkan pasar ekspor utama didominasi oleh <strong>${topCountryName}</strong> dengan komoditas terlaris <strong>${topCommName}</strong>. Disarankan untuk memantau pergerakan bulanan berikutnya guna merumuskan kebijakan yang terukur.`;
  }
  
  container.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; margin-bottom:4px;">
      <div style="background:rgba(255,255,255,0.12); padding:10px; border-radius:10px;">
        <div style="font-size:9px; opacity:0.85; text-transform:uppercase; font-family:var(--mono);">Total Nilai Ekspor</div>
        <div style="font-size:13.5px; font-weight:800; margin-top:2px;">${formatIDR(totalValue)}</div>
      </div>
      <div style="background:rgba(255,255,255,0.12); padding:10px; border-radius:10px;">
        <div style="font-size:9px; opacity:0.85; text-transform:uppercase; font-family:var(--mono);">Tren Bulanan (MoM)</div>
        <div style="font-size:12.5px; font-weight:800; margin-top:2px;">${growthLabel}</div>
      </div>
    </div>
    
    <div style="display:flex; flex-direction:column; gap:4px; font-size:11px; background:rgba(255,255,255,0.08); padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.06);">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px; border-bottom:1px dashed rgba(255,255,255,0.15); padding-bottom:4px;">
        <span style="opacity:0.85;">🌐 Pasar Ekspor Utama:</span>
        <span style="font-weight:700; text-align:right;">${topCountryName} (${topCountryPct}%)</span>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:4px; border-bottom:1px dashed rgba(255,255,255,0.15); padding-bottom:4px;">
        <span style="opacity:0.85;">🐟 Komoditas Terlaris:</span>
        <span style="font-weight:700; text-align:right;">${topCommName} (${formatNum(topCommVal)} ${satuan === 'KG' ? 'kg' : 'ekor'} - ${topCommPct}%)</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding-bottom:2px;">
        <span style="opacity:0.85;">🏢 Eksportir Terbesar:</span>
        <span style="font-weight:700; text-align:right;">${topExpName} (${topExpPct}%)</span>
      </div>
    </div>

    <div style="background:rgba(255,255,255,0.15); border-left:4px solid #fff; padding:10px; border-radius:4px 10px 10px 4px; font-size:11px; line-height:1.4;">
      <strong>Rekomendasi:</strong> ${recommendation}
    </div>
  `;
}

// ── Detail Modal ───────────────────────────────
function openDetailModal(title, contentHtml) {
  $("modal-detail-title").textContent = title;
  $("modal-detail-body").innerHTML = contentHtml;
  $("modal-detail").classList.add("open");
}

function closeDetailModal() {
  $("modal-detail").classList.remove("open");
}

function showCountryDetails(countryName) {
  const data = filteredEkspor.filter(row => row[3] === countryName);
  
  const commMap = {};
  data.forEach(row => {
    const comm = row[4];
    const vol = parseFloat(row[6]) || 0;
    const unit = row[7] || "";
    const val = parseFloat(row[8]) || 0;
    
    if (!commMap[comm]) {
      commMap[comm] = { name: comm, volume: 0, unit: unit, value: 0 };
    }
    commMap[comm].volume += vol;
    commMap[comm].value += val;
  });
  
  const sortedComm = Object.values(commMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
    
  let html = `
    <div style="margin-bottom:12px;font-size:12px;color:var(--muted)">
      Menampilkan hingga 10 komoditas ekspor terbesar ke <strong>${countryName}</strong> berdasarkan total nilai ekspor.
    </div>
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Komoditas</th>
            <th style="text-align:right">Volume</th>
            <th style="text-align:right">Nilai (IDR)</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  if (sortedComm.length === 0) {
    html += `<tr><td colspan="3" style="text-align:center;padding:20px;color:var(--muted)">Tidak ada data</td></tr>`;
  } else {
    sortedComm.forEach(c => {
      html += `
        <tr class="tr-hover">
          <td style="font-weight:600">${c.name}</td>
          <td style="text-align:right;font-family:var(--mono)">${formatNum(c.volume)} ${c.unit}</td>
          <td style="text-align:right;font-family:var(--mono);font-weight:700">${formatIDR(c.value)}</td>
        </tr>
      `;
    });
  }
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  openDetailModal(`Rincian Komoditas Ekspor ke ${countryName}`, html);
}

function showCommodityDetails(commodityName) {
  const data = filteredEkspor.filter(row => row[4] === commodityName);
  
  const countryMap = {};
  data.forEach(row => {
    const country = row[3];
    const vol = parseFloat(row[6]) || 0;
    const unit = row[7] || "";
    const val = parseFloat(row[8]) || 0;
    
    if (!countryMap[country]) {
      countryMap[country] = { name: country, volume: 0, unit: unit, value: 0 };
    }
    countryMap[country].volume += vol;
    countryMap[country].value += val;
  });
  
  const sortedCountry = Object.values(countryMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
    
  let html = `
    <div style="margin-bottom:12px;font-size:12px;color:var(--muted)">
      Menampilkan hingga 10 negara tujuan ekspor terbesar untuk komoditas <strong>${commodityName}</strong>.
    </div>
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Negara Tujuan</th>
            <th style="text-align:right">Volume</th>
            <th style="text-align:right">Nilai (IDR)</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  if (sortedCountry.length === 0) {
    html += `<tr><td colspan="3" style="text-align:center;padding:20px;color:var(--muted)">Tidak ada data</td></tr>`;
  } else {
    sortedCountry.forEach(c => {
      html += `
        <tr class="tr-hover">
          <td style="font-weight:600">${c.name}</td>
          <td style="text-align:right;font-family:var(--mono)">${formatNum(c.volume)} ${c.unit}</td>
          <td style="text-align:right;font-family:var(--mono);font-weight:700">${formatIDR(c.value)}</td>
        </tr>
      `;
    });
  }
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  openDetailModal(`Rincian Negara Tujuan: ${commodityName}`, html);
}

function showExporterDetails(exporterName) {
  const data = filteredEkspor.filter(row => row[2] === exporterName);
  
  const commMap = {};
  data.forEach(row => {
    const comm = row[4];
    const vol = parseFloat(row[6]) || 0;
    const unit = row[7] || "";
    const val = parseFloat(row[8]) || 0;
    
    if (!commMap[comm]) {
      commMap[comm] = { name: comm, volume: 0, unit: unit, value: 0 };
    }
    commMap[comm].volume += vol;
    commMap[comm].value += val;
  });
  
  const sortedComm = Object.values(commMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
    
  let html = `
    <div style="margin-bottom:12px;font-size:12px;color:var(--muted)">
      Menampilkan hingga 10 komoditas ekspor terbesar oleh <strong>${exporterName}</strong> berdasarkan total nilai ekspor.
    </div>
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Komoditas</th>
            <th style="text-align:right">Volume</th>
            <th style="text-align:right">Nilai (IDR)</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  if (sortedComm.length === 0) {
    html += `<tr><td colspan="3" style="text-align:center;padding:20px;color:var(--muted)">Tidak ada data</td></tr>`;
  } else {
    sortedComm.forEach(c => {
      html += `
        <tr class="tr-hover">
          <td style="font-weight:600">${c.name}</td>
          <td style="text-align:right;font-family:var(--mono)">${formatNum(c.volume)} ${c.unit}</td>
          <td style="text-align:right;font-family:var(--mono);font-weight:700">${formatIDR(c.value)}</td>
        </tr>
      `;
    });
  }
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  openDetailModal(`Rincian Komoditas: ${exporterName}`, html);
}

// Export Filtered Data to CSV
function exportToCSV() {
  if (filteredEkspor.length === 0) {
    alert("Tidak ada data untuk diekspor!");
    return;
  }
  
  const filterBulan = $("f-bulan").options[$("f-bulan").selectedIndex].text;
  const filterNegara = $("f-negara").options[$("f-negara").selectedIndex].text;
  const filterKomoditas = $("f-komoditas").value || "Semua Komoditas";
  
  const countryValues = {};
  const commodityValues = {};
  const exporterValues = {};
  const negaraSet = new Set();
  const eksportirSet = new Set();
  let volKg = 0;
  let volEkor = 0;
  let nilaiIdr = 0;
  
  filteredEkspor.forEach(row => {
    const pengirim = row[2];
    const negara = row[3];
    const komo = row[4];
    const vol = parseFloat(row[6]) || 0;
    const unit = row[7] ? row[7].toLowerCase() : "";
    const harga = parseFloat(row[8]) || 0;
    
    if (unit.includes("kg") || unit.includes("kilogram")) {
      volKg += vol;
    } else {
      volEkor += vol;
    }
    nilaiIdr += harga;
    
    if (negara) {
      countryValues[negara] = (countryValues[negara] || 0) + harga;
      negaraSet.add(negara);
    }
    if (komo) {
      commodityValues[komo] = (commodityValues[komo] || 0) + vol;
    }
    if (pengirim) {
      exporterValues[pengirim] = (exporterValues[pengirim] || 0) + harga;
      eksportirSet.add(pengirim);
    }
  });
  
  const topCountries = Object.entries(countryValues).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topCommodities = Object.entries(commodityValues).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topExporters = Object.entries(exporterValues).sort((a, b) => b[1] - a[1]).slice(0, 10);
  
  let csv = "\uFEFFsep=,\r\n";
  csv += `LAPORAN RINGKAS EKSPOR HASIL PERIKANAN - DINAS KELAUTAN DAN PERIKANAN PROVINSI BALI\r\n`;
  csv += `Tanggal Unduh,${new Date().toLocaleString("id-ID")}\r\n`;
  csv += `Filter Aktif:,,Periode: "${filterBulan}" | Negara: "${filterNegara}" | Komoditas: "${filterKomoditas}"\r\n\r\n`;
  
  csv += `I. RINGKASAN KPI UTAMA\r\n`;
  csv += `Metrik,Nilai,Keterangan\r\n`;
  csv += `Total Volume (KG),${volKg.toFixed(2)},kilogram\r\n`;
  csv += `Total Volume (Ekor),${volEkor.toFixed(0)},ekor\r\n`;
  csv += `Total Nilai Ekspor (IDR),${nilaiIdr.toFixed(0)},Rupiah\r\n`;
  csv += `Jumlah Eksportir Aktif,${eksportirSet.size},Perusahaan\r\n`;
  csv += `Jumlah Negara Tujuan,${negaraSet.size},Negara Pengimpor\r\n\r\n`;
  
  csv += `II. TOP 10 NEGARA TUJUAN UTAMA (Berdasarkan Nilai Ekspor IDR)\r\n`;
  csv += `Peringkat,Negara Tujuan,Nilai Ekspor (IDR)\r\n`;
  topCountries.forEach((c, idx) => {
    csv += `${idx + 1},"${c[0]}",${c[1].toFixed(0)}\r\n`;
  });
  csv += `\r\n`;
  
  csv += `III. TOP 10 KOMODITAS TERBANYAK (Berdasarkan Volume)\r\n`;
  csv += `Peringkat,Komoditas,Volume Ekspor\r\n`;
  topCommodities.forEach((c, idx) => {
    csv += `${idx + 1},"${c[0]}",${c[1].toFixed(2)}\r\n`;
  });
  csv += `\r\n`;
  
  csv += `IV. TOP 10 EKSPORTIR TERBESAR (Berdasarkan Nilai Ekspor IDR)\r\n`;
  csv += `Peringkat,Eksportir / Pengirim,Nilai Ekspor (IDR)\r\n`;
  topExporters.forEach((e, idx) => {
    csv += `${idx + 1},"${e[0]}",${e[1].toFixed(0)}\r\n`;
  });
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "_");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `Laporan_Ekspor_DKP_Bali_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── UPI Directory ──────────────────────────────
function initUpiDashboard() {
  const kabSet = new Set();
  const skalaSet = new Set();
  
  rawUpi.forEach(row => {
    if (row[0]) kabSet.add(row[0]);
    if (row[6]) skalaSet.add(row[6]);
  });
  
  populateSelect("upi-kab", Array.from(kabSet).sort());
  populateSelect("upi-skala", Array.from(skalaSet).sort());
  
  applyUpiFilters();
}

function applyUpiFilters() {
  const q = $("upi-search").value.toLowerCase().trim();
  const kab = $("upi-kab").value;
  const skala = $("upi-skala").value;
  
  const isFilterActive = q || kab || skala;
  
  filteredUpi = rawUpi.filter(row => {
    if (kab && row[0] !== kab) return false;
    if (skala && row[6] !== skala) return false;
    if (q) {
      const matchName = row[1].toLowerCase().includes(q);
      const matchAddress = row[2].toLowerCase().includes(q);
      const matchProduct = row[3].toLowerCase().includes(q);
      if (!matchName && !matchAddress && !matchProduct) return false;
    }
    return true;
  });
  
  updateUpiKPIs();
  
  if (!isFilterActive && !forceShowUpiList) {
    renderUpiPrompt();
  } else {
    renderUpiCards();
  }
}

function searchUpiForce() {
  forceShowUpiList = true;
  applyUpiFilters();
}

function resetUpiFilters() {
  $("upi-search").value = "";
  $("upi-kab").value = "";
  $("upi-skala").value = "";
  forceShowUpiList = false;
  applyUpiFilters();
}

function renderUpiPrompt() {
  const container = $("upi-container");
  if (!container) return;
  container.innerHTML = `
    <div style="text-align:center;color:var(--muted);padding:40px;background:#fff;border-radius:14px;border:1px solid var(--border);box-shadow:0 2px 12px rgba(0,0,0,0.01)">
      <svg class="svg-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:12px;opacity:0.6;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <div style="font-weight:700;color:var(--text);margin-bottom:4px;font-family:var(--title-sans)">Cari Direktori UPI</div>
      <p style="font-size:12px;max-width:300px;margin:0 auto;line-height:1.5">Silakan ketik nama perusahaan/produk, atau pilih filter Kabupaten/Skala Usaha di atas untuk menampilkan daftar Unit Pengolahan Ikan.</p>
    </div>
  `;
}

function updateUpiKPIs() {
  let activeSkp = 0;
  let mikroCount = 0;
  let menengahCount = 0;
  let besarCount = 0;
  
  filteredUpi.forEach(row => {
    if (row[5] && row[5].toLowerCase() === "aktif") activeSkp++;
    
    const skala = row[6] ? row[6].toLowerCase() : "";
    if (skala.includes("mikro")) {
      mikroCount++;
    } else if (skala.includes("menengah")) {
      menengahCount++;
    } else if (skala === "besar" || (skala.includes("besar") && !skala.includes("menengah"))) {
      besarCount++;
    }
  });
  
  if ($("kpi-upi-total")) $("kpi-upi-total").textContent = filteredUpi.length;
  if ($("kpi-upi-aktif")) $("kpi-upi-aktif").textContent = activeSkp;
  if ($("kpi-upi-mikro")) $("kpi-upi-mikro").textContent = mikroCount;
  if ($("kpi-upi-menengah")) $("kpi-upi-menengah").textContent = menengahCount;
  if ($("kpi-upi-besar")) $("kpi-upi-besar").textContent = besarCount;
}

function renderUpiCards() {
  const container = $("upi-container");
  if (!container) return;
  container.innerHTML = "";
  
  if (filteredUpi.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--muted);padding:40px;">Tidak ada Unit Pengolahan Ikan yang cocok dengan kriteria filter.</div>`;
    return;
  }
  
  filteredUpi.forEach(row => {
    const card = document.createElement("div");
    card.className = "upi-card";
    card.style.padding = "16px";
    card.style.borderRadius = "14px";
    
    const isAktif = row[5] && row[5].toLowerCase() === "aktif";
    const statusBadge = isAktif 
      ? '<span class="badge badge-active" style="background:rgba(0,119,230,0.1); color:var(--wave); font-size:9px; font-weight:800; padding:3px 8px; border-radius:4px; text-transform:uppercase;">SKP Aktif</span>' 
      : '<span class="badge badge-inactive" style="background:rgba(220,38,38,0.1); color:var(--red); font-size:9px; font-weight:800; padding:3px 8px; border-radius:4px; text-transform:uppercase;">SKP Tidak Aktif</span>';
      
    card.innerHTML = `
      <div class="upi-header" style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
        <div class="upi-name" style="font-family:var(--title-sans); font-size:14px; font-weight:800; color:var(--text); line-height:1.3;">${row[1]}</div>
        <div style="flex-shrink:0;">${statusBadge}</div>
      </div>
      
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px;">
        <span class="badge badge-scale" style="background:rgba(0,119,230,0.06); color:var(--wave); font-size:9px; font-weight:800; padding:3px 8px; border-radius:4px; text-transform:uppercase; font-family:var(--mono);">${row[6] === "Menengah Besar" ? "Skala Menengah" : row[6]}</span>
        <span class="badge badge-pm" style="background:rgba(202,138,4,0.08); color:var(--yellow); font-size:9px; font-weight:800; padding:3px 8px; border-radius:4px; text-transform:uppercase; font-family:var(--mono);">${row[4]}</span>
      </div>
 
      <div style="font-size:11px; color:var(--muted); margin-bottom:12px; display:flex; align-items:flex-start; gap:6px; line-height:1.4;">
        <span style="font-size:13px; line-height:1; flex-shrink:0;">📍</span>
        <div>
          <strong style="color:var(--text);">${row[0]}</strong> — ${row[2]}
        </div>
      </div>
      
      <div style="background:var(--ink2); border:1px solid rgba(0,0,0,0.02); padding:8px 10px; border-radius:8px; font-size:11px; line-height:1.4; color:var(--text);">
        <strong style="font-family:var(--title-sans); font-size:9px; text-transform:uppercase; color:var(--muted); display:block; margin-bottom:3px; letter-spacing:0.04em;">Produk Pengolahan</strong>
        <span style="font-weight:500;">${row[3]}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// ── Init ───────────────────────────────────────
(async function initEksporUpi() {
  UI.renderNavigation("ekspor");
  
  // Close detail modal on click outside content
  document.addEventListener("click", (e) => {
    const modal = $("modal-detail");
    const content = document.querySelector(".detail-modal-content");
    if (modal && modal.classList.contains("open") && e.target === modal && !content.contains(e.target)) {
      closeDetailModal();
    }
  });

  await loadAllData();
})();

/* ===================================================================
   ARUNIWAVES - Dashboard EWS Module Specific JS
   =================================================================== */

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const LIST_BIDANG = ["SEKRETARIAT", "BIDANG PERIKANAN", "BIDANG P2HP", "BIDANG KELAUTAN", "BIDANG PSDKP"];

let allBerita = [];
let allStatistik = {};
let allHumas = [];
let allRedTide = [];
let allBleaching = [];

let selectedBeritaSentimen = "";
let selectedBeritaRegion = "";
let currentRedTideSlide = 0;
let currentBleachingSlide = 0;

let selectedTopic = "";
let beritaPage = 1;
const BERITA_PER_PAGE = 5;
let isTopicsExpanded = false;

// Helper shorthand selector
const $ = id => document.getElementById(id);

// ── Helpers ──
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
  if (!d) return "-";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function sortBeritaTerbaru(list) {
  return [...list].sort((a, b) => {
    const dateA = parseTanggal(a.tgl_publikasi || a.tglPublikasi);
    const dateB = parseTanggal(b.tgl_publikasi || b.tglPublikasi);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB.getTime() - dateA.getTime();
  });
}

function getBerita7Hari(list) {
  if (!list || !list.length) return [];
  let refDate = new Date();
  let maxDateMs = 0;
  list.forEach(b => {
    const d = parseTanggal(b.tgl_publikasi || b.tglPublikasi);
    if (d && d.getTime() > maxDateMs) {
      maxDateMs = d.getTime();
    }
  });
  if (maxDateMs > 0 && maxDateMs < refDate.getTime() - (30 * 24 * 60 * 60 * 1000)) {
    refDate = new Date(maxDateMs);
  }
  const sevenDaysAgo = new Date(refDate);
  sevenDaysAgo.setDate(refDate.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  return list.filter(b => {
    const d = parseTanggal(b.tgl_publikasi || b.tglPublikasi);
    return d && d.getTime() >= sevenDaysAgo.getTime();
  });
}

// ── Fallback Dummies ──
function dummyBerita() {
  return [
    { id:"EWS-1", lokasi_terdeteksi:"Buleleng", judul:"Produksi Budidaya Udang Bali Meningkat di Triwulan Ini", sumber:"Antara Bali", url:"#", tgl_publikasi:"2026-06-20T10:00:00Z", tgl_analisis:"2026-06-20T10:05:00Z", sentimen:"POSITIF", skor_sentimen:0.6, topik:"Budidaya", ringkasan:"Produksi udang vaname di sentra budidaya Bali tercatat naik signifikan dibandingkan periode sebelumnya." },
    { id:"EWS-2", lokasi_terdeteksi:"Buleleng", judul:"Operasi Gabungan Tindak Kapal Illegal Fishing di Perairan Bali Utara", sumber:"Bali Post", url:"#", tgl_publikasi:"2026-06-19T08:00:00Z", tgl_analisis:"2026-06-19T08:05:00Z", sentimen:"NEGATIF", skor_sentimen:-0.5, topik:"Illegal Fishing", ringkasan:"Tim gabungan mengamankan kapal yang diduga melakukan penangkapan ikan tanpa izin di perairan Bali Utara." },
    { id:"EWS-3", lokasi_terdeteksi:"Denpasar", judul:"Harga Ikan Tongkol di Pasar Tradisional Bali Stabil", sumber:"Nusa Bali", url:"#", tgl_publikasi:"2026-06-20T12:00:00Z", tgl_analisis:"2026-06-20T12:05:00Z", sentimen:"NETRAL", skor_sentimen:0.05, topik:"Harga Ikan", ringkasan:"Harga ikan tongkol di sejumlah pasar tradisional dilaporkan relatif stabil dibanding minggu lalu." },
    { id:"EWS-4", lokasi_terdeteksi:"Badung", judul:"Pencemaran Limbah Plastik Mengancam Terumbu Karang di Pantai Nusa Dua", sumber:"Radar Bali", url:"#", tgl_publikasi:"2026-06-18T15:00:00Z", tgl_analisis:"2026-06-18T15:05:00Z", sentimen:"NEGATIF", skor_sentimen:-0.6, topik:"Konservasi", ringkasan:"Pencemaran limbah plastik sekali pakai terpantau merusak ekosistem terumbu karang di kawasan perairan Nusa Dua." }
  ];
}
function dummyStatistik() { return { total:4, positif:1, negatif:2, netral:1, topik:[ {topik:"Konservasi",jumlah:1}, {topik:"Illegal Fishing",jumlah:1}, {topik:"Harga Ikan",jumlah:1}, {topik:"Budidaya",jumlah:1} ] }; }
function dummyHumas() {
  return [
    { id:"HUM-1", bidang:"BIDANG PERIKANAN", platform:"Instagram", namaKonten:"Edukasi Larangan Alat Tangkap Merusak (Destructive Fishing)", tanggalPosting:"2026-06-23", status:"DISETUJUI", linkKonten:"#" },
    { id:"HUM-2", bidang:"SEKRETARIAT", platform:"Website", namaKonten:"Siaran Pers: Sosialisasi Penyaluran BBM Bersubsidi Nelayan Bali", tanggalPosting:"2026-06-22", status:"DISETUJUI", linkKonten:"#" }
  ];
}
function dummyRedTide() {
  return [
    {
      id_kejadian: "NP-20260623",
      lokasi: "Nusa Penida",
      lat: -8.7275,
      lng: 115.5444,
      tgl_alert: "2026-06-23",
      chl_value: 0.35,
      chl_baseline: 0.12,
      anomaly_score: 2.85,
      hari_ke: 3,
      foto_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500",
      catatan_lapangan: "Warna air agak kecokelatan di dekat tebing. Ombak tenang.",
      ai_description: "Foto menunjukkan air laut dengan warna sedikit kecokelatan di area pinggir. Kekeruhan tingkat sedang. Tidak terlihat adanya ikan mati di permukaan.",
      status_sementara: "Dalam Pemantauan",
      status_final: "",
      petugas: "I Putu Patroli",
      admin_verifikasi: "",
      tgl_status_final: ""
    }
  ];
}
function dummyBleaching() {
  return [
    {
      id_kejadian: "CB-20260620-AMD",
      lokasi: "Amed",
      lat: -8.3375,
      lng: 115.6563,
      tgl_alert: "2026-06-20",
      sst_value: 30.8,
      sst_baseline: 28.5,
      anomaly_score: 2.3,
      hari_ke: 3,
      foto_url: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=500",
      status_sementara: "Dalam Pemantauan",
      status_final: "",
      catatan_lapangan: "Terumbu karang Acropora mulai terlihat memucat di kedalaman 3-5 meter.",
      ai_description: "Foto menunjukkan karang jenis branching (Acropora) mengalami pemucatan warna (bleaching) sekitar 30% di area koloni. Kekeruhan rendah. Suhu air laut terukur hangat.",
      petugas: "Putu Penyelam",
      admin_verifikasi: "",
      tgl_status_final: ""
    }
  ];
}

// ── Fetch Operations ───────────────────────────
async function loadEWS() {
  try {
    const hasScriptUrl = CFG.EWS_APPS_SCRIPT_URL && !CFG.EWS_APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      allBerita = sortBeritaTerbaru(dummyBerita());
      allStatistik = dummyStatistik();
      allRedTide = dummyRedTide();
      allBleaching = dummyBleaching();
      return;
    }
    const json = await API.getCustom(CFG.EWS_APPS_SCRIPT_URL, "");
    allBerita = sortBeritaTerbaru(json.berita || []);
    allStatistik = json.statistik || {};
    allRedTide = json.redTide || [];
    allBleaching = json.bleaching || dummyBleaching();
  } catch (e) {
    console.warn("[EWS] loadEWS network failed, loading fallbacks.");
    allBerita = sortBeritaTerbaru(dummyBerita());
    allStatistik = dummyStatistik();
    allRedTide = dummyRedTide();
    allBleaching = dummyBleaching();
  }
}

async function loadEwsSheetData() {
  try {
    const hasScriptUrl = CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.includes("GANTI_DENGAN");
    if (!hasScriptUrl) {
      allHumas = dummyHumas();
      return;
    }
    const json = await API.get("getEwsData");
    if (json.success) {
      allHumas = json.humas || [];
    } else {
      allHumas = [];
    }
  } catch (e) {
    console.warn("[EWS] loadEwsSheetData failed, loading fallbacks.");
    allHumas = dummyHumas();
  }
}

// ── EWS Panels ─────────────────────────────────
function renderSentimenPanel() {
  const news7Hari = getBerita7Hari(allBerita);
  const posCount = news7Hari.filter(b => (b.sentimen || "").toUpperCase() === "POSITIF").length;
  const netCount = news7Hari.filter(b => (b.sentimen || "").toUpperCase() === "NETRAL").length;
  const negCount = news7Hari.filter(b => (b.sentimen || "").toUpperCase() === "NEGATIF").length;
  const total = posCount + netCount + negCount;

  const badge = $("ews-status-badge");
  if (badge) {
    if (total === 0) {
      badge.style.display = "none";
    } else {
      badge.style.display = "inline-flex";
      const avgScore = (posCount - negCount) / total;
      let statusText = "SENTIMEN: NETRAL";
      let colorStyle = "background: rgba(202,138,4,0.06); border: 1px solid rgba(202,138,4,0.25); color: var(--yellow);";
      let dotStyle = "background: var(--yellow); animation: statusPulseYellow 2s infinite;";

      if (avgScore > 0.05) {
        statusText = "SENTIMEN: KONDUSIF";
        colorStyle = "background: rgba(13,148,136,0.06); border: 1px solid rgba(13,148,136,0.25); color: var(--green);";
        dotStyle = "background: var(--green); animation: statusPulseGreen 2s infinite;";
      } else if (avgScore < -0.15) {
        statusText = "🚨 DARURAT SENTIMEN";
        colorStyle = "background: rgba(220,38,38,0.08); border: 1.5px solid rgba(220,38,38,0.35); color: var(--red); box-shadow: 0 0 10px rgba(220,38,38,0.1);";
        dotStyle = "background: var(--red); animation: statusPulseRed 1.2s infinite;";
      }
      badge.setAttribute("style", colorStyle);
      const dot = badge.querySelector('.status-pulse-dot');
      if (dot) dot.setAttribute("style", dotStyle);
      const txt = badge.querySelector('.status-text');
      if (txt) txt.innerHTML = statusText;
    }
  }

  renderBeritaRecommendations();
}

function renderTopikPills() {
  const container = $('topik-pills');
  const strip = $('topik-strip');
  if (!container || !strip) return;
  
  let topics = [];
  if (allStatistik.topik && allStatistik.topik.length) {
    topics = allStatistik.topik.map(t => ({ name: t.topik, count: t.jumlah }));
  } else if (allBerita && allBerita.length) {
    const counts = {};
    allBerita.forEach(b => { if (b.topik) counts[b.topik] = (counts[b.topik] || 0) + 1; });
    topics = Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }
  
  if (!topics.length) { strip.style.display = 'none'; return; }
  strip.style.display = 'flex';
  container.innerHTML = topics.map(t => `<button class="topik-pill ${selectedTopic === t.name ? 'active' : ''}" onclick="selectTopicFilter('${t.name.replace(/'/g, "\\'")}')">${t.name} <span class="topik-pill-count">${t.count}</span></button>`).join('');
}

function renderBeritaFeed(list) {
  const el = $("berita-feed-container");
  const loadMoreBtn = $("btn-load-more");
  const showLessBtn = $("btn-show-less");
  const paginationEl = $("berita-pagination");
  const filterMsgEl = $("berita-filter-msg");
  const badgeEl = $("berita-neg-badge");

  if (!el) return;
  if (loadMoreBtn) loadMoreBtn.style.display = "none";
  if (showLessBtn) showLessBtn.style.display = "none";

  if (!list || !list.length) {
    el.innerHTML = `<div style="padding:40px 0;text-align:center;color:var(--muted);font-size:13px;">Belum ada berita yang dianalisis.</div>`;
    if (badgeEl) { badgeEl.textContent = ""; badgeEl.style.display = "none"; }
    return;
  }

  const news7Hari = getBerita7Hari(list);
  let filtered = news7Hari;
  if (selectedBeritaRegion) {
    filtered = filtered.filter(b => getNewsRegion(b) === selectedBeritaRegion.toUpperCase());
  }

  const negativeNews = filtered
    .filter(b => (b.sentimen || "").toUpperCase() === "NEGATIF")
    .sort((a, b) => {
      const da = parseTanggal(a.tgl_publikasi || a.tgl_analisis) || new Date(0);
      const db = parseTanggal(b.tgl_publikasi || b.tgl_analisis) || new Date(0);
      return db - da;
    });

  if (filterMsgEl) {
    if (selectedBeritaRegion) {
      const fr = selectedBeritaRegion.charAt(0).toUpperCase() + selectedBeritaRegion.slice(1).toLowerCase();
      filterMsgEl.innerHTML = `Wilayah: <strong>${fr}</strong> &nbsp;<a href="javascript:void(0)" onclick="clearBeritaFilters()" style="color:var(--red);font-weight:700;text-decoration:none;">reset</a>`;
    } else {
      filterMsgEl.innerHTML = "";
    }
  }

  if (badgeEl) {
    if (negativeNews.length) {
      badgeEl.textContent = negativeNews.length + " isu";
      badgeEl.style.display = "inline";
    } else {
      badgeEl.textContent = "";
      badgeEl.style.display = "none";
    }
  }

  if (!negativeNews.length) {
    el.innerHTML = `
      <div style="padding:48px 0;text-align:center;border-top:1px solid var(--border);margin-top:0;">
        <div style="width:36px;height:36px;border-radius:50%;background:rgba(13,148,136,0.08);border:1.5px solid rgba(13,148,136,0.25);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style="font-weight:700;font-size:14px;color:var(--text);font-family:var(--title-sans);margin-bottom:6px;">Situasi Media Kondusif</div>
        <div style="font-size:12.5px;color:var(--muted);line-height:1.6;">Tidak ada berita negatif ${selectedBeritaRegion ? ' untuk wilayah ' + selectedBeritaRegion : ''} dalam 7 hari terakhir.</div>
      </div>`;
    return;
  }

  const PAGE_SIZE = 10;
  const total = negativeNews.length;
  const shown = Math.min(beritaPage * PAGE_SIZE, total);
  const pageItems = negativeNews.slice(0, shown);

  const recGroups = [
    { id:"bbm",       title:"Mitigasi Kelangkaan BBM",           text:"Terdeteksi keluhan kelangkaan Solar Subsidi bagi nelayan di media. Koordinasi dengan BPH Migas/Pertamina dan periksa kelayakan penyaluran SPBUN.", humasRec:"Rilis infografis/siaran pers mengenai mekanisme dan transparansi penyaluran Solar Subsidi Nelayan.", keywords:["solar","bbm","bensin","bakar","spbu","minyak","pengambengan"] },
    { id:"fishing",   title:"Peningkatan Patroli Pengawasan",    text:"Isu penangkapan ikan ilegal terdeteksi di media. Jadwalkan patroli gabungan PSDKP di zona rawan.", humasRec:"Publikasikan konten edukasi terkait sanksi hukum destructive fishing dan rilis hasil tangkapan patroli.", keywords:["illegal","fishing","bom","tindak","tangkap","sanksi","patroli","racun","kompresor"] },
    { id:"cuaca",     title:"Peringatan Keselamatan Nelayan",    text:"Cuaca buruk memicu nelayan menunda melaut. Rilis himbauan keselamatan via Kesyahbandaran Perikanan DKP.", humasRec:"Buat rilis konten infografis harian BMKG tentang ramalan tinggi gelombang laut Bali dan tips keselamatan melaut.", keywords:["cuaca","ekstrim","gelombang","angin","badai","hujan","melaut","parkir perahu"] },
    { id:"lingkungan",title:"Penanganan Ekosistem dan Sampah",   text:"Limbah atau pencemaran terumbu karang mengemuka di media. Koordinasikan aksi bersih pantai terpadu dan pengawasan izin pembuangan limbah.", humasRec:"Rilis dokumentasi aksi bersih pantai DKP bersama komunitas serta edukasi pentingnya menjaga kelestarian terumbu karang.", keywords:["lingkungan","sampah","konservasi","terumbu","plastik","limbah","cemar","kuta","drainase"] },
    { id:"harga",     title:"Stabilisasi Harga dan Distribusi",  text:"Fluktuasi harga ikan atau distribusi terganggu terdeteksi. Koordinasi dengan dinas terkait untuk intervensi pasar.", humasRec:"Rilis data harga referensi ikan di pasar utama dan informasikan langkah stabilisasi harga kepada publik.", keywords:["harga","mahal","naik","turun","langka","stok","pasar","distribusi","ekspor","cold storage"] },
    { id:"sosial",    title:"Mediasi Konflik Nelayan",           text:"Isu konflik sosial nelayan terdeteksi di media. Disarankan koordinasi dengan dinas perikanan setempat dan kepala desa nelayan.", humasRec:"Fasilitasi dialog antara nelayan tradisional dan pemangku kepentingan melalui forum resmi DKP.", keywords:["konflik","sengketa","nelayan","tradisional","modern","jukung","zona"] },
    { id:"lainnya",   title:"Koordinasi Tanggap Isu Publik",     text:"Isu negatif lainnya terdeteksi di media. Disarankan koordinasi cepat antar bidang dan dinas perikanan setempat.", keywords:[] }
  ];

  function getRecGroup(b) {
    const txt = ((b.judul||"")+" "+(b.ringkasan||"")+" "+(b.topik||"")).toLowerCase();
    for (let i = 0; i < recGroups.length - 1; i++) {
      if (recGroups[i].keywords.some(kw => txt.includes(kw))) return recGroups[i];
    }
    return recGroups[recGroups.length - 1];
  }

  const groupMap = {};
  pageItems.forEach(b => {
    const g = getRecGroup(b);
    if (!groupMap[g.id]) groupMap[g.id] = { ...g, news: [] };
    groupMap[g.id].news.push(b);
  });
  const activeGroups = recGroups
    .filter(g => groupMap[g.id])
    .sort((a, b) => {
      const da = parseTanggal(groupMap[a.id].news[0].tgl_publikasi || groupMap[a.id].news[0].tgl_analisis) || new Date(0);
      const db = parseTanggal(groupMap[b.id].news[0].tgl_publikasi || groupMap[b.id].news[0].tgl_analisis) || new Date(0);
      return db - da;
    });

  let globalIdx = 0;
  const html = activeGroups.map(gDef => {
    const g = groupMap[gDef.id];
    const escTitle = g.title.replace(/'/g,"\\'").replace(/"/g,"&quot;");
    const escText  = g.text.replace(/'/g,"\\'").replace(/"/g,"&quot;");
    const escHumas = g.humasRec.replace(/'/g,"\\'").replace(/"/g,"&quot;");

    const rows = g.news.map(b => {
      globalIdx++;
      const idx = globalIdx;
      const regency = getNewsRegion(b);
      const region = regency ? regency.charAt(0).toUpperCase() + regency.slice(1).toLowerCase() : "";
      const topicText = b.topik || "Isu Perikanan";
      const dateStr = formatTanggal(b.tgl_publikasi || b.tgl_analisis);
      const newsId = b.id || b.id_berita || "";

      return `<div class="berita-row" style="animation-delay:${Math.min(idx-1,8)*.04}s;" onclick="showNewsDetail('${newsId}')">
        <div style="display:flex;gap:12px;min-width:0;">
          <div class="berita-row-num">${String(idx).padStart(2,'0')}</div>
          <div style="min-width:0;flex:1;">
            <div class="berita-row-title">${b.judul || "(tanpa judul)"}</div>
            <div class="berita-row-meta">${b.sumber || "Sumber"} &middot; ${dateStr}</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;">
              <span class="berita-badge berita-badge-topic">${topicText}</span>
              ${region ? `<span class="berita-badge berita-badge-region">${region}</span>` : ""}
            </div>
          </div>
        </div>
      </div>`;
    }).join("");

    return `
      <div class="berita-group-header">
        <span class="berita-group-title">${g.title}</span>
        <span class="berita-group-count">${g.news.length} berita</span>
        <button class="berita-group-rec-btn" onclick="event.stopPropagation();showSingleRecommendationModal('${escTitle}','${escText}','${escHumas}')">
          Lihat Rekomendasi
        </button>
      </div>
      ${rows}`;
  }).join("");

  el.innerHTML = html;
  if (paginationEl) paginationEl.style.display = "flex";
  if (loadMoreBtn) loadMoreBtn.style.display = shown < total ? "inline-flex" : "none";
  if (showLessBtn) showLessBtn.style.display = beritaPage > 1 ? "inline-flex" : "none";
}

function switchEwsTab(tabId) {
  document.querySelectorAll('.ews-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  const sectBerita = $('section-berita');
  const sectHumas = $('section-humas');
  const sectLingkungan = $('section-lingkungan');

  if (sectBerita) sectBerita.classList.toggle('active', tabId === 'berita');
  if (sectHumas) sectHumas.classList.toggle('active', tabId === 'humas');
  if (sectLingkungan) sectLingkungan.classList.toggle('active', tabId === 'lingkungan');
}

function switchLingkunganSubtab(subTabId) {
  const btnRedTide = $("btn-subtab-redtide");
  const btnBleaching = $("btn-subtab-bleaching");
  const subRedTide = $("subpage-redtide");
  const subBleaching = $("subpage-bleaching");
  const eduRedTide = $("edu-redtide");
  const eduBleaching = $("edu-bleaching");

  if (subTabId === 'redtide') {
    if (btnRedTide) btnRedTide.classList.add('active');
    if (btnBleaching) btnBleaching.classList.remove('active');
    if (subRedTide) subRedTide.style.display = 'block';
    if (subBleaching) subBleaching.style.display = 'none';
    if (eduRedTide) eduRedTide.style.display = 'block';
    if (eduBleaching) eduBleaching.style.display = 'none';
  } else {
    if (btnRedTide) btnRedTide.classList.remove('active');
    if (btnBleaching) btnBleaching.classList.add('active');
    if (subRedTide) subRedTide.style.display = 'none';
    if (subBleaching) subBleaching.style.display = 'block';
    if (eduRedTide) eduRedTide.style.display = 'none';
    if (eduBleaching) eduBleaching.style.display = 'block';
  }
}

function selectSentimenFilter(sentimen) {
  selectedBeritaSentimen = (selectedBeritaSentimen === sentimen) ? "" : sentimen;
  beritaPage = 1;
  renderSentimenPanel();
  renderTopikPills();
  renderBeritaFeed(allBerita);
}

function selectTopicFilter(topicName) {
  selectedTopic = (selectedTopic === topicName) ? "" : topicName;
  beritaPage = 1;
  renderTopikPills();
  renderBeritaFeed(allBerita);
}

function clearBeritaFilters() {
  selectedBeritaSentimen = "";
  selectedTopic = "";
  selectedBeritaRegion = "";
  beritaPage = 1;
  renderSentimenPanel();
  renderTopikPills();
  renderBeritaFeed(allBerita);
}

function loadMoreBerita() {
  beritaPage++;
  renderBeritaFeed(allBerita);
}

function showLessBerita() {
  beritaPage = 1;
  renderBeritaFeed(allBerita);
  const sectBerita = $('section-berita');
  if (sectBerita) sectBerita.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Humas Content ──────────────────────────────
function renderHumasStats(allKonten) {
  const approved = allKonten.filter(k => (k.status || "").toUpperCase() === "DISETUJUI");
  const total = approved.length;
  const bidsMap = {}; 
  LIST_BIDANG.forEach(b => bidsMap[b] = 0);
  
  approved.forEach(k => { 
    const b = k.bidang ? k.bidang.split(" - ")[0].toUpperCase().trim() : ""; 
    for (const key of LIST_BIDANG) { 
      if (b.includes(key) || key.includes(b)) { 
        bidsMap[key]++; 
        break; 
      } 
    } 
  });
  
  const sortedBidang = Object.entries(bidsMap).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).map(([name,count]) => ({ name, count }));

  const statsContainer = $("humas-stats-container");
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div style="background:var(--ink2);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:16px;">
          <span style="font-size:11px;font-weight:700;color:var(--muted);font-family:var(--sans);text-transform:uppercase;letter-spacing:.08em;">Total Konten &amp; Kontribusi Bidang</span>
          <span style="font-size:20px;font-weight:800;font-family:var(--mono);color:var(--wave);">${total} <small style="font-size:10px;font-weight:normal;color:var(--muted);">konten</small></span>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;padding:4px 0;">
          ${sortedBidang.map(i => { const pct = total ? ((i.count / total) * 100).toFixed(0) : 0; return `
              <div style="cursor:pointer;" onclick="showBidangHumasDetail('${i.name}')">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:10px;font-weight:600;">
                  <span style="color:var(--text);font-family:var(--sans);">${i.name}</span>
                  <span style="color:var(--muted);font-family:var(--mono);font-weight:700;">${i.count} (${pct}%)</span>
                </div>
                <div style="height:10px;background:rgba(0,85,170,0.05);border-radius:5px;overflow:hidden;border:1px solid rgba(0,85,170,0.04);">
                  <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--wave),var(--foam));border-radius:5px;transition:width .8s cubic-bezier(0.1,1,0.1,1);"></div>
                </div>
              </div>`; }).join("")}
        </div>
      </div>`;
  }

  const feedContainer = $("humas-feed-container");
  if (feedContainer) {
    if (approved.length === 0) {
      feedContainer.innerHTML = `<div class="empty-state">Belum ada konten humas yang dipublikasikan.</div>`;
    } else {
      const latest = [...approved].reverse().slice(0, 5);
      feedContainer.innerHTML = latest.map((k, i) => {
        const platformIcon = k.platform === "Instagram" ? "📸" : k.platform === "YouTube" ? "🎥" : k.platform === "Website" ? "🌐" : "📢";
        const linkHtml = k.link_konten || k.linkKonten ? `<a href="${k.link_konten || k.linkKonten}" target="_blank" rel="noopener" class="feed-card-link" onclick="event.stopPropagation();">↗</a>` : "";
        return `
          <div class="feed-card" style="animation-delay:${Math.min(i, 6) * 0.05}s;">
            ${linkHtml}
            <div class="feed-title" style="font-weight:700; font-size:12px; color:var(--text); line-height:1.4; margin-bottom:6px;">${k.namaKonten || k.nama_konten || "(tanpa judul)"}</div>
            <div class="feed-meta" style="font-size:10px; color:var(--muted); font-family:var(--sans); display:flex; align-items:center; gap:6px;">
              <span class="tag tag-topik" style="font-size:9px; background:rgba(0,119,230,0.06); color:var(--wave); font-weight:700; padding:2px 6px; border-radius:4px; font-family:var(--mono);">${k.bidang ? k.bidang.split(" - ")[0] : "UMUM"}</span>
              <span class="feed-meta-sep">&middot;</span>
              <span>${platformIcon} ${k.platform || "Media"}</span>
              ${k.tanggalPosting || k.tanggal_posting || k.tanggal_submit ? `<span class="feed-meta-sep">&middot;</span><span>${formatTanggal(k.tanggalPosting || k.tanggal_posting || k.tanggal_submit)}</span>` : ""}
            </div>
          </div>`;
      }).join("");
    }
  }

  const recContainer = $("ews-humas-recommendation");
  if (recContainer) {
    let recommendations = [];
    
    if (total < 10) {
      recommendations.push({
        type: "WARNING",
        title: "Tingkatkan Frekuensi Publikasi",
        text: total === 0
          ? `Belum ada konten publikasi disetujui bulan ini. Koordinasikan dengan seluruh bidang untuk mulai mempublikasikan kegiatan pelayanan publik.`
          : `Baru terpublikasi <strong>${total} konten</strong> bulan ini. Dorong peningkatan rilis berita dan infografis pelayanan publik minimal 3 kali seminggu.`
      });
    }

    const inactiveBidang = sortedBidang.filter(b => b.count === 0).map(b => b.name);
    if (total > 0 && inactiveBidang.length > 0 && inactiveBidang.length < LIST_BIDANG.length) {
      recommendations.push({
        type: "WARNING",
        title: "Dorong Kontribusi Bidang Inaktif",
        text: `Bidang <strong>${inactiveBidang.join(", ")}</strong> belum memiliki konten disetujui bulan ini. Koordinasikan untuk publikasi kegiatan bidang.`
      });
    }

    const platformCounts = {};
    approved.forEach(k => { if (k.platform) platformCounts[k.platform] = (platformCounts[k.platform] || 0) + 1; });
    const topPlatform = Object.entries(platformCounts).sort((a,b) => b[1]-a[1])[0];
    if (topPlatform && topPlatform[0] === "Instagram" && topPlatform[1] / total > 0.6) {
      recommendations.push({
        type: "NORMAL",
        title: "Diversifikasi Saluran Media",
        text: `Kanal <strong>Instagram</strong> sangat mendominasi (${Math.round(topPlatform[1]/total*100)}%). Pertimbangkan penulisan artikel rilis pers di Website Resmi DKP untuk memperluas jangkauan SEO.`
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: "NORMAL",
        title: "Kinerja Humas Optimal",
        text: "Publikasi informasi publik berjalan konsisten dan tersebar merata di setiap bidang. Pertahankan kualitas konten edukasi kelautan."
      });
    }

    const uniqueRecs = [];
    const seenTitles = new Set();
    recommendations.forEach(r => { if (!seenTitles.has(r.title)) { seenTitles.add(r.title); uniqueRecs.push(r); } });

    let bgColor = "rgba(13,148,136,0.04)";
    let borderColor = "rgba(13,148,136,0.2)";
    let textColor = "var(--green)";
    let badgeText = "KINERJA AKTIF";
    
    if (total < 5) {
      bgColor = "rgba(220,38,38,0.04)";
      borderColor = "rgba(220,38,38,0.2)";
      textColor = "var(--red)";
      badgeText = "KINERJA RENDAH";
    } else if (total < 10) {
      bgColor = "rgba(202,138,4,0.05)";
      borderColor = "rgba(202,138,4,0.2)";
      textColor = "var(--yellow)";
      badgeText = "KINERJA CUKUP";
    }

    recContainer.innerHTML = `
      <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:16px;padding:16px;font-size:12px;line-height:1.55;transition:all .3s ease;">
        <div style="font-weight:700;color:${textColor};margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;font-size:13px;flex-wrap:wrap;gap:6px;">
          <span>Analisis Kinerja &amp; Strategi Konten <small style="font-size:9px;opacity:.8;font-weight:normal;font-family:var(--mono);background:${borderColor};color:${textColor};padding:2px 6px;border-radius:4px;margin-left:4px;">AI-POWERED</small></span>
          <span style="font-size:10px;font-family:var(--mono);font-weight:700;">${badgeText}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${uniqueRecs.map(r => `<div style="background:rgba(255,255,255,0.65);padding:10px 12px;border-radius:10px;border:1px solid ${borderColor};"><div style="font-weight:700;color:var(--text);margin-bottom:2px;">${r.title}</div><div style="color:var(--muted);font-size:11px;line-height:1.45;">${r.text}</div></div>`).join("")}
        </div>
      </div>`;
  }
}

// ── Modals ─────────────────────────────────────
function showNewsDetail(id) {
  const b = allBerita.find(x => x.id === id || x.id_berita === id); 
  if (!b) return;
  const modal = $("ews-modal"); 
  const title = $("ews-modal-title"); 
  const body = $("ews-modal-body");
  title.textContent = "Detail Analisis Berita";
  const sc = b.sentimen === "POSITIF" ? "var(--green)" : b.sentimen === "NEGATIF" ? "var(--red)" : "var(--yellow)";
  
  body.innerHTML = `
    <div style="font-weight:700;font-size:15px;margin-bottom:12px;line-height:1.4;">${b.judul || "(tanpa judul)"}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
      <span class="tag" style="background:${sc}22;color:${sc};border:1px solid ${sc}44;font-family:var(--mono);font-size:10px;font-weight:700;padding:4px 10px;border-radius:99px;display:inline-flex;align-items:center;"><span class="tag-dot" style="background:${sc}"></span>${b.sentimen || "NETRAL"}</span>
      ${b.topik ? `<span class="tag tag-topik" style="background:var(--ink3);color:var(--muted);font-family:var(--mono);font-size:10px;font-weight:700;padding:4px 10px;border-radius:99px;">${b.topik}</span>` : ""}
    </div>
    <div style="font-size:12px;color:var(--muted);font-family:var(--mono);margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:10px;">Sumber: ${b.sumber || "?"}<br/>Tanggal Publikasi: ${formatTanggal(b.tgl_publikasi)}</div>
    <div style="margin-bottom:20px;"><div style="font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-family:var(--sans);color:var(--muted);margin-bottom:6px;">Ringkasan AI</div><div style="font-size:13px;line-height:1.6;color:var(--text);background:var(--ink2);padding:12px 14px;border-radius:10px;border:1px solid var(--border);">${b.ringkasan || "Tidak ada ringkasan."}</div></div>
    ${b.url && b.url !== "#" ? `<a href="${b.url}" target="_blank" rel="noopener" style="display:block;text-align:center;background:linear-gradient(135deg,var(--sea),var(--wave));color:#fff;padding:12px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:700;transition:opacity .2s;">Buka Sumber Berita Asli ↗</a>` : ""}`;
  modal.style.display = "flex";
}

function showBidangHumasDetail(bidangName) {
  const approved = allHumas.filter(k => { 
    if (k.status !== "DISETUJUI") return false; 
    const b = k.bidang ? k.bidang.split(" - ")[0].toUpperCase().trim() : ""; 
    const q = bidangName.toUpperCase().trim(); 
    return b.includes(q) || q.includes(b); 
  });
  
  const modal = $("ews-modal"); 
  const title = $("ews-modal-title"); 
  const body = $("ews-modal-body");
  title.textContent = `Konten Humas - ${bidangName}`;
  
  if (!approved.length) { 
    body.innerHTML = `<div style="text-align:center;color:var(--muted);padding:20px;font-style:italic;">Belum ada kontribusi dari bidang ini.</div>`; 
  } else { 
    body.innerHTML = `
      <div style="font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-family:var(--sans);color:var(--muted);margin-bottom:12px;">Daftar Konten Disetujui (${approved.length})</div>
      <div style="display:flex;flex-direction:column;gap:10px;max-height:50vh;overflow-y:auto;padding-right:4px;">
        ${approved.map((k, i) => {
          const plat = k.platform || "Platform"; 
          const nama = k.nama_konten || k.namaKonten || "Konten Tanpa Nama";
          const tgl = k.tanggal_posting || k.tanggalPosting || "-"; 
          const peg = k.nama_pegawai || k.namaPegawai || "-";
          const link = k.linkKonten || k.link_konten || ""; 
          const img = k.screenshotUrl || k.screenshot_url || "";
          return `<div style="background:var(--ink2);border:1px solid var(--border);border-radius:12px;padding:12px 14px;cursor:pointer;transition:all .2s;" onclick="const d=document.getElementById('hd-${i}');d.style.display=d.style.display==='none'?'block':'none';">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;"><div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:2px;">${nama}</div><span style="font-size:12px;color:var(--muted);">▼</span></div>
            <div style="font-size:11px;color:var(--muted);display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;"><span>Platform: <strong>${plat}</strong></span><span>&middot;</span><span>Oleh: ${peg}</span><span>&middot;</span><span>Tanggal: ${tgl}</span></div>
            <div id="hd-${i}" style="display:none;margin-top:10px;border-top:1px dashed var(--border);padding-top:10px;animation:fadeUp .2s ease;">
              ${link ? `<div style="margin-bottom:8px;"><span style="font-size:10px;text-transform:uppercase;font-family:var(--sans);color:var(--muted);display:block;margin-bottom:2px;">Link Konten</span><a href="${link}" target="_blank" rel="noopener" style="font-size:12px;color:var(--wave);word-break:break-all;text-decoration:underline;" onclick="event.stopPropagation();">${link} ↗</a></div>` : ""}
              ${img ? `<div><span style="font-size:10px;text-transform:uppercase;font-family:var(--sans);color:var(--muted);display:block;margin-bottom:4px;">Bukti Tayang</span><div style="border-radius:8px;overflow:hidden;border:1px solid var(--border);background:#fff;max-height:200px;"><img src="${img}" style="width:100%;max-height:200px;object-fit:contain;display:block;" alt="Screenshot"/></div></div>` : `<div style="font-size:11px;color:var(--muted);font-style:italic;margin-top:4px;">Tidak ada screenshot.</div>`}
            </div></div>`; 
        }).join("")}
      </div>`; 
  }
  modal.style.display = "flex";
}

function closeEwsModal() { 
  $("ews-modal").style.display = "none"; 
}

function showSingleRecommendationModal(recTitle, recText, recHumas) {
  const modal = $("ews-modal");
  const title = $("ews-modal-title");
  const body = $("ews-modal-body");
  if (!modal || !title || !body) return;

  title.innerText = recTitle;

  body.innerHTML = `
    <div style="font-family: var(--sans); line-height: 1.6; color: var(--text);">
      <p style="font-size: 13.5px; color: var(--muted); margin-bottom: 20px; font-weight: 500;">
        Rencana aksi strategis yang direkomendasikan sistem AI untuk topik ini:
      </p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
        <div style="background: rgba(220,38,38,0.02); padding: 16px; border-radius: 12px; border: 1px solid var(--border); border-left: 4px solid var(--red);">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 14px;">🚨</span>
            <strong style="color: var(--red); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; font-family: var(--sans);">Tindakan Lapangan DKP</strong>
          </div>
          <span style="color: var(--text); font-size: 13.5px; line-height: 1.55; display: block;">${recText}</span>
        </div>
        <div style="background: rgba(0,119,230,0.02); padding: 16px; border-radius: 12px; border: 1px solid var(--border); border-left: 4px solid var(--wave);">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 14px;">📢</span>
            <strong style="color: var(--wave); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; font-family: var(--sans);">Publikasi Humas DKP</strong>
          </div>
          <span style="color: var(--text); font-size: 13.5px; line-height: 1.55; display: block;">${recHumas}</span>
        </div>
      </div>
    </div>
  `;
  
  modal.style.display = "flex";
}

function renderBeritaRecommendations() {
  const distContainer = $("ews-berita-sentiment-distribution");
  const summaryContainer = $("ews-berita-issue-summary");
  if (!distContainer && !summaryContainer) return;

  const news7Hari = getBerita7Hari(allBerita);
  const posCount = news7Hari.filter(b => (b.sentimen || "").toUpperCase() === "POSITIF").length;
  const netCount = news7Hari.filter(b => (b.sentimen || "").toUpperCase() === "NETRAL").length;
  const negCount = news7Hari.filter(b => (b.sentimen || "").toUpperCase() === "NEGATIF").length;
  const total = posCount + netCount + negCount;

  let dominant = "netral";
  let dominantCount = netCount;
  if (posCount >= netCount && posCount >= negCount) {
    dominant = "positif";
    dominantCount = posCount;
  } else if (negCount >= posCount && negCount >= netCount) {
    dominant = "negatif";
    dominantCount = negCount;
  }
  const pct = total > 0 ? Math.round(dominantCount / total * 100) : 0;

  const negTopicCounts = {};
  news7Hari.forEach(b => {
    if (b.topik && (b.sentimen || "").toUpperCase() === "NEGATIF") {
      const t = b.topik.trim();
      negTopicCounts[t] = (negTopicCounts[t] || 0) + 1;
    }
  });
  
  let maxNegTopic = "";
  let maxNegCount = 0;
  Object.entries(negTopicCounts).forEach(([topic, count]) => {
    if (count > maxNegCount) {
      maxNegCount = count;
      maxNegTopic = topic;
    }
  });

  let advice = "";
  if (maxNegTopic) {
    const lTopic = maxNegTopic.toLowerCase();
    if (lTopic.includes("solar") || lTopic.includes("bbm") || lTopic.includes("bakar")) {
      advice = "Perlu dipantau ketersediaan bahan bakar solar subsidi bagi nelayan untuk mencegah kelangkaan meluas.";
    } else if (lTopic.includes("illegal") || lTopic.includes("fishing") || lTopic.includes("bom") || lTopic.includes("tindak")) {
      advice = "Disarankan koordinasi dengan Polairud untuk meningkatkan patroli pengawasan zona tangkap.";
    } else if (lTopic.includes("cuaca") || lTopic.includes("gelombang") || lTopic.includes("angin") || lTopic.includes("ekstrim")) {
      advice = "Penting untuk merilis imbauan keselamatan dan peringatan dini bagi nelayan tradisional di wilayah terdampak.";
    } else if (lTopic.includes("sampah") || lTopic.includes("pencemaran") || lTopic.includes("limbah") || lTopic.includes("plastik")) {
      advice = "Perlu koordinasi cepat pembersihan pantai serta sosialisasi pengelolaan sampah plastik.";
    } else {
      advice = `Topik negatif terdeteksi pada <strong>${maxNegTopic}</strong>. Disarankan koordinasi internal bidang terkait.`;
    }
  } else if (dominant === 'positif') {
    advice = "Sentimen positif didominasi keberhasilan sektor budidaya/konservasi, terus pertahankan publikasi humas.";
  } else {
    advice = "Situasi terpantau kondusif secara umum, tetap pantau tren sentimen berita harian.";
  }

  let sumScore = 0, countScore = 0;
  news7Hari.forEach(b => { 
    const s = parseFloat(b.skor_sentimen !== undefined ? b.skor_sentimen : b.skorSentimen); 
    if (!isNaN(s)) { 
      sumScore += s; 
      countScore++; 
    } 
  });
  const avgScore = countScore > 0 ? sumScore / countScore : 0;
  
  let bgColor = "rgba(202,138,4,0.05)";
  let borderColor = "rgba(202,138,4,0.15)";
  let textColor = "var(--yellow)";
  let badgeText = "STABIL (0.00)";

  if (avgScore > 0.05) { 
    const int = Math.min(avgScore, 1.0); 
    bgColor = `rgba(13,148,136,${0.03 + 0.08 * int})`; 
    borderColor = `rgba(13,148,136,${0.15 + 0.15 * int})`; 
    textColor = `var(--green)`; 
    badgeText = `KONDISI BAIK (${avgScore.toFixed(2)})`; 
  } else if (avgScore < -0.05) { 
    const int = Math.min(Math.abs(avgScore), 1.0); 
    bgColor = `rgba(220,38,38,${0.03 + 0.08 * int})`; 
    borderColor = `rgba(220,38,38,${0.15 + 0.15 * int})`; 
    textColor = `var(--red)`; 
    badgeText = `WASPADA (${avgScore.toFixed(2)})`; 
  }

  if (distContainer) {
    const pctPos = total > 0 ? Math.round(posCount/total*100) : 0;
    const pctNet = total > 0 ? Math.round(netCount/total*100) : 0;
    const pctNeg = total > 0 ? Math.round(negCount/total*100) : 0;
    distContainer.innerHTML = `
      <div class="berita-stat-strip">
        <div class="berita-stat-box" style="background:rgba(220,38,38,0.08);border-color:rgba(220,38,38,0.35);">
          <div class="berita-stat-num" style="color:var(--red);">${negCount}</div>
          <div class="berita-stat-lbl">Negatif</div>
        </div>
        <div class="berita-stat-box">
          <div class="berita-stat-num">${netCount}</div>
          <div class="berita-stat-lbl">Netral</div>
        </div>
        <div class="berita-stat-box" style="background:rgba(13,148,136,0.08);border-color:rgba(13,148,136,0.35);">
          <div class="berita-stat-num" style="color:var(--green);">${posCount}</div>
          <div class="berita-stat-lbl">Positif</div>
        </div>
        <div class="berita-stat-box">
          <div style="font-size:9.5px;font-weight:700;font-family:var(--mono);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px;">${badgeText}</div>
          <div style="height:5px;background:var(--border);border-radius:2px;overflow:hidden;display:flex;margin-bottom:7px;">
            <div style="width:${pctPos}%;background:var(--green);transition:width .6s ease;"></div>
            <div style="width:${pctNet}%;background:var(--yellow);transition:width .6s ease;"></div>
            <div style="width:${pctNeg}%;background:var(--red);transition:width .6s ease;"></div>
          </div>
          <div style="font-size:10px;color:var(--muted);font-family:var(--sans);">${total} berita &mdash; 7 hari terakhir</div>
        </div>
      </div>`;
  }

  if (summaryContainer) {
    const summaryClass = dominant === 'negatif' ? 'sent-negatif' : dominant === 'positif' ? 'sent-positif' : 'sent-neutral';
    summaryContainer.innerHTML = `
      <div class="berita-summary-box ${summaryClass}">
        <div class="berita-summary-label">Ringkasan Isu</div>
        <p style="margin:0;font-size:13px;color:var(--text);line-height:1.6;">
          Kondisi opini publik saat ini berada pada sentimen <strong>${dominant.toUpperCase()}</strong> (${pct}% dari total berita). ${advice}
        </p>
      </div>`;
  }
}

// ── Environmental Heatmaps ─────────────────────
function getLastCheckedTime() {
  const now = new Date();
  if (now.getHours() >= 6) {
    return "Dicek otomatis: Hari ini, 06.00 WITA";
  } else {
    return "Dicek otomatis: Kemarin, 06.00 WITA";
  }
}

function generateHeatmapHtml(alerts, type) {
  const today = new Date();
  let normalCount = 0;
  let boxesHtml = "";
  const DAYS = 14;
  
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const alert = alerts.find(a => {
      if (!a.tgl_alert) return false;
      return a.tgl_alert.trim() === dateStr;
    });
    
    let color = "var(--green)";
    let statusText = "Kondisi Normal";
    let scoreText = "";
    let isWarning = false;
    
    if (alert) {
      const isResolved = (alert.status_sementara || "").toLowerCase() === "selesai" || 
                         (alert.status_final || "").toLowerCase() === "normal";
      
      const score = parseFloat(alert.anomaly_score);
      scoreText = ` (Anomaly Score: ${score.toFixed(2)})`;
      
      if (type === "redtide") {
        if (score >= 2.5) {
          color = "var(--red)";
          statusText = isResolved ? "Bahaya (Teratasi)" : "Bahaya - Anomali Tinggi";
          isWarning = !isResolved;
        } else if (score >= 1.5) {
          color = "var(--yellow)";
          statusText = isResolved ? "Waspada (Teratasi)" : "Waspada - Anomali Sedang";
          isWarning = !isResolved;
        }
      } else {
        if (score >= 2.0) {
          color = "var(--red)";
          statusText = isResolved ? "Bahaya (Teratasi)" : "Bahaya - Suhu Ekstrem";
          isWarning = !isResolved;
        } else if (score >= 1.0) {
          color = "var(--yellow)";
          statusText = isResolved ? "Waspada (Teratasi)" : "Waspada - Suhu Hangat";
          isWarning = !isResolved;
        }
      }
    }
    
    if (!isWarning) {
      normalCount++;
    }
    
    const formattedDate = formatTanggal(dateStr);
    const tooltipText = `${formattedDate}: ${statusText}${scoreText}`;
    
    boxesHtml += `
      <div class="heatmap-box" 
           style="background: ${color};" 
           title="${tooltipText}"
           onclick="if('${alert ? alert.id_kejadian : ''}') { showEnvDetail('${type}', '${alert ? alert.id_kejadian : ''}'); }">
      </div>
    `;
  }
  
  const pct = ((normalCount / DAYS) * 100).toFixed(0);
  
  return `
    <div style="margin-top:12px; padding:12px 14px; background:var(--ink2); border:1px solid var(--border); border-radius:14px; width: 100%;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-size:10.5px; font-weight:700; color:var(--muted); font-family:var(--sans); text-transform:uppercase; letter-spacing:0.05em;">Riwayat 14 Hari Terakhir</span>
        <span style="font-size:10px; font-weight:700; color:${pct === '100' ? 'var(--green)' : 'var(--yellow)'}; font-family:var(--mono);">${pct}% Aman</span>
      </div>
      <div class="heatmap-wrapper">
        <div style="display:flex; gap:6px; margin-bottom:8px; justify-content: space-between; align-items: center; width: 100%;">
          ${boxesHtml}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:9px; color:var(--muted); font-family:var(--sans); margin-top:6px; font-weight:500;">
          <span>14 hari lalu</span>
          <div style="display:flex; gap:8px; align-items:center;">
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="display:inline-block; width:6px; height:6px; border-radius:1.5px; background:var(--green);"></span>Aman</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="display:inline-block; width:6px; height:6px; border-radius:1.5px; background:var(--yellow);"></span>Waspada</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span style="display:inline-block; width:6px; height:6px; border-radius:1.5px; background:var(--red);"></span>Bahaya</span>
          </div>
          <span>Hari ini</span>
        </div>
      </div>
    </div>
  `;
}

function setRedTideSlide(idx) {
  currentRedTideSlide = idx;
  renderRedTide();
}

function setBleachingSlide(idx) {
  currentBleachingSlide = idx;
  renderBleaching();
}

function renderRedTide() {
  const container = $("redtide-feed-container");
  if (!container) return;

  const stations = [
    { name: "Nusa Penida", code: "NPE", lat: -8.729, lon: 115.542 },
    { name: "Amed", code: "AMD", lat: -8.336, lon: 115.654 },
    { name: "Pemuteran", code: "PMT", lat: -8.146, lon: 114.629 },
    { name: "Selat Bali", code: "SBE", lat: -8.223, lon: 114.437 }
  ];

  if (currentRedTideSlide < 0) currentRedTideSlide = 0;
  if (currentRedTideSlide >= stations.length) currentRedTideSlide = stations.length - 1;

  const st = stations[currentRedTideSlide];
  const alert = allRedTide.find(r => r.lokasi.toLowerCase().includes(st.name.toLowerCase()) && (r.status_sementara || "").toLowerCase() !== "selesai");

  let bgAlert, borderAlert, statusBadge, scColor, valColor;
  let val1, label1, val2, label2;
  let notes, meta, actionHtml;

  if (alert) {
    const score = parseFloat(alert.anomaly_score);
    const isDanger = score >= 2.5;
    scColor = isDanger ? "var(--red)" : "var(--yellow)";
    valColor = isDanger ? "var(--red)" : "var(--yellow)";
    bgAlert = isDanger ? "rgba(220,38,38,0.03)" : "rgba(202,138,4,0.03)";
    borderAlert = isDanger ? "rgba(220,38,38,0.15)" : "rgba(202,138,4,0.15)";
    
    statusBadge = `
      <span style="display: inline-flex; align-items: center; gap: 4px; color: ${scColor}; font-weight: 700;">
        <span style="font-size: 11px;">⚠️</span>
        ${isDanger ? 'BAHAYA — ANOMALI TINGGI' : 'WASPADA — ANOMALI SEDANG'}
        &middot; HARI KE-${alert.hari_ke || 1}
      </span>
    `;
    val1 = `${alert.chl_value.toFixed(2)}`;
    label1 = "Chlorophyll-a (mg/m³)";
    val2 = `${score.toFixed(2)} σ`;
    label2 = "Anomaly Score";
    notes = alert.catatan_lapangan || "Tidak ada catatan lapangan dari petugas.";
    meta = `Petugas: ${alert.petugas || "Sistem"} &middot; ${formatTanggal(alert.tgl_alert)}`;
    
    actionHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--muted); border-top:1px dashed var(--border); padding-top:10px; margin-top:10px; cursor:pointer;"
           onclick="showEnvDetail('redtide', '${alert.id_kejadian}')">
        <span>Petugas: <strong>${alert.petugas || "Sistem"}</strong></span>
        <span style="color:var(--wave); font-weight:700;">Lihat Detail Analisis ➔</span>
      </div>
    `;
  } else {
    scColor = "var(--muted)";
    valColor = "var(--green)";
    bgAlert = "var(--ink)";
    borderAlert = "var(--border)";
    
    statusBadge = `
      <span style="display: inline-flex; align-items: center; gap: 6px; color: var(--green); font-weight: 700; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.05em;">
        <span style="width: 16px; height: 16px; border-radius: 50%; background: rgba(13,148,136,0.1); color: var(--green); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; margin-right: 4px;">✓</span>
        Kondisi Normal
      </span>
    `;
    const lastAlert = allRedTide.find(r => r.lokasi.toLowerCase().includes(st.name.toLowerCase()));
    const valChl = lastAlert ? lastAlert.chl_baseline : 0.08;
    val1 = `${valChl.toFixed(2)}`;
    label1 = "Chlorophyll-a (mg/m³)";
    val2 = "0.00 σ";
    label2 = "Anomaly Score";
    notes = "Kondisi air jernih dan stabil. Tidak terdeteksi adanya fenomena alga mekar (Red Tide) di stasiun ini.";
    const checkDate = lastAlert ? lastAlert.tgl_status_final || lastAlert.tgl_alert : "2026-06-25";
    meta = `Pemeriksaan Terakhir: ${formatTanggal(checkDate)} (Sistem Copernicus)`;
    
    actionHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--muted); border-top:1px dashed var(--border); padding-top:10px; margin-top:10px;">
        <span>Status Stasiun: <strong style="color:var(--green)">KONDUSIF</strong></span>
        <span style="color:var(--muted); font-weight:600;">Data Copernicus Terbaru</span>
      </div>
    `;
  }

  const lastChecked = getLastCheckedTime();
  const stationAlerts = allRedTide.filter(r => r.lokasi.toLowerCase().includes(st.name.toLowerCase()));
  const heatmapHtml = generateHeatmapHtml(stationAlerts, "redtide");

  const stationSelectorHtml = `
    <div style="display: flex; gap: 4px; align-items: center; background: var(--ink2); padding: 3px; border-radius: 10px; border: 1px solid var(--border); flex-shrink: 0;">
      ${stations.map((station, idx) => {
        const isActive = idx === currentRedTideSlide;
        const activeBg = isActive ? 'var(--wave)' : 'transparent';
        const activeColor = isActive ? '#ffffff' : 'var(--muted)';
        return `
          <button onclick="setRedTideSlide(${idx})"
                  style="border: none; background: ${activeBg}; color: ${activeColor}; font-size: 10px; font-family: var(--mono); font-weight: 700; padding: 5px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; outline: none;">
            ${station.code}
          </button>
        `;
      }).join("")}
    </div>
  `;

  const slideCardHtml = `
    <div style="background:${bgAlert}; border:1px solid ${borderAlert}; border-radius:18px; padding:20px; box-shadow: 0 4px 12px rgba(0,0,0,0.01); display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:nowrap;">
          <div>
            <span style="display:block; margin-bottom:4px;">
              ${statusBadge}
            </span>
            <strong style="font-size:clamp(12px,3.5vw,16px); color:var(--text); display:block; font-family: var(--title-sans); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Stasiun ${st.name}</strong>
          </div>
          ${stationSelectorHtml}
        </div>
        
        <span style="font-size:9.5px; color:var(--muted); display:block; line-height:1.4; margin-top:4px; margin-bottom:8px;">${lastChecked}</span>
        <div style="margin-bottom:14px;">
          ${heatmapHtml}
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
          <div style="background:var(--ink); border:1px solid var(--border); border-radius:12px; padding:12px; display:flex; flex-direction:column; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.01);">
            <span style="font-size:9px; color:var(--muted); display:block; font-weight:600; text-transform:uppercase; letter-spacing:0.02em; margin-bottom:4px;">${label1}</span>
            <strong style="font-size:16px; color:${valColor}; font-family:var(--mono);">${val1}</strong>
          </div>
          <div style="background:var(--ink); border:1px solid var(--border); border-radius:12px; padding:12px; display:flex; flex-direction:column; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.01);">
            <span style="font-size:9px; color:var(--muted); display:block; font-weight:600; text-transform:uppercase; letter-spacing:0.02em; margin-bottom:4px;">${label2}</span>
            <strong style="font-size:16px; color:${scColor}; font-family:var(--mono);">${val2}</strong>
          </div>
        </div>
        
        <div style="background:var(--ink2); border:1px solid var(--border); border-radius:10px; padding:10px; margin-bottom:12px;">
          <p style="font-size:12px; color:var(--text); line-height:1.5; margin:0 0 4px 0;">
            ${notes}
          </p>
          <span style="font-size:9.5px; color:var(--muted); font-style:italic; display:block;">
            ${meta}
          </span>
        </div>
      </div>
      ${actionHtml}
    </div>
  `;

  container.innerHTML = slideCardHtml;
}

function renderBleaching() {
  const container = $("bleaching-feed-container");
  if (!container) return;

  const stations = [
    { name: "Nusa Penida", code: "NPE", lat: -8.729, lon: 115.542 },
    { name: "Amed", code: "AMD", lat: -8.336, lon: 115.654 },
    { name: "Pemuteran", code: "PMT", lat: -8.146, lon: 114.629 },
    { name: "Selat Bali", code: "SBE", lat: -8.223, lon: 114.437 }
  ];

  if (currentBleachingSlide < 0) currentBleachingSlide = 0;
  if (currentBleachingSlide >= stations.length) currentBleachingSlide = stations.length - 1;

  const st = stations[currentBleachingSlide];
  const alert = allBleaching.find(b => b.lokasi.toLowerCase().includes(st.name.toLowerCase()) && (b.status_sementara || "").toLowerCase() !== "selesai");

  let bgAlert, borderAlert, statusBadge, scColor, valColor;
  let val1, label1, val2, label2;
  let notes, meta, actionHtml;

  if (alert) {
    const score = parseFloat(alert.anomaly_score);
    const isDanger = score >= 2.0;
    scColor = isDanger ? "var(--red)" : "var(--yellow)";
    valColor = isDanger ? "var(--red)" : "var(--yellow)";
    bgAlert = isDanger ? "rgba(220,38,38,0.03)" : "rgba(202,138,4,0.03)";
    borderAlert = isDanger ? "rgba(220,38,38,0.15)" : "rgba(202,138,4,0.15)";
    
    statusBadge = `
      <span style="display: inline-flex; align-items: center; gap: 4px; color: ${scColor}; font-weight: 700;">
        <span style="font-size: 11px;">⚠️</span>
        ${isDanger ? 'BAHAYA — SUHU EKSTREM' : 'WASPADA — SUHU HANGAT'}
        &middot; HARI KE-${alert.hari_ke || 1}
      </span>
    `;
    val1 = `${alert.sst_value.toFixed(1)} °C`;
    label1 = "SST (°C)";
    val2 = `+${(alert.sst_value - alert.sst_baseline).toFixed(1)} °C`;
    label2 = "SST Anomaly (°C)";
    notes = alert.catatan_lapangan || "Tidak ada catatan lapangan dari petugas.";
    meta = `Petugas: ${alert.petugas || "Sistem"} &middot; ${formatTanggal(alert.tgl_alert)}`;
    
    actionHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--muted); border-top:1px dashed var(--border); padding-top:10px; margin-top:10px; cursor:pointer;"
           onclick="showEnvDetail('bleaching', '${alert.id_kejadian}')">
        <span>Petugas: <strong>${alert.petugas || "Sistem"}</strong></span>
        <span style="color:var(--wave); font-weight:700;">Lihat Detail Analisis ➔</span>
      </div>
    `;
  } else {
    scColor = "var(--muted)";
    valColor = "var(--green)";
    bgAlert = "var(--ink)";
    borderAlert = "var(--border)";
    
    statusBadge = `
      <span style="display: inline-flex; align-items: center; gap: 6px; color: var(--green); font-weight: 700; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.05em;">
        <span style="width: 16px; height: 16px; border-radius: 50%; background: rgba(13,148,136,0.1); color: var(--green); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; margin-right: 4px;">✓</span>
        Kondisi Normal
      </span>
    `;
    const lastAlert = allBleaching.find(b => b.lokasi.toLowerCase().includes(st.name.toLowerCase()));
    const valSST = lastAlert ? lastAlert.sst_baseline : 28.5;
    val1 = `${valSST.toFixed(1)} °C`;
    label1 = "SST (°C)";
    val2 = "+0.0 °C";
    label2 = "SST Anomaly (°C)";
    notes = "Suhu permukaan laut stabil dan berada dalam batas normal. Terumbu karang dalam kondisi sehat.";
    const checkDate = lastAlert ? lastAlert.tgl_status_final || lastAlert.tgl_alert : "2026-06-25";
    meta = `Pemeriksaan Terakhir: ${formatTanggal(checkDate)} (Sistem Copernicus)`;
    
    actionHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--muted); border-top:1px dashed var(--border); padding-top:10px; margin-top:10px;">
        <span>Status Stasiun: <strong style="color:var(--green)">KONDUSIF</strong></span>
        <span style="color:var(--muted); font-weight:600;">Data Copernicus Terbaru</span>
      </div>
    `;
  }

  const lastChecked = getLastCheckedTime();
  const stationAlerts = allBleaching.filter(b => b.lokasi.toLowerCase().includes(st.name.toLowerCase()));
  const heatmapHtml = generateHeatmapHtml(stationAlerts, "bleaching");

  const stationSelectorHtml = `
    <div style="display: flex; gap: 4px; align-items: center; background: var(--ink2); padding: 3px; border-radius: 10px; border: 1px solid var(--border); flex-shrink: 0;">
      ${stations.map((station, idx) => {
        const isActive = idx === currentBleachingSlide;
        const activeBg = isActive ? 'var(--foam)' : 'transparent';
        const activeColor = isActive ? '#ffffff' : 'var(--muted)';
        return `
          <button onclick="setBleachingSlide(${idx})"
                  style="border: none; background: ${activeBg}; color: ${activeColor}; font-size: 10px; font-family: var(--mono); font-weight: 700; padding: 5px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; outline: none;">
            ${station.code}
          </button>
        `;
      }).join("")}
    </div>
  `;

  const slideCardHtml = `
    <div style="background:${bgAlert}; border:1px solid ${borderAlert}; border-radius:18px; padding:20px; box-shadow: 0 4px 12px rgba(0,0,0,0.01); display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:nowrap;">
          <div>
            <span style="display:block; margin-bottom:4px;">
              ${statusBadge}
            </span>
            <strong style="font-size:clamp(12px,3.5vw,16px); color:var(--text); display:block; font-family: var(--title-sans); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Stasiun ${st.name}</strong>
          </div>
          ${stationSelectorHtml}
        </div>
        
        <span style="font-size:9.5px; color:var(--muted); display:block; line-height:1.4; margin-top:4px; margin-bottom:8px;">${lastChecked}</span>
        <div style="margin-bottom:14px;">
          ${heatmapHtml}
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
          <div style="background:var(--ink); border:1px solid var(--border); border-radius:12px; padding:12px; display:flex; flex-direction:column; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.01);">
            <span style="font-size:9px; color:var(--muted); display:block; font-weight:600; text-transform:uppercase; letter-spacing:0.02em; margin-bottom:4px;">${label1}</span>
            <strong style="font-size:16px; color:${valColor}; font-family:var(--mono);">${val1}</strong>
          </div>
          <div style="background:var(--ink); border:1px solid var(--border); border-radius:12px; padding:12px; display:flex; flex-direction:column; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.01);">
            <span style="font-size:9px; color:var(--muted); display:block; font-weight:600; text-transform:uppercase; letter-spacing:0.02em; margin-bottom:4px;">${label2}</span>
            <strong style="font-size:16px; color:${scColor}; font-family:var(--mono);">${val2}</strong>
          </div>
        </div>
        
        <div style="background:var(--ink2); border:1px solid var(--border); border-radius:10px; padding:10px; margin-bottom:12px;">
          <p style="font-size:12px; color:var(--text); line-height:1.5; margin:0 0 4px 0;">
            ${notes}
          </p>
          <span style="font-size:9.5px; color:var(--muted); font-style:italic; display:block;">
            ${meta}
          </span>
        </div>
      </div>
      ${actionHtml}
    </div>
  `;

  container.innerHTML = slideCardHtml;
}

function showEnvDetail(type, id) {
  const modal = $("ews-modal");
  const title = $("ews-modal-title");
  const body = $("ews-modal-body");
  if (!modal || !title || !body) return;
  
  let item = null;
  if (type === "redtide") {
    item = allRedTide.find(x => x.id_kejadian === id);
    if (!item) return;
    
    title.textContent = "Detail Analisis EWS Red Tide";
    const score = parseFloat(item.anomaly_score);
    const isDanger = score >= 2.5;
    const scColor = isDanger ? "var(--red)" : "var(--yellow)";
    
    body.innerHTML = `
      <div style="font-weight:700;font-size:15px;margin-bottom:12px;line-height:1.4;">Pemantauan Red Tide / HAB - Stasiun ${item.lokasi}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        <span class="tag" style="background:${scColor}22;color:${scColor};border:1px solid ${scColor}44;font-family:var(--mono);font-size:10px;font-weight:700;padding:4px 10px;border-radius:99px;display:inline-flex;align-items:center;">
          <span class="tag-dot" style="background:${scColor}"></span>
          ${isDanger ? 'BAHAYA' : 'WASPADA'}
        </span>
        <span class="tag" style="background:var(--ink3);color:var(--muted);font-family:var(--mono);font-size:10px;font-weight:700;padding:4px 10px;border-radius:99px;">
          ${item.status_sementara || "Dalam Pemantauan"}
        </span>
      </div>
      <div style="font-size:12px;color:var(--muted);font-family:var(--mono);margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:10px;">
        Tanggal Alert: ${formatTanggal(item.tgl_alert)}<br/>
        Petugas Lapangan: ${item.petugas || "-"}<br/>
        Koordinat: ${item.lat ? item.lat.toFixed(4) : "-"}, ${item.lng ? item.lng.toFixed(4) : "-"}
      </div>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
        <div style="background:var(--ink2); padding:10px; border-radius:10px; border:1px solid var(--border);">
          <span style="font-size:9.5px; color:var(--muted); display:block; text-transform:uppercase;">Kadar Chlorophyll-a</span>
          <strong style="font-size:14px; color:var(--text); font-family:var(--mono);">${item.chl_value ? item.chl_value.toFixed(2) : "-"} mg/m³</strong>
          <span style="font-size:9px; color:var(--muted); display:block; margin-top:2px;">Baseline: ${item.chl_baseline ? item.chl_baseline.toFixed(2) : "-"} mg/m³</span>
        </div>
        <div style="background:var(--ink2); padding:10px; border-radius:10px; border:1px solid var(--border);">
          <span style="font-size:9.5px; color:var(--muted); display:block; text-transform:uppercase;">Anomaly Score</span>
          <strong style="font-size:14px; color:${scColor}; font-family:var(--mono);">${score ? score.toFixed(2) : "-"} σ</strong>
          <span style="font-size:9px; color:var(--muted); display:block; margin-top:2px;">Durasi: ${item.hari_ke || "-"} Hari</span>
        </div>
      </div>
      
      <div style="margin-bottom:16px;">
        <div style="font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-family:var(--sans);color:var(--muted);margin-bottom:6px;">Catatan Lapangan</div>
        <div style="font-size:12.5px;line-height:1.5;color:var(--text);background:var(--ink2);padding:10px 12px;border-radius:10px;border:1px solid var(--border);">${item.catatan_lapangan || "Tidak ada catatan lapangan."}</div>
      </div>
      
      <div style="margin-bottom:20px;">
        <div style="font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-family:var(--sans);color:var(--muted);margin-bottom:6px;">Analisis Citra AI</div>
        <div style="font-size:12.5px;line-height:1.5;color:var(--text);background:var(--ink2);padding:10px 12px;border-radius:10px;border:1px solid var(--border); font-style:italic;">"${item.ai_description || "Tidak ada analisis AI."}"</div>
      </div>
      
      ${item.foto_url ? `
        <div style="margin-bottom:20px;">
          <div style="font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-family:var(--sans);color:var(--muted);margin-bottom:6px;">Foto Bukti Lapangan</div>
          <div style="border-radius:10px; overflow:hidden; border:1px solid var(--border); background:var(--ink3); max-height:220px; display:flex; align-items:center; justify-content:center;">
            <img src="${item.foto_url}" style="width:100%; max-height:220px; object-fit:cover;" alt="Bukti Lapangan"/>
          </div>
        </div>
      ` : ""}
    `;
  } else {
    item = allBleaching.find(x => x.id_kejadian === id);
    if (!item) return;
    
    title.textContent = "Detail Analisis EWS Coral Bleaching";
    const score = parseFloat(item.anomaly_score);
    const isDanger = score >= 2.0;
    const scColor = isDanger ? "var(--red)" : "var(--yellow)";
    
    body.innerHTML = `
      <div style="font-weight:700;font-size:15px;margin-bottom:12px;line-height:1.4;">Pemantauan Suhu Permukaan Laut - Stasiun ${item.lokasi}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        <span class="tag" style="background:${scColor}22;color:${scColor};border:1px solid ${scColor}44;font-family:var(--mono);font-size:10px;font-weight:700;padding:4px 10px;border-radius:99px;display:inline-flex;align-items:center;">
          <span class="tag-dot" style="background:${scColor}"></span>
          ${isDanger ? 'BAHAYA' : 'WASPADA'}
        </span>
        <span class="tag" style="background:var(--ink3);color:var(--muted);font-family:var(--mono);font-size:10px;font-weight:700;padding:4px 10px;border-radius:99px;">
          ${item.status_sementara || "Dalam Pemantauan"}
        </span>
      </div>
      <div style="font-size:12px;color:var(--muted);font-family:var(--mono);margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:10px;">
        Tanggal Alert: ${formatTanggal(item.tgl_alert)}<br/>
        Petugas Lapangan: ${item.petugas || "-"}<br/>
        Koordinat: ${item.lat ? item.lat.toFixed(4) : "-"}, ${item.lng ? item.lng.toFixed(4) : "-"}
      </div>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
        <div style="background:var(--ink2); padding:10px; border-radius:10px; border:1px solid var(--border);">
          <span style="font-size:9.5px; color:var(--muted); display:block; text-transform:uppercase;">Sea Surface Temp</span>
          <strong style="font-size:14px; color:var(--text); font-family:var(--mono);">${item.sst_value ? item.sst_value.toFixed(1) : "-"} °C</strong>
          <span style="font-size:9px; color:var(--muted); display:block; margin-top:2px;">Baseline: ${item.sst_baseline ? item.sst_baseline.toFixed(1) : "-"} °C</span>
        </div>
        <div style="background:var(--ink2); padding:10px; border-radius:10px; border:1px solid var(--border);">
          <span style="font-size:9.5px; color:var(--muted); display:block; text-transform:uppercase;">Anomaly (SST)</span>
          <strong style="font-size:14px; color:${scColor}; font-family:var(--mono);">+${item.sst_value && item.sst_baseline ? (item.sst_value - item.sst_baseline).toFixed(1) : "-"} °C</strong>
          <span style="font-size:9px; color:var(--muted); display:block; margin-top:2px;">Durasi: ${item.hari_ke || "-"} Hari</span>
        </div>
      </div>
      
      <div style="margin-bottom:16px;">
        <div style="font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-family:var(--sans);color:var(--muted);margin-bottom:6px;">Catatan Lapangan</div>
        <div style="font-size:12.5px;line-height:1.5;color:var(--text);background:var(--ink2);padding:10px 12px;border-radius:10px;border:1px solid var(--border);">${item.catatan_lapangan || "Tidak ada catatan lapangan."}</div>
      </div>
      
      <div style="margin-bottom:20px;">
        <div style="font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-family:var(--sans);color:var(--muted);margin-bottom:6px;">Analisis Citra AI</div>
        <div style="font-size:12.5px;line-height:1.5;color:var(--text);background:var(--ink2);padding:10px 12px;border-radius:10px;border:1px solid var(--border); font-style:italic;">"${item.ai_description || "Tidak ada analisis AI."}"</div>
      </div>
      
      ${item.foto_url ? `
        <div style="margin-bottom:20px;">
          <div style="font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-family:var(--sans);color:var(--muted);margin-bottom:6px;">Foto Bukti Lapangan</div>
          <div style="border-radius:10px; overflow:hidden; border:1px solid var(--border); background:var(--ink3); max-height:220px; display:flex; align-items:center; justify-content:center;">
            <img src="${item.foto_url}" style="width:100%; max-height:220px; object-fit:cover;" alt="Bukti Lapangan"/>
          </div>
        </div>
      ` : ""}
    `;
  }
  
  modal.style.display = "flex";
}

function getNewsRegion(b) {
  if (b.lokasi_terdeteksi && b.lokasi_terdeteksi.trim()) {
    return b.lokasi_terdeteksi.trim().toUpperCase();
  }
  
  const text = ((b.judul || "") + " " + (b.ringkasan || "")).toUpperCase();
  
  const regencies = [
    { name: "JEMBRANA", region: "JEMBRANA" },
    { name: "BULELENG", region: "BULELENG" },
    { name: "KARANGASEM", region: "KARANGASEM" },
    { name: "KLUNGKUNG", region: "KLUNGKUNG" },
    { name: "GIANYAR", region: "GIANYAR" },
    { name: "BANGLI", region: "BANGLI" },
    { name: "TABANAN", region: "TABANAN" },
    { name: "BADUNG", region: "BADUNG" },
    { name: "DENPASAR", region: "DENPASAR" }
  ];
  
  for (const r of regencies) {
    if (text.includes(r.name)) {
      return r.region;
    }
  }
  
  const mappings = [
    { region: "BULELENG", keywords: ["SINGARAJA", "PEMUTERAN", "LOVINA", "GEROKGAK", "SERIRIT", "BANJAR", "BUSUNGBIU", "SAWAN", "KUBUTAMBAHAN", "TEJAKULA"] },
    { region: "KARANGASEM", keywords: ["AMED", "TULAMBEN", "CANDIDASA", "BESAKIH", "PADANGBAI", "RENDANG", "SIDEMEN", "MANGGIS", "SELAT", "BEBANDEM", "ABANG", "KUBU", "SELAT LOMBOK"] },
    { region: "KLUNGKUNG", keywords: ["NUSA PENIDA", "NUSA LEMBONGAN", "NUSA CENINGAN", "SEMARAPURA", "DAWAN", "BANJARANGKAN", "SELAT BADUNG"] },
    { region: "GIANYAR", keywords: ["UBUD", "TEGALLALANG", "SUKAWATI", "TAMPAKSIRING", "TAMPAK SIRING", "PAYANGAN", "BLAHBATUH"] },
    { region: "BANGLI", keywords: ["KINTAMANI", "BATUR", "TEMBUKU", "SUSUT"] },
    { region: "TABANAN", keywords: ["BEDUGUL", "JATILUWIH", "TANAH LOT", "SELEMADEG", "KERAMBITAN", "MARGA", "BATURITI", "PENEBEL", "PUPUAN"] },
    { region: "JEMBRANA", keywords: ["NEGARA", "GILIMANUK", "PENGAMBENGAN", "MENDOYO", "PEKUTATAN", "MELAYA", "SELAT BALI"] },
    { region: "BADUNG", keywords: ["KUTA", "SEMINYAK", "CANGGU", "JIMBARAN", "NUSA DUA", "ULUWATU", "MENGWI", "ABIANSEMAL", "PETANG"] },
    { region: "DENPASAR", keywords: ["SANUR", "SERANGAN"] }
  ];
  
  for (const m of mappings) {
    for (const kw of m.keywords) {
      if (kw === "SELAT") {
        if (text.includes("SELAT") && 
            !text.includes("SELAT BALI") && 
            !text.includes("SELAT LOMBOK") && 
            !text.includes("SELAT BADUNG") && 
            !text.includes("SELAT SUNDA")) {
          return m.region;
        }
      } else if (text.includes(kw)) {
        return m.region;
      }
    }
  }
  return "";
}

function updateTabCounts() {
  const el1 = $("tab-count-berita");
  const el3 = $("tab-count-humas");
  const el4 = $("tab-count-lingkungan");
  
  if (el1) el1.textContent = allBerita.length;
  if (el3) el3.textContent = allHumas.filter(k => k.status === "DISETUJUI").length;
  if (el4) {
    const activeEnv = allRedTide.filter(r => (r.status_sementara || "").toLowerCase() !== "selesai").length +
                      allBleaching.filter(b => (b.status_sementara || "").toLowerCase() !== "selesai").length;
    el4.textContent = activeEnv;
  }
}

function renderSummary() {
  const latest = allBerita.map(b => parseTanggal(b.tgl_analisis)).filter(Boolean).sort((a,b) => b - a)[0];
  const lastUpdatedEl = $("ews-last-updated");
  if (lastUpdatedEl) lastUpdatedEl.textContent = latest ? formatTanggal(latest.toISOString()) : "belum ada data";
  
  renderSentimenPanel();
  renderTopikPills();
  renderBeritaFeed(allBerita);
  renderRedTide();
  renderBleaching();
  
  renderHumasStats(allHumas);
  updateTabCounts();
  
  if (window.innerWidth >= 1024) {
    initMap();
  }
}

// ── Hero Waves Canvas Animation ────────────────
function initHeroWaves() {
  const canvas = $("hero-waves"); 
  if (!canvas) return;
  const ctx = canvas.getContext("2d"); 
  let offset = 0;
  
  function resize() { 
    canvas.width = canvas.offsetWidth; 
    canvas.height = canvas.offsetHeight; 
  }
  window.addEventListener("resize", resize); 
  resize();
  
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 85, 170, 0.03)"; ctx.beginPath(); ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x++) { ctx.lineTo(x, canvas.height * 0.60 + Math.sin(x * 0.005 + offset) * 15); }
    ctx.lineTo(canvas.width, canvas.height); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(0, 119, 230, 0.02)"; ctx.beginPath(); ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x++) { ctx.lineTo(x, canvas.height * 0.68 + Math.sin(x * 0.008 - offset * 0.8) * 10); }
    ctx.lineTo(canvas.width, canvas.height); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(51, 153, 255, 0.02)"; ctx.beginPath(); ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x++) { ctx.lineTo(x, canvas.height * 0.74 + Math.sin(x * 0.012 + offset * 1.2) * 8); }
    ctx.lineTo(canvas.width, canvas.height); ctx.closePath(); ctx.fill();
    offset += 0.006; requestAnimationFrame(draw);
  }
  draw();
}

function initMap() {
  console.log("[EWS Map] Leaflet initialized: no map container active in layout.");
}

// ── Initialization ────────────────────────────
(async function initEwsDashboard() {
  initHeroWaves();
  
  // Close modals on Esc
  document.addEventListener("keydown", e => { 
    if (e.key === "Escape") { 
      const m = $("ews-modal"); 
      if (m && m.style.display === "flex") closeEwsModal(); 
    } 
  });

  await Promise.all([loadEWS(), loadEwsSheetData()]);
  renderSummary();
  switchEwsTab('berita');
})();

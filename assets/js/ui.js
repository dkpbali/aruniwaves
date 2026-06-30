/* ===================================================================
   ARUNIWAVES - Shared JS: UI Controls (Toasts, Modals, Dynamic Nav)
   =================================================================== */

const UI = {
  // ── Toast Alert Notifications ──
  showToast(message, type = "success") {
    let toastEl = document.getElementById("aruniwaves-toast");
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "aruniwaves-toast";
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    
    toastEl.className = `toast show ${type}`;
    toastEl.textContent = message;
    
    if (this._toastTimeout) clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toastEl.className = "toast";
    }, 3000);
  },

  // ── Spinner / Loader overlay ──
  toggleSpinner(show = true) {
    let spinnerEl = document.getElementById("aruniwaves-spinner");
    if (!spinnerEl) {
      spinnerEl = document.createElement("div");
      spinnerEl.id = "aruniwaves-spinner";
      spinnerEl.style.cssText = "position:fixed;top:16px;right:16px;z-index:9999;display:none;align-items:center;gap:8px;background:rgba(255,255,255,0.9);padding:8px 12px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1);border:1px solid var(--border);font-size:12px;font-weight:600;color:var(--muted);";
      spinnerEl.innerHTML = `<div class="spin"></div><span style="font-family:var(--sans)">Memuat...</span>`;
      document.body.appendChild(spinnerEl);
    }
    spinnerEl.style.display = show ? "flex" : "none";
  },

  // ── Confirm Modal Dialog ──
  showConfirm(title, message, onConfirm) {
    let confirmEl = document.getElementById("aruniwaves-confirm");
    if (!confirmEl) {
      confirmEl = document.createElement("div");
      confirmEl.id = "aruniwaves-confirm";
      confirmEl.className = "modal-overlay";
      confirmEl.innerHTML = `
        <div class="modal-content-card" style="max-width: 380px;">
          <h3 class="modal-header-title" id="confirm-title" style="margin-bottom: 12px; font-family:var(--title-sans)"></h3>
          <p id="confirm-message" style="font-size: 13px; color: var(--muted); margin-bottom: 20px; line-height: 1.5; font-family:var(--sans)"></p>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="confirm-btn-cancel" class="btn-primary" style="background: var(--ink3); color: var(--text); border: 1px solid var(--border); padding: 8px 16px; border-radius: 8px; font-size:12px">Batal</button>
            <button id="confirm-btn-ok" class="btn-primary" style="padding: 8px 16px; border-radius: 8px; font-size:12px">OK</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmEl);
    }

    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-message").textContent = message;

    const btnCancel = document.getElementById("confirm-btn-cancel");
    const btnOk = document.getElementById("confirm-btn-ok");

    const closeConfirm = () => {
      confirmEl.classList.remove("open");
    };

    btnCancel.onclick = () => {
      closeConfirm();
    };

    btnOk.onclick = () => {
      closeConfirm();
      if (onConfirm) onConfirm();
    };

    confirmEl.classList.add("open");
  },

  // ── Header, Sidebar & Bottom Navigation Injector ──
  renderNavigation(activeTab = "") {
    let rootPath = "./";
    if (window.location.pathname.includes("/dashboard/dashboard_")) {
      rootPath = "../../";
    } else if (!isRoot) {
      rootPath = "../";
    }
    
    // Inject Header
    const headerContainer = document.getElementById("app-header");
    if (headerContainer) {
      headerContainer.innerHTML = `
        <header class="site-header">
          <a class="logo-wrap" href="${rootPath}index.html" style="text-decoration:none;color:inherit">
            <div class="logo-mark">
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="logo-text-wrap">
              <div class="logo-name">ARUNIWAVES</div>
              <div class="logo-sub">DKP BALI</div>
            </div>
          </a>
          
          <div class="desktop-nav">
            <a href="${rootPath}aset/index.html" class="desktop-nav-item ${activeTab === 'aset' ? 'active' : ''}">Aset</a>
            <a href="${rootPath}helpdesk/index.html" class="desktop-nav-item ${activeTab === 'helpdesk' ? 'active' : ''}">Helpdesk</a>
            <a href="${rootPath}rapat/index.html" class="desktop-nav-item ${activeTab === 'rapat' ? 'active' : ''}">Rapat</a>
            <a href="${rootPath}humas/index.html" class="desktop-nav-item ${activeTab === 'humas' ? 'active' : ''}">Humas</a>
            <a href="${rootPath}bbm/index.html" class="desktop-nav-item ${activeTab === 'bbm' ? 'active' : ''}">BBM</a>
            <a href="${rootPath}kendaraan/index.html" class="desktop-nav-item ${activeTab === 'kendaraan' ? 'active' : ''}">Kendaraan</a>
          </div>

          <div class="nav-spacer"></div>

          <div id="gis-header-container" style="display:flex;align-items:center;gap:10px">
            <div id="login-bar" style="display:flex">
              <div id="gis-btn-container"></div>
            </div>
            <div id="user-bar" style="display:none;align-items:center;gap:10px">
              <div style="text-align:right">
                <div id="user-name" style="font-size:12px;font-weight:700;color:var(--text)"></div>
                <div id="user-email" style="font-size:9px;color:var(--muted);font-family:var(--mono)"></div>
              </div>
              <button onclick="logoutUser()" class="btn-primary" style="padding:6px 10px;font-size:11px;background:var(--ink3);color:var(--red);border:1px solid var(--border);border-radius:8px">Log Out</button>
            </div>
          </div>
        </header>
      `;
    }

    // Inject Bottom Nav & Drawer for mobile devices
    const bottomNavContainer = document.getElementById("app-bottom-nav");
    if (bottomNavContainer && !isRoot) {
      bottomNavContainer.innerHTML = `
        <nav class="bottom-nav">
          <a class="nav-item ${activeTab === 'aset' ? 'active' : ''}" href="${rootPath}aset/index.html">
            <span class="nav-icon"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></span>
            <span class="nav-label">Aset</span>
          </a>
          <a class="nav-item ${activeTab === 'helpdesk' ? 'active' : ''}" href="${rootPath}helpdesk/index.html">
            <span class="nav-icon"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></span>
            <span class="nav-label">Helpdesk</span>
          </a>
          <a class="nav-item ${activeTab === 'rapat' ? 'active' : ''}" href="${rootPath}rapat/index.html">
            <span class="nav-icon"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></span>
            <span class="nav-label">Rapat</span>
          </a>
          <a class="nav-item ${activeTab === 'humas' ? 'active' : ''}" href="${rootPath}humas/index.html">
            <span class="nav-icon"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8Z"/><path d="M22 12a3 3 0 0 0-3-3v6a3 3 0 0 0 3-3Z"/><path d="M6 9h4"/></svg></span>
            <span class="nav-label">Humas</span>
          </a>
          <a class="nav-item ${activeTab === 'bbm' ? 'active' : ''}" href="${rootPath}bbm/index.html">
            <span class="nav-icon"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V2h10v20H3z"/><path d="M17 9h4v8h-4z"/><circle cx="8" cy="7" r="2"/><path d="M13 5h4v4h-4z"/></svg></span>
            <span class="nav-label">BBM</span>
          </a>
          <div class="nav-item" id="btn-toggle-more" style="cursor: pointer;">
            <span class="nav-icon"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg></span>
            <span class="nav-label">Lainnya</span>
          </div>
        </nav>

        <div class="more-drawer" id="more-drawer">
          <div class="more-grid">
            <a class="more-item ${activeTab === 'ews' ? 'active' : ''}" href="${rootPath}dashboard/dashboard_ews/index.html">
              <span class="more-item-icon">
                <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </span>
              <span class="more-item-label">Dashboard EWS</span>
            </a>
            <a class="more-item ${activeTab === 'ekspor' ? 'active' : ''}" href="${rootPath}dashboard/dashboard_ekspor/index.html">
              <span class="more-item-icon">
                <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </span>
              <span class="more-item-label">Dashboard Ekspor</span>
            </a>
            <a class="more-item ${activeTab === 'dashboard_kendaraan' ? 'active' : ''}" href="${rootPath}dashboard/dashboard_kendaraan/index.html">
              <span class="more-item-icon">
                <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </span>
              <span class="more-item-label">Dashboard Mobil</span>
            </a>
            <a class="more-item ${activeTab === 'kendaraan' ? 'active' : ''}" href="${rootPath}kendaraan/index.html">
              <span class="more-item-icon">
                <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </span>
              <span class="more-item-label">Peminjaman Mobil</span>
            </a>
          </div>
        </div>
      `;

      const btnToggle = document.getElementById("btn-toggle-more");
      const drawer = document.getElementById("more-drawer");
      if (btnToggle && drawer) {
        btnToggle.addEventListener("click", (e) => {
          e.stopPropagation();
          drawer.classList.toggle("open");
        });
        
        document.addEventListener("click", () => {
          drawer.classList.remove("open");
        });
      }
    }
  }
};

// ── Global Authentication View Sync ──
window.logoutUser = function() {
  UI.showConfirm("Log Out", "Apakah Anda yakin ingin keluar?", () => {
    Auth.logout(() => {
      window.location.reload();
    });
  });
};

window.showUserBar = function(user) {
  const loginBar = document.getElementById("login-bar");
  const userBar = document.getElementById("user-bar");
  if (loginBar && userBar) {
    loginBar.style.display = "none";
    userBar.style.display = "flex";
    document.getElementById("user-name").textContent = user.name + (user.is_admin ? " (Admin IT)" : " (Pegawai)");
    document.getElementById("user-email").textContent = user.email;
  }
};

Object.freeze(UI);

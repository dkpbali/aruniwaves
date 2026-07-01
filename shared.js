window.ARUNIWAVES_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwvaKzpcYW1OVdoe1wjJHjSW-sF_oK59Fm4lMuaL2dpJehEluD8mC0r1JPWF3wGmdAl/exec",
  EKSPOR_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxrPQsGiDU5h55HqQbyxWobZbJLzlqVNhlpudBHpwf8NYMaiV5ai2ILRUFZ6epf7tdI/exec",
  EWS_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx61Rby8zbN6igNFowAMH770NHESuTg0r6E6yvEHpBItFObxtdFXnbkhCIXRGB5Rxqe/exec",
  GOOGLE_CLIENT_ID: "980835671745-kovsr0jmtlnf6r3rq9hqnif5flc9i2g7.apps.googleusercontent.com"
};

// Append CSS dynamically to document
const style = document.createElement('style');
style.textContent = `
#toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}
.custom-toast {
  pointer-events: auto;
  background: var(--card, #ffffff);
  border: 1px solid var(--border, #e0e0e0);
  padding: 12px 18px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 250px;
  max-width: 350px;
  font-family: var(--sans, sans-serif);
  font-size: 13px;
  font-weight: 500;
  color: var(--text, #333333);
  transform: translateX(120%);
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
  opacity: 0;
}
.custom-toast.show {
  transform: translateX(0);
  opacity: 1;
}
.custom-toast.success {
  border-left: 4px solid var(--green, #10b981);
}
.custom-toast.error {
  border-left: 4px solid var(--red, #ef4444);
}
.custom-toast.warning {
  border-left: 4px solid var(--yellow, #f59e0b);
}
.custom-toast.info {
  border-left: 4px solid var(--wave, #0077e6);
}
.custom-toast-icon {
  font-size: 16px;
}
.custom-toast-message {
  flex: 1;
  line-height: 1.4;
}
.custom-toast-close {
  cursor: pointer;
  opacity: 0.5;
  font-size: 16px;
  transition: opacity 0.2s;
}
.custom-toast-close:hover {
  opacity: 1;
}

#custom-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 10000;
  display: none;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}
#custom-confirm-overlay.show {
  display: flex;
  opacity: 1;
}
.custom-confirm-card {
  background: var(--card, #ffffff);
  border: 1px solid var(--border, #e0e0e0);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 460px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  font-family: var(--sans, sans-serif);
  transform: scale(0.9);
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
#custom-confirm-overlay.show .custom-confirm-card {
  transform: scale(1);
}
.custom-confirm-title {
  font-family: var(--title-sans, var(--sans));
  font-size: 16px;
  font-weight: 700;
  color: var(--text, #333);
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  padding-bottom: 12px;
}
.custom-confirm-message {
  font-size: 13px;
  color: var(--muted, #666);
  line-height: 1.5;
  margin-bottom: 24px;
}
.custom-confirm-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.custom-confirm-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  font-family: var(--sans);
}
.custom-confirm-btn-cancel {
  background: rgba(0,0,0,0.05);
  color: var(--text);
  border-color: var(--border);
}
.custom-confirm-btn-cancel:hover {
  background: rgba(0,0,0,0.1);
}
[data-theme="dark"] .custom-confirm-btn-cancel {
  background: rgba(255,255,255,0.05);
}
[data-theme="dark"] .custom-confirm-btn-cancel:hover {
  background: rgba(255,255,255,0.1);
}
.custom-confirm-btn-confirm {
  background: var(--wave, #0077e6);
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 119, 230, 0.2);
}
.custom-confirm-btn-confirm:hover {
  background: var(--foam, #0096ff);
  transform: translateY(-1px);
}
`;
document.head.appendChild(style);

// DOM Elements creation
document.addEventListener('DOMContentLoaded', () => {
  // Create toast container
  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Create confirm modal overlay
  if (!document.getElementById('custom-confirm-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'custom-confirm-overlay';
    overlay.innerHTML = `
      <div class="custom-confirm-card">
        <div class="custom-confirm-title" id="custom-confirm-title">Konfirmasi Aksi</div>
        <div class="custom-confirm-message" id="custom-confirm-message">Apakah Anda yakin ingin melanjutkan?</div>
        <div class="custom-confirm-buttons">
          <button class="custom-confirm-btn custom-confirm-btn-cancel" id="custom-confirm-btn-cancel">Batal</button>
          <button class="custom-confirm-btn custom-confirm-btn-confirm" id="custom-confirm-btn-confirm">Ya, Lanjutkan</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        const btnCancel = document.getElementById('custom-confirm-btn-cancel');
        if (btnCancel) btnCancel.click();
      }
    });
  }
});

// Toast notification function
window.showToast = function(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `custom-toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span class="custom-toast-icon">${icon}</span>
    <span class="custom-toast-message">${msg}</span>
    <span class="custom-toast-close">&times;</span>
  `;

  container.appendChild(toast);

  // Close close button action
  toast.querySelector('.custom-toast-close').onclick = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  };

  // Show animation
  setTimeout(() => toast.classList.add('show'), 50);

  // Auto remove
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }
  }, 3500);
};

// Confirm dialog function
window.showConfirm = function(msg, onConfirm, onCancel) {
  const overlay = document.getElementById('custom-confirm-overlay');
  const msgEl = document.getElementById('custom-confirm-message');
  if (!overlay || !msgEl) {
    // Fallback if DOM not fully loaded
    const res = confirm(msg);
    if (res && onConfirm) onConfirm();
    if (!res && onCancel) onCancel();
    return;
  }

  msgEl.textContent = msg;
  overlay.style.display = 'flex';
  setTimeout(() => overlay.classList.add('show'), 10);

  const btnCancel = document.getElementById('custom-confirm-btn-cancel');
  const btnConfirm = document.getElementById('custom-confirm-btn-confirm');

  const cleanup = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.style.display = 'none', 200);
  };

  btnCancel.onclick = () => {
    cleanup();
    if (onCancel) onCancel();
  };

  btnConfirm.onclick = () => {
    cleanup();
    if (onConfirm) onConfirm();
  };
};

// Overwrite window.alert with window.showToast
const originalAlert = window.alert;
window.alert = function(msg) {
  let type = 'info';
  const msgLower = (msg || '').toLowerCase();
  
  if (msgLower.includes('berhasil') || msgLower.includes('sukses') || msgLower.includes('clear') || msgLower.includes('disimpan')) {
    type = 'success';
  } else if (msgLower.includes('gagal') || msgLower.includes('error') || msgLower.includes('salah') || msgLower.includes('ditolak') || msgLower.includes('tidak ditemukan')) {
    type = 'error';
  } else if (msgLower.includes('pilih') || msgLower.includes('wajib') || msgLower.includes('perlu') || msgLower.includes('periksa')) {
    type = 'warning';
  }
  
  window.showToast(msg, type);
};

window.confirmPromise = function(msg) {
  return new Promise(resolve => {
    window.showConfirm(msg, () => resolve(true), () => resolve(false));
  });
};

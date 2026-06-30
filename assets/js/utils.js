/* ===================================================================
   ARUNIWAVES - Shared JS: Utilities (Helpers & Utilities)
   =================================================================== */

const Utils = {
  getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  formatIndonesianDate(dateStr) {
    if (!dateStr) return "-";
    let date;
    
    // Parse YYYY-MM-DD
    if (dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        date = new Date(parts[0], parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    } 
    // Parse DD/MM/YYYY
    else if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        // Assuming DD/MM/YYYY
        date = new Date(parts[2], parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }

    if (!date || isNaN(date.getTime())) {
      return dateStr;
    }

    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  },

  escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};
Object.freeze(Utils);

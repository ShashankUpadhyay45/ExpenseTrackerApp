// UI enhancements: theme toggle, sidebar actions, small helpers
(function () {
  const themeBtn = document.getElementById('toggle-theme');
  const onboardBtn = document.getElementById('open-onboard');
  const onboardModal = document.getElementById('onboard');
  const importBtn = document.getElementById('import-sample-2');
  const navAdd = document.getElementById('nav-add');

  // initialize theme from saved pref
  const savedTheme = localStorage.getItem('spendsage_theme');
  if (savedTheme === 'dark') document.body.classList.add('dark');

  // toggle theme
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');
      themeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      themeBtn.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('spendsage_theme', isDark ? 'dark' : 'light');
    });
  }

  // About / onboard modal open
  if (onboardBtn && onboardModal) {
    onboardBtn.addEventListener('click', () => {
      onboardModal.classList.remove('hidden');
      onboardModal.setAttribute('aria-hidden', 'false');
    });
    document.querySelectorAll('#close-onboard, #close-onboard-2').forEach(b => {
      if (b) b.addEventListener('click', () => {
        onboardModal.classList.add('hidden');
        onboardModal.setAttribute('aria-hidden', 'true');
      });
    });
  }

  // quick import button in sidebar
  if (importBtn) importBtn.addEventListener('click', () => {
    if (typeof importSampleData === 'function') importSampleData();
    else alert('Sample import not available. Ensure your Ap.js defines importSampleData().');
  });

  // nav add button: focus the main form description input and scroll into view
  if (navAdd) {
    navAdd.addEventListener('click', () => {
      const formSection = document.querySelector('.form-card');
      const desc = document.getElementById('description');
      const date = document.getElementById('date');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (desc) {
            desc.focus({ preventScroll: true });
            const val = desc.value || '';
            desc.value = '';
            desc.value = val;
          } else if (date) {
            date.focus();
          }
        }, 420);
      } else {
        if (desc) desc.focus();
        else if (date) date.focus();
      }
    });
  }

  // sync small locale select (if present) with main locale (if present)
  const localeMini = document.getElementById('locale');
  const localeMain = document.getElementById('locale');
  if (localeMini && localeMain) {
    localeMini.value = localeMain.value || 'auto';
    localeMini.addEventListener('change', () => { localeMain.value = localeMini.value; localeMain.dispatchEvent(new Event('change')); });
    localeMain.addEventListener('change', () => { localeMini.value = localeMain.value; });
  }

  // ensure canvases are crisp on load/resize
  function scaleCanvas(c) {
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = Math.round(rect.width * dpr);
    c.height = Math.round(rect.height * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function handleResize() {
    document.querySelectorAll('canvas').forEach(scaleCanvas);
    if (typeof render === 'function') render();
  }
  window.addEventListener('resize', handleResize);
  handleResize();
})();

/* SpendSage — permanent fail-safe wiring for core buttons
   Place this at the end of ui-enhancements.js so it's always executed
   after the UI script loads. It will attach handlers if they are not present.
*/
(function(){
  function whenReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      setTimeout(fn, 10);
    }
  }

  whenReady(() => {
    const find = (...ids) => ids.map(id => document.getElementById(id)).find(Boolean) || null;

    const form = find('expense-form', 'form', 'main-form');
    const addBtn = find('add-btn', 'btn-add', 'nav-add');
    const clearBtn = find('clear-form', 'btn-clear', 'clear-btn');
    const importBtn = find('import-sample-2', 'import-sample', 'btn-import');
    const exportBtn = find('export-csv', 'btn-export', 'exportBtn');

    function safeSubmit() {
      if (!form) return;
      try {
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
          return;
        }
      } catch (e) {}
      try {
        const ev = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(ev);
      } catch (e) {}
    }

    if (addBtn) {
      try { addBtn.removeEventListener && addBtn.removeEventListener('click', safeSubmit); } catch(e){}
      addBtn.addEventListener('click', (ev) => { ev.preventDefault(); safeSubmit(); });
      console.log('SpendSage (fail-safe): Add button wired.');
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', (ev) => {
        try {
          ev.preventDefault();
          if (form && typeof form.reset === 'function') form.reset();
          const a = document.getElementById('add-btn') || document.getElementById('btn-add');
          if (a) a.textContent = 'Add Expense';
          if (window.editingId !== undefined) window.editingId = null;
          if (typeof render === 'function') try { render(); } catch(e){}
        } catch(e){ console.warn('SpendSage clear fail-safe error', e); }
      });
      console.log('SpendSage (fail-safe): Clear button wired.');
    }

    if (importBtn) {
      importBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (typeof window.importSampleData === 'function') window.importSampleData();
        else alert('Import function not found.');
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (typeof window.exportCsv === 'function') return window.exportCsv();
        if (typeof window.collectVisibleCombined === 'function') {
          try {
            const month = (document.getElementById('filter-month') && document.getElementById('filter-month').value) || (new Date()).toISOString().slice(0,7);
            const combined = window.collectVisibleCombined ? window.collectVisibleCombined(month) : [];
            if (!combined.length) { alert('No items to export.'); return; }
            const rows = [['Date','Time','Description','Category','Amount']];
            combined.sort((a,b)=> a.timestamp - b.timestamp).forEach(e => rows.push([e.date, e.time, `"${String(e.description).replace(/"/g,'""')}"`, e.category, Number(e.amount).toFixed(2)]));
            const csv = rows.map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `spendsage_export.csv`; a.click(); URL.revokeObjectURL(url);
          } catch(err) { console.warn('SpendSage export fallback failed', err); }
        } else {
          alert('Export not available.');
        }
      });
    }
  });
})();

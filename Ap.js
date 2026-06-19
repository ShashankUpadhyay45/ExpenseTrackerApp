/* Ap.js — updated with integrated sample-data generator
   - dark-mode tab visibility fixes
   - monthly/day labels, yearly/month labels
   - currency defaults to INR when Auto
   - additional currencies
   - search results popup (click outside to close)
   - canvas tooltips for monthly/yearly bars
   - last-added summary below Add Expense
   - integrated importSampleData() generator per user's rules
*/

function $id(id){ return document.getElementById(id) || null; }
function log(){ console.info('[SpendSage]', ...arguments); }
function warn(){ console.warn('[SpendSage]', ...arguments); }

const STORAGE_KEY = 'spendsage_expenses_v1';
const RECUR_KEY   = 'spendsage_recurring_v1';
const PREF_KEY    = 'spendsage_prefs_v1';
const CATS_KEY    = 'spendsage_cats_v1';

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function safeParse(raw, fallback){ try { return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }

/* DOM refs */
const aboutBtn = $id('about-btn');
const aboutPanel = $id('about-panel');
const closeAbout = $id('close-about');

const settingsBtn = $id('settings-btn');
const settingsPanel = $id('settings-panel');
const closeSettings = $id('close-settings');
const saveSettings = $id('save-settings');
const cancelSettings = $id('cancel-settings');
const settingsLocale = $id('settings-locale');
const settingsCurrency = $id('settings-currency');

const menuBtn = $id('menu-btn');
const menuPanel = $id('menu-panel');

const form = $id('expense-form');
const addBtn = $id('add-btn');
const clearFormBtn = $id('clear-form');
const expenseList = $id('expense-list');
const totalAmountEl = $id('total-amount');
const filterMonth = $id('filter-month');
const importSampleBtn = $id('import-sample-2'); // fallback element (may be null)
const exportCsvBtn = $id('export-csv');
const chartCanvas = $id('chart');
const pieCanvas = $id('pie');
const pieLegend = $id('pie-legend');
const yearlyCanvas = $id('yearly');
const yearlyLegend = $id('yearly-legend');

const searchInput = $id('search');
const searchDate = $id('search-date');

const menu_m_add = $id('m-add-expense');
const menu_m_recurring = $id('m-recurring');
const menu_m_import = $id('m-import-sample');
const menu_m_export_csv = $id('m-export-csv');
const menu_m_export_pdf = $id('m-export-pdf');
const menu_m_select_all = $id('m-select-all-visible');
const menu_m_invert = $id('m-invert-selection');
const menu_m_delete = $id('m-delete-selected');
const menu_m_replace_bills = $id('m-replace-bills');
const menu_m_remove_category = $id('m-remove-category');

const searchPopup = $id('search-popup');
const searchPopupBody = $id('search-popup-body');
const searchPopupClose = $id('search-popup-close');
const canvasTooltip = $id('canvas-tooltip');
const lastAddedEl = $id('last-added');

/* Model */
let expenses = [];
let recurringRules = [];
let editingId = null;
let categories = safeParse(localStorage.getItem(CATS_KEY), null);

/* store bar geometry for hover hit-testing (layout coords) */
let monthlyBars = []; // [{x, y, w, h, value, label}]
let yearlyBars = [];  // same shape

if (!categories || !Array.isArray(categories)){
  categories = ['Food','Drink','Transport','Groceries','Bills','Shopping','Other'];
  try { localStorage.setItem(CATS_KEY, JSON.stringify(categories)); } catch(e){}
}

/* Formatter (reads settings then prefs)
   Auto => default to INR (explicit user request)
*/
function getFormatter(){
  let prefs = safeParse(localStorage.getItem(PREF_KEY), {});
  let locale = (settingsLocale && settingsLocale.value && settingsLocale.value !== 'auto') ? settingsLocale.value : (prefs.locale || navigator.language || 'en-IN');
  // currency: if user selected auto, fallback to prefs.currency if set, otherwise default to INR
  let currency = (settingsCurrency && settingsCurrency.value && settingsCurrency.value !== 'auto') ? settingsCurrency.value : (prefs.currency && prefs.currency !== 'auto' ? prefs.currency : 'INR');
  try { return new Intl.NumberFormat(locale, { style:'currency', currency, minimumFractionDigits:2 }); }
  catch(e){ return { format: v => (currency + ' ' + Number(v).toFixed(2)) }; }
}
function fmt(n){ return getFormatter().format(Number(n)||0); }

/* Storage */
function loadAll(){
  expenses = safeParse(localStorage.getItem(STORAGE_KEY), []);
  recurringRules = safeParse(localStorage.getItem(RECUR_KEY), []);
  const prefs = safeParse(localStorage.getItem(PREF_KEY), {});
  if (prefs.locale && settingsLocale) settingsLocale.value = prefs.locale;
  if (prefs.currency && settingsCurrency) settingsCurrency.value = prefs.currency;
  if (prefs.theme){
    document.body.classList.toggle('dark', prefs.theme === 'dark');
    const radios = document.getElementsByName('theme');
    if (radios) for (const r of radios) if (r.value === prefs.theme) r.checked = true;
  }
  const savedCats = safeParse(localStorage.getItem(CATS_KEY), null);
  if (savedCats && Array.isArray(savedCats)) categories = savedCats;
  populateCategorySelect();
  log('Loaded storage — expenses:', expenses.length, 'recurring:', recurringRules.length);
}
function saveAll(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); } catch(e){ warn('save expenses failed', e); }
  try { localStorage.setItem(RECUR_KEY, JSON.stringify(recurringRules)); } catch(e){ warn('save recurring failed', e); }
  try { localStorage.setItem(CATS_KEY, JSON.stringify(categories)); } catch(e){}
  const themeRadios = document.getElementsByName('theme');
  let themeVal = (document.body.classList.contains('dark')) ? 'dark' : 'light';
  try {
    const prefs = { locale: settingsLocale ? settingsLocale.value : undefined, currency: settingsCurrency ? settingsCurrency.value : undefined, theme: themeVal };
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch(e){}
}

/* Welcome removal */
(function(){
  const welcome = $id('welcome-screen');
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (welcome && welcome.parentNode) welcome.parentNode.removeChild(welcome);
      document.body.classList.add('ui-ready');
      setTimeout(() => { safeRenderCharts(); }, 220);
    }, 700);
  });
})();

/* About panel wiring (tabs work) */
(function(){
  if (!aboutPanel) return;
  function openAbout(){
    aboutPanel.classList.remove('hidden');
    requestAnimationFrame(()=> aboutPanel.classList.add('show'));
  }
  function closeAboutPanel(){
    aboutPanel.classList.remove('show');
    setTimeout(()=> aboutPanel.classList.add('hidden'), 260);
  }
  if (aboutBtn) aboutBtn.addEventListener('click', (ev) => { ev && ev.preventDefault && ev.preventDefault(); openAbout(); });
  if (closeAbout) closeAbout.addEventListener('click', (ev) => { ev && ev.preventDefault && ev.preventDefault(); closeAboutPanel(); });
  aboutPanel.addEventListener('click', (ev) => { if (ev.target === aboutPanel) closeAboutPanel(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && aboutPanel.classList.contains('show')) closeAboutPanel(); });
  try {
    const tabs = aboutPanel.querySelectorAll('.about-tab');
    const sections = aboutPanel.querySelectorAll('.about-content');
    tabs.forEach(btn => btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.add('hidden'));
      btn.classList.add('active');
      const id = btn.dataset.tab; if (id) { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); }
    }));
  } catch(e){}
})();

/* Settings panel wiring */
if (settingsBtn) settingsBtn.addEventListener('click', ()=> { if (!settingsPanel) return; settingsPanel.classList.remove('hidden'); requestAnimationFrame(()=> settingsPanel.classList.add('show')); });
if (closeSettings) closeSettings.addEventListener('click', ()=> { settingsPanel.classList.remove('show'); setTimeout(()=> settingsPanel.classList.add('hidden'), 200); });
if (cancelSettings) cancelSettings.addEventListener('click', ()=> { if (settingsPanel){ settingsPanel.classList.remove('show'); setTimeout(()=> settingsPanel.classList.add('hidden'),200); } });
if (saveSettings) saveSettings.addEventListener('click', ()=> {
  const radios = document.getElementsByName('theme');
  if (radios) for (const r of radios) if (r.checked) document.body.classList.toggle('dark', r.value === 'dark');
  saveAll();
  settingsPanel.classList.remove('show'); setTimeout(()=> settingsPanel.classList.add('hidden'),200);
  safeRenderCharts();
});

/* Menu button wiring */
if (menuBtn) menuBtn.addEventListener('click', (ev)=> {
  ev.stopPropagation();
  if (!menuPanel) return;
  menuPanel.classList.toggle('hidden');
});
document.addEventListener('click', (ev)=> { if (menuPanel && !menuPanel.classList.contains('hidden')) { menuPanel.classList.add('hidden'); } });

/* Category select helpers */
function populateCategorySelect(){
  const sel = $id('category');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '';
  categories.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    sel.appendChild(o);
  });
  const oCustom = document.createElement('option'); oCustom.value = 'custom'; oCustom.textContent = '— Custom… —';
  sel.appendChild(oCustom);
  if (current && Array.from(sel.options).some(o => o.value === current)) sel.value = current;
}
function promptAddCustomCategory(){
  const name = prompt('Enter new category name:');
  if (!name) return null;
  const trimmed = String(name).trim();
  if (!trimmed) return null;
  if (!categories.includes(trimmed)){
    categories.push(trimmed);
    saveAll();
    populateCategorySelect();
  }
  return trimmed;
}
document.addEventListener('change', (ev) => {
  if (!ev.target) return;
  if (ev.target.id === 'category' && ev.target.value === 'custom'){
    const cat = promptAddCustomCategory();
    if (cat){
      const sel = $id('category'); if (sel) sel.value = cat;
    } else {
      const sel = $id('category'); if (sel) sel.value = categories[0] || 'Other';
    }
  }
});

/* Recurring expansion (month-level) */
function expandRecurringForMonth(monthStr){
  const occurrences = [];
  if (!monthStr) monthStr = (new Date()).toISOString().slice(0,7);
  const [yy,mm] = monthStr.split('-').map(Number);
  const daysInMonth = new Date(yy, mm, 0).getDate();
  for (const r of recurringRules){
    if (!r.startDate) continue;
    const start = new Date(r.startDate + 'T' + (r.time || '00:00'));
    for (let d=1; d<=daysInMonth; d++){
      const dt = new Date(yy, mm-1, d, start.getHours(), start.getMinutes());
      if (dt < start) continue;
      let include=false;
      switch(r.freq){
        case 'daily': include=true; break;
        case 'weekly': include = dt.getDay() === start.getDay(); break;
        case 'monthly': include = start.getDate() === dt.getDate(); break;
        case 'yearly': include = dt.getDate() === start.getDate() && dt.getMonth() === start.getMonth(); break;
      }
      if (include) occurrences.push({
        id: uid(),
        date: dt.toISOString().slice(0,10),
        time: dt.toTimeString().slice(0,5),
        description: (r.description||'Recurring') + ' (recurring)',
        amount: Number(r.amount)||0,
        category: r.category||'Other',
        timestamp: dt.getTime(),
        recurringId: r.id
      });
    }
  }
  return occurrences;
}

/* Render list + totals + chart hooks */
function createExpenseListItem(e){
  const li = document.createElement('li');
  li.className = 'expense-item';
  li.dataset.id = e.id;

  const selectWrap = document.createElement('div');
  selectWrap.className = 'item-select';
  const chk = document.createElement('input');
  chk.type = 'checkbox';
  chk.className = 'select-chk';
  chk.dataset.id = e.id;
  if (e.recurringId) chk.dataset.recurringId = e.recurringId;
  selectWrap.appendChild(chk);

  const left = document.createElement('div'); left.className = 'item-left';
  const top = document.createElement('div'); top.className = 'item-top';
  const desc = document.createElement('div'); desc.className = 'description'; desc.textContent = e.description || '';
  const amt = document.createElement('div'); amt.className = 'amount'; amt.textContent = fmt(e.amount);
  top.appendChild(desc); top.appendChild(amt);
  const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `${e.date||''} ${e.time||''} • ${e.category||''} ${e.recurringId ? ' • (recurrence)' : ''}`;
  left.appendChild(top); left.appendChild(meta);

  const actions = document.createElement('div'); actions.className = 'item-actions';
  if (!e.recurringId){
    const editBtn = document.createElement('button'); editBtn.className = 'small-btn'; editBtn.textContent = 'Edit'; editBtn.addEventListener('click', ()=> startEdit(e.id));
    const delBtn = document.createElement('button'); delBtn.className = 'small-btn'; delBtn.textContent = 'Delete'; delBtn.addEventListener('click', ()=> deleteExpense(e.id));
    actions.appendChild(editBtn); actions.appendChild(delBtn);
  } else {
    const viewBtn = document.createElement('button'); viewBtn.className = 'small-btn'; viewBtn.textContent = 'View Rule';
    viewBtn.addEventListener('click', ()=> {
      const rule = recurringRules.find(r => r.id === e.recurringId);
      if (rule) alert(`Recurring rule:\n${rule.description}\n${rule.freq} • ${rule.amount} • ${rule.category}`);
      else alert('Rule not found');
    });
    actions.appendChild(viewBtn);
  }

  li.appendChild(selectWrap); li.appendChild(left); li.appendChild(actions);
  return li;
}

function render(){
  if (!expenseList || !totalAmountEl) return;
  const month = (filterMonth && filterMonth.value) ? filterMonth.value : (new Date()).toISOString().slice(0,7);
  const occurrences = expandRecurringForMonth(month);
  const baseMonth = expenses.filter(e => e.date && e.date.startsWith(month));
  let combined = baseMonth.concat(occurrences);

  const q = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';
  const sDate = (searchDate && searchDate.value) ? searchDate.value : null;

  combined = combined.filter(item => {
    if (sDate){
      if (!item.date || item.date !== sDate) return false;
    }
    if (q) {
      if (!String(item.description).toLowerCase().includes(q) && !String(item.category||'').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sortEl = $id('sort-by');
  if (sortEl && sortEl.value){
    switch(sortEl.value){
      case 'date_desc': combined.sort((a,b)=>b.timestamp - a.timestamp); break;
      case 'date_asc': combined.sort((a,b)=>a.timestamp - b.timestamp); break;
      case 'amount_desc': combined.sort((a,b)=>b.amount - a.amount); break;
      case 'amount_asc': combined.sort((a,b)=>a.amount - b.amount); break;
    }
  }

  expenseList.innerHTML = '';
  combined.forEach((e) => {
    expenseList.appendChild(createExpenseListItem(e));
  });

  const total = combined.reduce((s,x)=> s + (Number(x.amount)||0), 0);
  totalAmountEl.textContent = getFormatter().format(total);

  try{ if (typeof window.renderChart === 'function') window.renderChart(combined, month); } catch(e){}
  try{ if (typeof window.renderPieAndLegend === 'function') window.renderPieAndLegend(combined); } catch(e){}
  try{ if (typeof window.renderYearly === 'function') window.renderYearly(expenses); } catch(e){}
}

/* CRUD handlers */
if (form){
  form.addEventListener('submit', (ev)=> {
    ev.preventDefault();
    const date = $id('date') && $id('date').value ? $id('date').value : (new Date()).toISOString().slice(0,10);
    const time = $id('time') && $id('time').value ? $id('time').value : '00:00';
    const description = ($id('description') && $id('description').value) ? $id('description').value.trim() : '';
    const amount = ($id('amount') && $id('amount').value) ? Number($id('amount').value) : 0;
    let category = ($id('category') && $id('category').value) ? $id('category').value : 'Other';
    if (category === 'custom'){ category = promptAddCustomCategory() || 'Other'; }
    const freq = ($id('recurrence') && $id('recurrence').value) ? $id('recurrence').value : 'none';

    if (!description) { alert('Please add a description'); return; }

    if (editingId){
      const idx = expenses.findIndex(x => x.id === editingId);
      if (idx >= 0){
        expenses[idx].date = date; expenses[idx].time = time; expenses[idx].description = description; expenses[idx].amount = amount; expenses[idx].category = category;
        editingId = null; if (addBtn) addBtn.textContent = 'Add Expense';
        saveAll(); render(); form.reset(); safeRenderCharts(); return;
      }
    }

    if (freq && freq !== 'none'){
      const rule = { id: uid(), description, amount, category, time, startDate: date, freq };
      recurringRules.push(rule); saveAll(); render(); form.reset(); safeRenderCharts(); return;
    }

    const item = { id: uid(), date, time, description, amount, category, timestamp: new Date(date + 'T' + time).getTime() };
    expenses.push(item);
    saveAll();

    // show last-added summary below the Add Expense card
    showLastAdded(item);

    if (expenseList) expenseList.insertBefore(createExpenseListItem(item), expenseList.firstChild);
    form.reset();
    render();
    safeRenderCharts();
  });
}
if (clearFormBtn) clearFormBtn.addEventListener('click', ()=> { if (form) form.reset(); editingId = null; if (addBtn) addBtn.textContent = 'Add Expense'; hideLastAdded(); });

function startEdit(id){
  const item = expenses.find(e => e.id === id);
  if (!item) return;
  if ($id('date')) $id('date').value = item.date || '';
  if ($id('time')) $id('time').value = item.time || '';
  if ($id('description')) $id('description').value = item.description || '';
  if ($id('amount')) $id('amount').value = item.amount || '';
  if ($id('category')) $id('category').value = item.category || '';
  if ($id('recurrence')) $id('recurrence').value = 'none';
  editingId = id; if (addBtn) addBtn.textContent = 'Save Changes';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteExpense(id){
  const li = expenseList ? expenseList.querySelector(`li[data-id="${id}"]`) : null;
  if (li){
    const chk = li.querySelector('input.select-chk');
    const recurringId = chk && chk.dataset && chk.dataset.recurringId ? chk.dataset.recurringId : null;
    if (recurringId){
      if (!confirm('This entry is part of a recurring rule. Delete the whole recurring rule?')) return;
      recurringRules = recurringRules.filter(r => r.id !== recurringId);
    } else {
      if (!confirm('Delete this expense?')) return;
      expenses = expenses.filter(e => e.id !== id);
    }
    if (li.parentNode) li.parentNode.removeChild(li);
    saveAll();
    render();
    safeRenderCharts();
  } else {
    if (!confirm('Delete this expense?')) return;
    expenses = expenses.filter(e => e.id !== id);
    saveAll();
    render();
    safeRenderCharts();
  }
}

/* Sample data generator: creates entries from 2024-08-01 to 2025-11-20
   Rules implemented:
   - 1st of every month: Mess Lunch (1700, Food), Mess Dinner (1600, Food), Room Rent (5000, Bills)
   - Breakfast (250, Food): 2 random days per month
   - Bread (20, Groceries): every 3rd day starting 2024-08-01
   - Fruits (200, Groceries): every 5th day starting 2024-08-05
   - Chai (20, Drink): 3 times daily (three entries/day) starting 2024-08-01
   - Food (200, Food): every weekend (Sat/Sun) starting first weekend of Aug 2024
   - Printout (100, Other): 2-3 random days per month from 2024-09-01, excluding certain months listed

   Fixes:
   - Prevent duplicate items by checking existing records and newly generated items
   - Deterministic fallback when randomness fails
   - Consistent date/time formatting
*/
function randInt(min, max){ return Math.floor(Math.random()*(max-min+1)) + min; }
function chooseTimesForChai(){
  // choose 3 time slots per day; slight random minutes for realism
  const baseHours = [8, 11, 16, 18, 20, 22];
  // pick 3 distinct hours from baseHours
  const picked = [];
  while (picked.length < 3){
    const h = baseHours[randInt(0, baseHours.length-1)];
    if (!picked.includes(h)) picked.push(h);
  }
  picked.sort((a,b)=>a-b);
  return picked.map(h => {
    const m = [0,0,5,10,15,20,30][randInt(0,6)];
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  });
}
function pickRandomDaysInMonth(year, month, count, excludeDays = []){
  // month is 1-based
  const days = new Date(year, month, 0).getDate();
  const pool = [];
  for (let d=1; d<=days; d++){
    if (excludeDays.indexOf(d) === -1) pool.push(d);
  }
  const picked = new Set();
  const tries = Math.max(count*6, 40);
  let t=0;
  while (picked.size < count && t < tries && pool.length){
    const idx = randInt(0, pool.length-1);
    picked.add(pool[idx]);
    t++;
  }
  if (picked.size < count){
    // fill deterministically if randomness failed
    for (let d=1; d<=days && picked.size < count; d++){
      if (!picked.has(d) && excludeDays.indexOf(d) === -1) picked.add(d);
    }
  }
  const arr = Array.from(picked).sort((a,b)=>a-b);
  return arr;
}

function normalizeDate(d){ // expects Date or YYYY-MM-DD
  if (!d) return '';
  if (d instanceof Date) return d.toISOString().slice(0,10);
  return String(d).slice(0,10);
}
function normalizeTime(t){
  if (!t) return '00:00';
  if (typeof t === 'string' && t.length === 5 && t.indexOf(':')===2) return t;
  // try to coerce
  const parts = String(t).split(':');
  const hh = String((parts[0]||'0')).padStart(2,'0');
  const mm = String((parts[1]||'0')).padStart(2,'0').slice(0,2);
  return `${hh}:${mm}`;
}

// check for duplicate using date/time/description/amount/category across current storage (expenses) and current items
function existsSimilarIn(targetList, date, time, description, amount, category){
  const d = normalizeDate(date);
  const t = normalizeTime(time);
  const desc = String(description || '').trim().toLowerCase();
  const amt = Number(amount) || 0;
  const cat = String(category || 'Other');
  for (const it of targetList){
    if (!it) continue;
    const itDate = normalizeDate(it.date);
    const itTime = normalizeTime(it.time);
    const itDesc = String(it.description || '').trim().toLowerCase();
    const itAmt = Number(it.amount) || 0;
    const itCat = String(it.category || 'Other');
    if (itDate === d && itTime === t && itDesc === desc && itAmt === amt && itCat === cat) return true;
  }
  return false;
}

function importSampleData(){
  // main generator: appends to expenses (but avoids duplicates)
  const start = new Date('2024-08-01T00:00:00');
  const end = new Date('2025-11-20T23:59:59');
  const excludedPrintoutMonths = new Set([
    '2024-08','2024-12','2025-01','2025-02','2025-05','2025-06','2025-07','2025-08'
  ]);

  const items = [];

  // iterate month by month for month-level random events (Breakfast, Printout)
  function monthsBetween(s, e){
    const arr = [];
    let cur = new Date(s.getFullYear(), s.getMonth(), 1);
    const last = new Date(e.getFullYear(), e.getMonth(), e.getDate());
    while (cur <= last){
      arr.push(new Date(cur.getFullYear(), cur.getMonth(), 1));
      cur.setMonth(cur.getMonth()+1);
    }
    return arr;
  }

  const months = monthsBetween(start, end);

  // Helper to push an item but avoid duplicates (existing storage + items being generated)
  function pushItemIfUnique(dateStr, timeStr, description, amount, category){
    const ds = normalizeDate(dateStr);
    const ts = normalizeTime(timeStr);
    // skip items out of range (safe guard)
    const dt = new Date(`${ds}T${ts}`);
    if (isNaN(dt.getTime())) return false;
    if (dt < start || dt > end) return false;

    // check against existing expenses
    if (existsSimilarIn(expenses, ds, ts, description, amount, category)) return false;
    // check against items we are about to append (prevent duplicates inside same import)
    if (existsSimilarIn(items, ds, ts, description, amount, category)) return false;

    items.push({
      id: uid(),
      date: ds,
      time: ts,
      description,
      amount: Number(amount) || 0,
      category: category || 'Other',
      timestamp: dt.getTime()
    });
    return true;
  }

  // 1) fixed 1st-of-month items across months (Mess Lunch, Mess Dinner, Room Rent)
  months.forEach(mDate => {
    const y = mDate.getFullYear();
    const mm = String(mDate.getMonth()+1).padStart(2,'0');
    const d1 = `${y}-${mm}-01`;
    const dObj = new Date(d1 + 'T00:00');
    if (dObj < start) return;
    if (dObj > end) return;
    pushItemIfUnique(d1, '12:30', 'Mess (Lunch)', 1700, 'Food');
    pushItemIfUnique(d1, '20:00', 'Mess (Dinner)', 1600, 'Food');
    pushItemIfUnique(d1, '09:00', 'Room Rent', 5000, 'Bills');
  });

  // 2) daily iteration for Bread (every 3rd day), Fruits (every 5th day starting 2024-08-05), Chai (3x/day), Weekend Food
  const curDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (curDay <= end){
    const y = curDay.getFullYear();
    const m = String(curDay.getMonth()+1).padStart(2,'0');
    const d = curDay.getDate();
    const dateStr = `${y}-${m}-${String(d).padStart(2,'0')}`;

    // Bread every 3rd day from 2024-08-01: (day index starting 1)
    const diffDaysFromAug1 = Math.floor((curDay - new Date(2024,7,1)) / (24*3600*1000));
    if (diffDaysFromAug1 >= 0 && (diffDaysFromAug1 % 3) === 0){
      pushItemIfUnique(dateStr, '08:30', 'Bread', 20, 'Groceries');
    }

    // Fruits every 5th day from 5 Aug 2024
    if (curDay >= new Date(2024,7,5) && (d % 5) === 0){
      pushItemIfUnique(dateStr, '10:00', 'Fruits', 200, 'Groceries');
    }

    // Chai 3 random times daily starting from 2024-08-01
    if (curDay >= new Date(2024,7,1)){
      const chaiTimes = chooseTimesForChai();
      chaiTimes.forEach(t => pushItemIfUnique(dateStr, t, 'Chai', 20, 'Drink'));
    }

    // Food every weekend (Sat=6 / Sun=0) at lunchtime
    const dow = curDay.getDay();
    if (curDay >= new Date(2024,7,1) && (dow === 6 || dow === 0)){
      pushItemIfUnique(dateStr, '13:00', 'Weekend Food', 200, 'Food');
    }

    // next day
    curDay.setDate(curDay.getDate()+1);
  }

  // 3) month-level randoms: Breakfast (2 random days each month) and Printout (2-3 random days monthly starting Sep 2024 excluding some months)
  months.forEach(mDate => {
    const y = mDate.getFullYear();
    const mo = mDate.getMonth() + 1; // 1-based
    const monthKey = `${y}-${String(mo).padStart(2,'0')}`;
    const daysInMonth = new Date(y, mo, 0).getDate();

    // skip months fully outside [start,end] bounds
    const firstOfThisMonth = new Date(y, mo-1, 1);
    const lastOfThisMonth = new Date(y, mo-1, daysInMonth, 23,59,59);
    if (lastOfThisMonth < start || firstOfThisMonth > end) return;

    // Breakfast: 2 random distinct days each month
    const breakfastDays = pickRandomDaysInMonth(y, mo, 2);
    breakfastDays.forEach(d => {
      const dt = new Date(y, mo-1, d);
      if (dt < start || dt > end) return;
      const dateStr = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      pushItemIfUnique(dateStr, '09:00', 'Breakfast', 250, 'Food');
    });

    // Printout: start from Sep 2024 and exclude listed months
    const printoutStart = new Date('2024-09-01');
    if (firstOfThisMonth >= printoutStart && !excludedPrintoutMonths.has(monthKey)){
      const count = randInt(2,3);
      const printDays = pickRandomDaysInMonth(y, mo, count);
      printDays.forEach(d => {
        const dt = new Date(y, mo-1, d);
        if (dt < start || dt > end) return;
        const dateStr = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const hr = String(randInt(9,17)).padStart(2,'0');
        const minutes = [0,0,5,10,15,30][randInt(0,5)];
        const timeStr = `${hr}:${String(minutes).padStart(2,'0')}`;
        pushItemIfUnique(dateStr, timeStr, 'Printout', 100, 'Other');
      });
    }
  });

  // Append unique items to expenses
  const addedBefore = expenses.length;
  if (items.length){
    expenses = expenses.concat(items);
    saveAll();
    render();
    safeRenderCharts();
  }

  const addedCount = expenses.length - addedBefore;
  alert(`Imported sample data: ${addedCount} new items added (out of ${items.length} generated). Range: ${normalizeDate(start)} → ${normalizeDate(end)}.`);
  log('importSampleData: generated', items.length, 'added', addedCount);
}

/* Backwards-compat import sample button handler
   Original code referenced importSampleBtn with id 'import-sample-2' which might not exist.
   Also menu_m_import used to do importSampleBtn.click(); fix to call importSampleData directly.
*/
if (importSampleBtn) {
  importSampleBtn.addEventListener('click', (ev) => {
    ev && ev.preventDefault && ev.preventDefault();
    importSampleData();
  });
}

// previous small quick sample (kept as a fallback function name if referenced elsewhere)
function importSampleFallback(){
  const now = new Date(); const month = now.toISOString().slice(0,7);
  const sample = [
    { id: uid(), date: month+'-02', time:'08:30', description:'Breakfast - Samosa', amount:40, category:'Food', timestamp: new Date(month+'-02T08:30').getTime() },
    { id: uid(), date: month+'-03', time:'18:20', description:'Groceries - Veg', amount:320, category:'Groceries', timestamp: new Date(month+'-03T18:20').getTime() },
    { id: uid(), date: month+'-05', time:'12:30', description:'Lunch - Cafe', amount:250, category:'Food', timestamp: new Date(month+'-05T12:30').getTime() },
    { id: uid(), date: month+'-10', time:'09:00', description:'Monthly bill', amount:1500, category:'Bills', timestamp: new Date(month+'-10T09:00').getTime() }
  ];
  expenses = expenses.concat(sample);
  saveAll();
  render();
  safeRenderCharts();
}

/* Import sample, Export CSV wiring (menu uses menu_m_import) */
if (menu_m_import) menu_m_import.addEventListener('click', (ev)=> { ev.stopPropagation(); menuPanel.classList.add('hidden'); importSampleData(); });
if (exportCsvBtn) exportCsvBtn.addEventListener('click', ()=> {
  const month = filterMonth && filterMonth.value ? filterMonth.value : (new Date()).toISOString().slice(0,7);
  const combined = collectVisibleCombined(month);
  if (!combined || combined.length === 0){ alert('No items to export.'); return; }
  const rows = [['Date','Time','Description','Category','Amount']];
  combined.sort((a,b)=>a.timestamp - b.timestamp).forEach(e => rows.push([e.date, e.time, `${String(e.description).replace(/"/g,'""')}`, e.category, Number(e.amount).toFixed(2)]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `spendsage_${month}.csv`; a.click(); URL.revokeObjectURL(url);
});

/* collectVisibleCombined (used by export/pdf + charts) */
function collectVisibleCombined(month){
  const occurrences = expandRecurringForMonth(month);
  const baseMonth = expenses.filter(e => e.date && e.date.startsWith(month));
  let combined = baseMonth.concat(occurrences);
  const q = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';
  const sDate = (searchDate && searchDate.value) ? searchDate.value : null;
  combined = combined.filter(item => {
    if (sDate){
      if (!item.date || item.date !== sDate) return false;
    }
    if (q){
      if (!String(item.description).toLowerCase().includes(q) && !String(item.category||'').toLowerCase().includes(q)) return false;
    }
    return true;
  });
  return combined;
}

/* Canvas helpers & chart functions */
function ensureCanvasSize(canvas){
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(rect.width * ratio));
  const h = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== w || canvas.height !== h){
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}

const CATEGORY_COLORS = { 'Food':'#60a5fa', 'Drink':'#f472b6', 'Transport':'#34d399', 'Groceries':'#f97316', 'Bills':'#8b5cf6', 'Shopping':'#fb7185', 'Other':'#f59e0b' };
function pickColor(cat, i){ return CATEGORY_COLORS[cat] || Object.values(CATEGORY_COLORS)[i % Object.keys(CATEGORY_COLORS).length]; }

/* Track bar rectangles for hover hit-testing on monthly chart & yearly charts */
monthlyBars = [];
yearlyBars = [];

window.renderChart = function(combined, monthStr){
  try {
    monthlyBars = [];
    const canvas = chartCanvas || $id('chart');
    if (!canvas) return;
    ensureCanvasSize(canvas);
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    ctx.clearRect(0,0,W,H);

    if (!combined || combined.length === 0){
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--control-bg') || '#fff';
      ctx.fillRect(10,10,W-20,H-20);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--muted') || '#64748b';
      ctx.font = '13px system-ui, Arial';
      ctx.fillText('No data', 20, 32);
      return;
    }

    let days = 31;
    if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)){
      const [yy,mm] = monthStr.split('-').map(Number); days = new Date(yy, mm, 0).getDate();
    }
    const byDay = new Array(days+1).fill(0);
    combined.forEach(it => {
      const d = it.date ? (new Date(it.date)).getDate() : 1;
      if (d>=1 && d<=days) byDay[d] += Number(it.amount) || 0;
    });

    const maxVal = Math.max(1, ...byDay);
    const padding = 28;
    const chartW = W - padding*2;
    const chartH = H - padding*2 - 18; // leave space for day labels
    const barGap = 6;
    const barCount = days;
    const barWidthFloat = Math.max(2, (chartW - (barGap*(barCount-1))) / barCount);
    const barWidth = Math.max(1, Math.round(barWidthFloat));

    // grid lines
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--control-border') || '#eef2f7';
    ctx.lineWidth = 1;
    const gridLines = 4;
    ctx.beginPath();
    for (let i=0;i<=gridLines;i++){
      const y = padding + (i * (chartH/gridLines));
      ctx.moveTo(padding, Math.round(y)+0.5);
      ctx.lineTo(W-padding, Math.round(y)+0.5);
    }
    ctx.stroke();

    // bars
    for (let i=1;i<=days;i++){
      const val = byDay[i];
      const xFloat = padding + (i-1) * (barWidthFloat + barGap);
      const hFloat = (val / maxVal) * (chartH - 6);
      const yFloat = padding + chartH - hFloat;
      const x = Math.round(xFloat);
      const y = Math.round(yFloat);
      const h = Math.max(1, Math.round(hFloat));
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent-start') || '#60a5fa';
      ctx.fillRect(x, y, barWidth, h);

      // store bar rect for hover hit test using layout coords (rect.left/top + rounded values)
      monthlyBars.push({ x: (rect.left + x), y: (rect.top + y), w: barWidth, h: h, value: val, label: String(i) });
    }

    // draw small day labels beneath bars (sparingly)
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--muted') || '#64748b';
    ctx.font = '10px system-ui, Arial';
    ctx.textAlign = 'center';
    const maxLabelEvery = Math.ceil(days / 10);
    for (let i=1;i<=days;i+=1){
      if (i % maxLabelEvery !== 0 && days > 10) continue;
      const xFloat = padding + (i-1) * (barWidthFloat + barGap) + barWidthFloat/2;
      ctx.fillText(String(i), Math.round(xFloat), padding + chartH + 12);
    }

    ctx.textAlign = 'start';
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--muted') || '#64748b';
    ctx.font = '12px system-ui, Arial';
    ctx.fillText('Max ' + getFormatter().format(maxVal), padding+4, padding+12);

  } catch(e){ console.error('renderChart error', e); }
};

window.renderPieAndLegend = function(combined){
  try {
    const canvas = pieCanvas || $id('pie');
    const legendWrap = pieLegend || $id('pie-legend');
    if (!canvas || !legendWrap) return;
    ensureCanvasSize(canvas);
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    ctx.clearRect(0,0,W,H);

    if (!combined || combined.length === 0){
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--control-bg') || '#fff';
      ctx.fillRect(10,10,W-20,H-20);
      legendWrap.innerHTML = '';
      return;
    }

    const map = new Map();
    combined.forEach(it => {
      const cat = it.category || 'Other';
      map.set(cat, (map.get(cat) || 0) + (Number(it.amount) || 0));
    });
    const items = Array.from(map.entries()).sort((a,b) => b[1] - a[1]);
    const cx = W/2, cy = H/2, radius = Math.min(W,H) * 0.38;
    let start = -Math.PI/2;
    const total = items.reduce((s,i) => s + i[1], 0) || 1;

    items.forEach((kv, idx) => {
      const [cat, val] = kv;
      const slice = (val / total) * Math.PI*2;
      const col = pickColor(cat, idx);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      start += slice;
    });

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, radius*0.52, 0, Math.PI*2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    legendWrap.innerHTML = '';
    items.forEach((kv, idx) => {
      const [cat, val] = kv;
      const row = document.createElement('div'); row.className = 'legend-row';
      const color = document.createElement('div'); color.className = 'legend-color'; color.style.background = pickColor(cat, idx);
      const lbl = document.createElement('div'); lbl.className = 'legend-label'; lbl.textContent = cat;
      const valEl = document.createElement('div'); valEl.className = 'legend-value';
      const percent = Math.round((val / total) * 100);
      valEl.textContent = `${getFormatter().format(val)} • ${percent}%`;
      row.appendChild(color); row.appendChild(lbl); row.appendChild(valEl);
      legendWrap.appendChild(row);
    });

  } catch(e){ console.error('renderPieAndLegend error', e); }
};

window.renderYearly = function(allExpenses){
  try {
    yearlyBars = [];
    const canvas = yearlyCanvas || $id('yearly');
    const legendWrap = yearlyLegend || $id('yearly-legend');
    if (!canvas || !legendWrap) return;
    ensureCanvasSize(canvas);
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    ctx.clearRect(0,0,W,H);

    // build months for current year including recurring occurrences
    const now = new Date();
    const year = now.getFullYear();
    const months = new Array(12).fill(0);

    // add stored expenses
    (allExpenses || []).forEach(e => {
      if (!e.date) return;
      const d = new Date(e.date);
      if (d.getFullYear() === year) months[d.getMonth()] += Number(e.amount) || 0;
    });

    // include recurring rules expanded across the year
    for (let m = 0; m < 12; m++){
      const mm = String(m+1).padStart(2,'0');
      const monthStr = `${year}-${mm}`;
      const occ = expandRecurringForMonth(monthStr);
      occ.forEach(o => {
        const d = new Date(o.date);
        if (d.getFullYear() === year) months[d.getMonth()] += Number(o.amount) || 0;
      });
    }

    const maxVal = Math.max(1, ...months);
    const padding = 12;
    const barGap = 8;
    const barCount = 12;
    const chartW = W - padding*2;
    const barWidthFloat = Math.max(6, (chartW - (barGap*(barCount-1)))/barCount);
    const barWidth = Math.max(4, Math.round(barWidthFloat));
    const chartH = H - padding*2 - 18; // leave space for month labels
    const baseY = padding + chartH;

    months.forEach((val, i) => {
      const xFloat = padding + i * (barWidthFloat + barGap);
      const hFloat = (val / maxVal) * (chartH);
      const yFloat = baseY - hFloat;
      const x = Math.round(xFloat);
      const y = Math.round(yFloat);
      const h = Math.max(1, Math.round(hFloat));
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent-start') || '#60a5fa';
      ctx.fillRect(x, y, barWidth, h);

      // store rect (page coords) - use rounded numbers to match drawing
      yearlyBars.push({ x: rect.left + x, y: rect.top + y, w: barWidth, h: h, value: val, label: i });
    });

    // month labels
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--muted') || '#64748b';
    ctx.font = '10px system-ui, Arial';
    ctx.textAlign = 'center';
    for (let i=0;i<12;i++){
      const xFloat = padding + i * (barWidthFloat + barGap) + barWidthFloat/2;
      ctx.fillText(monthNames[i], Math.round(xFloat), padding + chartH + 14);
    }
    ctx.textAlign = 'start';

    const total = months.reduce((s,n)=>s+n,0);
    legendWrap.innerHTML = '';
    const r = document.createElement('div'); r.className = 'legend-row';
    const lbl = document.createElement('div'); lbl.className='legend-label'; lbl.textContent = `${year} total`;
    const valEl = document.createElement('div'); valEl.className='legend-value'; valEl.textContent = getFormatter().format(total);
    r.appendChild(lbl); r.appendChild(valEl); legendWrap.appendChild(r);

  } catch(e){ console.error('renderYearly error', e); }
};

/* Export PDF (guarded) */
(function guardedExport(){
  if (window.__spendSage_exportGuard) return;
  window.__spendSage_exportGuard = true;

  function ensureExportPdfButton(){
    if ($id('export-pdf')) return $id('export-pdf');
    const btn = document.createElement('button');
    btn.id = 'export-pdf';
    btn.className = 'menu-item';
    btn.type = 'button';
    btn.textContent = '🖨️ Export PDF (hidden)';
    btn.style.display = 'none';
    document.body.appendChild(btn);
    return btn;
  }

  function canvasToDataURLSafe(canvas){
    try { if (!canvas) return null; return canvas.toDataURL('image/png', 0.9); } catch(e){ return null; }
  }

  async function exportToPDF_Guarded(){
    try {
      const month = (filterMonth && filterMonth.value) ? filterMonth.value : (new Date()).toISOString().slice(0,7);
      const combined = collectVisibleCombined(month);
      if ((!combined || combined.length === 0) && !confirm('No items for selected month. Export empty report anyway?')) return;

      const barImg = canvasToDataURLSafe(chartCanvas || $id('chart'));
      const pieImg = canvasToDataURLSafe(pieCanvas || $id('pie'));

      const rows = (combined || []).sort((a,b)=>a.timestamp - b.timestamp).map(it => {
        const desc = (it.description || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return `<tr>
          <td style="padding:6px 8px;border:1px solid #eee">${it.date||''}</td>
          <td style="padding:6px 8px;border:1px solid #eee">${it.time||''}</td>
          <td style="padding:6px 8px;border:1px solid #eee">${desc}</td>
          <td style="padding:6px 8px;border:1px solid #eee">${it.category||''}</td>
          <td style="padding:6px 8px;border:1px solid #eee;text-align:right">${Number(it.amount||0).toFixed(2)}</td>
        </tr>`;
      }).join('');

      const total = (combined || []).reduce((s,x)=>s + (Number(x.amount)||0), 0);

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>SpendSage Report ${month}</title>
        <style>
          body{ font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial; color:#111; padding:18px; }
          .header{ display:flex; justify-content:space-between; align-items:center; gap:12px; }
          h1{ margin:0 0 6px 0; font-size:20px; }
          .meta{ color:#666; font-size:13px; margin-bottom:12px; }
          .charts{ display:flex; gap:12px; margin-top:12px; }
          .chart-img{ width:48%; border:1px solid #eee; border-radius:8px; padding:6px; background:#fff; }
          table{ width:100%; border-collapse:collapse; margin-top:16px; }
          th,td{ padding:8px 10px; border:1px solid #eee; font-size:13px; }
          th{ background:#fafafa; text-align:left; }
          .total{ margin-top:12px; font-weight:700; }
        </style>
        </head><body>
          <div class="header">
            <div><h1>SpendSage — Report</h1><div class="meta">Month: ${month} • Generated: ${new Date().toLocaleString()}</div></div>
            <div style="text-align:right"><div style="font-weight:700">Total</div><div style="font-size:18px">${getFormatter().format(total)}</div></div>
          </div>
          <div class="charts">
            ${ barImg ? `<div class="chart-img"><img src="${barImg}" style="width:100%;height:auto;border-radius:6px"/></div>` : '' }
            ${ pieImg ? `<div class="chart-img"><img src="${pieImg}" style="width:100%;height:auto;border-radius:6px"/></div>` : '' }
          </div>
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Description</th><th>Category</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="total">Total: ${getFormatter().format(total)}</div>
        </body></html>`;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const idoc = iframe.contentWindow.document;
      idoc.open();
      idoc.write(html);
      idoc.close();

      const tryPrint = () => new Promise(resolve => {
        setTimeout(() => {
          try { iframe.contentWindow.focus(); } catch(e){}
          try {
            iframe.contentWindow.print();
            resolve({ ok: true });
          } catch(err){ resolve({ ok: false, err }); }
        }, 600);
      });

      const res = await tryPrint();
      setTimeout(() => { try { iframe.parentNode && iframe.parentNode.removeChild(iframe); } catch(e){} }, 900);

      if (!res.ok) {
        try {
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `spendsage_report_${month}.html`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(()=> URL.revokeObjectURL(url), 1500);
          alert('Print dialog could not be opened automatically. The report HTML was downloaded — open it and use your browser Print → Save as PDF.');
        } catch(downErr){
          console.error('Export fallback failed', downErr);
          alert('Export failed — see console for details.');
        }
      } else {
        log('Report print triggered (iframe).');
      }

    } catch(e){
      console.error('exportToPDF failed', e);
      alert('Export PDF failed — see console for details.');
    }
  }

  const exportPdfBtn = ensureExportPdfButton();
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', (ev)=> { ev && ev.preventDefault && ev.preventDefault(); exportToPDF_Guarded(); });
})();

/* Selection helpers */
function getSelectedIds(){
  const checks = expenseList ? expenseList.querySelectorAll('input.select-chk') : [];
  const ids = [];
  const recurringIds = [];
  checks.forEach(c => {
    if (c.checked && c.dataset){
      if (c.dataset.id) ids.push(c.dataset.id);
      if (c.dataset.recurringId) recurringIds.push(c.dataset.recurringId);
    }
  });
  return { ids, recurringIds };
}
function selectAllVisible(checked = true){
  const checks = expenseList ? expenseList.querySelectorAll('input.select-chk') : [];
  checks.forEach(c => { c.checked = !!checked; });
}
function invertSelectionVisible(){
  const checks = expenseList ? expenseList.querySelectorAll('input.select-chk') : [];
  checks.forEach(c => { c.checked = !c.checked; });
}
function deleteSelected(){
  const { ids, recurringIds } = getSelectedIds();
  if ((!ids || ids.length === 0) && (!recurringIds || recurringIds.length === 0)){ alert('No items selected.'); return; }
  if (!confirm(`Delete ${ids.length + recurringIds.length} selected item(s)? This cannot be undone.`)) return;

  if (ids && ids.length) {
    expenses = expenses.filter(e => !ids.includes(e.id));
  }
  if (recurringIds && recurringIds.length){
    recurringRules = recurringRules.filter(r => !recurringIds.includes(r.id));
  }

  saveAll();
  render();
  safeRenderCharts();
  alert(`Deleted ${ids.length + recurringIds.length} item(s).`);
}

/* Remove / Replace / Remove category */
function removeCategory(cat){
  if (!cat) return 0;
  const before = expenses.length + recurringRules.length;
  expenses = expenses.filter(e => (e.category||'') !== cat);
  recurringRules = recurringRules.filter(r => (r.category||'') !== cat);
  const after = expenses.length + recurringRules.length;
  const removed = before - after;
  saveAll(); render(); safeRenderCharts();
  return removed;
}
function replaceBills(newItems){
  removeCategory('Bills');
  if (!Array.isArray(newItems)) return;
  newItems.forEach(it => {
    const item = Object.assign({ id: uid(), timestamp: new Date((it.date||'') + 'T' + (it.time||'00:00')).getTime() }, it);
    expenses.push(item);
  });
  saveAll(); render(); safeRenderCharts();
}

/* Menu wiring */
if (menu_m_add) menu_m_add.addEventListener('click', (ev)=> { ev.stopPropagation(); menuPanel.classList.add('hidden'); window.scrollTo({ top: 120, behavior: 'smooth' }); setTimeout(()=> { const d = $id('description'); if (d) d.focus(); }, 300); });
if (menu_m_recurring) menu_m_recurring.addEventListener('click', (ev)=> { ev.stopPropagation(); menuPanel.classList.add('hidden'); alert('Open recurring manager (not implemented in UI).'); });
if (menu_m_import) menu_m_import.addEventListener('click', (ev)=> { ev.stopPropagation(); menuPanel.classList.add('hidden'); importSampleData(); });
if (menu_m_export_csv) menu_m_export_csv.addEventListener('click', (ev)=> { ev.stopPropagation(); menuPanel.classList.add('hidden'); if (exportCsvBtn) exportCsvBtn.click(); });
if (menu_m_export_pdf) menu_m_export_pdf.addEventListener('click', (ev)=> { ev.stopPropagation(); menuPanel.classList.add('hidden'); const eb = $id('export-pdf'); if (eb) eb.click(); else alert('Export PDF not available.'); });

if (menu_m_select_all) menu_m_select_all.addEventListener('click', (ev)=> { ev.stopPropagation(); menuPanel.classList.add('hidden'); selectAllVisible(true); });
if (menu_m_invert) menu_m_invert.addEventListener('click', (ev)=> { ev.stopPropagation(); menuPanel.classList.add('hidden'); invertSelectionVisible(); });
if (menu_m_delete) menu_m_delete.addEventListener('click', (ev)=> { ev.stopPropagation(); menuPanel.classList.add('hidden'); deleteSelected(); });

if (menu_m_replace_bills) menu_m_replace_bills.addEventListener('click', (ev)=> {
  ev.stopPropagation(); menuPanel.classList.add('hidden');
  const json = prompt('Paste JSON array of new bill items (each with date,time,description,amount). Example: [{"date":"2025-11-01","time":"09:00","description":"New bill","amount":1200}]');
  if (!json) return;
  try {
    const arr = JSON.parse(json);
    replaceBills(arr);
    alert('Bills replaced.');
  } catch(e){
    alert('Invalid JSON. Replace aborted.');
  }
});

if (menu_m_remove_category) menu_m_remove_category.addEventListener('click', (ev)=> {
  ev.stopPropagation(); menuPanel.classList.add('hidden');
  const cat = prompt('Enter category name to remove (exact):');
  if (!cat) return;
  if (!confirm(`Remove ALL items in category "${cat}"? This cannot be undone.`)) return;
  const removed = removeCategory(cat);
  alert(`Removed ${removed} item(s) in category "${cat}".`);
});

/* safeRenderCharts */
function safeRenderCharts(){
  try {
    const month = (filterMonth && filterMonth.value) ? filterMonth.value : (new Date()).toISOString().slice(0,7);
    const combined = collectVisibleCombined(month);
    if (typeof window.renderChart === 'function') window.renderChart(combined, month);
    if (typeof window.renderPieAndLegend === 'function') window.renderPieAndLegend(combined);
    if (typeof window.renderYearly === 'function') window.renderYearly(expenses);
  } catch(e){ console.error(e); }
}

/* Wire search and filters */
if (filterMonth) filterMonth.addEventListener('change', ()=> { render(); safeRenderCharts(); });
if (searchInput) {
  searchInput.addEventListener('input', ()=> { render(); safeRenderCharts(); });
  // show popup on Enter: display full details of current filtered items
  searchInput.addEventListener('keydown', (ev)=> {
    if (ev.key === 'Enter'){
      ev.preventDefault();
      showSearchPopup();
    }
  });
}
if (searchDate) searchDate.addEventListener('change', ()=> { render(); safeRenderCharts(); });
if ($id('sort-by')) $id('sort-by').addEventListener('change', ()=> { render(); });

/* search popup handling (close when clicking outside) */
function buildResultRow(item){
  const div = document.createElement('div'); div.className = 'result-row';
  const title = document.createElement('strong'); title.textContent = item.description || '(no description)';
  const meta = document.createElement('div'); meta.className = 'result-meta';
  meta.textContent = `${item.date || ''} ${item.time || ''} • ${fmt(item.amount)} • ${item.category || ''}${item.recurringId ? ' • recurring' : ''}`;
  div.appendChild(title); div.appendChild(meta);
  return div;
}
function showSearchPopup(){
  const month = (filterMonth && filterMonth.value) ? filterMonth.value : (new Date()).toISOString().slice(0,7);
  const combined = collectVisibleCombined(month);
  if (!combined || combined.length === 0){
    alert('No matching items.');
    return;
  }
  searchPopupBody.innerHTML = '';
  combined.forEach(it => searchPopupBody.appendChild(buildResultRow(it)));
  searchPopup.classList.remove('hidden');
  searchPopup.setAttribute('aria-hidden','false');
}
function hideSearchPopup(){
  if (!searchPopup) return;
  searchPopup.classList.add('hidden');
  searchPopup.setAttribute('aria-hidden','true');
}
if (searchPopupClose) searchPopupClose.addEventListener('click', hideSearchPopup);
document.addEventListener('click', (ev)=> {
  // hide search popup when clicking outside (but not when clicking inside it or the search input)
  if (!searchPopup) return;
  if (!searchPopup.classList.contains('hidden')){
    if (!searchPopup.contains(ev.target) && ev.target !== searchInput) hideSearchPopup();
  }
});

/* canvas tooltip handling for monthly and yearly charts */
function showCanvasTooltip(text, x, y){
  if (!canvasTooltip) return;
  canvasTooltip.textContent = text;
  // clamp to viewport horizontally
  const vw = Math.max(0, window.innerWidth || document.documentElement.clientWidth);
  let left = x;
  if (left < 40) left = 40;
  if (left > vw - 40) left = vw - 40;
  canvasTooltip.style.left = left + 'px';
  canvasTooltip.style.top = (y - 8) + 'px';
  canvasTooltip.classList.remove('hidden');
  canvasTooltip.setAttribute('aria-hidden','false');
}
function hideCanvasTooltip(){
  if (!canvasTooltip) return;
  canvasTooltip.classList.add('hidden');
  canvasTooltip.setAttribute('aria-hidden','true');
}

function onMouseMoveForCanvas(e){
  // check monthlyBars then yearlyBars
  const x = e.clientX, y = e.clientY;
  for (let b of monthlyBars){
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h){
      const text = `${fmt(b.value)} • Day ${b.label}`;
      showCanvasTooltip(text, x, b.y);
      return;
    }
  }
  for (let b of yearlyBars){
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h){
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const text = `${fmt(b.value)} • ${monthNames[b.label]}`;
      showCanvasTooltip(text, x, b.y);
      return;
    }
  }
  hideCanvasTooltip();
}
function onMouseLeaveCanvas(){
  hideCanvasTooltip();
}

window.addEventListener('mousemove', onMouseMoveForCanvas);
window.addEventListener('scroll', hideCanvasTooltip);
window.addEventListener('resize', hideCanvasTooltip);

/* redraw on resize */
let _resizeTimer = null;
window.addEventListener('resize', ()=> { clearTimeout(_resizeTimer); _resizeTimer = setTimeout(()=> { ensureCanvasSize(chartCanvas); ensureCanvasSize(pieCanvas); ensureCanvasSize(yearlyCanvas); safeRenderCharts(); }, 150); });

/* last-added display helpers */
function showLastAdded(item){
  if (!lastAddedEl) return;
  lastAddedEl.classList.remove('hidden');
  const amount = fmt(item.amount);
  lastAddedEl.textContent = `Last added: ${amount} — ${item.description} (${item.date})`;
}
function hideLastAdded(){
  if (!lastAddedEl) return;
  lastAddedEl.classList.add('hidden');
  lastAddedEl.textContent = '';
}

/* Init */
function init(){
  loadAll();
  if (filterMonth && !filterMonth.value) filterMonth.value = (new Date()).toISOString().slice(0,7);
  render();
  safeRenderCharts();
  log('App initialized');
}
init();

/* Expose helpers */
window.spendsage = Object.assign(window.spendsage || {}, {
  expenses, recurringRules, render, saveAll,
  getSelectedIds: () => getSelectedIds(),
  selectAllVisible, invertSelectionVisible, deleteSelected,
  removeCategory, replaceBills, showSearchPopup, hideSearchPopup,
  // expose importSampleData globally so other UI scripts (fail-safe) can call it
  importSampleData
});

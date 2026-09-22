// SpendSage Premium AI Architecture

// ==========================================
// STATE & INITIALIZATION
// ==========================================
let expenses = [];
let recurringRules = [];
let cashflowChart = null;
let categoryChart = null;

// DOM Elements
const $id = id => document.getElementById(id);
const views = { dashboard: $id('view-dashboard'), transactions: $id('view-transactions'), settings: $id('view-settings'), budgets: $id('view-budgets'), bills: $id('view-bills') };

// ==========================================
// CORE LOGIC & PERSISTENCE
// ==========================================
function safeParse(str, def){ try{return JSON.parse(str)||def;}catch(e){return def;}}
function generateId(){ return Date.now().toString(36) + Math.random().toString(36).substring(2); }
function getFormatter(){
  const loc = $id('settings-locale')?.value || 'auto';
  const cur = $id('settings-currency')?.value || 'INR';
  return new Intl.NumberFormat(loc === 'auto' ? undefined : loc, {
    style: 'currency', currency: cur === 'auto' ? 'INR' : cur
  });
}
function fmt(val){ return getFormatter().format(val); }

function loadData() {
  expenses = safeParse(localStorage.getItem('spendsage_v4'), []);
  recurringRules = safeParse(localStorage.getItem('spendsage_rules_v4'), []);
}
function saveData() {
  localStorage.setItem('spendsage_v4', JSON.stringify(expenses));
  localStorage.setItem('spendsage_rules_v4', JSON.stringify(recurringRules));
}

// ==========================================
// NAVIGATION (SPA)
// ==========================================
document.querySelectorAll('.nav-item[data-target]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    // Hide all views, show target
    Object.values(views).forEach(v => v.classList.add('hidden'));
    const target = $id(e.currentTarget.dataset.target);
    if(target) target.classList.remove('hidden');

    if(e.currentTarget.dataset.target === 'view-dashboard') renderDashboard();
  });
});

// ==========================================
// TRANSACTIONS TABLE RENDERING
// ==========================================
function renderTransactions() {
  const tbody = $id('transaction-tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  const monthFilter = $id('filter-month').value;
  const searchFilter = $id('search-input').value.toLowerCase();
  
  let filtered = expenses.sort((a,b) => (new Date(`${b.date}T${b.time||'00:00'}`)) - (new Date(`${a.date}T${a.time||'00:00'}`)));
  
  if (monthFilter) {
    filtered = filtered.filter(e => e.date.startsWith(monthFilter));
  }
  if (searchFilter) {
    filtered = filtered.filter(e => (e.description||'').toLowerCase().includes(searchFilter) || e.category.toLowerCase().includes(searchFilter));
  }

  let total = 0;
  filtered.forEach(e => {
    const amt = parseFloat(e.amount) || 0;
    if (e.category === 'Income') total += amt;
    else total -= amt;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" class="row-chk" data-id="${e.id}" /></td>
      <td class="td-meta">${e.date}</td>
      <td class="td-desc">${e.description || '-'}</td>
      <td class="td-meta">${e.category}</td>
      <td class="td-amt align-right ${e.category === 'Income' ? 'text-emerald' : ''}">${fmt(amt)}</td>
      <td class="align-center">
        <button class="btn ghost small del-btn" data-id="${e.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  $id('total-amount').textContent = `Net: ${fmt(total)}`;
  $id('total-amount').className = 'table-total ' + (total >= 0 ? 'text-emerald' : 'text-rose');

  // Bind delete buttons
  document.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      expenses = expenses.filter(x => x.id !== id);
      saveData();
      renderTransactions();
    });
  });
}

$id('filter-month').addEventListener('change', renderTransactions);
$id('search-input').addEventListener('input', renderTransactions);

$id('m-select-all-visible').addEventListener('click', () => {
  document.querySelectorAll('.row-chk').forEach(chk => chk.checked = true);
});
$id('m-delete-selected').addEventListener('click', () => {
  const ids = Array.from(document.querySelectorAll('.row-chk:checked')).map(c => c.dataset.id);
  if (ids.length === 0) return;
  if (!confirm(`Delete ${ids.length} transactions?`)) return;
  expenses = expenses.filter(e => !ids.includes(e.id));
  saveData();
  renderTransactions();
});

// ==========================================
// DASHBOARD & CHARTS
// ==========================================
function renderDashboard() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  
  let balance = 0, mIncome = 0, mExpenses = 0;
  
  // Chart Data Structs
  const dailyFlow = {}; 
  const catTotals = {};

  expenses.forEach(e => {
    const amt = parseFloat(e.amount) || 0;
    const isIncome = e.category === 'Income';
    
    if (isIncome) balance += amt;
    else balance -= amt;

    if (e.date.startsWith(currentMonth)) {
      if (isIncome) mIncome += amt;
      else {
        mExpenses += amt;
        catTotals[e.category] = (catTotals[e.category] || 0) + amt;
      }
      
      // Daily flow
      const day = e.date.split('-')[2];
      dailyFlow[day] = dailyFlow[day] || { in:0, out:0 };
      if (isIncome) dailyFlow[day].in += amt;
      else dailyFlow[day].out += amt;
    }
  });

  $id('kpi-balance').textContent = fmt(balance);
  $id('kpi-income').textContent = fmt(mIncome);
  $id('kpi-expenses').textContent = fmt(mExpenses);

  // Render Charts
  const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const labels = Array.from({length: daysInMonth}, (_, i) => String(i+1).padStart(2,'0'));
  const inData = labels.map(d => dailyFlow[d]?.in || 0);
  const outData = labels.map(d => dailyFlow[d]?.out || 0);

  if (cashflowChart) cashflowChart.destroy();
  const cfCtx = $id('cashflowChart');
  if (cfCtx) {
    cashflowChart = new Chart(cfCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Income', data: inData, borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 },
          { label: 'Expenses', data: outData, borderColor: '#F43F5E', backgroundColor: 'rgba(244, 63, 94, 0.1)', fill: true, tension: 0.4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
    });
  }

  if (categoryChart) categoryChart.destroy();
  const catCtx = $id('categoryChart');
  if (catCtx) {
    const cats = Object.keys(catTotals).sort((a,b) => catTotals[b] - catTotals[a]);
    const cData = cats.map(c => catTotals[c]);
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#F43F5E', '#0EA5E9', '#8B5CF6', '#14B8A6'];
    
    categoryChart = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: cats,
        datasets: [{ data: cData, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'right' } } }
    });
  }
}

// ==========================================
// AI ASSISTANT (REPORTS & REMINDERS)
// ==========================================
function generateAIInsights() {
  const now = new Date();
  
  // Weekly
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
  let wExp = 0, lastWExp = 0;
  
  // Monthly
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  let mExp = 0, mInc = 0;
  
  // Recurring detection
  const potentialBills = {};

  expenses.forEach(e => {
    const d = new Date(e.date);
    const amt = parseFloat(e.amount) || 0;
    
    if (e.category !== 'Income') {
      if (e.date.startsWith(currentMonth)) mExp += amt;
      
      if (d >= startOfWeek) wExp += amt;
      else if (d >= new Date(startOfWeek).setDate(startOfWeek.getDate()-7)) lastWExp += amt;
      
      // Reminders Logic
      if (['Bills', 'Rent', 'Investments'].includes(e.category)) {
        const desc = e.description.toLowerCase();
        if(!potentialBills[desc]) potentialBills[desc] = { amounts: [], days: [] };
        potentialBills[desc].amounts.push(amt);
        potentialBills[desc].days.push(d.getDate());
      }
    } else {
      if (e.date.startsWith(currentMonth)) mInc += amt;
    }
  });

  // Weekly Report Text
  let wText = `You spent <strong>${fmt(wExp)}</strong> this week. `;
  if (lastWExp > 0) {
    const diff = ((wExp - lastWExp)/lastWExp)*100;
    wText += diff > 0 ? `That is up ${Math.round(diff)}% from last week. Try to slow down!` : `Great job! You spent ${Math.abs(Math.round(diff))}% less than last week.`;
  } else wText += 'Keep tracking to see week-over-week trends.';
  $id('ai-report-weekly').innerHTML = wText;

  // Monthly Report Text
  let mText = `You earned <strong>${fmt(mInc)}</strong> and spent <strong>${fmt(mExp)}</strong> this month. `;
  if (mInc > 0) {
    const saveRate = ((mInc - mExp) / mInc) * 100;
    if (saveRate > 20) mText += `Excellent! Your savings rate is a healthy ${Math.round(saveRate)}%.`;
    else if (saveRate > 0) mText += `Your savings rate is ${Math.round(saveRate)}%. Aim for 20% by trimming discretionary spending.`;
    else mText += `<span class="text-rose">You are operating at a deficit. Cut back immediately.</span>`;
  }
  $id('ai-report-monthly').innerHTML = mText;
  $id('ai-report-yearly').innerHTML = `Year-to-date analysis is actively building as you log data. Consistency is key!`;

  // Predictive Reminders
  let remText = '';
  Object.keys(potentialBills).forEach(desc => {
    const data = potentialBills[desc];
    if (data.days.length > 1) { // Appears recurring
      const avgDay = Math.round(data.days.reduce((a,b)=>a+b,0)/data.days.length);
      const avgAmt = data.amounts.reduce((a,b)=>a+b,0)/data.amounts.length;
      if (now.getDate() < avgDay && (avgDay - now.getDate() <= 7)) {
        remText += `<div style="margin-bottom:8px">ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬Â You usually pay <strong>${desc}</strong> around the ${avgDay}th. Keep ~${fmt(avgAmt)} ready!</div>`;
      }
    }
  });
  $id('ai-reminders-content').innerHTML = remText || 'No upcoming bills detected in the next 7 days.';
  
  // Pacing
  const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const safeDaily = (mInc - mExp) / (daysInMonth - now.getDate() + 1);
  $id('ai-pacing-content').innerHTML = safeDaily > 0 
    ? `Your Safe Daily Spend is <strong>${fmt(safeDaily)}/day</strong> for the rest of the month.` 
    : `<span class="text-rose">You have no safe daily spend left!</span>`;
}

// AI Panel Toggle
const aiPanel = $id('ai-panel');
$id('fab-ai').addEventListener('click', () => {
  aiPanel.classList.remove('hidden');
  generateAIInsights();
});
$id('close-ai-panel').addEventListener('click', () => aiPanel.classList.add('hidden'));

// ==========================================
// ADD TRANSACTION MODAL
// ==========================================
const addModal = $id('add-modal');
$id('fab-add').addEventListener('click', () => {
  $id('date').value = new Date().toISOString().slice(0,10);
  addModal.classList.remove('hidden');
});
$id('close-add-modal').addEventListener('click', () => addModal.classList.add('hidden'));

// Smart Auto-Categorization
$id('description').addEventListener('input', (ev) => {
  const val = ev.target.value.toLowerCase();
  const cat = $id('category');
  if (val.includes('uber') || val.includes('train')) cat.value = 'Transport';
  else if (val.includes('zomato') || val.includes('food')) cat.value = 'Food';
  else if (val.includes('coffee') || val.includes('drink')) cat.value = 'Drink';
  else if (val.includes('grocery') || val.includes('mart')) cat.value = 'Groceries';
  else if (val.includes('rent') || val.includes('bill')) cat.value = 'Bills';
  else if (val.includes('amazon')) cat.value = 'Shopping';
});

$id('expense-form').addEventListener('submit', (e) => {
  e.preventDefault();
  expenses.push({
    id: generateId(),
    date: $id('date').value,
    time: $id('time').value || '12:00',
    description: $id('description').value,
    amount: parseFloat($id('amount').value) || 0,
    category: $id('category').value
  });
  saveData();
  addModal.classList.add('hidden');
  $id('expense-form').reset();
  
  if(!$id('view-dashboard').classList.contains('hidden')) renderDashboard();
  if(!$id('view-transactions').classList.contains('hidden')) renderTransactions();
});
// ==========================================
// SETTINGS, THEME & APP LOCK
// ==========================================
const themeMeta = $id('theme-color-meta');
function applyTheme(isDark) {
  if(isDark) {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    $id('theme-toggle').innerHTML = '<span class="icon">ðŸŒž</span> Light Mode';
    themeMeta.content = '#0F172A';
  } else {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    $id('theme-toggle').innerHTML = '<span class="icon">ðŸŒ™</span> Dark Mode';
    themeMeta.content = '#F9FAFB';
  }
}

$id('theme-toggle').addEventListener('click', () => {
  const isDark = document.body.classList.contains('theme-light');
  let prefs = safeParse(localStorage.getItem('spendsage_prefs_v1'), {});
  prefs.theme = isDark ? 'dark' : 'light';
  localStorage.setItem('spendsage_prefs_v1', JSON.stringify(prefs));
  applyTheme(isDark);
  
  const savedPin = localStorage.getItem('spendsage_pin_v1');
  if (!savedPin) {
    localStorage.setItem('spendsage_pin_v1', val);
    $id('pin-lock-panel').classList.add('hidden');
  } else {
    if (val === savedPin) $id('pin-lock-panel').classList.add('hidden');
    else { alert('Incorrect PIN!'); $id('app-pin-input').value = ''; }
  }
});

// Import Sample Data
$id('m-import-sample').addEventListener('click', () => {
  const start = new Date(); start.setFullYear(start.getFullYear() - 1);
  const end = new Date();
  const cats = ['Food', 'Transport', 'Bills', 'Groceries', 'Shopping', 'Investments', 'Savings'];
  const descs = ['Lunch', 'Uber', 'Electricity', 'D-Mart', 'Amazon', 'Mutual Fund', 'Emergency Fund'];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + Math.floor(Math.random() * 3) + 1)) {
     expenses.push({ id: generateId(), date: d.toISOString().slice(0, 10), time: '12:00', category: cats[Math.floor(Math.random() * cats.length)], description: descs[Math.floor(Math.random() * descs.length)], amount: Math.floor(Math.random() * 2000) + 100 });
  }
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 30)) {
     expenses.push({ id: generateId(), date: d.toISOString().slice(0, 10), time: '09:00', category: 'Income', description: 'Salary', amount: 50000 });
  }
  saveData();
  renderDashboard();
  renderTransactions();
  alert('Imported 1 year of sample data!');
});

// PDF Export
$id('download-report-btn').addEventListener('click', () => {
  if (typeof html2pdf === 'undefined') return alert('PDF generator loading...');
  html2pdf().set({ margin: 10, filename: 'SpendSage_Report.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } }).from(document.querySelector('.main-content')).save();
});

// Init
loadData();
loadSettings();
if($id('filter-month')) $id('filter-month').value = new Date().toISOString().slice(0,7);
renderDashboard();
renderTransactions();

// ==========================================
// NEW FEATURES: BUDGETS, HEATMAP, OCR, CSV
// ==========================================


// ==========================================
// NEW FEATURES: BUDGETS, HEATMAP, OCR, CSV
// ==========================================

// 1. BUDGETS LOGIC
let budgets = safeParse(localStorage.getItem('spendsage_budgets_v4'), {});
if(!views.budgets) views.budgets = document.getElementById('view-budgets');

document.querySelector('[data-target="view-budgets"]').addEventListener('click', (e) => {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  e.currentTarget.classList.add('active');
  Object.values(views).forEach(v => { if(v) v.classList.add('hidden'); });
  if(views.budgets) views.budgets.classList.remove('hidden');
  renderBudgets();
});

function renderBudgets() {
  const container = document.getElementById('budgets-container');
  if(!container) return;
  container.innerHTML = '';
  
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  
  const spent = {};
  expenses.forEach(e => {
    if (e.date.startsWith(currentMonth) && e.category !== 'Income') {
      spent[e.category] = (spent[e.category] || 0) + parseFloat(e.amount);
    }
  });

  if(Object.keys(budgets).length === 0) {
    container.innerHTML = '<p class="text-muted">No budgets set. Click "Set New Limit".</p>';
    return;
  }

  Object.keys(budgets).forEach(cat => {
    const limit = budgets[cat];
    const current = spent[cat] || 0;
    const pct = Math.min((current / limit) * 100, 100);
    
    let colorClass = 'safe';
    if(pct > 75) colorClass = 'warn';
    if(pct >= 90) colorClass = 'danger';

    const card = document.createElement('div');
    card.className = 'budget-card';
    card.innerHTML = `
      <div class="budget-header">
        <span class="budget-title">${cat}</span>
        <span class="budget-amt">${fmt(current)} / ${fmt(limit)}</span>
      </div>
      <div class="budget-bar-bg">
        <div class="budget-bar-fill ${colorClass}" style="width: ${pct}%"></div>
      </div>
      <button class="btn ghost small del-budget" data-cat="${cat}" style="margin-top: 12px">Remove</button>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll('.del-budget').forEach(btn => {
    btn.addEventListener('click', (e) => {
      delete budgets[e.target.dataset.cat];
      localStorage.setItem('spendsage_budgets_v4', JSON.stringify(budgets));
      renderBudgets();
    });
  });
}

const addBudgetBtn = document.getElementById('add-budget-btn');
if(addBudgetBtn) {
  addBudgetBtn.addEventListener('click', () => {
    const cat = prompt("Enter Category name (e.g., Food, Shopping):");
    if(!cat) return;
    const limit = parseFloat(prompt(`Enter monthly limit for ${cat}:`));
    if(!limit || limit <= 0) return;
    
    budgets[cat] = limit;
    localStorage.setItem('spendsage_budgets_v4', JSON.stringify(budgets));
    renderBudgets();
  });
}

// 2. HEATMAP LOGIC
function renderHeatmap() {
  const grid = document.getElementById('heatmap-grid');
  if(!grid) return;
  grid.innerHTML = '';
  
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setDate(now.getDate() - 365);
  
  const dailySpent = {};
  expenses.forEach(e => {
    if(e.category !== 'Income') {
      dailySpent[e.date] = (dailySpent[e.date] || 0) + parseFloat(e.amount);
    }
  });

  let maxAmt = 1;
  Object.values(dailySpent).forEach(v => { if(v > maxAmt) maxAmt = v; });

  for (let d = new Date(oneYearAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const amt = dailySpent[dateStr] || 0;
    
    let lvl = 0;
    if (amt > 0) {
      const ratio = amt / maxAmt;
      if (ratio > 0.75) lvl = 4;
      else if (ratio > 0.5) lvl = 3;
      else if (ratio > 0.25) lvl = 2;
      else lvl = 1;
    }

    const cell = document.createElement('div');
    cell.className = `heatmap-cell level-${lvl}`;
    cell.title = `${dateStr}: ${fmt(amt)}`;
    grid.appendChild(cell);
  }
}

const oldRenderDashboard = renderDashboard;
renderDashboard = function() {
  oldRenderDashboard();
  renderHeatmap();
};

// 3. OCR RECEIPT SCANNING (Tesseract.js)
const ocrUpload = document.getElementById('ocr-upload');
const ocrStatus = document.getElementById('ocr-status');
if(ocrUpload) {
  ocrUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    
    if (typeof Tesseract === 'undefined') {
      alert("OCR Library is still loading. Please wait a moment.");
      return;
    }

    ocrStatus.textContent = 'Scanning receipt...';
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      
      const matches = text.match(/[\$\Ã‚Â£\Ã¢â€šÂ¬\?]?\s?\d+(?:,\d{3})*(?:\.\d{2})?/g);
      if (matches && matches.length > 0) {
        const amounts = matches.map(m => parseFloat(m.replace(/[^\d\.]/g, ''))).filter(n => !isNaN(n));
        if (amounts.length > 0) {
          const maxAmount = Math.max(...amounts);
          document.getElementById('amount').value = maxAmount;
          ocrStatus.textContent = `Found Amount: ${fmt(maxAmount)}`;
        } else {
          ocrStatus.textContent = 'Could not detect an amount.';
        }
      } else {
        ocrStatus.textContent = 'Could not detect any numbers.';
      }
    } catch (err) {
      console.error(err);
      ocrStatus.textContent = 'Error scanning receipt.';
    }
  });
}

// 4. CSV IMPORTER
const csvUpload = document.getElementById('csv-upload');
if(csvUpload) {
  csvUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      const csvLines = csvData.split('\n');
      let imported = 0;
      
      csvLines.forEach((line, i) => {
        if(i === 0) return; // skip header
        const parts = line.split(',');
        if(parts.length >= 4) {
          const rawDate = parts[0].trim();
          const desc = parts[1].trim();
          const cat = parts[2].trim() || 'Other';
          const amt = parseFloat(parts[3].trim());
          
          if(!isNaN(amt) && rawDate.length >= 10) {
            expenses.push({
              id: generateId(),
              date: rawDate,
              time: '12:00',
              description: desc,
              category: cat,
              amount: amt
            });
            imported++;
          }
        }
      });
      
      saveData();
      alert(`Successfully imported ${imported} transactions!`);
      if(!document.getElementById('view-dashboard').classList.contains('hidden')) renderDashboard();
      if(!document.getElementById('view-transactions').classList.contains('hidden')) renderTransactions();
    };
    reader.readAsText(file);
  });
}

// ==========================================
// NEW FEATURE: BILLS & PIN MANAGEMENT
// ==========================================

// 1. PIN Management & Reset
const resetAppBtn = document.getElementById('reset-app-btn');
if(resetAppBtn) {
  resetAppBtn.addEventListener('click', () => {
    if(confirm("Are you sure? This will delete ALL your SpendSage data and reset the PIN. This cannot be undone.")) {
      localStorage.clear();
      location.reload();
    }
  });
}

const saveSettingsBtn = document.getElementById('save-settings-btn');
if(saveSettingsBtn) {
  saveSettingsBtn.addEventListener('click', () => {
    const pin = document.getElementById('settings-pin').value;
    const income = parseFloat(document.getElementById('settings-income').value);
    const locale = document.getElementById('settings-locale').value;
    const currency = document.getElementById('settings-currency').value;
    
    let prefs = safeParse(localStorage.getItem('spendsage_prefs_v1'), {});
    if(!isNaN(income)) prefs.income = income;
    prefs.locale = locale;
    prefs.currency = currency;
    localStorage.setItem('spendsage_prefs_v1', JSON.stringify(prefs));
    
    if (pin && pin.length === 4) {
      localStorage.setItem('spendsage_pin_v1', pin);
      alert('PIN saved successfully! Income settings saved.');
    } else if (!pin || pin.length === 0) {
      localStorage.removeItem('spendsage_pin_v1');
      alert('PIN disabled. Income settings saved.');
    } else {
      alert('PIN must be exactly 4 digits. Income settings saved.');
    }
    
    document.getElementById('settings-pin').value = '';
    renderDashboard();
  });
}

// 2. Bills Logic
if(!views.bills) views.bills = document.getElementById('view-bills');
document.querySelector('[data-target="view-bills"]').addEventListener('click', (e) => {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  e.currentTarget.classList.add('active');
  Object.values(views).forEach(v => { if(v) v.classList.add('hidden'); });
  if(views.bills) views.bills.classList.remove('hidden');
  renderBills();
});

function renderBills() {
  const upContainer = document.getElementById('upcoming-bills-container');
  const pdContainer = document.getElementById('paid-bills-container');
  if(!upContainer || !pdContainer) return;
  
  upContainer.innerHTML = '';
  pdContainer.innerHTML = '';
  
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  
  if(recurringRules.length === 0) {
    upContainer.innerHTML = '<p class="text-muted">No recurring bills set. Click "Add Bill" to track them.</p>';
    pdContainer.innerHTML = '<p class="text-muted">No paid bills yet.</p>';
    return;
  }
  
  // Find which bills were paid this month
  const paidThisMonth = {};
  expenses.forEach(e => {
    if (e.date.startsWith(currentMonth)) {
      // Very simple matching based on exact description match
      const desc = e.description.toLowerCase();
      paidThisMonth[desc] = (paidThisMonth[desc] || 0) + parseFloat(e.amount);
    }
  });
  
  recurringRules.forEach((rule, idx) => {
    const isPaid = paidThisMonth[rule.name.toLowerCase()] !== undefined;
    
    const card = document.createElement('div');
    card.style = "padding: 12px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;";
    card.innerHTML = `
      <div>
        <div style="font-weight: 600;">${rule.name}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">Usually ${fmt(rule.amount)} Ã¢â‚¬Â¢ Expected day: ${rule.day}</div>
      </div>
      <button class="btn ghost small del-bill" data-idx="${idx}">Ã°Å¸â€”â€˜Ã¯Â¸Â</button>
    `;
    
    if(isPaid) pdContainer.appendChild(card);
    else upContainer.appendChild(card);
  });
  
  document.querySelectorAll('.del-bill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = parseInt(e.currentTarget.dataset.idx);
      recurringRules.splice(i, 1);
      saveData();
      renderBills();
    });
  });
}

const addBillBtn = document.getElementById('add-bill-btn');
if(addBillBtn) {
  addBillBtn.addEventListener('click', () => {
    const name = prompt("Enter Bill Name (must exactly match how you log the transaction, e.g., 'Electricity'):");
    if(!name) return;
    const amount = parseFloat(prompt(`Enter expected amount for ${name}:`));
    if(!amount || amount <= 0) return;
    const day = parseInt(prompt(`Enter the day of the month it's usually paid (1-31):`));
    if(!day || day < 1 || day > 31) return;
    
    recurringRules.push({ name, amount, day });
    saveData();
    renderBills();
  });
}

/* ==========================================
   JPS — Features Layer (all new features)
   Loaded AFTER main.js — overrides as needed
   ========================================== */

/* ═══════════════════════════════════════════
   1. SERVICE WORKER / PWA REGISTRATION
   ═══════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

/* ═══════════════════════════════════════════
   2. DARK MODE
   ═══════════════════════════════════════════ */
function initDarkMode() {
  const saved = localStorage.getItem('jps_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateDarkToggleIcon();
}

function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('jps_theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('jps_theme', 'dark');
  }
  updateDarkToggleIcon();
}

function updateDarkToggleIcon() {
  const btn = document.getElementById('darkToggle');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.innerHTML = `<i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}"></i>`;
  btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

/* ═══════════════════════════════════════════
   3. WISHLIST
   ═══════════════════════════════════════════ */
let wishlistIds = JSON.parse(localStorage.getItem('jps_wishlist') || '[]');

function saveWishlist() {
  localStorage.setItem('jps_wishlist', JSON.stringify(wishlistIds));
}

function isWishlisted(id) {
  return wishlistIds.includes(id);
}

function toggleWishlist(id) {
  const idx = wishlistIds.indexOf(id);
  if (idx === -1) wishlistIds.push(id);
  else wishlistIds.splice(idx, 1);
  saveWishlist();
  updateWishlistNavBadge();
  // Refresh all heart buttons for this id
  document.querySelectorAll(`.wl-heart-btn[data-id="${id}"]`).forEach(btn => {
    const liked = isWishlisted(id);
    btn.classList.toggle('active', liked);
    btn.title = liked ? 'Remove from Wishlist' : 'Save to Wishlist';
  });
}

function updateWishlistNavBadge() {
  const badge = document.getElementById('wishlistBadge');
  if (badge) {
    badge.textContent = wishlistIds.length;
    badge.style.display = wishlistIds.length > 0 ? '' : 'none';
  }
}

function openWishlist() {
  renderWishlist();
  document.getElementById('wishlistOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeWishlist() {
  document.getElementById('wishlistOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderWishlist() {
  const el = document.getElementById('wishlistList');
  if (!el) return;
  if (wishlistIds.length === 0) {
    el.innerHTML = `
      <div class="feat-empty-state">
        <i class="fa-solid fa-heart-crack" style="font-size:2.5rem;color:#e2e8f0;margin-bottom:1rem"></i>
        <p style="color:#94a3b8;font-size:.95rem">Your wishlist is empty.<br>Tap <i class="fa-solid fa-heart" style="color:#e11d48"></i> on any product to save it here.</p>
      </div>`;
    return;
  }
  const products = wishlistIds.map(id => (window.PRODUCTS || []).find(p => p.id === id)).filter(Boolean);
  el.innerHTML = products.map(p => {
    const meta = CAT_ICONS[p.category] || { fa: 'fa-box', img: 'img-product' };
    const inCart = (window.cartItems || []).some(c => c.id === p.id);
    return `
      <div class="wl-item">
        <div class="wl-item-icon ${meta.img}"><i class="fa-solid ${meta.fa}"></i></div>
        <div class="wl-item-info">
          <div class="wl-item-brand">${escHtml(p.brand)}</div>
          <div class="wl-item-name">${escHtml(p.name)}</div>
          <div class="wl-item-cat">${escHtml(p.category)}</div>
        </div>
        <div class="wl-item-actions">
          <button class="wl-add-cart${inCart ? ' active' : ''}" onclick="toggleCart(${p.id});renderWishlist()" title="${inCart ? 'In List' : 'Add to List'}">
            <i class="fa-solid ${inCart ? 'fa-check' : 'fa-plus'}"></i>
          </button>
          <button class="wl-remove" onclick="toggleWishlist(${p.id});renderWishlist()" title="Remove">
            <i class="fa-solid fa-heart-crack"></i>
          </button>
        </div>
      </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   4. ORDER HISTORY
   ═══════════════════════════════════════════ */
function saveOrderToHistory(orderData) {
  let orders = JSON.parse(localStorage.getItem('jps_orders') || '[]');
  orders.unshift({ ...orderData, savedAt: new Date().toISOString() });
  localStorage.setItem('jps_orders', JSON.stringify(orders.slice(0, 30)));
  updateOrderHistoryBadge();
}

function updateOrderHistoryBadge() {
  const badge = document.getElementById('orderHistoryBadge');
  const orders = JSON.parse(localStorage.getItem('jps_orders') || '[]');
  if (badge) {
    badge.textContent = orders.length;
    badge.style.display = orders.length > 0 ? '' : 'none';
  }
}

function openOrderHistory() {
  renderOrderHistory();
  document.getElementById('ordersOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeOrderHistory() {
  document.getElementById('ordersOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function _ohGetFilters() {
  return {
    date:    (document.getElementById('ohFilterDate')?.value    || '').trim(),
    shop:    (document.getElementById('ohFilterShop')?.value    || '').trim(),
    account: (document.getElementById('ohFilterAccount')?.value || '').trim()
  };
}

function _ohPopulateDropdowns(orders) {
  const shopSel = document.getElementById('ohFilterShop');
  const accSel  = document.getElementById('ohFilterAccount');
  if (!shopSel || !accSel) return;
  const curShop = shopSel.value;
  const curAcc  = accSel.value;

  const shops    = [...new Set(orders.map(o => o.shopName).filter(Boolean))].sort();
  const accounts = [...new Set(orders.map(o => o.customerName).filter(Boolean))].sort();

  shopSel.innerHTML = '<option value="">All Shops</option>' +
    shops.map(s => `<option value="${escHtml(s)}"${s === curShop ? ' selected' : ''}>${escHtml(s)}</option>`).join('');
  accSel.innerHTML = '<option value="">All Accounts</option>' +
    accounts.map(a => `<option value="${escHtml(a)}"${a === curAcc ? ' selected' : ''}>${escHtml(a)}</option>`).join('');
}

function clearOhFilters() {
  const d = document.getElementById('ohFilterDate');
  const s = document.getElementById('ohFilterShop');
  const a = document.getElementById('ohFilterAccount');
  if (d) d.value = '';
  if (s) s.value = '';
  if (a) a.value = '';
  renderOrderHistory();
}

function renderOrderHistory() {
  const el = document.getElementById('orderHistoryList');
  if (!el) return;
  const allOrders = JSON.parse(localStorage.getItem('jps_orders') || '[]');

  // Populate dropdowns from all orders (before filtering)
  _ohPopulateDropdowns(allOrders);

  if (allOrders.length === 0) {
    document.getElementById('ohSummaryBar').style.display = 'none';
    el.innerHTML = `
      <div class="feat-empty-state">
        <i class="fa-solid fa-clock-rotate-left" style="font-size:2.5rem;color:#e2e8f0;margin-bottom:1rem"></i>
        <p style="color:#94a3b8;font-size:.95rem">No orders yet.<br>Place an order to see it here.</p>
      </div>`;
    return;
  }

  const { date, shop, account } = _ohGetFilters();

  // Apply filters
  const orders = allOrders.filter(o => {
    if (date) {
      // savedAt is ISO string; compare date part
      const saved = o.savedAt ? o.savedAt.split('T')[0] : '';
      if (saved !== date) return false;
    }
    if (shop    && (o.shopName     || '') !== shop)    return false;
    if (account && (o.customerName || '') !== account) return false;
    return true;
  });

  // Summary bar
  const summaryBar = document.getElementById('ohSummaryBar');
  const isFiltered = date || shop || account;
  if (summaryBar) {
    if (isFiltered) {
      const totalProducts = orders.reduce((s, o) => s + o.items.length, 0);
      const totalQty      = orders.reduce((s, o) => s + o.items.reduce((q, c) => q + (c.qty || 1), 0), 0);
      summaryBar.style.display = '';
      summaryBar.innerHTML = `
        <i class="fa-solid fa-filter" style="color:#1a4fba"></i>
        <span><strong>${orders.length}</strong> order${orders.length !== 1 ? 's' : ''}</span>
        <span class="oh-sum-dot">·</span>
        <span><strong>${totalProducts}</strong> product${totalProducts !== 1 ? 's' : ''}</span>
        <span class="oh-sum-dot">·</span>
        <span><strong>${totalQty}</strong> pcs total</span>
        ${date    ? `<span class="oh-sum-tag"><i class="fa-solid fa-calendar-day"></i> ${date}</span>` : ''}
        ${shop    ? `<span class="oh-sum-tag"><i class="fa-solid fa-store"></i> ${escHtml(shop)}</span>` : ''}
        ${account ? `<span class="oh-sum-tag"><i class="fa-solid fa-user"></i> ${escHtml(account)}</span>` : ''}`;
    } else {
      summaryBar.style.display = 'none';
    }
  }

  if (orders.length === 0) {
    el.innerHTML = `
      <div class="feat-empty-state">
        <i class="fa-solid fa-magnifying-glass" style="font-size:2rem;color:#e2e8f0;margin-bottom:1rem"></i>
        <p style="color:#94a3b8;font-size:.95rem">No orders match the selected filters.</p>
      </div>`;
    return;
  }

  el.innerHTML = orders.map(o => {
    const totalQty = o.items.reduce((s, c) => s + (c.qty || 1), 0);
    const preview  = o.items.slice(0, 3).map(i => escHtml(i.name)).join(', ') + (o.items.length > 3 ? `… +${o.items.length - 3} more` : '');
    const disc     = o.discount && o.discount.value > 0
      ? `<div class="oh-discount"><i class="fa-solid fa-tag"></i> Discount: <strong>${o.discount.type === 'pct' ? o.discount.value + '%' : 'PKR ' + Number(o.discount.value).toLocaleString()}</strong></div>`
      : '';
    const safeO = JSON.stringify(o).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    return `
      <div class="oh-card">
        <div class="oh-card-header">
          <span class="oh-order-no"><i class="fa-solid fa-receipt"></i> ${escHtml(o.orderNo)}</span>
          <span class="oh-date">${escHtml(o.orderDate)} · ${escHtml(o.orderTime)}</span>
        </div>
        <div class="oh-customer"><i class="fa-solid fa-user"></i> ${escHtml(o.customerName)}${o.shopName ? ` · <i class="fa-solid fa-store"></i> ${escHtml(o.shopName)}` : ''}</div>
        ${o.phone ? `<div class="oh-phone"><i class="fa-solid fa-phone"></i> ${escHtml(o.phone)}</div>` : ''}
        <div class="oh-summary">${o.items.length} product${o.items.length !== 1 ? 's' : ''} · ${totalQty} pcs</div>
        ${disc}
        <div class="oh-preview">${preview}</div>
        <button class="oh-resend-btn" onclick="reshareOrderWA(${safeO})">
          <i class="fa-brands fa-whatsapp"></i> Resend to Shop
        </button>
      </div>`;
  }).join('');
}

function reshareOrderWA(o) {
  const itemLines = o.items.map((c, i) => `${i + 1}. ${c.name} (${c.brand}) × ${c.qty || 1}`).join('\n');
  const custLine  = o.shopName ? `${o.customerName} — ${o.shopName}` : o.customerName;
  const phoneLine = o.phone ? `\n📞 ${o.phone}` : '';
  const totalQty  = o.items.reduce((s, c) => s + (c.qty || 1), 0);
  const msg = encodeURIComponent(
`🧾 *ORDER RESENT — Jalandhar Pipe Store*
━━━━━━━━━━━━━━━━━━━━
📋 Order No: ${o.orderNo}
📅 Date: ${o.orderDate} · ${o.orderTime}
👤 Customer: ${custLine}${phoneLine}
━━━━━━━━━━━━━━━━━━━━
*Items Ordered:*
${itemLines}
━━━━━━━━━━━━━━━━━━━━
📦 Total: ${o.items.length} product${o.items.length !== 1 ? 's' : ''} · ${totalQty} pcs

Please confirm availability and pricing. Thank you!`);
  window.open(`https://wa.me/92412645043?text=${msg}`, '_blank');
}

/* ═══════════════════════════════════════════
   5. STOCK STATUS
   ═══════════════════════════════════════════ */
function getStockStatus(id) {
  const stockData = JSON.parse(localStorage.getItem('jps_stock') || '{}');
  return stockData[id] || 'in-stock';
}

const STOCK_CONFIG = {
  'in-stock':    { label: 'In Stock',    cls: 'stock-in',  icon: 'fa-circle-check' },
  'low-stock':   { label: 'Low Stock',   cls: 'stock-low', icon: 'fa-triangle-exclamation' },
  'out-of-stock':{ label: 'Out of Stock',cls: 'stock-out', icon: 'fa-circle-xmark' },
};

function stockBadgeHTML(id) {
  const s = getStockStatus(id);
  const c = STOCK_CONFIG[s] || STOCK_CONFIG['in-stock'];
  return `<span class="stock-badge ${c.cls}"><i class="fa-solid ${c.icon}"></i> ${c.label}</span>`;
}

/* ═══════════════════════════════════════════
   6. RELATED PRODUCTS
   ═══════════════════════════════════════════ */
function getRelatedProducts(product, n = 4) {
  const all = window.PRODUCTS || [];
  const same = all.filter(p => p.id !== product.id && p.category === product.category);
  // Shuffle
  for (let i = same.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [same[i], same[j]] = [same[j], same[i]];
  }
  return same.slice(0, n);
}

/* ═══════════════════════════════════════════
   7. SEARCH HISTORY + POPULAR SEARCHES
   ═══════════════════════════════════════════ */
const POPULAR_SEARCHES = [
  'PVC Pipe', 'Ball Valve', 'Submersible Pump', 'Water Tank',
  'Pipe Elbow', 'Gate Valve', 'Bathroom Mixer', 'PPR Fitting'
];

function saveSearchHistory(q) {
  if (!q || q.length < 2) return;
  let hist = JSON.parse(localStorage.getItem('jps_searches') || '[]');
  hist = [q, ...hist.filter(h => h.toLowerCase() !== q.toLowerCase())].slice(0, 6);
  localStorage.setItem('jps_searches', JSON.stringify(hist));
}

function getSearchHistory() {
  return JSON.parse(localStorage.getItem('jps_searches') || '[]');
}

function clearSearchHistory() {
  localStorage.removeItem('jps_searches');
  const drop = document.getElementById('searchDrop');
  if (drop) drop.classList.remove('active');
}

/* ═══════════════════════════════════════════
   8. PRINTABLE CATALOGUE
   ═══════════════════════════════════════════ */
function printCatalogue(catFilter) {
  const products = catFilter
    ? (window.PRODUCTS || []).filter(p => p.category === catFilter)
    : (window.PRODUCTS || []);

  // Group by category
  const grouped = {};
  products.forEach(p => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  const catSections = Object.entries(grouped).map(([cat, prods]) => `
    <div class="cat-section">
      <h2 class="cat-heading">${cat} <span class="cat-count-badge">${prods.length}</span></h2>
      <table>
        <thead><tr><th>#</th><th>Product Name</th><th>Brand</th><th>Sizes</th></tr></thead>
        <tbody>${prods.map((p, i) => `
          <tr>
            <td class="row-num">${i + 1}</td>
            <td><strong>${p.name}</strong>${p.desc && p.desc !== p.name ? `<br><small style="color:#6b7280">${p.desc}</small>` : ''}</td>
            <td>${p.brand || '—'}</td>
            <td>${p.sizes && p.sizes[0] !== 'Standard' ? p.sizes.join(', ') : 'Standard'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
  <title>Product Catalogue — Jalandhar Pipe Store</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;padding:1.5rem;color:#111;font-size:13px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a4fba;padding-bottom:1rem;margin-bottom:1.5rem}
    .store-name{font-size:1.3rem;font-weight:800;color:#1a4fba}
    .store-sub{font-size:.8rem;color:#6b7280;margin-top:.2rem}
    .gen-date{font-size:.75rem;color:#9ca3af;text-align:right}
    .cat-heading{font-size:1rem;font-weight:800;color:#1a4fba;margin:1.5rem 0 .5rem;padding:.4rem .75rem;background:#f0f5ff;border-left:4px solid #1a4fba;border-radius:0 6px 6px 0;display:flex;align-items:center;gap:.5rem}
    .cat-count-badge{background:#1a4fba;color:#fff;border-radius:99px;padding:.1rem .5rem;font-size:.75rem;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-bottom:.5rem}
    th{background:#1a4fba;color:#fff;padding:.4rem .6rem;text-align:left;font-size:.78rem}
    td{padding:.35rem .6rem;border-bottom:1px solid #f1f5f9;font-size:.82rem;vertical-align:top}
    tr:nth-child(even) td{background:#f8fafc}
    .row-num{color:#9ca3af;width:28px;text-align:center}
    .footer{margin-top:2rem;border-top:1px solid #e5e7eb;padding-top:.75rem;font-size:.72rem;color:#9ca3af;text-align:center}
    @media print{
      body{padding:.5rem}
      .cat-heading{break-before:auto}
      .cat-section{break-inside:avoid}
    }
  </style></head><body>
  <div class="header">
    <div>
      <div class="store-name">Jalandhar Pipe Store</div>
      <div class="store-sub">Plumbing Materials · Faisalabad, Pakistan · 041 2645043</div>
    </div>
    <div class="gen-date">
      <strong>Product Catalogue</strong><br>
      ${catFilter ? `Category: ${catFilter}<br>` : ''}
      Generated: ${new Date().toLocaleDateString('en-PK',{year:'numeric',month:'long',day:'numeric'})}
    </div>
  </div>
  ${catSections}
  <div class="footer">Jalandhar Pipe Store — Shop No. 13, Railway Rd, Tariqabad, Faisalabad — Prices available on request — This catalogue is for reference only</div>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`);
  win.document.close();
}

/* ═══════════════════════════════════════════
   9. URDU / ENGLISH TOGGLE
      Full DOM text-node replacement approach
   ═══════════════════════════════════════════ */

const URDU_MAP = {
  /* ── Navigation ── */
  'Home': 'ہوم',
  'Products': 'مصنوعات',
  'Categories': 'اقسام',
  'About Us': 'ہمارے بارے میں',
  'Contact': 'رابطہ',
  'JMS Manager': 'جے ایم ایس',
  'WhatsApp': 'واٹس ایپ',
  'WhatsApp Us': 'واٹس ایپ کریں',
  'Toggle dark mode': 'ڈارک موڈ',
  'My Wishlist': 'میری پسند',
  'Order History': 'آرڈر ہسٹری',
  'Print Catalogue': 'کیٹالاگ',

  /* ── Top bar ── */
  'Faisalabad, Pakistan': 'فیصل آباد، پاکستان',
  'Mon–Sat: 8 AM – 8 PM': 'پیر تا ہفتہ: صبح ۸ – رات ۸',
  'Open Now': 'ابھی کھلا',
  'Closed': 'بند',

  /* ── Hero ── */
  "Faisalabad's #1 Plumbing Material Store Since 2003": 'فیصل آباد کا نمبر ۱ پلمبنگ اسٹور ۲۰۰۳ سے',
  'Everything You Need for': 'آپ کو جو چاہیے',
  'Perfect Plumbing': 'بہترین پلمبنگ کے لیے',
  '2,600+ products in stock — PVC pipes, valves, fittings, water tanks, pumps & bathroom accessories. Trusted by 10,000+ plumbers & contractors in Faisalabad.':
    'فیصل آباد میں ۱۰,۰۰۰ سے زیادہ پلمبرز اور ٹھیکیداروں کا اعتماد — ۲۶۰۰+ مصنوعات دستیاب',
  'Browse All Products': 'تمام مصنوعات دیکھیں',
  'WhatsApp Order': 'واٹس ایپ آرڈر',
  'Search': 'تلاش',

  /* ── Hero trust strip ── */
  'Products in Stock': 'مصنوعات دستیاب',
  'Years Experience': 'سال کا تجربہ',
  'Happy Customers': 'خوش گاہک',
  'Product Categories': 'اقسام',

  /* ── Hero category pills ── */
  'Pipes': 'پائپ',
  'Valves': 'والوز',
  'Pipe Fittings': 'پائپ فٹنگز',
  'Water Tanks': 'پانی کی ٹینکیاں',
  'Pumps': 'پمپ',
  'Bathroom': 'باتھ روم',
  'Sanitary': 'صحت افزا',
  'All Categories': 'تمام اقسام',

  /* ── Deals section ── */
  "Today's Deals & Offers": 'آج کے خاص آفر',
  'Special picks and best-value products — updated regularly': 'خاص آفرز اور بہترین قیمتیں — ہر روز تازہ',
  '🔥 HOT DEAL': '🔥 خاص آفر',
  '⚡ FLASH OFFER': '⚡ فلیش آفر',
  '💰 BEST VALUE': '💰 بہترین قیمت',
  '🆕 NEW STOCK': '🆕 نیا اسٹاک',
  'Adamjee PVC Pipes': 'آدم جی پی وی سی پائپ',
  'Best price on 4-inch pressure pipes — bulk orders welcome': '۴ انچ پریشر پائپ بہترین قیمت پر — بلک آرڈر歡迎',
  'Submersible Pumps': 'سبمرسیبل پمپ',
  'Full range of submersible motors — free expert advice included': 'تمام اقسام کے سبمرسیبل موٹر — ماہرانہ مشورہ مفت',
  'Pipe Fittings Bundle': 'پائپ فٹنگز پیکیج',
  'Elbows, tees & sockets — mix-and-match any brand, any size': 'ایلبو، ٹی اور ساکٹ — کوئی بھی سائز اور برانڈ',
  'PPRC Hot Water Pipes': 'پی پی آر سی گرم پانی کے پائپ',
  'Heat-resistant PPR pipes just arrived — ask for samples': 'گرمی سے محفوظ پی پی آر پائپ آ گئے — سیمپل لیں',
  'This Week': 'اس ہفتہ',
  'Limited': 'محدود',
  'Always': 'ہمیشہ',
  'Fresh Arrival': 'تازہ آمد',
  'Browse': 'دیکھیں',

  /* ── Stats strip ── */
  'Years in Business': 'سالوں سے خدمت میں',
  'Customers Served': 'گاہک',
  'Trusted Brands': 'قابل اعتماد برانڈز',

  /* ── Categories section ── */
  'Shop by Category': 'قسم سے دیکھیں',
  'Browse our wide selection of plumbing materials organized by category': 'پلمبنگ مواد کو قسم کے مطابق تلاش کریں',

  /* ── Featured Products ── */
  'Featured Products': 'خاص مصنوعات',
  'Top picks from our extensive plumbing inventory': 'ہمارے پلمبنگ ذخیرے سے بہترین انتخاب',
  'View All Products': 'تمام مصنوعات دیکھیں',

  /* ── Brands strip ── */
  'Trusted Brands We Carry': 'ہمارے قابل اعتماد برانڈز',

  /* ── Why Choose Us ── */
  'Why Choose Jalandhar Pipe Store?': 'جالندھر پائپ اسٹور کیوں؟',
  "We've been serving plumbers, contractors and homeowners in Faisalabad for over 20 years": 'ہم ۲۰ سال سے فیصل آباد کے پلمبرز، ٹھیکیداروں اور گھروالوں کی خدمت کر رہے ہیں',
  'Genuine Products': 'اصل مصنوعات',
  'We stock only authentic, brand-certified plumbing materials from trusted manufacturers.': 'ہم صرف اصل اور سرٹیفائیڈ پلمبنگ مواد رکھتے ہیں',
  'Competitive Prices': 'مناسب قیمتیں',
  'Best market prices on all plumbing supplies. Bulk discounts available for contractors.': 'تمام پلمبنگ مواد پر بہترین قیمتیں — ٹھیکیداروں کے لیے خاص رعایت',
  'Wide Selection': 'وسیع انتخاب',
  'Over 500 products spanning pipes, valves, fittings, tanks, pumps and accessories.': '۵۰۰ سے زیادہ مصنوعات — پائپ، والوز، فٹنگز، ٹینک، پمپ اور لوازمات',
  'Expert Advice': 'ماہرانہ مشورہ',
  'Our experienced staff will help you choose the right materials for any plumbing project.': 'ہمارا تجربہ کار عملہ آپ کے منصوبے کے لیے صحیح مواد کا انتخاب کرنے میں مدد کرے گا',

  /* ── Testimonials ── */
  'What Our Customers Say': 'ہمارے گاہک کیا کہتے ہیں',
  'Trusted by plumbers, contractors and homeowners across Faisalabad': 'فیصل آباد کے پلمبرز، ٹھیکیداروں اور گھروالوں کا اعتماد',
  'Master Plumber, Faisalabad': 'ماسٹر پلمبر، فیصل آباد',
  'Civil Contractor': 'سول ٹھیکیدار',
  'Homeowner': 'گھر کا مالک',

  /* ── CTA Banner ── */
  'Need Help Finding the Right Material?': 'صحیح مواد ڈھونڈنے میں مدد چاہیے؟',
  'Contact our expert team via WhatsApp or phone. We\'re here to help you find the perfect plumbing solution for any project.':
    'واٹس ایپ یا فون پر ہمارے ماہر عملہ سے رابطہ کریں — ہم آپ کی مدد کے لیے حاضر ہیں',
  'Chat on WhatsApp': 'واٹس ایپ پر بات کریں',
  'Contact Us': 'ہم سے رابطہ کریں',

  /* ── Footer ── */
  'Your trusted source for quality plumbing materials in Faisalabad. Serving contractors, plumbers, and homeowners since 2003.':
    'فیصل آباد میں معیاری پلمبنگ مواد کا قابل اعتماد ذریعہ — ۲۰۰۳ سے خدمت میں',
  'Quick Links': 'فوری لنکس',
  'All Products': 'تمام مصنوعات',
  'Contact': 'رابطہ',
  'Contact Us': 'رابطہ کریں',
  'Plumbing Materials · Faisalabad': 'پلمبنگ مواد · فیصل آباد',
  'Shop No. 13, Jalander Pipe Store, Railway Rd, Tariqabad, Faisalabad 38000, Pakistan': 'شاپ نمبر 13، جلندر پائپ اسٹور، ریلوے روڈ، طارق آباد، فیصل آباد 38000، پاکستان',
  'Mon–Sat: 8:00 AM – 8:00 PM': 'پیر تا ہفتہ: صبح ۸:۰۰ – رات ۸:۰۰',
  '© 2025 Jalandhar Pipe Store. All rights reserved.': '© ۲۰۲۵ جالندھر پائپ اسٹور۔ تمام حقوق محفوظ ہیں',
  'Designed with care for Faisalabad\'s plumbing community': 'فیصل آباد کی پلمبنگ برادری کے لیے',

  /* ── Products page ── */
  'All Products': 'تمام مصنوعات',
  'Browse our complete range of plumbing materials, fittings and accessories': 'تمام پلمبنگ مواد، فٹنگز اور لوازمات',
  'Search by product name, brand, category or size...': 'نام، برانڈ، قسم یا سائز سے تلاش کریں...',
  'Filters & Categories': 'فلٹر اور اقسام',
  'Sort: Default': 'ترتیب: ڈیفالٹ',
  'Default': 'ڈیفالٹ',
  'Name A–Z': 'نام الف تا ی',
  'Name Z–A': 'نام ی تا الف',
  'By Category': 'قسم کے مطابق',
  'Brands': 'برانڈز',
  'Clear All': 'سب صاف کریں',
  'No products found': 'کوئی مصنوعات نہیں ملی',
  'Try adjusting your search or filters.': 'اپنی تلاش یا فلٹر تبدیل کریں',
  'You might be looking for:': 'آپ شاید یہ ڈھونڈ رہے ہیں:',
  'Recently Viewed': 'حال ہی میں دیکھا',
  'Prev': 'پچھلا',
  'Next': 'اگلا',

  /* ── Stock ── */
  'In Stock': 'دستیاب',
  'Low Stock': 'کم مقدار',
  'Out of Stock': 'دستیاب نہیں',

  /* ── Cart / Order ── */
  'My Inquiry List': 'میری استفسار فہرست',
  'Your cart is empty.\nAdd products then place your order.': 'آپ کی فہرست خالی ہے۔\nمصنوعات شامل کریں پھر آرڈر دیں',
  'Place Order': 'آرڈر دیں',
  'Quick Inquiry': 'فوری استفسار',
  'Clear': 'صاف کریں',
  'Add to Inquiry List': 'فہرست میں شامل کریں',
  'Added to List': 'فہرست میں شامل',
  'Inquire': 'استفسار',

  /* ── Order modal ── */
  'Place Your Order': 'اپنا آرڈر دیں',
  'Tell us who you are and we\'ll prepare your receipt': 'اپنی معلومات دیں، ہم رسید تیار کریں گے',
  'Your Name': 'آپ کا نام',
  'Shop / Business Name': 'دوکان / کاروبار کا نام',
  'Phone Number': 'فون نمبر',
  'Cancel': 'منسوخ',
  'Generate Receipt': 'رسید بنائیں',

  /* ── Receipt ── */
  'Send to Shop via WhatsApp': 'واٹس ایپ سے دوکان کو بھیجیں',
  'Print Receipt': 'رسید پرنٹ کریں',
  'Close': 'بند کریں',
  'Prices will be confirmed by Jalandhar Pipe Store. This receipt is for order tracking only.':
    'قیمتیں جالندھر پائپ اسٹور تصدیق کرے گا — یہ رسید صرف آرڈر ٹریکنگ کے لیے ہے',

  /* ── Product modal ── */
  'Description': 'تفصیل',
  'Available Sizes': 'دستیاب سائز',
  'Tags': 'ٹیگز',
  'More in': 'مزید',
  'WhatsApp': 'واٹس ایپ',
  'Call': 'کال',

  /* ── Wishlist modal ── */
  'My Wishlist': 'میری پسند',
  'Save to Wishlist': 'پسند میں شامل کریں',
  'Remove from Wishlist': 'پسند سے ہٹائیں',

  /* ── Order history modal ── */
  'Order History': 'آرڈر ہسٹری',
  'Resend to Shop': 'دوبارہ بھیجیں',
  'No orders yet.\nPlace an order to see it here.': 'ابھی تک کوئی آرڈر نہیں۔\nآرڈر دیں تو یہاں دیکھیں',

  /* ── Catalogue modal ── */
  'Print Catalogue': 'کیٹالاگ پرنٹ کریں',
  'Choose what to print:': 'پرنٹ کریں:',
  'Full Catalogue': 'مکمل کیٹالاگ',
  'all categories': 'تمام اقسام',

  /* ── Contact page ── */
  'Get In Touch': 'رابطہ کریں',
  'We\'re here to help. Reach us via WhatsApp, phone, or fill out the contact form below.':
    'ہم مدد کے لیے حاضر ہیں — واٹس ایپ، فون یا فارم کے ذریعے رابطہ کریں',
  'Call Us': 'فون کریں',
  'WhatsApp Chat': 'واٹس ایپ چیٹ',
  'Visit Store': 'دوکان آئیں',
  'Working Hours': 'اوقات کار',
  'Store Information': 'دوکان کی معلومات',
  'Find Us in Faisalabad': 'فیصل آباد میں تلاش کریں',
  'Send Message': 'پیغام بھیجیں',
  'Your Name *': 'آپ کا نام *',
  'Phone Number *': 'فون نمبر *',
  'Email Address': 'ای میل',
  'Subject *': 'موضوع *',
  'Message *': 'پیغام *',
  'Send Inquiry': 'استفسار بھیجیں',
  'Sending…': 'بھیجا جا رہا ہے…',

  /* ── About page ── */
  'About Jalandhar Pipe Store': 'جالندھر پائپ اسٹور کے بارے میں',
  'Our Story': 'ہماری کہانی',
  'Founded in': 'قیام',
  'Our Values': 'ہماری اقدار',
  'Quality First': 'معیار اول',
  'Honest Service': 'ایمانداری سے خدمت',
  'Fast Availability': 'فوری دستیابی',
  'Community Rooted': 'کمیونٹی سے جڑے',
  'Why Plumbers Trust Us': 'پلمبرز ہم پر کیوں بھروسہ کرتے ہیں',

  /* ── Categories page ── */
  'Browse All Categories': 'تمام اقسام دیکھیں',
  'Explore our complete range of plumbing products by category': 'قسم کے مطابق تمام پلمبنگ مصنوعات دیکھیں',

  /* ── Announcement banner ── */
  'New Arrivals!': 'نئی آمد!',
  'Browse the latest PPRC & UPVC fittings —': 'تازہ پی پی آر سی اور یو پی وی سی فٹنگز دیکھیں —',
  'Shop Now': 'ابھی خریدیں',

  /* ── Search dropdown ── */
  'Recent Searches': 'حالیہ تلاش',
  'Popular Searches': 'مشہور تلاش',
  'Clear': 'صاف کریں',
  'PVC Pipe': 'پی وی سی پائپ',
  'Ball Valve': 'بال والو',
  'Submersible Pump': 'سبمرسیبل پمپ',
  'Water Tank': 'پانی کی ٹینکی',
  'Pipe Elbow': 'پائپ ایلبو',
  'Gate Valve': 'گیٹ والو',
  'Bathroom Mixer': 'باتھ روم مکسر',
  'PPR Fitting': 'پی پی آر فٹنگ',
};

/* ── Sorted by length descending for correct longest-match-first replacement ── */
const URDU_ENTRIES = Object.entries(URDU_MAP).sort((a, b) => b[0].length - a[0].length);

/* Stored nodes for restoration */
const _translatedNodes = [];
const _translatedPlaceholders = [];
const _translatedTitles = [];

let isUrdu = localStorage.getItem('jps_lang') === 'ur';

function toggleUrdu() {
  isUrdu = !isUrdu;
  localStorage.setItem('jps_lang', isUrdu ? 'ur' : 'en');
  applyLanguage();
}

function applyLanguage() {
  const html = document.documentElement;
  html.setAttribute('lang', isUrdu ? 'ur' : 'en');
  html.setAttribute('dir', isUrdu ? 'rtl' : 'ltr');

  const btn = document.getElementById('urduToggle');
  if (btn) btn.innerHTML = isUrdu
    ? '<i class="fa-solid fa-language"></i> EN'
    : '<i class="fa-solid fa-language"></i> اردو';

  if (isUrdu) {
    _translateDOM();
  } else {
    _restoreDOM();
  }
}

function _translateText(text) {
  let result = text;
  for (const [en, ur] of URDU_ENTRIES) {
    if (result.includes(en)) {
      result = result.split(en).join(ur);
    }
  }
  return result;
}

function _walkTextNodes(root, cb) {
  const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME','CODE','PRE']);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const tag = node.parentElement && node.parentElement.tagName;
      if (SKIP.has(tag)) return NodeFilter.FILTER_REJECT;
      if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(cb);
}

function _translateDOM() {
  _translatedNodes.length = 0;
  _translatedPlaceholders.length = 0;
  _translatedTitles.length = 0;

  _walkTextNodes(document.body, node => {
    const orig = node.textContent;
    const translated = _translateText(orig);
    if (translated !== orig) {
      _translatedNodes.push({ node, orig });
      node.textContent = translated;
    }
  });

  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
    const orig = el.placeholder;
    const translated = _translateText(orig);
    if (translated !== orig) {
      _translatedPlaceholders.push({ el, orig });
      el.placeholder = translated;
    }
  });

  document.querySelectorAll('[title]').forEach(el => {
    const orig = el.title;
    const translated = _translateText(orig);
    if (translated !== orig) {
      _translatedTitles.push({ el, orig });
      el.title = translated;
    }
  });
}

function _restoreDOM() {
  _translatedNodes.forEach(({ node, orig }) => { node.textContent = orig; });
  _translatedNodes.length = 0;
  _translatedPlaceholders.forEach(({ el, orig }) => { el.placeholder = orig; });
  _translatedPlaceholders.length = 0;
  _translatedTitles.forEach(({ el, orig }) => { el.title = orig; });
  _translatedTitles.length = 0;
}

/* ═══════════════════════════════════════════
   10. OVERRIDDEN PRODUCT CARD HTML
       (adds wishlist heart + stock badge)
   ═══════════════════════════════════════════ */
function productCardHTML(p) {
  const meta   = CAT_ICONS[p.category] || { fa: 'fa-box', img: 'img-product' };
  const badge  = p.badge ? `<span class="badge badge-orange p-badge">${escHtml(p.badge)}</span>` : '';
  const waMsg  = buildWAMessage(p);
  const inCart = (window.cartItems || []).some(c => c.id === p.id);
  const liked  = isWishlisted(p.id);
  const stock  = stockBadgeHTML(p.id);
  const imgHTML = p.imgUrl
    ? `<img src="${escHtml(p.imgUrl)}" alt="${escHtml(p.name)}" class="prod-real-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';

  const inCompare = (window.compareList || []).includes(p.id);
  return `
    <div class="prod-card" onclick="openProductModal(${p.id})">
      <div class="prod-img ${meta.img}" style="${p.imgUrl ? 'padding:0;overflow:hidden' : ''}">
        ${imgHTML}
        <i class="fa-solid ${meta.fa} prod-icon"${p.imgUrl ? ' style="display:none"' : ''}></i>
        ${badge}
        <button class="wl-heart-btn${liked ? ' active' : ''}" data-id="${p.id}"
          onclick="event.stopPropagation();toggleWishlist(${p.id})"
          title="${liked ? 'Remove from Wishlist' : 'Save to Wishlist'}">
          <i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i>
        </button>
        <div class="compare-check-wrap" onclick="event.stopPropagation()">
          <input type="checkbox" id="cmp-${p.id}" ${inCompare ? 'checked' : ''}
            onchange="toggleCompare(${p.id})">
          <label for="cmp-${p.id}"><i class="fa-solid fa-scale-balanced"></i> Compare</label>
        </div>
      </div>
      <div class="prod-body">
        <div class="prod-brand">${escHtml(p.brand)}</div>
        <div class="prod-name">${escHtml(p.name)}</div>
        <div class="prod-tags">
          <span class="prod-tag">${escHtml(p.category)}</span>
          ${stock}
        </div>
        <div class="prod-foot">
          <span class="prod-cat">${escHtml(p.sizes && p.sizes[0] !== 'Standard' ? p.sizes[0] : '')}</span>
          <div class="prod-actions">
            <button class="btn-cart-toggle${inCart ? ' active' : ''}"
              onclick="event.stopPropagation();toggleCart(${p.id})"
              title="${inCart ? 'Remove from list' : 'Add to list'}">
              <i class="fa-solid ${inCart ? 'fa-check' : 'fa-plus'}"></i>
            </button>
            <a class="btn btn-sm btn-call" href="tel:+92412645043" onclick="event.stopPropagation()" title="Call Us">
              <i class="fa-solid fa-phone"></i>
            </a>
            <a class="btn btn-sm btn-whatsapp" href="https://wa.me/92412645043?text=${waMsg}" target="_blank" onclick="event.stopPropagation()">
              <i class="fa-brands fa-whatsapp"></i> Inquire
            </a>
          </div>
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════
   11. OVERRIDDEN openProductModal
       (adds related products + wishlist btn)
   ═══════════════════════════════════════════ */
function openProductModal(id) {
  const p = (window.PRODUCTS || []).find(x => x.id === id);
  if (!p) return;
  trackRecentlyViewed(id);

  const meta   = CAT_ICONS[p.category] || { fa: 'fa-box', img: 'img-product' };
  const waMsg  = buildWAMessage(p);
  const inCart = (window.cartItems || []).some(c => c.id === p.id);
  const liked  = isWishlisted(p.id);
  const stock  = STOCK_CONFIG[getStockStatus(id)] || STOCK_CONFIG['in-stock'];

  const sizes = p.sizes && p.sizes.length && p.sizes[0] !== 'Standard'
    ? `<div><div class="pm-sec-label">Available Sizes</div><div class="pm-sizes">${p.sizes.map(s => `<span class="pm-size-chip">${escHtml(s)}</span>`).join('')}</div></div>` : '';
  const tags = p.tags && p.tags.length
    ? `<div><div class="pm-sec-label">Tags</div><div class="pm-tags">${p.tags.map(t => `<span class="pm-tag">${escHtml(t)}</span>`).join('')}</div></div>` : '';

  const related = getRelatedProducts(p, 4);
  const relatedHTML = related.length > 0 ? `
    <div class="pm-related">
      <div class="pm-sec-label">More in ${escHtml(p.category)}</div>
      <div class="pm-related-grid">
        ${related.map(r => {
          const rm = CAT_ICONS[r.category] || { fa: 'fa-box', img: 'img-product' };
          return `<div class="pm-rel-card" onclick="openProductModal(${r.id})">
            <div class="pm-rel-icon ${rm.img}"><i class="fa-solid ${rm.fa}"></i></div>
            <div class="pm-rel-name">${escHtml(r.name)}</div>
            <div class="pm-rel-brand">${escHtml(r.brand)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  const imgHTML = p.imgUrl ? `<img src="${escHtml(p.imgUrl)}" alt="${escHtml(p.name)}" class="pm-real-img" loading="lazy" onerror="this.style.display='none'">` : '';

  document.getElementById('pmModal').innerHTML = `
    <div class="pm-head">
      <div class="pm-icon ${meta.img}">
        ${imgHTML}
        <i class="fa-solid ${meta.fa}"${p.imgUrl ? ' style="display:none"' : ''}></i>
      </div>
      <div class="pm-title">
        <div class="pm-brand">${escHtml(p.brand)}</div>
        <div class="pm-name">${escHtml(p.name)}</div>
        <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-top:.25rem">
          <span class="pm-cat-pill"><i class="fa-solid ${meta.fa}" style="font-size:.65rem"></i> ${escHtml(p.category)}</span>
          <span class="stock-badge ${stock.cls}"><i class="fa-solid ${stock.icon}"></i> ${stock.label}</span>
        </div>
      </div>
      <button class="pm-close" onclick="closeProductModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="pm-body">
      ${p.desc ? `<div><div class="pm-sec-label">Description</div><div class="pm-desc">${escHtml(p.desc)}</div></div>` : ''}
      ${sizes}
      ${tags}
      ${relatedHTML}
    </div>
    <div class="pm-foot">
      <button class="btn-pm-cart${inCart ? ' in-cart' : ''}" id="pmCartBtn" onclick="toggleCartFromModal(${p.id})">
        <i class="fa-solid ${inCart ? 'fa-check' : 'fa-plus'}"></i>
        ${inCart ? 'Added to List' : 'Add to Inquiry List'}
      </button>
      <button class="btn-pm-wishlist${liked ? ' active' : ''}" id="pmWishBtn" onclick="toggleWishlistFromModal(${p.id})">
        <i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i>
      </button>
      <a class="btn btn-whatsapp" href="https://wa.me/92412645043?text=${waMsg}" target="_blank">
        <i class="fa-brands fa-whatsapp"></i> WhatsApp
      </a>
      <a class="btn btn-call" href="tel:+92412645043">
        <i class="fa-solid fa-phone"></i> Call
      </a>
    </div>`;

  document.getElementById('pmOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function toggleWishlistFromModal(id) {
  toggleWishlist(id);
  const liked = isWishlisted(id);
  const btn = document.getElementById('pmWishBtn');
  if (btn) {
    btn.className = 'btn-pm-wishlist' + (liked ? ' active' : '');
    btn.innerHTML = `<i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i>`;
  }
}

/* ═══════════════════════════════════════════
   12. OVERRIDDEN showReceipt
       (saves to order history)
   ═══════════════════════════════════════════ */
function showReceipt(customerName, shopName, phone, discType, discVal) {
  const orderNo   = generateOrderNumber();
  const orderDate = new Date().toLocaleDateString('en-PK', { year:'numeric', month:'long', day:'numeric' });
  const orderTime = new Date().toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });
  const discount  = { type: discType || 'pct', value: Number(discVal) || 0 };

  _currentOrderData = { orderNo, orderDate, orderTime, customerName, shopName, phone, discount, items: [...cartItems] };

  // Save to local history + sync to portal dashboard
  saveOrderToHistory(_currentOrderData);
  if (typeof syncOrderToPortal === 'function') syncOrderToPortal(_currentOrderData);

  const rows = cartItems.map((c, i) => `
    <tr>
      <td class="rc-td-num">${i + 1}</td>
      <td class="rc-td-prod">
        <div class="rc-prod-name">${escHtml(c.name)}</div>
        <div class="rc-prod-brand">${escHtml(c.brand)} · ${escHtml(c.category)}</div>
      </td>
      <td class="rc-td-qty">${c.qty || 1}</td>
      <td class="rc-td-note"></td>
    </tr>`).join('');

  const modal = document.getElementById('receiptModal');
  modal.innerHTML = `
    <div class="rc-head">
      <div class="rc-logo">
        <div class="rc-logo-icon"><i class="fa-solid fa-pipe-section"></i></div>
        <div>
          <div class="rc-store-name">Jalandhar Pipe Store</div>
          <div class="rc-store-sub">Plumbing Materials · Faisalabad</div>
        </div>
      </div>
      <div class="rc-meta">
        <div class="rc-order-no"># ${orderNo}</div>
        <div class="rc-date">${orderDate} · ${orderTime}</div>
      </div>
    </div>
    <div class="rc-customer">
      <div class="rc-cust-row"><i class="fa-solid fa-user"></i><span>${escHtml(customerName)}</span></div>
      ${shopName  ? `<div class="rc-cust-row"><i class="fa-solid fa-store"></i><span>${escHtml(shopName)}</span></div>` : ''}
      ${phone     ? `<div class="rc-cust-row"><i class="fa-solid fa-phone"></i><span>${escHtml(phone)}</span></div>` : ''}
    </div>
    <div class="rc-divider"></div>
    <table class="rc-table">
      <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="rc-divider"></div>
    <div class="rc-summary">
      <div class="rc-summary-row"><span>Total Items</span><strong>${cartItems.length} product${cartItems.length !== 1 ? 's' : ''}</strong></div>
      <div class="rc-summary-row"><span>Total Quantity</span><strong>${cartItems.reduce((s, c) => s + (c.qty || 1), 0)} pcs</strong></div>
      ${discount.value > 0 ? `<div class="rc-summary-row rc-discount-row"><span><i class="fa-solid fa-tag" style="color:#16a34a;margin-right:.3rem"></i>Discount</span><strong class="rc-discount-val">${discount.type === 'pct' ? discount.value + '%' : 'PKR ' + discount.value.toLocaleString()}</strong></div>` : ''}
    </div>
    <div class="rc-note"><i class="fa-solid fa-circle-info"></i> Prices will be confirmed by Jalandhar Pipe Store. This receipt is for order tracking only.</div>
    <div class="rc-actions">
      <button class="btn-rc-wa" onclick="shareReceiptWA()"><i class="fa-brands fa-whatsapp"></i> Send to Shop via WhatsApp</button>
      <button class="btn-rc-print" onclick="printReceipt()"><i class="fa-solid fa-print"></i> Print Receipt</button>
      <button class="btn-rc-close" onclick="closeReceipt()"><i class="fa-solid fa-xmark"></i> Close</button>
    </div>`;

  document.getElementById('receiptOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ═══════════════════════════════════════════
   13. OVERRIDDEN injectGlobalUI
       (adds wishlist + orders + catalogue modals)
   ═══════════════════════════════════════════ */
const _origInjectGlobalUI = window.injectGlobalUI || function(){};

window.injectGlobalUI = function() {
  _origInjectGlobalUI();

  // Inject extra modals
  document.body.insertAdjacentHTML('beforeend', `

    <!-- ══ Wishlist Modal ══ -->
    <div class="feat-overlay" id="wishlistOverlay" onclick="if(event.target===this)closeWishlist()">
      <div class="feat-modal">
        <div class="feat-modal-head">
          <div class="feat-modal-title">
            <i class="fa-solid fa-heart" style="color:#e11d48"></i> My Wishlist
            <span id="wishlistBadge" class="feat-modal-badge" style="display:none">0</span>
          </div>
          <button class="feat-modal-close" onclick="closeWishlist()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="feat-modal-body" id="wishlistList"></div>
      </div>
    </div>

    <!-- ══ Order History Modal ══ -->
    <div class="feat-overlay" id="ordersOverlay" onclick="if(event.target===this)closeOrderHistory()">
      <div class="feat-modal feat-modal-lg">
        <div class="feat-modal-head">
          <div class="feat-modal-title">
            <i class="fa-solid fa-clock-rotate-left" style="color:#1a4fba"></i> Sales History
            <span id="orderHistoryBadge" class="feat-modal-badge" style="display:none">0</span>
          </div>
          <button class="feat-modal-close" onclick="closeOrderHistory()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="oh-filters">
          <div class="oh-filter-field">
            <label><i class="fa-solid fa-calendar-day"></i> Date</label>
            <input type="date" id="ohFilterDate" onchange="renderOrderHistory()" class="oh-filter-input">
          </div>
          <div class="oh-filter-field">
            <label><i class="fa-solid fa-store"></i> Shop</label>
            <select id="ohFilterShop" onchange="renderOrderHistory()" class="oh-filter-input">
              <option value="">All Shops</option>
            </select>
          </div>
          <div class="oh-filter-field">
            <label><i class="fa-solid fa-user"></i> Account</label>
            <select id="ohFilterAccount" onchange="renderOrderHistory()" class="oh-filter-input">
              <option value="">All Accounts</option>
            </select>
          </div>
          <button class="oh-clear-btn" onclick="clearOhFilters()"><i class="fa-solid fa-xmark"></i> Clear</button>
        </div>
        <div id="ohSummaryBar" class="oh-summary-bar" style="display:none"></div>
        <div class="feat-modal-body" id="orderHistoryList"></div>
      </div>
    </div>

    <!-- ══ Compare Overlay ══ -->
    <div class="compare-overlay" id="compareOverlay" onclick="if(event.target===this)closeCompareModal()">
      <div class="compare-modal" id="compareModal"></div>
    </div>

    <!-- ══ Compare Sticky Bar ══ -->
    <div class="compare-bar" id="compareBar">
      <div class="compare-bar-info">
        <i class="fa-solid fa-scale-balanced"></i>
        <span>Comparing 0 products</span>
      </div>
      <div class="compare-bar-thumbs"></div>
      <div class="compare-bar-actions">
        <button class="btn-compare-now" onclick="openCompareModal()">
          <i class="fa-solid fa-scale-balanced"></i> Compare Now
        </button>
        <button class="btn-compare-clear" onclick="clearCompareList()">
          <i class="fa-solid fa-xmark"></i> Clear
        </button>
      </div>
    </div>

    <!-- ══ Catalogue Modal ══ -->
    <div class="feat-overlay" id="catalogueOverlay" onclick="if(event.target===this)closeCatalogueModal()">
      <div class="feat-modal feat-modal-sm">
        <div class="feat-modal-head">
          <div class="feat-modal-title"><i class="fa-solid fa-book-open" style="color:#1a4fba"></i> Print Catalogue</div>
          <button class="feat-modal-close" onclick="closeCatalogueModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="feat-modal-body" id="catalogueOptions">
          <p style="color:#64748b;font-size:.9rem;margin-bottom:1.25rem">Choose what to print:</p>
          <button class="cat-option-btn btn-pricelist" onclick="downloadPriceList();closeCatalogueModal()" style="margin-bottom:.75rem">
            <i class="fa-solid fa-file-arrow-down"></i>
            <span>Download Price List <em>(PDF via print)</em></span>
            <i class="fa-solid fa-file-pdf cat-opt-icon"></i>
          </button>
          <div class="cat-option-list" id="catOptionList">
            <button class="cat-option-btn" onclick="printCatalogue(null);closeCatalogueModal()">
              <i class="fa-solid fa-boxes-stacked"></i>
              <span>Full Catalogue <em>(all categories)</em></span>
              <i class="fa-solid fa-print cat-opt-icon"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `);

  // Populate catalogue options per category
  const catList = document.getElementById('catOptionList');
  if (catList && window.CATEGORIES) {
    window.CATEGORIES.forEach(c => {
      const cnt = (window.PRODUCTS || []).filter(p => p.category === c.name).length;
      catList.insertAdjacentHTML('beforeend', `
        <button class="cat-option-btn" onclick="printCatalogue('${c.name.replace(/'/g,"\\'")}');closeCatalogueModal()">
          <i class="fa-solid fa-folder-open"></i>
          <span>${escHtml(c.name)} <em>(${cnt})</em></span>
          <i class="fa-solid fa-print cat-opt-icon"></i>
        </button>`);
    });
  }
};

function openCatalogueModal() {
  document.getElementById('catalogueOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCatalogueModal() {
  document.getElementById('catalogueOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════════
   14. OVERRIDDEN initNavSearch
       (adds search history + popular searches)
   ═══════════════════════════════════════════ */
function initNavSearch() {
  const input = document.getElementById('navSearch');
  const drop  = document.getElementById('searchDrop');
  if (!input || !drop || typeof PRODUCTS === 'undefined') return;

  function showHistory() {
    const hist = getSearchHistory();
    if (hist.length === 0 && POPULAR_SEARCHES.length === 0) { drop.classList.remove('active'); return; }
    let html = '';
    if (hist.length > 0) {
      html += `<div class="drop-section-label"><i class="fa-solid fa-clock-rotate-left"></i> Recent Searches <button class="drop-clear-hist" onclick="clearSearchHistory()" title="Clear history">Clear</button></div>`;
      html += hist.map(q => `<div class="drop-item drop-hist-item" onclick="doSearch('${escHtml(q).replace(/'/g,"\\'")}')"><i class="fa-solid fa-clock-rotate-left drop-hist-icon"></i><span>${escHtml(q)}</span></div>`).join('');
    }
    html += `<div class="drop-section-label"><i class="fa-solid fa-fire"></i> Popular Searches</div>`;
    html += POPULAR_SEARCHES.map(q => `<div class="drop-item drop-pop-item" onclick="doSearch('${escHtml(q).replace(/'/g,"\\'")}')"><i class="fa-solid fa-magnifying-glass drop-pop-icon"></i><span>${escHtml(q)}</span></div>`).join('');
    drop.innerHTML = html;
    drop.classList.add('active');
  }

  function doSearch(q) {
    input.value = q;
    saveSearchHistory(q);
    window.location.href = `products.html?search=${encodeURIComponent(q)}`;
  }
  window.doSearch = doSearch;

  input.addEventListener('focus', () => {
    if (input.value.trim().length < 2) showHistory();
  });

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { showHistory(); return; }
    const matches = PRODUCTS.filter(p => productMatchesSearch(p, q)).slice(0, 8);
    if (matches.length === 0) {
      drop.innerHTML = `<div class="drop-empty"><i class="fa-solid fa-magnifying-glass" style="margin-right:.4rem"></i>No results for "<strong>${escHtml(q)}</strong>"</div>`;
    } else {
      drop.innerHTML = matches.map(p => `
        <div class="drop-item" onclick="goToProduct(${p.id})">
          <div class="drop-icon ${p.img}">${p.emoji}</div>
          <div class="drop-info">
            <div class="d-name">${escHtml(p.name)}</div>
            <div class="d-cat">${escHtml(p.category)}${p.brand ? ' · ' + escHtml(p.brand) : ''}</div>
          </div>
        </div>`).join('');
    }
    drop.classList.add('active');
  });

  let _acIndex = -1;

  function _acItems() { return drop.querySelectorAll('.drop-item'); }

  function _acHighlight(idx) {
    const items = _acItems();
    items.forEach((el, i) => el.classList.toggle('ac-selected', i === idx));
    if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('keydown', e => {
    const items = _acItems();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _acIndex = Math.min(_acIndex + 1, items.length - 1);
      _acHighlight(_acIndex);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      _acIndex = Math.max(_acIndex - 1, -1);
      _acHighlight(_acIndex);
      return;
    }
    if (e.key === 'Enter') {
      if (_acIndex >= 0 && items[_acIndex]) {
        items[_acIndex].click();
        return;
      }
      const q = input.value.trim();
      if (q) { saveSearchHistory(q); window.location.href = `products.html?search=${encodeURIComponent(q)}`; }
    }
    if (e.key === 'Escape') {
      drop.classList.remove('active');
      _acIndex = -1;
    }
  });

  // Reset index when input changes
  input.addEventListener('input', () => { _acIndex = -1; });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !drop.contains(e.target)) {
      drop.classList.remove('active');
      _acIndex = -1;
    }
  });
}

/* ═══════════════════════════════════════════
   15. DEALS / SPECIAL OFFERS
   ═══════════════════════════════════════════ */
const DEALS = [
  { label: '🔥 Hot Deal', title: 'Adamjee PVC Pipes', desc: 'Best price on 4-inch pressure pipes — bulk orders welcome', badge: 'This Week', cat: 'Pipes', emoji: '🔵' },
  { label: '⚡ Flash Offer', title: 'Submersible Pumps', desc: 'Full range of submersible motors — free expert advice included', badge: 'Limited', cat: 'Pumps', emoji: '⚡' },
  { label: '💰 Best Value', title: 'Pipe Fittings Bundle', desc: 'Elbows, tees & sockets — mix-and-match any brand, any size', badge: 'Always', cat: 'Pipe Fittings', emoji: '⚙️' },
  { label: '🆕 New Stock', title: 'PPRC Hot Water Pipes', desc: 'Heat-resistant PPR pipes just arrived — ask for samples', badge: 'Fresh Arrival', cat: 'PPRC Fittings', emoji: '🟤' },
];

function renderDealsSection() {
  const el = document.getElementById('dealsSection');
  if (!el) return;
  el.innerHTML = DEALS.map(d => `
    <div class="deal-card" onclick="window.location.href='products.html?cat=${encodeURIComponent(d.cat)}'">
      <div class="deal-badge">${d.label}</div>
      <div class="deal-emoji">${d.emoji}</div>
      <div class="deal-title">${d.title}</div>
      <div class="deal-desc">${d.desc}</div>
      <div class="deal-foot">
        <span class="deal-chip">${d.badge}</span>
        <span class="deal-cta">Browse <i class="fa-solid fa-arrow-right"></i></span>
      </div>
    </div>`).join('');
}

/* ═══════════════════════════════════════════
   16. COMPARE PRODUCTS
   ═══════════════════════════════════════════ */
let compareList = [];

function toggleCompare(productId) {
  const idx = compareList.indexOf(productId);
  if (idx === -1) {
    if (compareList.length >= 3) {
      alert('You can compare up to 3 products at a time. Remove one first.');
      // Uncheck the checkbox that was just checked
      const cb = document.getElementById(`cmp-${productId}`);
      if (cb) cb.checked = false;
      return;
    }
    compareList.push(productId);
  } else {
    compareList.splice(idx, 1);
  }
  updateCompareBar();
}

function updateCompareBar() {
  let bar = document.getElementById('compareBar');
  if (!bar) return;

  if (compareList.length === 0) {
    bar.classList.remove('visible');
    return;
  }

  const products = compareList.map(id => (window.PRODUCTS || []).find(p => p.id === id)).filter(Boolean);
  const thumbsHTML = products.map(p => {
    const meta = CAT_ICONS[p.category] || { fa: 'fa-box', img: 'img-product' };
    return `<div class="compare-thumb ${meta.img}" title="${escHtml(p.name)}"><i class="fa-solid ${meta.fa}"></i></div>`;
  }).join('');

  bar.querySelector('.compare-bar-thumbs').innerHTML = thumbsHTML;
  bar.querySelector('.compare-bar-info span').textContent = `Comparing ${compareList.length} product${compareList.length !== 1 ? 's' : ''}`;
  bar.classList.add('visible');
}

function openCompareModal() {
  if (compareList.length < 1) return;
  const products = compareList.map(id => (window.PRODUCTS || []).find(p => p.id === id)).filter(Boolean);

  // Build column headers
  const headerCols = products.map(p => {
    const meta = CAT_ICONS[p.category] || { fa: 'fa-box', img: 'img-product' };
    return `
      <th class="compare-prod-header">
        <div class="compare-prod-icon ${meta.img}"><i class="fa-solid ${meta.fa}"></i></div>
        <div class="compare-prod-name">${escHtml(p.name)}</div>
        <div class="compare-prod-brand">${escHtml(p.brand)}</div>
      </th>`;
  }).join('');

  const rows = [
    { label: 'Brand',    key: p => escHtml(p.brand || '—') },
    { label: 'Category', key: p => escHtml(p.category || '—') },
    { label: 'Sizes',    key: p => p.sizes && p.sizes[0] !== 'Standard' ? escHtml(p.sizes.join(', ')) : 'Standard' },
    { label: 'Tags',     key: p => p.tags && p.tags.length ? p.tags.map(t => `<span class="pm-tag">${escHtml(t)}</span>`).join(' ') : '—' },
    { label: 'Description', key: p => escHtml(p.desc || '—') },
  ];

  const tableRows = rows.map(r => `
    <tr>
      <td class="ct-label">${r.label}</td>
      ${products.map(p => `<td>${r.key(p)}</td>`).join('')}
    </tr>`).join('');

  const modal = document.getElementById('compareModal');
  if (!modal) return;
  modal.innerHTML = `
    <div class="compare-modal-head">
      <h3><i class="fa-solid fa-scale-balanced" style="margin-right:.4rem"></i>Product Comparison</h3>
      <button class="compare-modal-close" onclick="closeCompareModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="compare-modal-body">
      <table class="compare-table">
        <thead>
          <tr>
            <th style="width:110px">Feature</th>
            ${headerCols}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>`;

  document.getElementById('compareOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCompareModal() {
  document.getElementById('compareOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function clearCompareList() {
  compareList = [];
  // Uncheck all checkboxes
  document.querySelectorAll('.compare-check-wrap input[type="checkbox"]').forEach(cb => { cb.checked = false; });
  updateCompareBar();
}

/* ═══════════════════════════════════════════
   17. QUOTE REQUEST FORM
   ═══════════════════════════════════════════ */
function openQuoteModal() {
  const overlay = document.getElementById('quoteOverlay');
  if (!overlay) return;
  // Clear form
  ['quoteName','quotePhone','quoteCompany','quoteProducts','quoteQty','quoteMessage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => { const n = document.getElementById('quoteName'); if (n) n.focus(); }, 200);
}

function closeQuoteModal() {
  const overlay = document.getElementById('quoteOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function submitQuoteForm() {
  const name     = (document.getElementById('quoteName')?.value || '').trim();
  const phone    = (document.getElementById('quotePhone')?.value || '').trim();
  const company  = (document.getElementById('quoteCompany')?.value || '').trim();
  const products = (document.getElementById('quoteProducts')?.value || '').trim();
  const qty      = (document.getElementById('quoteQty')?.value || '').trim();
  const message  = (document.getElementById('quoteMessage')?.value || '').trim();

  if (!name || !phone || !products) {
    alert('Please fill in your Name, Phone, and Products needed.');
    return;
  }

  const parts = [
    `*Quote Request — Jalandhar Pipe Store*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 Name: ${name}`,
    `📞 Phone: ${phone}`,
    company  ? `🏢 Company: ${company}` : null,
    `📦 Products: ${products}`,
    qty      ? `🔢 Quantity: ${qty}` : null,
    message  ? `💬 Message: ${message}` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Please share availability and pricing. Thank you!`,
  ].filter(Boolean).join('\n');

  const url = `https://wa.me/92412645043?text=${encodeURIComponent(parts)}`;
  window.open(url, '_blank');
  closeQuoteModal();
}

/* ═══════════════════════════════════════════
   18. WHATSAPP CART SHARE
   ═══════════════════════════════════════════ */
function shareCartOnWhatsApp() {
  const items = window.cartItems || [];
  if (items.length === 0) { alert('Your cart is empty.'); return; }

  const lines = items.map(c => `• ${c.name} × ${c.qty || 1}`).join('\n');
  const totalItems = items.reduce((s, c) => s + (c.qty || 1), 0);

  const msg = [
    `🛒 *My Order from Jalandhar Pipe Store:*`,
    lines,
    `Total: ${totalItems} item${totalItems !== 1 ? 's' : ''}`,
    ``,
    `Please confirm availability and prices. Thank you!`,
  ].join('\n');

  window.open(`https://wa.me/92412645043?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ═══════════════════════════════════════════
   19. PDF PRICE LIST DOWNLOAD
   ═══════════════════════════════════════════ */
function downloadPriceList() {
  const products = window.PRODUCTS || [];
  if (products.length === 0) { alert('No products loaded yet.'); return; }

  // Group by category
  const grouped = {};
  products.forEach(p => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  const dateStr = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });

  const catSections = Object.entries(grouped).map(([cat, prods]) => `
    <div class="jps-pl-cat-section">
      <div class="jps-pl-cat-heading">
        ${cat} <span class="jps-pl-cat-cnt">${prods.length}</span>
      </div>
      <table class="jps-pl-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product Name</th>
            <th>Brand</th>
            <th>Category</th>
            <th>Sizes</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          ${prods.map((p, i) => `
            <tr>
              <td class="jps-pl-row-num">${i + 1}</td>
              <td><strong>${p.name}</strong>${p.desc && p.desc !== p.name ? `<br><small style="color:#6b7280;font-size:.75em">${p.desc}</small>` : ''}</td>
              <td>${p.brand || '—'}</td>
              <td>${p.category}</td>
              <td>${p.sizes && p.sizes[0] !== 'Standard' ? p.sizes.join(', ') : 'Standard'}</td>
              <td>${p.tags && p.tags.length ? p.tags.join(', ') : '—'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8">
  <title>Price List — Jalandhar Pipe Store</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;padding:1.5rem;color:#111;font-size:12px}
    .jps-pl-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a4fba;padding-bottom:.75rem;margin-bottom:1.25rem}
    .jps-pl-store-name{font-size:1.2rem;font-weight:800;color:#1a4fba}
    .jps-pl-store-sub{font-size:.75rem;color:#6b7280;margin-top:.2rem}
    .jps-pl-meta{text-align:right;font-size:.75rem;color:#9ca3af}
    .jps-pl-meta strong{display:block;font-size:.88rem;color:#1a4fba;margin-bottom:.2rem}
    .jps-pl-cat-heading{font-size:.95rem;font-weight:800;color:#1a4fba;margin:1.25rem 0 .4rem;padding:.35rem .7rem;background:#f0f5ff;border-left:4px solid #1a4fba;border-radius:0 6px 6px 0;display:inline-flex;align-items:center;gap:.4rem}
    .jps-pl-cat-cnt{background:#1a4fba;color:#fff;border-radius:99px;padding:.1rem .45rem;font-size:.7rem;font-weight:700}
    .jps-pl-table{width:100%;border-collapse:collapse;margin-bottom:.5rem}
    .jps-pl-table th{background:#1a4fba;color:#fff;padding:.38rem .55rem;text-align:left;font-size:.72rem}
    .jps-pl-table td{padding:.3rem .55rem;border-bottom:1px solid #f1f5f9;font-size:.78rem;vertical-align:top}
    .jps-pl-table tr:nth-child(even) td{background:#f8fafc}
    .jps-pl-row-num{color:#9ca3af;width:24px;text-align:center}
    .jps-pl-footer{margin-top:1.5rem;border-top:1px solid #e5e7eb;padding-top:.65rem;font-size:.68rem;color:#9ca3af;text-align:center}
    @media print{body{padding:.5rem}.jps-pl-cat-section{break-inside:avoid}}
  </style>
  </head><body>
  <div class="jps-pl-header">
    <div>
      <div class="jps-pl-store-name">Jalandhar Pipe Store</div>
      <div class="jps-pl-store-sub">Plumbing Materials · Faisalabad, Pakistan · 041 2645043</div>
    </div>
    <div class="jps-pl-meta">
      <strong>Price List</strong>
      Contact us for current prices<br>
      Generated: ${dateStr}<br>
      Total Products: ${products.length}
    </div>
  </div>
  ${catSections}
  <div class="jps-pl-footer">
    Jalandhar Pipe Store — Shop No. 13, Railway Rd, Tariqabad, Faisalabad — Prices available on request — This list is for reference only
  </div>
  <script>window.onload = () => { window.print(); };<\/script>
  </body></html>`);
  win.document.close();
}

/* ═══════════════════════════════════════════
   INIT — runs after DOMContentLoaded
   ═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Dark mode (must run first, before render)
  initDarkMode();

  // Wishlist + Order History badges
  updateWishlistNavBadge();
  updateOrderHistoryBadge();

  // Deals section
  renderDealsSection();

  // Urdu: apply AFTER all JS has rendered dynamic content (products, categories etc.)
  if (isUrdu) {
    // Small delay ensures main.js product rendering is complete
    setTimeout(applyLanguage, 300);
  }

  /* ── Feature 1: Mobile Bottom Bar ── */
  initMobileBottomBar();

  /* ── Feature 2: Cookie Consent Banner ── */
  initCookieBar();

  /* ── Feature 3: Keyboard Shortcuts ── */
  initKeyboardShortcuts();

  /* ── Feature 4: Product Share Buttons (MutationObserver) ── */
  initProductShareButtons();

  /* ── Feature 5 / 6 / 7: Pipe Tools floating button ── */
  initCalculatorButtons();
});

/* ═══════════════════════════════════════════
   20. MOBILE BOTTOM BAR
   ═══════════════════════════════════════════ */
function initMobileBottomBar() {
  if (document.getElementById('mobileBottomBar')) return; // already injected
  document.body.insertAdjacentHTML('beforeend', `
    <div class="mobile-bottom-bar" id="mobileBottomBar">
      <a href="tel:+92412645043" class="mbb-btn mbb-call">
        <i class="fa-solid fa-phone"></i>
        <span>Call</span>
      </a>
      <a href="https://wa.me/92412645043" class="mbb-btn mbb-whatsapp" target="_blank">
        <i class="fa-brands fa-whatsapp"></i>
        <span>WhatsApp</span>
      </a>
      <button class="mbb-btn mbb-cart" onclick="openCart()">
        <i class="fa-solid fa-basket-shopping"></i>
        <span>Cart</span>
        <span class="mbb-badge" id="mbbBadge" style="display:none">0</span>
      </button>
      <a href="products.html" class="mbb-btn mbb-products">
        <i class="fa-solid fa-boxes-stacked"></i>
        <span>Products</span>
      </a>
    </div>
  `);
  // Sync badge with current cart state
  updateMbbBadge();
}

function updateMbbBadge() {
  const badge = document.getElementById('mbbBadge');
  if (!badge) return;
  const n = (window.cartItems || []).length;
  badge.textContent = n;
  badge.style.display = n > 0 ? '' : 'none';
}

// Patch updateCartUI to also update the mobile bar badge
(function() {
  const _origUpdateCartUI = window.updateCartUI;
  if (typeof _origUpdateCartUI === 'function') {
    window.updateCartUI = function() {
      _origUpdateCartUI.apply(this, arguments);
      updateMbbBadge();
    };
  } else {
    // main.js may not have loaded yet; use a polling fallback
    const _pollPatch = setInterval(() => {
      if (typeof window.updateCartUI === 'function' && window.updateCartUI !== window._mbbPatchedUpdateCartUI) {
        const _base = window.updateCartUI;
        window.updateCartUI = window._mbbPatchedUpdateCartUI = function() {
          _base.apply(this, arguments);
          updateMbbBadge();
        };
        clearInterval(_pollPatch);
      }
    }, 200);
  }
})();

/* ═══════════════════════════════════════════
   21. COOKIE CONSENT BANNER
   ═══════════════════════════════════════════ */
function initCookieBar() {
  if (localStorage.getItem('jps_cookie_ok')) return; // already accepted
  if (document.getElementById('cookieBar')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="cookie-bar" id="cookieBar">
      <div class="cookie-text">
        <i class="fa-solid fa-cookie-bite"></i>
        <span>We use cookies to improve your experience. By continuing, you agree to our use of cookies.</span>
      </div>
      <div class="cookie-btns">
        <button class="btn-cookie-accept" onclick="acceptCookies()">Accept</button>
        <button class="btn-cookie-decline" onclick="declineCookies()">Decline</button>
      </div>
    </div>
  `);

  // Animate in after a short delay
  setTimeout(() => {
    const bar = document.getElementById('cookieBar');
    if (bar) bar.classList.add('cookie-bar-visible');
  }, 800);
}

function acceptCookies() {
  localStorage.setItem('jps_cookie_ok', '1');
  _hideCookieBar();
}

function declineCookies() {
  _hideCookieBar();
}

function _hideCookieBar() {
  const bar = document.getElementById('cookieBar');
  if (!bar) return;
  bar.classList.remove('cookie-bar-visible');
  bar.classList.add('cookie-bar-hiding');
  setTimeout(() => bar.remove(), 400);
}

/* ═══════════════════════════════════════════
   22. KEYBOARD SHORTCUTS
   ═══════════════════════════════════════════ */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore when typing in an input/textarea/select/contenteditable
    const tag = document.activeElement && document.activeElement.tagName;
    const editable = document.activeElement && document.activeElement.isContentEditable;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable) return;

    // Don't fire if modifier keys are held (except shift for '?')
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    switch (e.key) {
      case 's':
      case 'S':
      case '/': {
        e.preventDefault();
        const inp = document.getElementById('navSearch');
        if (inp) { inp.focus(); inp.select(); showKbToast('Search focused'); }
        break;
      }
      case 'c':
      case 'C': {
        e.preventDefault();
        if (typeof openCart === 'function') openCart();
        showKbToast('Cart opened');
        break;
      }
      case 'Escape': {
        if (typeof closeCart === 'function') closeCart();
        if (typeof closeProductModal === 'function') closeProductModal();
        closeKbShortcutsModal();
        break;
      }
      case 'h':
      case 'H': {
        e.preventDefault();
        window.location.href = 'index.html';
        break;
      }
      case 'p':
      case 'P': {
        e.preventDefault();
        window.location.href = 'products.html';
        break;
      }
      case '?': {
        e.preventDefault();
        openKbShortcutsModal();
        break;
      }
    }
  });

  // Inject shortcuts modal (once)
  if (!document.getElementById('kbShortcutsOverlay')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="kb-overlay" id="kbShortcutsOverlay" onclick="if(event.target===this)closeKbShortcutsModal()">
        <div class="kb-modal" id="kbShortcutsModal">
          <div class="kb-modal-head">
            <div class="kb-modal-title"><i class="fa-solid fa-keyboard"></i> Keyboard Shortcuts</div>
            <button class="kb-modal-close" onclick="closeKbShortcutsModal()"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="kb-grid">
            <div class="kb-row"><span class="kb-key">S</span> <span class="kb-sep">or</span> <span class="kb-key">/</span><span class="kb-desc">Focus search</span></div>
            <div class="kb-row"><span class="kb-key">C</span><span class="kb-desc">Open cart</span></div>
            <div class="kb-row"><span class="kb-key">H</span><span class="kb-desc">Go to Home</span></div>
            <div class="kb-row"><span class="kb-key">P</span><span class="kb-desc">Go to Products</span></div>
            <div class="kb-row"><span class="kb-key">?</span><span class="kb-desc">Show this help</span></div>
            <div class="kb-row"><span class="kb-key">Esc</span><span class="kb-desc">Close modal / drawer</span></div>
          </div>
          <p class="kb-hint">Shortcuts are disabled when typing in a text field.</p>
        </div>
      </div>
    `);
  }
}

function openKbShortcutsModal() {
  const overlay = document.getElementById('kbShortcutsOverlay');
  if (overlay) overlay.classList.add('open');
}

function closeKbShortcutsModal() {
  const overlay = document.getElementById('kbShortcutsOverlay');
  if (overlay) overlay.classList.remove('open');
}

let _kbToastTimer = null;
function showKbToast(msg) {
  let toast = document.getElementById('kbToast');
  if (!toast) {
    document.body.insertAdjacentHTML('beforeend', `<div class="kb-toast" id="kbToast"></div>`);
    toast = document.getElementById('kbToast');
  }
  toast.textContent = msg;
  toast.classList.remove('kb-toast-hide');
  toast.classList.add('kb-toast-show');
  clearTimeout(_kbToastTimer);
  _kbToastTimer = setTimeout(() => {
    toast.classList.remove('kb-toast-show');
    toast.classList.add('kb-toast-hide');
  }, 1800);
}

/* ═══════════════════════════════════════════
   23. PRODUCT SHARE BUTTONS
   ═══════════════════════════════════════════ */
function initProductShareButtons() {
  // Add share buttons to any existing prod-cards
  _addShareBtnsToCards();

  // Watch for newly rendered product cards
  const observer = new MutationObserver((mutations) => {
    let needsScan = false;
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.classList && node.classList.contains('prod-card')) needsScan = true;
          else if (node.querySelector && node.querySelector('.prod-card')) needsScan = true;
        }
      });
    });
    if (needsScan) _addShareBtnsToCards();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Event delegation for share button clicks
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-share-prod');
    if (!btn) return;
    e.stopPropagation();
    const productId = btn.dataset.id;
    _openSharePopover(btn, productId);
  });

  // Close share popover when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.share-popover') && !e.target.closest('.btn-share-prod')) {
      _closeAllSharePopovers();
    }
  });
}

function _addShareBtnsToCards() {
  document.querySelectorAll('.prod-card').forEach(card => {
    // Avoid double-injection
    if (card.querySelector('.btn-share-prod')) return;

    // Extract product id from onclick attribute
    const onclickAttr = card.getAttribute('onclick') || '';
    const match = onclickAttr.match(/openProductModal\((\d+)\)/);
    if (!match) return;
    const productId = match[1];

    // Inject share button into prod-img area
    const imgArea = card.querySelector('.prod-img');
    if (imgArea) {
      imgArea.insertAdjacentHTML('beforeend', `
        <button class="btn-share-prod" data-id="${productId}" onclick="event.stopPropagation()" title="Share product">
          <i class="fa-solid fa-share-nodes"></i>
        </button>
      `);
    }
  });
}

function _getShareUrl(productId) {
  return window.location.origin + '/products.html?id=' + productId;
}

function _openSharePopover(btn, productId) {
  // Close any existing popover first
  _closeAllSharePopovers();

  const url = _getShareUrl(productId);
  const waText = encodeURIComponent('Check out this product: ' + url);
  const popover = document.createElement('div');
  popover.className = 'share-popover';
  popover.id = 'sharePopover';
  popover.innerHTML = `
    <div class="share-popover-arrow"></div>
    <button class="share-pop-btn share-pop-copy" onclick="copyShareLink('${productId}', this)">
      <i class="fa-solid fa-link"></i> Copy Link
    </button>
    <a class="share-pop-btn share-pop-wa" href="https://wa.me/?text=${waText}" target="_blank">
      <i class="fa-brands fa-whatsapp"></i> Share on WhatsApp
    </a>
  `;

  document.body.appendChild(popover);

  // Position the popover near the button
  const rect = btn.getBoundingClientRect();
  const pw = 180;
  let left = rect.left + window.scrollX - pw / 2 + rect.width / 2;
  let top  = rect.top  + window.scrollY - popover.offsetHeight - 10;

  // Clamp to viewport
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
  if (top < window.scrollY + 8) top = rect.bottom + window.scrollY + 8;

  popover.style.left = left + 'px';
  popover.style.top  = top  + 'px';

  // Reposition after paint (offsetHeight is 0 before first paint)
  requestAnimationFrame(() => {
    const ph = popover.offsetHeight;
    let newTop = rect.top + window.scrollY - ph - 10;
    if (newTop < window.scrollY + 8) newTop = rect.bottom + window.scrollY + 8;
    popover.style.top = newTop + 'px';
    popover.classList.add('share-popover-visible');
  });
}

function _closeAllSharePopovers() {
  document.querySelectorAll('.share-popover').forEach(p => p.remove());
}

function copyShareLink(productId, btn) {
  const url = _getShareUrl(productId);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      _showShareToast('Link copied!');
      _closeAllSharePopovers();
    }).catch(() => _fallbackCopy(url));
  } else {
    _fallbackCopy(url);
  }
}

function _fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); _showShareToast('Link copied!'); } catch(e) { _showShareToast('Copy failed'); }
  document.body.removeChild(ta);
  _closeAllSharePopovers();
}

let _shareToastTimer = null;
function _showShareToast(msg) {
  let toast = document.getElementById('shareToast');
  if (!toast) {
    document.body.insertAdjacentHTML('beforeend', `<div class="share-toast" id="shareToast"></div>`);
    toast = document.getElementById('shareToast');
  }
  toast.textContent = msg;
  toast.classList.remove('share-toast-hide');
  toast.classList.add('share-toast-show');
  clearTimeout(_shareToastTimer);
  _shareToastTimer = setTimeout(() => {
    toast.classList.remove('share-toast-show');
    toast.classList.add('share-toast-hide');
  }, 2000);
}

/* ═══════════════════════════════════════════
   24. PIPE SIZE CALCULATOR
   ═══════════════════════════════════════════ */
function openPipeCalc() {
  if (!document.getElementById('pipeCalcOverlay')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="tools-overlay" id="pipeCalcOverlay" onclick="if(event.target===this)closePipeCalc()">
        <div class="tools-modal">
          <div class="tools-modal-head">
            <div class="tools-modal-title"><i class="fa-solid fa-ruler-combined"></i> Pipe Size Calculator</div>
            <button class="tools-modal-close" onclick="closePipeCalc()"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="tools-modal-body">
            <div class="tools-field">
              <label>Pipe Type</label>
              <select id="pcPipeType">
                <option value="PVC">PVC</option>
                <option value="HDPE">HDPE</option>
                <option value="GI">GI (Galvanized Iron)</option>
                <option value="CPVC">CPVC</option>
              </select>
            </div>
            <div class="tools-form-row">
              <div class="tools-field">
                <label>Flow Rate (litres/min)</label>
                <input type="number" id="pcFlowRate" placeholder="e.g. 20" min="0" step="0.1">
              </div>
              <div class="tools-field">
                <label>Pipe Length (metres)</label>
                <input type="number" id="pcLength" placeholder="e.g. 50" min="0" step="0.1">
              </div>
            </div>
            <div class="tools-result" id="pcResult"></div>
          </div>
          <div class="tools-modal-foot">
            <button class="btn-tools-calc" onclick="calcPipeSize()"><i class="fa-solid fa-calculator"></i> Calculate</button>
            <button class="btn-tools-cancel" onclick="closePipeCalc()">Close</button>
          </div>
        </div>
      </div>
    `);
  }
  document.getElementById('pipeCalcOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePipeCalc() {
  const el = document.getElementById('pipeCalcOverlay');
  if (el) el.classList.remove('open');
  document.body.style.overflow = '';
}

function calcPipeSize() {
  const flowLPM  = parseFloat(document.getElementById('pcFlowRate').value);
  const lengthM  = parseFloat(document.getElementById('pcLength').value);
  const pipeType = document.getElementById('pcPipeType').value;
  const result   = document.getElementById('pcResult');

  if (!flowLPM || flowLPM <= 0 || !lengthM || lengthM <= 0) {
    result.innerHTML = '<strong>Please enter valid flow rate and pipe length.</strong>';
    result.classList.add('visible');
    return;
  }

  // Diameter lookup table (mm) based on flow rate (L/min)
  // Recommended max velocities: 1.5–3 m/s for water supply
  const diameterTable = [
    { maxFlow: 5,   dia: 15  },
    { maxFlow: 12,  dia: 20  },
    { maxFlow: 25,  dia: 25  },
    { maxFlow: 50,  dia: 32  },
    { maxFlow: 100, dia: 40  },
    { maxFlow: 200, dia: 50  },
    { maxFlow: 400, dia: 63  },
    { maxFlow: 700, dia: 75  },
    { maxFlow: Infinity, dia: 110 },
  ];

  const row = diameterTable.find(r => flowLPM <= r.maxFlow);
  const diaMM = row.dia;
  const diaM  = diaMM / 1000;
  const radius = diaM / 2;

  // Convert flow to m³/s
  const flowM3s   = flowLPM / 60000;
  const area      = Math.PI * radius * radius;
  const velocityMs = flowM3s / area;

  // Darcy-Weisbach simplified pressure drop (kPa)
  // Using friction factor f ≈ 0.02 for typical smooth pipe
  const f           = 0.02;
  const density     = 1000; // kg/m³ water
  const pressDropPa = f * (lengthM / diaM) * (density * velocityMs * velocityMs / 2);
  const pressDropKPa = pressDropPa / 1000;

  const velocityNote = velocityMs < 0.5
    ? 'Low velocity — consider a smaller diameter to save cost.'
    : velocityMs > 3
    ? 'High velocity — consider a larger diameter to reduce pressure loss and noise.'
    : 'Velocity is within the recommended 0.5–3 m/s range.';

  result.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:.6rem">
      <div><strong>Recommended Diameter:</strong> ${diaMM} mm (${pipeType})</div>
      <div><strong>Flow Velocity:</strong> ${velocityMs.toFixed(2)} m/s</div>
      <div><strong>Pressure Drop:</strong> ${pressDropKPa.toFixed(2)} kPa over ${lengthM} m</div>
      <div style="font-size:.82rem;color:var(--text-medium)">${velocityNote}</div>
    </div>`;
  result.classList.add('visible');
}

/* ═══════════════════════════════════════════
   25. PROJECT ESTIMATOR
   ═══════════════════════════════════════════ */
function openEstimator() {
  if (!document.getElementById('estimatorOverlay')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="tools-overlay" id="estimatorOverlay" onclick="if(event.target===this)closeEstimator()">
        <div class="tools-modal">
          <div class="tools-modal-head">
            <div class="tools-modal-title"><i class="fa-solid fa-file-invoice"></i> Project Estimator</div>
            <button class="tools-modal-close" onclick="closeEstimator()"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="tools-modal-body">
            <div class="tools-field">
              <label>Project Type</label>
              <select id="estProjectType" onchange="updateEstimatorLabel()">
                <option value="residential">Residential Plumbing</option>
                <option value="commercial">Commercial Building</option>
                <option value="agriculture">Agriculture Irrigation</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
            <div class="tools-form-row">
              <div class="tools-field">
                <label id="estSizeLabel">Number of Floors</label>
                <input type="number" id="estSize" placeholder="e.g. 3" min="1" step="1">
              </div>
              <div class="tools-field">
                <label>Pipe Type Preference</label>
                <select id="estPipeType">
                  <option value="PVC">PVC</option>
                  <option value="PPRC">PPRC</option>
                  <option value="HDPE">HDPE</option>
                  <option value="CPVC">CPVC</option>
                  <option value="GI">GI</option>
                </select>
              </div>
            </div>
            <div class="tools-result" id="estResult"></div>
          </div>
          <div class="tools-modal-foot">
            <button class="btn-tools-calc" onclick="calcEstimate()"><i class="fa-solid fa-chart-bar"></i> Estimate</button>
            <button class="btn-tools-cancel" onclick="closeEstimator()">Close</button>
          </div>
        </div>
      </div>
    `);
  }
  document.getElementById('estimatorOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEstimator() {
  const el = document.getElementById('estimatorOverlay');
  if (el) el.classList.remove('open');
  document.body.style.overflow = '';
}

function updateEstimatorLabel() {
  const type = document.getElementById('estProjectType').value;
  const label = document.getElementById('estSizeLabel');
  if (!label) return;
  label.textContent = (type === 'agriculture') ? 'Area (acres)' : 'Number of Floors';
  document.getElementById('estSize').placeholder = (type === 'agriculture') ? 'e.g. 5' : 'e.g. 3';
}

function calcEstimate() {
  const type     = document.getElementById('estProjectType').value;
  const size     = parseFloat(document.getElementById('estSize').value);
  const pipeType = document.getElementById('estPipeType').value;
  const result   = document.getElementById('estResult');

  if (!size || size <= 0) {
    result.innerHTML = '<strong>Please enter a valid size / number of floors.</strong>';
    result.classList.add('visible');
    return;
  }

  // Estimation factors (per floor or per acre)
  const factors = {
    residential:  { pipePerUnit: 80,  fittingsPerUnit: 35,  costLowPerUnit: 18000,  costHighPerUnit: 35000 },
    commercial:   { pipePerUnit: 150, fittingsPerUnit: 70,  costLowPerUnit: 40000,  costHighPerUnit: 80000 },
    agriculture:  { pipePerUnit: 500, fittingsPerUnit: 25,  costLowPerUnit: 25000,  costHighPerUnit: 50000 },
    industrial:   { pipePerUnit: 200, fittingsPerUnit: 100, costLowPerUnit: 60000,  costHighPerUnit: 120000 },
  };

  // Pipe type cost multipliers
  const pipeMultiplier = { PVC: 1.0, PPRC: 1.4, HDPE: 1.3, CPVC: 1.6, GI: 1.8 };
  const f   = factors[type];
  const mul = pipeMultiplier[pipeType] || 1.0;

  const totalPipe     = Math.round(f.pipePerUnit * size);
  const totalFittings = Math.round(f.fittingsPerUnit * size);
  const costLow       = Math.round(f.costLowPerUnit  * size * mul);
  const costHigh      = Math.round(f.costHighPerUnit * size * mul);

  const unitLabel = (type === 'agriculture') ? 'acre' : 'floor';
  const fmt = n => n.toLocaleString('en-PK');

  result.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:.6rem">
      <div><strong>Estimated Pipe Required:</strong> ${fmt(totalPipe)} metres of ${pipeType}</div>
      <div><strong>Estimated Fittings:</strong> ~${fmt(totalFittings)} pieces</div>
      <div><strong>Estimated Cost Range:</strong> <span style="color:var(--primary)">PKR ${fmt(costLow)} – ${fmt(costHigh)}</span></div>
      <div style="font-size:.82rem;color:var(--text-medium)">Based on ${size} ${unitLabel}${size !== 1 ? 's' : ''}. Actual costs vary — contact us for a precise quote.</div>
    </div>`;
  result.classList.add('visible');
}

/* ═══════════════════════════════════════════
   26. BULK ORDER FORM
   ═══════════════════════════════════════════ */
let _bulkRowCount = 0;

function openBulkOrder() {
  if (!document.getElementById('bulkOrderOverlay')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="tools-overlay" id="bulkOrderOverlay" onclick="if(event.target===this)closeBulkOrder()">
        <div class="tools-modal" style="max-width:640px">
          <div class="tools-modal-head">
            <div class="tools-modal-title"><i class="fa-solid fa-boxes-stacked"></i> Bulk Order Form</div>
            <button class="tools-modal-close" onclick="closeBulkOrder()"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="tools-modal-body">
            <div class="tools-form-row">
              <div class="tools-field">
                <label>Your Name *</label>
                <input type="text" id="boName" placeholder="Muhammad Ali">
              </div>
              <div class="tools-field">
                <label>Phone Number *</label>
                <input type="tel" id="boPhone" placeholder="03001234567">
              </div>
            </div>
            <div class="tools-field">
              <label>Company / Shop Name</label>
              <input type="text" id="boCompany" placeholder="Ali Plumbing Contractors">
            </div>
            <div style="overflow-x:auto;margin-top:.25rem">
              <table class="bulk-table" id="bulkTable">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Size</th>
                    <th style="width:70px">Qty</th>
                    <th style="width:80px">Unit</th>
                    <th style="width:32px"></th>
                  </tr>
                </thead>
                <tbody id="bulkTableBody"></tbody>
              </table>
            </div>
            <button class="btn-bulk-add-row" onclick="addBulkRow()"><i class="fa-solid fa-plus"></i> Add Row</button>
          </div>
          <div class="tools-modal-foot">
            <button class="btn-tools-calc" onclick="submitBulkOrder()"><i class="fa-brands fa-whatsapp"></i> Send via WhatsApp</button>
            <button class="btn-tools-cancel" onclick="closeBulkOrder()">Close</button>
          </div>
        </div>
      </div>
    `);
    // Add initial rows
    addBulkRow();
    addBulkRow();
    addBulkRow();
  }
  document.getElementById('bulkOrderOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBulkOrder() {
  const el = document.getElementById('bulkOrderOverlay');
  if (el) el.classList.remove('open');
  document.body.style.overflow = '';
}

function addBulkRow() {
  const tbody = document.getElementById('bulkTableBody');
  if (!tbody) return;
  const id = ++_bulkRowCount;
  tbody.insertAdjacentHTML('beforeend', `
    <tr id="bulkRow${id}">
      <td><input type="text" placeholder="e.g. PVC Pipe 4 inch" id="boProduct${id}"></td>
      <td><input type="text" placeholder='e.g. 4"' id="boSize${id}"></td>
      <td><input type="number" placeholder="10" min="1" id="boQty${id}"></td>
      <td><input type="text" placeholder="pcs/ft/m" id="boUnit${id}"></td>
      <td><button class="btn-bulk-del" onclick="removeBulkRow(${id})" title="Remove row"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `);
}

function removeBulkRow(id) {
  const row = document.getElementById('bulkRow' + id);
  if (row) row.remove();
}

function submitBulkOrder() {
  const name    = (document.getElementById('boName')?.value    || '').trim();
  const phone   = (document.getElementById('boPhone')?.value   || '').trim();
  const company = (document.getElementById('boCompany')?.value || '').trim();

  if (!name || !phone) {
    alert('Please enter your Name and Phone Number.');
    return;
  }

  // Collect all rows
  const rows = [];
  document.querySelectorAll('#bulkTableBody tr').forEach(row => {
    const idAttr = row.id.replace('bulkRow', '');
    const product = (document.getElementById('boProduct' + idAttr)?.value || '').trim();
    const size    = (document.getElementById('boSize'    + idAttr)?.value || '').trim();
    const qty     = (document.getElementById('boQty'     + idAttr)?.value || '').trim();
    const unit    = (document.getElementById('boUnit'    + idAttr)?.value || '').trim();
    if (product) rows.push({ product, size, qty, unit });
  });

  if (rows.length === 0) {
    alert('Please add at least one product to the order.');
    return;
  }

  const itemLines = rows.map((r, i) =>
    `${i + 1}. ${r.product}${r.size ? ' | Size: ' + r.size : ''}${r.qty ? ' | Qty: ' + r.qty : ''}${r.unit ? ' ' + r.unit : ''}`
  ).join('\n');

  const msg = [
    `*Bulk Order Request — Jalandhar Pipe Store*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 Name: ${name}`,
    `📞 Phone: ${phone}`,
    company ? `🏢 Company: ${company}` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `*Order Items:*`,
    itemLines,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Please confirm availability and pricing. Thank you!`,
  ].filter(Boolean).join('\n');

  window.open(`https://wa.me/92412645043?text=${encodeURIComponent(msg)}`, '_blank');
  closeBulkOrder();
}

/* ═══════════════════════════════════════════
   27. PIPE TOOLS FLOATING BUTTON
   ═══════════════════════════════════════════ */
function initCalculatorButtons() {
  if (document.getElementById('toolsFab')) return; // guard against double-injection

  document.body.insertAdjacentHTML('beforeend', `
    <div class="tools-fab" id="toolsFab">
      <button class="tools-fab-main" id="toolsFabMain" onclick="toggleToolsFab()" title="Pipe Tools">
        <i class="fa-solid fa-wrench"></i>
      </button>
      <div class="tools-fab-menu" id="toolsFabMenu">
        <button class="tools-fab-item" onclick="toggleToolsFab();openPipeCalc()">
          <i class="fa-solid fa-ruler-combined"></i> Pipe Calculator
        </button>
        <button class="tools-fab-item" onclick="toggleToolsFab();openEstimator()">
          <i class="fa-solid fa-file-invoice"></i> Project Estimator
        </button>
        <button class="tools-fab-item" onclick="toggleToolsFab();openBulkOrder()">
          <i class="fa-solid fa-boxes-stacked"></i> Bulk Order
        </button>
      </div>
    </div>
  `);

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const fab = document.getElementById('toolsFab');
    if (fab && !fab.contains(e.target)) {
      fab.classList.remove('open');
    }
  });
}

function toggleToolsFab() {
  const fab = document.getElementById('toolsFab');
  if (fab) fab.classList.toggle('open');
}

/* ═══════════════════════════════════════════
   28. SUPABASE PORTAL SYNC
   Auto-saves every confirmed order to the
   JMS Manager portal (Supabase backend) so
   the dashboard total-sales, recent orders,
   and all reports stay in sync automatically.
   ═══════════════════════════════════════════ */
(function () {
  const SB_URL = 'https://aybfhtlizetpzhtogvye.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5YmZodGxpemV0cHpodG9ndnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIxMTQsImV4cCI6MjA4NTM1ODExNH0.W4l4flPCeh5x-cfLWU1R32L9EBpOLHANlA-rWm_X_9E';
  const HDR = {
    'apikey': SB_KEY,
    'Authorization': 'Bearer ' + SB_KEY,
    'Content-Type': 'application/json'
  };

  async function sbFetch(path, opts) {
    const r = await fetch(SB_URL + path, { headers: HDR, ...opts });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  // Exposed globally so main.js / receiptModal confirm button can call it
  window.syncOrderToPortal = async function (orderData) {
    if (!orderData || !orderData.items || orderData.items.length === 0) return;
    try {
      // 1. Get default warehouse
      const whs = await sbFetch('/rest/v1/warehouses?select=id&order=name&limit=1');
      const whId = whs[0]?.id;
      if (!whId) return;

      // 2. Match each cart item to a portal product by name (ilike)
      const itemRows = await Promise.all(orderData.items.map(async (ci) => {
        const encoded = encodeURIComponent('%' + ci.name + '%');
        let prods = [];
        try { prods = await sbFetch(`/rest/v1/products?select=id,sale_price&name=ilike.${encoded}&limit=1`); }
        catch (_) { /* not found */ }
        const p   = prods[0];
        const qty  = Number(ci.qty) || 1;
        const rate = Number(p?.sale_price) || 0;
        const amt  = rate * qty;
        return {
          product_id:        p?.id || null,
          warehouse_id:      whId,
          quantity:          qty,
          rate:              rate,
          gross_amount:      amt,
          discount_percent:  0,
          discount_per_unit: 0,
          discount_amount:   0,
          net_rate:          rate,
          amount:            amt
        };
      }));

      // Only keep rows where we found a product (RPC requires non-null product_id)
      const matched = itemRows.filter(r => r.product_id);

      // 3. If nothing matched → still record as a pending enquiry via simple insert
      if (matched.length === 0) {
        const itemsText = orderData.items.map(i => `${i.name} x${i.qty || 1}`).join(', ');
        await sbFetch('/rest/v1/rpc/log_website_enquiry', {
          method: 'POST',
          body: JSON.stringify({
            p_guest_name:  (orderData.customerName || 'Website Visitor') +
                           (orderData.shopName ? ' / ' + orderData.shopName : ''),
            p_mobile:      orderData.phone || '',
            p_reference:   orderData.orderNo,
            p_items_text:  itemsText
          })
        }).catch(() => null); // ignore if RPC doesn't exist yet
        return;
      }

      // 4. Create the cash-sale invoice in the portal
      const netAmount = matched.reduce((s, r) => s + r.amount, 0);
      const guestName = (orderData.customerName || 'Website Order') +
                        (orderData.shopName ? ' / ' + orderData.shopName : '');

      const result = await sbFetch('/rest/v1/rpc/create_cash_sale_invoice', {
        method: 'POST',
        body: JSON.stringify({
          p_guest_name:      guestName,
          p_mobile:          orderData.phone || '',
          p_date:            new Date().toISOString().split('T')[0],
          p_quotation_ref:   orderData.orderNo,
          p_items:           matched,
          p_discount_percent: 0,
          p_discount_amount:  0,
          p_expense_percent:  0,
          p_expense_amount:   0,
          p_net_amount:       netAmount
        })
      });
      console.log('[JPS] Portal sync ✓ Bill #' + result);
    } catch (err) {
      // Non-blocking — order still completes even if sync fails
      console.warn('[JPS] Portal sync skipped:', err.message);
    }
  };
}());

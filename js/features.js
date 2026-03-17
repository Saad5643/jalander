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

function renderOrderHistory() {
  const el = document.getElementById('orderHistoryList');
  if (!el) return;
  const orders = JSON.parse(localStorage.getItem('jps_orders') || '[]');
  if (orders.length === 0) {
    el.innerHTML = `
      <div class="feat-empty-state">
        <i class="fa-solid fa-clock-rotate-left" style="font-size:2.5rem;color:#e2e8f0;margin-bottom:1rem"></i>
        <p style="color:#94a3b8;font-size:.95rem">No orders yet.<br>Place an order to see it here.</p>
      </div>`;
    return;
  }
  el.innerHTML = orders.map(o => {
    const totalQty = o.items.reduce((s, c) => s + (c.qty || 1), 0);
    const preview = o.items.slice(0, 3).map(i => escHtml(i.name)).join(', ') + (o.items.length > 3 ? `… +${o.items.length - 3} more` : '');
    return `
      <div class="oh-card">
        <div class="oh-card-header">
          <span class="oh-order-no"><i class="fa-solid fa-receipt"></i> ${escHtml(o.orderNo)}</span>
          <span class="oh-date">${escHtml(o.orderDate)} · ${escHtml(o.orderTime)}</span>
        </div>
        <div class="oh-customer"><i class="fa-solid fa-user"></i> ${escHtml(o.customerName)}${o.shopName ? ` · <i class="fa-solid fa-store"></i> ${escHtml(o.shopName)}` : ''}</div>
        <div class="oh-summary">${o.items.length} product${o.items.length !== 1 ? 's' : ''} · ${totalQty} pcs</div>
        <div class="oh-preview">${preview}</div>
        <button class="oh-resend-btn" onclick="reshareOrderWA(${JSON.stringify(o).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')})">
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
function showReceipt(customerName, shopName, phone) {
  const orderNo   = generateOrderNumber();
  const orderDate = new Date().toLocaleDateString('en-PK', { year:'numeric', month:'long', day:'numeric' });
  const orderTime = new Date().toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });

  _currentOrderData = { orderNo, orderDate, orderTime, customerName, shopName, phone, items: [...cartItems] };

  // Save to history
  saveOrderToHistory(_currentOrderData);

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
      <div class="feat-modal">
        <div class="feat-modal-head">
          <div class="feat-modal-title">
            <i class="fa-solid fa-clock-rotate-left" style="color:#1a4fba"></i> Order History
            <span id="orderHistoryBadge" class="feat-modal-badge" style="display:none">0</span>
          </div>
          <button class="feat-modal-close" onclick="closeOrderHistory()"><i class="fa-solid fa-xmark"></i></button>
        </div>
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
});

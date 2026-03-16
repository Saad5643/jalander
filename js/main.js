/* ==========================================
   Jalandhar Pipe Store — Main JavaScript
   ========================================== */

const PAGE_SIZE = 60;
let currentPage = 1;

/* ── Hamburger menu ── */
function initNav() {
  const ham = document.getElementById('hamburger');
  const mNav = document.getElementById('mobileNav');
  if (!ham || !mNav) return;
  ham.addEventListener('click', () => {
    ham.classList.toggle('open');
    mNav.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!ham.contains(e.target) && !mNav.contains(e.target)) {
      ham.classList.remove('open');
      mNav.classList.remove('open');
    }
  });
}

/* ── Active nav link ── */
function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html') ||
        (href && page.includes(href.replace('.html','')) && href !== 'index.html')) {
      a.classList.add('active');
    }
  });
}

/* ── Open / Closed status badge ── */
function initOpenStatus() {
  const el = document.getElementById('openStatus');
  if (!el) return;
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const hour = now.getHours();
  const isOpen = day >= 1 && day <= 6 && hour >= 8 && hour < 20;
  el.innerHTML = isOpen
    ? '<span class="status-badge open"><i class="fa-solid fa-circle"></i> Open Now</span>'
    : '<span class="status-badge closed"><i class="fa-solid fa-circle"></i> Closed</span>';
}

/* ── Back to Top ── */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── Navbar search (live dropdown) ── */
function initNavSearch() {
  const input = document.getElementById('navSearch');
  const drop  = document.getElementById('searchDrop');
  if (!input || !drop || typeof PRODUCTS === 'undefined') return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { drop.classList.remove('active'); return; }
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

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) window.location.href = `products.html?search=${encodeURIComponent(q)}`;
    }
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !drop.contains(e.target))
      drop.classList.remove('active');
  });
}

/* ── Mobile search ── */
function initMobileSearch() {
  const inp = document.getElementById('mobileSearch');
  if (!inp) return;
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && inp.value.trim())
      window.location.href = `products.html?search=${encodeURIComponent(inp.value.trim())}`;
  });
}

function goToProduct(id) {
  window.location.href = `products.html?id=${id}`;
}

/* ── Escape HTML ── */
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ═══════════════════════════════
   CATEGORY METADATA
   ═══════════════════════════════ */
const CAT_META = {
  'Pipes':                { emoji: '🔵', ci: 'ci-1', desc: 'PVC, CPVC, UPVC & HDPE pipes in all sizes', subs: ['PVC Pipes','CPVC Pipes','HDPE Pipes','UPVC Pipes'] },
  'Valves':               { emoji: '🔩', ci: 'ci-2', desc: 'Ball, gate, check, foot & handle valves', subs: ['Ball Valves','Gate Valves','Check Valves','Foot Valves'] },
  'Pipe Fittings':        { emoji: '⚙️',  ci: 'ci-3', desc: 'Elbows, tees, sockets, unions & couplings', subs: ['Elbows','Tees','Sockets','Unions','Couplings'] },
  'PPRC Fittings':        { emoji: '🟤', ci: 'ci-4', desc: 'Hot & cold water PPR pipe fittings', subs: ['PPR Elbows','PPR Tees','PPR Sockets'] },
  'UPVC Fittings':        { emoji: '⬜', ci: 'ci-5', desc: 'UPVC pressure & drainage fittings', subs: ['UPVC Elbows','UPVC Tees','UPVC Sockets'] },
  'Water Tanks':          { emoji: '💧', ci: 'ci-6', desc: 'Plastic storage tanks in all capacities', subs: ['100 Gallon','200 Gallon','500 Gallon','1000 Gallon'] },
  'Pumps':                { emoji: '⚡', ci: 'ci-7', desc: 'Submersible, surface & centrifugal pumps', subs: ['Submersible','Surface Pumps','Jet Pumps','Motors'] },
  'Bathroom Accessories': { emoji: '🚿', ci: 'ci-8', desc: 'Mixers, showers, taps & water heaters', subs: ['Mixers','Shower Sets','Bib Taps','Geysers'] },
  'Sanitary Ware':        { emoji: '🚽', ci: 'ci-1', desc: 'Commodes, basins, sinks & urinals', subs: ['Commodes','Basins','Sinks','Urinals'] },
  'Hardware & Tools':     { emoji: '🔧', ci: 'ci-3', desc: 'Pipe tools, wrenches, cutters & clamps', subs: ['Pipe Cutters','Wrenches','Clamps','Bands'] },
};

function enrichedCats() {
  if (typeof CATEGORIES === 'undefined') return [];
  return CATEGORIES.map(c => ({
    ...c,
    ...(CAT_META[c.name] || { emoji: '📦', ci: 'ci-1', desc: c.name, subs: [] })
  }));
}

/* ═══════════════════════════════
   HOME PAGE
   ═══════════════════════════════ */
function initHomePage() {
  renderHomeCats();
  renderHomeProducts();
}

function renderHomeCats() {
  const el = document.getElementById('homeCats');
  if (!el || typeof CATEGORIES === 'undefined') return;
  el.innerHTML = enrichedCats().map(c => `
    <a href="products.html?cat=${encodeURIComponent(c.name)}" class="cat-card">
      <div class="c-icon ${c.ci}">${c.emoji}</div>
      <h3>${escHtml(c.name)}</h3>
      <p>${escHtml(c.desc)}</p>
      <div class="cat-count">${getCatCount(c.name)} products</div>
    </a>`).join('');
}

function renderHomeProducts() {
  const el = document.getElementById('homeProducts');
  if (!el || typeof PRODUCTS === 'undefined') return;
  const featured = PRODUCTS.filter(p => p.badge).slice(0, 8);
  el.innerHTML = featured.map(p => productCardHTML(p)).join('');
}

/* ═══════════════════════════════
   CATEGORIES PAGE
   ═══════════════════════════════ */
function initCategoriesPage() {
  const el = document.getElementById('allCats');
  if (!el || typeof CATEGORIES === 'undefined') return;
  el.innerHTML = enrichedCats().map(c => `
    <a href="products.html?cat=${encodeURIComponent(c.name)}" class="cat-card-lg">
      <div class="c-icon ${c.ci}">${c.emoji}</div>
      <h3>${escHtml(c.name)}</h3>
      <p>${escHtml(c.desc)}</p>
      <div class="sub-tags">
        ${c.subs.map(s => `<span class="sub-tag">${escHtml(s)}</span>`).join('')}
      </div>
      <div class="cat-count" style="margin-top:.9rem">${getCatCount(c.name)} products</div>
    </a>`).join('');
}

/* ═══════════════════════════════
   PRODUCTS PAGE
   ═══════════════════════════════ */
let filteredProducts = [];
let activeFilters = { categories: [], brands: [], sizes: [] };
let searchQuery = '';
let sortOrder = 'default';

function initProductsPage() {
  if (typeof PRODUCTS === 'undefined') return;

  showSkeletons(12);
  setTimeout(() => {
    buildFilters();
    readURLParams();
    applyFilters();
    renderRecentlyViewed();
  }, 120);

  /* Sort */
  const sortEl = document.getElementById('sortSelect');
  if (sortEl) sortEl.addEventListener('change', () => { sortOrder = sortEl.value; currentPage = 1; renderProducts(); });

  /* Search */
  const searchEl = document.getElementById('productSearch');
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      searchQuery = searchEl.value.trim().toLowerCase();
      currentPage = 1;
      applyFilters();
    });
  }

  /* Clear filters */
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) clearBtn.addEventListener('click', clearAllFilters);

  /* Mobile filter toggle */
  const mfBtn = document.getElementById('mobileFilterBtn');
  const filterPanel = document.querySelector('.filter-panel');
  const filterOverlay = document.getElementById('filterOverlay');
  if (mfBtn && filterPanel) {
    mfBtn.addEventListener('click', () => {
      filterPanel.classList.toggle('open');
      if (filterOverlay) filterOverlay.classList.toggle('active');
    });
  }
  if (filterOverlay) {
    filterOverlay.addEventListener('click', () => {
      if (filterPanel) filterPanel.classList.remove('open');
      filterOverlay.classList.remove('active');
    });
  }
}

function readURLParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('cat'))    activeFilters.categories = [params.get('cat')];
  if (params.get('search')) {
    searchQuery = params.get('search').toLowerCase();
    const searchEl = document.getElementById('productSearch');
    if (searchEl) searchEl.value = params.get('search');
  }
  if (params.get('id')) {
    const id = parseInt(params.get('id'));
    const prod = PRODUCTS.find(p => p.id === id);
    if (prod) activeFilters.categories = [prod.category];
  }
  if (params.get('page')) currentPage = parseInt(params.get('page')) || 1;
  syncCheckboxes();
}

function pushURLState() {
  const params = new URLSearchParams();
  if (activeFilters.categories.length === 1) params.set('cat', activeFilters.categories[0]);
  if (searchQuery) params.set('search', searchQuery);
  if (currentPage > 1) params.set('page', currentPage);
  const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
  history.replaceState(null, '', url);
}

function buildFilters() {
  buildCategoryFilters();
  buildBrandFilters();
}

function buildCategoryFilters() {
  const el = document.getElementById('catFilters');
  if (!el || typeof CATEGORIES === 'undefined') return;
  el.innerHTML = CATEGORIES.map(c => `
    <label class="fg-option">
      <input type="checkbox" value="${escHtml(c.name)}" onchange="onFilterChange('categories',this)">
      <label>${escHtml(c.name)}</label>
      <span class="cnt">${getCatCount(c.name)}</span>
    </label>`).join('');
}

function buildBrandFilters() {
  const el = document.getElementById('brandFilters');
  if (!el) return;
  const brands = getBrands();
  el.innerHTML = brands.map(b => {
    const cnt = PRODUCTS.filter(p => p.brand === b).length;
    return `<label class="fg-option">
      <input type="checkbox" value="${escHtml(b)}" onchange="onFilterChange('brands',this)">
      <label>${escHtml(b)}</label>
      <span class="cnt">${cnt}</span>
    </label>`;
  }).join('');
}

function onFilterChange(type, checkbox) {
  const val = checkbox.value;
  if (checkbox.checked) {
    if (!activeFilters[type].includes(val)) activeFilters[type].push(val);
  } else {
    activeFilters[type] = activeFilters[type].filter(v => v !== val);
  }
  currentPage = 1;
  applyFilters();
}

function syncCheckboxes() {
  document.querySelectorAll('#catFilters input').forEach(cb => {
    cb.checked = activeFilters.categories.includes(cb.value);
  });
  document.querySelectorAll('#brandFilters input').forEach(cb => {
    cb.checked = activeFilters.brands.includes(cb.value);
  });
}

/* ── Category synonyms added to every product's haystack ── */
const CAT_SYNONYMS = {
  'Pipes':                'pipe pipes pvc cpvc upvc hdpe plastic tube tubing',
  'Valves':               'valve valves cock gate ball check foot handle flow',
  'Pipe Fittings':        'fitting fittings elbow tee socket coupling union bend connector nipple',
  'PPRC Fittings':        'pprc ppr fitting fittings hot cold water connector',
  'UPVC Fittings':        'upvc fitting fittings connector socket elbow tee',
  'Water Tanks':          'tank tanks water storage gallon liter barrel container',
  'Pumps':                'pump pumps motor submersible centrifugal surface jet amplere',
  'Bathroom Accessories': 'bathroom bath tap faucet mixer shower bib geyser heater water tap',
  'Sanitary Ware':        'sanitary toilet commode pan seat basin sink urinal closet',
  'Hardware & Tools':     'tool tools hardware wrench cutter plier clamp band ring key',
};

/* Words that are never useful for matching */
const STOPWORDS = new Set([
  'inch','inches','mm','cm','ft','feet','foot','meter','meters','metre','metres',
  'kg','gm','gram','ltr','liter','litre','liters','litres','class','no','no.',
  'size','type','grade','brand','quality','the','and','for','with','in','of',
]);

function buildHaystack(p) {
  const extra = CAT_SYNONYMS[p.category] || '';
  return [p.name, p.category, p.brand, p.desc, ...(p.tags || []), extra].join(' ').toLowerCase();
}

function productMatchesSearch(p, query) {
  const haystack = buildHaystack(p);

  // 1. Exact phrase match
  if (haystack.includes(query)) return true;

  // 2. Clean query: strip leading numbers and stopwords
  const words = query
    .split(/\s+/)
    .filter(w => w.length > 0 && !/^\d+$/.test(w) && !STOPWORDS.has(w));

  if (words.length === 0) return true; // only stopwords/numbers typed

  // 3. All words must be found as substrings (strictest)
  if (words.every(w => haystack.includes(w))) return true;

  // 4. Partial/starts-with: each word matches start of any token in haystack
  const tokens = haystack.split(/\s+/);
  const startsWithMatch = words.every(w => tokens.some(t => t.startsWith(w)));
  if (startsWithMatch) return true;

  // 5. Majority match for longer queries (≥3 significant words): 70% must match
  if (words.length >= 3) {
    const matched = words.filter(w => haystack.includes(w)).length;
    if (matched / words.length >= 0.7) return true;
  }

  return false;
}

function applyFilters() {
  filteredProducts = PRODUCTS.filter(p => {
    const catOK   = activeFilters.categories.length === 0 || activeFilters.categories.includes(p.category);
    const brandOK = activeFilters.brands.length === 0 || activeFilters.brands.includes(p.brand);
    const searchOK = searchQuery === '' || productMatchesSearch(p, searchQuery);
    return catOK && brandOK && searchOK;
  });
  renderProducts();
  renderActiveFilters();
  updateCount();
  pushURLState();
}

function renderProducts() {
  const el = document.getElementById('productsList');
  if (!el) return;

  let sorted = [...filteredProducts];
  if (sortOrder === 'name-asc') sorted.sort((a,b) => a.name.localeCompare(b.name));
  if (sortOrder === 'name-desc') sorted.sort((a,b) => b.name.localeCompare(a.name));
  if (sortOrder === 'cat') sorted.sort((a,b) => a.category.localeCompare(b.category));

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);

  if (sorted.length === 0) {
    /* No results — show suggestions */
    const suggestions = searchQuery
      ? PRODUCTS.filter(p => {
          const hay = buildHaystack(p);
          const words = searchQuery.split(/\s+/).filter(w => w && !/^\d+$/.test(w) && !STOPWORDS.has(w));
          return words.some(w => hay.includes(w));
        }).slice(0, 6)
      : PRODUCTS.slice(0, 6);

    el.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-box-open"></i>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters.</p>
        ${suggestions.length ? `
          <div class="suggestions">
            <p class="sug-label">You might be looking for:</p>
            <div class="products-grid">${suggestions.map(p => productCardHTML(p)).join('')}</div>
          </div>` : ''}
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="products-grid">${pageItems.map(p => productCardHTML(p)).join('')}</div>
    ${renderPagination(totalPages)}`;
}

function renderPagination(totalPages) {
  if (totalPages <= 1) return '';
  const pages = [];
  const delta = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }
  const btns = pages.map(p => {
    if (p === '…') return `<span class="pg-ellipsis">…</span>`;
    return `<button class="pg-btn${p === currentPage ? ' active' : ''}" onclick="goPage(${p})">${p}</button>`;
  }).join('');
  return `
    <div class="pagination">
      <button class="pg-btn pg-prev" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fa-solid fa-chevron-left"></i> Prev
      </button>
      ${btns}
      <button class="pg-btn pg-next" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        Next <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>`;
}

function goPage(page) {
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderProducts();
  updateCount();
  pushURLState();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateCount() {
  const el = document.getElementById('prodCount');
  if (!el) return;
  const total = filteredProducts.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);
  if (total === 0) {
    el.innerHTML = `<span>0</span> products found`;
  } else {
    el.innerHTML = `Showing <span>${start}–${end}</span> of <span>${total}</span> products · Page <span>${currentPage}</span>/<span>${totalPages}</span>`;
  }
}

function renderActiveFilters() {
  const el = document.getElementById('activeFilters');
  if (!el) return;
  const all = [
    ...activeFilters.categories.map(v => ({ type: 'categories', val: v })),
    ...activeFilters.brands.map(v => ({ type: 'brands', val: v }))
  ];
  if (searchQuery) all.push({ type: 'search', val: `"${searchQuery}"` });
  el.innerHTML = all.map(f => `
    <span class="af-tag">
      ${escHtml(f.val)}
      <button onclick="removeFilter('${f.type}','${escHtml(f.val)}')" title="Remove">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </span>`).join('');
}

function removeFilter(type, val) {
  if (type === 'search') {
    searchQuery = '';
    const searchEl = document.getElementById('productSearch');
    if (searchEl) searchEl.value = '';
  } else {
    activeFilters[type] = activeFilters[type].filter(v => v !== val);
  }
  currentPage = 1;
  syncCheckboxes();
  applyFilters();
}

function clearAllFilters() {
  activeFilters = { categories: [], brands: [], sizes: [] };
  searchQuery = '';
  currentPage = 1;
  const searchEl = document.getElementById('productSearch');
  if (searchEl) searchEl.value = '';
  syncCheckboxes();
  applyFilters();
}

/* ═══════════════════════════════
   CONTACT FORM
   ═══════════════════════════════ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = orig;
      const msg = document.getElementById('formSuccess');
      if (msg) { msg.classList.remove('hidden'); form.reset(); }
    }, 1400);
  });
}

/* ═══════════════════════════════
   PRODUCT CARD HTML
   ═══════════════════════════════ */
const CAT_ICONS = {
  'Pipes':                { fa: 'fa-water',              img: 'img-pipe' },
  'Valves':               { fa: 'fa-faucet-drip',        img: 'img-valve' },
  'Pipe Fittings':        { fa: 'fa-screwdriver-wrench', img: 'img-fitting' },
  'PPRC Fittings':        { fa: 'fa-temperature-half',   img: 'img-pprc' },
  'UPVC Fittings':        { fa: 'fa-circle-nodes',       img: 'img-upvc' },
  'Water Tanks':          { fa: 'fa-fill-drip',          img: 'img-tank' },
  'Pumps':                { fa: 'fa-bolt',               img: 'img-pump' },
  'Bathroom Accessories': { fa: 'fa-shower',             img: 'img-bathroom' },
  'Sanitary Ware':        { fa: 'fa-toilet',             img: 'img-sanitary' },
  'Hardware & Tools':     { fa: 'fa-toolbox',            img: 'img-tools' },
};

function buildWAMessage(p) {
  return encodeURIComponent(
    `Hi! I'd like to inquire about:\n\n*${p.name}*\nBrand: ${p.brand}\nCategory: ${p.category}\n\nPlease share availability and price. Thank you!`
  );
}

function productCardHTML(p) {
  const meta    = CAT_ICONS[p.category] || { fa: 'fa-box', img: 'img-product' };
  const badge   = p.badge ? `<span class="badge badge-orange p-badge">${escHtml(p.badge)}</span>` : '';
  const waMsg   = buildWAMessage(p);
  const inCart  = cartItems.some(c => c.id === p.id);
  return `
    <div class="prod-card" onclick="openProductModal(${p.id})">
      <div class="prod-img ${meta.img}">
        <i class="fa-solid ${meta.fa} prod-icon"></i>
        ${badge}
      </div>
      <div class="prod-body">
        <div class="prod-brand">${escHtml(p.brand)}</div>
        <div class="prod-name">${escHtml(p.name)}</div>
        <div class="prod-tags"><span class="prod-tag">${escHtml(p.category)}</span></div>
        <div class="prod-foot">
          <span class="prod-cat">${escHtml(p.sizes && p.sizes[0] !== 'Standard' ? p.sizes[0] : '')}</span>
          <div class="prod-actions">
            <button class="btn-cart-toggle${inCart ? ' active' : ''}"
              onclick="event.stopPropagation();toggleCart(${p.id})"
              title="${inCart ? 'Remove from list' : 'Add to list'}">
              <i class="fa-solid ${inCart ? 'fa-check' : 'fa-plus'}"></i>
            </button>
            <a class="btn btn-sm btn-call" href="tel:+923001234567" onclick="event.stopPropagation()" title="Call Us">
              <i class="fa-solid fa-phone"></i>
            </a>
            <a class="btn btn-sm btn-whatsapp" href="https://wa.me/923001234567?text=${waMsg}" target="_blank" onclick="event.stopPropagation()">
              <i class="fa-brands fa-whatsapp"></i> Inquire
            </a>
          </div>
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════
   GLOBAL UI INJECTION
   ═══════════════════════════════ */
function injectGlobalUI() {
  document.body.insertAdjacentHTML('beforeend', `
    <!-- Announcement Banner -->
    <div id="annBanner" class="ann-banner" style="display:none">
      <span>🎉 <strong>New Arrivals!</strong> Browse the latest PPRC & UPVC fittings — <a href="products.html?cat=PPRC+Fittings">Shop Now</a></span>
      <button class="ann-close" onclick="dismissBanner()" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <!-- Cart FAB -->
    <button class="cart-fab hidden" id="cartFab" onclick="openCart()" aria-label="Open cart">
      <i class="fa-solid fa-basket-shopping"></i>
    </button>

    <!-- Cart Overlay + Drawer -->
    <div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
    <div class="cart-drawer" id="cartDrawer">
      <div class="cd-head">
        <h3><i class="fa-solid fa-basket-shopping" style="margin-right:.5rem"></i>My Inquiry List</h3>
        <button class="cd-close" onclick="closeCart()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="cart-items" id="cartItemsList"></div>
      <div class="cd-foot" id="cartFoot" style="display:none">
        <div class="cd-count" id="cdCount"></div>
        <button class="btn-order-now" onclick="openOrderModal()">
          <i class="fa-solid fa-bag-shopping"></i> Place Order
        </button>
        <div class="cd-secondary-actions">
          <button class="btn-wa-cart" onclick="sendCartToWA()" title="Send as WhatsApp Inquiry">
            <i class="fa-brands fa-whatsapp"></i> Quick Inquiry
          </button>
          <button class="btn-clear-cart" onclick="clearCart()" title="Clear cart">
            <i class="fa-solid fa-trash-can"></i> Clear
          </button>
        </div>
      </div>
    </div>

    <!-- ══ Order Modal (Customer Info) ══ -->
    <div class="order-overlay" id="orderOverlay">
      <div class="order-modal">
        <div class="om-head">
          <div class="om-head-icon"><i class="fa-solid fa-bag-shopping"></i></div>
          <div>
            <h3>Place Your Order</h3>
            <p>Tell us who you are and we'll prepare your receipt</p>
          </div>
          <button class="om-close" onclick="closeOrderModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="om-body">
          <div class="om-items-preview" id="omItemsPreview"></div>
          <div class="om-form">
            <div class="om-field">
              <label for="orderName"><i class="fa-solid fa-user"></i> Your Name <span class="required">*</span></label>
              <input type="text" id="orderName" placeholder="e.g. Muhammad Ali" autocomplete="name">
              <span class="om-error" id="nameError"></span>
            </div>
            <div class="om-field">
              <label for="orderShop"><i class="fa-solid fa-store"></i> Shop / Business Name</label>
              <input type="text" id="orderShop" placeholder="e.g. Ali Brothers Traders (optional)" autocomplete="organization">
            </div>
            <div class="om-field">
              <label for="orderPhone"><i class="fa-solid fa-phone"></i> Phone Number</label>
              <input type="tel" id="orderPhone" placeholder="e.g. 0300-1234567 (optional)" autocomplete="tel">
            </div>
          </div>
        </div>
        <div class="om-foot">
          <button class="btn-om-cancel" onclick="closeOrderModal()">Cancel</button>
          <button class="btn-om-confirm" onclick="submitOrder()">
            <i class="fa-solid fa-receipt"></i> Generate Receipt
          </button>
        </div>
      </div>
    </div>

    <!-- ══ Receipt Modal ══ -->
    <div class="receipt-overlay" id="receiptOverlay">
      <div class="receipt-modal" id="receiptModal">
        <!-- dynamically filled -->
      </div>
    </div>

    <!-- Product Modal -->
    <div class="pm-overlay" id="pmOverlay" onclick="handleModalOverlayClick(event)">
      <div class="pm-modal" id="pmModal"></div>
    </div>
  `);

  // Move banner to top of body
  const banner = document.getElementById('annBanner');
  document.body.insertBefore(banner, document.body.firstChild);
}

/* ═══════════════════════════════
   ANNOUNCEMENT BANNER
   ═══════════════════════════════ */
function initAnnBanner() {
  if (localStorage.getItem('jps_ann_dismissed') === '1') return;
  const el = document.getElementById('annBanner');
  if (el) el.style.display = '';
}

function dismissBanner() {
  localStorage.setItem('jps_ann_dismissed', '1');
  const el = document.getElementById('annBanner');
  if (el) el.style.display = 'none';
}

/* ═══════════════════════════════
   CART SYSTEM
   ═══════════════════════════════ */
let cartItems = JSON.parse(localStorage.getItem('jps_cart') || '[]');

function saveCart() {
  localStorage.setItem('jps_cart', JSON.stringify(cartItems));
}

function toggleCart(id) {
  const idx = cartItems.findIndex(c => c.id === id);
  if (idx === -1) {
    const p = (window.PRODUCTS || []).find(x => x.id === id);
    if (p) cartItems.push({ id: p.id, name: p.name, brand: p.brand, category: p.category, img: p.img, qty: 1 });
  } else {
    cartItems.splice(idx, 1);
  }
  saveCart();
  updateCartUI();
  // Re-render card button without re-rendering whole grid
  document.querySelectorAll(`.btn-cart-toggle`).forEach(btn => {
    const card = btn.closest('.prod-card');
    if (!card) return;
    const cardId = parseInt(card.getAttribute('onclick')?.match(/\d+/) || 0);
    const inC = cartItems.some(c => c.id === cardId);
    btn.classList.toggle('active', inC);
    btn.title = inC ? 'Remove from list' : 'Add to list';
    btn.innerHTML = `<i class="fa-solid ${inC ? 'fa-check' : 'fa-plus'}"></i>`;
  });
}

function removeFromCart(id) {
  cartItems = cartItems.filter(c => c.id !== id);
  saveCart();
  updateCartUI();
  renderCartItems();
}

function clearCart() {
  cartItems = [];
  saveCart();
  updateCartUI();
  renderCartItems();
}

function updateCartUI() {
  const fab  = document.getElementById('cartFab');
  const foot = document.getElementById('cartFoot');
  const cnt  = document.getElementById('cdCount');
  const n    = cartItems.length;
  if (fab) {
    fab.classList.toggle('hidden', n === 0);
    const badge = fab.querySelector('.cart-badge');
    if (badge) badge.textContent = n;
    else if (n > 0) fab.insertAdjacentHTML('beforeend', `<span class="cart-badge">${n}</span>`);
  }
  if (foot) foot.style.display = n ? '' : 'none';
  const totalQtyCount = cartItems.reduce((s, c) => s + (c.qty || 1), 0);
  if (cnt) cnt.innerHTML = `<strong>${n}</strong> product${n !== 1 ? 's' : ''} · <strong>${totalQtyCount}</strong> pcs total`;
}

function updateQty(id, delta) {
  const item = cartItems.find(c => c.id === id);
  if (!item) return;
  item.qty = Math.max(1, (item.qty || 1) + delta);
  saveCart();
  updateCartUI();
  renderCartItems();
}

function renderCartItems() {
  const el = document.getElementById('cartItemsList');
  if (!el) return;
  if (cartItems.length === 0) {
    el.innerHTML = `<div class="cart-empty"><i class="fa-solid fa-basket-shopping"></i><p>Your cart is empty.<br>Add products then place your order.</p></div>`;
    return;
  }
  el.innerHTML = cartItems.map(c => {
    const meta = CAT_ICONS[c.category] || { fa: 'fa-box', img: 'img-product' };
    const qty = c.qty || 1;
    return `
      <div class="cart-item">
        <div class="ci-icon ${meta.img}"><i class="fa-solid ${meta.fa}"></i></div>
        <div class="ci-info">
          <div class="ci-brand">${escHtml(c.brand)}</div>
          <div class="ci-name">${escHtml(c.name)}</div>
          <div class="ci-qty-row">
            <button class="ci-qty-btn" onclick="updateQty(${c.id}, -1)"><i class="fa-solid fa-minus"></i></button>
            <span class="ci-qty">${qty}</span>
            <button class="ci-qty-btn" onclick="updateQty(${c.id}, 1)"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>
        <button class="ci-remove" onclick="removeFromCart(${c.id})" title="Remove"><i class="fa-solid fa-xmark"></i></button>
      </div>`;
  }).join('');
}

function openCart() {
  renderCartItems();
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

/* Quick Inquiry (no form) */
function sendCartToWA() {
  if (cartItems.length === 0) return;
  const lines = cartItems.map((c, i) => `${i + 1}. *${c.name}* (${c.brand}) × ${c.qty || 1}`).join('\n');
  const msg = encodeURIComponent(`Hi! I'd like to inquire about the following products:\n\n${lines}\n\nPlease share availability and prices. Thank you!`);
  window.open(`https://wa.me/923001234567?text=${msg}`, '_blank');
}

/* ─── ORDER MODAL ─── */
function openOrderModal() {
  if (cartItems.length === 0) return;

  // Populate items preview
  const preview = document.getElementById('omItemsPreview');
  if (preview) {
    preview.innerHTML = `
      <div class="om-preview-label"><i class="fa-solid fa-list-check"></i> ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} in your order</div>
      <div class="om-preview-chips">
        ${cartItems.slice(0, 4).map(c => `<span class="om-chip">${escHtml(c.name)} × ${c.qty || 1}</span>`).join('')}
        ${cartItems.length > 4 ? `<span class="om-chip om-chip-more">+${cartItems.length - 4} more</span>` : ''}
      </div>`;
  }

  // Clear previous values / errors
  const nameEl  = document.getElementById('orderName');
  const shopEl  = document.getElementById('orderShop');
  const phoneEl = document.getElementById('orderPhone');
  const errEl   = document.getElementById('nameError');
  if (nameEl)  nameEl.value  = '';
  if (shopEl)  shopEl.value  = '';
  if (phoneEl) phoneEl.value = '';
  if (errEl)   errEl.textContent = '';

  closeCart();
  document.getElementById('orderOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => { if (nameEl) nameEl.focus(); }, 300);
}

function closeOrderModal() {
  document.getElementById('orderOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function submitOrder() {
  const name  = (document.getElementById('orderName')?.value || '').trim();
  const shop  = (document.getElementById('orderShop')?.value || '').trim();
  const phone = (document.getElementById('orderPhone')?.value || '').trim();
  const errEl = document.getElementById('nameError');

  if (!name) {
    if (errEl) errEl.textContent = 'Please enter your name.';
    document.getElementById('orderName')?.focus();
    return;
  }
  if (errEl) errEl.textContent = '';

  closeOrderModal();
  showReceipt(name, shop, phone);
}

/* ─── RECEIPT ─── */
function generateOrderNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `JPS-${ymd}-${rand}`;
}

let _currentOrderData = null;

function showReceipt(customerName, shopName, phone) {
  const orderNo   = generateOrderNumber();
  const orderDate = new Date().toLocaleDateString('en-PK', { year:'numeric', month:'long', day:'numeric' });
  const orderTime = new Date().toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });

  _currentOrderData = { orderNo, orderDate, orderTime, customerName, shopName, phone, items: [...cartItems] };

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
      <thead>
        <tr>
          <th>#</th>
          <th>Product</th>
          <th>Qty</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="rc-divider"></div>

    <div class="rc-summary">
      <div class="rc-summary-row">
        <span>Total Items</span>
        <strong>${cartItems.length} product${cartItems.length !== 1 ? 's' : ''}</strong>
      </div>
      <div class="rc-summary-row">
        <span>Total Quantity</span>
        <strong>${cartItems.reduce((s, c) => s + (c.qty || 1), 0)} pcs</strong>
      </div>
    </div>

    <div class="rc-note">
      <i class="fa-solid fa-circle-info"></i>
      Prices will be confirmed by Jalandhar Pipe Store. This receipt is for order tracking only.
    </div>

    <div class="rc-actions">
      <button class="btn-rc-wa" onclick="shareReceiptWA()">
        <i class="fa-brands fa-whatsapp"></i> Send to Shop via WhatsApp
      </button>
      <button class="btn-rc-print" onclick="printReceipt()">
        <i class="fa-solid fa-print"></i> Print Receipt
      </button>
      <button class="btn-rc-close" onclick="closeReceipt()">
        <i class="fa-solid fa-xmark"></i> Close
      </button>
    </div>`;

  document.getElementById('receiptOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeReceipt() {
  document.getElementById('receiptOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function shareReceiptWA() {
  if (!_currentOrderData) return;
  const d = _currentOrderData;
  const itemLines = d.items.map((c, i) => `${i + 1}. ${c.name} (${c.brand}) × ${c.qty || 1}`).join('\n');
  const custLine  = d.shopName ? `${d.customerName} — ${d.shopName}` : d.customerName;
  const phoneLine = d.phone ? `\n📞 ${d.phone}` : '';
  const totalQty  = d.items.reduce((s, c) => s + (c.qty || 1), 0);

  const msg = encodeURIComponent(
`🧾 *NEW ORDER — Jalandhar Pipe Store*
━━━━━━━━━━━━━━━━━━━━
📋 Order No: ${d.orderNo}
📅 Date: ${d.orderDate} · ${d.orderTime}
👤 Customer: ${custLine}${phoneLine}
━━━━━━━━━━━━━━━━━━━━
*Items Ordered:*
${itemLines}
━━━━━━━━━━━━━━━━━━━━
📦 Total: ${d.items.length} product${d.items.length !== 1 ? 's' : ''} · ${totalQty} pcs

Please confirm availability and pricing. Thank you!`);

  window.open(`https://wa.me/923001234567?text=${msg}`, '_blank');
}

function printReceipt() {
  if (!_currentOrderData) return;
  const d = _currentOrderData;
  const itemRows = d.items.map((c, i) =>
    `<tr><td>${i+1}</td><td><strong>${c.name}</strong><br><small>${c.brand} · ${c.category}</small></td><td style="text-align:center">${c.qty||1}</td><td></td></tr>`
  ).join('');
  const totalQty = d.items.reduce((s, c) => s + (c.qty || 1), 0);

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
  <title>Order Receipt — ${d.orderNo}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;padding:1.5rem;color:#111;font-size:14px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a4fba;padding-bottom:1rem;margin-bottom:1rem}
    .store{display:flex;align-items:center;gap:.75rem}
    .store-icon{width:44px;height:44px;background:#1a4fba;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem;flex-shrink:0}
    .store-name{font-size:1.1rem;font-weight:800;color:#1a4fba}
    .store-sub{font-size:.75rem;color:#6b7280}
    .order-meta{text-align:right}
    .order-no{font-size:1rem;font-weight:700;color:#1a4fba}
    .order-date{font-size:.75rem;color:#6b7280;margin-top:.2rem}
    .customer{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:.75rem 1rem;margin-bottom:1rem;display:flex;gap:2rem;flex-wrap:wrap}
    .customer div{font-size:.85rem;color:#374151}<br>.customer span{font-weight:600;color:#111}
    table{width:100%;border-collapse:collapse;margin-bottom:1rem}
    th{background:#1a4fba;color:#fff;padding:.5rem .75rem;text-align:left;font-size:.8rem}
    td{padding:.5rem .75rem;border-bottom:1px solid #f1f5f9;font-size:.85rem;vertical-align:top}
    tr:nth-child(even) td{background:#f8fafc}
    .summary{background:#f0f5ff;border:1px solid #dbeafe;border-radius:8px;padding:.75rem 1rem;margin-bottom:1rem;display:flex;gap:2rem}
    .summary div{font-size:.85rem;color:#374151}.summary strong{color:#1a4fba}
    .footer{font-size:.75rem;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:.75rem;text-align:center}
    @media print{body{padding:.5rem}button{display:none!important}}
  </style></head><body>
  <div class="header">
    <div class="store">
      <div class="store-icon">🔧</div>
      <div><div class="store-name">Jalandhar Pipe Store</div><div class="store-sub">Plumbing Materials · Faisalabad · +92 300 1234567</div></div>
    </div>
    <div class="order-meta">
      <div class="order-no">Order # ${d.orderNo}</div>
      <div class="order-date">${d.orderDate} · ${d.orderTime}</div>
    </div>
  </div>
  <div class="customer">
    <div>👤 Customer: <span>${d.customerName}</span></div>
    ${d.shopName ? `<div>🏪 Shop: <span>${d.shopName}</span></div>` : ''}
    ${d.phone    ? `<div>📞 Phone: <span>${d.phone}</span></div>` : ''}
  </div>
  <table>
    <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Notes / Price</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="summary">
    <div>Total Products: <strong>${d.items.length}</strong></div>
    <div>Total Quantity: <strong>${totalQty} pcs</strong></div>
  </div>
  <div class="footer">Prices to be confirmed by Jalandhar Pipe Store · This is an order receipt, not a tax invoice</div>
  <script>window.onload=()=>window.print();<\/script>
  </body></html>`);
  win.document.close();
}

function initCart() {
  updateCartUI();
}

/* ═══════════════════════════════
   PRODUCT DETAIL MODAL
   ═══════════════════════════════ */
function openProductModal(id) {
  const p = (window.PRODUCTS || []).find(x => x.id === id);
  if (!p) return;
  trackRecentlyViewed(id);

  const meta   = CAT_ICONS[p.category] || { fa: 'fa-box', img: 'img-product' };
  const waMsg  = buildWAMessage(p);
  const inCart = cartItems.some(c => c.id === p.id);
  const sizes  = p.sizes && p.sizes.length && p.sizes[0] !== 'Standard'
    ? `<div><div class="pm-sec-label">Available Sizes</div><div class="pm-sizes">${p.sizes.map(s => `<span class="pm-size-chip">${escHtml(s)}</span>`).join('')}</div></div>` : '';
  const tags   = p.tags && p.tags.length
    ? `<div><div class="pm-sec-label">Tags</div><div class="pm-tags">${p.tags.map(t => `<span class="pm-tag">${escHtml(t)}</span>`).join('')}</div></div>` : '';

  document.getElementById('pmModal').innerHTML = `
    <div class="pm-head">
      <div class="pm-icon ${meta.img}"><i class="fa-solid ${meta.fa}"></i></div>
      <div class="pm-title">
        <div class="pm-brand">${escHtml(p.brand)}</div>
        <div class="pm-name">${escHtml(p.name)}</div>
        <span class="pm-cat-pill"><i class="fa-solid ${meta.fa}" style="font-size:.65rem"></i> ${escHtml(p.category)}</span>
      </div>
      <button class="pm-close" onclick="closeProductModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="pm-body">
      ${p.desc ? `<div><div class="pm-sec-label">Description</div><div class="pm-desc">${escHtml(p.desc)}</div></div>` : ''}
      ${sizes}
      ${tags}
    </div>
    <div class="pm-foot">
      <button class="btn-pm-cart${inCart ? ' in-cart' : ''}" id="pmCartBtn" onclick="toggleCartFromModal(${p.id})">
        <i class="fa-solid ${inCart ? 'fa-check' : 'fa-plus'}"></i>
        ${inCart ? 'Added to List' : 'Add to Inquiry List'}
      </button>
      <a class="btn btn-whatsapp" href="https://wa.me/923001234567?text=${waMsg}" target="_blank">
        <i class="fa-brands fa-whatsapp"></i> WhatsApp
      </a>
      <a class="btn btn-call" href="tel:+923001234567">
        <i class="fa-solid fa-phone"></i> Call
      </a>
    </div>`;

  document.getElementById('pmOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('pmOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function handleModalOverlayClick(e) {
  if (e.target === document.getElementById('pmOverlay')) closeProductModal();
}

function toggleCartFromModal(id) {
  toggleCart(id);
  const inCart = cartItems.some(c => c.id === id);
  const btn = document.getElementById('pmCartBtn');
  if (btn) {
    btn.className = 'btn-pm-cart' + (inCart ? ' in-cart' : '');
    btn.innerHTML = `<i class="fa-solid ${inCart ? 'fa-check' : 'fa-plus'}"></i> ${inCart ? 'Added to List' : 'Add to Inquiry List'}`;
  }
}

/* ═══════════════════════════════
   RECENTLY VIEWED
   ═══════════════════════════════ */
function trackRecentlyViewed(id) {
  let rv = JSON.parse(localStorage.getItem('jps_rv') || '[]');
  rv = rv.filter(x => x !== id);
  rv.unshift(id);
  rv = rv.slice(0, 8);
  localStorage.setItem('jps_rv', JSON.stringify(rv));
  renderRecentlyViewed();
}

function renderRecentlyViewed() {
  const container = document.getElementById('recentlyViewed');
  if (!container || typeof PRODUCTS === 'undefined') return;
  const rv = JSON.parse(localStorage.getItem('jps_rv') || '[]');
  if (rv.length === 0) { container.innerHTML = ''; return; }
  const products = rv.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  if (products.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <div class="rv-section">
      <h4><i class="fa-solid fa-clock-rotate-left" style="color:var(--primary)"></i> Recently Viewed</h4>
      <div class="rv-strip">
        ${products.map(p => {
          const meta = CAT_ICONS[p.category] || { fa: 'fa-box', img: 'img-product' };
          return `
            <div class="rv-card" onclick="openProductModal(${p.id})">
              <div class="rv-img ${meta.img}"><i class="fa-solid ${meta.fa}"></i></div>
              <div class="rv-info">
                <div class="rv-brand">${escHtml(p.brand)}</div>
                <div class="rv-name">${escHtml(p.name)}</div>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* ═══════════════════════════════
   SKELETON LOADING
   ═══════════════════════════════ */
function showSkeletons(n) {
  const el = document.getElementById('productsList');
  if (!el) return;
  const card = () => `
    <div class="skeleton-card">
      <div class="skel-img"></div>
      <div class="skel-body">
        <div class="skel-line xshort"></div>
        <div class="skel-line"></div>
        <div class="skel-line short"></div>
      </div>
    </div>`;
  el.innerHTML = `<div class="products-grid">${Array.from({ length: n }, card).join('')}</div>`;
}

/* ── Smooth scroll for anchor links ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

/* ── Init on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  injectGlobalUI();
  initAnnBanner();
  initCart();

  initNav();
  setActiveNav();
  initNavSearch();
  initMobileSearch();
  initSmoothScroll();
  initOpenStatus();
  initBackToTop();

  const page = location.pathname.split('/').pop();
  if (!page || page === 'index.html')       initHomePage();
  if (page === 'products.html')             initProductsPage();
  if (page === 'categories.html')           initCategoriesPage();
  if (page === 'contact.html')              initContactForm();
});

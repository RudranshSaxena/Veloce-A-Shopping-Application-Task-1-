import { getCart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotals, showToast } from './cart.js';

// Cache for products fetched from the main API
let cachedProducts = [];
let selectedCategory = 'all';
let searchQuery = '';
let sortBy = 'featured';
let appliedPromo = null; // Simulated promo code state

// DOM elements
const appRoot = document.getElementById('app-root');
const globalSearch = document.getElementById('global-search');
const cartBadgeCount = document.getElementById('cart-badge-count');

// Initialize routing & listeners
function init() {
  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('cart-updated', updateCartBadge);
  
  // Setup navbar search
  globalSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    
    // If not on listing page, navigate to listing page to show results
    const hash = window.location.hash;
    if (hash && hash !== '#/' && !hash.startsWith('#/category/')) {
      window.location.hash = '#/';
      // Wait for navigation and focus search again if needed
      setTimeout(() => {
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
          searchInput.value = searchQuery;
          searchInput.focus();
        }
      }, 50);
    } else {
      // We are on listing, trigger re-render
      renderListingGrid();
    }
  });

  // Initial page load
  handleRoute();
  updateCartBadge();
}

// Update the floating cart count in the header
function updateCartBadge() {
  const totals = getCartTotals();
  if (cartBadgeCount) {
    cartBadgeCount.textContent = totals.itemCount;
    // Animate the badge briefly on change
    cartBadgeCount.classList.add('badge-bump');
    setTimeout(() => cartBadgeCount.classList.remove('badge-bump'), 300);
  }
}

// Router
async function handleRoute() {
  const hash = window.location.hash || '#/';
  
  // Highlight active nav links
  document.getElementById('nav-home').classList.toggle('active', hash === '#/');
  
  // Search visibility: keep it visible but reset value if we navigated elsewhere
  if (hash === '#/') {
    globalSearch.value = searchQuery;
  } else {
    globalSearch.value = '';
  }

  if (hash === '#/') {
    await renderListingPage();
  } else if (hash.startsWith('#/product/')) {
    const productId = hash.split('/').pop();
    await renderProductDetailPage(productId);
  } else if (hash === '#/cart') {
    renderCartPage();
  } else {
    // Fallback to home
    window.location.hash = '#/';
  }
}

/* ==========================================================================
   Page 1: Listing Page
   ========================================================================== */
async function renderListingPage() {
  appRoot.innerHTML = `
    <!-- Hero Banner -->
    <div class="hero-banner">
      <h1 class="hero-title">Discover Premium Collections</h1>
      <p class="hero-subtitle">Explore 190+ high-quality products curated just for you, from fashion and electronics to home décor.</p>
    </div>

    <!-- Controls Panel (Filters & Sort) -->
    <div class="controls-panel">
      <div class="category-scroll-container" id="categories-container">
        <!-- Rendered dynamically -->
        <span class="category-pill active" data-category="all">All Products</span>
      </div>
      
      <div class="secondary-controls">
        <div class="results-count" id="results-count">Showing 0 products</div>
        <div class="sort-wrapper">
          <label class="sort-label" for="sort-select">Sort by:</label>
          <select id="sort-select" class="sort-select">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating-desc">Customer Rating</option>
            <option value="title-asc">Alphabetical: A-Z</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    <div class="product-grid" id="listing-grid">
      <!-- Loading skeletons will show here first -->
      ${renderSkeletons(8)}
    </div>
  `;

  // Restore sort choice and set listener
  const sortSelect = document.getElementById('sort-select');
  sortSelect.value = sortBy;
  sortSelect.addEventListener('change', (e) => {
    sortBy = e.target.value;
    renderListingGrid();
  });

  // Fetch products if not already loaded
  if (cachedProducts.length === 0) {
    try {
      const response = await fetch('https://dummyjson.com/products?limit=194');
      const data = await response.json();
      cachedProducts = data.products || [];
    } catch (e) {
      console.error('Failed to fetch products', e);
      document.getElementById('listing-grid').innerHTML = `
        <div class="empty-cart-state" style="grid-column: 1 / -1;">
          <svg class="empty-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M12 2v9M8 5v6M16 5v6"></path></svg>
          <div class="empty-cart-title">Unable to load products</div>
          <p class="empty-cart-desc">There was a network connection error. Please try again later.</p>
          <button class="btn btn-primary" id="retry-fetch-btn" style="width: auto;">Retry Connection</button>
        </div>
      `;
      document.getElementById('retry-fetch-btn')?.addEventListener('click', renderListingPage);
      return;
    }
  }

  // Populate dynamic category filter pills
  renderCategoryPills();

  // Render the current active product set
  renderListingGrid();
}

function renderCategoryPills() {
  const container = document.getElementById('categories-container');
  if (!container) return;

  // Extract unique categories
  const categories = ['all', ...new Set(cachedProducts.map(p => p.category))];

  container.innerHTML = categories.map(cat => {
    const label = cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ');
    const activeClass = selectedCategory === cat ? 'active' : '';
    return `<span class="category-pill ${activeClass}" data-category="${cat}">${label}</span>`;
  }).join('');

  // Add click events to pills
  container.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      container.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedCategory = pill.dataset.category;
      renderListingGrid();
    });
  });
}

function renderListingGrid() {
  const grid = document.getElementById('listing-grid');
  const countEl = document.getElementById('results-count');
  if (!grid) return;

  // Filter products by category & search query
  let products = [...cachedProducts];

  if (selectedCategory !== 'all') {
    products = products.filter(p => p.category === selectedCategory);
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    products = products.filter(p => 
      p.title.toLowerCase().includes(q) || 
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  }

  // Sort products
  if (sortBy === 'price-asc') {
    products.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    products.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating-desc') {
    products.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'title-asc') {
    products.sort((a, b) => a.title.localeCompare(b.title));
  }
  // 'featured' defaults to standard API order

  if (countEl) {
    countEl.textContent = `Showing ${products.length} of ${cachedProducts.length} products`;
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-cart-state" style="grid-column: 1 / -1; padding: 5rem 2rem;">
        <svg class="empty-cart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <div class="empty-cart-title">No products found</div>
        <p class="empty-cart-desc">We couldn't find matches for "${searchQuery}". Try typing another keyword or choosing a different category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(product => {
    const ratingHTML = renderStarsHTML(product.rating);
    const hasDiscount = product.discountPercentage > 0;
    
    // Calculate crossed-out original price
    const originalPrice = hasDiscount ? (product.price / (1 - product.discountPercentage / 100)).toFixed(2) : null;
    const currentPrice = product.price.toFixed(2);
    
    return `
      <article class="product-card" data-id="${product.id}">
        ${hasDiscount ? `<div class="card-badge-discount">-${Math.round(product.discountPercentage)}%</div>` : ''}
        <div class="card-badge-category">${product.category}</div>
        
        <a href="#/product/${product.id}" class="card-img-link">
          <img src="${product.thumbnail || product.images[0]}" alt="${product.title}" class="card-img" loading="lazy">
        </a>
        
        <div class="card-details">
          <span class="card-brand">${product.brand || 'Premium'}</span>
          <a href="#/product/${product.id}"><h3 class="card-title">${product.title}</h3></a>
          
          <div class="rating-container">
            ${ratingHTML}
            <span class="rating-value">${product.rating.toFixed(1)}</span>
          </div>
          
          <div class="card-price-row">
            <span class="price-current">$${currentPrice}</span>
            ${hasDiscount ? `<span class="price-original">$${originalPrice}</span>` : ''}
          </div>
          
          <div class="card-action-row">
            <button class="btn btn-secondary quick-view-btn" data-id="${product.id}">Quick View</button>
            <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Add event listeners to grid items
  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const product = cachedProducts.find(p => p.id === id);
      if (product) addToCart(product, 1);
    });
  });

  grid.querySelectorAll('.quick-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      window.location.hash = `#/product/${id}`;
    });
  });
}

function renderSkeletons(count) {
  let skeletons = '';
  for (let i = 0; i < count; i++) {
    skeletons += `
      <div class="skeleton-card">
        <div class="skeleton-media"></div>
        <div class="skeleton-text short"></div>
        <div class="skeleton-text long"></div>
        <div class="skeleton-text medium"></div>
        <div style="margin-top: auto; display: flex; gap: 0.5rem;">
          <div class="skeleton-text" style="width: 50%; height: 2.2rem; border-radius: var(--radius-md);"></div>
          <div class="skeleton-text" style="width: 50%; height: 2.2rem; border-radius: var(--radius-md);"></div>
        </div>
      </div>
    `;
  }
  return skeletons;
}

/* ==========================================================================
   Page 2: Product Detail Page
   ========================================================================== */
async function renderProductDetailPage(productId) {
  // Show base structure with loading state
  appRoot.innerHTML = `
    <div class="back-bar">
      <a href="#/" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Products
      </a>
    </div>
    
    <div class="detail-layout">
      <div class="gallery-showcase">
        <div class="main-image-viewport">
          <div class="skeleton-media" style="position: absolute; top:0; left:0; width:100%; height:100%;"></div>
        </div>
      </div>
      <div class="info-panel">
        <div class="skeleton-text long" style="height: 2.5rem;"></div>
        <div class="skeleton-text medium" style="height: 1.5rem;"></div>
        <div class="skeleton-text long" style="height: 6rem; margin-top: 1rem;"></div>
      </div>
    </div>
  `;

  // Fetch full details from specific product endpoint
  let product = null;
  try {
    const response = await fetch(`https://dummyjson.com/products/${productId}`);
    if (!response.ok) throw new Error('Failed to load product');
    product = await response.json();
  } catch (e) {
    console.error(e);
    // Try to fall back to cached product list if online fetching fails
    product = cachedProducts.find(p => p.id === parseInt(productId));
    if (!product) {
      appRoot.innerHTML = `
        <div class="back-bar">
          <a href="#/" class="back-link"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back to Products</a>
        </div>
        <div class="empty-cart-state">
          <svg class="empty-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <div class="empty-cart-title">Product not found</div>
          <p class="empty-cart-desc">The product you are looking for might have been removed or is temporarily unavailable.</p>
        </div>
      `;
      return;
    }
  }

  const hasDiscount = product.discountPercentage > 0;
  const originalPrice = hasDiscount ? (product.price / (1 - product.discountPercentage / 100)).toFixed(2) : null;
  const currentPrice = product.price.toFixed(2);
  const savings = hasDiscount ? (parseFloat(originalPrice) - product.price).toFixed(2) : null;
  
  // Format stock label class
  let stockClass = 'instock';
  let stockLabel = 'In Stock';
  if (product.stock <= 0) {
    stockClass = 'outofstock';
    stockLabel = 'Out of Stock';
  } else if (product.stock < 10) {
    stockClass = 'lowstock';
    stockLabel = `Only ${product.stock} Left!`;
  }

  // Build image list
  const images = product.images || [];
  const initialImage = images[0] || product.thumbnail;

  appRoot.innerHTML = `
    <div class="back-bar">
      <a href="#/" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Products
      </a>
    </div>
    
    <div class="detail-layout">
      <!-- Image Gallery Container -->
      <div class="gallery-showcase">
        <div class="main-image-viewport">
          <img id="main-product-image" src="${initialImage}" alt="${product.title}">
        </div>
        
        ${images.length > 1 ? `
          <div class="gallery-thumbnails">
            ${images.map((img, index) => `
              <button class="thumbnail-btn ${index === 0 ? 'active' : ''}" data-src="${img}">
                <img src="${img}" alt="Thumbnail ${index + 1}">
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      
      <!-- Info Details Column -->
      <div class="info-panel">
        <div class="info-header">
          <div class="info-meta-row">
            <span class="card-badge-category" style="position:static;">${product.category}</span>
            <span class="badge-status ${stockClass}">${stockLabel}</span>
          </div>
          <h1 class="info-title">${product.title}</h1>
          <span class="card-brand" style="font-size: 0.9rem;">Brand: ${product.brand || 'Veloce'}</span>
        </div>
        
        <div class="rating-container" style="font-size: 1rem;">
          ${renderStarsHTML(product.rating)}
          <span class="rating-value">${product.rating.toFixed(2)} / 5.0</span>
          <span style="color: var(--text-muted); margin-left: 0.5rem;">(${product.reviews ? product.reviews.length : 0} verified customer reviews)</span>
        </div>
        
        <!-- Price Block -->
        <div class="info-price-block">
          <div class="info-price-row">
            <span class="info-price-current">$${currentPrice}</span>
            ${hasDiscount ? `<span class="info-price-original">$${originalPrice}</span>` : ''}
          </div>
          ${hasDiscount ? `
            <span class="info-savings">You Save: $${savings} (${Math.round(product.discountPercentage)}% Off)</span>
          ` : ''}
        </div>
        
        <p class="info-description">${product.description}</p>
        
        <!-- Actions & Purchase Controller -->
        <div class="purchase-controls">
          <div class="quantity-selector">
            <button class="quantity-btn" id="qty-minus">-</button>
            <input type="number" class="quantity-input" id="qty-input" value="1" min="1" max="${product.stock}">
            <button class="quantity-btn" id="qty-plus">+</button>
          </div>
          
          <button class="btn btn-primary" id="add-to-cart-detail" ${product.stock <= 0 ? 'disabled' : ''} style="flex: 1; padding: 0.9rem 1.5rem;">
            <svg class="cart-icon" style="width:1.2rem; height:1.2rem;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            ${product.stock <= 0 ? 'Out of Stock' : 'Add to Shopping Cart'}
          </button>
        </div>
        
        <!-- Specifications -->
        <div class="specs-panel">
          <h3 class="specs-title">Product Details</h3>
          <div class="specs-grid">
            <div class="spec-item">
              <span class="spec-label">SKU</span>
              <span class="spec-val">${product.sku || 'N/A'}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Warranty</span>
              <span class="spec-val">${product.warrantyInformation || '1 Year Standard'}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Weight</span>
              <span class="spec-val">${product.weight ? product.weight + ' kg' : 'N/A'}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Shipping</span>
              <span class="spec-val">${product.shippingInformation || 'Standard Shipping'}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Return Policy</span>
              <span class="spec-val">${product.returnPolicy || '30 days returns'}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Dimensions</span>
              <span class="spec-val">
                ${product.dimensions ? `${product.dimensions.width}W x ${product.dimensions.height}H x ${product.dimensions.depth}D cm` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Customer Reviews Section -->
    <div class="reviews-section">
      <div class="reviews-header-row">
        <h2 class="reviews-title">Customer Feedback</h2>
      </div>
      <div class="reviews-grid">
        ${product.reviews && product.reviews.length > 0 ? product.reviews.map(rev => `
          <div class="review-card">
            <div class="review-card-header">
              <div class="reviewer-info">
                <span class="reviewer-name">${rev.reviewerName}</span>
                <span class="review-date">${formatDate(rev.date)}</span>
              </div>
              <div class="rating-container">
                ${renderStarsHTML(rev.rating)}
              </div>
            </div>
            <p class="review-comment">"${rev.comment}"</p>
          </div>
        `).join('') : `
          <div class="empty-cart-state" style="grid-column: 1 / -1; padding: 2rem; border-style: dashed;">
            <p class="empty-cart-desc">No reviews have been submitted for this item yet.</p>
          </div>
        `}
      </div>
    </div>
  `;

  // Gallery Thumbnail interactions
  const mainImage = document.getElementById('main-product-image');
  const thumbs = appRoot.querySelectorAll('.thumbnail-btn');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImage) mainImage.src = thumb.dataset.src;
    });
  });

  // Quantity controllers logic
  const qtyInput = document.getElementById('qty-input');
  const btnMinus = document.getElementById('qty-minus');
  const btnPlus = document.getElementById('qty-plus');

  if (qtyInput && btnMinus && btnPlus) {
    const maxStock = product.stock;

    btnMinus.addEventListener('click', () => {
      let currentVal = parseInt(qtyInput.value) || 1;
      if (currentVal > 1) {
        qtyInput.value = currentVal - 1;
      }
    });

    btnPlus.addEventListener('click', () => {
      let currentVal = parseInt(qtyInput.value) || 1;
      if (currentVal < maxStock) {
        qtyInput.value = currentVal + 1;
      }
    });

    qtyInput.addEventListener('change', () => {
      let currentVal = parseInt(qtyInput.value);
      if (isNaN(currentVal) || currentVal < 1) {
        qtyInput.value = 1;
      } else if (currentVal > maxStock) {
        qtyInput.value = maxStock;
      }
    });
  }

  // Add to cart click
  const addToCartBtn = document.getElementById('add-to-cart-detail');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      const quantity = parseInt(qtyInput.value) || 1;
      addToCart(product, quantity);
    });
  }
}

/* ==========================================================================
   Page 3: Cart Page
   ========================================================================== */
function renderCartPage() {
  const cart = getCart();

  if (cart.length === 0) {
    appRoot.innerHTML = `
      <div class="cart-title-row">
        <h1 class="cart-title">Your Cart</h1>
      </div>
      
      <div class="empty-cart-state" style="margin-top: 1rem;">
        <svg class="empty-cart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <div class="empty-cart-title">Your Shopping Cart is Empty</div>
        <p class="empty-cart-desc">Looks like you haven't added anything to your cart yet. Head back to the store to explore our catalog.</p>
        <a href="#/" class="btn btn-primary" style="width: auto; padding: 0.75rem 2rem;">Start Shopping</a>
      </div>
    `;
    return;
  }

  appRoot.innerHTML = `
    <div class="cart-title-row">
      <h1 class="cart-title">Your Shopping Bag</h1>
      <span class="clear-cart-btn" id="clear-cart-trigger">Clear Cart</span>
    </div>
    
    <div class="cart-layout">
      <!-- Cart Items List -->
      <div class="cart-items-container">
        ${cart.map(item => {
          const discount = item.discountPercentage || 0;
          const originalPrice = discount > 0 ? (item.price / (1 - discount / 100)) : item.price;
          const lineTotal = (item.price * item.quantity).toFixed(2);
          
          return `
            <div class="cart-item" data-id="${item.id}">
              <div class="cart-item-img-wrapper">
                <img src="${item.thumbnail}" alt="${item.title}">
              </div>
              
              <div class="cart-item-details">
                <span class="cart-item-brand">${item.brand}</span>
                <a href="#/product/${item.id}"><h3 class="cart-item-title">${item.title}</h3></a>
                
                <div class="cart-item-price-block">
                  <span class="cart-item-price-current">$${item.price.toFixed(2)}</span>
                  ${discount > 0 ? `<span class="cart-item-price-original">$${originalPrice.toFixed(2)}</span>` : ''}
                </div>
              </div>
              
              <div class="cart-item-controls">
                <div class="quantity-selector">
                  <button class="quantity-btn item-qty-minus" data-id="${item.id}">-</button>
                  <input type="number" class="quantity-input item-qty-input" data-id="${item.id}" value="${item.quantity}" min="1" max="${item.stock}">
                  <button class="quantity-btn item-qty-plus" data-id="${item.id}">+</button>
                </div>
                
                <div style="font-weight: 700; font-size: 1.1rem; min-width: 70px; text-align: right;">
                  $${lineTotal}
                </div>
                
                <button class="cart-item-remove-btn" data-id="${item.id}" aria-label="Remove item">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <!-- Bill Summary Area -->
      <div class="summary-card" id="bill-summary-container">
        <!-- Rendered dynamically below to support instant updates -->
      </div>
    </div>
  `;

  // Bind cart interactive event handlers
  bindCartEvents();
  renderBillSummary();
}

function renderBillSummary() {
  const container = document.getElementById('bill-summary-container');
  if (!container) return;

  const totals = getCartTotals();
  
  // Calculate potential promo discount
  let promoDiscountVal = 0;
  let promoRowHTML = '';
  if (appliedPromo) {
    if (appliedPromo.code === 'VELOCE20') {
      promoDiscountVal = totals.currentPriceTotal * 0.20; // 20% off actual price
      promoRowHTML = `
        <div class="summary-row savings">
          <span>Promo Code (VELOCE20)</span>
          <span>-$${promoDiscountVal.toFixed(2)}</span>
        </div>
      `;
    }
  }

  const finalNetTotal = Math.max(0, totals.finalTotal - promoDiscountVal);

  container.innerHTML = `
    <h2 class="summary-title">Bill Summary</h2>
    
    <div class="summary-rows">
      <div class="summary-row">
        <span>Subtotal (MSRP)</span>
        <span>$${totals.subtotal.toFixed(2)}</span>
      </div>
      
      <div class="summary-row savings">
        <span>Product Savings</span>
        <span>-$${totals.totalSavings.toFixed(2)}</span>
      </div>
      
      <div class="summary-row">
        <span>Price After Savings</span>
        <span>$${totals.currentPriceTotal.toFixed(2)}</span>
      </div>
      
      ${promoRowHTML}
      
      <div class="summary-row">
        <span>Est. Shipping & Handling</span>
        <span>${totals.shippingCharge > 0 ? `$${totals.shippingCharge.toFixed(2)}` : 'FREE'}</span>
      </div>
      
      <div class="summary-row">
        <span>Sales Tax (8%)</span>
        <span>$${totals.taxCharge.toFixed(2)}</span>
      </div>
      
      <div class="summary-row total">
        <span>Order Total</span>
        <span>$${finalNetTotal.toFixed(2)}</span>
      </div>
    </div>
    
    <!-- Promo Input Code -->
    <div class="promo-box">
      <input type="text" id="promo-input-field" class="promo-input" placeholder="Promo code (VELOCE20)" value="${appliedPromo ? appliedPromo.code : ''}">
      <button class="btn-promo-apply" id="promo-apply-btn">Apply</button>
    </div>
    
    <button class="btn btn-primary" id="checkout-btn" style="padding: 0.9rem; margin-top: 0.5rem;">
      Proceed to Checkout
    </button>
  `;

  // Bind promo code & checkout events
  const promoInput = document.getElementById('promo-input-field');
  const promoApply = document.getElementById('promo-apply-btn');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (promoApply && promoInput) {
    promoApply.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'VELOCE20') {
        appliedPromo = { code: 'VELOCE20', percent: 20 };
        showToast('Promo code VELOCE20 applied successfully! (20% Off)', 'success');
        renderBillSummary();
      } else if (code === '') {
        appliedPromo = null;
        renderBillSummary();
      } else {
        showToast('Invalid promo code. Try VELOCE20 for testing.', 'danger');
      }
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      // Simulate complete checkout
      appRoot.innerHTML = `
        <div class="empty-cart-state" style="padding: 5rem 2rem; max-width: 600px; margin: 2rem auto;">
          <div style="background: rgba(16,185,129,0.1); border: 1px solid var(--success); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
            <svg style="color: var(--success); width: 40px; height: 40px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h1 class="empty-cart-title" style="font-size: 1.8rem;">Order Placed Successfully!</h1>
          <p class="empty-cart-desc" style="max-width: 450px;">Thank you for shopping with Veloce. Your order has been registered, and a simulation confirmation email has been dispatched. Order Reference: #VL-${Math.floor(100000 + Math.random() * 900000)}</p>
          <a href="#/" class="btn btn-primary" style="width: auto; padding: 0.75rem 2rem; margin-top: 1rem;" id="checkout-done-home">Return to Homepage</a>
        </div>
      `;
      clearCart();
      appliedPromo = null;
      
      const homeBtn = document.getElementById('checkout-done-home');
      if (homeBtn) {
        homeBtn.addEventListener('click', () => {
          window.location.hash = '#/';
        });
      }
    });
  }
}

function bindCartEvents() {
  // Clear cart action
  document.getElementById('clear-cart-trigger')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to remove all items from your bag?')) {
      clearCart();
      appliedPromo = null;
      renderCartPage();
    }
  });

  // Remove buttons
  appRoot.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      removeFromCart(id);
      renderCartPage();
    });
  });

  // Quantity changes via inputs
  appRoot.querySelectorAll('.item-qty-input').forEach(input => {
    const id = parseInt(input.dataset.id);
    const item = getCart().find(p => p.id === id);
    const maxStock = item ? item.stock : 999;

    input.addEventListener('change', () => {
      let qty = parseInt(input.value);
      if (isNaN(qty) || qty < 1) {
        qty = 1;
      } else if (qty > maxStock) {
        qty = maxStock;
      }
      updateQuantity(id, qty);
      renderCartPage();
    });
  });

  // Quantity changes via plus/minus buttons
  appRoot.querySelectorAll('.item-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const item = getCart().find(p => p.id === id);
      if (item && item.quantity > 1) {
        updateQuantity(id, item.quantity - 1);
        renderCartPage();
      }
    });
  });

  appRoot.querySelectorAll('.item-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const item = getCart().find(p => p.id === id);
      if (item && item.quantity < item.stock) {
        updateQuantity(id, item.quantity + 1);
        renderCartPage();
      } else if (item) {
        showToast(`Cannot add more. Only ${item.stock} items available in stock.`, 'danger');
      }
    });
  });
}

/* ==========================================================================
   Helper Utilities
   ========================================================================== */
function renderStarsHTML(rating) {
  const fullStars = Math.round(rating);
  let html = '<div class="rating-stars">';
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      html += `
        <svg class="star" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      `;
    } else {
      html += `
        <svg class="star star-empty" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      `;
    }
  }
  html += '</div>';
  return html;
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

// Kickoff
document.addEventListener('DOMContentLoaded', init);
// Run in case DOM is already parsed (useful in bundler setups)
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}

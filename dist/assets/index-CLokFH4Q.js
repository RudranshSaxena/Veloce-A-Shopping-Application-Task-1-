(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))e(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&e(o)}).observe(document,{childList:!0,subtree:!0});function s(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function e(i){if(i.ep)return;i.ep=!0;const n=s(i);fetch(i.href,n)}})();const H="veloce-cart";function g(){try{const a=localStorage.getItem(H);return a?JSON.parse(a):[]}catch(a){return console.error("Failed to parse cart data",a),[]}}function P(a){try{localStorage.setItem(H,JSON.stringify(a)),window.dispatchEvent(new CustomEvent("cart-updated"))}catch(t){console.error("Failed to save cart data",t)}}function O(a,t=1){const s=g(),e=s.findIndex(i=>i.id===a.id);e>-1?s[e].quantity+=t:s.push({id:a.id,title:a.title,price:a.price,discountPercentage:a.discountPercentage||0,thumbnail:a.thumbnail||a.images&&a.images[0]||"",category:a.category,brand:a.brand||"Veloce",stock:a.stock,quantity:t}),P(s),x(`Added "${a.title}" to cart!`)}function D(a){let t=g();const s=t.find(e=>e.id===a);t=t.filter(e=>e.id!==a),P(t),s&&x(`Removed "${s.title}" from cart.`)}function S(a,t){const s=g(),e=s.find(i=>i.id===a);if(e){const i=Math.max(1,Math.min(e.stock,t));e.quantity=i,P(s)}}function R(){P([])}function V(){const a=g();let t=0,s=0,e=0;a.forEach(y=>{const v=y.quantity,h=y.price,d=y.discountPercentage||0,k=d>0?h/(1-d/100):h;t+=k*v,e+=h*v,s+=(k-h)*v});const n=e>0&&e<100?15:0,l=e*.08,u=e+n+l;return{itemCount:a.reduce((y,v)=>y+v.quantity,0),subtotal:t,totalSavings:s,currentPriceTotal:e,shippingCharge:n,taxCharge:l,finalTotal:u}}function x(a,t="success"){const s=document.getElementById("toast-container");if(!s)return;const e=document.createElement("div");e.className=`toast toast-${t}`,e.innerHTML=`
    <span class="toast-message">${a}</span>
    <button class="toast-close">&times;</button>
  `,s.appendChild(e);const i=setTimeout(()=>{e.classList.add("toast-fade-out"),e.addEventListener("transitionend",()=>{e.remove()})},3e3);e.querySelector(".toast-close").addEventListener("click",()=>{clearTimeout(i),e.remove()})}let f=[],E="all",$="",b="featured",m=null;const p=document.getElementById("app-root"),I=document.getElementById("global-search"),L=document.getElementById("cart-badge-count");function N(){window.addEventListener("hashchange",F),window.addEventListener("cart-updated",A),I.addEventListener("input",a=>{$=a.target.value;const t=window.location.hash;t&&t!=="#/"&&!t.startsWith("#/category/")?(window.location.hash="#/",setTimeout(()=>{const s=document.getElementById("global-search");s&&(s.value=$,s.focus())},50)):C()}),F(),A()}function A(){const a=V();L&&(L.textContent=a.itemCount,L.classList.add("badge-bump"),setTimeout(()=>L.classList.remove("badge-bump"),300))}async function F(){const a=window.location.hash||"#/";if(document.getElementById("nav-home").classList.toggle("active",a==="#/"),a==="#/"?I.value=$:I.value="",a==="#/")await j();else if(a.startsWith("#/product/")){const t=a.split("/").pop();await W(t)}else a==="#/cart"?w():window.location.hash="#/"}async function j(){var t;p.innerHTML=`
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
      ${Y(8)}
    </div>
  `;const a=document.getElementById("sort-select");if(a.value=b,a.addEventListener("change",s=>{b=s.target.value,C()}),f.length===0)try{f=(await(await fetch("https://dummyjson.com/products?limit=194")).json()).products||[]}catch(s){console.error("Failed to fetch products",s),document.getElementById("listing-grid").innerHTML=`
        <div class="empty-cart-state" style="grid-column: 1 / -1;">
          <svg class="empty-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M12 2v9M8 5v6M16 5v6"></path></svg>
          <div class="empty-cart-title">Unable to load products</div>
          <p class="empty-cart-desc">There was a network connection error. Please try again later.</p>
          <button class="btn btn-primary" id="retry-fetch-btn" style="width: auto;">Retry Connection</button>
        </div>
      `,(t=document.getElementById("retry-fetch-btn"))==null||t.addEventListener("click",j);return}z(),C()}function z(){const a=document.getElementById("categories-container");if(!a)return;const t=["all",...new Set(f.map(s=>s.category))];a.innerHTML=t.map(s=>{const e=s.charAt(0).toUpperCase()+s.slice(1).replace("-"," ");return`<span class="category-pill ${E===s?"active":""}" data-category="${s}">${e}</span>`}).join(""),a.querySelectorAll(".category-pill").forEach(s=>{s.addEventListener("click",e=>{a.querySelectorAll(".category-pill").forEach(i=>i.classList.remove("active")),s.classList.add("active"),E=s.dataset.category,C()})})}function C(){const a=document.getElementById("listing-grid"),t=document.getElementById("results-count");if(!a)return;let s=[...f];if(E!=="all"&&(s=s.filter(e=>e.category===E)),$.trim()!==""){const e=$.toLowerCase();s=s.filter(i=>i.title.toLowerCase().includes(e)||i.brand&&i.brand.toLowerCase().includes(e)||i.category.toLowerCase().includes(e))}if(b==="price-asc"?s.sort((e,i)=>e.price-i.price):b==="price-desc"?s.sort((e,i)=>i.price-e.price):b==="rating-desc"?s.sort((e,i)=>i.rating-e.rating):b==="title-asc"&&s.sort((e,i)=>e.title.localeCompare(i.title)),t&&(t.textContent=`Showing ${s.length} of ${f.length} products`),s.length===0){a.innerHTML=`
      <div class="empty-cart-state" style="grid-column: 1 / -1; padding: 5rem 2rem;">
        <svg class="empty-cart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <div class="empty-cart-title">No products found</div>
        <p class="empty-cart-desc">We couldn't find matches for "${$}". Try typing another keyword or choosing a different category.</p>
      </div>
    `;return}a.innerHTML=s.map(e=>{const i=q(e.rating),n=e.discountPercentage>0,o=n?(e.price/(1-e.discountPercentage/100)).toFixed(2):null,l=e.price.toFixed(2);return`
      <article class="product-card" data-id="${e.id}">
        ${n?`<div class="card-badge-discount">-${Math.round(e.discountPercentage)}%</div>`:""}
        <div class="card-badge-category">${e.category}</div>
        
        <a href="#/product/${e.id}" class="card-img-link">
          <img src="${e.thumbnail||e.images[0]}" alt="${e.title}" class="card-img" loading="lazy">
        </a>
        
        <div class="card-details">
          <span class="card-brand">${e.brand||"Premium"}</span>
          <a href="#/product/${e.id}"><h3 class="card-title">${e.title}</h3></a>
          
          <div class="rating-container">
            ${i}
            <span class="rating-value">${e.rating.toFixed(1)}</span>
          </div>
          
          <div class="card-price-row">
            <span class="price-current">$${l}</span>
            ${n?`<span class="price-original">$${o}</span>`:""}
          </div>
          
          <div class="card-action-row">
            <button class="btn btn-secondary quick-view-btn" data-id="${e.id}">Quick View</button>
            <button class="btn btn-primary add-to-cart-btn" data-id="${e.id}">Add to Cart</button>
          </div>
        </div>
      </article>
    `}).join(""),a.querySelectorAll(".add-to-cart-btn").forEach(e=>{e.addEventListener("click",i=>{i.stopPropagation();const n=parseInt(e.dataset.id),o=f.find(l=>l.id===n);o&&O(o,1)})}),a.querySelectorAll(".quick-view-btn").forEach(e=>{e.addEventListener("click",i=>{i.stopPropagation();const n=e.dataset.id;window.location.hash=`#/product/${n}`})})}function Y(a){let t="";for(let s=0;s<a;s++)t+=`
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
    `;return t}async function W(a){p.innerHTML=`
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
  `;let t=null;try{const r=await fetch(`https://dummyjson.com/products/${a}`);if(!r.ok)throw new Error("Failed to load product");t=await r.json()}catch(r){if(console.error(r),t=f.find(c=>c.id===parseInt(a)),!t){p.innerHTML=`
        <div class="back-bar">
          <a href="#/" class="back-link"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back to Products</a>
        </div>
        <div class="empty-cart-state">
          <svg class="empty-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <div class="empty-cart-title">Product not found</div>
          <p class="empty-cart-desc">The product you are looking for might have been removed or is temporarily unavailable.</p>
        </div>
      `;return}}const s=t.discountPercentage>0,e=s?(t.price/(1-t.discountPercentage/100)).toFixed(2):null,i=t.price.toFixed(2),n=s?(parseFloat(e)-t.price).toFixed(2):null;let o="instock",l="In Stock";t.stock<=0?(o="outofstock",l="Out of Stock"):t.stock<10&&(o="lowstock",l=`Only ${t.stock} Left!`);const u=t.images||[],y=u[0]||t.thumbnail;p.innerHTML=`
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
          <img id="main-product-image" src="${y}" alt="${t.title}">
        </div>
        
        ${u.length>1?`
          <div class="gallery-thumbnails">
            ${u.map((r,c)=>`
              <button class="thumbnail-btn ${c===0?"active":""}" data-src="${r}">
                <img src="${r}" alt="Thumbnail ${c+1}">
              </button>
            `).join("")}
          </div>
        `:""}
      </div>
      
      <!-- Info Details Column -->
      <div class="info-panel">
        <div class="info-header">
          <div class="info-meta-row">
            <span class="card-badge-category" style="position:static;">${t.category}</span>
            <span class="badge-status ${o}">${l}</span>
          </div>
          <h1 class="info-title">${t.title}</h1>
          <span class="card-brand" style="font-size: 0.9rem;">Brand: ${t.brand||"Veloce"}</span>
        </div>
        
        <div class="rating-container" style="font-size: 1rem;">
          ${q(t.rating)}
          <span class="rating-value">${t.rating.toFixed(2)} / 5.0</span>
          <span style="color: var(--text-muted); margin-left: 0.5rem;">(${t.reviews?t.reviews.length:0} verified customer reviews)</span>
        </div>
        
        <!-- Price Block -->
        <div class="info-price-block">
          <div class="info-price-row">
            <span class="info-price-current">$${i}</span>
            ${s?`<span class="info-price-original">$${e}</span>`:""}
          </div>
          ${s?`
            <span class="info-savings">You Save: $${n} (${Math.round(t.discountPercentage)}% Off)</span>
          `:""}
        </div>
        
        <p class="info-description">${t.description}</p>
        
        <!-- Actions & Purchase Controller -->
        <div class="purchase-controls">
          <div class="quantity-selector">
            <button class="quantity-btn" id="qty-minus">-</button>
            <input type="number" class="quantity-input" id="qty-input" value="1" min="1" max="${t.stock}">
            <button class="quantity-btn" id="qty-plus">+</button>
          </div>
          
          <button class="btn btn-primary" id="add-to-cart-detail" ${t.stock<=0?"disabled":""} style="flex: 1; padding: 0.9rem 1.5rem;">
            <svg class="cart-icon" style="width:1.2rem; height:1.2rem;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            ${t.stock<=0?"Out of Stock":"Add to Shopping Cart"}
          </button>
        </div>
        
        <!-- Specifications -->
        <div class="specs-panel">
          <h3 class="specs-title">Product Details</h3>
          <div class="specs-grid">
            <div class="spec-item">
              <span class="spec-label">SKU</span>
              <span class="spec-val">${t.sku||"N/A"}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Warranty</span>
              <span class="spec-val">${t.warrantyInformation||"1 Year Standard"}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Weight</span>
              <span class="spec-val">${t.weight?t.weight+" kg":"N/A"}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Shipping</span>
              <span class="spec-val">${t.shippingInformation||"Standard Shipping"}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Return Policy</span>
              <span class="spec-val">${t.returnPolicy||"30 days returns"}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Dimensions</span>
              <span class="spec-val">
                ${t.dimensions?`${t.dimensions.width}W x ${t.dimensions.height}H x ${t.dimensions.depth}D cm`:"N/A"}
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
        ${t.reviews&&t.reviews.length>0?t.reviews.map(r=>`
          <div class="review-card">
            <div class="review-card-header">
              <div class="reviewer-info">
                <span class="reviewer-name">${r.reviewerName}</span>
                <span class="review-date">${Q(r.date)}</span>
              </div>
              <div class="rating-container">
                ${q(r.rating)}
              </div>
            </div>
            <p class="review-comment">"${r.comment}"</p>
          </div>
        `).join(""):`
          <div class="empty-cart-state" style="grid-column: 1 / -1; padding: 2rem; border-style: dashed;">
            <p class="empty-cart-desc">No reviews have been submitted for this item yet.</p>
          </div>
        `}
      </div>
    </div>
  `;const v=document.getElementById("main-product-image"),h=p.querySelectorAll(".thumbnail-btn");h.forEach(r=>{r.addEventListener("click",()=>{h.forEach(c=>c.classList.remove("active")),r.classList.add("active"),v&&(v.src=r.dataset.src)})});const d=document.getElementById("qty-input"),k=document.getElementById("qty-minus"),T=document.getElementById("qty-plus");if(d&&k&&T){const r=t.stock;k.addEventListener("click",()=>{let c=parseInt(d.value)||1;c>1&&(d.value=c-1)}),T.addEventListener("click",()=>{let c=parseInt(d.value)||1;c<r&&(d.value=c+1)}),d.addEventListener("change",()=>{let c=parseInt(d.value);isNaN(c)||c<1?d.value=1:c>r&&(d.value=r)})}const M=document.getElementById("add-to-cart-detail");M&&M.addEventListener("click",()=>{const r=parseInt(d.value)||1;O(t,r)})}function w(){const a=g();if(a.length===0){p.innerHTML=`
      <div class="cart-title-row">
        <h1 class="cart-title">Your Cart</h1>
      </div>
      
      <div class="empty-cart-state" style="margin-top: 1rem;">
        <svg class="empty-cart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <div class="empty-cart-title">Your Shopping Cart is Empty</div>
        <p class="empty-cart-desc">Looks like you haven't added anything to your cart yet. Head back to the store to explore our catalog.</p>
        <a href="#/" class="btn btn-primary" style="width: auto; padding: 0.75rem 2rem;">Start Shopping</a>
      </div>
    `;return}p.innerHTML=`
    <div class="cart-title-row">
      <h1 class="cart-title">Your Shopping Bag</h1>
      <span class="clear-cart-btn" id="clear-cart-trigger">Clear Cart</span>
    </div>
    
    <div class="cart-layout">
      <!-- Cart Items List -->
      <div class="cart-items-container">
        ${a.map(t=>{const s=t.discountPercentage||0,e=s>0?t.price/(1-s/100):t.price,i=(t.price*t.quantity).toFixed(2);return`
            <div class="cart-item" data-id="${t.id}">
              <div class="cart-item-img-wrapper">
                <img src="${t.thumbnail}" alt="${t.title}">
              </div>
              
              <div class="cart-item-details">
                <span class="cart-item-brand">${t.brand}</span>
                <a href="#/product/${t.id}"><h3 class="cart-item-title">${t.title}</h3></a>
                
                <div class="cart-item-price-block">
                  <span class="cart-item-price-current">$${t.price.toFixed(2)}</span>
                  ${s>0?`<span class="cart-item-price-original">$${e.toFixed(2)}</span>`:""}
                </div>
              </div>
              
              <div class="cart-item-controls">
                <div class="quantity-selector">
                  <button class="quantity-btn item-qty-minus" data-id="${t.id}">-</button>
                  <input type="number" class="quantity-input item-qty-input" data-id="${t.id}" value="${t.quantity}" min="1" max="${t.stock}">
                  <button class="quantity-btn item-qty-plus" data-id="${t.id}">+</button>
                </div>
                
                <div style="font-weight: 700; font-size: 1.1rem; min-width: 70px; text-align: right;">
                  $${i}
                </div>
                
                <button class="cart-item-remove-btn" data-id="${t.id}" aria-label="Remove item">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            </div>
          `}).join("")}
      </div>
      
      <!-- Bill Summary Area -->
      <div class="summary-card" id="bill-summary-container">
        <!-- Rendered dynamically below to support instant updates -->
      </div>
    </div>
  `,G(),B()}function B(){const a=document.getElementById("bill-summary-container");if(!a)return;const t=V();let s=0,e="";m&&m.code==="VELOCE20"&&(s=t.currentPriceTotal*.2,e=`
        <div class="summary-row savings">
          <span>Promo Code (VELOCE20)</span>
          <span>-$${s.toFixed(2)}</span>
        </div>
      `);const i=Math.max(0,t.finalTotal-s);a.innerHTML=`
    <h2 class="summary-title">Bill Summary</h2>
    
    <div class="summary-rows">
      <div class="summary-row">
        <span>Subtotal (MSRP)</span>
        <span>$${t.subtotal.toFixed(2)}</span>
      </div>
      
      <div class="summary-row savings">
        <span>Product Savings</span>
        <span>-$${t.totalSavings.toFixed(2)}</span>
      </div>
      
      <div class="summary-row">
        <span>Price After Savings</span>
        <span>$${t.currentPriceTotal.toFixed(2)}</span>
      </div>
      
      ${e}
      
      <div class="summary-row">
        <span>Est. Shipping & Handling</span>
        <span>${t.shippingCharge>0?`$${t.shippingCharge.toFixed(2)}`:"FREE"}</span>
      </div>
      
      <div class="summary-row">
        <span>Sales Tax (8%)</span>
        <span>$${t.taxCharge.toFixed(2)}</span>
      </div>
      
      <div class="summary-row total">
        <span>Order Total</span>
        <span>$${i.toFixed(2)}</span>
      </div>
    </div>
    
    <!-- Promo Input Code -->
    <div class="promo-box">
      <input type="text" id="promo-input-field" class="promo-input" placeholder="Promo code (VELOCE20)" value="${m?m.code:""}">
      <button class="btn-promo-apply" id="promo-apply-btn">Apply</button>
    </div>
    
    <button class="btn btn-primary" id="checkout-btn" style="padding: 0.9rem; margin-top: 0.5rem;">
      Proceed to Checkout
    </button>
  `;const n=document.getElementById("promo-input-field"),o=document.getElementById("promo-apply-btn"),l=document.getElementById("checkout-btn");o&&n&&o.addEventListener("click",()=>{const u=n.value.trim().toUpperCase();u==="VELOCE20"?(m={code:"VELOCE20",percent:20},x("Promo code VELOCE20 applied successfully! (20% Off)","success"),B()):u===""?(m=null,B()):x("Invalid promo code. Try VELOCE20 for testing.","danger")}),l&&l.addEventListener("click",()=>{p.innerHTML=`
        <div class="empty-cart-state" style="padding: 5rem 2rem; max-width: 600px; margin: 2rem auto;">
          <div style="background: rgba(16,185,129,0.1); border: 1px solid var(--success); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
            <svg style="color: var(--success); width: 40px; height: 40px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h1 class="empty-cart-title" style="font-size: 1.8rem;">Order Placed Successfully!</h1>
          <p class="empty-cart-desc" style="max-width: 450px;">Thank you for shopping with Veloce. Your order has been registered, and a simulation confirmation email has been dispatched. Order Reference: #VL-${Math.floor(1e5+Math.random()*9e5)}</p>
          <a href="#/" class="btn btn-primary" style="width: auto; padding: 0.75rem 2rem; margin-top: 1rem;" id="checkout-done-home">Return to Homepage</a>
        </div>
      `,R(),m=null;const u=document.getElementById("checkout-done-home");u&&u.addEventListener("click",()=>{window.location.hash="#/"})})}function G(){var a;(a=document.getElementById("clear-cart-trigger"))==null||a.addEventListener("click",()=>{confirm("Are you sure you want to remove all items from your bag?")&&(R(),m=null,w())}),p.querySelectorAll(".cart-item-remove-btn").forEach(t=>{t.addEventListener("click",()=>{const s=parseInt(t.dataset.id);D(s),w()})}),p.querySelectorAll(".item-qty-input").forEach(t=>{const s=parseInt(t.dataset.id),e=g().find(n=>n.id===s),i=e?e.stock:999;t.addEventListener("change",()=>{let n=parseInt(t.value);isNaN(n)||n<1?n=1:n>i&&(n=i),S(s,n),w()})}),p.querySelectorAll(".item-qty-minus").forEach(t=>{t.addEventListener("click",()=>{const s=parseInt(t.dataset.id),e=g().find(i=>i.id===s);e&&e.quantity>1&&(S(s,e.quantity-1),w())})}),p.querySelectorAll(".item-qty-plus").forEach(t=>{t.addEventListener("click",()=>{const s=parseInt(t.dataset.id),e=g().find(i=>i.id===s);e&&e.quantity<e.stock?(S(s,e.quantity+1),w()):e&&x(`Cannot add more. Only ${e.stock} items available in stock.`,"danger")})})}function q(a){const t=Math.round(a);let s='<div class="rating-stars">';for(let e=1;e<=5;e++)e<=t?s+=`
        <svg class="star" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      `:s+=`
        <svg class="star star-empty" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      `;return s+="</div>",s}function Q(a){try{return new Date(a).toLocaleDateString(void 0,{year:"numeric",month:"long",day:"numeric"})}catch{return a}}document.addEventListener("DOMContentLoaded",N);(document.readyState==="interactive"||document.readyState==="complete")&&N();

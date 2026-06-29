// Cart management state and logic

const CART_STORAGE_KEY = 'veloce-cart';

export function getCart() {
  try {
    const data = localStorage.getItem(CART_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse cart data', e);
    return [];
  }
}

export function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    // Dispatch a custom event to notify listeners (e.g., header badge count)
    window.dispatchEvent(new CustomEvent('cart-updated'));
  } catch (e) {
    console.error('Failed to save cart data', e);
  }
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existingItemIndex = cart.findIndex(item => item.id === product.id);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    // Keep only necessary fields to avoid bloat, but retain what's needed for summary & rendering
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      discountPercentage: product.discountPercentage || 0,
      thumbnail: product.thumbnail || (product.images && product.images[0]) || '',
      category: product.category,
      brand: product.brand || 'Veloce',
      stock: product.stock,
      quantity: quantity
    });
  }

  saveCart(cart);
  showToast(`Added "${product.title}" to cart!`);
}

export function removeFromCart(productId) {
  let cart = getCart();
  const product = cart.find(item => item.id === productId);
  cart = cart.filter(item => item.id !== productId);
  saveCart(cart);
  if (product) {
    showToast(`Removed "${product.title}" from cart.`);
  }
}

export function updateQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find(item => item.id === productId);
  
  if (item) {
    // Restrain quantity within stock and positive bounds
    const newQty = Math.max(1, Math.min(item.stock, quantity));
    item.quantity = newQty;
    saveCart(cart);
  }
}

export function clearCart() {
  saveCart([]);
}

export function getCartTotals() {
  const cart = getCart();
  
  let subtotal = 0; // Sum of original prices (before discount)
  let totalSavings = 0;
  let currentPriceTotal = 0; // Sum of actual purchase prices

  cart.forEach(item => {
    const qty = item.quantity;
    const currentPrice = item.price;
    const discount = item.discountPercentage || 0;
    
    // We treat price as the discounted selling price, and calculate original price:
    const originalPrice = discount > 0 ? currentPrice / (1 - discount / 100) : currentPrice;
    
    subtotal += originalPrice * qty;
    currentPriceTotal += currentPrice * qty;
    totalSavings += (originalPrice - currentPrice) * qty;
  });

  // Flat rates
  const shippingThreshold = 100;
  const shippingCharge = currentPriceTotal > 0 && currentPriceTotal < shippingThreshold ? 15.00 : 0;
  const taxRate = 0.08; // 8% tax
  const taxCharge = currentPriceTotal * taxRate;
  const finalTotal = currentPriceTotal + shippingCharge + taxCharge;

  return {
    itemCount: cart.reduce((acc, item) => acc + item.quantity, 0),
    subtotal,
    totalSavings,
    currentPriceTotal,
    shippingCharge,
    taxCharge,
    finalTotal
  };
}

// Toast notification helper
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close">&times;</button>
  `;

  container.appendChild(toast);

  // Auto remove after 3s
  const timer = setTimeout(() => {
    toast.classList.add('toast-fade-out');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 3000);

  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(timer);
    toast.remove();
  });
}

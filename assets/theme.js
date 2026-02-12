// SARIOZ theme interactions: mobile nav, search overlay + predictive search,
// cart drawer fetching, and quick view modal.
document.documentElement.classList.remove('no-js');

const toggleHidden = (el, open) => {
  if (!el) return;
  el.hidden = !open;
  el.setAttribute('aria-hidden', String(!open));
};

// Mobile navigation
const mobileNav = document.getElementById('MobileNav');
const navToggle = document.querySelector('[data-mobile-nav-toggle]');
navToggle?.addEventListener('click', () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!expanded));
  toggleHidden(mobileNav, expanded);
});

// Search overlay + quick suggestions
const searchOverlay = document.getElementById('SearchOverlay');
const searchInput = document.getElementById('SearchOverlayInput');
const predictiveResults = document.getElementById('predictive-search-results');
document.querySelector('[data-search-open]')?.addEventListener('click', () => {
  toggleHidden(searchOverlay, true);
  searchInput?.focus();
});
document.querySelectorAll('[data-search-close]').forEach((btn) => {
  btn.addEventListener('click', () => toggleHidden(searchOverlay, false));
});

let searchAbort;
searchInput?.addEventListener('input', async (event) => {
  const query = event.target.value.trim();
  if (query.length < 2) {
    predictiveResults.innerHTML = '';
    return;
  }
  searchAbort?.abort();
  searchAbort = new AbortController();
  const endpoint = `/search/suggest?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=6&section_id=predictive-search`;
  try {
    const res = await fetch(endpoint, { signal: searchAbort.signal });
    const html = await res.text();
    predictiveResults.innerHTML = html;
    searchInput.setAttribute('aria-expanded', 'true');
  } catch (error) {
    // No-op for aborted requests.
  }
});

// Cart drawer
const cartDrawer = document.getElementById('CartDrawer');
const cartItems = document.getElementById('CartDrawerItems');
const openCart = async () => {
  toggleHidden(cartDrawer, true);
  const cart = await fetch('/cart.js').then((r) => r.json());
  if (!cart.items.length) {
    cartItems.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }
  cartItems.innerHTML = cart.items
    .map((item) => `<div class="cart-line"><strong>${item.product_title}</strong><div>${item.quantity} × ${(item.price / 100).toFixed(2)}</div></div>`)
    .join('');
};

document.querySelector('[data-cart-open]')?.addEventListener('click', openCart);
document.querySelectorAll('[data-cart-close]').forEach((btn) => {
  btn.addEventListener('click', () => toggleHidden(cartDrawer, false));
});

// Open cart drawer after add-to-cart forms submit.
document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (!form.matches('form[action="/cart/add"]')) return;
  event.preventDefault();
  const formData = new FormData(form);
  await fetch('/cart/add.js', { method: 'POST', body: formData });
  await openCart();
});

// Quick view modal
const quickView = document.getElementById('QuickViewModal');
const quickViewContent = document.getElementById('QuickViewContent');
document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-quick-view-handle]');
  if (!button) return;

  const handle = button.getAttribute('data-quick-view-handle');
  const product = await fetch(`/products/${handle}.js`).then((r) => r.json());

  quickViewContent.innerHTML = `
    <button class="icon-button" data-quick-view-close aria-label="Close quick view">✕</button>
    <h2 id="QuickViewTitle">${product.title}</h2>
    <p class="price">$${(product.price / 100).toFixed(2)}</p>
    <p>${product.description.replace(/<[^>]*>?/gm, '').slice(0, 180)}...</p>
    <a class="button" href="/products/${product.handle}">View details</a>
  `;
  toggleHidden(quickView, true);
});

document.addEventListener('click', (event) => {
  if (event.target.matches('[data-quick-view-close], .quick-view__backdrop')) {
    toggleHidden(quickView, false);
  }
});

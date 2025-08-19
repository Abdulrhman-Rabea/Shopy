import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDcP9iMTNphp4V2DNu_jNeoPdn-6wycEac",
    authDomain: "e-commerce-iti-project.firebaseapp.com",
    projectId: "e-commerce-iti-project",
    storageBucket: "e-commerce-iti-project.appspot.com",
    messagingSenderId: "833183868773",
    appId: "1:833183868773:web:bfe821c5df431cd15aa38c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let currentUser = null;
let cartItems = [];

// Check authentication
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        loadCartItems();
    } else {
        window.location.href = 'Login.html';
    }
});

// Load cart items from localStorage
function loadCartItems() {
    if (!currentUser) return;

    const cartKey = `cart_${currentUser.uid}`;
    cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
    renderCartItems();
    updateTotals();
}

// Render cart items
function renderCartItems() {
    const container = document.querySelector('.products_container');
    if (!container) return;

    if (cartItems.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <img src="../assets/images/emptyCart.png" alt="Empty Cart">
                <h3>Your cart is empty!</h3>
                <a href="../index.html" class="return-btn">Continue Shopping</a>
            </div>
        `;
        return;
    }

    const cartHTML = cartItems.map((item, index) => `
        <div class="box" data-index="${index}">
            <div class="product-info">
                <img src="${item.image}" alt="${item.title}" class="product-img">
                <div class="product-details">
                    <h4 class="product-title">${item.title}</h4>
                    <p class="price">$${item.price.toFixed(2)}</p>
                </div>
            </div>
            <div class="quantity-controls">
                <button onclick="updateQuantity(${index}, -1)" class="qty-btn">-</button>
                <input type="number" value="${item.quantity}" min="1" class="quantity-input" 
                       onchange="updateQuantityInput(${index}, this.value)">
                <button onclick="updateQuantity(${index}, 1)" class="qty-btn">+</button>
            </div>
            <div class="subtotal">$${(item.price * item.quantity).toFixed(2)}</div>
            <button onclick="removeItem(${index})" class="remove-btn">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    container.innerHTML = cartHTML;
}

// Update quantity
function updateQuantity(index, change) {
    if (index < 0 || index >= cartItems.length) return;

    const newQuantity = cartItems[index].quantity + change;
    if (newQuantity < 1) return;

    cartItems[index].quantity = newQuantity;
    saveCart();
    renderCartItems();
    updateTotals();
}

// Update quantity from input
function updateQuantityInput(index, value) {
    if (index < 0 || index >= cartItems.length) return;

    const newQuantity = parseInt(value);
    if (isNaN(newQuantity) || newQuantity < 1) return;

    cartItems[index].quantity = newQuantity;
    saveCart();
    renderCartItems();
    updateTotals();
}

// Remove item
function removeItem(index) {
    if (index < 0 || index >= cartItems.length) return;

    cartItems.splice(index, 1);
    saveCart();
    renderCartItems();
    updateTotals();
}

// Save cart to localStorage
function saveCart() {
    if (!currentUser) return;

    const cartKey = `cart_${currentUser.uid}`;
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
}

// Update totals
function updateTotals() {
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    const shippingEl = document.getElementById('shipping');

    if (!subtotalEl || !totalEl || !shippingEl) return;

    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + shipping;

    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    shippingEl.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
}

// Apply coupon
function applyCoupon() {
    const couponInput = document.getElementById('coupon_input');
    const coupon = couponInput.value.trim().toUpperCase();

    if (coupon === 'SAVE10') {
        showMessage('Coupon applied! 10% discount', 'success');
        // Apply 10% discount logic here
    } else {
        showMessage('Invalid coupon code', 'error');
    }
}

// Checkout
function checkout() {
    if (cartItems.length === 0) {
        showMessage('Your cart is empty!', 'error');
        return;
    }

    // Redirect to checkout/orders page
    window.location.href = 'orders.html';
}

// Show message
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// Return to shop
function returnToShop() {
    window.location.href = '../index.html';
}

// Expose functions globally
window.updateQuantity = updateQuantity;
window.updateQuantityInput = updateQuantityInput;
window.removeItem = removeItem;
window.applyCoupon = applyCoupon;
window.checkout = checkout;
window.returnToShop = returnToShop;
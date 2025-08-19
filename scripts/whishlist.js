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
let wishlistItems = [];

// Check authentication
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        loadWishlistItems();
    } else {
        window.location.href = 'Login.html';
    }
});

// Load wishlist items from localStorage
function loadWishlistItems() {
    if (!currentUser) return;

    const wishlistKey = `wishlist_${currentUser.uid}`;
    wishlistItems = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
    renderWishlistItems();
}

// Render wishlist items
function renderWishlistItems() {
    const container = document.querySelector('.wishlist_container');
    if (!container) return;

    if (wishlistItems.length === 0) {
        container.innerHTML = `
            <div class="empty-wishlist">
                <i class="fas fa-heart-broken"></i>
                <h3>Your wishlist is empty!</h3>
                <p>Start adding products you love</p>
                <a href="../index.html" class="return-btn">Continue Shopping</a>
            </div>
        `;
        return;
    }

    const wishlistHTML = wishlistItems.map((item, index) => `
        <div class="wishlist-item" data-index="${index}">
            <div class="product-info">
                <img src="${item.image}" alt="${item.title}" class="product-img">
                <div class="product-details">
                    <h4 class="product-title">${item.title}</h4>
                    <p class="price">$${item.price.toFixed(2)}</p>
                    <p class="added-date">Added: ${new Date(item.addedAt).toLocaleDateString()}</p>
                </div>
            </div>
            <div class="item-actions">
                <button onclick="addToCart(${index})" class="add-to-cart-btn">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
                <button onclick="removeFromWishlist(${index})" class="remove-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = wishlistHTML;
}

// Add item to cart
function addToCart(index) {
    if (index < 0 || index >= wishlistItems.length) return;

    const item = wishlistItems[index];
    const cartKey = `cart_${currentUser.uid}`;
    let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');

    const existingItem = cart.find(cartItem => cartItem.id === item.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: item.id,
            title: item.title,
            price: item.price,
            image: item.image,
            quantity: 1
        });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    showMessage('Added to cart!', 'success');
}

// Remove item from wishlist
function removeFromWishlist(index) {
    if (index < 0 || index >= wishlistItems.length) return;

    wishlistItems.splice(index, 1);
    saveWishlist();
    renderWishlistItems();
    showMessage('Removed from wishlist', 'success');
}

// Save wishlist to localStorage
function saveWishlist() {
    if (!currentUser) return;

    const wishlistKey = `wishlist_${currentUser.uid}`;
    localStorage.setItem(wishlistKey, JSON.stringify(wishlistItems));
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
window.addToCart = addToCart;
window.removeFromWishlist = removeFromWishlist;
window.returnToShop = returnToShop; 
import { initializeApp as initFirebaseApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfigMain = {
    apiKey: "AIzaSyDcP9iMTNphp4V2DNu_jNeoPdn-6wycEac",
    authDomain: "e-commerce-iti-project.firebaseapp.com",
    projectId: "e-commerce-iti-project",
    storageBucket: "e-commerce-iti-project.appspot.com",
    messagingSenderId: "833183868773",
    appId: "1:833183868773:web:bfe821c5df431cd15aa38c",
};

const firebaseApp = initFirebaseApp(firebaseConfigMain);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// Global variables
let allProducts = [];
let currentUser = null;

// Check authentication state
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateAuthUI();
    if (user) {
        // Check if user data exists in localStorage
        const storedUser = localStorage.getItem('loggedUser');
        if (!storedUser) {
            // Create user data if not exists
            const userInfo = {
                uid: user.uid,
                email: user.email,
                role: 'user'
            };
            localStorage.setItem('loggedUser', JSON.stringify(userInfo));
        }
        loadUserData();
    } else {
        // Clear user data when logged out
        localStorage.removeItem('loggedUser');
        // Clear cart and wishlist counts
        hideCounts();
    }
});

// Update UI based on authentication
function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const userInfo = document.querySelector('.user-info');

    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'flex';
            const userEmail = userInfo.querySelector('.user-email');
            if (userEmail) {
                userEmail.textContent = currentUser.email;
            }
        }
        // Update counts when user is logged in
        updateWishlistCount();
        updateCartCount();
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
        // Hide counts when user is not logged in
        hideCounts();
    }
}

// Update wishlist count
function updateWishlistCount() {
    if (!currentUser) return;

    const wishlistKey = `wishlist_${currentUser.uid}`;
    const wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
    const count = wishlist.length;

    const wishlistCount = document.querySelector('.wishlist-count');
    if (wishlistCount) {
        wishlistCount.textContent = count;
        wishlistCount.style.display = count > 0 ? 'block' : 'none';
    }
}

// Update cart count
function updateCartCount() {
    if (!currentUser) return;

    const cartKey = `cart_${currentUser.uid}`;
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

// Hide all counts
function hideCounts() {
    const wishlistCount = document.querySelector('.wishlist-count');
    const cartCount = document.querySelector('.cart-count');

    if (wishlistCount) wishlistCount.style.display = 'none';
    if (cartCount) cartCount.style.display = 'none';
}

// Load products from Firestore
async function loadProductsData() {
    try {
        const productsCollection = collection(db, 'products');
        const querySnapshot = await getDocs(productsCollection);

        allProducts = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));

        console.log(`Loaded ${allProducts.length} products`);
        return allProducts;
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
    }
}

// Create star rating HTML
function createStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star star-icon"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt star-icon"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star star-icon"></i>';
    }
    return starsHTML;
}

// Create product card HTML
function createProductCard(product) {
    const starsHTML = createStarRating(product.rating?.rate || 0);
    const isWishlisted = isInWishlist(product.id);

    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.title}" class="product-image">
                <button class="product-wishlist-button ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${product.id}')">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="product-cart-button" onclick="addToCart('${product.id}')">
                    <i class="fas fa-shopping-cart"></i>
                </button>
            </div>
            <h3 class="product-title">${product.title}</h3>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <div class="product-rating">
                <div class="product-stars">${starsHTML}</div>
                <span class="product-score">${(product.rating?.rate || 0).toFixed(1)}/5</span>
            </div>
            <button class="buy-button" onclick="buyNow('${product.id}')">Buy Now</button>
        </div>
    `;
}

// Render products by category
function renderProductsByCategory(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const categoryProducts = allProducts.filter(product =>
        product.category.toLowerCase() === category.toLowerCase()
    );

    if (categoryProducts.length === 0) {
        container.innerHTML = '<p>No products found for this category.</p>';
        return;
    }

    const productsHTML = categoryProducts.map(product => createProductCard(product)).join('');
    container.innerHTML = productsHTML;
}

// Render all products
function renderAllProducts() {
    renderProductsByCategory("men's clothing", "mens-clothing-grid");
    renderProductsByCategory("electronics", "electronics-grid");
    renderProductsByCategory("women's clothing", "womens-clothing-grid");
    renderProductsByCategory("jewelery", "jewelry-grid");
}

// Check if product is in wishlist
function isInWishlist(productId) {
    if (!currentUser) return false;
    const wishlist = JSON.parse(localStorage.getItem(`wishlist_${currentUser.uid}`) || '[]');
    return wishlist.some(item => item.id === productId);
}

// Toggle wishlist
async function toggleWishlist(productId) {
    if (!currentUser) {
        showLoginPopup();
        return;
    }

    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const wishlistKey = `wishlist_${currentUser.uid}`;
    let wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');

    const existingIndex = wishlist.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
        // Remove from wishlist
        wishlist.splice(existingIndex, 1);
        showMessage('Removed from wishlist', 'success');
    } else {
        // Add to wishlist
        wishlist.push({
            id: productId,
            title: product.title,
            price: product.price,
            image: product.image,
            addedAt: new Date().toISOString()
        });
        showMessage('Added to wishlist', 'success');
    }

    localStorage.setItem(wishlistKey, JSON.stringify(wishlist));

    // Update UI
    const wishlistBtn = document.querySelector(`[onclick="toggleWishlist('${productId}')"]`);
    if (wishlistBtn) {
        wishlistBtn.classList.toggle('active');
    }
    updateWishlistCount(); // Update count after wishlist change
}

// Add to cart
async function addToCart(productId) {
    if (!currentUser) {
        showLoginPopup();
        return;
    }

    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const cartKey = `cart_${currentUser.uid}`;
    let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    showMessage('Added to cart', 'success');
    updateCartCount();
}

// Buy now
async function buyNow(productId) {
    if (!currentUser) {
        showLoginPopup();
        return;
    }

    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    try {
        // Get user profile information
        let customerInfo = {
            name: currentUser.displayName || 'Customer',
            email: currentUser.email,
            uid: currentUser.uid
        };

        // Try to get additional user info from localStorage
        const storedUser = localStorage.getItem('loggedUser');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            if (userData.name) {
                customerInfo.name = userData.name;
            }
        }

        const order = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            customerInfo: customerInfo,
            items: [{
                productId: productId,
                title: product.title,
                price: product.price,
                image: product.image,
                quantity: 1
            }],
            total: product.price,
            status: 'pending',
            createdAt: new Date().toISOString(),
            orderNumber: generateOrderNumber()
        };

        const ordersCollection = collection(db, 'orders');
        await addDoc(ordersCollection, order);

        showMessage('Order placed successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'pages/cart.html';
        }, 1500);

    } catch (error) {
        console.error('Error placing order:', error);
        showMessage('Failed to place order. Please try again.', 'error');
    }
}

// Generate order number
function generateOrderNumber() {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const r = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${y}${m}${d}-${r}`;
}

// Show login popup
function showLoginPopup() {
    const popup = document.createElement('div');
    popup.className = 'login-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Login Required</h3>
            <p>You must be logged in to perform this action.</p>
            <div class="popup-buttons">
                <button onclick="window.location.href='pages/Login.html'" class="btn-primary">Login</button>
                <button onclick="this.closest('.login-popup').remove()" class="btn-secondary">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (popup.parentNode) {
            popup.remove();
        }
    }, 5000);
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

// Load user data
function loadUserData() {
    updateCartCount();
    updateWishlistCount(); // Ensure counts are updated on load
}

// Setup search functionality
function setupSearchFunctionality() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase().trim();

        if (searchTerm === '') {
            renderAllProducts();
            return;
        }

        const filteredProducts = allProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );

        // Clear all grids and show filtered products
        const allGrids = document.querySelectorAll('.products-grid');
        allGrids.forEach(grid => grid.innerHTML = '');

        const firstGrid = document.querySelector('.products-grid');
        if (firstGrid && filteredProducts.length > 0) {
            const productsHTML = filteredProducts.map(product => createProductCard(product)).join('');
            firstGrid.innerHTML = productsHTML;
        } else if (firstGrid) {
            firstGrid.innerHTML = '<p>No products found matching your search.</p>';
        }
    });
}

// Setup category filtering
function setupCategoryFiltering() {
    const categoryItems = document.querySelectorAll('.category-item');

    categoryItems.forEach(item => {
        item.addEventListener('click', function () {
            const category = this.getAttribute('data-category');

            // Remove active class from all items
            categoryItems.forEach(cat => cat.classList.remove('active'));
            this.classList.add('active');

            // Filter products by category
            filterProductsByCategory(category);
        });
    });
}

// Filter products by category
function filterProductsByCategory(category) {
    const categoryMap = {
        'women-fashion': "women's clothing",
        'men-fashion': "men's clothing",
        'electronics': 'electronics',
        'home-lifestyle': 'home & lifestyle',
        'medicine': 'medicine',
        'sports-outdoor': 'sports & outdoor'
    };

    const mappedCategory = categoryMap[category];
    if (!mappedCategory) return;

    const filteredProducts = allProducts.filter(product =>
        product.category.toLowerCase() === mappedCategory.toLowerCase()
    );

    // Clear all grids and show filtered products
    const allGrids = document.querySelectorAll('.products-grid');
    allGrids.forEach(grid => grid.innerHTML = '');

    const firstGrid = document.querySelector('.products-grid');
    if (firstGrid && filteredProducts.length > 0) {
        const productsHTML = filteredProducts.map(product => createProductCard(product)).join('');
        firstGrid.innerHTML = productsHTML;
    } else if (firstGrid) {
        firstGrid.innerHTML = '<p>No products found in this category.</p>';
    }
}

// Setup shop now button
function setupShopNowButton() {
    const shopNowButton = document.querySelector('.shop-now-button');
    if (shopNowButton) {
        shopNowButton.addEventListener('click', function () {
            const productsSection = document.querySelector('.products-section');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

// Initialize app
async function initializeApp() {
    try {
        await loadProductsData();
        renderAllProducts();
        setupSearchFunctionality();
        setupCategoryFiltering();
        setupShopNowButton();
        console.log('Application initialized successfully!');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

// Expose functions globally
window.toggleWishlist = toggleWishlist;
window.addToCart = addToCart;
window.buyNow = buyNow;
window.logout = logout;



// Logout function
async function logout() {
    try {
        await signOut(auth);
        // Clear all user data
        localStorage.removeItem('loggedUser');
        // Clear cart and wishlist data
        if (currentUser) {
            localStorage.removeItem(`cart_${currentUser.uid}`);
            localStorage.removeItem(`wishlist_${currentUser.uid}`);
        }
        // Redirect to home page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showMessage('Error signing out. Please try again.', 'error');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 
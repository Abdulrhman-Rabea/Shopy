import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const db = getFirestore(app);

let currentUser = null;
let userOrders = [];

// Check authentication
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        loadUserOrders();
    } else {
        window.location.href = 'Login.html';
    }
});

// Load user orders from Firestore
async function loadUserOrders() {
    if (!currentUser) return;

    try {
        const ordersCollection = collection(db, 'orders');
        const q = query(ordersCollection, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        userOrders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        showMessage('Error loading orders', 'error');
    }
}

// Render orders
function renderOrders() {
    const container = document.querySelector('.orders_container');
    if (!container) return;

    if (userOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-shopping-bag"></i>
                <h3>No orders yet!</h3>
                <p>Start shopping to see your orders here</p>
                <a href="../index.html" class="return-btn">Start Shopping</a>
            </div>
        `;
        return;
    }

    // Sort orders by creation date (newest first)
    const sortedOrders = userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const ordersHTML = sortedOrders.map(order => `
        <div class="order-item ${order.status}">
            <div class="order-header">
                <div class="order-info">
                    <h4 class="order-number">${order.orderNumber}</h4>
                    <p class="order-date">${new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="order-status">
                    <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span>
                </div>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-product">
                        <img src="${item.image}" alt="${item.title}" class="product-img">
                        <div class="product-details">
                            <h5>${item.title}</h5>
                            <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-footer">
                <div class="order-total">
                    <strong>Total: $${order.total.toFixed(2)}</strong>
                </div>
                ${order.status === 'pending' ? `
                    <button onclick="cancelOrder('${order.id}')" class="cancel-btn">
                        Cancel Order
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = ordersHTML;
}

// Cancel order
async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
        // Update order status to cancelled
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: 'cancelled',
            updatedAt: new Date().toISOString()
        });

        // Refresh orders
        await loadUserOrders();
        showMessage('Order cancelled successfully', 'success');
    } catch (error) {
        console.error('Error cancelling order:', error);
        showMessage('Error cancelling order', 'error');
    }
}

// Filter orders by status
function filterOrders(status) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));

    const clickedBtn = document.querySelector(`[data-status="${status}"]`);
    if (clickedBtn) clickedBtn.classList.add('active');

    const container = document.querySelector('.orders_container');
    if (!container) return;

    let filteredOrders = userOrders;
    if (status !== 'all') {
        filteredOrders = userOrders.filter(order => order.status === status);
    }

    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders">
                <h3>No ${status === 'all' ? '' : status} orders found</h3>
                <p>Try changing your filter or start shopping</p>
            </div>
        `;
        return;
    }

    // Sort and render filtered orders
    const sortedOrders = filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderFilteredOrders(sortedOrders);
}

// Render filtered orders
function renderFilteredOrders(orders) {
    const container = document.querySelector('.orders_container');
    if (!container) return;

    const ordersHTML = orders.map(order => `
        <div class="order-item ${order.status}">
            <div class="order-header">
                <div class="order-info">
                    <h4 class="order-number">${order.orderNumber}</h4>
                    <p class="order-date">${new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="order-status">
                    <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span>
                </div>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-product">
                        <img src="${item.image}" alt="${item.title}" class="product-img">
                        <div class="product-details">
                            <h5>${item.title}</h5>
                            <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-footer">
                <div class="order-total">
                    <strong>Total: $${order.total.toFixed(2)}</strong>
                </div>
                ${order.status === 'pending' ? `
                    <button onclick="cancelOrder('${order.id}')" class="cancel-btn">
                        Cancel Order
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = ordersHTML;
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
window.cancelOrder = cancelOrder;
window.filterOrders = filterOrders;
window.returnToShop = returnToShop; 

// Firebase Config & Initialization (no realtime)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// IMPORTANT: Using the same config used in login.js to avoid mismatched projects
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

// ==============================
// DOM Elements
// ==============================
const adminNameEl = document.getElementById("admin-name");
const logoutButton = document.getElementById("logout-button");
const ordersBodyEl = document.getElementById("orders-body");
const searchInputEl = document.getElementById("order-search");
const filterTabs = Array.from(document.querySelectorAll(".filter-tab[data-status]"));
const statPendingEl = document.getElementById("stat-pending");
const statAcceptedEl = document.getElementById("stat-accepted");
const statDeclinedEl = document.getElementById("stat-declined");
const toastEl = document.getElementById("toast");
// Products DOM
const productsBodyEl = document.getElementById("products-body");
const productSearchInputEl = document.getElementById("product-search");
const addProductButton = document.getElementById("add-product-button");
const productModalEl = document.getElementById("product-modal");
const productFormTitleEl = document.getElementById("product-form-title");
const productTitleInput = document.getElementById("product-title");
const productPriceInput = document.getElementById("product-price");
const productCategoryInput = document.getElementById("product-category");
const productImageInput = document.getElementById("product-image");
const productDescriptionInput = document.getElementById("product-description");
const productRatingRateInput = document.getElementById("product-rating-rate");
const productSaveButton = document.getElementById("product-save-button");

// 
// State
let loggedUser = null; // { id, email, role }
let allOrders = []; // global variable for all users 
let activeStatusFilter = "all";
let activeSearchTerm = "";
// Products state
let allProducts = [];
let activeProductSearchTerm = "";
let editingProductId = null; // if null -> create, else update specific id

// ==============================
// Utils
// ==============================
function showToast(message, type = "success") {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.className = `toast ${type}`;
    toastEl.style.opacity = "1";
    setTimeout(() => {
        toastEl.style.opacity = "0";
    }, 2500);
}

function formatCurrency(amount) {
    if (typeof amount !== "number") return "-";
    try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(amount);
    } catch (_e) {
        return `$${amount.toFixed(2)}`;
    }
}

function parseLoggedUser() {
    try {
        const raw = localStorage.getItem("loggedUser");
        return raw ? JSON.parse(raw) : null;
    } catch (_e) {
        return null;
    }
}

function waitForAuth() {
    return new Promise(resolve => {
        onAuthStateChanged(auth, (user) => resolve(user));
    });
}

function setActiveTab(status) {
    filterTabs.forEach(tab => {
        const isActive = tab.dataset.status === status;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
    });
}

function computeStats(orders) {
    const counts = {
        pending: 0,
        accepted: 0,
        declined: 0
    };

    for (const order of orders) {
        // Count order statuses
        if (order.status === "pending") counts.pending += 1;
        else if (order.status === "accepted") counts.accepted += 1;
        else if (order.status === "declined") counts.declined += 1;
    }

    return counts;
}

function filterOrders(orders) {
    const status = activeStatusFilter;
    const term = activeSearchTerm.trim().toLowerCase();

    return orders.filter(order => {
        const matchesStatus = status === "all" ? true : order.status === status;

        const text = [
            order.orderNumber || "",
            order.customerInfo?.name || "",
            order.customerInfo?.email || ""
        ].join(" ").toLowerCase();
        const matchesSearch = term === "" ? true : text.includes(term);

        return matchesStatus && matchesSearch;
    });
}

function createStatusBadge(status) {
    const span = document.createElement("span");
    span.className = `status-badge ${status}`;
    span.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    return span;
}

function createActionButtons(order) {
    const container = document.createElement("div");
    container.className = "row-actions";

    const viewBtn = document.createElement("button");
    viewBtn.className = "action-button view";
    viewBtn.title = "View details";
    viewBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
    viewBtn.addEventListener("click", () => openOrderDetail(order));
    container.appendChild(viewBtn);

    if (order.status === "pending") {
        const acceptBtn = document.createElement("button");
        acceptBtn.className = "action-button accept";
        acceptBtn.title = "Accept order";
        acceptBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
        acceptBtn.addEventListener("click", () => updateOrderStatus(order.id, "accepted"));
        container.appendChild(acceptBtn);

        const declineBtn = document.createElement("button");
        declineBtn.className = "action-button decline";
        declineBtn.title = "Decline order";
        declineBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        declineBtn.addEventListener("click", () => updateOrderStatus(order.id, "declined"));
        container.appendChild(declineBtn);
    }

    return container;
}

function renderOrders() {
    if (!ordersBodyEl) return;
    ordersBodyEl.innerHTML = "";

    const list = filterOrders(allOrders);

    if (list.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 6; // Updated to match new column count (6 columns)
        td.textContent = "No orders found.";
        tr.appendChild(td);
        ordersBodyEl.appendChild(tr);
        updateStats(allOrders);
        return;
    }

    for (const order of list) {
        const tr = document.createElement("tr");

        const tdOrder = document.createElement("td");
        tdOrder.textContent = order.orderNumber || order.id || "-";

        const tdCustomer = document.createElement("td");
        // Simplified customer information display
        const customerName = order.customerInfo?.name || order.userEmail || "Customer";
        const customerEmail = order.customerInfo?.email || order.userEmail || "-";
        tdCustomer.innerHTML = `
            <div class="customer-cell">
                <div class="customer-name">${customerName}</div>
            </div>
        `;

        const tdItems = document.createElement("td");
        const itemCount = order.items ? order.items.length : 0;
        const itemNames = order.items ? order.items.map(item => item.title || 'Item').slice(0, 2).join(', ') : '';
        tdItems.innerHTML = `
            <div class="items-cell">
                <div class="items-count">${itemCount} item(s)</div>
                <div class="items-preview">${itemNames}${itemCount > 2 ? '...' : ''}</div>
            </div>
        `;

        const tdTotal = document.createElement("td");
        tdTotal.textContent = formatCurrency(order.total);

        const tdOrderStatus = document.createElement("td");
        tdOrderStatus.appendChild(createStatusBadge(order.status));

        const tdActions = document.createElement("td");
        tdActions.appendChild(createActionButtons(order));

        tr.appendChild(tdOrder);
        tr.appendChild(tdCustomer);
        tr.appendChild(tdItems);
        tr.appendChild(tdTotal);
        tr.appendChild(tdOrderStatus);
        tr.appendChild(tdActions);

        ordersBodyEl.appendChild(tr);
    }

    updateStats(allOrders);
}

function updateStats(orders) {
    const counts = computeStats(orders);
    if (statPendingEl) statPendingEl.textContent = String(counts.pending);
    if (statAcceptedEl) statAcceptedEl.textContent = String(counts.accepted);
    if (statDeclinedEl) statDeclinedEl.textContent = String(counts.declined);
}

function openOrderDetail(order) {
    const detail = document.getElementById("order-detail");
    const body = document.getElementById("order-detail-body");
    if (!detail || !body) return;

    // Simplified customer information
    const customerName = order.customerInfo?.name || order.userEmail || "Customer";
    const customerEmail = order.customerInfo?.email || order.userEmail || "-";

    body.innerHTML = `
        <div class="detail-header">
            <h3>Order ${order.orderNumber || order.id}</h3>
            <div class="detail-status">${order.status}</div>
        </div>
        
        <div class="detail-section">
            <h4>Customer Information</h4>
            <div class="customer-details">
                <div><strong>Name:</strong> ${customerName}</div>
                <div><strong>Email:</strong> ${customerEmail}</div>
                <div><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Order Items</h4>
            <div class="items-list">
                ${(order.items || []).map(item => `
                    <div class="item-row">
                        <img src="${item.image || ""}" alt="${item.title || ""}" class="item-image">
                        <div class="item-info">
                            <div class="item-title">${item.title || item.productId || "Item"}</div>
                            <div class="item-meta">Qty: ${item.quantity || 1} • ${formatCurrency(item.price || 0)}</div>
                        </div>
                        <div class="item-total">${formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                    </div>
                `).join("")}
            </div>
            <div class="detail-total">
                <strong>Total Order Value:</strong> ${formatCurrency(order.total)}
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Order Actions</h4>
            <div class="order-actions">
                ${order.status === 'pending' ? `
                    <button class="action-btn accept-btn" onclick="updateOrderStatus('${order.id}', 'accepted')">
                        <i class="fa-solid fa-check"></i> Accept Order
                    </button>
                    <button class="action-btn decline-btn" onclick="updateOrderStatus('${order.id}', 'declined')">
                        <i class="fa-solid fa-xmark"></i> Decline Order
                    </button>
                ` : `
                    <div class="status-info">Order is ${order.status}</div>
                `}
            </div>
        </div>
    `;

    detail.setAttribute("aria-hidden", "false");
    detail.classList.add("open");
}

function closeOrderDetail() {
    const detail = document.getElementById("order-detail");
    if (!detail) return;
    detail.classList.remove("open");
    detail.setAttribute("aria-hidden", "true");
}

// Data Access
async function loadAdminName(userId, fallbackEmail) {
    try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        const name = snap.exists() ? (snap.data().name || fallbackEmail || "Admin") : (fallbackEmail || "Admin");
        if (adminNameEl) adminNameEl.textContent = name;
    } catch (_e) {
        if (adminNameEl) adminNameEl.textContent = fallbackEmail || "Admin";
    }
}

async function fetchAllOrders() {
    // Single fetch (no realtime). If dataset is large, consider pagination later.
    const colRef = collection(db, "orders");
    const snap = await getDocs(colRef);
    const orders = [];
    snap.forEach(docSnap => {
        const data = docSnap.data();
        orders.push({ id: docSnap.id, ...data });
    });
    return orders;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const ref = doc(db, "orders", orderId);

        // Update only order status
        await updateDoc(ref, { status: newStatus });

        // Reflect locally
        const idx = allOrders.findIndex(o => o.id === orderId);
        if (idx !== -1) {
            allOrders[idx].status = newStatus;
        }

        renderOrders();
        showToast(`Order ${newStatus}.`, "success");
    } catch (e) {
        console.error(e);
        showToast("Failed to update order.", "error");
    }
}

// 
// ==============================
async function fetchAllProducts() {
    const colRef = collection(db, "products");
    const snap = await getDocs(colRef);
    const products = [];
    snap.forEach(docSnap => {
        const data = docSnap.data();
        products.push({ id: docSnap.id, ...data });
    });
    return products;
}

function validateProductInput(data) {
    const title = (data.title || "").trim();
    const price = Number(data.price);
    const category = (data.category || "").trim();
    const image = (data.image || "").trim();
    if (!title) return { ok: false, message: "Title is required" };
    if (!Number.isFinite(price) || price < 0) return { ok: false, message: "Price must be a non-negative number" };
    if (!category) return { ok: false, message: "Category is required" };
    if (!image) return { ok: false, message: "Image URL is required" };
    return { ok: true };
}

async function createProduct(productData) {
    const colRef = collection(db, "products");
    const payload = {
        title: productData.title,
        price: Number(productData.price),
        category: productData.category,
        image: productData.image,
        description: productData.description || "",
        rating: { rate: Number(productData.ratingRate || 0), count: Number(productData.ratingCount || 0) }
    };
    const docRef = await addDoc(colRef, payload);
    return { id: docRef.id, ...payload };
}

async function updateProduct(productId, productData) {
    const ref = doc(db, "products", productId);
    const payload = {
        title: productData.title,
        price: Number(productData.price),
        category: productData.category,
        image: productData.image,
        description: productData.description || "",
        rating: { rate: Number(productData.ratingRate || 0), count: Number(productData.ratingCount || 0) }
    };
    await setDoc(ref, payload, { merge: true });
    return { id: productId, ...payload };
}

async function deleteProductById(productId) {
    const ref = doc(db, "products", productId);
    await deleteDoc(ref);
}

// Products: UI
function openProductModal(product) {
    editingProductId = product?.id || null;
    if (productFormTitleEl) productFormTitleEl.textContent = editingProductId ? "Edit Product" : "Add Product";
    if (productTitleInput) productTitleInput.value = product?.title || "";
    if (productPriceInput) productPriceInput.value = product?.price != null ? String(product.price) : "";
    if (productCategoryInput) productCategoryInput.value = product?.category || "";
    if (productImageInput) productImageInput.value = product?.image || "";
    if (productDescriptionInput) productDescriptionInput.value = product?.description || "";
    if (productRatingRateInput) productRatingRateInput.value = product?.rating?.rate != null ? String(product.rating.rate) : "";

    if (productModalEl) {
        productModalEl.setAttribute("aria-hidden", "false");
        productModalEl.classList.add("open");
    }
}

function closeProductModal() {
    if (productModalEl) {
        productModalEl.classList.remove("open");
        productModalEl.setAttribute("aria-hidden", "true");
    }
}

function filterProducts(products) {
    const term = (activeProductSearchTerm || "").trim().toLowerCase();
    if (!term) return products;
    return products.filter(p => `${p.title || ""} ${p.category || ""}`.toLowerCase().includes(term));
}

function renderProducts() {
    if (!productsBodyEl) return;
    productsBodyEl.innerHTML = "";

    const list = filterProducts(allProducts);

    if (list.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 5;
        td.textContent = "No products found.";
        tr.appendChild(td);
        productsBodyEl.appendChild(tr);
        return;
    }

    for (const product of list) {
        const tr = document.createElement("tr");

        const tdImage = document.createElement("td");
        tdImage.innerHTML = `<img src="${product.image || ""}" alt="${product.title || ""}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border);" />`;

        const tdTitle = document.createElement("td");
        tdTitle.textContent = product.title || "-";

        const tdPrice = document.createElement("td");
        tdPrice.textContent = formatCurrency(Number(product.price) || 0);

        const tdCategory = document.createElement("td");
        tdCategory.textContent = product.category || "-";

        const tdActions = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "row-actions";

        const editBtn = document.createElement("button");
        editBtn.className = "action-button";
        editBtn.title = "Edit product";
        editBtn.innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
        editBtn.addEventListener("click", () => openProductModal(product));

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "action-button decline";
        deleteBtn.title = "Delete product";
        deleteBtn.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
        deleteBtn.addEventListener("click", async () => {
            const confirmed = confirm("Delete this product?");
            if (!confirmed) return;
            try {
                await deleteProductById(product.id);
                allProducts = allProducts.filter(p => p.id !== product.id);
                renderProducts();
                showToast("Product deleted.", "success");
            } catch (e) {
                console.error(e);
                showToast("Failed to delete product.", "error");
            }
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        tdActions.appendChild(actions);

        tr.appendChild(tdImage);
        tr.appendChild(tdTitle);
        tr.appendChild(tdPrice);
        tr.appendChild(tdCategory);
        tr.appendChild(tdActions);

        productsBodyEl.appendChild(tr);
    }
}

// ==============================
// Events & Init
// ==============================
function setupEventHandlers() {
    // Filters
    filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            activeStatusFilter = tab.dataset.status;
            setActiveTab(activeStatusFilter);
            renderOrders();
        });
    });

    // Search
    if (searchInputEl) {
        searchInputEl.addEventListener("input", (e) => {
            activeSearchTerm = e.target.value || "";
            renderOrders();
        });
    }

    // Close order details
    const orderDetailClose = document.querySelector('#order-detail .order-detail-close');
    if (orderDetailClose) orderDetailClose.addEventListener("click", closeOrderDetail);

    // Products: open create modal
    if (addProductButton) {
        addProductButton.addEventListener("click", () => openProductModal(null));
    }

    // Products: search
    if (productSearchInputEl) {
        productSearchInputEl.addEventListener("input", (e) => {
            activeProductSearchTerm = e.target.value || "";
            renderProducts();
        });
    }

    // Products: save
    if (productSaveButton) {
        productSaveButton.addEventListener("click", async () => {
            const data = {
                title: productTitleInput?.value || "",
                price: productPriceInput?.value || "",
                category: productCategoryInput?.value || "",
                image: productImageInput?.value || "",
                description: productDescriptionInput?.value || "",
                ratingRate: productRatingRateInput?.value || 0
            };
            const validation = validateProductInput(data);
            if (!validation.ok) {
                showToast(validation.message, "error");
                return;
            }

            try {
                if (!editingProductId) {
                    const created = await createProduct(data);
                    allProducts.unshift(created);
                } else {
                    const updated = await updateProduct(editingProductId, data);
                    const idx = allProducts.findIndex(p => p.id === editingProductId);
                    if (idx !== -1) allProducts[idx] = updated;
                }
                closeProductModal();
                renderProducts();
                showToast("Product saved.", "success");
            } catch (e) {
                console.error(e);
                showToast("Failed to save product.", "error");
            }
        });
    }

    // Products: close modal
    const productModalClose = document.querySelector('#product-modal .order-detail-close');
    if (productModalClose) productModalClose.addEventListener("click", closeProductModal);

    // Logout
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                await signOut(auth);
            } catch (_e) {
                // ignore signOut error, still clear local
            }
            localStorage.removeItem("loggedUser");
            window.location.href = "Login.html";
        });
    }
}

async function init() {
    // Ensure Firebase auth session is present and user is admin
    const authUser = await waitForAuth();
    if (!authUser) {
        window.location.href = "Login.html";
        return;
    }

    // Verify role from Firestore users/{uid}
    let role = null;
    try {
        const userRef = doc(db, "users", authUser.uid);
        const snap = await getDoc(userRef);
        role = snap.exists() ? (snap.data().role || null) : null;
    } catch (_e) {
        role = null;
    }
    if (role !== "admin") {
        showToast("Admin access required.", "error");
        window.location.href = "Login.html";
        return;
    }

    // Backward compatibility with previous local guard
    loggedUser = { id: authUser.uid, email: authUser.email || "", role };

    await loadAdminName(loggedUser.id, loggedUser.email);

    try {
        allOrders = await fetchAllOrders();
    } catch (e) {
        console.error(e);
        showToast("Failed to load orders.", "error");
        allOrders = [];
    }

    // Load products
    try {
        allProducts = await fetchAllProducts();
    } catch (e) {
        console.error(e);
        showToast("Failed to load products.", "error");
        allProducts = [];
    }

    setActiveTab(activeStatusFilter);
    renderOrders();
    renderProducts();
    setupEventHandlers();
}

init();

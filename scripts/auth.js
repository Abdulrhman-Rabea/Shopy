// ==============================
// Firebase Config & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDcP9iMTNphp4V2DNu_jNeoPdn-6wycEac",
    authDomain: "e-commerce-iti-project.firebaseapp.com",
    projectId: "e-commerce-iti-project",
    storageBucket: "e-commerce-iti-project.firebasestorage.app",
    messagingSenderId: "833183868773",
    appId: "1:833183868773:web:bfe821c5df431cd15aa38c",
    databaseURL: "https://e-commerce-iti-project-default-rtdb.firebaseio.com",
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ==============================
// DOM Elements
// ==============================
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("errorMsg");

// ==============================
// Event: Login Submit
// ==============================
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Step 1: Validate inputs
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!validateEmail(email)) {
        errorMsg.textContent = " Email not valid.";
        return;
    }
    if (password.length < 6) {
        errorMsg.textContent = " Password must be at least 6 characters.";
        return;
    }

    try {
        // Step 2: Firebase Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        // Step 3: Fetch User Role from Firebase Database
        const snapshot = await get(ref(db, `users/${userId}`));
        if (!snapshot.exists()) {
            errorMsg.textContent = " User data not found.";
            return;
        }

        const userData = snapshot.val();

        // Step 4: Save to LocalStorage (Session)
        localStorage.setItem("loggedUser", JSON.stringify({
            id: userId,
            email: email,
            role: userData.role
        }));

        // Step 5: Redirect based on role
        if (userData.role === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "../index.html";
        }

    } catch (error) {
        console.error(error);
        errorMsg.textContent = "❌ " + error.message;
    }
});

// ==============================
// Helper: Email Validation
// ==============================
function validateEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

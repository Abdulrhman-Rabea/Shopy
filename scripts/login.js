// ==============================
// Firebase Config & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDcP9iMTNphp4V2DNu_jNeoPdn-6wycEac",
    authDomain: "e-commerce-iti-project.firebaseapp.com",
    projectId: "e-commerce-iti-project",
    storageBucket: "e-commerce-iti-project.appspot.com",
    messagingSenderId: "833183868773",
    appId: "1:833183868773:web:bfe821c5df431cd15aa38c",
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("error-message");
const successMsg = document.getElementById("success-message");
const loginButton = document.getElementById("login-button");
const buttonText = document.getElementById("button-text");
const buttonSpinner = document.getElementById("button-spinner");

// Event: Login Submit
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Show loading state
    setLoadingState(true);
    clearMessages();

    // Validate inputs
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!validateEmail(email)) {
        showError("Please enter a valid email address.");
        setLoadingState(false);
        return;
    }

    if (password.length < 6) {
        showError("Password must be at least 6 characters long.");
        setLoadingState(false);
        return;
    }

    try {
        // Firebase Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        // Store user info in localStorage
        const userInfo = {
            uid: userId,
            email: email,
            role: 'user' // Default role
        };

        localStorage.setItem('loggedUser', JSON.stringify(userInfo));

        // Try to fetch user role from Firestore (optional)
        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.role === "admin") {
                    userInfo.role = "admin";
                    localStorage.setItem('loggedUser', JSON.stringify(userInfo));
                    showSuccess("Login successful! Redirecting to admin panel...");
                    setTimeout(() => {
                        window.location.href = "admin.html";
                    }, 1500);
                    return;
                }
            }
        } catch (firestoreError) {
            console.log("User role not found, using default role");
        }

        // Regular user login
        showSuccess("Login successful! Redirecting to home...");
        setTimeout(() => {
            window.location.href = "../index.html";
        }, 1500);

    } catch (error) {
        console.error("Login error:", error);
        let errorMessage = "Login failed. Please try again.";

        // Handle specific Firebase auth errors
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = "No account found with this email address.";
                break;
            case 'auth/wrong-password':
                errorMessage = "Incorrect password. Please try again.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Invalid email address format.";
                break;
            case 'auth/too-many-requests':
                errorMessage = "Too many failed attempts. Please try again later.";
                break;
            case 'auth/user-disabled':
                errorMessage = "This account has been disabled.";
                break;
        }

        showError(errorMessage);
    } finally {
        setLoadingState(false);
    }
});

// Set loading state
function setLoadingState(loading) {
    if (loading) {
        loginButton.disabled = true;
        buttonText.style.display = 'none';
        buttonSpinner.style.display = 'block';
    } else {
        loginButton.disabled = false;
        buttonText.style.display = 'block';
        buttonSpinner.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    successMsg.style.display = 'none';
}

// Show success message
function showSuccess(message) {
    successMsg.textContent = message;
    successMsg.style.display = 'block';
    errorMsg.style.display = 'none';
}

// Clear all messages
function clearMessages() {
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
}

// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Password visibility toggle
const passwordToggle = document.getElementById("password-toggle");
if (passwordToggle) {
    passwordToggle.addEventListener("click", function () {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);

        const icon = this.querySelector("i");
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
    });
}

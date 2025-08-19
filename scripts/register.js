// ==============================
// Firebase Config & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const registerForm = document.getElementById("registerForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const termsCheckbox = document.getElementById("terms");
const errorMsg = document.getElementById("error-message");
const successMsg = document.getElementById("success-message");
const registerButton = document.getElementById("register-button");
const buttonText = document.getElementById("button-text");
const buttonSpinner = document.getElementById("button-spinner");

// Event: Register Submit
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Show loading state
    setLoadingState(true);
    clearMessages();

    // Validate inputs
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const termsAccepted = termsCheckbox.checked;

    // Validation checks
    if (!fullName) {
        showError("Please enter your full name.");
        setLoadingState(false);
        return;
    }

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

    if (password !== confirmPassword) {
        showError("Passwords do not match. Please try again.");
        setLoadingState(false);
        return;
    }

    if (!termsAccepted) {
        showError("Please accept the Terms of Service and Privacy Policy.");
        setLoadingState(false);
        return;
    }

    try {
        // Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store additional user data in Firestore
        const userData = {
            uid: user.uid,
            fullName: fullName,
            email: email,
            role: 'user',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        // Save user data to Firestore
        await setDoc(doc(db, "users", user.uid), userData);

        // Store user info in localStorage
        localStorage.setItem('loggedUser', JSON.stringify({
            uid: user.uid,
            email: email,
            role: 'user'
        }));

        // Show success message and redirect
        showSuccess("Account created successfully! Redirecting to home...");

        setTimeout(() => {
            window.location.href = "../index.html";
        }, 2000);

    } catch (error) {
        console.error("Registration error:", error);
        let errorMessage = "Registration failed. Please try again.";

        // Handle specific Firebase auth errors
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = "An account with this email already exists. Please login instead.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Invalid email address format.";
                break;
            case 'auth/operation-not-allowed':
                errorMessage = "Email/password accounts are not enabled. Please contact support.";
                break;
            case 'auth/weak-password':
                errorMessage = "Password is too weak. Please choose a stronger password.";
                break;
            case 'auth/network-request-failed':
                errorMessage = "Network error. Please check your internet connection.";
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
        registerButton.disabled = true;
        buttonText.style.display = 'none';
        buttonSpinner.style.display = 'block';
    } else {
        registerButton.disabled = false;
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

// Password visibility toggle for password field
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

// Password visibility toggle for confirm password field
const confirmPasswordToggle = document.getElementById("confirm-password-toggle");
if (confirmPasswordToggle) {
    confirmPasswordToggle.addEventListener("click", function () {
        const type = confirmPasswordInput.getAttribute("type") === "password" ? "text" : "password";
        confirmPasswordInput.setAttribute("type", type);

        const icon = this.querySelector("i");
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
    });
}

// Real-time password confirmation validation
confirmPasswordInput.addEventListener("input", function () {
    const password = passwordInput.value;
    const confirmPassword = this.value;

    if (confirmPassword && password !== confirmPassword) {
        this.style.borderColor = "#dc3545";
    } else if (confirmPassword) {
        this.style.borderColor = "#28a745";
    } else {
        this.style.borderColor = "#dee2e6";
    }
});

// Real-time password strength indicator
passwordInput.addEventListener("input", function () {
    const password = this.value;
    const strength = getPasswordStrength(password);

    // Remove existing strength classes
    this.classList.remove('weak', 'medium', 'strong');

    if (password.length > 0) {
        this.classList.add(strength);
    }
});

// Get password strength
function getPasswordStrength(password) {
    if (password.length < 6) return 'weak';

    let score = 0;

    // Length score
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety score
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
} 
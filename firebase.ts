
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAwoQR7ALXncGq4hCkOh7xroDbPY3YzZ6E",
    authDomain: "frontend-domination-2025.firebaseapp.com",
    projectId: "frontend-domination-2025",
    storageBucket: "frontend-domination-2025.firebasestorage.app",
    messagingSenderId: "1015062770084",
    appId: "1:1015062770084:web:c5fa4c4ac10c9a2bc41131",
    measurementId: "G-X5Y9C4F5E2"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;

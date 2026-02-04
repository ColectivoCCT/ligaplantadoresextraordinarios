import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Sustituye estos datos por los de tu consola de Firebase
// (Los encontrarás en Project Settings > General > Your Apps)
const firebaseConfig = {
            apiKey: "AIzaSyBos4cvVKCWWx9F2wLzk_-kreFziP0k8wI",
            authDomain: "mi-bosque-virtual.firebaseapp.com",
            projectId: "mi-bosque-virtual",
            storageBucket: "mi-bosque-virtual.firebasestorage.app",
            messagingSenderId: "182695518844",
            appId: "1:182695518844:web:610d6841d6a0e5ec7c9ff9"
        };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDiM75Qc1bTXpwFiNUV9RYnWmD0lO5Oqsk",
    authDomain: "school-tj.firebaseapp.com",
    projectId: "school-tj",
    storageBucket: "school-tj.firebasestorage.app",
    messagingSenderId: "318872730370",
    appId: "1:318872730370:web:c893d1d09c32c91b56601b",
    measurementId: "G-NPWXP06N3J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore/lite";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyVvY9xPkeDjqnunM6Rzhpna-J93W3bsA",
  authDomain: "iris-detection-19457.firebaseapp.com",
  projectId: "iris-detection-19457",
  storageBucket: "iris-detection-19457.firebasestorage.app",
  messagingSenderId: "634104093419",
  appId: "1:634104093419:web:c722884086591cd77afcae",
  measurementId: "G-85GXJ7TE6F"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
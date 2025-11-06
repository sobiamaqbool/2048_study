// auth.js — for Google Sign-In (compat syntax)

// 1. Your Firebase config (copy yours here)
const firebaseConfig = {
  apiKey: "AIzaSyBGhZbILs0PANs_5xoShlaDTiwbKy2sojQ",
  authDomain: "project-6698437008099811917.firebaseapp.com",
  projectId: "project-6698437008099811917",
  storageBucket: "project-6698437008099811917.firebasestorage.app",
  messagingSenderId: "987345922265",
  appId: "1:987345922265:web:d63f46775c9c98972636c8",
  measurementId: "G-QMPEBLDGHH"
};

// 2. Initialize Firebase (compat mode)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// 3. Function used by study_runner.js
async function optionalGoogleSignIn() {
  const result = await auth.signInWithPopup(provider);
  const user = result.user;

  const info = {
    google_uid: user.uid,
    displayName: user.displayName || null,
    email: user.email || null
  };

  // Save to localStorage for next sessions
  localStorage.setItem("anon_link_google_uid", info.google_uid);
  if (info.displayName) localStorage.setItem("google_displayName", info.displayName);
  if (info.email) localStorage.setItem("google_email", info.email);

  return info;
  
}
  window.optionalGoogleSignIn = optionalGoogleSignIn;
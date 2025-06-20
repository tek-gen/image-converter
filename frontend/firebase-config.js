// firebase-config.js
// Ensure env.js defines the required keys on `window.env`
export const firebaseConfig = {
  apiKey: window.env?.FIREBASE_API_KEY,
  authDomain: window.env?.FIREBASE_AUTH_DOMAIN,
  projectId: window.env?.FIREBASE_PROJECT_ID,
  storageBucket: window.env?.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.env?.FIREBASE_MESSAGING_SENDER_ID,
  appId: window.env?.FIREBASE_APP_ID,
};

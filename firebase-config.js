// Initialize Firebase using fetch and importScripts
(async function initializeFirebase() {
  try {
    // Load Firebase scripts dynamically
    await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js'),
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js'),
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js')
    ]);

    const firebaseConfig = {
      apiKey: chrome.runtime.getManifest().firebase.apiKey,
      authDomain: chrome.runtime.getManifest().firebase.authDomain,
      databaseURL: chrome.runtime.getManifest().firebase.databaseURL,
      projectId: chrome.runtime.getManifest().firebase.projectId,
      storageBucket: chrome.runtime.getManifest().firebase.storageBucket,
      messagingSenderId: chrome.runtime.getManifest().firebase.messagingSenderId,
      appId: chrome.runtime.getManifest().firebase.appId
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
})();
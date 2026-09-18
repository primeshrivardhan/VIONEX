importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase Cloud Messaging Service Worker (vionex-d7055)
const firebaseConfig = {
  projectId: "vionex-d7055",
  messagingSenderId: "678914457609",
  appId: "1:678914457609:web:726c9045eaa5cc1daeb8d8",
  apiKey: "AIzaSyB98XAJEhzScUJcry3HCoXLE5G0TzQJ_dU"
};

let messaging = null;
if (firebaseConfig.apiKey) {
  try {
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
  } catch (err) {
    console.warn("[FCM SW] Firebase messaging initialization warning:", err);
  }
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png', 
    data: {
      url: payload.data.url || '/'
    }
  };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

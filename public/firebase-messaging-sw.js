importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase Cloud Messaging Service Worker (vionex-d47e2)
const firebaseConfig = {
  projectId: "vionex-d47e2",
  messagingSenderId: "501492785167",
  appId: "1:501492785167:web:0cb4f5b1bb01ebed86037a",
  apiKey: "AIzaSyAeeIhfd49DASQW6gmuZCa92QbutuPJyKM"
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

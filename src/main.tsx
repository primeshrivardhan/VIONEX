/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import StandaloneDealerForm from "./components/StandaloneDealerForm.tsx";
import PublicFormGateway from "./components/PublicFormGateway.tsx";
import "./index.css";

// Register Service Worker for PWA Support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registered successfully:", reg.scope);
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  });
}

// Register Capacitor Push Notifications if running natively
async function setupPushNotifications() {
  try {
    const hasCapacitor = !!(window as any).Capacitor;
    if (hasCapacitor) {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        PushNotifications.requestPermissions().then((result) => {
          if (result.receive === 'granted') {
            PushNotifications.register();
          }
        });

        PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token: ' + token.value);
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received: ' + JSON.stringify(notification));
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push action performed: ' + JSON.stringify(notification));
        });
      }
    }
  } catch (e) {
    console.error("Capacitor Push Notifications setup failed:", e);
  }
}

setupPushNotifications();

const getParam = (key: string) => {
  const searchParams = new URLSearchParams(window.location.search);
  const hashStr = window.location.hash.includes("?") 
    ? window.location.hash.substring(window.location.hash.indexOf("?")) 
    : window.location.hash.replace("#", "?");
  
  const hashParams = new URLSearchParams(hashStr);
  return searchParams.get(key) || hashParams.get(key) || "";
};

const viewParam = getParam("view").toLowerCase();
const typeParam = getParam("type").toLowerCase();

const isDealerRegistration = 
  viewParam === "register-dealer" || 
  viewParam === "register_dealer" || 
  viewParam === "dealer-register";

const isPublicForm = 
  viewParam === "public-form" || 
  viewParam === "public_form" || 
  viewParam === "public" || 
  viewParam === "portal" ||
  viewParam === "form" ||
  typeParam === "dealer" ||
  typeParam === "consultant";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      {isDealerRegistration ? (
        <StandaloneDealerForm />
      ) : isPublicForm ? (
        <PublicFormGateway />
      ) : (
        <App />
      )}
    </ErrorBoundary>
  </StrictMode>
);

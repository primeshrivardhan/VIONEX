import { safeJsonParse } from "./lib/safeJson";
import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import NeutralPublicPortal from "./components/NeutralPublicPortal";
import PublicFormGateway from "./components/PublicFormGateway";
import StandaloneDealerForm from "./components/StandaloneDealerForm";

// Robust Lazy Loading to fix "Failed to fetch dynamically imported module" errors

import DealersView from "./components/DealersView";
import Dashboard from "./components/Dashboard";
import AddCrop from "./components/AddCrop";
import AdvisoryView from "./components/AdvisoryView";
import AlertsView from "./components/AlertsView";
import AddFarmerForm from "./components/AddFarmerForm";
import FarmerList from "./components/FarmerList";
import AddProductForm from "./components/AddProductForm";
import ProductList from "./components/ProductList";
import AddScheduleForm from "./components/AddScheduleForm";
import ScheduleList from "./components/ScheduleList";
import ConsultantsView from "./components/ConsultantsView";
import MasterScheduleView from "./components/MasterScheduleView";
import LocationMapping from "./components/LocationMapping";
import AdminView from "./components/AdminView";
import SettingsView from "./components/SettingsView";

import { Crop, AppUser, Farmer, Dealer, Alert } from "./types";


import { generateVillageCode } from "./hooks/useMasterLocations";
import {
  syncCollection,
  saveItem,
  deleteItem,
  deleteAllItems,
  seedIfEmpty,
  seedMissingProducts,
} from "./lib/data-sync";
import { PRESEEDED_PRODUCTS } from "./lib/preseeded-products";
import { generate2500Catalog } from "./lib/catalog-generator";
import { auth, db, ensureAnonymousAuth, getDocsSafe, isAuthActionPending, messaging, setExplicitAuthInProgress } from "./lib/firebase";
import { NEW_ADMIN_EMAIL, NEW_ADMIN_DISPLAY_NAME, HOSTING_URL } from "./lib/config";
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, doc, getDoc, writeBatch, setDoc, getDocsFromCache } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { isScheduleForFarmer } from "./lib/utils";















import LocalErrorBoundary from "./components/LocalErrorBoundary";
import ConfirmationModal from "./components/ConfirmationModal";
import LoginScreen from "./components/LoginScreen";
import {

  Leaf,
  PlusCircle,
  Sprout,
  TestTube,
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  Store,
  UserCheck,
  CalendarDays,
  Settings,
  Shield,
  ShieldCheck,
  Menu,
  X,
  Megaphone,
  User,
  LogOut,
  Lock,
  CloudRain,
  AlertTriangle,
  Wind,
  ChevronRight,
  FlaskConical,
  MessageSquareText,
  Smartphone,
  Download,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  MapPin,
} from "lucide-react";

function healProductsAndSchedules(rawProductsList: any[][], rawSchedules: any[]) {
  const rawProducts = rawProductsList.flat();
  // 1. Heal products
  const healedProducts = (rawProducts || []).map(p => {
    if (!p) return p;
    let productChanged = false;
    const updated = { ...p };
    
    // If brandName is empty but name is present, copy name to brandName
    if (!updated.brandName && updated.name) {
      updated.brandName = updated.name;
      productChanged = true;
    }
    // If brandName is present but name is empty, copy brandName to name (backward compatibility)
    if (updated.brandName && !updated.name) {
      updated.name = updated.brandName;
      productChanged = true;
    }

    // Auto-fix generic "माहिती उपलब्ध नाही" placeholders or missing values in catalog
    if (!updated.companyName || updated.companyName.trim() === "" || updated.companyName === "माहिती उपलब्ध नाही") {
      updated.companyName = "प्रसिद्ध कंपनी (Agro Brand)";
      productChanged = true;
    }

    if (!updated.formulation || updated.formulation.trim() === "" || updated.formulation === "माहिती उपलब्ध नाही") {
      updated.formulation = "लागू नाही";
      productChanged = true;
    }
    
    if (productChanged) {
      return { ...updated, _needsCloudUpdate: true };
    }
    return p;
  });

  // Create a master lookup for product details
  const productLookupById = new Map<string, any>();
  const productLookupByName = new Map<string, any>();
  
  healedProducts.forEach(p => {
    if (p.id) {
      productLookupById.set(String(p.id), p);
    }
    const brandLower = String(p.brandName || p.name || "").trim().toLowerCase();
    if (brandLower) {
      productLookupByName.set(brandLower, p);
    }
  });

  // 2. Heal schedules
  const healedSchedules = (rawSchedules || []).map(s => {
    if (!s || !Array.isArray(s.selectedProducts)) return s;
    
    let scheduleChanged = false;
    const updatedProducts = s.selectedProducts.map((sp: any) => {
      if (!sp) return sp;
      
      // Find matching product from catalog
      let match = null;
      if (sp.id) {
        match = productLookupById.get(String(sp.id));
      }
      if (!match) {
        const spBrandLower = String(sp.brandName || sp.name || "").trim().toLowerCase();
        if (spBrandLower) {
          match = productLookupByName.get(spBrandLower);
        }
      }
      
      const updatedSp = { ...sp };
      let productInScheduleChanged = false;
      
      // Ensure brandName is present
      if (!updatedSp.brandName && updatedSp.name) {
        updatedSp.brandName = updatedSp.name;
        productInScheduleChanged = true;
      }
      
      if (match) {
        // Fill missing details from the matching master product
        if (!updatedSp.brandName && match.brandName) {
          updatedSp.brandName = match.brandName;
          productInScheduleChanged = true;
        }
        if (!updatedSp.companyName && match.companyName && match.companyName !== "माहिती उपलब्ध नाही") {
          if (updatedSp.companyName !== match.companyName) {
            updatedSp.companyName = match.companyName;
            productInScheduleChanged = true;
          }
        }
        if (!updatedSp.composition && match.composition && match.composition !== "माहिती उपलब्ध नाही") {
          if (updatedSp.composition !== match.composition) {
            updatedSp.composition = match.composition;
            productInScheduleChanged = true;
          }
        }
        if (!updatedSp.activeIngredients && (match.composition || match.activeIngredients)) {
          const newIng = match.composition || match.activeIngredients;
          if (newIng !== "माहिती उपलब्ध नाही" && updatedSp.activeIngredients !== newIng) {
            updatedSp.activeIngredients = newIng;
            productInScheduleChanged = true;
          }
        }
        if (!updatedSp.formulation && match.formulation && match.formulation !== "माहिती उपलब्ध नाही") {
          if (updatedSp.formulation !== match.formulation) {
            updatedSp.formulation = match.formulation;
            productInScheduleChanged = true;
          }
        }
        if (!updatedSp.notes && match.notes && match.notes !== "माहिती उपलब्ध नाही") {
          if (updatedSp.notes !== match.notes) {
            updatedSp.notes = match.notes;
            productInScheduleChanged = true;
          }
        }
        
        // Auto-fix generic "माहिती उपलब्ध नाही" placeholders if catalog has better info
        if ((!updatedSp.companyName || updatedSp.companyName === "माहिती उपलब्ध नाही") && match.companyName && match.companyName !== "माहिती उपलब्ध नाही") {
          updatedSp.companyName = match.companyName;
          productInScheduleChanged = true;
        }
        if ((!updatedSp.composition || updatedSp.composition === "माहिती उपलब्ध नाही") && match.composition && match.composition !== "माहिती उपलब्ध नाही") {
          updatedSp.composition = match.composition;
          productInScheduleChanged = true;
        }
        if ((!updatedSp.activeIngredients || updatedSp.activeIngredients === "माहिती उपलब्ध नाही") && (match.composition || match.activeIngredients) && (match.composition !== "माहिती उपलब्ध नाही" && match.activeIngredients !== "माहिती उपलब्ध नाही")) {
          updatedSp.activeIngredients = match.composition || match.activeIngredients;
          productInScheduleChanged = true;
        }
      }

      if (productInScheduleChanged) {
        scheduleChanged = true;
      }

      return updatedSp;
    });

    if (scheduleChanged) {
      return { ...s, selectedProducts: updatedProducts, _needsCloudUpdate: true };
    }
    return s;
  });

  return { healedProducts, healedSchedules };
}

export default function App() {
  console.log("App component executing...");
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("vionex-current-user");
      return saved ? (saved === "undefined" ? undefined : safeJsonParse(saved)) : null;
    } catch (e) {
      console.warn("Failed to parse currentUser from localStorage", e);
      return null;
    }
  });

  const [users, setUsers] = useState<AppUser[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Farmers unread schedules notification state
  const [unreadSchedules, setUnreadSchedules] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Use static catalog on client side to prevent Firestore read bloat and freezing
  const baseCatalog = useMemo(() => generate2500Catalog(), []);
  
  const healedProducts = useMemo(() => {
    // Only return the actual products from Firestore.
    // Do NOT automatically mix in PRESEEDED_PRODUCTS or baseCatalog,
    // so that the product list is empty by default and only displays products added by the user.
    return products;
  }, [products]);

  const healedSchedules = useMemo(() => {
    const result = healProductsAndSchedules([baseCatalog, products], schedules);
    return result.healedSchedules;
  }, [baseCatalog, products, schedules]);

  // Sync data from Firestore
  useEffect(() => {
    // One-time migration from LocalStorage to Firestore if Firestore is empty
    const migrateIfNecessary = async () => {
      if (!navigator.onLine) {
        console.log("Offline mode: Skipping migrations to prevent hanging.");
        return;
      }
      
      const collections = [
        "farmers",
        "products",
        "schedules",
        "crops",
        "users",
      ];
      for (const col of collections) {
        const localData = localStorage.getItem(`vionex-${col}`);
        if (localData) {
          try {
            const parsed = (localData === "undefined" ? undefined : safeJsonParse(localData));
            if (Array.isArray(parsed) && parsed.length > 0) {
              const snapshot = await getDocsSafe(collection(db, col), 2000);
              if (snapshot.empty) {
                console.log(`Migrating ${col} to Firestore...`);
                for (const item of parsed) {
                  const { id, ...data } = item;
                  saveItem(col, data, id); // Don't await individual saves to prevent UI hang
                }
              }
            }
          } catch (e) {
            console.error(`Migration failed for ${col}:`, e);
          }
        }
      }

    // Seed initial Alerts collection if empty
      try {
        const alertsSnapshot = await getDocsSafe(collection(db, "alerts"), 2000);
        if (alertsSnapshot.empty) {
          console.log("Seeding initial alerts...");
          const initialAlerts = [
            {
              text: "पुढील ४८ तासांत पावसाची १०% शक्यता. फवारणी नियोजनात खबरदारी घ्या.",
              type: "weather",
              targetScope: "all",
              createdAt: Date.now(),
            },
            {
              text: "जास्त आर्द्रतेमुळे करपा आणि भुरी रोगाचा प्रादुर्भाव वाढण्याची शक्यता.",
              type: "disease",
              targetScope: "all",
              createdAt: Date.now() - 3600000,
            },
            {
              text: "उद्या हवेचा वेग जास्त राहण्याची शक्यता असल्याने उंच पिकांना आधार द्या.",
              type: "wind",
              targetScope: "all",
              createdAt: Date.now() - 7200000,
            },
            {
              text: "तापमानात वाढ होत असल्याने पाण्याचे नियोजन वेळेवर करा.",
              type: "temp",
              targetScope: "all",
              createdAt: Date.now() - 10800000,
            },
          ];
          for (const alert of initialAlerts) {
            await saveItem("alerts", alert);
          }
        }
      } catch (err) {
        console.error("Error seeding initial alerts:", err);
      }

      // Force clean products in Firestore once as requested by the user to empty the backend database
      const hasCleanedV2 = localStorage.getItem("products_cleaned_v2");
      if (!hasCleanedV2) {
        try {
          console.log("Cleaning products database as requested...");
          const q = collection(db, "products");
          const snapshot = await getDocsSafe(q, 4000);
          if (!snapshot.empty) {
            console.log(`Found ${snapshot.docs.length} products to clear in backend.`);
            const ids = snapshot.docs.map(doc => doc.id);
            const batchSize = 100;
            for (let i = 0; i < ids.length; i += batchSize) {
              const chunk = ids.slice(i, i + batchSize);
              const batch = writeBatch(db);
              chunk.forEach(id => {
                batch.delete(doc(db, "products", id));
              });
              await batch.commit();
            }
          }
          localStorage.setItem("products_cleaned_v2", "true");
          localStorage.removeItem("cached_collection_products"); // clear client cache as well
          console.log("Database clean completed successfully.");
        } catch (err) {
          console.error("Error during manual backend clean:", err);
        }
      }
      
    };

    setTimeout(() => {
      migrateIfNecessary().catch(err => console.error("Migration failed:", err));
    }, 3000);

    // On startup, active sessions and anonymous fallbacks are managed cleanly by the onAuthStateChanged observer after authStateReady

    const refreshInterval = setInterval(() => {
      setLastRefresh(Date.now());
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Notification registration
  useEffect(() => {
    const handleNotification = async () => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log("Notification API not supported or blocked in this browser/iframe.");
        return;
      }
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          if (!messaging) {
            console.log("Firebase messaging is not initialized or unsupported.");
            return;
          }
          const token = await getToken(messaging, { vapidKey: 'BM2d5wV121_S6T6gVlT2eO3nL1F2k8y3g5K1-5Fk4w7J2C7uS5r1K4T8Qk5I2q9y6G7H8d3n2C6F4w7J2Cw' }).catch(err => {
            console.log("Failed to get FCM token:", err);
            return null;
          }); 
          if (token && currentUser?.id) {
            console.log('FCM Token:', token);
            const tokenRef = doc(db, 'users', currentUser.id, 'tokens', 'device-token');
            await setDoc(tokenRef, { token, updatedAt: Date.now() });
          }
          
          onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            if (typeof Notification !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(payload.notification!.title!, {
                body: payload.notification!.body,
                icon: '/icon.png'
              });
            }
          });
        }
      } catch (err) {
        console.error('Notification permission error:', err);
      }
    };
    handleNotification();
  }, [currentUser]);

  // Dynamic subscription sync effect based on logged-in user credentials for peak security
  useEffect(() => {
    try {
      const unsubAuth = auth ? onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log("Firebase Auth State Connected:", user.isAnonymous ? "Anonymous" : user.email);
        } else {
          // Only establish anonymous session if NO explicit login is in progress
          if (!isAuthActionPending()) {
            await ensureAnonymousAuth();
          }
        }
      }) : () => {};
  
      // Determine current user context
      const currentUserId = currentUser?.data?.id;
      const currentRole = currentUser?.data?.role;
      const userType = currentUser?.type;
  
      const isAdminOrAdminRole = currentRole === "admin" || userType === "admin";
      const isFarmer = userType === "farmer";
  
      // Default placeholders for clean unlogged state
      if (!currentUser) {
        setUsers([]);
        setFarmers([]);
        setSchedules([]);
        setDealers([]);
        setActivityLogs([]);
        setProducts([]);
        setCrops([]);
        setAlerts([]);
  
        return () => {
          unsubAuth();
        };
      }
  
      let unsubUsers = () => {};
      let unsubFarmers = () => {};
      let unsubSchedules = () => {};
      let unsubDealers = () => {};
      let unsubActivityLogs = () => {};
  
      // 1. Sync Users table (extremely sensitive, has passwords)
      if (isAdminOrAdminRole) {
        unsubUsers = syncCollection<AppUser>("users", (data) => {
          setUsers(data);
          updateSyncTime();
        });
      } else {
        if (currentUser?.data) {
          setUsers([currentUser.data]);
        } else {
          setUsers([]);
        }
      }
  
      // 2. Sync Farmers
      const isConsultant = currentUser?.type === "user" && currentUser?.data?.role === "consultant";
      if (isAdminOrAdminRole || isConsultant) {
        unsubFarmers = syncCollection<any>("farmers", (data) => {
          setFarmers(data);
          updateSyncTime();
        });
      } else if (isFarmer && currentUserId) {
        unsubFarmers = syncCollection<any>("farmers", (data) => {
          setFarmers(data || []);
          updateSyncTime();
        }, { where: ["id", "==", currentUserId] });
      } else if (currentUserId) {
        unsubFarmers = syncCollection<any>("farmers", (data) => {
          setFarmers(data || []);
          updateSyncTime();
        }, { where: ["createdBy", "==", currentUserId] });
      } else {
        setFarmers([]);
      }
  
      // 3. Sync Schedules
      if (isAdminOrAdminRole) {
        unsubSchedules = syncCollection<any>("schedules", (data) => {
          setSchedules(data || []);
          updateSyncTime();
        });
      } else if (isFarmer && currentUserId) {
        // Find the farmer's mobile number to include in the query
        const mobile = currentUser?.data?.mobile ? String(currentUser.data.mobile).slice(-10) : "";
        const possibleIds = [currentUserId];
        if (mobile) {
          possibleIds.push(mobile, `+91${mobile}`, `91${mobile}`);
        }
        
        unsubSchedules = syncCollection<any>("schedules", (data) => {
          setSchedules(data || []);
          updateSyncTime();
        }, { where: ["farmerId", "in", possibleIds.slice(0, 10)] });
      } else if (currentUserId) {
        unsubSchedules = syncCollection<any>("schedules", (data) => {
          setSchedules(data || []);
          updateSyncTime();
        }, { where: ["createdBy", "==", currentUserId] });
      } else {
        setSchedules([]);
      }
  
      // 4. Sync Dealers
      if (currentUserId && currentUser?.data?.role !== "user") {
        unsubDealers = syncCollection<Dealer>("dealers", (data) => {
          setDealers(data || []);
          updateSyncTime();
        });
      } else {
        setDealers([]);
      }
  
      // 5. Sync Activity Logs
      if (isAdminOrAdminRole) {
        unsubActivityLogs = syncCollection<any>("activity-logs", (data) => {
          setActivityLogs(data || []);
          updateSyncTime();
        }, { orderBy: ['timestamp', 'desc'], limit: 500 });
      } else {
        setActivityLogs([]);
      }
  
      // 6. Standard catalog syncs (products, crops, global alerts)
      const unsubProducts = syncCollection<any>("products", (data) => {
        setProducts(data || []);
        updateSyncTime();
      });
  
      const unsubCrops = syncCollection<Crop>("crops", (data) => {
        setCrops(data || []);
        updateSyncTime();
      });
  
      const unsubAlerts = syncCollection<Alert>("alerts", (data) => {
        const sorted = (data || []).sort((a, b) => {
          const tA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
          const tB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime();
          return tB - tA;
        });
        setAlerts(sorted);
        updateSyncTime();
      });
  
      return () => {
        unsubAuth();
        unsubUsers();
        unsubFarmers();
        unsubProducts();
        unsubSchedules();
        unsubCrops();
        unsubDealers();
        unsubActivityLogs();
        unsubAlerts();
      };
    } catch (err) {
      console.error("Critical Sync Effect Error:", err);
    }
  }, [currentUser]);

  // Real-time Push Notifications for Schedules and Alerts
  const lastSyncTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    try {
      if (!schedules || schedules.length === 0) return;
      
      const now = Date.now();
      // Use lastSyncTimeRef to avoid notifications on first load
      // Increase wait to 5 seconds for stability
      if (now - lastSyncTimeRef.current < 5000) return; 

      const myId = currentUser?.data?.id || currentUser?.id || currentUser?.data?.mobile || currentUser?.mobile || "";

      const newSchedules = schedules.filter(s => {
        const updatedAt = s.updatedAt || 0;
        // Schedule must be updated in the last 15 seconds
        const isVeryRecent = now - updatedAt < 15000;
        
        const updaterId = s.updatedByUserId || s.createdByUserId || "";
        const isOtherUser = updaterId && updaterId !== myId;
        
        let isForMe = true;
        if (currentUser?.type === 'farmer') {
          // If farmer, check if it belongs to them
          isForMe = isScheduleForFarmer(s, myId, currentUser?.data || currentUser);
        }

        return isVeryRecent && isOtherUser && isForMe;
      });

      newSchedules.forEach(s => {
        const farmerName = s.farmerName || "शेतकरी";
        const url = window.location.origin + `?view=dashboard&tab=dashboard`;
        showBrowserNotification(
          `नवीन अपडेट (${s.cropName || 'वेळापत्रक'})`,
          `${farmerName}: ${s.method || 'अपडेट'} - ${s.scheduleDate || ''}${s.notes ? `\nनोंद: ${s.notes}` : (s as any).advisory ? `\nनोंद: ${(s as any).advisory}` : ''}`,
          url
        );
      });
    } catch (err) {
      console.error("Schedule Notification Effect Error:", err);
    }
  }, [schedules, currentUser]);

  useEffect(() => {
    try {
      if (!alerts || alerts.length === 0) return;
      const now = Date.now();
      if (now - lastSyncTimeRef.current < 5000) return;

      const latestAlert = alerts[0];
      const alertTime = latestAlert.createdAt || 0;
      
      if (now - alertTime < 15000) {
        const url = window.location.origin + `?view=advice&tab=alerts`;
        showBrowserNotification("VIONEX Alert (सूचना)", latestAlert.text, url);
      }
    } catch (err) {
      console.error("Alert Notification Effect Error:", err);
    }
  }, [alerts]);

  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Seed initial admin only if NEW_ADMIN_EMAIL is configured and user is admin
  useEffect(() => {
    const seedAdmin = async () => {
      if (!NEW_ADMIN_EMAIL || !db || !isAdminOrAdminRole) return;
      try {
        const adminSnap = await getDocsSafe(query(collection(db, "users"), where("loginId", "==", NEW_ADMIN_EMAIL)), 2000);
        if (adminSnap.empty) {
          const initialAdmin: AppUser = {
            id: "admin-fixed",
            name: NEW_ADMIN_DISPLAY_NAME || "Admin",
            loginId: NEW_ADMIN_EMAIL,
            role: "admin",
            status: "approved",
            permissions: {
              farmers: true,
              schedules: true,
              products: true,
              dealers: true,
              consultants: true,
              weather: true,
              allCrops: true,
              solutions: true,
              masterSchedules: true,
              autoApproveSchedules: true,
              manageProducts: true,
            },
            paidStatus: "paid",
            access: true,
          };
          await saveItem("users", initialAdmin, "admin-fixed");
        }
      } catch (err) {
        console.error("Error seeding initial admin:", err);
      }
    };
    seedAdmin();
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global Error Caught:", event.error);
      if (event.error?.message?.includes("ResizeObserver") || event.error?.message?.includes("Script error")) {
        return; // Ignore benign errors
      }
      // If critical error, reload after a delay or show recovery UI
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("vionex-current-user", JSON.stringify(currentUser));
      // Clean up URL parameters after successful login or navigation apply
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        let changed = false;
        if (url.searchParams.has("type")) {
          url.searchParams.delete("type");
          changed = true;
        }
        if (url.searchParams.has("view")) {
          url.searchParams.delete("view");
          changed = true;
        }
        if (url.searchParams.has("tab")) {
          url.searchParams.delete("tab");
          changed = true;
        }
        if (changed) {
          window.history.replaceState(window.history.state, "", url.toString());
        }
      }
    } else {
      localStorage.removeItem("vionex-current-user");
    }
  }, [currentUser]);

  // Keep currentUser.data in sync with real-time Firestore updates
  useEffect(() => {
    if (!currentUser) return;

    try {
      if (currentUser.type === "farmer" && (farmers || []).length > 0) {
        const liveFarmer = farmers.find(
          (f) => f && (f.id === currentUser.data?.id || f.mobile === currentUser.data?.mobile),
        );
        if (
          liveFarmer &&
          JSON.stringify(liveFarmer) !== JSON.stringify(currentUser.data)
        ) {
          setCurrentUser((prev: any) => (prev ? { ...prev, data: liveFarmer } : null));
        }
      } else if (
        (currentUser.type === "user" || currentUser.type === "admin") &&
        (users || []).length > 0
      ) {
        const liveUser = users.find(
          (u) => u && (u.id === currentUser.data?.id || u.loginId === currentUser.data?.loginId),
        );
        if (
          liveUser &&
          JSON.stringify(liveUser) !== JSON.stringify(currentUser.data)
        ) {
          setCurrentUser((prev: any) => (prev ? { ...prev, data: liveUser } : null));
        }
      }
    } catch (err) {
      console.warn("User sync effect failed:", err);
    }
  }, [
    farmers,
    users,
    currentUser?.type,
    currentUser?.data?.id,
    currentUser?.data?.mobile,
    currentUser?.data?.loginId,
  ]);

  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => new Date());

  const updateSyncTime = () => {
    setLastSyncTime(new Date());
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Final Deep Deduplication
  const hasRunDeepDedupe = useRef(false);
  useEffect(() => {
    if (products.length > 0 && !hasRunDeepDedupe.current) {
      hasRunDeepDedupe.current = true;
      
      setTimeout(() => {
        const exactSeenSet = new Map<string, any>();
        const duplicatesToDelete: any[] = [];
        
        for (const p of products) {
          if (!p || !p.id || p.isDeleted) continue;
          
          const brand = (p.brandName || p.name || "").trim().toLowerCase();
          const company = (p.companyName || "").trim().toLowerCase();
          
          const cleanBrand = brand.replace(/[^a-z0-9]/g, '');
          const cleanCompany = company.replace(/[^a-z0-9]/g, '');
          
          if (!cleanBrand && !cleanCompany) continue;
          
          const exactKey = `${cleanBrand}_${cleanCompany}`;
          
          if (exactSeenSet.has(exactKey)) {
             const existing = exactSeenSet.get(exactKey);
             let keep = existing;
             let remove = p;
             
             if (existing.approvalStatus !== "approved" && p.approvalStatus === "approved") {
                 keep = p;
                 remove = existing;
             } else if (existing.id.startsWith("local_") && !p.id.startsWith("local_")) {
                 keep = p;
                 remove = existing;
             } else if (p.createdAt && existing.createdAt && new Date(p.createdAt) < new Date(existing.createdAt)) {
                 keep = p;
                 remove = existing;
             }
             
             exactSeenSet.set(exactKey, keep);
             duplicatesToDelete.push(remove);
          } else {
             exactSeenSet.set(exactKey, p);
          }
        }
        
        if (duplicatesToDelete.length > 0) {
          console.log(`Found ${duplicatesToDelete.length} duplicate products in Firestore. Deleting...`);
          const batchDelete = async () => {
            for (let i = 0; i < duplicatesToDelete.length; i += 20) {
              const chunk = duplicatesToDelete.slice(i, i + 20);
              await Promise.all(chunk.map(dup => deleteItem("products", dup.id).catch(() => {})));
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            console.log("Deduplication complete.");
          };
          batchDelete();
        }
      }, 8000); // Wait 8s for app to stabilize first
    }
  }, [products]);

  const handleManualSync = () => {
    setIsRefreshing(true);
    // The syncCollection already keeps things in sync, but this provides
    // visual feedback and a minor delay to ensure everything is settled.
    setTimeout(() => {
      setIsRefreshing(false);
      setLastSyncTime(new Date());
    }, 1000);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "weather":
        return <CloudRain className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
      case "disease":
        return (
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 animate-pulse" />
        );
      case "wind":
        return <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
      case "temp":
        return (
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
        );
      default:
        return (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        );
    }
  };

  const weatherAlerts = useMemo(() => {
    try {
      if (!alerts || alerts.length === 0) {
        return [{
          id: 'default',
          text: "VIONEX: सुरक्षित शेती, समृद्ध शेतकरी - नवीन हवामान अलर्टसाठी येथे लक्ष ठेवा.",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
        }];
      }

      // Filter logic similar to AlertsView for relevance
      let filtered = [...alerts];
      if (currentUser?.type === "farmer" && currentUser?.data) {
        const fState = (currentUser.data.state || "").toLowerCase().trim();
        const fDistrict = (currentUser.data.district || "").toLowerCase().trim();
        const fTaluka = (currentUser.data.taluka || "").toLowerCase().trim();

        filtered = filtered.filter(a => {
          if (!a || !a.targetScope || a.targetScope === "all") return true;
          
          const aState = (a.targetState || "").toLowerCase().trim();
          const aDistrict = (a.targetDistrict || "").toLowerCase().trim();
          const aTaluka = (a.targetTaluka || "").toLowerCase().trim();

          if (a.targetScope === "state") return fState === aState;
          if (a.targetScope === "district") return fDistrict === aDistrict;
          if (a.targetScope === "taluka") return fTaluka === aTaluka;
          return true;
        });
      }

      // Show last 5 relevant alerts, or last 48h if many.
      const now = Date.now();
      const limit = now - 48 * 60 * 60 * 1000;
      let displayAlerts = filtered.filter(a => {
        const time = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
        return time > limit;
      });

      if (displayAlerts.length === 0) {
        displayAlerts = filtered.slice(0, 3); // Fallback to last 3 if none in 48h
      }

      if (displayAlerts.length === 0) {
        return [{
          id: 'default',
          text: "सध्या आपल्या विभागासाठी कोणतीही नवीन सतर्कता नाही. पीक सुरक्षित आहे.",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
        }];
      }

      return displayAlerts.map((alert) => {
        const timeVal = alert?.createdAt;
        const time = typeof timeVal === 'number' ? timeVal : (timeVal ? new Date(timeVal).getTime() : 0);
        const displayTime = time > 0 
          ? `(दि. ${new Date(time).toLocaleDateString('mr-IN', { day: '2-digit', month: 'short' })})`
          : "";
        return {
          id: alert.id,
          text: `${alert?.text || ""} ${displayTime}`,
          icon: getAlertIcon(alert?.type),
        };
      });
    } catch (err) {
      console.warn("weatherAlerts memo error:", err);
      return [];
    }
  }, [alerts, currentUser, lastRefresh]);

  const [view, setView] = useState<
    | "dashboard"
    | "add"
    | "advice"
    | "add-farmer"
    | "add-product"
    | "add-schedule"
  >(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const v = urlParams.get('view');
      if (v === "dashboard" || v === "add" || v === "advice" || v === "add-farmer" || v === "add-product" || v === "add-schedule") {
        return v as any;
      }
    } catch (e) {}
    return "dashboard";
  });

  // Effect to listen for URL changes and update view/tab accordingly (Deep-linking)
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const v = urlParams.get('view');
        if (v === "dashboard" || v === "add" || v === "advice" || v === "add-farmer" || v === "add-product" || v === "add-schedule") {
          setView(v as any);
        }
        const tab = urlParams.get('tab');
        if (tab) {
          setActiveTab(tab);
        }
      } catch (e) {
        console.error("URL Change listener failed:", e);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const [language, setLanguage] = useState<"mr" | "en">(() => {
    const saved = localStorage.getItem("vionex-app-language");
    return (saved === "en" || saved === "mr") ? saved : "mr";
  });

  const toggleLanguage = useCallback(() => {
    const nextLang = language === "mr" ? "en" : "mr";
    setLanguage(nextLang);
    localStorage.setItem("vionex-app-language", nextLang);
  }, [language]);



  const [editingFarmerIndex, setEditingFarmerIndex] = useState<number | null>(
    null,
  );
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(
    null,
  );
  const [editingScheduleIndex, setEditingScheduleIndex] = useState<
    number | null
  >(null);
  const [prefilledSchedule, setPrefilledSchedule] = useState<any>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const navigateTo = (newView: typeof view) => {
    if (newView !== "add-farmer") setEditingFarmerIndex(null);
    if (newView !== "add-product") setEditingProductIndex(null);
    if (newView !== "add-schedule") setEditingScheduleIndex(null);

    setView(newView);
    window.history.pushState({ view: newView, activeTab }, "", "");
  };

  const handleBack = () => {
    setEditingFarmerIndex(null);
    setEditingProductIndex(null);
    setEditingScheduleIndex(null);
    setPrefilledSchedule(null);

    // If we're not already on the dashboard, navigate back through browser history.
    // The popstate listener will handle updating React states correctly.
    if (view !== "dashboard") {
      window.history.back();
    }
  };

  useEffect(() => {
    // Initialize history state on load
    if (!window.history.state) {
      window.history.replaceState(
        { view: "dashboard", activeTab: "dashboard" },
        "",
        "",
      );
    }

    const handlePopState = (event: PopStateEvent) => {
      setEditingFarmerIndex(null);
      setEditingProductIndex(null);
      setEditingScheduleIndex(null);
      setPrefilledSchedule(null);

      const state = event.state || {
        view: "dashboard",
        activeTab: "dashboard",
      };
      setView(state.view);
      if (state.activeTab) {
        setActiveTab(state.activeTab);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleUpdateUser = (userId: string, data: Partial<AppUser>) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      saveItem("users", { ...user, ...data }, userId);
    }
  };

  const handleUpdateFarmer = (farmerId: string, data: Partial<Farmer>) => {
    const farmer = farmers.find((f) => f.id === farmerId);
    if (farmer) {
      saveItem("farmers", { 
        ...farmer, 
        ...data, 
        createdBy: farmer.createdBy, 
        createdByUserId: farmer.createdByUserId || farmer.createdBy 
      }, farmerId);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const userName = users.find((u) => u.id === userId)?.name || "User";
    setDeleteConfirmation({
      isOpen: true,
      title: "Delete User?",
      message: `Are you sure you want to delete user ${userName}? This action cannot be undone.`,
      onConfirm: () => {
        deleteItem("users", userId);
        setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleAddAlert = (alertData: any) => {
    const newAlert = {
      ...alertData,
      createdAt: Date.now(),
    };
    saveItem("alerts", newAlert).then((newId) => {
      logUserActivity("create", "alert", alertData.title || alertData.text, newId || "new");
    });
  };

  const handleDeleteAlert = (id: string) => {
    const alertItem = alerts.find((a) => a.id === id);
    const entityName = alertItem?.title || alertItem?.text || "Alert";
    deleteItem("alerts", id).then(() => {
      logUserActivity("delete", "alert", entityName, id);
    });
  };

  const handleAddUser = async (userData: any) => {
    const docId = userData.id || undefined;
    const sanitizedUser = { ...userData };
    delete sanitizedUser.password; // Security: NEVER persist plaintext passwords to Firestore
    await saveItem("users", sanitizedUser, docId);

    // If a Firebase Auth UID is attached, synchronize their Firestore user mapping & admin status
    if (userData.id && db) {
      try {
        await setDoc(doc(db, "user_mappings", userData.id), {
          userId: userData.id,
          role: userData.role,
          loginId: userData.loginId,
        }, { merge: true });

        if (userData.role === "admin") {
          await setDoc(doc(db, "admins", userData.id), {
            email: userData.loginId,
            role: "admin",
            updatedAt: Date.now(),
          }, { merge: true });
        }
      } catch (err) {
        console.warn("Notice: Failed to sync user mapping / admin status:", err);
      }
    }
  };

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installAlertMessage, setInstallAlertMessage] = useState<string | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    try {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(!!standalone);
      
      const dismissed = localStorage.getItem("vionex-install-dismissed");
      // Show install banner if not standalone and not dismissed
      setShowInstallBanner(!standalone && dismissed !== "true");
    } catch (e) {}
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
    return outcome === "accepted";
  };

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const SHARED_APP_URL = HOSTING_URL || (typeof window !== "undefined" && window.location.origin ? window.location.origin : "");
    if (!SHARED_APP_URL) {
      alert("होस्टिंग लिंक अजून कॉन्फिगर केलेली नाही (Hosting URL not configured yet)");
      return;
    }
    try {
      navigator.clipboard.writeText(SHARED_APP_URL);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      // fallback
      const el = document.createElement('textarea');
      el.value = SHARED_APP_URL;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePWAInstallBannerClick = () => {
    setShowInstallModal(true);
  };

  const dismissInstallBanner = () => {
    localStorage.setItem("vionex-install-dismissed", "true");
    setShowInstallBanner(false);
  };

  const renderPWAInstallBanner = () => null; 
  

  const renderInstallModal = () => null; 
  

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab) return tab;
    } catch (e) {}
    
    const saved = localStorage.getItem("vionex-current-user");
    if (saved) {
      const user = (saved === "undefined" ? undefined : safeJsonParse(saved));
      if (user?.type === "farmer") return "schedule";
    }
    return "dashboard";
  });
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    let watcher: number | null = null;
    const isLocationFeatureActive = activeTab === "advice";

    const startWatching = () => {
      if ("geolocation" in navigator && isLocationFeatureActive && document.visibilityState === "visible") {
        if (watcher === null) {
          watcher = navigator.geolocation.watchPosition(
            (pos) => {
              setLocationCoords({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              });
            },
            (err) => {
              console.warn("GPS Access Denied or Unavailable:", err.message);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        }
      } else {
        stopWatching();
      }
    };

    const stopWatching = () => {
      if (watcher !== null) {
        navigator.geolocation.clearWatch(watcher);
        watcher = null;
      }
    };

    const handleVisibilityChange = () => {
      startWatching();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startWatching();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopWatching();
    };
  }, [activeTab]);

  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    // Only track active tab changes in history if we are currently looking at the dashboard.
    // If not, avoid pushing duplicate states over and over.
    const currentState = window.history.state;
    if (
      view === "dashboard" &&
      currentState &&
      currentState.activeTab !== activeTab
    ) {
      window.history.pushState({ view, activeTab }, "");
    }
  }, [view, activeTab]);

  const handleAddCrop = (crop: Crop) => {
    saveItem("crops", crop);
    handleBack();
  };

  const handleGetAdvice = (crop: Crop) => {
    setSelectedCrop(crop);
    navigateTo("advice");
  };

  const handleDeleteCrop = (id: string) => {
    deleteItem("crops", id);
  };

  const handleNavClick = useCallback((id: string) => {
    setActiveTab(id);
    setView("dashboard");
    setIsSidebarOpen(false);

    // Request notification permission asynchronously without blocking tab click
    if (typeof Notification !== 'undefined' && "Notification" in window && Notification.permission === "default") {
      setTimeout(() => {
        try {
          Notification.requestPermission();
        } catch (e) {}
      }, 500);
    }
  }, []);

  const isEn = language === "en";

  const navItems = useMemo(() => {
    return [
      { id: "dashboard", label: isEn ? "Dashboard" : "डॅशबोर्ड", icon: LayoutDashboard }, // Always visible for admin/users
      { id: "farmers", label: isEn ? "Farmers" : "शेतकरी", icon: Users },
      { id: "schedule", label: isEn ? "Schedules" : "वेळापत्रक", icon: Calendar },
      { id: "advice", label: isEn ? "AI Advice" : "हवामान सल्ला (AI)", icon: CloudRain }, // Mapped to 'weather' or 'alerts' permission
      { id: "products", label: isEn ? "Products" : "उत्पादने", icon: Package },
      { id: "dealers", label: isEn ? "Dealers" : "डीलर", icon: Store },
      { id: "consultants", label: isEn ? "Consultants" : "कन्सल्टंट", icon: UserCheck },
      { id: "masterSchedules", label: isEn ? "Master Schedules" : "मास्टर शेड्युल", icon: CalendarDays },
      { id: "settings", label: "Settings", icon: Settings }, // Filterable settings
      { id: "location-mapping", label: isEn ? "Location Mapping" : "लोकेशन मॅपिंग", icon: MapPin },
      { id: "admin", label: isEn ? "Admin" : "ऍडमिन", icon: Shield },
    ].filter((item) => {
      if (currentUser?.type === "farmer") {
        return item.id === "dashboard" || item.id === "schedule" || item.id === "settings" || item.id === "advice" || item.id === "products" || item.id === "dealers";
      }

      // For normal users, check permissions
      if (currentUser?.type === "user" && currentUser.data?.role !== "admin") {
        const perms = currentUser.data?.permissions;
        if (!perms) return false;

        if (item.id === "farmers" && !perms.farmers) return false;
        if (item.id === "schedule" && !perms.schedules) return false;
        if (item.id === "advice" && !perms.weather && !perms.alerts) return false;
        if (item.id === "products" && !perms.products) return false;
        if (item.id === "dealers" && (!perms.dealers || currentUser.data?.role === "user")) return false;
        if (item.id === "consultants" && !perms.consultants) return false;
        if (item.id === "masterSchedules" && !perms.masterSchedules) return false;
        if (item.id === "settings" && !perms.settings) return false;
        if (item.id === "admin" && !perms.userManagement) return false; // Users never see admin tab unless given roles / userManagement

        return true; // the rest (dashboard) are visible
      }

      // For admin, everything is visible
      return true;
    });
  }, [currentUser?.type, currentUser?.data?.permissions, currentUser?.data?.role, isEn]);

  // Automatically redirect user to dashboard if their active tab is disabled by admin
  useEffect(() => {
    if (
      currentUser &&
      currentUser.type === "user" &&
      currentUser.data?.role !== "admin"
    ) {
      const allowedIds = navItems.map((item) => item.id);
      if (!allowedIds.includes(activeTab)) {
        setActiveTab("dashboard");
      }
    }
  }, [currentUser?.data?.permissions, activeTab, navItems]);

  const handleUserLogin = async (
    userId: string,
    pass: string,
  ): Promise<"success" | "pending" | "created" | "wrong_password"> => {
    const cleanId = userId.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. If an email is entered and Firebase Auth is available, authenticate via Firebase Authentication
    if (auth && (cleanId.includes("@") || (NEW_ADMIN_EMAIL && cleanId === NEW_ADMIN_EMAIL.toLowerCase()))) {
      setExplicitAuthInProgress(true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanId, cleanPass);
        const fbUser = userCredential.user;

        // Cryptographic verification: is this account the designated super-admin email?
        const isSuperAdmin = Boolean(
          NEW_ADMIN_EMAIL && 
          fbUser.email && 
          fbUser.email.toLowerCase() === NEW_ADMIN_EMAIL.toLowerCase()
        );

        // Check if user has an existing verified entry in the server-side admins collection
        let isExistingAdmin = false;
        if (db && fbUser.uid && !isSuperAdmin) {
          try {
            const adminDocSnap = await getDoc(doc(db, "admins", fbUser.uid));
            if (adminDocSnap.exists()) {
              isExistingAdmin = true;
            }
          } catch (e) {
            console.warn("Could not check admins collection:", e);
          }
        }

        let userDoc: AppUser | null = users.find(
          (u) => u.loginId && u.loginId.toLowerCase() === cleanId,
        ) || null;

        if (!userDoc && db) {
          try {
            // 1. Direct document fetch by UID (works under strict owner-only rule request.auth.uid == userId)
            if (fbUser.uid) {
              const docSnap = await getDoc(doc(db, "users", fbUser.uid));
              if (docSnap.exists()) {
                userDoc = { ...(docSnap.data() as any), id: docSnap.id } as AppUser;
              }
            }
            // 2. Query fallback for admins
            if (!userDoc && (isSuperAdmin || isExistingAdmin)) {
              const q = query(
                collection(db, "users"),
                where("loginId", "==", cleanId),
              );
              const snap = await getDocsSafe(q, 3000);
              if (!snap.empty) {
                userDoc = { ...(snap.docs[0].data() as any), id: snap.docs[0].id } as AppUser;
              }
            }
          } catch (qErr) {
            console.warn("Could not query user doc from Firestore:", qErr);
          }
        }

        // ONLY elevate to admin if cryptographically verified as super-admin OR existing in admins collection
        if (isSuperAdmin || isExistingAdmin) {
          const adminProfile: AppUser = userDoc || {
            id: fbUser.uid || "admin-fixed",
            name: NEW_ADMIN_DISPLAY_NAME || fbUser.displayName || "Admin",
            loginId: cleanId,
            role: "admin",
            status: "approved",
            permissions: {
              farmers: true,
              schedules: true,
              products: true,
              dealers: true,
              consultants: true,
              weather: true,
              allCrops: true,
              solutions: true,
              masterSchedules: true,
              autoApproveSchedules: true,
              manageProducts: true,
              userManagement: true,
              reportsView: true,
              exportExcelPdf: true,
              dashboardView: true,
              syncData: true,
              canCancel: true,
              canMarkDone: true,
              farmerAdd: true,
              farmerEdit: true,
              farmerDelete: true,
              dealerAdd: true,
              dealerEdit: true,
              dealerDelete: true,
              productView: true,
              productAdd: true,
              productEdit: true,
              productDelete: true,
              orderCreate: true,
              orderEdit: true,
              paymentEntry: true,
              collectionEntry: true,
              settings: true,
              alerts: true,
            },
            paidStatus: "paid",
            access: true,
          };

          // Synchronize user mapping & admin records in Firestore
          if (db && fbUser.uid) {
            try {
              await setDoc(doc(db, "user_mappings", fbUser.uid), {
                userId: adminProfile.id,
                role: "admin",
                loginId: cleanId,
              }, { merge: true });

              if (isSuperAdmin) {
                await setDoc(doc(db, "admins", fbUser.uid), {
                  email: cleanId,
                  role: "admin",
                  updatedAt: Date.now(),
                }, { merge: true });
              }

              await saveItem("users", adminProfile, adminProfile.id);
            } catch (syncErr) {
              console.warn("Notice: could not update Firestore admin mapping:", syncErr);
            }
          }

          setCurrentUser({ type: "user", data: adminProfile });
          return "success";
        }

        // Standard user signed in via Firebase Auth (Clients can NEVER self-assign admin)
        if (userDoc) {
          if (userDoc.access === false || userDoc.status === "pending") {
            return "pending";
          }
          if (db && fbUser.uid) {
            // Guard: Force non-admin role so user_mappings write complies with security rules
            const safeRole = userDoc.role === "admin" ? "user" : (userDoc.role || "user");
            setDoc(doc(db, "user_mappings", fbUser.uid), {
              userId: userDoc.id,
              role: safeRole,
              loginId: userDoc.loginId,
            }, { merge: true }).catch((err) => console.warn("Failed to set user mapping", err));
          }
          setCurrentUser({ type: "user", data: userDoc });
          return "success";
        }

        // Authenticated in Firebase Auth but no profile exists and not admin
        return "wrong_password";
      } catch (authErr: any) {
        console.warn("Firebase Auth sign-in result:", authErr?.code || authErr?.message);
        if (
          authErr?.code === "auth/wrong-password" ||
          authErr?.code === "auth/invalid-credential" ||
          authErr?.code === "auth/user-not-found" ||
          authErr?.code === "auth/invalid-email"
        ) {
          return "wrong_password";
        }
        // If network error (offline), fall through to cached local users check
      } finally {
        setExplicitAuthInProgress(false);
      }
    }

    // 2. Fallback / Offline / Local Users Lookup
    let matchedUser = users.find(
      (u) => u.loginId && u.loginId.toLowerCase() === cleanId,
    );
    if (!matchedUser) {
      if (!navigator.onLine) {
        try {
          const allSnap = await getDocsFromCache(collection(db, "users"));
          const matchedDoc = allSnap.docs.find((doc) => {
            const data = doc.data();
            return data?.loginId && data.loginId.toLowerCase() === cleanId;
          });
          if (matchedDoc) {
            matchedUser = { ...(matchedDoc.data() as any), id: matchedDoc.id } as AppUser;
          }
        } catch (e) {
          console.error("Cache lookup failed", e);
        }
        if (!matchedUser) return "wrong_password";
      }

      try {
        const q = query(
          collection(db, "users"),
          where("loginId", "==", cleanId),
        );
        const snap = await getDocsSafe(q, 3000);
        if (!snap.empty) {
          const doc = snap.docs[0];
          matchedUser = { ...(doc.data() as any), id: doc.id } as AppUser;
        }
      } catch (err) {
        console.error("Error querying user directly:", err);
      }
    }

    if (matchedUser) {
      if (matchedUser.password && matchedUser.password !== cleanPass) {
        return "wrong_password";
      }
      if (matchedUser.access === false || matchedUser.status === "pending") {
        return "pending";
      }

      if (auth?.currentUser?.uid && db) {
        setDoc(doc(db, "user_mappings", auth.currentUser.uid), {
          userId: matchedUser.id,
          role: matchedUser.role,
          loginId: matchedUser.loginId,
        }, { merge: true }).catch((err) => console.warn("Failed to set user mapping", err));
      }

      setCurrentUser({ type: "user", data: matchedUser });
      return "success";
    }

    // New users can only be created by an Admin. Prevent automatic self-registration upon login.
    return "wrong_password";
  };

  const handleFarmerLogin = async (
    mobile: string,
    pass: string,
  ): Promise<
    "success" | "pending" | "created" | "wrong_password" | "denied"
  > => {
    const cleanMobile = mobile.trim();
    const cleanPass = pass.trim();

    let matchedFarmer = (farmers || []).find((f) => {
      const fMobile = f?.mobile ? f.mobile.toString().trim() : "";
      return fMobile === cleanMobile;
    });

    if (!matchedFarmer) {
      
      if (!navigator.onLine) {
        // Try searching in the cache instead of returning denied
        try {
          
          const allSnap = await getDocsFromCache(collection(db, "farmers"));
          const cleanDigits = cleanMobile.replace(/\D/g, "");
          const mob10 = cleanDigits.slice(-10);
          const matchedDoc = allSnap.docs.find((doc) => {
            const data = doc.data();
            const fMobile = data?.mobile ? data.mobile.toString().replace(/\D/g, "").slice(-10) : "";
            return fMobile && fMobile === mob10;
          });
          if (matchedDoc) {
            matchedFarmer = { ...(matchedDoc.data()), id: matchedDoc.id };
          }
        } catch (e) {
          console.error("Cache lookup failed", e);
        }
        if (!matchedFarmer) return "denied";
      }

      try {
        const cleanDigits = cleanMobile.replace(/\D/g, "");
        const mob10 = cleanDigits.slice(-10);

        const possibleMobileVariants = [cleanMobile];
        if (cleanDigits && !possibleMobileVariants.includes(cleanDigits)) possibleMobileVariants.push(cleanDigits);
        if (mob10 && !possibleMobileVariants.includes(mob10)) possibleMobileVariants.push(mob10);
        if (mob10 && !possibleMobileVariants.includes(`91${mob10}`)) possibleMobileVariants.push(`91${mob10}`);
        if (mob10 && !possibleMobileVariants.includes(`+91${mob10}`)) possibleMobileVariants.push(`+91${mob10}`);
        if (mob10 && !possibleMobileVariants.includes(`0${mob10}`)) possibleMobileVariants.push(`0${mob10}`);

        const q = query(
          collection(db, "farmers"),
          where("mobile", "in", possibleMobileVariants.filter(Boolean)),
        );
        const snap = await getDocsSafe(q, 3000);
        if (!snap.empty) {
          const doc = snap.docs[0];
          matchedFarmer = { ...(doc.data() as any), id: doc.id } as any;
        }

        // Deep fallback: if in-clause search fails, load all farmers and match purely on raw 10-digit suffixes
        if (!matchedFarmer && mob10) {
          const allSnap = await getDocsSafe(collection(db, "farmers"), 3000);
          const matchedDoc = allSnap.docs.find((doc) => {
            const data = doc.data() as any;
            const fMobile = data?.mobile ? data.mobile.toString().replace(/\D/g, "").slice(-10) : "";
            return fMobile && fMobile === mob10;
          });
          if (matchedDoc) {
            matchedFarmer = { ...(matchedDoc.data() as any), id: matchedDoc.id } as any;
            console.log("Matched pre-existing farmer via robust 10-digit suffix fallback:", matchedFarmer?.name);
          }
        }
      } catch (err) {
        console.error("Error querying farmer directly:", err);
      }
    }

    if (matchedFarmer) {
      if (matchedFarmer.access === false) return "denied";
      if (matchedFarmer.password && matchedFarmer.password !== cleanPass) {
        return "wrong_password";
      }
      const approvedFarmer = { ...matchedFarmer };
      await saveItem("farmers", approvedFarmer, matchedFarmer.id);
      setCurrentUser({ type: "farmer", data: approvedFarmer });
      setActiveTab("schedule");
      return "success";
    }

    // Prevent automatic self-registration of farmers. Only Admin-created farmers can log in.
    return "denied";
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await auth.signOut();
      } catch (e) {
        console.warn("SignOut error:", e);
      }
      // Re-establish anonymous session immediately so non-logged-in visitor access continues uninterrupted
      ensureAnonymousAuth().catch((e) => console.warn("Restore anonymous auth notice:", e));
    }
    setCurrentUser(null);
  };

  const isFarmer = currentUser?.type === "farmer";
  const isUnpaidFarmer = isFarmer && currentUser?.data?.paidStatus === "unpaid";

  const getCreatorId = () => {
    if (currentUser?.type === "admin") return "admin";
    if (currentUser?.type === "user") return currentUser?.data?.id || "unknown";
    if (currentUser?.type === "farmer")
      return currentUser?.data?.id || "unknown";
    return "unknown";
  };
  const isAdminOrAdminRole =
    currentUser?.type === "admin" ||
    (currentUser?.type === "user" && currentUser?.data?.role === "admin");
  const currentCreatorId = getCreatorId();
  const currentAuthUid = auth?.currentUser?.uid || currentCreatorId;

  const logUserActivity = (
    action: "create" | "update" | "delete",
    type: "farmer" | "product" | "schedule" | "alert" | "dealer",
    entityName: string,
    entityId: string,
  ) => {
    if (!currentUser) return;
    const userName = currentUser?.data?.name || "शेतकरी";
    const userRole =
      currentUser?.type === "admin"
        ? "admin"
        : currentUser?.data?.role || "user";

    let details = "";
    if (type === "farmer") {
      if (action === "create")
        details = `नवीन शेतकरी "${entityName}" जोडला (Added farmer)`;
      else if (action === "update")
        details = `शेतकरी "${entityName}" चे तपशील अपडेट केले (Updated farmer)`;
      else if (action === "delete")
        details = `शेतकरी "${entityName}" हटवला (Deleted farmer)`;
    } else if (type === "product") {
      if (action === "create")
        details = `नवीन उत्पादन "${entityName}" जोडले (Added product)`;
      else if (action === "update")
        details = `उत्पादन "${entityName}" चे तपशील अपडेट केले (Updated product)`;
      else if (action === "delete")
        details = `उत्पादन "${entityName}" हटवले (Deleted product)`;
    } else if (type === "schedule") {
      if (action === "create")
        details = `नवीन वेळापत्रक "${entityName}" तयार केले (Added schedule)`;
      else if (action === "update")
        details = `वेळापत्रक "${entityName}" अपडेट केले (Updated schedule)`;
      else if (action === "delete")
        details = `वेळापत्रक "${entityName}" हटवले (Deleted schedule)`;
    } else if (type === "alert") {
      if (action === "create")
        details = `नवीन सतर्कता संदेश प्रसिद्ध केला: "${entityName}"`;
      else if (action === "delete")
        details = `सतर्कता संदेश हटवला: "${entityName}"`;
    } else if (type === "dealer") {
      if (action === "create")
        details = `नवीन डीलर "${entityName}" जोडला (Added dealer)`;
      else if (action === "update")
        details = `डीलर "${entityName}" चे तपशील अपडेट केले (Updated dealer)`;
      else if (action === "delete")
        details = `डीलर "${entityName}" हटवला (Deleted dealer)`;
    }

    const logEntry = {
      action,
      type,
      entityId,
      entityName,
      userName,
      userRole,
      details,
      timestamp: Date.now(),
      createdBy: currentCreatorId,
    };

    saveItem("activity-logs", logEntry);
  };

  const displayActivityLogs = useMemo(() => {
    return [...activityLogs].sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
    );
  }, [activityLogs]);

  const displayProducts = useMemo(() => {
    const uniqueList: any[] = [];
    const exactSeenSet = new Set<string>();

    for (const p of healedProducts) {
      if (!p || p.isDeleted) continue;

      const brand = (p.brandName || p.name || "").trim().toLowerCase();
      const company = (p.companyName || "").trim().toLowerCase();
      const comp = (p.composition || p.activeIngredients || "").trim().toLowerCase();

      // 1. O(1) Exact Match Check
      const exactKey = `${brand.replace(/[^a-z0-9]/g, '')}_${company.replace(/[^a-z0-9]/g, '')}_${comp.replace(/[^a-z0-9]/g, '')}`;
      if (exactSeenSet.has(exactKey)) {
        continue;
      }

      uniqueList.push(p);
      exactSeenSet.add(exactKey);
    }
    return uniqueList;
  }, [healedProducts]);

  const displayFarmersForSchedule = useMemo(() => {
    const activeFarmers = (farmers || []).filter((f) => f && !f.isDeleted);
    const isConsultant = currentUser?.type === "user" && currentUser?.data?.role === "consultant";
    if (isAdminOrAdminRole || isConsultant) return activeFarmers;
    
    // Create a set of farmer IDs created by the current user according to activity logs
    const loggedFarmerIds = new Set<string>();
    if (Array.isArray(activityLogs)) {
      for (const log of activityLogs) {
        if (
          log &&
          log.action === "create" &&
          log.type === "farmer" &&
          log.entityId &&
          log.createdBy === currentCreatorId
        ) {
          loggedFarmerIds.add(log.entityId);
        }
      }
    }

    return activeFarmers.filter((f) => {
      if (!f) return false;
      return (
        f.createdBy === currentCreatorId ||
        (f.createdByUserId && f.createdByUserId === currentCreatorId) ||
        loggedFarmerIds.has(f.id) ||
        (f.linkedUsers && f.linkedUsers.includes(currentCreatorId))
      );
    });
  }, [farmers, isAdminOrAdminRole, currentCreatorId, activityLogs]);

  const displayDealers = useMemo(() => {
    return (dealers || []).filter((d) => d && !d.isDeleted);
  }, [dealers]);

  const filteredSchedules = useMemo(() => {
    if (isFarmer && isUnpaidFarmer) return [];
    const activeSchedules = (healedSchedules || []).filter((s) => s && !s.isDeleted);
    if (isFarmer) {
      const mob = currentUser?.data?.mobile ? String(currentUser.data.mobile).trim() : "";
      const cleanMob = mob.replace(/\D/g, "");
      const mob10 = cleanMob.slice(-10);
      const fId = String(currentUser?.data?.id || "").trim();
      const fName = String(currentUser?.data?.name || "").trim().toLowerCase();

      const possibleFarmerIds = Array.from(new Set([
        fId,
        mob,
        cleanMob,
        mob10,
        mob10 ? `91${mob10}` : "",
        mob10 ? `+91${mob10}` : "",
        mob10 ? `0${mob10}` : ""
      ].filter(Boolean))).map(id => String(id).trim());

      return activeSchedules.filter((s) => {
        if (!s) return false;
        
        // 1. Direct match with any possible farmer ID combination (Robust string comparison)
        const sFarmerId = String(s.farmerId || "").trim();
        if (sFarmerId && possibleFarmerIds.includes(sFarmerId)) {
          return true;
        }

        // 2. Safe string extraction fallback (only if farmerId looks like a pure mobile number)
        if (sFarmerId && !sFarmerId.toLowerCase().startsWith("farmer-")) {
          const sMob10 = sFarmerId.replace(/\D/g, "").slice(-10);
          if (sMob10 && sMob10 === mob10) return true;
        }

        // 3. Name-based match fallback (extremely defensive)
        if (fName && s.farmerName && String(s.farmerName).trim().toLowerCase() === fName) {
           return true; 
        }

        return false;
      });
    }
    // Normal User or Admin
    if (isAdminOrAdminRole) return activeSchedules;

    // Create a set of schedule IDs created by the current user according to activity logs
    const loggedScheduleIds = new Set<string>();
    if (Array.isArray(activityLogs)) {
      for (const log of activityLogs) {
        if (
          log &&
          log.action === "create" &&
          log.type === "schedule" &&
          log.entityId &&
          log.createdBy === currentCreatorId
        ) {
          loggedScheduleIds.add(log.entityId);
        }
      }
    }

    return activeSchedules.filter((s) => {
      if (!s) return false;
      return (
        s.createdBy === currentCreatorId ||
        (s.createdByUserId && s.createdByUserId === currentCreatorId) ||
        loggedScheduleIds.has(s.id)
      );
    });
  }, [
    healedSchedules,
    isFarmer,
    isUnpaidFarmer,
    currentUser,
    isAdminOrAdminRole,
    currentCreatorId,
    activityLogs,
  ]);

  // Helper to play highly pleasant WhatsApp-like double beep chime
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (time: number, freq: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration - 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      const now = audioCtx.currentTime;
      playBeep(now, 880, 0.12);
      playBeep(now + 0.15, 880, 0.12);
    } catch (error) {
      console.error("Audio chime failed to play", error);
    }
  };

  const showBrowserNotification = (title: string, body: string, targetUrl?: string) => {
    try {
      // Play sound chime for instant audio feedback
      playNotificationSound();

      if (typeof Notification === 'undefined') return;
      if (Notification.permission === 'granted') {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(registration => {
            const options: any = {
              body,
              icon: "/icon-192.png",
              badge: "/icon-192.png",
              tag: 'vionex-notif',
              renotify: true,
              vibrate: [200, 100, 200, 100, 200], // Stronger vibration
              requireInteraction: true,
              data: {
                url: targetUrl || window.location.origin + (currentUser?.type === 'farmer' ? '?view=dashboard&tab=dashboard' : '')
              }
            };
            registration.showNotification(title, options).catch(() => {});
          }).catch(() => {});
        } else {
          try {
            new Notification(title, { 
              body, 
              icon: "/icon-192.png",
              tag: 'vionex-notif',
              renotify: true,
              vibrate: [200, 100, 200] 
            } as any);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("Notification system error:", err);
    }
  };

  const isInitialSchedulesLoaded = useRef(false);
  const isInitialAlertsLoaded = useRef(false);

  useEffect(() => {
    if (!isFarmer || !currentUser?.data || !filteredSchedules || filteredSchedules.length === 0) {
      setUnreadSchedules([]);
      setUnreadCount(0);
      return;
    }

    // Determine which schedules have updates or are new
    const unread = filteredSchedules.filter((s) => {
      if (!s || !s.id) return false;
      const seenTimeStr = localStorage.getItem(`vionex_seen_time_${s.id}`);
      if (!seenTimeStr) {
        // Not seen yet
        return true;
      }
      const seenTime = parseInt(seenTimeStr, 10) || 0;
      const lastUpdateTime = s.updatedAt || s.createdAt || 0;
      return lastUpdateTime > seenTime;
    });

    setUnreadSchedules(unread);
    setUnreadCount(unread.length);

    // Only beep if the schedules have loaded initially (to prevent initial bleep on startup)
    if (isInitialSchedulesLoaded.current) {
      if (unread.length > 0) {
        const lastUnreadBeepStr = localStorage.getItem("vionex_last_beep_time") || "0";
        const lastUnreadBeep = parseInt(lastUnreadBeepStr, 10);
        // Get the latest updatedAt timestamp among unreads
        const latestUpdate = Math.max(...unread.map(u => u.updatedAt || u.createdAt || 0));
        
        if (latestUpdate > lastUnreadBeep) {
          playNotificationSound();
          showBrowserNotification(
            "नवीन वेळापत्रक अपडेट (New Schedule)",
            `${unread.length} नवीन अपडेट्स तुमच्यासाठी उपलब्ध आहेत. टॅप करून पहा.`
          );
          localStorage.setItem("vionex_last_beep_time", latestUpdate.toString());
        }
      }
    } else {
      // Allow a small delay before arming the sound beep, once records load initially
      const timer = setTimeout(() => {
        isInitialSchedulesLoaded.current = true;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [filteredSchedules, isFarmer, currentUser]);

  // Auto-logout on access revocation
  useEffect(() => {
    if (alerts.length > 0) {
      if (isInitialAlertsLoaded.current) {
        const lastSeenAlertTime = parseInt(localStorage.getItem("vionex_last_alert_time") || "0");
        const sortedAlerts = [...alerts].sort((a, b) => b.createdAt - a.createdAt);
        const latestAlert = sortedAlerts[0];
        
        if (latestAlert && latestAlert.createdAt > lastSeenAlertTime) {
          showBrowserNotification("VIONEX Alert (सूचना)", latestAlert.text);
          localStorage.setItem("vionex_last_alert_time", latestAlert.createdAt.toString());
        }
      } else {
        const sortedAlerts = [...alerts].sort((a, b) => b.createdAt - a.createdAt);
        if (sortedAlerts.length > 0) {
          localStorage.setItem("vionex_last_alert_time", sortedAlerts[0].createdAt.toString());
        }
        isInitialAlertsLoaded.current = true;
      }
    }
  }, [alerts]);

  // Auto-logout on access revocation
  useEffect(() => {
    if (isFarmer && currentUser?.data?.id) {
      const currentFarmer = farmers.find((f) => f.id === currentUser.data.id);
      if (currentFarmer && currentFarmer.access === false) {
        handleLogout();
      }
    }
  }, [isFarmer, currentUser, farmers]);



  // Check if accessing any public portal / form view
  const isPublicRoute = typeof window !== "undefined" && (() => {
    const sp = new URLSearchParams(window.location.search);
    const hp = new URLSearchParams(window.location.hash.includes("?") ? window.location.hash.substring(window.location.hash.indexOf("?")) : window.location.hash.replace("#", "?"));
    const v = (sp.get("view") || hp.get("view") || "").toLowerCase();
    const t = (sp.get("type") || hp.get("type") || "").toLowerCase();
    return (
      v === "portal" ||
      v === "public-form" ||
      v === "public_form" ||
      v === "public" ||
      v === "register-dealer" ||
      v === "register_dealer" ||
      t === "dealer" ||
      t === "consultant"
    );
  })();

  if (isPublicRoute) {
    const v = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("view") || "").toLowerCase() : "";
    if (v === "register-dealer" || v === "register_dealer") {
      return <StandaloneDealerForm />;
    }
    return <PublicFormGateway />;
  }

  if (!currentUser) {
    // Check URL parameters for login type pre-selection
    let initialType: "farmer" | "user" | null = null;
    let initialMobile: string = "";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");
      const mobile = params.get("mobile");
      if (type === "farmer" || type === "user") {
        initialType = type as any;
      }
      if (mobile) {
        initialMobile = mobile;
      }
    }
    return (
      <LoginScreen
        defaultType={initialType}
        defaultMobile={initialMobile}
        onUserLogin={handleUserLogin}
        onFarmerLogin={handleFarmerLogin}
      />
    );
  }

    return (
    <div className="h-[100dvh] bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden relative">
      {/* Top Navigation */}
      {view !== "add-farmer" &&
        view !== "add-product" &&
        view !== "add-schedule" && (
          <header className="h-16 bg-emerald-800 text-white flex items-center justify-between px-4 shrink-0 shadow-lg z-20">
            <div className="flex items-center gap-2">
              <button
                className="p-2 -ml-1 hover:bg-emerald-700/50 rounded-lg transition-colors"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleNavClick("dashboard")}
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-emerald-800 text-xs font-black shrink-0 shadow-sm border border-emerald-100">
                  vx
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tight leading-none text-white">
                    <span className="font-mono lowercase tracking-wider">
                      vionex
                    </span>
                    <span className="text-[10px] text-emerald-100 font-medium ml-1">
                      {isEn ? "(vionex)" : "(व्ही ऑ नेक्स)"}
                    </span>
                  </h1>
                  <p className="text-[8px] text-emerald-200/70 tracking-widest leading-none mt-0.5 uppercase font-medium">
                    VISION BEYOND LIMITS
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleManualSync}
                className="p-2 hover:bg-emerald-700/50 rounded-lg transition-colors"
                title="Refresh"
              >
                <div
                  className={`w-5 h-5 border-2 border-emerald-200/30 border-t-emerald-100 rounded-full ${isRefreshing ? "animate-spin" : ""}`}
                ></div>
              </button>
              <button
                onClick={toggleLanguage}
                className="px-2 py-1 hover:bg-emerald-700/50 rounded text-[10px] font-bold border border-emerald-600/50 min-w-[32px] transition-colors"
                title={language === "en" ? "मराठी व्हर्जनवर जा" : "Switch to English"}
              >
                {language === "en" ? "MR" : "EN"}
            </button>
              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="p-2 ml-1 hover:bg-red-700/30 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-emerald-200" />
                </button>
              )}
            </div>
          </header>
        )}

      {/* Global Weather Alerts Ticker for Admin Layout */}
      {view !== "add-farmer" &&
        view !== "add-product" &&
        view !== "add-schedule" && (
          <div className="bg-amber-50 border-b border-amber-100 overflow-hidden py-1.5 px-3 relative shrink-0">
            <div className="flex items-center gap-2 absolute left-1 px-3 py-1 bg-amber-50 z-10 border-r border-amber-100">
              <AlertTriangle className="w-3 h-3 text-amber-600 animate-pulse" />
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-tight">
                {isEn ? "ALERTS:" : "सतर्कता:"}
              </span>
            </div>
            <div className="whitespace-nowrap overflow-hidden">
              <div className="inline-block animate-marquee pl-[100px]">
                {weatherAlerts?.map((alert, i) => (
                  <span key={i} className="inline-flex items-center gap-2 mx-4">
                    {alert?.icon}
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                      {alert?.text}
                    </span>
                    <span className="text-amber-300 mx-2">•</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen &&
          view !== "add-farmer" &&
          view !== "add-product" &&
          view !== "add-schedule" && (
            <div
              className="fixed inset-0 bg-slate-900/50 z-30 md:hidden transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

        {/* Sidebar */}
        {view !== "add-farmer" &&
          view !== "add-product" &&
          view !== "add-schedule" && (
            <aside
              className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 overflow-y-auto z-40 transform transition-transform duration-200 ease-in-out md:transform-none ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} shadow-xl md:shadow-sm shrink-0 flex flex-col print:hidden`}
            >
              <div className="md:hidden p-4 flex justify-end border-b border-slate-100">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`}
                      />
                      {item.label}
                    </button>
                  );
                })}

              </nav>
              <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all font-black text-sm border border-red-100"
                >
                  <LogOut className="w-5 h-5" />
                  <span>लॉग आउट (Logout)</span>
                </button>
                <div className="text-[10px] text-slate-400 font-bold text-center pt-2 italic">
                  VIONEX Smart Farming v2.1
                </div>
              </div>
            </aside>
          )}

        {/* Content Area */}
        <main
          className={`flex-1 flex flex-col w-full overflow-y-auto ${
            view === "add-farmer" ||
            view === "add-product" ||
            view === "add-schedule"
              ? "p-0 gap-0"
              : "max-w-7xl mx-auto gap-4 p-4 md:p-6"
          }`}
        >
          
          {showInstallBanner && renderPWAInstallBanner()}
          {view === "dashboard" && activeTab === "dashboard" && (
            <LocalErrorBoundary featureName="मुख्य डॅशबोर्ड (Dashboard)">
              <Dashboard
                onNavigate={handleNavClick}
                toggleLanguage={toggleLanguage}
                isFarmer={isFarmer}
                allowedNavIds={navItems.map((item) => item.id)}
                language={language}
              />
            </LocalErrorBoundary>
          )}

          {view === "add" && (
            <LocalErrorBoundary featureName="नवीन पीक जोडा (Add Crop)">
              <AddCrop onSave={handleAddCrop} onCancel={handleBack} />
            </LocalErrorBoundary>
          )}

          {view === "advice" && selectedCrop && (
            <LocalErrorBoundary featureName="पीक सल्ला (Advisory View)">
              <AdvisoryView
                crop={selectedCrop}
                alerts={alerts}
                onBack={() => {
                  handleBack();
                  setSelectedCrop(null);
                }}
              />
            </LocalErrorBoundary>
          )}

          {view === "add-farmer" && (
            <LocalErrorBoundary featureName="नवीन शेतकरी जोडा (Add Farmer Form)">
              <AddFarmerForm
                initialData={
                  editingFarmerIndex !== null
                    ? displayFarmersForSchedule[editingFarmerIndex]
                    : undefined
                }
                farmers={farmers}
                dealers={displayDealers}
                onSave={(data) => {
                  if (editingFarmerIndex !== null) {
                    const originalFarmer = displayFarmersForSchedule[editingFarmerIndex];
                    const id = originalFarmer.id;
                    const saveData = {
                      ...data,
                      createdBy: originalFarmer.createdBy || data.createdBy || currentAuthUid,
                      createdByUserId: originalFarmer.createdByUserId || data.createdByUserId || currentAuthUid,
                      approvalStatus: isAdminOrAdminRole ? "approved" : "pending",
                    };
                    saveItem("farmers", saveData, id);
                    logUserActivity("update", "farmer", saveData.name, id);
                  } else {
                    // Check if duplicate farmer already exists based on mobile or name/location comparison (even if isDeleted is true)
                    const existingFarmer = (farmers || []).find((f) => {
                      if (!f) return false;
                      
                      // Match by mobile
                      const fMob = f.mobile ? String(f.mobile).replace(/\D/g, "").slice(-10) : "";
                      const dMob = data.mobile ? String(data.mobile).replace(/\D/g, "").slice(-10) : "";
                      const isMobileDuplicate = fMob && dMob && fMob.length >= 10 && fMob === dMob;

                      // Match by name and location (village + taluka)
                      const fName = f.name ? f.name.trim().toLowerCase() : "";
                      const dName = data.name ? data.name.trim().toLowerCase() : "";
                      const isNameDuplicate = fName && dName && fName === dName;

                      const fVillage = f.village ? f.village.trim().toLowerCase() : "";
                      const dVillage = data.village ? data.village.trim().toLowerCase() : "";
                      
                      const fTaluka = f.taluka ? f.taluka.trim().toLowerCase() : "";
                      const dTaluka = data.taluka ? data.taluka.trim().toLowerCase() : "";

                      const isLocationDuplicate = fVillage && dVillage && fVillage === dVillage && fTaluka && dTaluka && fTaluka === dTaluka;

                      return isMobileDuplicate || (isNameDuplicate && isLocationDuplicate);
                    });

                    if (existingFarmer) {
                      const currentLinks = existingFarmer.linkedUsers || [];
                      if (!currentLinks.includes(currentAuthUid)) {
                        currentLinks.push(currentAuthUid);
                      }
                      const updatedFarmer = {
                        ...existingFarmer,
                        ...data,
                        linkedUsers: currentLinks,
                        createdBy: existingFarmer.createdBy || currentAuthUid,
                        createdByUserId: existingFarmer.createdByUserId || existingFarmer.createdBy || currentAuthUid,
                        id: existingFarmer.id,
                        isDeleted: false
                      };
                      saveItem("farmers", updatedFarmer, existingFarmer.id);
                      logUserActivity("update", "farmer", updatedFarmer.name, existingFarmer.id);
                    } else {
                      const uniqueId = "farmer-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
                      const saveData = {
                        ...data,
                        id: uniqueId,
                        createdBy: currentAuthUid,
                        createdByUserId: currentAuthUid,
                        approvalStatus: isAdminOrAdminRole ? "approved" : "pending",
                      };
                      saveItem("farmers", saveData, uniqueId).then((newId) => {
                        logUserActivity(
                          "create",
                          "farmer",
                          saveData.name,
                          newId || uniqueId,
                        );
                      });
                    }
                  }
                  handleBack();
                }}
                onCancel={handleBack}
              />
            </LocalErrorBoundary>
          )}

          {view === "add-product" && (
            <LocalErrorBoundary featureName="उत्पादन जोडा (Add Product Form)">
              <AddProductForm
                initialData={
                  editingProductIndex !== null
                    ? displayProducts[editingProductIndex]
                    : undefined
                }
                products={displayProducts}
                onSave={(data) => {
                  const productName = data.brandName || data.name || "उत्पादन";
                  if (editingProductIndex !== null) {
                    const id = displayProducts[editingProductIndex].id;
                    const currentVersion = displayProducts[editingProductIndex].version || 1;
                    const saveData = {
                      ...data,
                      name: productName,
                      version: currentVersion + 1,
                      createdBy: data.createdBy || currentCreatorId,
                      createdByUserId: data.createdByUserId || currentCreatorId,
                      approvalStatus: isAdminOrAdminRole ? "approved" : "pending",
                    };
                    saveItem("products", saveData, id);
                    setHighlightedProductId(id);
                    logUserActivity("update", "product", productName, id);
                  } else {
                    const pBrand = (data.brandName || data.name || "").trim().toLowerCase();
                    const pCompany = (data.companyName || "").trim().toLowerCase();
                    const pComp = (data.composition || data.activeIngredients || "").trim().toLowerCase();

                    const cleanParts = (name: string) => {
                      return name
                        .split(/[\/\+\s]/)
                        .map(part => part.trim().toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/gi, ""))
                        .filter(part => part.length > 1);
                    };

                    const cleanComp = (comp: string) => {
                      return comp.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "")
                        .replace("ww", "")
                        .replace("sc", "")
                        .replace("wp", "")
                        .replace("wg", "")
                        .replace("ec", "");
                    };
                    
                    const cleanCo = (co: string) => {
                      return co.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "").replace("corp", "").replace("ltd", "").replace("private", "").trim();
                    };

                    const pParts = cleanParts(pBrand);
                    const normComp = cleanComp(pComp);
                    const normCo = cleanCo(pCompany);

                    const existingProduct = (products || []).find((existing) => {
                      if (!existing || existing.isDeleted) return false;
                      const eBrand = (existing.brandName || existing.name || "").trim().toLowerCase();
                      const eCompany = (existing.companyName || "").trim().toLowerCase();
                      const eComp = (existing.composition || existing.activeIngredients || "").trim().toLowerCase();

                      const eParts = cleanParts(eBrand);
                      const hasNameOverlap = pParts.some(pt => eParts.includes(pt)) || pBrand === eBrand;
                      const compMatch = normComp === cleanComp(eComp);
                      const companyMatch = (normCo && cleanCo(eCompany)) ? 
                                           (normCo === cleanCo(eCompany) || normCo.includes(cleanCo(eCompany)) || cleanCo(eCompany).includes(normCo)) : 
                                           false;

                      return (pBrand === eBrand && companyMatch) || (hasNameOverlap && compMatch && companyMatch);
                    });

                    if (existingProduct) {
                      const currentVersion = existingProduct.version || 1;
                      const updatedProduct = {
                        ...existingProduct,
                        ...data,
                        name: productName,
                        version: currentVersion + 1,
                        isDeleted: false,
                      };
                      saveItem("products", updatedProduct, existingProduct.id);
                      setHighlightedProductId(existingProduct.id);
                      logUserActivity("update", "product", productName, existingProduct.id);
                    } else {
                      const uniqueId = "product-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
                      const saveData = {
                        ...data,
                        id: uniqueId,
                        name: productName,
                        version: 1,
                        createdBy: currentCreatorId,
                        createdByUserId: currentCreatorId,
                        approvalStatus: isAdminOrAdminRole ? "approved" : "pending",
                      };
                      saveItem("products", saveData, uniqueId).then((newId) => {
                        setHighlightedProductId(newId || uniqueId);
                        logUserActivity(
                          "create",
                          "product",
                          productName,
                          newId || uniqueId,
                        );
                      });
                    }
                  }
                  handleBack();
                }}
                onCancel={handleBack}
              />
            </LocalErrorBoundary>
          )}

          {view === "add-schedule" && (
            <LocalErrorBoundary featureName="नवीन वेळापत्रक जोडा (Add Schedule Form)">
              <AddScheduleForm
                initialData={
                  editingScheduleIndex !== null
                    ? filteredSchedules[editingScheduleIndex]
                    : prefilledSchedule || undefined
                }
                farmers={displayFarmersForSchedule}
                products={displayProducts}
                schedules={schedules}
                language={language}
                onSave={(data) => {
                  const farmer = displayFarmersForSchedule.find(
                    (f) => f.id === data.farmerId || f.mobile === data.farmerId,
                  );
                  const farmerName = farmer
                    ? farmer.name
                    : data.farmerName || "शेतकरी";
                  const label = `${farmerName} - ${data.cropName || "पीक"}`;

                  if (data.farmerId) {
                    localStorage.setItem(
                      "schedule_list_selected_farmer",
                      data.farmerId,
                    );
                  }
                  if (data.cropName) {
                    localStorage.setItem(
                      "schedule_list_selected_crop",
                      data.cropName,
                    );
                  }

                  if (editingScheduleIndex !== null) {
                    const id = filteredSchedules[editingScheduleIndex].id;
                    const saveData = {
                      ...data,
                      createdBy: data.createdBy || currentCreatorId,
                      createdByUserId: data.createdByUserId || currentCreatorId,
                      updatedByUserId: currentCreatorId,
                      approvalStatus: isAdminOrAdminRole ? "approved" : "pending",
                      updatedAt: Date.now()
                    };
                    saveItem("schedules", saveData, id);
                    logUserActivity("update", "schedule", label, id);
                    setPrefilledSchedule(null);
                    handleBack();
                  } else {
                    const uniqueId = "schedule-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
                    const saveData = {
                      ...data,
                      id: uniqueId,
                      createdBy: currentCreatorId,
                      createdByUserId: currentCreatorId,
                      updatedByUserId: currentCreatorId,
                      approvalStatus: isAdminOrAdminRole ? "approved" : "pending",
                      createdAt: Date.now(),
                      updatedAt: Date.now()
                    };
                    saveItem("schedules", saveData, uniqueId).then((newId) => {
                      logUserActivity(
                        "create",
                        "schedule",
                        label,
                        newId || uniqueId,
                      );
                    });
                    setPrefilledSchedule(null);
                    handleBack();
                  }
                }}
                onCancel={() => {
                  setPrefilledSchedule(null);
                  handleBack();
                }}
              />
            </LocalErrorBoundary>
          )}

          {/* Placeholder for other tabs */}
          {activeTab !== "dashboard" &&
            view === "dashboard" &&
            (activeTab === "farmers" ? (
              <div className="flex-1 overflow-y-auto">
                <LocalErrorBoundary featureName="शेतकरी (Farmers)">
                  <FarmerList
                    farmers={displayFarmersForSchedule}
                    canManage={isAdminOrAdminRole || (currentUser?.type === "user" && !!currentUser.data?.permissions?.farmers)}
                    permissions={currentUser?.data?.permissions || currentUser?.permissions}
                    currentUserId={currentAuthUid}
                    isAdmin={isAdminOrAdminRole}
                    onAddFarmer={() => navigateTo("add-farmer")}
                    onEditFarmer={(index) => {
                      setEditingFarmerIndex(index);
                      navigateTo("add-farmer");
                    }}
                    onDeleteFarmer={(index) => {
                      const farmer = displayFarmersForSchedule[index];
                      const farmerName = farmer?.name || "शेतकरी";
                      setDeleteConfirmation({
                        isOpen: true,
                        title: "शेतकरी माहिती नष्ट करा?",
                        message: `तुम्हाला खरोखरच '${farmerName}' शेतकरी आणि त्यांचे सर्व रेकॉर्ड नष्ट करायचे आहे का?`,
                        onConfirm: () => {
                          deleteItem("farmers", farmer.id);
                          logUserActivity(
                            "delete",
                            "farmer",
                            farmerName,
                            farmer.id,
                          );
                          setDeleteConfirmation((prev) => ({
                            ...prev,
                            isOpen: false,
                          }));
                        },
                      });
                    }}
                  />
                </LocalErrorBoundary>
              </div>
            ) : activeTab === "products" ? (
              <div className="flex-1 overflow-y-auto">
                <LocalErrorBoundary featureName="उत्पादने (Products)">
                  <ProductList
                    products={displayProducts}
                    highlightedProductId={highlightedProductId}
                    canManage={isAdminOrAdminRole || currentUser?.type === "user"}
                    language={language}
                    onAddProduct={() => navigateTo("add-product")}
                    onEditProduct={(index) => {
                      setEditingProductIndex(index);
                      navigateTo("add-product");
                    }}
                    onDeleteAllProducts={() => {
                      if (displayProducts.length === 0) {
                        alert("हटवण्यासाठी कोणतेही Products उपलब्ध नाहीत.");
                        return;
                      }
                      if (window.confirm("तुम्हाला खात्री आहे की तुम्हाला सर्व उत्पादने हटवायची आहेत?")) {
                        const ids = displayProducts.map(p => p.id);
                        deleteAllItems("products", ids).then(() => {
                           // Clear cache so they don't reappear on reload
                           localStorage.removeItem("cached_collection_products");
                           localStorage.removeItem("products_cleared_manually"); // Set manually cleared flag if we need to
                           localStorage.setItem("products_cleared_manually", "true");
                           alert("सर्व Products यशस्वीरित्या हटवले गेले.");
                        });
                        logUserActivity("delete", "product", "all", "system");
                      }
                    }}
                    onDeleteProduct={(index) => {
                      const product = displayProducts[index];
                      const productName =
                        product?.brandName || product?.name || "उत्पादन";
                      deleteItem("products", product.id);
                      logUserActivity(
                        "delete",
                        "product",
                        productName,
                        product.id,
                      );
                    }}
                  />
                </LocalErrorBoundary>
              </div>
            ) : activeTab === "advice" ? (
              <div className="flex-1 overflow-y-auto">
                <LocalErrorBoundary featureName="कृषी सल्ला (Advice)">
                  <AlertsView 
                    alerts={alerts} 
                    currentUser={currentUser} 
                    currentCoords={locationCoords} 
                    farmers={farmers}
                    onAddAlert={handleAddAlert}
                    onDeleteAlert={handleDeleteAlert}
                    permissions={currentUser?.permissions}
                  />
                </LocalErrorBoundary>
              </div>
            ) : activeTab === "schedule" ? (
              <div className="flex-1 overflow-y-auto">
                <LocalErrorBoundary featureName="वेळापत्रक (Schedules)">
                  <ScheduleList
                    schedules={filteredSchedules}
                    farmers={
                      isFarmer
                        ? currentUser?.data
                          ? [currentUser.data]
                          : []
                        : displayFarmersForSchedule
                    }
                    isFarmerView={isFarmer}
                    language={language}
                    permissions={currentUser?.permissions}
                    onAddSchedule={(prefill) => {
                      if (prefill) {
                        setPrefilledSchedule(prefill);
                        if (prefill.farmerId) {
                          localStorage.setItem(
                            "schedule_list_selected_farmer",
                            prefill.farmerId,
                          );
                        }
                        if (prefill.cropName) {
                          localStorage.setItem(
                            "schedule_list_selected_crop",
                            prefill.cropName,
                          );
                        }
                      }
                      navigateTo("add-schedule");
                    }}
                    onEditSchedule={(index) => {
                      // For farmer view, we don't allow edits, we can hide button in ScheduleList
                      if (isFarmer) return;
                      const schedule = filteredSchedules[index];
                      if (schedule) {
                        if (schedule.farmerId) {
                          localStorage.setItem(
                            "schedule_list_selected_farmer",
                            schedule.farmerId,
                          );
                        }
                        if (schedule.cropName) {
                          localStorage.setItem(
                            "schedule_list_selected_crop",
                            schedule.cropName,
                          );
                        }
                      }
                      setEditingScheduleIndex(index);
                      navigateTo("add-schedule");
                    }}
                    onDeleteSchedule={(index) => {
                      if (isFarmer) return;
                      const schedule = filteredSchedules[index];
                      const cropName = schedule?.cropName || "पीक";
                      const farmer = displayFarmersForSchedule.find(
                        (f) => f.id === schedule?.farmerId,
                      );
                      const farmerName = farmer ? farmer.name : "शेतकरी";
                      const label = `${farmerName} - ${cropName}`;
                      setDeleteConfirmation({
                        isOpen: true,
                        title: "वेळापत्रक नष्ट करा?",
                        message:
                          "तुम्हाला खरोखरच हे वेळापत्रक नियोजन नष्ट करायचे आहे का?",
                        onConfirm: () => {
                          if (schedule && schedule.id) {
                            deleteItem("schedules", schedule.id);
                          }
                          logUserActivity(
                            "delete",
                            "schedule",
                            label,
                            schedule.id,
                          );
                          setDeleteConfirmation((prev) => ({
                            ...prev,
                            isOpen: false,
                          }));
                        },
                      });
                    }}
                  />
                </LocalErrorBoundary>
              </div>
            ) : activeTab === "admin" &&
              (currentUser?.type === "admin" ||
                currentUser?.data?.role === "admin") ? (
              <div className="flex-1 overflow-y-auto">
                <LocalErrorBoundary featureName="प्रशासकीय पॅनेल (Admin)">
                  <AdminView
                    users={users}
                    farmers={farmers}
                    products={displayProducts}
                    schedules={schedules}
                    activityLogs={displayActivityLogs}
                    alerts={alerts}
                    dealers={dealers}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                    onAddUser={handleAddUser}
                    onUpdateFarmer={handleUpdateFarmer}
                    onDeleteFarmer={(id) => {
                      const farmer = farmers.find((f) => f.id === id);
                      const name = farmer?.name || "Farmer";
                      if (farmer) {
                        saveItem("farmers", { ...farmer, isDeleted: true }, id);
                        logUserActivity("delete", "farmer", name, id);
                      }
                    }}
                    onAddProduct={(p) => {
                      saveItem("products", p);
                    }}
                    onUpdateProduct={(id, data) => {
                      const product = products.find((p) => p.id === id);
                      if (product)
                        saveItem("products", { ...product, ...data }, id);
                    }}
                    onUpdateSchedule={(id, data) => {
                      const sch = schedules.find((s) => s.id === id);
                      if (sch) saveItem("schedules", { ...sch, ...data, updatedAt: Date.now() }, id);
                    }}
                    onUpdateDealer={(id, data) => {
                      const d = dealers.find((dl) => dl.id === id);
                      if (d) saveItem("dealers", { ...d, ...data }, id);
                    }}
                    onAddAlert={handleAddAlert}
                  />
                </LocalErrorBoundary>
              </div>
            ) : activeTab === "consultants" ? (
              <div className="flex-1 overflow-y-auto">
                <LocalErrorBoundary featureName="सल्लागार (Consultants)">
                  <ConsultantsView />
                </LocalErrorBoundary>
              </div>
            ) : activeTab === "masterSchedules" ? (
              <div className="flex-1 overflow-y-auto">
                <LocalErrorBoundary featureName="मास्टर वेळापत्रक (Master Schedules)">
                  <MasterScheduleView />
                </LocalErrorBoundary>
              </div>
            ) : activeTab === "dealers" ? (
              <div className="flex-1 overflow-y-auto">
                <LocalErrorBoundary featureName="विक्रेते (Dealers)">
                  <DealersView
                    dealers={displayDealers}
                    allDealers={dealers}
                    onAddDealer={async (dealerData) => {
                      const code = generateVillageCode(dealerData.state || "Maharashtra", dealerData.district, dealerData.taluka, dealerData.village);
                      const existingDealer = (dealers || []).find((d) => {
                        if (!d) return false;
                        // Match by mobile (last 10 digits)
                        const dMob = d.mobile ? String(d.mobile).replace(/\D/g, "").slice(-10) : "";
                        const ndMob = dealerData.mobile ? String(dealerData.mobile).replace(/\D/g, "").slice(-10) : "";
                        const isMobileDuplicate = dMob && ndMob && dMob.length >= 10 && dMob === ndMob;

                        // Match by shop name
                        const dName = d.shopName ? d.shopName.trim().toLowerCase() : "";
                        const ndName = dealerData.shopName ? dealerData.shopName.trim().toLowerCase() : "";
                        const isNameDuplicate = dName && ndName && dName === ndName;

                        return isMobileDuplicate || isNameDuplicate;
                      });
                      if (existingDealer) {
                        const currentLinks = existingDealer.linkedUsers || [];
                        if (!currentLinks.includes(currentCreatorId)) {
                          currentLinks.push(currentCreatorId);
                        }
                        const res = await saveItem("dealers", {
                          ...existingDealer,
                          ...dealerData,
                          villageCode: code,
                          linkedUsers: currentLinks,
                          isDeleted: false,
                        }, existingDealer.id);
                        logUserActivity("update", "dealer", existingDealer.shopName || existingDealer.name || "Dealer", existingDealer.id);
                        return res;
                      } else {
                        return await saveItem("dealers", {
                          ...dealerData,
                          villageCode: code,
                          createdBy: currentCreatorId,
                        });
                      }
                    }}
                    onEditDealer={(id, dealerData) => {
                      const code = generateVillageCode(dealerData.state || "Maharashtra", dealerData.district, dealerData.taluka, dealerData.village);
                      return saveItem(
                        "dealers",
                        {
                          ...dealerData,
                          villageCode: code,
                          createdBy: dealerData.createdBy || currentCreatorId,
                        },
                        id,
                      );
                    }}
                    onDeleteDealer={async (id) => {
                      const d = dealers.find((dl) => dl.id === id);
                      if (d) {
                        const res = await saveItem("dealers", { ...d, isDeleted: true }, id);
                        logUserActivity("delete", "dealer", d.shopName || d.name || "Dealer", id);
                        return res;
                      }
                      return Promise.resolve();
                    }}
                    isFarmerView={isFarmer}
                  />
                </LocalErrorBoundary>
              </div>
            ) : activeTab === "location-mapping" ? (
              <div className="flex-1 flex flex-col min-h-0">
                <LocalErrorBoundary featureName="लोकेशन मॅपिंग (Location Mapping)">
                  <LocationMapping 
                    language={language} 
                    onBack={handleBack} 
                    dealers={dealers}
                    onNavigateToDealers={() => setActiveTab('dealers')}
                    onDeleteDealer={async (id) => {
                      const d = dealers.find((dl) => dl.id === id);
                      if (d) {
                        const res = await saveItem("dealers", { ...d, isDeleted: true }, id);
                        logUserActivity("delete", "dealer", d.shopName || d.name || "Dealer", id);
                        return res;
                      }
                    }}
                  />
                </LocalErrorBoundary>
              </div>
            ) : activeTab === "settings" ? (
              <LocalErrorBoundary featureName="सेटिंग्ज (Settings)">
                <SettingsView
                  onLogout={handleLogout}
                  onInstallApp={handleInstallApp}
                  canInstall={!!deferredPrompt}
                  onNavigate={handleNavClick}
                  currentUser={currentUser}
                />
              </LocalErrorBoundary>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                <Sprout className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  {navItems.find((i) => i.id === activeTab)?.label} विभाग
                </h2>
                <p className="text-sm text-slate-500">
                  हे वैशिष्ट्य लवकरच उपलब्ध होईल.
                </p>
              </div>
            ))}
          
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar matching Image 1 */}
      {view !== "add-farmer" &&
        view !== "add-product" &&
        view !== "add-schedule" && (
          <div className="md:hidden bg-white border-t border-slate-200/90 py-2 flex justify-around items-center shrink-0 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] print:hidden">
            {isFarmer ? (
              <>
                {navItems.some((item) => item.id === "schedule") && (
                  <button
                    onClick={() => handleNavClick("schedule")}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-black transition-colors w-16 ${
                      activeTab === "schedule"
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    <Calendar
                      className={`w-5 h-5 ${activeTab === "schedule" ? "text-emerald-600" : "text-slate-300"}`}
                    />
                    <span>{isEn ? "Schedules" : "वेळापत्रक"}</span>
                  </button>
                )}
                {navItems.some((item) => item.id === "settings") && (
                  <button
                    onClick={() => handleNavClick("settings")}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-black transition-colors w-16 ${
                      activeTab === "settings"
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    <Settings
                      className={`w-5 h-5 ${activeTab === "settings" ? "text-emerald-600" : "text-slate-300"}`}
                    />
                    <span>{isEn ? "Settings" : "सेटिंग्ज"}</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {navItems.some((item) => item.id === "dashboard") && (
                  <button
                    onClick={() => handleNavClick("dashboard")}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-black transition-colors w-14 ${
                      activeTab === "dashboard"
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    <LayoutDashboard
                      className={`w-5 h-5 ${activeTab === "dashboard" ? "text-emerald-600" : "text-slate-300"}`}
                    />
                    <span>{isEn ? "Home" : "मुख्य स्क्रीन"}</span>
                  </button>
                )}
                {navItems.some((item) => item.id === "farmers") && (
                  <button
                    onClick={() => handleNavClick("farmers")}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-black transition-colors w-14 ${
                      activeTab === "farmers"
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    <Users
                      className={`w-5 h-5 ${activeTab === "farmers" ? "text-emerald-600" : "text-slate-300"}`}
                    />
                    <span>{isEn ? "Farmers" : "शेतकरी"}</span>
                  </button>
                )}
                {navItems.some((item) => item.id === "schedule") && (
                  <button
                    onClick={() => handleNavClick("schedule")}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-black transition-colors w-14 ${
                      activeTab === "schedule"
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    <Calendar
                      className={`w-5 h-5 ${activeTab === "schedule" ? "text-emerald-600" : "text-slate-300"}`}
                    />
                    <span>{isEn ? "Schedules" : "वेळापत्रक"}</span>
                  </button>
                )}
                {navItems.some((item) => item.id === "products") && (
                  <button
                    onClick={() => handleNavClick("products")}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-black transition-colors w-14 ${
                      activeTab === "products"
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    <Package
                      className={`w-5 h-5 ${activeTab === "products" ? "text-emerald-600" : "text-slate-300"}`}
                    />
                    <span>{isEn ? "Products" : "उत्पादने"}</span>
                  </button>
                )}
                {navItems.some((item) => item.id === "dealers") && (
                  <button
                    onClick={() => handleNavClick("dealers")}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-black transition-colors w-14 ${
                      activeTab === "dealers"
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    <Store
                      className={`w-5 h-5 ${activeTab === "dealers" ? "text-emerald-600" : "text-slate-300"}`}
                    />
                    <span>{isEn ? "Dealers" : "Dealer"}</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}

      {/* Global Confirmation Modal against accidental deletion */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title={deleteConfirmation.title}
        message={deleteConfirmation.message}
        onConfirm={deleteConfirmation.onConfirm}
        onCancel={() =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {/* Interactive PWA Install Guide Modal */}
      {renderInstallModal()}
    </div>
  );
}

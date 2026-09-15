import { useState, useMemo, useEffect } from "react";
import { 
  AlertTriangle, 
  CloudRain, 
  ShieldAlert, 
  Bug, 
  CloudLightning,
  Clock,
  Filter,
  CheckCircle2,
  Check,
  MapPin,
  Sprout,
  Info,
  ThermometerSun,
  Droplets,
  Zap,
  Activity,
  BellRing
} from "lucide-react";
import { Alert } from "../types";
import { saveItem } from "../lib/data-sync";
import { getApiUrl, getAuthHeaders } from "../lib/config";

interface Props {
  alerts: Alert[];
  currentUser?: any;
  currentCoords?: { lat: number, lng: number } | null;
  onAddAlert?: (alert: any) => void;
  onDeleteAlert?: (id: string) => void;
  farmers?: any[];
  permissions?: any;
}

export default function AlertsView({ alerts, currentUser, currentCoords, onAddAlert, onDeleteAlert, farmers = [], permissions }: Props) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const [filterCrop, setFilterCrop] = useState<string>("all");
  const [isPersonalized, setIsPersonalized] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [prevAlertsLength, setPrevAlertsLength] = useState(alerts.length);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isFetchingAI, setIsFetchingAI] = useState(false);
  const [aiError, setAiError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    text: "",
    type: "weather",
    crop: "",
    area: "",
    pestDiseaseName: "",
    symptoms: "",
    possibleCause: "",
    preventiveMeasure: "",
    recommendedManagement: "",
    recommendations: "",
    priority: "Medium",
    targetScope: "all",
    targetState: "",
    targetDistrict: "",
    targetTaluka: "",
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    radius: undefined as number | undefined
  });

  const isAdmin = currentUser?.type === "admin";

  const uniqueStates = useMemo(() => Array.from(new Set(farmers.map((f: any) => f.state).filter(Boolean))) as string[], [farmers]);
  const uniqueDistricts = useMemo(() => Array.from(new Set(farmers.map((f: any) => f.district).filter(Boolean))) as string[], [farmers]);
  const uniqueTalukas = useMemo(() => Array.from(new Set(farmers.map((f: any) => f.taluka).filter(Boolean))) as string[], [farmers]);
  
  const alertCrops = useMemo(() => {
    const crops = new Set<string>();
    alerts.forEach(a => {
      if (a.crop) {
        a.crop.split(',').forEach(c => crops.add(c.trim()));
      }
      if (a.targetCrops) {
        a.targetCrops.forEach(c => crops.add(c.trim()));
      }
    });
    return Array.from(crops).filter(Boolean).sort();
  }, [alerts]);

  useEffect(() => {
    // Basic push notification logic for new alerts
    if (alerts.length > prevAlertsLength && alerts.length > 0) {
      const topAlert = alerts[0];
      if (!isRead(topAlert) && typeof Notification !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            new Notification(topAlert.title || "नवीन शेती अलर्ट (New Agri Alert)", {
              body: topAlert.text,
              icon: '/icon.png'
            });
          } catch (e) {}
        } else if (Notification.permission !== 'denied') {
          try {
            Notification.requestPermission();
          } catch (e) {}
        }
      }
      setPrevAlertsLength(alerts.length);
    }
  }, [alerts, prevAlertsLength, currentUser]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Helper to calculate distance in KM between two coordinates
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const markAsRead = async (alert: Alert) => {
    if (!currentUser?.uid) return;
    const currentReadBy = alert.readBy || [];
    if (currentReadBy.includes(currentUser.uid)) return;

    try {
      await saveItem("alerts", { ...alert, readBy: [...currentReadBy, currentUser.uid] }, alert.id);
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const isRead = (alert: Alert) => {
    if (!currentUser?.uid) return false;
    return (alert.readBy || []).includes(currentUser.uid);
  };

  const handleFetchAIAlerts = async (auto = false) => {
    if (isOffline) {
      if (!auto) setAiError("इंटरनेट कनेक्शन तपासा (You are offline).");
      return;
    }
    const apiUrl = getApiUrl("/api/generate-crop-alerts");
    if (!apiUrl) {
      if (!auto) setAiError("बॅकएंड सर्व्हर अजून कॉन्फिगर केलेला नाही (Backend server not configured yet).");
      return;
    }
    setIsFetchingAI(true);
    setAiError("");
    try {
      // Pass general crops we want to monitor if not provided state
      const reqBody = { crops: "केळी, द्राक्ष, ऊस, कापूस, डाळिंब, मका, सोयाबीन", state: "महाराष्ट्र" };
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(reqBody)
      });
      if (!res.ok) throw new Error("API Limit or Error");
      const data = await res.json();
      if (data.alerts && Array.isArray(data.alerts)) {
        data.alerts.forEach((alert: any, index: number) => {
          if (onAddAlert) {
            // Deterministic ID based on current date to prevent duplication from multiple users
            const dateStr = new Date().toISOString().split('T')[0];
            const alertId = `ai-alert-${dateStr}-${index}`;
            onAddAlert({
              ...alert,
              id: alertId,
              createdAt: Date.now(),
              source: "ai",
              targetScope: "all"
            });
          }
        });
        localStorage.setItem("last_ai_alert_fetch", Date.now().toString());
      }
    } catch (err: any) {
      if (!auto) setAiError("AI कडून लाइव्ह डेटा मिळवण्यात अडचण आली (Failed to fetch live AI alerts).");
    } finally {
      setIsFetchingAI(false);
    }
  };

  useEffect(() => {
    // Auto-fetch for all users to ensure fresh data, cached on the server for 6 hours
    if (!isOffline) {
      const lastFetch = localStorage.getItem("last_ai_alert_fetch");
      const hrsPassed = lastFetch ? (Date.now() - parseInt(lastFetch)) / (1000 * 60 * 60) : 999;
      if (hrsPassed > 6) {
        handleFetchAIAlerts(true);
      }
    }
  }, [isOffline]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text) return;
    
    const submittedData = {
      ...formData,
      targetCrops: formData.crop ? formData.crop.split(',').map(c => c.trim()).filter(Boolean) : []
    };
    
    onAddAlert?.(submittedData);
    setFormData({
      title: "",
      text: "",
      type: "weather",
      crop: "",
      area: "",
      pestDiseaseName: "",
      symptoms: "",
      possibleCause: "",
      preventiveMeasure: "",
      recommendedManagement: "",
      recommendations: "",
      priority: "Medium",
      targetScope: "all",
      targetState: "",
      targetDistrict: "",
      targetTaluka: "",
      lat: undefined,
      lng: undefined,
      radius: undefined
    });
    setShowAddForm(false);
  };

  const filteredAlerts = useMemo(() => {
    // 0. Deduplication - Ensure unique alerts based on ID and recent Content
    const uniqueMap = new Map();
    const contentHistory = new Set(); // to track "text-createdAtApprox"
    
    alerts.forEach(a => {
      if (!a || !a.id) return;
      
      // 5-minute content deduplication window
      const timeWindow = Math.floor(a.createdAt / (1000 * 60 * 5)); 
      const contentKey = `${a.text.slice(0, 100)}-${timeWindow}`;
      
      if (!uniqueMap.has(a.id) && !contentHistory.has(contentKey)) {
        uniqueMap.set(a.id, a);
        contentHistory.add(contentKey);
      }
    });
    let result = Array.from(uniqueMap.values()) as Alert[];

    // 1. Automatic target locations filter for logged-in farmers
    if (currentUser?.type === "farmer" && currentUser?.data) {
      // If farmer context exists, filter by location if the alert specifically targets a location.
      // If an alert has NO target location or is 'all', it always stays.
      
      const fState = (currentUser.data.state || "").toLowerCase().trim();
      const fDistrict = (currentUser.data.district || "").toLowerCase().trim();
      const fTaluka = (currentUser.data.taluka || "").toLowerCase().trim();

      result = result.filter(a => {
        // General or system-wide alerts display to everyone
        if (!a || !a.targetScope || a.targetScope === "all") return true;

        // GPS Radius targeting (if alert has lat/lng and radius)
        if (a.lat && a.lng && a.radius && currentCoords) {
          try {
            const distance = getDistance(currentCoords.lat, currentCoords.lng, a.lat, a.lng);
            if (distance <= a.radius) return true;
          } catch (e) {}
        }

        const aState = (a.targetState || "").toLowerCase().trim();
        const aDistrict = (a.targetDistrict || "").toLowerCase().trim();
        const aTaluka = (a.targetTaluka || "").toLowerCase().trim();

        if (a.targetScope === "state") {
          return fState && aState ? fState === aState : true;
        }
        if (a.targetScope === "district") {
          return fDistrict && aDistrict ? fDistrict === aDistrict : true;
        }
        if (a.targetScope === "taluka") {
          return fTaluka && aTaluka ? fTaluka === aTaluka : true;
        }
        
        return true; // Fallback to show it if scope is unknown but it passed initial checks
      });
    }

    // Role-based visibility for Admins: Admins see everything unless they filter.
    // Users (Dealers/Advisors) see alerts according to their current GPS location.
    if (currentUser?.type === "user" && currentCoords) {
       result = result.filter(a => {
         // If alert has lat/lng and radius, it MUST match GPS
         if (a.lat && a.lng && a.radius) {
           const distance = getDistance(currentCoords.lat, currentCoords.lng, a.lat, a.lng);
           return distance <= a.radius;
         }
         // For non-GPS targeted alerts, show them
         return true;
       });
    }

    // 2. Standard Category filtering
    if (filterType !== "all") {
      result = result.filter(a => a.type === filterType);
    }

    // 3. Unread/Read filtering
    if (filterRead === "unread") {
      result = result.filter(a => !isRead(a));
    } else if (filterRead === "read") {
      result = result.filter(a => isRead(a));
    }

    // 3.5 Specific Crop filtering
    if (filterCrop !== "all") {
      result = result.filter(a => {
        const c1 = a.crop ? a.crop.toLowerCase() : "";
        const c2 = a.targetCrops ? a.targetCrops.join(" ").toLowerCase() : "";
        const fc = filterCrop.toLowerCase();
        return c1.includes(fc) || c2.includes(fc);
      });
    }

    // 4. Stricter Crop & Personalization filtering helper
    if (isPersonalized && currentUser?.data) {
      const userCrops = (currentUser.data.crops || []).map((c: any) => {
        const name = c?.crop || c?.name || "";
        return name.toLowerCase().trim();
      });

      result = result.filter(a => {
        if (!a.crop && (!a.targetCrops || a.targetCrops.length === 0)) return true; // general alerts apply
        const alertCrop = a.crop ? a.crop.toLowerCase().trim() : "";
        const targetCrops = a.targetCrops?.map(c => c.toLowerCase().trim()) || [];
        
        return userCrops.some((uc: string) => 
          alertCrop.includes(uc) || uc.includes(alertCrop) || targetCrops.some(tc => tc.includes(uc) || uc.includes(tc))
        );
      });
    }

    return result;
  }, [alerts, filterType, filterRead, filterCrop, isPersonalized, currentUser]);

  const getPriorityStyles = (priority?: string) => {
    switch (priority) {
      case "Critical": return "bg-rose-50 text-rose-700 border-rose-200";
      case "High": return "bg-orange-50 text-orange-700 border-orange-200";
      case "Medium": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Low": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "Critical": return "bg-rose-100 text-rose-800 border-rose-200";
      case "High": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Medium": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getTypeIcon = (type: string, priority?: string) => {
    let colorClass = "text-slate-600";
    if (priority === "Critical") colorClass = "text-rose-600";
    else if (priority === "High") colorClass = "text-orange-600";
    else if (priority === "Medium") colorClass = "text-amber-600";
    else if (priority === "Low") colorClass = "text-blue-600";

    switch (type) {
      case "weather": return <CloudLightning className={`w-5 h-5 ${colorClass}`} />;
      case "disease": return <Activity className={`w-5 h-5 ${colorClass}`} />;
      case "pest": return <Bug className={`w-5 h-5 ${colorClass}`} />;
      case "advisory": return <Info className={`w-5 h-5 ${colorClass}`} />;
      case "system": return <Zap className={`w-5 h-5 ${colorClass}`} />;
      default: return <AlertTriangle className={`w-5 h-5 ${colorClass}`} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "weather": return "हवामान बदल (Weather)";
      case "disease": return "रोग प्रादुर्भाव (Disease Outbreak)";
      case "pest": return "कीड प्रादुर्भाव (Pest Alert)";
      case "advisory": return "शेती सल्ला (Advisory)";
      case "system": return "महत्त्वाची सूचना (System)";
      default: return "इतर (Other)";
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <BellRing className="w-6 h-6 text-amber-500" />
              लाईव्ह सतर्कता (Live Alerts)
            </h2>
            <p className="text-xs text-slate-500 mt-1">शेतकरी आणि पिकांसाठी ताजे व महत्त्वाचे अपडेट्स</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {(isAdmin || permissions?.alerts !== false) && (
              <>
                <button 
                  onClick={() => handleFetchAIAlerts(false)}
                  disabled={isFetchingAI || isOffline}
                  className={`py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 ${
                    isFetchingAI ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${isFetchingAI ? 'animate-pulse' : ''}`} />
                  {isFetchingAI ? "माहिती आणत आहे..." : "स्मार्ट AI अलर्ट्स"}
                </button>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={`py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 ${
                    showAddForm ? 'bg-slate-800 text-white' : 'bg-amber-600 text-white hover:bg-amber-500'
                  }`}
                >
                  {showAddForm ? "बंद करा (Close)" : "अलर्ट जोडा (Add Alert)"}
                </button>
              </>
            )}

            {isOffline && (
              <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 inline-flex items-center gap-1.5 self-start md:self-auto">
                <CloudRain className="w-3.5 h-3.5" />
                ऑनलॉईन नाही (Offline Mode)
              </div>
            )}
          </div>
        </div>

        {aiError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {aiError}
          </div>
        )}

        {/* Add Alert Form (Admin Only) */}
        {isAdmin && showAddForm && (
          <div className="mb-8 bg-slate-50 border border-slate-200 rounded-2xl p-5 animate-slideIn">
             <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">प्राधान्य (Priority)</label>
                    <select 
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2"
                    >
                      <option value="Low">Low (सामान्य)</option>
                      <option value="Medium">Medium (मध्यम)</option>
                      <option value="High">High (महत्त्वाची)</option>
                      <option value="Critical">Critical (अत्यंत महत्त्वाची)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">प्रकार (Type)</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2"
                    >
                      <option value="weather">हवामान (Weather)</option>
                      <option value="disease">रोग (Disease)</option>
                      <option value="pest">कीड (Pest)</option>
                      <option value="advisory">महत्वाची सूचना (Advisory)</option>
                      <option value="system">App Update (System)</option>
                    </select>
                  </div>
                </div>

                {/* Location Targeting Controls */}
                <div className="bg-indigo-50/50 border border-indigo-100/60 rounded-xl p-3 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-700 uppercase mb-1">स्थान मर्यादा (Targeting Scope)</label>
                    <select 
                      value={formData.targetScope}
                      onChange={e => setFormData({
                        ...formData, 
                        targetScope: e.target.value,
                        targetState: e.target.value === "all" ? "" : formData.targetState || "Maharashtra",
                        targetDistrict: e.target.value === "all" || e.target.value === "state" ? "" : formData.targetDistrict,
                        targetTaluka: e.target.value !== "taluka" ? "" : formData.targetTaluka
                      })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700"
                    >
                      <option value="all">सर्व शेतकरी (All Farmers)</option>
                      <option value="state">विशिष्ट राज्य (State Specific)</option>
                      <option value="district">विशिष्ट जिल्हा (District Specific)</option>
                      <option value="taluka">विशिष्ट तालुका (Taluka Specific)</option>
                      <option value="gps">GPS लोकेशन (GPS Targeting)</option>
                    </select>
                  </div>

                  {formData.targetScope === "gps" && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">अक्षांश (Latitude)</label>
                          <input 
                            type="number" step="any"
                            value={formData.lat || ""}
                            onChange={e => setFormData({...formData, lat: parseFloat(e.target.value)})}
                            placeholder="e.g., 19.99"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">रेखांश (Longitude)</label>
                          <input 
                            type="number" step="any"
                            value={formData.lng || ""}
                            onChange={e => setFormData({...formData, lng: parseFloat(e.target.value)})}
                            placeholder="e.g., 73.78"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">त्रिज्या (Radius in KM)</label>
                          <span className="text-[10px] font-bold text-blue-600">{formData.radius || 0} KM</span>
                        </div>
                        <input 
                          type="range" min="1" max="500"
                          value={formData.radius || 50}
                          onChange={e => setFormData({...formData, radius: parseInt(e.target.value)})}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const reqLoc = (highAccuracy, retries) => {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setFormData({
                                ...formData, 
                                lat: pos.coords.latitude, 
                                lng: pos.coords.longitude,
                                radius: 50
                              });
                            }, (err) => {
                              if(retries > 0) {
                                reqLoc(!highAccuracy, retries - 1);
                              } else {
                                alert("लोकेशन ऍक्सेस नाकारला गेला. कृपया ॲपला लोकेशनची परवानगी द्या.");
                              }
                            }, { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 10000 : 15000, maximumAge: 10000 });
                          };
                          reqLoc(true, 1);
                        }}
                        className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-100 flex items-center justify-center gap-2"
                      >
                        📍 माझे चालू लोकेशन वापरा (Use My Location)
                      </button>
                    </div>
                  )}

                  {formData.targetScope !== "all" && formData.targetScope !== "gps" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fadeIn">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">राज्य (State)</label>
                        <input 
                          required
                          type="text"
                          list="states-list"
                          value={formData.targetState}
                          onChange={e => setFormData({...formData, targetState: e.target.value})}
                          placeholder="उदा. Maharashtra"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                        />
                      </div>

                      {(formData.targetScope === "district" || formData.targetScope === "taluka") && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">जिल्हा (District)</label>
                          <input 
                            required
                            type="text"
                            list="districts-list"
                            value={formData.targetDistrict}
                            onChange={e => setFormData({...formData, targetDistrict: e.target.value})}
                            placeholder="उदा. Nashik"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                          />
                        </div>
                      )}

                      {formData.targetScope === "taluka" && (
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">तालुका (Taluka)</label>
                          <input 
                            required
                            type="text"
                            list="talukas-list"
                            value={formData.targetTaluka}
                            onChange={e => setFormData({...formData, targetTaluka: e.target.value})}
                            placeholder="उदा. Niphad"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">शीर्षक (Title)</label>
                  <input 
                    required
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" 
                    placeholder="e.g., पावसाचा इशारा, करपा रोगाचा धोका"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">सविस्तर माहिती (Description)</label>
                  <textarea 
                    required
                    rows={3}
                    value={formData.text}
                    onChange={e => setFormData({...formData, text: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" 
                    placeholder="Provide details..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">पीक (Crop - Comma separated)</label>
                    <input 
                      type="text" 
                      value={formData.crop}
                      onChange={e => setFormData({...formData, crop: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" 
                      placeholder="e.g., द्राक्ष, टोमॅटो"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">प्रभावित क्षेत्र (Area Display Text)</label>
                    <input 
                      type="text" 
                      value={formData.area}
                      onChange={e => setFormData({...formData, area: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" 
                      placeholder="e.g., नाशिक परिसर"
                    />
                  </div>
                </div>

                {(formData.type === "pest" || formData.type === "disease") && (
                  <div className="bg-red-50/50 border border-red-100/60 rounded-xl p-3 space-y-3">
                    <label className="block text-xs font-black text-red-700 uppercase">कीड/रोगाची माहिती (Pest/Disease Info)</label>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">कीड/रोगाचे नाव (Name)</label>
                      <input 
                        type="text" 
                        value={formData.pestDiseaseName || ""}
                        onChange={e => setFormData({...formData, pestDiseaseName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" 
                        placeholder="उदा. मिलीबग, करपा"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">लक्षणे (Symptoms)</label>
                      <textarea 
                        rows={2}
                        value={formData.symptoms || ""}
                        onChange={e => setFormData({...formData, symptoms: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" 
                        placeholder="पानांवर डाग, फळ सडणे..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">संभाव्य कारण (Possible Cause)</label>
                      <textarea 
                        rows={2}
                        value={formData.possibleCause || ""}
                        onChange={e => setFormData({...formData, possibleCause: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" 
                        placeholder="बदलते हवामान, आर्द्रता..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">प्रतिबंधात्मक उपाय (Preventive Measure)</label>
                      <textarea 
                        rows={2}
                        value={formData.preventiveMeasure || ""}
                        onChange={e => setFormData({...formData, preventiveMeasure: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" 
                        placeholder="बागेची स्वच्छता..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">शिफारस केलेली व्यवस्थापन पद्धत (Management)</label>
                      <textarea 
                        rows={2}
                        value={formData.recommendedManagement || ""}
                        onChange={e => setFormData({...formData, recommendedManagement: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" 
                        placeholder="रासायनिक फवारणी..."
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs shadow-md transition-colors">
                    अलर्ट पाठवा (Sent Alert)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl uppercase tracking-wider text-xs transition-colors"
                  >
                    रद्द करा
                  </button>
                </div>

                <datalist id="states-list">{uniqueStates.map(st => <option key={st} value={st} />)}</datalist>
                <datalist id="districts-list">{uniqueDistricts.map(dt => <option key={dt} value={dt} />)}</datalist>
                <datalist id="talukas-list">{uniqueTalukas.map(tl => <option key={tl} value={tl} />)}</datalist>
             </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">सर्व प्रकार (All Types)</option>
            <option value="weather">हवामान (Weather)</option>
            <option value="disease">रोग (Disease)</option>
            <option value="pest">कीड (Pest)</option>
            <option value="advisory">सल्ला (Advisory)</option>
            <option value="system">इतर (Other)</option>
          </select>

          {alertCrops.length > 0 && (
            <select 
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-xs"
            >
              <option value="all">पिकानुसार (Crop-wise)</option>
              {alertCrops.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          <select 
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">सर्व (All Alerts)</option>
            <option value="unread">न वाचलेले (Unread)</option>
            <option value="read">वाचलेले (Read)</option>
          </select>

          {currentUser?.data?.district && (
            <button
              onClick={() => setIsPersonalized(!isPersonalized)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                isPersonalized 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              माझ्या भागातील (My Area/Crops)
            </button>
          )}
        </div>
        
        {filteredAlerts && filteredAlerts.length > 0 ? (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const read = isRead(alert);
              return (
                <div 
                  key={alert.id} 
                  className={`border rounded-xl p-4 transition-colors relative overflow-hidden ${
                    read ? 'bg-slate-50 border-slate-200 opacity-75' : getPriorityStyles(alert.priority)
                  }`}
                >
                  {/* Unread indicator */}
                  {!read && (
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                      alert.priority === 'Critical' ? 'bg-rose-500' : 
                      alert.priority === 'High' ? 'bg-orange-500' : 
                      alert.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="flex items-center gap-1.5 font-black text-sm">
                          {getTypeIcon(alert.type, alert.priority)}
                          {alert.title || getTypeLabel(alert.type)}
                        </span>
                        
                        {alert.priority && (
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(alert.priority)}`}>
                            {alert.priority === 'Critical' ? 'अत्यंत महत्त्वाचे' : alert.priority === 'High' ? 'महत्त्वाचे' : alert.priority === 'Medium' ? 'मध्यम' : 'सामान्य'}
                          </span>
                        )}
                        {!read && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            नवीन (New)
                          </span>
                        )}
                      </div>

                      <p className={`text-sm leading-relaxed mb-3 ${read ? 'text-slate-600' : 'text-slate-800'}`}>
                        {alert.text}
                      </p>

                      {/* Detail Grids */}
                      {(alert.crop || alert.area || alert.symptoms || alert.recommendations || alert.pestDiseaseName || alert.possibleCause || alert.preventiveMeasure || alert.recommendedManagement || (alert.targetCrops && alert.targetCrops.length > 0)) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 mt-4 bg-white/50 p-3 rounded-lg border border-black/5">
                          {(alert.crop || (alert.targetCrops && alert.targetCrops.length > 0)) && (
                            <div className="flex items-start gap-2 text-xs">
                              <Sprout className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-700 block">संबंधित पीक:</span>
                                <span className="text-slate-600">
                                  {alert.crop ? alert.crop : (alert.targetCrops ? alert.targetCrops.join(', ') : '')}
                                </span>
                              </div>
                            </div>
                          )}
                          {alert.area && (
                            <div className="flex items-start gap-2 text-xs">
                              <MapPin className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-700 block">प्रभावित क्षेत्र:</span>
                                <span className="text-slate-600">{alert.area}</span>
                              </div>
                            </div>
                          )}
                          {alert.pestDiseaseName && (
                            <div className="flex items-start gap-2 text-xs">
                              <Bug className="w-3.5 h-3.5 mt-0.5 text-rose-500 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-700 block">कीड/रोगाचे नाव:</span>
                                <span className="text-rose-600 font-semibold">{alert.pestDiseaseName}</span>
                              </div>
                            </div>
                          )}
                          {alert.symptoms && (
                            <div className="flex items-start gap-2 text-xs md:col-span-2">
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-orange-500 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-700 block">लक्षणे / धोके:</span>
                                <span className="text-slate-600">{alert.symptoms}</span>
                              </div>
                            </div>
                          )}
                          {alert.possibleCause && (
                            <div className="flex items-start gap-2 text-xs md:col-span-2">
                              <Info className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-700 block">संभाव्य कारण:</span>
                                <span className="text-slate-600">{alert.possibleCause}</span>
                              </div>
                            </div>
                          )}
                          {alert.preventiveMeasure && (
                            <div className="flex items-start gap-2 text-xs md:col-span-2">
                              <ShieldAlert className="w-3.5 h-3.5 mt-0.5 text-indigo-500 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-700 block">प्रतिबंधात्मक उपाय:</span>
                                <span className="text-slate-600">{alert.preventiveMeasure}</span>
                              </div>
                            </div>
                          )}
                          {(alert.recommendedManagement || alert.recommendations) && (
                            <div className="flex items-start gap-2 text-xs md:col-span-2 bg-emerald-50/50 p-2 rounded-md">
                              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-700 block">शिफारस केलेली व्यवस्थापन पद्धत:</span>
                                <span className="text-emerald-700">{alert.recommendedManagement || alert.recommendations}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(alert.createdAt).toLocaleString('mr-IN', {
                              timeZone: 'Asia/Kolkata',
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })} (IST)
                          </span>

                          {alert.lat && alert.lng && currentCoords && (
                            <span className={`bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100 flex items-center gap-1 animate-pulse`}>
                              <Activity className="w-3 h-3 text-emerald-500" /> तुमच्या जवळील (Nearby You: {getDistance(currentCoords.lat, currentCoords.lng, alert.lat, alert.lng).toFixed(1)}km)
                            </span>
                          )}

                          {alert.targetScope === "state" && (
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-blue-500" /> {alert.targetState}
                            </span>
                          )}
                          {alert.targetScope === "district" && (
                            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-100 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-purple-500" /> {alert.targetDistrict}
                            </span>
                          )}
                          {alert.targetScope === "taluka" && (
                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500" /> {alert.targetTaluka}
                            </span>
                          )}
                        </div>

                        {!read && currentUser?.uid && (
                           <button
                             onClick={() => markAsRead(alert)}
                             className="text-[11px] font-bold text-blue-600 bg-white/80 hover:bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                           >
                             <Check className="w-3 h-3" />
                             वाचले (Mark as Read)
                           </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => onDeleteAlert?.(alert.id)}
                            className="text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                            title="Delete Alert"
                          >
                             🗑️ काढा (Delete)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-lg font-black text-slate-800">सध्या आपल्या क्षेत्रासाठी कोणतीही नवीन सतर्कता नाही</p>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              तुमचे पीक व परिसर सुरक्षित आहे. जर हवामानात बदल किंवा रोगाचा धोका निर्माण झाला, तर आमचे तज्ञ येथे त्वरित सूचना देतील.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

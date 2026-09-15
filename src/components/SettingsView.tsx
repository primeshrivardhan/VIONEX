import React from "react";
import {
  Share2,
  Settings as SettingsIcon,
  Download,
  Copy,
  Check,
  LogOut,
  Smartphone,
  AlertTriangle,
  Bell,
  BellRing,
  Camera,
  User as UserIcon,
} from "lucide-react";
import { saveItem } from "../lib/data-sync";
import PublicLinksSettings from "./PublicLinksSettings";
import { HOSTING_URL } from "../lib/config";

interface SettingsViewProps {
  onLogout: () => void;
  onInstallApp?: () => Promise<boolean>;
  canInstall?: boolean;
  onNavigate?: (id: string) => void;
  currentUser?: any;
}

export default function SettingsView({
  onLogout,
  onInstallApp,
  canInstall,
  currentUser,
}: SettingsViewProps) {
  const [copied, setCopied] = React.useState(false);
  const isFarmer = currentUser?.type === "farmer";
  const isAdmin = currentUser?.type === "admin" || (currentUser?.type === "user" && currentUser?.data?.role === "admin");
  const [formData, setFormData] = React.useState(currentUser?.data || {});

  const isIframe = React.useMemo(() => window.self !== window.top, []);
  const isIOS = React.useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream, []);
  const isStandalone = React.useMemo(() => window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone, []);

  // Get dynamic application origin URL safely
  const appLink = React.useMemo(() => {
    if (HOSTING_URL) {
      return HOSTING_URL.replace(/\/$/, "");
    }
    try {
      const url = new URL(window.location.href);
      if (url.origin.includes("aistudio.google.com") || url.origin.includes("localhost") || url.origin.includes("127.0.0.1")) {
        return "";
      }
      return url.origin + url.pathname;
    } catch (e) {
      return "";
    }
  }, []);

  const farmerLink = appLink ? `${appLink.replace(/\/$/, "")}/?type=farmer` : "";
  const employeeLink = appLink ? `${appLink.replace(/\/$/, "")}/?view=portal` : "";

  const copyText = (text: string) => {
    if (!text) {
      alert("होस्टिंग लिंक अजून कॉन्फिगर केलेली नाही (Hosting URL not configured yet)");
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareLink = (link: string) => {
    if (!link) {
      alert("होस्टिंग लिंक अजून कॉन्फिगर केलेली नाही (Hosting URL not configured yet)");
      return;
    }
    const shareText = `*VIONEX Crop Care* 🚜🌿\n\nपिकांचे वेळापत्रक आणि नियोजन पाहण्यासाठी खालील लिंकवर क्लिक करा:\n🔗 ${link}\n\n*टीप:* मोबाईलमध्ये पाहत असल्यास वरच्या उजव्या बाजूला ३ ठिपक्यांवर क्लिक करून 'इन्स्टॉल' करा.`;

    if (navigator.share) {
      navigator
        .share({
          title: `VIONEX Crop Care`,
          text: `VIONEX Crop Care शेतकरी लिंक:`,
          url: link,
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            window.open(
              `https://wa.me/?text=${encodeURIComponent(shareText)}`,
              "_blank",
            );
          }
        });
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        "_blank",
      );
    }
  };

  const handleInstallClick = async () => {
    if (isStandalone) {
      alert("ॲप आधीच इन्स्टॉल केलेले आहे!");
      return;
    }

    if (isIframe) {
      alert("इन्स्टॉल करण्यासाठी, हे ॲप नवीन टॅबमध्ये उघडले जाईल. तिथे गेल्यावर पुन्हा याच बटणावर क्लिक करा.");
      window.open(appLink, "_blank");
      return;
    }

    if (isIOS) {
      alert("iPhone वर इन्स्टॉल करण्यासाठी:\n१. खालील 'Share' चिन्हावर क्लिक करा.\n२. 'Add to Home Screen' निवडा.");
      return;
    }

    if (onInstallApp && canInstall) {
      const result = await onInstallApp();
      if (!result) {
        alert("इन्स्टॉलेशन रद्द केले किंवा एरर आली. कृपया ब्राउझर मेनू (३ ठिपके) मधून 'Install app' निवडा.");
      }
    } else {
      alert("इन्स्टॉल करण्याचा पर्याय सध्या उपलब्ध नाही. कृपया ब्राउझर मेनू (३ ठिपके) मधून 'Install app' किंवा 'Add to Home screen' निवडा.");
    }
  };

  const handleSaveProfile = async () => {
    if (isFarmer) {
      await saveItem("farmers", formData, formData.id);
      alert("प्रोफाईल अपडेट झाली आहे!");
    }
  };

  const [notificationStatus, setNotificationStatus] = React.useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const requestNotificationPermission = async () => {
    try {
      if (typeof Notification === 'undefined' || !('Notification' in window)) {
        alert("तुमचा ब्राउझर नोटिफिकेशनला सपोर्ट करत नाही.");
        return;
      }
      
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        try {
          new Notification("VIONEX Notification Enabled!", {
            body: "तुम्हाला आता महत्वाची अपडेट्स मोबाईल स्क्रीनवर मिळतील.",
            icon: "/icon-192.png"
          });
        } catch (e) {
          // Fallback for some mobile browsers that require ServiceWorker registration to show notification
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if (registration) {
              registration.showNotification("VIONEX Notification Enabled!", {
                body: "तुम्हाला आता महत्वाची अपडेट्स मोबाईल स्क्रीनवर मिळतील.",
                icon: "/icon-192.png"
              });
            }
          }
        }
      } else {
        alert("तुम्ही नोटिफिकेशन नाकारले आहे (Denied). कृपया तुमच्या ब्राउझर किंवा ॲपच्या सेटिंग्जमध्ये जाऊन परवानगी द्या.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      alert("नोटिफिकेशन सुरू करताना अडचण आली. कृपया पुन्हा प्रयत्न करा.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] p-4 pb-20 select-none">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <SettingsIcon className="w-5 h-5 text-emerald-600" />
        <h2 className="text-sm font-black text-slate-800 tracking-wider uppercase">
          Settings
        </h2>
      </div>

      {isFarmer && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-4 mb-4">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
            👤 शेतकरी प्रोफाईल
          </label>
          <div className="flex flex-col items-center gap-2">
            <div className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-100 bg-slate-100 flex items-center justify-center">
              {formData.photoUrl ? (
                <img src={formData.photoUrl} alt="Farmer" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-slate-400" />
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({...formData, photoUrl: reader.result as string});
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
          </div>
          <input type="text" value={formData.name || ''} disabled className="w-full bg-slate-100 p-2 rounded-lg text-sm font-bold text-slate-600" />
          <input type="text" value={formData.mobile || ''} disabled className="w-full bg-slate-100 p-2 rounded-lg text-sm font-bold text-slate-600" />
          <input type="text" placeholder="अल्टरनेट मोबाईल नंबर" value={formData.alternateMobile || ''} onChange={(e) => setFormData({...formData, alternateMobile: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
          <button onClick={handleSaveProfile} className="w-full bg-emerald-600 text-white p-2 rounded-xl font-bold uppercase text-xs">प्रोफाईल जतन करा</button>
        </div>
      )}

      {/* Main Consolidated Settings Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-4">
        {/* Simple Link Copy & Share Option */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
            🔗 शेतकरी माहिती व वेळापत्रक लिंक
          </label>
          <div className="flex bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 items-center justify-between gap-3 text-[11px] font-bold text-slate-400 truncate">
            {farmerLink}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => copyText(farmerLink)}
              className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  कॉपी केली!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  लिंक कॉपी
                </>
              )}
            </button>
            <button
              onClick={() => shareLink(farmerLink)}
              className="flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp शेअर
            </button>
          </div>
        </div>

        {!isFarmer && (
          <>
            <hr className="border-slate-100" />
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                🔗 एम्प्लॉय लिंक
              </label>
              <div className="flex bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 items-center justify-between gap-3 text-[11px] font-bold text-slate-400 truncate">
                {employeeLink}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => copyText(employeeLink)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      कॉपी केली!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      लिंक कॉपी
                    </>
                  )}
                </button>
                <button
                  onClick={() => shareLink(employeeLink)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  WhatsApp शेअर
                </button>
              </div>
            </div>
          </>
        )}

        {isAdmin && <PublicLinksSettings appLink={appLink} />}

        <hr className="border-slate-100" />

        {/* Notifications Setting */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
              🔔 नोटिफिकेशन (Push Notifications)
            </label>
            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
              notificationStatus === 'granted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
              {notificationStatus === 'granted' ? 'ACTIVE' : (notificationStatus === 'denied' ? 'BLOCKED' : 'INACTIVE')}
            </span>
          </div>

          {notificationStatus !== 'granted' ? (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-100 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              <BellRing className="w-3.5 h-3.5" />
              नोटिफिकेशन सुरू करा
            </button>
          ) : (
            <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-3 flex items-start gap-3">
              <Bell className="w-4 h-4 text-emerald-600 mt-0.5" />
              <p className="text-[10px] font-bold text-emerald-700 leading-relaxed">
                तुमच्या मोबाईलवर नोटिफिकेशन सुरू झाले आहेत. आता तुम्हाला नवीन वेळापत्रक आणि अलर्ट्सचे मेसेज मोबाईल स्क्रीनवर मिळतील.
              </p>
            </div>
          )}
          
          <p className="text-[9px] text-slate-400 font-medium italic">
            * ही सुविधा फक्त 'VIONEX ऍप' मोबाईलवर इन्स्टॉल केलेल्या युजर्ससाठी उत्तम चालते.
          </p>
        </div>
      </div>

      {/* Neat Logout Button */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-100 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer active:scale-95 mt-4"
      >
        <LogOut className="w-3.5 h-3.5" />
        लॉग आउट (Logout)
      </button>

      {/* Minimal Footer */}
      <div className="text-center mt-8">
        <p className="text-[8px] text-slate-300 font-black tracking-widest uppercase italic">
          VIONEX Smart Farming Platform • PWA Enabled
        </p>
      </div>
    </div>
  );
}

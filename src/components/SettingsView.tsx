import React, { useState, useEffect, useMemo } from "react";
import {
  Settings,
  User,
  Phone,
  MapPin,
  Mail,
  Sun,
  Moon,
  Globe,
  Bell,
  BellRing,
  Share2,
  Copy,
  Check,
  LogOut,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  AlertCircle,
  Camera,
  HelpCircle,
  MessageCircle,
  Smartphone,
  Save,
  X,
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
  onUpdateCurrentUser?: (updated: any) => void;
  language?: "mr" | "en";
  onLanguageChange?: (lang: "mr" | "en") => void;
}

export default function SettingsView({
  onLogout,
  onInstallApp,
  canInstall,
  currentUser,
  onUpdateCurrentUser,
  language = "mr",
  onLanguageChange,
}: SettingsViewProps) {
  const isEn = language === "en";
  const isFarmer = currentUser?.type === "farmer";
  const isAdmin =
    currentUser?.type === "admin" ||
    (currentUser?.type === "user" && currentUser?.data?.role === "admin");

  // ===================== THEME STATE =====================
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof localStorage !== "undefined") {
      const savedTheme = localStorage.getItem("vionex-app-theme");
      if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    }
    if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
      return "dark";
    }
    return "light";
  });

  const handleToggleTheme = (e: React.MouseEvent | undefined, newTheme: "light" | "dark") => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setTheme(newTheme);
    if (typeof document !== "undefined") {
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("vionex-app-theme", newTheme);
      } catch (err) {
        console.error("Theme storage save error:", err);
      }
    }
  };

  // ===================== LANGUAGE HANDLER =====================
  const handleSelectLanguage = (newLang: "mr" | "en") => {
    if (onLanguageChange) {
      onLanguageChange(newLang);
    } else if (typeof localStorage !== "undefined") {
      localStorage.setItem("vionex-app-language", newLang);
      window.location.reload();
    }
  };

  // ===================== PROFILE EDIT STATE =====================
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const initialProfile = useMemo(() => {
    const data = currentUser?.data || {};
    return {
      name: data.name || "",
      mobile: data.mobile || data.loginId || "",
      alternateMobile: data.alternateMobile || "",
      village: data.village || "",
      email: data.email || "",
      photoUrl: data.photoUrl || "",
    };
  }, [currentUser]);

  const [profileForm, setProfileForm] = useState(initialProfile);

  useEffect(() => {
    setProfileForm(initialProfile);
  }, [initialProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const collectionName = isFarmer ? "farmers" : "users";
      const targetId = currentUser?.data?.id;

      if (!targetId) {
        throw new Error(
          isEn
            ? "User ID not found. Unable to update profile."
            : "वापरकर्ता आयडी सापडला नाही. प्रोफाईल अपडेट करणे शक्य नाही."
        );
      }

      const updatedData = {
        ...currentUser.data,
        name: profileForm.name.trim(),
        alternateMobile: profileForm.alternateMobile.trim(),
        village: profileForm.village.trim(),
        photoUrl: profileForm.photoUrl,
        ...(profileForm.email ? { email: profileForm.email.trim() } : {}),
      };

      await saveItem(collectionName, updatedData, targetId);

      const updatedUser = {
        ...currentUser,
        data: updatedData,
      };

      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(updatedUser);
      } else if (typeof localStorage !== "undefined") {
        localStorage.setItem("vionex-current-user", JSON.stringify(updatedUser));
      }

      setProfileSuccess(
        isEn ? "Profile updated successfully!" : "प्रोफाईल यशस्वीरित्या अद्यतनित झाली!"
      );
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSuccess("");
      }, 1500);
    } catch (err: any) {
      console.error("Profile update error:", err);
      setProfileError(
        err?.message ||
          (isEn
            ? "Failed to update profile. Please try again."
            : "प्रोफाईल अपडेट करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.")
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // ===================== NOTIFICATION STATE =====================
  const [notificationStatus, setNotificationStatus] = useState<string>(() => {
    if (typeof (window as any).Capacitor !== "undefined" && (window as any).Capacitor.isNativePlatform?.()) {
      return "granted";
    }
    if (typeof Notification !== "undefined") return Notification.permission;
    return "unsupported";
  });

  const requestNotificationPermission = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const isNative = typeof (window as any).Capacitor !== "undefined" && (window as any).Capacitor.isNativePlatform?.();
      if (isNative) {
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const perm = await PushNotifications.requestPermissions();
          if (perm.receive === 'granted') {
            setNotificationStatus('granted');
            await PushNotifications.register();
            alert(
              isEn
                ? "VIONEX Notifications Enabled!"
                : "VIONEX नोटिफिकेशन सक्रिय झाले!"
            );
            return;
          } else {
            setNotificationStatus('denied');
            alert(
              isEn
                ? "Notifications permission denied. Please grant permission in device settings."
                : "तुम्ही नोटिफिकेशन परवानगी नाकारली आहे. कृपया डिव्हाइस सेटिंग्जमधून परवानगी द्या."
            );
            return;
          }
        } catch (capErr) {
          console.warn("Capacitor push notification error:", capErr);
        }
      }

      if (typeof Notification === "undefined" || !("Notification" in window)) {
        alert(
          isEn
            ? "Your browser or device does not support notifications."
            : "तुमचा ब्राउझर किंवा डिव्हाइस नोटिफिकेशनला सपोर्ट करत नाही."
        );
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === "granted") {
        try {
          new Notification(
            isEn ? "VIONEX Notifications Enabled" : "VIONEX नोटिफिकेशन सक्रिय झाले!",
            {
              body: isEn
                ? "You will now receive urgent crop schedules and alerts on your device."
                : "तुम्हाला आता महत्वाची वेळापत्रके आणि अलर्ट्स थेट मोबाईल स्क्रीनवर मिळतील.",
              icon: "/icon-192.png",
            }
          );
        } catch {
          if ("serviceWorker" in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg) {
              reg.showNotification(
                isEn ? "VIONEX Notifications Enabled" : "VIONEX नोटिफिकेशन सक्रिय झाले!",
                {
                  body: isEn
                    ? "You will now receive urgent crop schedules and alerts on your device."
                    : "तुम्हाला आता महत्वाची वेळापत्रके आणि अलर्ट्स थेट मोबाईल स्क्रीनवर मिळतील.",
                  icon: "/icon-192.png",
                }
              );
            }
          }
        }
      } else {
        alert(
          isEn
            ? "Notifications permission denied. Please grant permission in browser settings."
            : "तुम्ही नोटिफिकेशन परवानगी नाकारली आहे. कृपया ब्राउझर सेटिंग्जमधून परवानगी द्या."
        );
      }
    } catch (err) {
      console.error("Error enabling notifications:", err);
      alert(
        isEn
          ? "Failed to enable notifications. Please try again."
          : "नोटिफिकेशन सुरू करताना अडचण आली. कृपया पुन्हा प्रयत्न करा."
      );
    }
  };

  // ===================== SHARE LINKS STATE =====================
  const [shareAccordionOpen, setShareAccordionOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const appLink = useMemo(() => {
    if (HOSTING_URL) return HOSTING_URL.replace(/\/$/, "");
    try {
      const url = new URL(window.location.href);
      if (
        url.origin.includes("aistudio.google.com") ||
        url.origin.includes("localhost") ||
        url.origin.includes("127.0.0.1")
      ) {
        return "";
      }
      return url.origin + url.pathname;
    } catch {
      return "";
    }
  }, []);

  const farmerLink = appLink ? `${appLink.replace(/\/$/, "")}/?type=farmer` : "";
  const employeeLink = appLink ? `${appLink.replace(/\/$/, "")}/?view=portal` : "";

  const copyToClipboard = (text: string, key: string) => {
    if (!text) {
      alert(
        isEn
          ? "Hosting link is not configured yet."
          : "होस्टिंग लिंक अजून कॉन्फिगर केलेली नाही."
      );
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLink(key);
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  const shareViaWhatsApp = (link: string, title: string) => {
    if (!link) {
      alert(
        isEn
          ? "Hosting link is not configured yet."
          : "होस्टिंग लिंक अजून कॉन्फिगर केलेली नाही."
      );
      return;
    }
    const shareText = isEn
      ? `*VIONEX Smart Farming* 🚜🌿\n\nAccess your crop schedule and spray plan here:\n🔗 ${link}\n\n*Tip:* In mobile browser, tap the menu (3 dots) and choose 'Install App' for instant access.`
      : `*VIONEX Crop Care* 🚜🌿\n\nपिकांचे वेळापत्रक आणि फवारणी नियोजन पाहण्यासाठी खालील लिंकवर क्लिक करा:\n🔗 ${link}\n\n*टीप:* मोबाईलमध्ये पाहत असल्यास ब्राउझर मेनूमधून 'Install app' निवडा.`;

    if (navigator.share) {
      navigator
        .share({
          title: `VIONEX ${title}`,
          text: isEn ? "VIONEX Smart Farming Link:" : "VIONEX शेतकरी लिंक:",
          url: link,
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
          }
        });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    }
  };

  // ===================== LOGOUT STATE =====================
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Standalone / PWA detection
  const isStandalone = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone
    );
  }, []);

  const handleInstallClick = async () => {
    if (isStandalone) {
      alert(isEn ? "App is already installed on this device!" : "ॲप आधीच इन्स्टॉल केलेले आहे!");
      return;
    }
    if (onInstallApp && canInstall) {
      const res = await onInstallApp();
      if (!res) {
        alert(
          isEn
            ? "Installation was cancelled. You can also install from the browser menu (3 dots)."
            : "इन्स्टॉलेशन रद्द केले. तुम्ही ब्राउझर मेनू (३ ठिपके) मधून 'Install app' निवडू शकता."
        );
      }
    } else {
      alert(
        isEn
          ? "To install, tap your browser menu (3 dots) and select 'Install app' or 'Add to Home screen'."
          : "इन्स्टॉल करण्यासाठी ब्राउझर मेनू (३ ठिपके) वर क्लिक करून 'Install app' किंवा 'Add to Home screen' निवडा."
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] p-4 sm:p-6 pb-24 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {isEn ? "Settings & Preferences" : "सेटिंग्ज आणि प्राधान्ये"}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              {isEn
                ? "Manage your profile, theme, and application preferences"
                : "आपली प्रोफाईल, थीम आणि ॲप्लिकेशन प्राधान्ये व्यवस्थापित करा"}
            </p>
          </div>
        </div>
      </div>

      {/* ===================== SECTION 1: PROFILE & ACCOUNT ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="relative group w-14 h-14 rounded-2xl bg-purple-50 border-2 border-purple-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
              {profileForm.photoUrl ? (
                <img
                  src={profileForm.photoUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-purple-400" />
              )}
              {isEditingProfile && (
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer text-white hover:bg-black/60 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfileForm((prev) => ({
                            ...prev,
                            photoUrl: reader.result as string,
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-800">
                  {currentUser?.data?.name || (isEn ? "User Account" : "वापरकर्ता खाते")}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  {isFarmer
                    ? isEn
                      ? "Farmer"
                      : "शेतकरी"
                    : currentUser?.data?.role
                    ? currentUser.data.role
                    : isEn
                    ? "User"
                    : "वापरकर्ता"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {currentUser?.data?.mobile || currentUser?.data?.loginId || "-"}
                </span>
                {currentUser?.data?.village && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {currentUser.data.village}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setIsEditingProfile(!isEditingProfile);
                setProfileError("");
                setProfileSuccess("");
              }}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
            >
              {isEditingProfile
                ? isEn
                  ? "Cancel"
                  : "रद्द करा"
                : isEn
                ? "Edit Profile"
                : "प्रोफाईल संपादित करा"}
            </button>
          </div>
        </div>

        {/* Edit Profile Collapsible Form */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="p-4 sm:p-5 bg-slate-50/60 space-y-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {isEn ? "Edit Profile Details" : "प्रोफाईल माहिती संपादित करा"}
            </h3>

            {profileError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}
            {profileSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {isEn ? "Full Name" : "पूर्ण नाव"}
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-purple-500 outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {isEn ? "Primary Mobile (Login ID)" : "मुख्य मोबाईल (लॉगिन आयडी)"}
                </label>
                <input
                  type="text"
                  disabled
                  value={profileForm.mobile}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              {isFarmer ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {isEn ? "Alternate Mobile Number" : "पर्यायी मोबाईल नंबर"}
                    </label>
                    <input
                      type="tel"
                      value={profileForm.alternateMobile}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, alternateMobile: e.target.value })
                      }
                      placeholder={isEn ? "e.g. 9876543210" : "उदा. ९८७६५४३२१०"}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-purple-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {isEn ? "Village / City" : "गाव / शहर"}
                    </label>
                    <input
                      type="text"
                      value={profileForm.village}
                      onChange={(e) => setProfileForm({ ...profileForm, village: e.target.value })}
                      placeholder={isEn ? "e.g. Baramati" : "उदा. बारामती"}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-purple-500 outline-none bg-white"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {isEn ? "Email Address" : "ईमेल पत्ता"}
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder={isEn ? "e.g. user@vionex.com" : "उदा. user@vionex.com"}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-purple-500 outline-none bg-white"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {isEn ? "Cancel" : "रद्द करा"}
              </button>
              <button
                type="submit"
                disabled={profileSaving}
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {profileSaving
                  ? isEn
                    ? "Saving..."
                    : "जतन करत आहे..."
                  : isEn
                  ? "Save Changes"
                  : "बदल जतन करा"}
              </button>
            </div>
          </form>
        )}

      </div>

      {/* ===================== SECTION 2: PREFERENCES (LANGUAGE & THEME) ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-purple-600" />
          {isEn ? "Application Preferences" : "ॲप्लिकेशन प्राधान्ये"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Default Language Selector */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div className="mb-3">
              <span className="text-xs font-black text-slate-800 block">
                {isEn ? "Language" : "भाषा"}
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                {isEn ? "Choose your preferred app language" : "तुमची पसंतीची ॲप भाषा निवडा"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectLanguage("mr")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  !isEn
                    ? "bg-purple-600 text-white border-purple-600 shadow-xs font-black"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => handleSelectLanguage("en")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  isEn
                    ? "bg-purple-600 text-white border-purple-600 shadow-xs font-black"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Theme Selector (Light / Dark) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div className="mb-3">
              <span className="text-xs font-black text-slate-800 block">
                {isEn ? "Theme Mode" : "थीम मोड"}
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                {isEn
                  ? "Toggle between Light and Dark interface"
                  : "लाईट किंवा डार्क स्क्रीन पर्याय निवडा"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={(e) => handleToggleTheme(e, "light")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 select-none active:scale-95 ${
                  theme === "light"
                    ? "bg-amber-500 text-white border-amber-500 shadow-xs font-black"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Sun className="w-3.5 h-3.5 pointer-events-none" />
                <span className="pointer-events-none">{isEn ? "Light" : "लाईट"}</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleToggleTheme(e, "dark")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 select-none active:scale-95 ${
                  theme === "dark"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs font-black"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Moon className="w-3.5 h-3.5 pointer-events-none" />
                <span className="pointer-events-none">{isEn ? "Dark" : "डार्क"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== SECTION 3: NOTIFICATIONS & APP ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-purple-600" />
          {isEn ? "Notifications & Device" : "सूचना आणि डिव्हाइस"}
        </h2>

        <div className="space-y-3">
          {/* Push Notifications Row */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800">
                  {isEn ? "Push Notifications" : "पुश सूचना"}
                </span>
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    notificationStatus === "granted"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : notificationStatus === "denied"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-slate-200 text-slate-700 border-slate-300"
                  }`}
                >
                  {notificationStatus === "granted"
                    ? isEn
                      ? "Active"
                      : "सक्रिय"
                    : notificationStatus === "denied"
                    ? isEn
                      ? "Blocked"
                      : "ब्लॉक केले"
                    : isEn
                    ? "Inactive"
                    : "निष्क्रिय"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isEn
                  ? "Receive instant schedule alerts and pest warnings"
                  : "तात्काळ शेड्युल अपडेट्स आणि कीड सूचना थेट मोबाईलवर मिळवा"}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => requestNotificationPermission(e)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 bg-white text-purple-700 border-purple-200 hover:bg-purple-50 active:scale-95"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>
                {notificationStatus === "granted"
                  ? isEn
                    ? "Test Alert"
                    : "चाचणी सूचना"
                  : isEn
                  ? "Enable Notifications"
                  : "सूचना सुरू करा"}
              </span>
            </button>
          </div>

          {/* Install App Row */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800">
                  {isEn ? "Install Mobile Application" : "मोबाईल ॲप इन्स्टॉल करा"}
                </span>
                {isStandalone && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {isEn ? "Installed" : "इन्स्टॉल आहे"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isEn
                  ? "Fast, offline-ready home screen launcher"
                  : "फास्ट, ऑफलाइन चालणारे होम स्क्रीन ॲप"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 bg-white text-slate-700 border-slate-200 hover:bg-slate-100 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              <span>
                {isStandalone
                  ? isEn
                    ? "Installed"
                    : "आधीच इन्स्टॉल आहे"
                  : isEn
                  ? "Install App"
                  : "ॲप इन्स्टॉल करा"}
              </span>
            </button>
          </div>

          {/* Help & Support Row */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black text-slate-800 block">
                {isEn ? "Help & WhatsApp Support" : "मदत आणि व्हॉट्सॲप सपोर्ट"}
              </span>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isEn
                  ? "Questions or issues? Chat directly with VIONEX specialist"
                  : "काही अडचण किंवा प्रश्न असल्यास VIONEX तज्ञांशी थेट संपर्क साधा"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const text = isEn
                  ? "Hello VIONEX Support, I need assistance with the app."
                  : "नमस्कार VIONEX सपोर्ट, मला ॲपबाबत मदत हवी आहे.";
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 active:scale-95 shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{isEn ? "WhatsApp Support" : "व्हॉट्सॲप सपोर्ट"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== SECTION 4: SHARE LINKS (ACCORDION) ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setShareAccordionOpen(!shareAccordionOpen)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
              {isEn ? "Share & Onboarding Links" : "शेअर व ऑनबोर्डिंग लिंक्स"}
            </span>
          </div>
          {shareAccordionOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {shareAccordionOpen && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
            {/* Farmer Web Link */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {isEn ? "Farmer Web Schedule Link" : "शेतकरी वेळापत्रक वेब लिंक"}
              </label>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-600 break-all select-all">
                {farmerLink || (isEn ? "Link not configured" : "लिंक कॉन्फिगर केलेली नाही")}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(farmerLink, "farmer")}
                  className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  {copiedLink === "farmer" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isEn ? "Copied!" : "कॉपी झाले!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isEn ? "Copy Link" : "लिंक कॉपी"}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    shareViaWhatsApp(farmerLink, isEn ? "Farmer Portal" : "शेतकरी पोर्टल")
                  }
                  className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isEn ? "Share via WhatsApp" : "व्हॉट्सॲपवर शेअर"}</span>
                </button>
              </div>
            </div>

            {/* Employee Portal Link */}
            {!isFarmer && (
              <div className="space-y-1.5 pt-3 border-t border-slate-200">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {isEn ? "Employee Portal Link" : "कर्मचारी पोर्टल लिंक"}
                </label>
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-600 break-all select-all">
                  {employeeLink || (isEn ? "Link not configured" : "लिंक कॉन्फिगर केलेली नाही")}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(employeeLink, "employee")}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    {copiedLink === "employee" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isEn ? "Copied!" : "कॉपी झाले!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isEn ? "Copy Link" : "लिंक कॉपी"}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      shareViaWhatsApp(employeeLink, isEn ? "Staff Portal" : "स्टाफ पोर्टल")
                    }
                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{isEn ? "Share via WhatsApp" : "व्हॉट्सॲपवर शेअर"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Admin Public Links Onboarding Settings */}
            {isAdmin && (
              <div className="pt-3 border-t border-slate-200">
                <PublicLinksSettings appLink={appLink} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================== SECTION 5: LOGOUT ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
        {!showLogoutConfirm ? (
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>{isEn ? "Log Out of Account" : "खात्यातून लॉग आउट करा"}</span>
          </button>
        ) : (
          <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 text-center space-y-2.5">
            <p className="text-xs font-bold text-red-900">
              {isEn
                ? "Are you sure you want to log out of VIONEX?"
                : "तुम्हाला खात्री आहे की तुम्हाला VIONEX मधून बाहेर पडायचे आहे?"}
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                {isEn ? "Cancel" : "रद्द करा"}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                {isEn ? "Yes, Log Out" : "होय, लॉग आउट करा"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================== FOOTER ===================== */}
      <div className="text-center pt-2">
        <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
          VIONEX Crop Care • v1.2.0 • Build 2026.10
        </p>
        <p className="text-[9px] text-slate-300 font-medium">
          Smart Farming Platform • 100% Offline Architecture
        </p>
      </div>
    </div>
  );
}

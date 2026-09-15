import { useState } from "react";
import { db } from "../lib/firebase";
import { saveItem } from "../lib/data-sync";
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { 
  UserCheck, 
  Store, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  MapPin, 
  Globe, 
  Layers,
  ChevronRight,
  Briefcase,
  Clock,
  Sparkles
} from "lucide-react";
import { 
  ALL_STATES, 
  DISTRICTS_BY_STATE, 
  getTalukasForDistrict, 
  getVillagesForTaluka, 
  normalizeTalukaName 
} from "../lib/maharashtra-locations";
import { generateVillageCode } from "../hooks/useMasterLocations";
import { getSmartLocation } from "../lib/geo-helper";

export default function NeutralPublicPortal({ initialTab = "dealer", isLocked = false }: { initialTab?: "dealer" | "consultant", isLocked?: boolean } = {}) {
  const [activeForm, setActiveForm] = useState<"dealer" | "consultant">(initialTab);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dealer Form State
  const [dealerForm, setDealerForm] = useState<{
    name: string;
    shopName: string;
    mobile: string;
    alternateMobile: string;
    alternateName: string;
    state: string;
    district: string;
    taluka: string;
    village: string;
    pincode: string;
    lat?: number;
    lon?: number;
  }>({
    name: "",
    shopName: "",
    mobile: "",
    alternateMobile: "",
    alternateName: "",
    state: "Maharashtra",
    district: "Yavatmal",
    taluka: "",
    village: "",
    pincode: ""
  });
  const [isManualVillage, setIsManualVillage] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Consultant Form State
  const [consultantForm, setConsultantForm] = useState({
    name: "",
    phone: "",
    alternatePhone: "",
    specialty: "",
    experience: "",
    address: "",
    workingArea: "",
    consultingArea: ""
  });

  const resetDealerForm = () => {
    setDealerForm({
      name: "",
      shopName: "",
      mobile: "",
      alternateMobile: "",
      alternateName: "",
      state: "Maharashtra",
      district: "Yavatmal",
      taluka: "",
      village: "",
      pincode: ""
    });
    setIsManualVillage(false);
  };

  const resetConsultantForm = () => {
    setConsultantForm({
      name: "",
      phone: "",
      alternatePhone: "",
      specialty: "",
      experience: "",
      address: "",
      workingArea: "",
      consultingArea: ""
    });
  };

  const handleDealerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (!dealerForm.name.trim()) {
      showStatus("कृपया मालकाचे/संपर्क व्यक्तीचे नाव प्रविष्ट करा.", "error");
      return;
    }
    if (!dealerForm.shopName.trim()) {
      showStatus("कृपया दुकानाचे नाव प्रविष्ट करा.", "error");
      return;
    }
    if (!dealerForm.mobile.trim() || dealerForm.mobile.replace(/\D/g, "").length < 10) {
      showStatus("कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.", "error");
      return;
    }
    if (!dealerForm.district) {
      showStatus("कृपया जिल्हा निवडा.", "error");
      return;
    }
    if (!dealerForm.taluka) {
      showStatus("कृपया तालुका निवडा.", "error");
      return;
    }
    if (!dealerForm.village) {
      showStatus("कृपया गाव निवडा किंवा प्रविष्ट करा.", "error");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const cleanMobile = dealerForm.mobile.trim();
      const cleanShop = dealerForm.shopName.trim();
      const cleanName = dealerForm.name.trim();

      // DUPLICATE PREVENTION CHECK
      // Check 1: Mobile check
      const q1 = query(collection(db, "dealers"), where("mobile", "==", cleanMobile));
      const snap1 = await getDocs(q1);
      let isDuplicate = !snap1.empty;

      // Check 2: Shop Name + Owner Name + Village check if mobile is unique
      if (!isDuplicate) {
        const q2 = query(
          collection(db, "dealers"),
          where("shopName", "==", cleanShop),
          where("name", "==", cleanName)
        );
        const snap2 = await getDocs(q2);
        isDuplicate = snap2.docs.some(doc => {
          const data = doc.data();
          return data.village?.toLowerCase() === dealerForm.village.trim().toLowerCase() &&
                 data.taluka?.toLowerCase() === dealerForm.taluka.toLowerCase();
        });
      }

      if (isDuplicate) {
        showStatus("हा डीलर (Dealer) आधीपासूनच सिस्टीममध्ये नोंदणीकृत आहे! (Already Exists)", "error");
        setIsSubmitting(false);
        return;
      }

      // Safe save
      const villageCode = generateVillageCode(
        dealerForm.state,
        dealerForm.district,
        dealerForm.taluka,
        dealerForm.village.trim()
      );

      const payload = {
        name: cleanName,
        shopName: cleanShop,
        mobile: cleanMobile,
        alternateMobile: dealerForm.alternateMobile.trim() || "",
        alternateName: dealerForm.alternateName.trim() || "",
        state: dealerForm.state,
        district: dealerForm.district,
        taluka: dealerForm.taluka,
        village: dealerForm.village.trim(),
        villageCode,
        pincode: dealerForm.pincode.trim() || "",
        lat: dealerForm.lat || null,
        lon: dealerForm.lon || null,
        createdBy: "survey_portal",
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await saveItem("dealers", payload);
      showStatus("डीलरची माहिती यशस्वीरित्या जतन करण्यात आली आहे!", "success");
      resetDealerForm();
    } catch (err) {
      console.error("Dealer submit error:", err);
      showStatus("नोंदणी करताना तांत्रिक अडचण आली. कृपया पुन्हा प्रयत्न करा.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConsultantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (!consultantForm.name.trim()) {
      showStatus("कृपया कन्सल्टंटचे नाव प्रविष्ट करा.", "error");
      return;
    }
    if (!consultantForm.phone.trim() || consultantForm.phone.replace(/\D/g, "").length < 10) {
      showStatus("कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.", "error");
      return;
    }
    if (!consultantForm.specialty.trim()) {
      showStatus("कृपया विशेषज्ञता (उदा. कापूस तज्ञ) प्रविष्ट करा.", "error");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const cleanPhone = consultantForm.phone.trim();
      const cleanName = consultantForm.name.trim();

      // DUPLICATE PREVENTION CHECK
      // Check 1: Phone check
      const q1 = query(collection(db, "consultants"), where("phone", "==", cleanPhone));
      const snap1 = await getDocs(q1);
      let isDuplicate = !snap1.empty;

      // Check 2: Name + specialty check
      if (!isDuplicate) {
        const q2 = query(collection(db, "consultants"), where("name", "==", cleanName));
        const snap2 = await getDocs(q2);
        isDuplicate = snap2.docs.some(doc => {
          const data = doc.data();
          return data.specialty?.toLowerCase() === consultantForm.specialty.trim().toLowerCase() &&
                 data.workingArea?.toLowerCase() === consultantForm.workingArea.trim().toLowerCase();
        });
      }

      if (isDuplicate) {
        showStatus("हा कन्सल्टंट (Consultant) आधीपासूनच सिस्टीममध्ये नोंदणीकृत आहे! (Already Exists)", "error");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        name: cleanName,
        phone: cleanPhone,
        alternatePhone: consultantForm.alternatePhone.trim() || "",
        specialty: consultantForm.specialty.trim(),
        experience: consultantForm.experience.trim() || "",
        address: consultantForm.address.trim() || "",
        workingArea: consultantForm.workingArea.trim() || "",
        consultingArea: consultantForm.consultingArea.trim() || "",
        createdBy: "survey_portal",
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await saveItem("consultants", payload);
      showStatus("कन्सल्टंट माहिती यशस्वीरित्या जतन करण्यात आली आहे!", "success");
      resetConsultantForm();
    } catch (err) {
      console.error("Consultant submit error:", err);
      showStatus("नोंदणी करताना तांत्रिक अडचण आली. कृपया पुन्हा प्रयत्न करा.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showStatus = (msg: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccessMessage(msg);
      setErrorMessage(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setErrorMessage(msg);
      setSuccessMessage(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 py-8 md:py-12 select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-600" />
        
        {/* Neutral Header */}
        <div className="p-6 pb-4 border-b border-slate-100 text-center">
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            VIONEX Registration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            VIONEX मध्ये नोंदणी करण्यासाठी खालील अचूक माहिती भरा.
          </p>
        </div>

        {/* Tab Selection */}
        {!isLocked && (
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-2">
            <button
              onClick={() => {
                setActiveForm("dealer");
                setSuccessMessage(null);
                setErrorMessage(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeForm === "dealer"
                  ? "bg-white text-emerald-700 shadow-sm border border-emerald-100"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <Store className="w-4 h-4 shrink-0" />
              डीलर नोंदणी (Dealer Form)
            </button>
            <button
              onClick={() => {
                setActiveForm("consultant");
                setSuccessMessage(null);
                setErrorMessage(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeForm === "consultant"
                  ? "bg-white text-emerald-700 shadow-sm border border-emerald-100"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              कन्सल्टंट नोंदणी (Consultant)
            </button>
          </div>
        )}

        {/* Status Messages */}
        <div className="px-6 pt-4">
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-extrabold">यशस्वी झाले!</p>
                <p className="text-xs font-medium text-emerald-700 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-extrabold">त्रुटी आढळली!</p>
                <p className="text-xs font-medium text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6">
          {activeForm === "dealer" ? (
            <form onSubmit={handleDealerSubmit} className="space-y-4">
              {/* Shop Name */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                  दुकानाचे नाव (Shop Name) *
                </label>
                <input
                  type="text"
                  required
                  value={dealerForm.shopName}
                  onChange={(e) => setDealerForm({ ...dealerForm, shopName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                  placeholder="उदा. बळीराजा ॲग्रो एजन्सी"
                />
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                  मालकाचे नाव (Owner / Contact Name) *
                </label>
                <input
                  type="text"
                  required
                  value={dealerForm.name}
                  onChange={(e) => setDealerForm({ ...dealerForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                  placeholder="उदा. राहुल पाटील"
                />
              </div>

              {/* Mobile Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    मोबाईल नंबर (Mobile Number) *
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={dealerForm.mobile}
                    onChange={(e) => setDealerForm({ ...dealerForm, mobile: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    placeholder="१० अंकी नंबर"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    अल्टरनेट मोबाईल (Optional)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={dealerForm.alternateMobile}
                    onChange={(e) => setDealerForm({ ...dealerForm, alternateMobile: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    placeholder="पर्यायी नंबर"
                  />
                </div>
              </div>

              {/* State & District Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    राज्य (State)
                  </label>
                  <select
                    value={dealerForm.state}
                    onChange={(e) => setDealerForm({ ...dealerForm, state: e.target.value, district: "", taluka: "", village: "" })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                  >
                    {ALL_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    जिल्हा (District) *
                  </label>
                  {dealerForm.state === "Maharashtra" ? (
                    <select
                      value={dealerForm.district}
                      onChange={(e) => setDealerForm({ ...dealerForm, district: e.target.value, taluka: "", village: "" })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    >
                      <option value="">निवडा</option>
                      {DISTRICTS_BY_STATE["Maharashtra"].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={dealerForm.district}
                      onChange={(e) => setDealerForm({ ...dealerForm, district: e.target.value, taluka: "", village: "" })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                      placeholder="जिल्ह्याचे नाव"
                    />
                  )}
                </div>
              </div>

              {/* Taluka & Village Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    तालुका (Taluka) *
                  </label>
                  {dealerForm.state === "Maharashtra" && dealerForm.district ? (
                    <select
                      value={dealerForm.taluka}
                      onChange={(e) => setDealerForm({ ...dealerForm, taluka: e.target.value, village: "" })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    >
                      <option value="">निवडा</option>
                      {getTalukasForDistrict(dealerForm.district).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={dealerForm.taluka}
                      onChange={(e) => setDealerForm({ ...dealerForm, taluka: e.target.value, village: "" })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                      placeholder="तालुका नाव"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    गाव (Village) *
                  </label>
                  {dealerForm.state === "Maharashtra" && dealerForm.taluka && getVillagesForTaluka(dealerForm.taluka).length > 0 && !isManualVillage ? (
                    <select
                      value={dealerForm.village}
                      onChange={(e) => {
                        if (e.target.value === "__manual__") {
                          setIsManualVillage(true);
                          setDealerForm({ ...dealerForm, village: "" });
                        } else {
                          setDealerForm({ ...dealerForm, village: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    >
                      <option value="">निवडा</option>
                      {getVillagesForTaluka(dealerForm.taluka).map((v, i) => (
                        <option key={i} value={v}>{v}</option>
                      ))}
                      <option value="__manual__">➕ इतर गाव (Manual Entry)</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={dealerForm.village}
                        onChange={(e) => setDealerForm({ ...dealerForm, village: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                        placeholder="उदा. वरूड"
                      />
                      {dealerForm.state === "Maharashtra" && dealerForm.taluka && getVillagesForTaluka(dealerForm.taluka).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsManualVillage(false)}
                          className="absolute right-2 top-2.5 text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-1.5 py-1 rounded font-bold transition"
                        >
                          निवडा
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Pincode & Alternate Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    पिनकोड (Pincode / Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={dealerForm.pincode}
                    onChange={(e) => setDealerForm({ ...dealerForm, pincode: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    placeholder="४४५००१"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    पर्यायी संपर्क व्यक्ती (Alternate Name)
                  </label>
                  <input
                    type="text"
                    value={dealerForm.alternateName}
                    onChange={(e) => setDealerForm({ ...dealerForm, alternateName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    placeholder="उदा. मॅनेजर / भाऊ"
                  />
                </div>
              </div>

              {/* GPS Location (Optional) */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                  GPS लोकेशन (Optional)
                </label>
                {dealerForm.lat && dealerForm.lon ? (
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200 text-xs font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    लोकेशन मिळाले ({dealerForm.lat.toFixed(4)}, {dealerForm.lon.toFixed(4)})
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      setIsDetectingLocation(true);
                      const loc = await getSmartLocation();
                      if (loc) {
                        setDealerForm(prev => ({ ...prev, lat: loc.latitude, lon: loc.longitude }));
                      } else {
                        alert("लोकेशन शोधता आले नाही. GPS ऑन असल्याची खात्री करा.");
                      }
                      setIsDetectingLocation(false);
                    }}
                    disabled={isDetectingLocation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs transition-colors"
                  >
                    {isDetectingLocation ? (
                      <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    )}
                    {isDetectingLocation ? "लोकेशन शोधत आहे..." : "चालू लोकेशन मिळवा (Capture Current Location)"}
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-700/20 active:scale-98 transition-all text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    डीलर माहिती सबमिट करा
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConsultantSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                  कन्सल्टंटचे नाव (Consultant Name) *
                </label>
                <input
                  type="text"
                  required
                  value={consultantForm.name}
                  onChange={(e) => setConsultantForm({ ...consultantForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                  placeholder="उदा. डॉ. संजय पाटील"
                />
              </div>

              {/* Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    मोबाईल नंबर (Mobile Number) *
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={consultantForm.phone}
                    onChange={(e) => setConsultantForm({ ...consultantForm, phone: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    placeholder="१० अंकी मोबाईल नंबर"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    अल्टरनेट मोबाईल (Alternate Phone)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={consultantForm.alternatePhone}
                    onChange={(e) => setConsultantForm({ ...consultantForm, alternatePhone: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    placeholder="पर्यायी नंबर"
                  />
                </div>
              </div>

              {/* Specialty & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    विशेषज्ञता (Specialty) *
                  </label>
                  <input
                    type="text"
                    required
                    value={consultantForm.specialty}
                    onChange={(e) => setConsultantForm({ ...consultantForm, specialty: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    placeholder="उदा. कापूस व सोयाबीन तज्ञ"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    अनुभव (Experience)
                  </label>
                  <input
                    type="text"
                    value={consultantForm.experience}
                    onChange={(e) => setConsultantForm({ ...consultantForm, experience: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    placeholder="उदा. ८ वर्षे अनुभव"
                  />
                </div>
              </div>

              {/* Proper Address */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                  कन्सल्टन्सी पत्ता (Consultancy Address)
                </label>
                <textarea
                  rows={2}
                  value={consultantForm.address}
                  onChange={(e) => setConsultantForm({ ...consultantForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium resize-none"
                  placeholder="मुख्य किंवा प्रॉपर पत्ता टाका"
                />
              </div>

              {/* Working Area & Consulting Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    कार्यक्षेत्र (Working Area)
                  </label>
                  <input
                    type="text"
                    value={consultantForm.workingArea}
                    onChange={(e) => setConsultantForm({ ...consultantForm, workingArea: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    placeholder="उदा. घाटंजी तालुका"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                    कन्सल्टिंग क्षेत्र (Consulting Area)
                  </label>
                  <input
                    type="text"
                    value={consultantForm.consultingArea}
                    onChange={(e) => setConsultantForm({ ...consultantForm, consultingArea: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-sm font-medium"
                    placeholder="उदा. १५० एकर / ५० शेतकरी"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-700/20 active:scale-98 transition-all text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    कन्सल्टंट माहिती सबमिट करा
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

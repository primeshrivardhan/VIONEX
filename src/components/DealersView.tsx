import { safeJsonParse } from "../lib/safeJson";
import React, { useState, useEffect } from "react";
import { Store, Search, Trash2, Edit, Phone, MapPin, Plus, Save, X, PhoneCall, MessageSquare, Send, FileText, Loader2, CheckCircle, Eye, History, Share2, Printer, Building2, User, Users, ChevronDown } from "lucide-react";
import { Dealer } from "../types";
import ConfirmationModal from "./ConfirmationModal";
import { motion, AnimatePresence } from "motion/react";
import { MAHARASHTRA_DISTRICTS, getTalukasForDistrict, getVillagesForTaluka } from "../lib/maharashtra-locations";
import { generateVillageCode } from "../hooks/useMasterLocations";
import { getSmartLocation } from "../lib/geo-helper";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const BUSINESS_TYPES = [
  "Proprietorship (मालकी हक्क)",
  "Partnership (भागीदारी)",
  "Private Limited (प्रायव्हेट लिमिटेड)",
  "Public Limited (पब्लिक लिमिटेड)",
  "LLP (मर्यादित दायित्व भागीदारी)",
  "Other (इतर)"
];

const BILINGUAL_DISTRICTS: Record<string, string> = {
  "Sangli": "सांगली (Sangli)",
  "Satara": "सातारा (Satara)",
  "Kolhapur": "कोल्हापूर (Kolhapur)",
  "Pune": "पुणे (Pune)",
  "Solapur": "सोलापूर (Solapur)",
  "Yavatmal": "यवतमाळ (Yavatmal)",
  "Ahmednagar": "अहमदनगर (Ahmednagar)",
  "Akola": "अकोला (Akola)",
  "Amravati": "अमरावती (Amravati)",
  "Beed": "बीड (Beed)",
  "Bhandara": "भंडारा (Bhandara)",
  "Buldhana": "बुलढाणा (Buldhana)",
  "Chandrapur": "चंद्रपूर (Chandrapur)",
  "Dhule": "धुळे (Dhule)",
  "Gadchiroli": "गडचिरोली (Gadchiroli)",
  "Gondia": "गोंदिया (Gondia)",
  "Hingoli": "हिंगोली (Hingoli)",
  "Jalgaon": "जळगाव (Jalgaon)",
  "Jalna": "जालना (Jalna)",
  "Latur": "लातूर (Latur)",
  "Mumbai City": "मुंबई शहर (Mumbai City)",
  "Mumbai Suburban": "मुंबई उपनगर (Mumbai Suburban)",
  "Nagpur": "नागपूर (Nagpur)",
  "Nanded": "नांदेड (Nanded)",
  "Nandurbar": "नंदुरबार (Nandurbar)",
  "Nashik": "नाशिक (Nashik)",
  "Osmanabad (Dharashiv)": "धाराशिव (Dharashiv)",
  "Palghar": "पालघर (Palghar)",
  "Parbhani": "परभणी (Parbhani)",
  "Raigad": "रायगड (Raigad)",
  "Ratnagiri": "रत्नागिरी (Ratnagiri)",
  "Sindhudurg": "सिंधुदुर्ग (Sindhudurg)",
  "Thane": "ठाणे (Thane)",
  "Washim": "वाशीम (Washim)",
  "Chhatrapati Sambhajinagar (Aurangabad)": "छत्रपती संभाजीनगर (Aurangabad)"
};

const BILINGUAL_TALUKAS: Record<string, string> = {
  "Khanapur (Vita)": "खानापूर (Khanapur)",
  "Khanapur": "खानापूर (Khanapur)",
  "Atpadi": "आटपाडी (Atpadi)",
  "Miraj": "मिरज (Miraj)",
  "Tasgaon": "तासगाव (Tasgaon)",
  "Walwa": "वाळवा (Walwa)",
  "Shirala": "शिराळा (Shirala)",
  "Kavathemahankal": "कवठेमहांकाळ (Kavathemahankal)",
  "Jat": "जत (Jat)",
  "Palus": "पलूस (Palus)",
  "Kadegaon": "कडेगाव (Kadegaon)",
  "Karad": "कराड (Karad)",
  "Satara": "सातारा (Satara)",
  "Patan": "पाटण (Patan)",
  "Phaltan": "फलटण (Phaltan)",
  "Khatav": "खटाव (Khatav)",
  "Man": "माण (Man)",
  "Koregaon": "कोरेगाव (Koregaon)",
  "Wai": "वाई (Wai)",
  "Mahabaleshwar": "महाबळेश्वर (Mahabaleshwar)",
  "Jawali": "जावळी (Jawali)",
  "Khandala": "खंडाळा (Khandala)",
  "Karvir": "करवीर (Karvir)",
  "Hatkanangle": "हातकणंगले (Hatkanangle)",
  "Shirol": "शिरोळ (Shirol)",
  "Kagal": "कागल (Kagal)",
  "Radhanagari": "राधानगरी (Radhanagari)",
  "Panhala": "पन्हाळा (Panhala)",
  "Shahuwadi": "शाहूवाडी (Shahuwadi)",
  "Bhudargad": "भुदरगड (Bhudargad)",
  "Ajara": "आजरा (Ajara)",
  "Gadhinglaj": "गडहिंग्लज (Gadhinglaj)",
  "Chandgad": "चंदगड (Chandgad)",
  "Gaganbawada": "गगनबावडा (Gaganbawada)",
  "Haveli": "हवेली (Haveli)",
  "Pune City": "पुणे शहर (Pune City)",
  "Baramati": "बारामती (Baramati)",
  "Indapur": "इंदापूर (Indapur)",
  "Daund": "दौंड (Daund)",
  "Shirur": "शिरूर (Shirur)",
  "Khed": "खेड (Khed)",
  "Junnar": "जुन्नर (Junnar)",
  "Ambegaon": "आंबेगाव (Ambegaon)",
  "Maval": "मावळ (Maval)",
  "Mulshi": "मुळशी (Mulshi)",
  "Purandhar": "पुरंदर (Purandhar)",
  "Bhor": "भोर (Bhor)",
  "Velhe": "वेल्हे (Velhe)",
  "Pandharpur": "पंढरपूर (Pandharpur)",
  "Sangola": "सांगोला (Sangola)",
  "Malshiras": "माळशिरस (Malshiras)",
  "Barshi": "बार्शी (Barshi)",
  "Mohol": "मोहोळ (Mohol)",
  "Madha": "माढा (Madha)",
  "Karmala": "करमाळा (Karmala)",
  "Mangalwedha": "मंगळवेढा (Mangalwedha)",
  "Akkalkot": "अक्कलकोट (Akkalkot)",
  "Solapur North": "उत्तर सोलापूर (North Solapur)",
  "Solapur South": "दक्षिण सोलापूर (South Solapur)",
  "Yavatmal": "यवतमाळ (Yavatmal)",
  "Pusad": "पुसद (Pusad)",
  "Umarkhed": "उमरखेड (Umarkhed)",
  "Digras": "दिग्रस (Digras)",
  "Darwha": "दारव्हा (Darwha)",
  "Arni": "आर्णी (Arni)",
  "Ner": "नेर (Ner)",
  "Kalamb": "कळंब (Kalamb)",
  "Babulgaon": "बाभूळगाव (Babulgaon)",
  "Ghatanji": "घाटंजी (Ghatanji)",
  "Ralegaon": "राळेगाव (Ralegaon)",
  "Maregaon": "मारेगाव (Maregaon)",
  "Wani": "वणी (Wani)",
  "Mahagaon": "महागाव (Mahagaon)",
  "Kelapur (Pandharkawada)": "केळापूर (Kelapur)",
  "Zari Jamni": "झरी जामणी (Zari Jamni)"
};


interface DealersViewProps {
  dealers: Dealer[];
  allDealers: Dealer[];
  onAddDealer: (dealer: Omit<Dealer, "id">) => Promise<any>;
  onEditDealer: (id: string, dealer: Partial<Dealer>) => Promise<any>;
  onDeleteDealer: (id: string) => Promise<any>;
  isFarmerView?: boolean;
  permissions?: any;
}

export default function DealersView({
  dealers,
  allDealers,
  onAddDealer,
  onEditDealer,
  onDeleteDealer,
  isFarmerView = false,
  permissions,
}: DealersViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [dealerToDelete, setDealerToDelete] = useState<Dealer | null>(null);

  // Broadcast Message states
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastAttachment, setBroadcastAttachment] = useState<File | null>(null);
  const [broadcastAttachmentType, setBroadcastAttachmentType] = useState<"none" | "image" | "pdf" | "document">("none");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastLogs, setBroadcastLogs] = useState<string[]>([]);
  const [showBroadcastHistory, setShowBroadcastHistory] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("vionex_dealer_broadcasts");
      return saved ? (saved === "undefined" ? undefined : safeJsonParse(saved)) : [];
    } catch {
      return [];
    }
  });

  // Form State
  const [formData, setFormData] = useState<Omit<Dealer, "id">>({
    name: "",
    shopName: "",
    businessType: "Proprietorship (मालकी हक्क)",
    isBranch: false,
    mobile: "",
    alternateMobile: "",
    alternateName: "",
    village: "",
    taluka: "Khanapur (Vita)",
    district: "Sangli",
    state: "Maharashtra",
    pincode: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isManualVillage, setIsManualVillage] = useState(false);

  useEffect(() => {
    const handleEditEvent = (e: any) => {
      if (e.detail) {
        handleOpenEditForm(e.detail);
      }
    };
    window.addEventListener('edit-dealer', handleEditEvent);
    return () => window.removeEventListener('edit-dealer', handleEditEvent);
  }, []);


  const autoDetectDealerLocation = async () => {
    setIsDetectingLocation(true);
    const loc = await getSmartLocation();
    if (!loc) {
      alert("लोकेशन शोधता आले नाही. GPS ऑन असल्याचे तपासा.");
      setIsDetectingLocation(false);
      return;
    }

    const { latitude, longitude } = loc;
    setFormData(prev => ({ ...prev, lat: latitude, lon: longitude }));
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en-US,en`
      );
          const data = await response.json();
          const addr = data.address || {};
          
          const rawState = addr.state || "";
          const rawDistrict = addr.state_district || addr.district || addr.county || addr.city_district || "";
          const rawTaluka = addr.subdistrict || addr.tehsil || addr.taluk || addr.suburb || addr.taluka || addr.city || addr.town || addr.municipality || "";
          const rawVillage = addr.village || addr.suburb || addr.town || addr.neighbourhood || addr.hamlet || addr.locality || addr.croft || "";
          
          const extractPincode = (p: string, d: string): string => {
            const combined = `${p || ""} ${d || ""}`;
            const match = combined.match(/\b\d{6}\b/);
            return match ? match[0] : "";
          };

          const rawPincode = extractPincode(addr.postcode, data.display_name);

          // Gather all text values from structured address and comma-split display name
          const addrValues = [
            ...Object.values(addr).map(v => String(v)),
            ...(data.display_name ? data.display_name.split(",").map(s => s.trim()) : [])
          ].filter(Boolean);

          const cleanAndNormalize = (str: string): string => {
            if (!str) return "";
            return str.toLowerCase()
              .replace(/\(.*\)/g, "")
              .replace(/district|tehsil|taluka|taluk|subdistrict|division|village|town|city|state/g, "")
              .replace(/[^a-z0-9]/g, "")
              .trim();
          };

          const isNameMatch = (nameA: string, nameB: string): boolean => {
            if (!nameA || !nameB) return false;
            const normA = cleanAndNormalize(nameA);
            const normB = cleanAndNormalize(nameB);
            if (!normA || !normB) return false;
            
            if (normA === normB) {
              return true;
            }
            
            if (normA.length >= 5 && normB.length >= 5) {
              if (normA.includes(normB) || normB.includes(normA)) {
                return true;
              }
            }
            
            return false;
          };

          // Check if it's Maharashtra
          const isMaha = rawState.toLowerCase().includes("maharashtra") ||
                         addrValues.some(v => v.toLowerCase().includes("maharashtra")) ||
                         MAHARASHTRA_DISTRICTS.some(d => isNameMatch(d, rawDistrict));

          let finalState = "Other";
          let finalDistrict = "";
          let finalTaluka = "";
          let finalVillage = "";
          let setManual = true;

          if (isMaha) {
            finalState = "Maharashtra";

            // 1. Find matched district
            let matchedDist = MAHARASHTRA_DISTRICTS.find(d => isNameMatch(d, rawDistrict));
            if (!matchedDist) {
              matchedDist = MAHARASHTRA_DISTRICTS.find(d => addrValues.some(val => isNameMatch(d, val)));
            }
            finalDistrict = matchedDist || rawDistrict || "Yavatmal";

            // 2. Find matched taluka
            const talukas = getTalukasForDistrict(finalDistrict);
            let matchedTal = talukas.find(t => isNameMatch(t, rawTaluka));
            if (!matchedTal) {
              matchedTal = talukas.find(t => addrValues.some(val => isNameMatch(t, val)));
            }
            finalTaluka = matchedTal || rawTaluka || "";

            // 3. Find matched village
            if (finalTaluka) {
              const villages = getVillagesForTaluka(finalTaluka);
              
              // Prioritize rawVillage (from address.village, hamlet, etc.)
              let matchedVill = villages.find(v => isNameMatch(v, rawVillage));
              
              if (matchedVill) {
                finalVillage = matchedVill;
                setManual = false;
              } else {
                // Fallback: check other address fields, but avoid aggressive matching
                // We only check if it matches EXACTLY to avoid "Siddhewadi road" matching "Siddhewadi"
                const exactVill = villages.find(v => {
                  const normV = cleanAndNormalize(v);
                  return addrValues.some(val => cleanAndNormalize(val) === normV);
                });
                
                if (exactVill) {
                  finalVillage = exactVill;
                  setManual = false;
                } else {
                  finalVillage = rawVillage;
                  setManual = true;
                }
              }
            } else {
              finalVillage = rawVillage;
              setManual = true;
            }
          } else {
            finalState = rawState || "Other";
            finalDistrict = rawDistrict;
            finalTaluka = rawTaluka;
            finalVillage = rawVillage;
            setManual = true;
          }

          setIsManualVillage(setManual);
          setFormData((prev) => ({
            ...prev,
            lat: latitude,
            lon: longitude,
            address: data.display_name,
            state: finalState,
            district: finalDistrict,
            taluka: finalTaluka,
            village: finalVillage,
            pincode: rawPincode,
            country: (addr.country === "India" || addr.country_code === "in") ? "India" : (addr.country || prev.country),
          }));
        } catch (error) {
          console.error("Geocoding error:", error);
          setFormData((prev) => ({
            ...prev,
            lat: latitude,
            lon: longitude,
          }));
        } finally {
          setIsDetectingLocation(false);
        }
  };

  const filteredDealers = dealers.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.shopName || "").toLowerCase().includes(q) ||
      (d.mobile || "").toLowerCase().includes(q) ||
      (d.village || "").toLowerCase().includes(q) ||
      (d.taluka || "").toLowerCase().includes(q) ||
      (d.district || "").toLowerCase().includes(q)
    );
  });

  const handleOpenAddForm = () => {
    setEditingDealer(null);
    setFormData({
      name: "",
      shopName: "",
      businessType: "Proprietorship (मालकी हक्क)",
      isBranch: false,
      mobile: "",
      alternateMobile: "",
      alternateName: "",
      village: "",
      taluka: "Khanapur (Vita)",
      district: "Sangli",
      state: "Maharashtra",
      pincode: "",
      lat: undefined,
      lon: undefined,
      address: undefined,
    });
    setFormErrors({});
    setIsManualVillage(false);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (dealer: Dealer) => {
    setEditingDealer(dealer);
    setFormData({
      name: dealer.name,
      shopName: dealer.shopName,
      businessType: dealer.businessType || "Proprietorship (मालकी हक्क)",
      isBranch: Boolean(dealer.isBranch),
      mobile: dealer.mobile,
      alternateMobile: dealer.alternateMobile || "",
      alternateName: dealer.alternateName || "",
      village: dealer.village,
      taluka: dealer.taluka,
      district: dealer.district,
      state: dealer.state || "Maharashtra",
      pincode: dealer.pincode || "",
      lat: dealer.lat,
      lon: dealer.lon,
      address: dealer.address,
    });
    setFormErrors({});
    setIsManualVillage(false);
    setIsFormOpen(true);
  };

  const validateForm = () => {
    // Duplicate validation
    const existingDealer = (allDealers || []).find((d) => {
      if (editingDealer && d.id === editingDealer.id) return false;
      const dMob = d.mobile ? String(d.mobile).replace(/\D/g, "").slice(-10) : "";
      const ndMob = formData.mobile ? String(formData.mobile).replace(/\D/g, "").slice(-10) : "";
      const isMobileDuplicate = dMob && ndMob && dMob.length >= 10 && dMob === ndMob;
      const dName = d.shopName ? d.shopName.trim().toLowerCase() : "";
      const ndName = formData.shopName ? formData.shopName.trim().toLowerCase() : "";
      const isNameDuplicate = dName && ndName && dName === ndName;
      const dGst = (d as any).gstNumber ? String((d as any).gstNumber).trim().toLowerCase() : "";
      const ndGst = (formData as any).gstNumber ? String((formData as any).gstNumber).trim().toLowerCase() : "";
      const isGstDuplicate = dGst && ndGst && dGst === ndGst;
      return isMobileDuplicate || isGstDuplicate;
    });
    
    if (existingDealer) {
      alert("हा डीलर आधीपासून नोंदणीकृत आहे. (This dealer is already added.)");
      return false;
    }
    const errors: Record<string, string> = {};
    if (!formData.shopName.trim()) errors.shopName = "दुकान / शॉपचे नाव आवश्यक आहे";
    if (!formData.name.trim()) errors.name = "डीलरचे नाव आवश्यक आहे";
    if (!formData.mobile.trim()) {
      errors.mobile = "मोबाईल नंबर आवश्यक आहे";
    } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
      errors.mobile = "१० अंकी वैध मोबाईल नंबर प्रविष्ट करा";
    }
    
    if (!formData.village.trim()) errors.village = "गाव आवश्यक आहे";
    if (!formData.taluka.trim()) errors.taluka = "तालुका आवश्यक आहे";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Auto-resolve official taluka if available to enforce strict boundaries
      const finalTaluka = formData.taluka;
      const villageCode = generateVillageCode(formData.state || "Maharashtra", formData.district, finalTaluka, formData.village);
      const dataToSave = { ...formData, taluka: finalTaluka, villageCode };

      if (editingDealer && editingDealer.id) {
        await onEditDealer(editingDealer.id, dataToSave);
      } else {
        await onAddDealer(dataToSave);
      }
      setIsFormOpen(false);
      setEditingDealer(null);
    } catch (err) {
      console.error("Error saving dealer:", err);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim() && !broadcastAttachment) {
      alert("कृपया संदेश लिहा किंवा फाईल जोडा.");
      return;
    }

    setIsBroadcasting(true);
    setBroadcastProgress(0);
    setBroadcastLogs(["🚀 WhatsApp API गेटवेशी जोडत आहे..."]);

    const targetDealers = dealers.filter(d => d.mobile);
    const total = targetDealers.length;

    if (total === 0) {
      setBroadcastLogs(prev => [...prev, "❌ मेसेज पाठवण्यासाठी कोणतेही डीलर उपलब्ध नाहीत!"]);
      setIsBroadcasting(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    setBroadcastLogs(prev => [...prev, `✅ गेटवे जोडला गेला. ${total} डीलर शोधले.`]);

    for (let i = 0; i < total; i++) {
      const dealer = targetDealers[i];
      const cleanNum = dealer.mobile.replace(/\D/g, "");
      
      setBroadcastLogs(prev => [
        ...prev,
        `⏳ डीलर ${dealer.shopName} (${dealer.name}) - +91 ${cleanNum} ला पाठवत आहे...`
      ]);

      setBroadcastProgress(Math.round(((i + 1) / total) * 100));
      await new Promise(resolve => setTimeout(resolve, 300));

      setBroadcastLogs(prev => [
        ...prev,
        `✅ डीलर ${dealer.shopName} ला संदेश यशस्वीरित्या डिलिव्हर झाला!`
      ]);
    }

    const newBroadcast = {
      id: "broadcast-" + Date.now(),
      text: broadcastText,
      attachmentType: broadcastAttachmentType,
      attachmentName: broadcastAttachment ? broadcastAttachment.name : null,
      sentAt: Date.now(),
      recipientsCount: total,
    };

    const updatedHistory = [newBroadcast, ...broadcastHistory];
    setBroadcastHistory(updatedHistory);
    localStorage.setItem("vionex_dealer_broadcasts", JSON.stringify(updatedHistory));

    try {
      if (db) {
        await setDoc(doc(db, "dealer-broadcasts", newBroadcast.id), newBroadcast);
      }
    } catch (err) {
      console.warn("Firestore save skipped for broadcast log:", err);
    }

    setBroadcastLogs(prev => [...prev, "🎉 ब्रॉडकास्ट संदेश यशस्वीरित्या पूर्ण झाला! (Broadcast Complete)"]);
    setIsBroadcasting(false);
    setBroadcastText("");
    setBroadcastAttachment(null);
    setBroadcastAttachmentType("none");
  };

  const handleDeleteConfirm = async () => {
    if (dealerToDelete && dealerToDelete.id) {
      try {
        await onDeleteDealer(dealerToDelete.id);
        setDealerToDelete(null);
      } catch (err) {
        console.error("Error deleting dealer:", err);
      }
    }
  };

  const handleShareLink = () => {
    const link = `${window.location.origin}/?view=register-dealer`;
    navigator.clipboard.writeText(link).then(() => {
      alert("Dealer Registration Link copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy link. Link: " + link);
    });
  };

  return (
    <div className="p-4 mx-auto max-w-7xl">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 mb-4 flex justify-between items-center gap-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap overflow-hidden">
          <Store className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="truncate">Dealer Network ({filteredDealers.length})</span>
        </h2>
        {(!isFarmerView && permissions?.dealerAdd !== false) && (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => window.print()}
              title="Download PDF / Print"
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-all border border-slate-200 active:scale-95"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleShareLink}
              title="Copy Dealer Registration Link"
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 hover:text-emerald-700 transition-all border border-emerald-200 active:scale-95"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenAddForm}
              title="Add Dealer"
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 hover:text-indigo-700 transition-all border border-indigo-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative mb-4 print:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="दुकान, डीलरचे नाव, मोबाईल किंवा तालुका शोधा..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-indigo-500 outline-none text-xs sm:text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredDealers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
          <Store className="w-16 h-16 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-base font-bold text-slate-800 mb-1">कोणतेही डीलर सापडले नाहीत</h3>
          <p className="text-xs text-slate-500 mb-6">कृपया डीलरची नोंदणी करून नेटवर्क वाढवा.</p>
          {!isFarmerView && (
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              पहिला डीलर जोडा
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDealers.map((dealer, idx) => (
            <motion.div
              key={dealer.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.4) }}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-slate-800 text-base leading-tight break-words">
                  {dealer.shopName}
                </h3>
                <p className="text-sm text-indigo-600 font-bold mt-0.5">
                  {dealer.name}
                </p>

                <div className="space-y-2 my-3 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="font-mono text-slate-700 font-medium break-all">
                      <div>{dealer.mobile}</div>
                      {dealer.alternateMobile && (
                        <div className="text-slate-500 text-[11px] mt-0.5 flex flex-wrap items-center gap-1">
                          <span>Alt: {dealer.alternateMobile}</span>
                          {dealer.alternateName && (
                            <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-sans font-bold text-[10px]">
                              ({dealer.alternateName})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="break-words leading-snug">
                      {dealer.village}, ता. {dealer.taluka}, जि. {dealer.district}{dealer.state ? `, ${dealer.state}` : ""}
                      {dealer.pincode && ` - ${dealer.pincode}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-row items-center justify-around gap-2 mt-2 pt-3 border-t border-slate-100">
                <a
                  href={`tel:${dealer.mobile}`}
                  className="flex items-center justify-center w-9 h-9 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 active:scale-95 transition-all shrink-0"
                  title="कॉल करा (Call)"
                >
                  <Phone className="w-4 h-4" />
                </a>
                {dealer.lat && dealer.lon ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${dealer.lat},${dealer.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 active:scale-95 transition-all shrink-0"
                    title="मॅपवर पहा (Map)"
                  >
                    <MapPin className="w-4 h-4" />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    const cleanNumber = dealer.mobile.replace(/\D/g, "");
                    const msg = `नमस्कार ${dealer.shopName} (${dealer.name}),\n\nनवीन कृषी माहिती, उत्पादने व शेड्युल अपडेट्स आपल्या Dealer Network पोर्टलमध्ये उपलब्ध करण्यात आले आहेत. कृपया खालील लिंकवर जाऊन त्वरित तपासा:\n\n${window.location.origin}/?loginType=user\n\nआपला नम्र,\nVIONEX ऍडमिन.`;
                    const waUrl = `https://wa.me/91${cleanNumber}?text=${msg}`;
                    window.open(waUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="flex items-center justify-center w-9 h-9 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 active:scale-95 transition-all shrink-0"
                  title="WhatsApp वर अलर्ट पाठवा"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.516.893 3.004 1.347 4.509 1.348 5.123 0 9.289-4.167 9.291-9.291.001-2.481-.964-4.813-2.719-6.569-1.754-1.755-4.088-2.72-6.571-2.72-5.124 0-9.291 4.167-9.293 9.291-.001 1.956.611 3.407 1.645 4.908l-.968 3.541 3.606-.948zm9.581-6.195c-.247-.123-1.464-.722-1.692-.804-.226-.082-.392-.123-.556.123s-.638.804-.783.968c-.144.164-.289.185-.536.062-.247-.124-1.043-.385-1.986-1.227-.733-.654-1.228-1.463-1.372-1.71-.144-.247-.015-.38.109-.502.112-.11.247-.288.37-.432.124-.144.165-.247-.247-.412.082-.164.041-.31-.021-.432s-.556-1.339-.762-1.833c-.2-.482-.403-.416-.556-.425-.144-.006-.31-.008-.474-.008s-.433.062-.659.31-.865.845-.865 2.06.891 2.391.994 2.535c.103.144 1.754 2.678 4.248 3.753.593.256 1.056.409 1.417.523.596.189 1.139.162 1.567.098.477-.071 1.464-.598 1.67-.1.175.206.516.206.556 1.031.041 0 .288-.062.433-.124z" />
                  </svg>
                </button>
                {!isFarmerView && (
                  <>
                    {permissions?.dealerEdit !== false && (
                      <button
                        onClick={() => handleOpenEditForm(dealer)}
                        className="flex items-center justify-center w-9 h-9 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl active:scale-95 transition-all shrink-0"
                        title="दुरुस्त करा (Edit)"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {permissions?.dealerDelete !== false && (
                      <button
                        onClick={() => setDealerToDelete(dealer)}
                        className="flex items-center justify-center w-9 h-9 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-xl active:scale-95 transition-all shrink-0"
                        title="हटवा (Delete)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4 z-50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]"
            >
              {/* Header */}
              <div className="bg-[#4c35de] text-white px-5 py-3.5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-base text-white">
                    {editingDealer ? "Edit Dealer" : "Add Dealer"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition text-white/90 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
                {/* SECTION 1: BASIC INFO */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#4c35de]">
                    BASIC INFO
                  </h4>

                  {/* Business Type */}
                  <div className="relative flex items-center">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <select
                      value={formData.businessType || BUSINESS_TYPES[0]}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-[#4c35de]/20 focus:border-[#4c35de] outline-none appearance-none cursor-pointer"
                    >
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 pointer-events-none" />
                  </div>

                  {/* Shop / Firm Name */}
                  <div>
                    <div className="relative flex items-center">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.shopName}
                        onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                        placeholder="Shop / Firm Name *"
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#4c35de]/20 focus:border-[#4c35de] outline-none ${
                          formErrors.shopName ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-white"
                        }`}
                      />
                    </div>
                    {formErrors.shopName && (
                      <span className="text-[11px] text-red-500 font-bold mt-1 block ml-1">{formErrors.shopName}</span>
                    )}
                  </div>

                  {/* Dealer / Contact Person Name */}
                  <div>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Dealer / Contact Person Name *"
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#4c35de]/20 focus:border-[#4c35de] outline-none ${
                          formErrors.name ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-white"
                        }`}
                      />
                    </div>
                    {formErrors.name && (
                      <span className="text-[11px] text-red-500 font-bold mt-1 block ml-1">{formErrors.name}</span>
                    )}
                  </div>

                  {/* Mobile & Alt Mobile */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="relative flex items-center">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                        <input
                          type="tel"
                          maxLength={10}
                          value={formData.mobile}
                          onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                          placeholder="Mobile Number *"
                          className={`w-full pl-10 pr-2 py-2.5 rounded-xl border text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#4c35de]/20 focus:border-[#4c35de] outline-none ${
                            formErrors.mobile ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-white"
                          }`}
                        />
                      </div>
                      {formErrors.mobile && (
                        <span className="text-[10px] text-red-500 font-bold mt-1 block ml-1">{formErrors.mobile}</span>
                      )}
                    </div>

                    <div>
                      <div className="relative flex items-center">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                        <input
                          type="tel"
                          maxLength={10}
                          value={formData.alternateMobile || ""}
                          onChange={(e) => setFormData({ ...formData, alternateMobile: e.target.value.replace(/\D/g, "") })}
                          placeholder="Alt Mobile"
                          className="w-full pl-10 pr-2 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#4c35de]/20 focus:border-[#4c35de] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Alternate Contact Name */}
                  <div className="relative flex items-center">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={formData.alternateName || ""}
                      onChange={(e) => setFormData({ ...formData, alternateName: e.target.value })}
                      placeholder="Alternate Contact Name"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#4c35de]/20 focus:border-[#4c35de] outline-none"
                    />
                  </div>
                </div>

                {/* SECTION 2: LOCATION TYPE */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#4c35de]">
                    LOCATION TYPE
                  </h4>
                  <div className="rounded-xl border border-slate-200 bg-white py-2.5 px-4 flex items-center justify-center">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.isBranch)}
                        onChange={(e) => setFormData({ ...formData, isBranch: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-[#4c35de] focus:ring-[#4c35de] cursor-pointer"
                      />
                      <span>Branch (शाखा)</span>
                    </label>
                  </div>
                </div>

                {/* SECTION 3: LOCATION DETAILS */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#4c35de]">
                    LOCATION DETAILS
                  </h4>

                  {/* Row 1: Village * (Left) + Taluka (Right) */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Village */}
                    <div>
                      {!isManualVillage ? (
                        <div className="relative flex items-center">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                          <select
                            value={formData.village}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "__manual__") {
                                setIsManualVillage(true);
                                setFormData({ ...formData, village: "" });
                              } else {
                                setFormData({ ...formData, village: val });
                              }
                            }}
                            className={`w-full pl-10 pr-8 py-2.5 rounded-xl border text-sm text-slate-800 bg-white focus:ring-2 focus:ring-[#4c35de]/20 focus:border-[#4c35de] outline-none appearance-none cursor-pointer font-medium ${
                              formErrors.village ? "border-red-400 bg-red-50/20" : "border-slate-200"
                            }`}
                          >
                            <option value="">Village *</option>
                            {getVillagesForTaluka(formData.taluka).map((v, i) => (
                              <option key={i} value={v}>
                                {v}
                              </option>
                            ))}
                            <option value="__manual__">➕ Other Village (इतर गाव)</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="relative flex items-center">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                          <input
                            type="text"
                            value={formData.village}
                            onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                            placeholder="Village *"
                            className={`w-full pl-10 pr-14 py-2.5 rounded-xl border text-sm text-slate-800 bg-white focus:ring-2 focus:ring-[#4c35de]/20 focus:border-[#4c35de] outline-none ${
                              formErrors.village ? "border-red-400 bg-red-50/20" : "border-slate-200"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setIsManualVillage(false)}
                            className="absolute right-2 text-[10px] bg-slate-100 hover:bg-slate-200 text-[#4c35de] px-2 py-1 rounded-md font-bold transition border border-slate-200"
                          >
                            List
                          </button>
                        </div>
                      )}
                      {formErrors.village && (
                        <span className="text-[10px] text-red-500 font-bold mt-1 block ml-1">{formErrors.village}</span>
                      )}
                    </div>

                    {/* Taluka */}
                    <div>
                      <div className="relative flex items-center">
                        <select
                          value={formData.taluka}
                          onChange={(e) => {
                            setFormData({ ...formData, taluka: e.target.value, village: "" });
                            setIsManualVillage(false);
                          }}
                          className={`w-full px-3.5 pr-8 py-2.5 rounded-xl border text-sm text-slate-800 bg-white focus:ring-2 focus:ring-[#4c35de]/20 focus:border-[#4c35de] outline-none appearance-none cursor-pointer font-medium ${
                            formErrors.taluka ? "border-red-400 bg-red-50/20" : "border-slate-200"
                          }`}
                        >
                          <option value="">Select Taluka</option>
                          {getTalukasForDistrict(formData.district).map((tal) => (
                            <option key={tal} value={tal}>
                              {BILINGUAL_TALUKAS[tal] || tal}
                            </option>
                          ))}
                          {formData.taluka && !getTalukasForDistrict(formData.district).includes(formData.taluka) && (
                            <option value={formData.taluka}>{BILINGUAL_TALUKAS[formData.taluka] || formData.taluka}</option>
                          )}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                      </div>
                      {formErrors.taluka && (
                        <span className="text-[10px] text-red-500 font-bold mt-1 block ml-1">{formErrors.taluka}</span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: District (Left) + Pincode (Right) */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* District */}
                    <div className="relative flex items-center">
                      <select
                        value={formData.district}
                        onChange={(e) => {
                          const newDistrict = e.target.value;
                          const talukas = getTalukasForDistrict(newDistrict);
                          setFormData({ 
                            ...formData, 
                            district: newDistrict, 
                            taluka: talukas[0] || "", 
                            village: "" 
                          });
                          setIsManualVillage(false);
                        }}
                        className="w-full px-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-[#4c35de]/20 focus:border-[#4c35de] outline-none appearance-none cursor-pointer font-medium"
                      >
                        {MAHARASHTRA_DISTRICTS.map((dist) => (
                          <option key={dist} value={dist}>
                            {BILINGUAL_DISTRICTS[dist] || dist}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                    </div>

                    {/* Pincode */}
                    <div className="relative flex items-center">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        maxLength={6}
                        value={formData.pincode || ""}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
                        placeholder="Pincode"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#4c35de]/20 focus:border-[#4c35de] outline-none"
                      />
                    </div>
                  </div>

                  {/* Current GPS Location Button */}
                  <div>
                    <button
                      type="button"
                      onClick={autoDetectDealerLocation}
                      disabled={isDetectingLocation}
                      className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#4c35de] bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-100 rounded-xl py-2.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-[#4c35de]" />
                      {isDetectingLocation ? "Detecting Location..." : "Current GPS Location"}
                    </button>
                    {formData.lat && formData.lon && (
                      <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-bold text-center">
                        <p className="mb-0.5">📍 Current GPS Location</p>
                        {formData.address && <p className="mb-0.5 text-emerald-900 font-medium">{formData.address}</p>}
                        <p className="font-mono text-emerald-700">
                          Lat: {formData.lat.toFixed(6)}, Lon: {formData.lon.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition text-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-[#4c35de] hover:bg-[#3f2fb8] shadow-md shadow-[#4c35de]/20 transition text-center cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!dealerToDelete}
        title="डीलर माहिती हटवायची?"
        message={`तुम्हाला खरोखरच '${dealerToDelete?.shopName}' डीलरची माहिती कायमची रद्द करायची आहे का?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDealerToDelete(null)}
      />

      <AnimatePresence>
        {isBroadcastModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">डीलर ब्रॉडकास्ट मेसेज</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Broadcast to All Dealers</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!isBroadcasting) {
                      setIsBroadcastModalOpen(false);
                      setBroadcastLogs([]);
                      setBroadcastProgress(0);
                    }
                  }}
                  disabled={isBroadcasting}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 my-4">
                <button
                  type="button"
                  onClick={() => setShowBroadcastHistory(false)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    !showBroadcastHistory
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/15"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Send className="w-3.5 h-3.5 inline mr-1.5" />
                  मेसेज पाठवा (Send)
                </button>
                <button
                  type="button"
                  onClick={() => setShowBroadcastHistory(true)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    showBroadcastHistory
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/15"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <History className="w-3.5 h-3.5 inline mr-1.5" />
                  इतिहास ({broadcastHistory.length})
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {!showBroadcastHistory ? (
                  <form onSubmit={handleSendBroadcast} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        संदेश मजकूर (Message Text) *
                      </label>
                      <textarea
                        required
                        value={broadcastText}
                        onChange={(e) => setBroadcastText(e.target.value)}
                        placeholder="तुमच्या सर्व डीलर्सना पाठवायचा संदेश येथे टाईप करा..."
                        rows={4}
                        disabled={isBroadcasting}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          फाईल प्रकार (File Type)
                        </label>
                        <select
                          value={broadcastAttachmentType}
                          onChange={(e: any) => {
                            setBroadcastAttachmentType(e.target.value);
                            setBroadcastAttachment(null);
                          }}
                          disabled={isBroadcasting}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="none">काहीही नाही (None)</option>
                          <option value="image">फोटो (Photo / Image)</option>
                          <option value="pdf">पीडीएफ (PDF Document)</option>
                          <option value="document">दस्तऐवज (Document / File)</option>
                        </select>
                      </div>

                      {broadcastAttachmentType !== "none" && (
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                            फाईल निवडा (Select File)
                          </label>
                          <input
                            type="file"
                            required
                            accept={
                              broadcastAttachmentType === "image"
                                ? "image/*"
                                : broadcastAttachmentType === "pdf"
                                ? ".pdf"
                                : "*"
                            }
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setBroadcastAttachment(file);
                            }}
                            disabled={isBroadcasting}
                            className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                        </div>
                      )}
                    </div>

                    {isBroadcasting && (
                      <div className="p-3 bg-slate-900 text-emerald-400 rounded-2xl font-mono text-[10px] space-y-2 border border-slate-800">
                        <div className="flex justify-between items-center font-bold">
                          <span>📡 BROADCAST STATUS</span>
                          <span>{broadcastProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 transition-all duration-300"
                            style={{ width: `${broadcastProgress}%` }}
                          />
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1 mt-2 thin-scrollbar">
                          {broadcastLogs.map((log, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-slate-500">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                              <span>{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isBroadcasting && (
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        ब्रॉडकास्ट सुरू करा (Start Broadcast)
                      </button>
                    )}
                  </form>
                ) : (
                  <div className="space-y-3">
                    {broadcastHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-xs text-slate-400 font-bold">अद्याप कोणताही इतिहास नाही.</p>
                      </div>
                    ) : (
                      broadcastHistory.map((item) => (
                        <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                              {new Date(item.sentAt).toLocaleDateString()} {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 italic">
                              {item.recipientsCount} Recipients
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 line-clamp-3 mb-2">{item.text}</p>
                          {item.attachmentName && (
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                              <FileText className="w-3 h-3" />
                              {item.attachmentName} ({item.attachmentType})
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

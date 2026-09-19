import { safeJsonParse } from "../lib/safeJson";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Trash2,
  PlusCircle,
  Search,
  Share2,
  Calendar,
  Sprout,
  AlertTriangle,
  Mic,
} from "lucide-react";
import { translateCompositionToMarathi, translateDoseToEnglish, isScheduleForFarmer, translateMarathiToEnglish, getCropPlotLabel } from "../lib/utils";
import { PRESEEDED_PRODUCTS } from "../lib/preseeded-products";
import DatePicker from "./DatePicker";


interface AddScheduleFormProps {
  initialData?: any;
  farmers: any[];
  products: any[];
  schedules?: any[];
  onSave: (schedule: any) => void;
  onCancel: () => void;
  language?: "mr" | "en";
}

const getLocalTodayString = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDaysToIsoDate = (dateStr: string, days: number): string => {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, "0");
    const nd = String(date.getDate()).padStart(2, "0");
    return `${ny}-${nm}-${nd}`;
  } catch (e) {
    return dateStr;
  }
};

export default function AddScheduleForm({
  initialData,
  farmers,
  products,
  schedules = [],
  onSave,
  onCancel,
  language = "mr"
}: AddScheduleFormProps) {
  const isEn = language === "en";
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({
    farmerId: initialData?.farmerId || "",
    selectedCropIndex:
      initialData?.selectedCropIndex !== undefined
         ? String(initialData.selectedCropIndex)
         : "",
    cropId:
      initialData?.cropId !== undefined && initialData?.cropId !== null
        ? String(initialData.cropId)
        : (initialData?.selectedCropIndex !== undefined ? String(initialData.selectedCropIndex) : ""),
    cropName: initialData?.cropName || "",
    season: initialData?.season || "",
    day: initialData?.day || "",
    scheduleDate:
      initialData?.scheduleDate || getLocalTodayString(),
    method: initialData?.method || "फवारणी",
    otherMethod: initialData?.otherMethod || "",
    selectedProducts: initialData?.selectedProducts || [],
    notes: initialData?.notes || initialData?.advisory || "",
  });

  const [farmerSearch, setFarmerSearch] = useState("");
  const [showFarmerOptions, setShowFarmerOptions] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showProductOptions, setShowProductOptions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("तुमचा ब्राउझर व्हॉइस-टू-टेक्स्ट सपोर्ट करत नाही.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'mr-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({...prev, notes: (prev.notes || "") + " " + transcript}));
    };
    recognition.start();
  };

  // Load draft from localStorage on mount (only for new empty schedules, not prefilled or edits)
  useEffect(() => {
    if (!initialData) {
      const savedDraft = localStorage.getItem("schedule_form_draft");
      if (savedDraft) {
        try {
          const draft = (savedDraft === "undefined" ? undefined : safeJsonParse(savedDraft));
          setFormData((prev) => ({ ...prev, ...draft }));
          // If there's a draft farmer name, set the search text
          if (draft.farmerName) {
             setFarmerSearch(draft.farmerName);
          }
        } catch (e) {
          console.error("Failed to load draft", e);
        }
      }
    }
  }, [initialData]);

  // Save draft to localStorage whenever formData changes (only for empty new schedules)
  useEffect(() => {
    if (!initialData) {
      const draftToSave = { 
        ...formData, 
        farmerName: farmerSearch 
      };
      localStorage.setItem("schedule_form_draft", JSON.stringify(draftToSave));
    }
  }, [formData, farmerSearch, initialData]);

  const selectedFarmer = farmers.find((f) => f.mobile === formData.farmerId || f.id === formData.farmerId);

  // Search farmers - Exclude Sagar Krushi as requested by user
  const filteredFarmers = farmers.filter(
    (f) =>
      (f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      f.mobile.includes(farmerSearch)) &&
      !f.name.toLowerCase().includes("sagar krushi") &&
      !f.name.includes("सागर कृषी")
  );

  // Search/Suggest Products (Memoized for speed)
  const filteredProducts = React.useMemo(() => {
    // Combine synced products with static preseeded products to provide an exhaustive list without duplicates
    const combinedList: any[] = [];
    
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

    const isDuplicate = (list: any[], p: any) => {
      const pBrand = (p.brandName || p.name || "").trim().toLowerCase();
      const pCompany = (p.companyName || "").trim().toLowerCase();
      const pComp = (p.composition || p.activeIngredients || "").trim().toLowerCase();
      
      const pParts = cleanParts(p.brandName || p.name || "");
      const normComp = cleanComp(pComp);
      const normCo = cleanCo(pCompany);
      
      return list.some(existing => {
        const eBrand = (existing.brandName || existing.name || "").trim().toLowerCase();
        const eCompany = (existing.companyName || "").trim().toLowerCase();
        const eComp = (existing.composition || existing.activeIngredients || "").trim().toLowerCase();
        
        const eParts = cleanParts(existing.brandName || existing.name || "");
        const hasNameOverlap = pParts.some(pt => eParts.includes(pt)) || pBrand === eBrand;
        
        const compMatch = normComp === cleanComp(eComp);
        const companyMatch = normCo === cleanCo(eCompany) || 
                             normCo.includes(cleanCo(eCompany)) || 
                             cleanCo(eCompany).includes(normCo);

        return pBrand === eBrand || (hasNameOverlap && compMatch && companyMatch);
      });
    };

    // 1. Add real database products first (these are the customized/edited ones, preferred)
    products.forEach(p => {
      if (p && (p.brandName || p.name)) {
        if (!isDuplicate(combinedList, p)) {
          combinedList.push(p);
        }
      }
    });

    if (!productSearch) return combinedList.slice(0, 100); // show up to 100 products by default
    
    const searchLower = productSearch.toLowerCase().trim();
    return combinedList.filter(
      (p) =>
        p.brandName?.toLowerCase().includes(searchLower) ||
        p.marathiName?.toLowerCase().includes(searchLower) ||
        p.companyName?.toLowerCase().includes(searchLower) ||
        p.composition?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower) ||
        p.name?.toLowerCase().includes(searchLower)
    );
  }, [products, productSearch]);

  const parseRobustDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const norm = dateStr.replace(/\s+/g, "").replace(/\//g, "-").trim();
    const parts = norm.split("-");
    if (parts.length === 3) {
      let year = 0;
      let month = 0;
      let day = 0;
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else if (parts[2].length === 4) {
        year = parseInt(parts[2], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[0], 10);
      } else {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      }
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const d = new Date(year, month - 1, day);
        d.setHours(0, 0, 0, 0);
        return d;
      }
    }
    const fallback = new Date(dateStr);
    if (!isNaN(fallback.getTime())) {
      fallback.setHours(0, 0, 0, 0);
      return fallback;
    }
    return null;
  };

  const calculateDaysForSelected = (farmerMobile: string, cropIndexStr: string | number, dateStr: string) => {
    if (!farmerMobile || cropIndexStr === "" || cropIndexStr === undefined || cropIndexStr === null) return "";
    const f = farmers.find((farm) => farm.mobile === farmerMobile || farm.id === farmerMobile || farm.name === farmerMobile);
    if (!f) return "";

    let activeCrop = null;
    const cropIdx = typeof cropIndexStr === "string" ? parseInt(cropIndexStr, 10) : cropIndexStr;
    if (f.crops && f.crops[cropIdx]) {
      activeCrop = f.crops[cropIdx];
    } else if (f.crops && f.crops.length > 0) {
      activeCrop = f.crops.find((c: any) => c.crop === formData?.cropName) || f.crops[0];
    }

    if (activeCrop) {
      const pDateStr = activeCrop.plantationDate || activeCrop.sowingDate;
      if (pDateStr) {
        const plat = parseRobustDate(pDateStr);
        const sched = parseRobustDate(dateStr);
        if (plat && sched) {
          const diffTime = sched.getTime() - plat.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          return diffDays.toString();
        }
      }
    }
    return "";
  };

  const handleSelectFarmer = (farmer: any) => {
    // Select first crop by default if available
    const firstCropIndex = farmer.crops && farmer.crops.length > 0 ? "0" : "";
    const firstCrop = farmer.crops && farmer.crops.length > 0 ? farmer.crops[0] : null;
    const firstCropName = firstCrop ? firstCrop.crop : "";
    const firstCropSeason = firstCrop ? firstCrop.season : "";
    const firstCropId = firstCrop ? (firstCrop.id || "0") : "";
    const schedDate = formData.scheduleDate || getLocalTodayString();

    // Try finding by ID first, then fallback to mobile
    const farmerIdent = farmer.id || farmer.mobile;
    const computedDay = calculateDaysForSelected(farmerIdent, firstCropIndex, schedDate);

    setFormData({
      ...formData,
      farmerId: farmerIdent,
      selectedCropIndex: firstCropIndex,
      cropId: firstCropId,
      cropName: firstCropName,
      season: firstCropSeason,
      day: computedDay !== "" ? computedDay : formData.day || "",
    });
    setFarmerSearch(farmer.name);
    setShowFarmerOptions(false);
  };

  // When farmer, crop, or scheduleDate changes, calculate the day of the crop robustly
  useEffect(() => {
    const isEdit = !!initialData?.id;
    const dateChanged = initialData ? formData.scheduleDate !== initialData.scheduleDate : true;

    if (formData.farmerId && formData.selectedCropIndex !== "" && formData.selectedCropIndex !== undefined && formData.selectedCropIndex !== null && (!isEdit || dateChanged)) {
      const computedDay = calculateDaysForSelected(formData.farmerId, formData.selectedCropIndex, formData.scheduleDate);
      if (computedDay !== "") {
        setFormData((prev) => ({
          ...prev,
          day: computedDay,
        }));
      }
    }
  }, [
    formData.farmerId,
    formData.selectedCropIndex,
    formData.scheduleDate,
    farmers,
  ]);

  // Handle crop change manually
  const handleCropChange = (indexStr: string) => {
    if (!selectedFarmer) return;
    const idx = parseInt(indexStr, 10);
    const chosenCrop = selectedFarmer.crops?.[idx];
    if (chosenCrop) {
      const schedDate = formData.scheduleDate || getLocalTodayString();
      const computedDay = calculateDaysForSelected(formData.farmerId, indexStr, schedDate);

      setFormData({
        ...formData,
        selectedCropIndex: indexStr,
        cropId: chosenCrop.id || indexStr,
        cropName: chosenCrop.crop || "",
        season: chosenCrop.season || "",
        day: computedDay !== "" ? computedDay : formData.day || "",
      });
    } else {
      setFormData({
        ...formData,
        selectedCropIndex: "",
        cropId: "",
        cropName: "",
        season: "",
      });
    }
  };

  const getDoseForMethod = (product: any, method: string) => {
    // Lookup full product to ensure we get all alternative doses (useful if editing older schedules)
    const originalProd = products.find(
      (cp) => cp.brandName === product.brandName && (cp.companyName || "") === (product.companyName || "")
    ) || PRESEEDED_PRODUCTS.find(
      (cp) => cp.brandName === product.brandName && (cp.companyName || "") === (product.companyName || "")
    ) || product;

    if (method === "ड्रीप") {
      return originalProd.doseDrip || originalProd.doseSpray || originalProd.dose || product.dose || "";
    } else if (method === "आळवणी / ड्रिंचिंग") {
      return originalProd.doseDrenching || originalProd.doseDrip || originalProd.doseSpray || originalProd.dose || product.dose || "";
    } else if (method === "फवारणी") {
      return originalProd.doseSpray || originalProd.doseDrip || originalProd.dose || product.dose || "";
    } else if (method === "मिक्स डोस") {
      return originalProd.doseBasal || originalProd.doseSpray || originalProd.dose || product.dose || "";
    }
    return originalProd.doseSpray || originalProd.doseDrip || originalProd.dose || product.dose || "";
  };

  const handleToggleProduct = (product: any) => {
    const isAlreadySelected = formData.selectedProducts.some((p: any) => {
      return (p.brandName && product.brandName && p.brandName.toLowerCase().trim() === product.brandName.toLowerCase().trim()) ||
             (p.id && product.id && String(p.id) === String(product.id));
    });

    if (isAlreadySelected) {
      setFormData({
        ...formData,
        selectedProducts: formData.selectedProducts.filter((p: any) => {
          return !((p.brandName && product.brandName && p.brandName.toLowerCase().trim() === product.brandName.toLowerCase().trim()) ||
                   (p.id && product.id && String(p.id) === String(product.id)));
        }),
      });
    } else {
      const rawDose = getDoseForMethod(product, formData.method);
      const defaultDose = translateDoseToEnglish(rawDose);
      setFormData({
        ...formData,
        selectedProducts: [
          ...formData.selectedProducts,
          { ...product, dose: defaultDose },
        ],
      });
    }
  };

  const handleRemoveProduct = (index: number) => {
    const newProducts = [...formData.selectedProducts];
    newProducts.splice(index, 1);
    setFormData({ ...formData, selectedProducts: newProducts });
  };

  const handleProductDoseChange = (index: number, dose: string) => {
    const newProducts = [...formData.selectedProducts];
    newProducts[index].dose = dose;
    setFormData({ ...formData, selectedProducts: newProducts });
  };

  const isDateDuplicate = React.useMemo(() => {
    if (!formData.farmerId || !formData.scheduleDate || !schedules || schedules.length === 0) return false;
    return schedules.some((s) => {
      const matchesFarmer = isScheduleForFarmer(s, formData.farmerId, selectedFarmer);
      const isSameDate = s.scheduleDate === formData.scheduleDate;
      const isNotCurrent = String(s.id) !== String(initialData?.id || "");
      
      let isSameCrop = false;
      const targetCropId = formData.cropId || formData.selectedCropIndex;
      if (s.cropId !== undefined && s.cropId !== null && targetCropId !== undefined && targetCropId !== null) {
        isSameCrop = String(s.cropId).trim() === String(targetCropId).trim() ||
                     (selectedFarmer?.crops?.[parseInt(formData.selectedCropIndex, 10)]?.id &&
                      String(s.cropId).trim() === String(selectedFarmer.crops[parseInt(formData.selectedCropIndex, 10)].id).trim());
      } else {
        isSameCrop = String(s.cropName || "").trim() === String(formData.cropName || "").trim();
      }

      if (!matchesFarmer || !isSameDate || !isNotCurrent || !isSameCrop) return false;

      // Normalize methods
      const methodA = (s.method || "फवारणी").trim();
      const methodB = (formData.method || "फवारणी").trim();

      if (methodA === methodB) {
        if (methodA === "मॅन्युअल/इतर") {
          const otherA = (s.otherMethod || "").trim().toLowerCase();
          const otherB = (formData.otherMethod || "").trim().toLowerCase();
          return otherA === otherB;
        }
        return true;
      }
      return false;
    });
  }, [formData.farmerId, formData.scheduleDate, formData.method, formData.otherMethod, formData.cropName, formData.cropId, formData.selectedCropIndex, schedules, initialData, selectedFarmer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farmerId) {
      alert("कृपया शेतकरी निवडा! (Please select a farmer)");
      return;
    }
    if (isDateDuplicate) {
      alert(`या दिवशी ${formData.method} पद्धतीने आधीच शेड्युल तयार केले आहे! कृपया दुसरी तारीख किंवा पद्धत निवडा.`);
      return;
    }

    const chosenCrop = selectedFarmer?.crops?.[parseInt(formData.selectedCropIndex, 10)];
    const finalCropId = formData.cropId || chosenCrop?.id || formData.selectedCropIndex || "0";

    onSave({
      ...formData,
      cropId: finalCropId,
      id: initialData?.id || Date.now().toString(),
    });

    localStorage.removeItem("schedule_form_draft");
  };

  const shareSchedule = () => {
    let text = `*शेड्युल (Schedule)*\n\n`;
    if (selectedFarmer) {
      text += `*शेतकरी:* ${selectedFarmer.name}\n`;
    }
    if (formData.cropName) text += `*पीक (Crop):* ${formData.cropName}\n`;
    if (formData.season) text += `*हंगाम (Season):* ${formData.season}\n`;
    if (formData.day) text += `*दिवस (Day of Crop):* ${formData.day}\n`;
    if (formData.scheduleDate) text += `*तारीख:* ${formData.scheduleDate}\n`;

    text += `*पद्धत:* ${formData.method === "मॅन्युअल/इतर" ? formData.otherMethod : formData.method}\n`;

    if (formData.selectedProducts.length > 0) {
      text += `\n*उत्पादने (Products):*\n`;
      formData.selectedProducts.forEach((p: any, i: number) => {
        text += `${i + 1}. ${p.brandName} - डोस: ${p.dose || p.doseSpray || ""}\n`;
      });
    }

    if (formData.notes) {
      text += `\n*सल्ला/टीप:* ${formData.notes}\n`;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Setup initial search text if farmer selected
  useEffect(() => {
    if (initialData?.farmerId) {
      const f = farmers.find((f) => f.mobile === initialData.farmerId || f.id === initialData.farmerId);
      if (f) setFarmerSearch(f.name);
    }
  }, [initialData, farmers]);

  // Sync selectedCropIndex if initialData has cropId
  useEffect(() => {
    if (selectedFarmer?.crops && selectedFarmer.crops.length > 0 && initialData) {
      const targetCropId = initialData.cropId ?? initialData.selectedCropIndex;
      if (targetCropId !== undefined && targetCropId !== null && String(targetCropId).trim() !== "") {
        const foundIdx = selectedFarmer.crops.findIndex(
          (c: any, i: number) => (c.id && String(c.id) === String(targetCropId)) || String(i) === String(targetCropId)
        );
        if (foundIdx !== -1) {
          setFormData((prev) => ({
            ...prev,
            selectedCropIndex: String(foundIdx),
            cropId: String(targetCropId),
            cropName: selectedFarmer.crops[foundIdx].crop || prev.cropName,
            season: selectedFarmer.crops[foundIdx].season || prev.season,
          }));
        }
      }
    }
  }, [initialData, selectedFarmer]);

  return (
    <div className="w-full h-full bg-white flex flex-col relative z-40 overflow-hidden">
      {/* Header section (strictly within form boundaries) */}
      <div className="flex items-center justify-between p-1.5 bg-emerald-800 text-white shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("schedule_form_draft");
              onCancel();
            }}
            className="p-1 hover:bg-emerald-700/50 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] font-black leading-none">
              {initialData ? "शेड्युल अपडेट करा" : "नवीन शेड्युल जोडा"}
            </span>
            <span className="text-[8px] lowercase font-mono tracking-wider opacity-75 mt-0.5 leading-none">vionex</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pr-1">
          <button
            type="button"
            onClick={shareSchedule}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[10px] font-black transition-colors"
          >
            <Share2 className="w-3 h-3" />
            पाठवा
          </button>
          <button
            onClick={handleSubmit}
            disabled={isDateDuplicate}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-black transition-colors shadow-sm ${
              isDateDuplicate 
                ? "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60" 
                : "bg-white text-emerald-800 hover:bg-emerald-50"
            }`}
          >
            <Save className="w-3 h-3" />
            सेव्ह
          </button>
        </div>
      </div>

      {/* Main form input fields strictly bounded inside the container box */}
      <div id="add-schedule-form" className="flex-1 overflow-y-auto bg-slate-50 p-2 sm:p-3">
        <div className="max-w-2xl mx-auto space-y-2.5">
          {successMsg && (
            <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-800 p-3 rounded-lg text-xs font-bold shadow-sm animate-fade-in flex items-center gap-2">
              <span className="text-sm">✅</span>
              <div>
                <p className="font-extrabold">{successMsg}</p>
                <p className="text-[10px] text-emerald-600 font-medium">तुम्ही याच ठिकाणी याच शेतकरी आणि पिकासाठी पुढील दिवस / तारखेचे शेड्युल लगेच जोडू शकता.</p>
              </div>
            </div>
          )}
          {/* Primary Form Fields Box */}
          <div className="bg-white p-2.5 sm:p-3 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              प्राथमिक माहिती (Primary Information)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Farmer Search input */}
              <div className="relative">
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 mb-1">
                  शेतकरी निवडा (Select Farmer){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={farmerSearch}
                    onChange={(e) => {
                      setFarmerSearch(e.target.value);
                      setShowFarmerOptions(true);
                      setFormData((prev) => ({
                        ...prev,
                        farmerId: "",
                        selectedCropIndex: "",
                        cropName: "",
                      }));
                    }}
                    onFocus={() => setShowFarmerOptions(true)}
                    className="w-full pl-8 pr-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="शेतकऱ्याचे नाव किंवा मोबाईल..."
                  />
                </div>
                
                {selectedFarmer?.dealer && (
                  <p className="text-[9px] font-bold text-emerald-700 mt-1 bg-emerald-50 px-2 py-0.5 rounded break-words">
                    विक्रेता (Dealer): {selectedFarmer.dealer}
                  </p>
                )}

                {/* Farmer Autocomplete List - constrained inside container */}
                {showFarmerOptions && farmerSearch && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-[50vh] overflow-y-auto z-[60]">
                    {filteredFarmers.length > 0 ? (
                      filteredFarmers.map((f, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectFarmer(f)}
                          className="px-3 py-2 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-0"
                        >
                          <p className="text-xs font-bold text-slate-800">
                            {f.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {f.village} | {f.mobile}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-500">
                        शेतकरी आढळला नाही
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Crop Wise selection dropdown */}
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 mb-1">
                  पीक निवडा (Select Crop)
                </label>
                {selectedFarmer ? (
                  selectedFarmer.crops && selectedFarmer.crops.length > 0 ? (
                    <select
                      value={formData.selectedCropIndex}
                      onChange={(e) => handleCropChange(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                    >
                      {selectedFarmer.crops.map((cr: any, idx: number) => (
                        <option key={cr.id || idx} value={idx}>
                          {getCropPlotLabel(cr, idx, selectedFarmer.crops)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-red-500 py-1.5">
                      शेतकऱ्याकडे कोणतेही पीक जोडलेले नाही!
                    </p>
                  )
                ) : (
                  <select
                    disabled
                    className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-50 text-slate-400"
                  >
                    <option value="">
                      पूर्वी शेतकरी निवडा (Select Farmer first)
                    </option>
                  </select>
                )}
              </div>

              {/* Season selector */}
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 mb-1">
                  हंगाम निवडा (Select Season)
                </label>
                <select
                  value={formData.season}
                  onChange={(e) =>
                    setFormData({ ...formData, season: e.target.value })
                  }
                  className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 outline-none bg-white font-sans"
                >
                  <option value="">हंगाम निवडा (Select Season)</option>
                  <option value="खरीप">खरीप (Kharif)</option>
                  <option value="रब्बी">रब्बी (Rabi)</option>
                  <option value="उन्हाळी">उन्हाळी (Summer)</option>
                  <option value="वर्षभर / फळबाग">
                    वर्षभर / फळबाग (Year-round)
                  </option>
                </select>
              </div>

              {/* Schedule Date Selection */}
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 mb-1">
                  शेड्युल ची तारीख (Schedule Date) <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={formData.scheduleDate}
                  onChange={(newDate) => {
                    const computedDay = calculateDaysForSelected(formData.farmerId, formData.selectedCropIndex, newDate);
                    setFormData({
                      ...formData,
                      scheduleDate: newDate,
                      day: computedDay !== "" ? computedDay : formData.day || "",
                    });
                  }}
                  schedules={schedules}
                  farmerId={formData.farmerId}
                  cropName={formData.cropName}
                  cropId={formData.selectedCropIndex}
                  hasError={isDateDuplicate}
                />
                {isDateDuplicate && (
                  <p className="mt-1 text-[10px] text-red-600 font-bold flex items-center gap-1 leading-tight">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>या शेतकाऱ्यासाठी या दिवशी "{formData.method}" पद्धतीने आधीच शेड्युल दिलेले आहे. जर वेगळी पद्धत असेल तर खाली पद्धत बदला किंवा दुसरी तारीख निवडा.</span>
                  </p>
                )}
              </div>

              {/* Dynamic computed crop days since plantation */}
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 mb-1">
                  दिवस (Day of Crop - स्वयंचलित/Calculated)
                </label>
                <input
                  type="number"
                  value={formData.day}
                  onChange={(e) =>
                    setFormData({ ...formData, day: e.target.value })
                  }
                  placeholder="उदा. १५"
                  className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-slate-300 font-bold text-emerald-700 bg-emerald-50/30"
                />
              </div>

              {/* Application Method selection */}
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 mb-1">
                  पद्धत (Method)
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => {
                    const newMethod = e.target.value;
                    const updatedProducts = formData.selectedProducts.map((p: any) => {
                      const correctDose = getDoseForMethod(p, newMethod);
                      return { ...p, dose: translateDoseToEnglish(correctDose) };
                    });
                    setFormData({
                      ...formData,
                      method: newMethod,
                      selectedProducts: updatedProducts
                    });
                  }}
                  className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 outline-none select-method-field"
                >
                  <option value="फवारणी">फवारणी (Spray)</option>
                  <option value="ड्रीप">ड्रीप (Drip)</option>
                  <option value="आळवणी / ड्रिंचिंग">आळवणी / ड्रिंचिंग (Drenching)</option>
                  <option value="गॅप">गॅप / विश्रांतीचा दिवस (Gap Day)</option>
                  <option value="मिक्स डोस">Mix Dose</option>
                  <option value="मॅन्युअल/इतर">
                    मॅन्युअल/इतर (Manual/Other)
                  </option>
                </select>
              </div>

              {formData.method === "मॅन्युअल/इतर" && (
                <div className="md:col-span-2">
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-600 mb-1">
                    इतर पद्धत (Specify Other Method)
                  </label>
                  <input
                    type="text"
                    value={formData.otherMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, otherMethod: e.target.value })
                    }
                    className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Products Selection Box */}
          <div className="bg-white p-2.5 sm:p-3 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              उत्पादने निवडा (Select Products from Saved list)
            </h3>

            {/* Product search box */}
            <div className="relative mb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductOptions(true);
                  }}
                  onFocus={() => setShowProductOptions(true)}
                  className="w-full pl-8 pr-2 py-1 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="उत्पादने शोधा किंवा खालील यादीतून निवडा..."
                />
              </div>

              {/* Product Suggester dropdown list - constrained inside form */}
              {showProductOptions && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-[60vh] overflow-y-auto z-[60]">
                  {filteredProducts.length > 0 ? (
                    <div>
                      <div className="text-[9px] text-slate-400 px-3 py-1 bg-slate-50 font-bold uppercase sticky top-0 border-b border-slate-100 flex justify-between items-center z-10">
                        <span>{productSearch ? "शोध परिणाम" : "सेव्ह केलेली उत्पादने"}</span>
                        <button
                          type="button"
                          onClick={() => setShowProductOptions(false)}
                          className="text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded uppercase text-[9px] transition-colors"
                        >
                          बंद करा (Close)
                        </button>
                      </div>
                      {filteredProducts.map((p, idx) => {
                        const isSel = formData.selectedProducts.some((selected: any) => {
                          return (selected.brandName && p.brandName && selected.brandName.toLowerCase().trim() === p.brandName.toLowerCase().trim()) ||
                                 (selected.id && p.id && String(selected.id) === String(p.id));
                        });
                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleProduct(p)}
                            className={`px-3 py-1.5 flex items-center justify-between hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${
                              isSel ? "bg-emerald-50/60 font-medium" : ""
                            }`}
                          >
                            <div className="flex-1 pr-2">
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                <input
                                  type="checkbox"
                                  checked={isSel}
                                  onChange={() => {}} // handled by parent div onClick
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 shrink-0 pointer-events-none"
                                />
                                <span>{isEn ? p.brandName : (p.marathiName || p.brandName)}</span>
                                {!isEn && p.brandName && p.marathiName && p.brandName !== p.marathiName && (
                                  <span className="text-[10px] text-slate-400 font-bold ml-1">({p.brandName})</span>
                                )}
                                {p.isNewMolecule && (
                                  <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wider leading-none shadow-sm h-3.5 flex items-center">
                                    ⭐ नवीन (New)
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-500 pl-5 leading-tight">
                                {p.companyName} | {p.category?.split(" (")[0]}
                              </p>
                              {(p.composition || p.activeIngredients) && (
                                <p className="text-[9px] text-emerald-700 font-medium pl-5 mt-0.5 leading-tight line-clamp-1">
                                  {isEn ? "Composition: " : "घटक: "}{isEn ? (p.composition || p.activeIngredients) : translateCompositionToMarathi(p.composition || p.activeIngredients)}
                                </p>
                              )}
                            </div>
                            {isSel && (
                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                                निवडलेले
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500">
                      उत्पादन आढळले नाही
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Products List */}
            {formData.selectedProducts.length > 0 ? (
              <div className="space-y-1.5">
                {formData.selectedProducts.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200 items-start sm:items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">
                        {isEn ? p.brandName : (p.marathiName || p.brandName)}
                        {!isEn && p.brandName && p.marathiName && p.brandName !== p.marathiName && (
                          <span className="text-[10px] text-slate-400 font-bold ml-1">({p.brandName})</span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        {p.companyName}
                      </p>
                      {(p.composition || p.activeIngredients) && (
                        <p className="text-[9px] text-emerald-700 font-semibold leading-tight mt-0.5 line-clamp-1">
                          {isEn ? "Composition: " : "घटक: "}{isEn ? (p.composition || p.activeIngredients) : translateCompositionToMarathi(p.composition || p.activeIngredients)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Dose (e.g. 2 gm/Ltr)"
                        value={p.dose || ""}
                        onChange={(e) =>
                          handleProductDoseChange(idx, e.target.value)
                        }
                        className="w-full sm:w-28 px-1.5 py-0.5 flex-1 sm:flex-none rounded border border-slate-200 text-[10px] sm:text-xs focus:ring-1 focus:ring-emerald-500 outline-none bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-center text-slate-400 py-2">
                अद्याप कोणतीही उत्पादने निवडलेली नाहीत.
              </p>
            )}
          </div>

          {/* Advisory/Notes Box */}
          <div className="bg-white p-2.5 sm:p-3 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-800 mb-2 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-emerald-600" />
                सल्ला/टीप (Advisory/Tip)
              </div>
              <button
                type="button"
                onClick={startDictation}
                className={`p-1.5 rounded-full ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-all`}
                title="व्हॉइस-टू-टेक्स्ट"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </h3>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 outline-none h-20"
              placeholder="येथे सल्ला किंवा टीप लिहा..."
            />
          </div>

        </div>
      </div>

      {/* Sticky Bottom Actions Footer */}
      <div className="p-1.5 bg-white border-t border-slate-200 flex gap-1.5 shrink-0 z-50 shadow-sm">
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("schedule_form_draft");
            onCancel();
          }}
          className="flex-1 py-1.5 px-3 border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 rounded-lg text-[10px] sm:text-xs font-black transition-all text-center flex items-center justify-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isDateDuplicate}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] sm:text-xs font-black transition-all text-center shadow-sm flex items-center justify-center gap-1 ${
            isDateDuplicate 
              ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60" 
              : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-[0_2px_4px_rgba(16,185,129,0.1)]"
          }`}
        >
          <Save className="w-3 h-3" />
          Save
        </button>
      </div>
    </div>
  );
}

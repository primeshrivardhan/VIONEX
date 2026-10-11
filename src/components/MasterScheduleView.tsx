import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  CalendarDays,
  Plus,
  ArrowLeft,
  Save,
  Trash2,
  Edit,
  Search,
  Mic,
  MicOff,
  Leaf,
  Sprout,
  AlertTriangle,
  PlusCircle,
  Filter,
  CheckCircle2,
  Layers,
  X,
  Send,
  Calendar,
  Sparkles,
} from "lucide-react";
import { MasterSchedule, MasterScheduleProduct, Farmer } from "../types";
import { syncCollection, saveItem, deleteItem } from "../lib/data-sync";
import { auth } from "../lib/firebase";
import {
  MASTER_CROPS,
  CROP_VARIETIES,
  CROP_STAGES,
  formatDualDisplay,
  translateDoseToEnglish,
  translateCompositionToMarathi,
  getSingleLangLabel,
} from "../lib/utils";
import {
  applyMasterScheduleToPlot,
  getPlotsForFarmer,
  calculateDateForDay,
  PlotOption,
} from "../lib/masterScheduleService";
import ConfirmationModal from "./ConfirmationModal";

interface MasterScheduleViewProps {
  products?: any[];
  farmers?: Farmer[];
  currentUser?: any;
  isAdmin?: boolean;
  language?: "mr" | "en";
  onBack?: () => void;
}

export default function MasterScheduleView({
  products = [],
  farmers: farmersProp,
  currentUser,
  isAdmin: isAdminProp,
  language = "mr",
  onBack,
}: MasterScheduleViewProps) {
  const isEn = language === "en";

  // Data State
  const [masterSchedules, setMasterSchedules] = useState<MasterSchedule[]>([]);
  const [internalFarmers, setInternalFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'list' or 'form'
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters in List Mode
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>("all");
  const [selectedVarietyFilter, setSelectedVarietyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    cropName: MASTER_CROPS[0] || "द्राक्ष (Grape)",
    variety: isEn ? "All Varieties" : "सर्व व्हरायटीज",
    dayNo: "" as string | number,
    method: "फवारणी",
    otherMethod: "",
    stage: isEn ? "Flowering" : "फुलोरा",
    selectedProducts: [] as MasterScheduleProduct[],
    notes: "",
  });

  // Product Search State
  const [productSearch, setProductSearch] = useState("");
  const [showProductOptions, setShowProductOptions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [formError, setFormError] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Delete Confirmation Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Apply to Plot Modal State
  const [applyTargetSchedule, setApplyTargetSchedule] = useState<MasterSchedule | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>("");
  const [selectedPlotKey, setSelectedPlotKey] = useState<string>("");
  const [customScheduleDate, setCustomScheduleDate] = useState<string>("");
  const [farmerSearchQuery, setFarmerSearchQuery] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applyToastError, setApplyToastError] = useState("");

  // Role gating: admin check
  const isUserAdmin = useMemo(() => {
    if (typeof isAdminProp === "boolean") return isAdminProp;
    const r = currentUser?.role || currentUser?.type || currentUser?.data?.role;
    if (r === "admin") return true;
    if (currentUser?.permissions?.masterSchedules === true) return true;
    return false;
  }, [isAdminProp, currentUser]);

  // Sync Master Schedules from Firestore collection 'master-schedules'
  useEffect(() => {
    const unsubscribe = syncCollection<MasterSchedule>(
      "master-schedules",
      (data) => {
        setMasterSchedules(data || []);
        setLoading(false);
      }
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // Sync / set farmers list
  useEffect(() => {
    if (farmersProp && farmersProp.length > 0) {
      setInternalFarmers(farmersProp);
      return;
    }
    const unsub = syncCollection<Farmer>("farmers", (data) => {
      setInternalFarmers(data || []);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [farmersProp]);

  // Update variety dropdown when crop changes in form
  const availableVarieties = useMemo(() => {
    const list = CROP_VARIETIES[formData.cropName];
    if (list && list.length > 0) return list;
    return ["सर्व व्हरायटीज (All Varieties)"];
  }, [formData.cropName]);

  // Dose helper based on selected method
  const getDoseForMethod = (product: any, method: string): string => {
    if (method === "ड्रीप") {
      return product.doseDrip || product.doseSpray || product.dose || "";
    } else if (method === "आळवणी / ड्रिंचिंग") {
      return product.doseDrenching || product.doseDrip || product.doseSpray || product.dose || "";
    } else if (method === "फवारणी") {
      return product.doseSpray || product.doseDrip || product.dose || "";
    } else if (method === "मिक्स डोस") {
      return product.doseBasal || product.doseSpray || product.dose || "";
    }
    return product.doseSpray || product.doseDrip || product.dose || "";
  };

  // Toggle Product in Form
  const handleToggleProduct = (product: any) => {
    const isAlreadySelected = formData.selectedProducts.some((p) => {
      return (
        p.brandName &&
        product.brandName &&
        p.brandName.toLowerCase().trim() === product.brandName.toLowerCase().trim()
      );
    });

    if (isAlreadySelected) {
      setFormData((prev) => ({
        ...prev,
        selectedProducts: prev.selectedProducts.filter(
          (p) => p.brandName.toLowerCase().trim() !== product.brandName.toLowerCase().trim()
        ),
      }));
    } else {
      const rawDose = getDoseForMethod(product, formData.method);
      const defaultDose = translateDoseToEnglish(rawDose);
      const newProd: MasterScheduleProduct = {
        brandName: product.brandName,
        marathiName: product.marathiName,
        companyName: product.companyName,
        composition: product.composition || product.activeIngredients,
        dose: defaultDose,
        doseSpray: product.doseSpray,
        doseDrip: product.doseDrip,
        modeOfAction: product.modeOfAction,
      };
      setFormData((prev) => ({
        ...prev,
        selectedProducts: [...prev.selectedProducts, newProd],
      }));
    }
  };

  const handleProductDoseChange = (index: number, dose: string) => {
    const updated = [...formData.selectedProducts];
    updated[index].dose = dose;
    setFormData((prev) => ({ ...prev, selectedProducts: updated }));
  };

  const handleRemoveProduct = (index: number) => {
    const updated = [...formData.selectedProducts];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, selectedProducts: updated }));
  };

  // Speech Recognition for Notes/Tip
  const startDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("तुमचा ब्राउझर व्हॉइस-टू-टेक्स्ट सपोर्ट करत नाही.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "mr-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData((prev) => ({
        ...prev,
        notes: prev.notes ? `${prev.notes} ${transcript}` : transcript,
      }));
    };
    recognition.start();
  };

  // Filtered Products for Autocomplete
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 40);
    const q = productSearch.toLowerCase().trim();
    return products
      .filter((p: any) => {
        const bName = (p.brandName || "").toLowerCase();
        const mName = (p.marathiName || "").toLowerCase();
        const comp = (p.composition || p.activeIngredients || "").toLowerCase();
        const compMr = (p.compositionMarathi || "").toLowerCase();
        return (
          bName.includes(q) ||
          mName.includes(q) ||
          comp.includes(q) ||
          compMr.includes(q)
        );
      })
      .slice(0, 40);
  }, [products, productSearch]);

  // Open Form to Create
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      cropName: selectedCropFilter !== "all" ? selectedCropFilter : MASTER_CROPS[0] || "द्राक्ष (Grape)",
      variety:
        selectedVarietyFilter !== "all"
          ? getSingleLangLabel(selectedVarietyFilter, isEn)
          : isEn
          ? "All Varieties"
          : "सर्व व्हरायटीज",
      dayNo: "",
      method: "फवारणी",
      otherMethod: "",
      stage: isEn ? "Flowering" : "फुलोरा",
      selectedProducts: [],
      notes: "",
    });
    setFormError("");
    setViewMode("form");
  };

  // Open Form to Edit
  const handleOpenEdit = (sched: MasterSchedule) => {
    setEditingId(sched.id || null);
    setFormData({
      cropName: sched.cropName,
      variety: getSingleLangLabel(sched.variety || "सर्व व्हरायटीज (All Varieties)", isEn),
      dayNo: sched.dayNo !== undefined ? sched.dayNo : "",
      method: sched.method || "फवारणी",
      otherMethod: sched.otherMethod || "",
      stage: getSingleLangLabel(sched.stage || "", isEn),
      selectedProducts: sched.selectedProducts || [],
      notes: sched.notes || "",
    });
    setFormError("");
    setViewMode("form");
  };

  // Save Form Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.cropName.trim()) {
      setFormError(isEn ? "Please select a crop." : "कृपया पीक निवडा.");
      return;
    }
    if (formData.dayNo === "" || isNaN(Number(formData.dayNo))) {
      setFormError(isEn ? "Please enter a valid Day No." : "कृपया वैध दिवस क्रमांक टाका.");
      return;
    }

    const actualAuthUid = auth.currentUser?.uid || currentUser?.id || "";
    const displayName =
      currentUser?.name ||
      currentUser?.data?.name ||
      auth.currentUser?.displayName ||
      auth.currentUser?.email ||
      "Admin";

    const existing = masterSchedules.find((m) => m.id === editingId);

    const payload: MasterSchedule = {
      cropName: formData.cropName.trim(),
      variety: (formData.variety || "सर्व व्हरायटीज (All Varieties)").trim(),
      dayNo: Number(formData.dayNo),
      method: formData.method,
      otherMethod: formData.method === "मॅन्युअल/इतर" ? formData.otherMethod.trim() : "",
      stage: formData.stage.trim(),
      selectedProducts: formData.selectedProducts,
      notes: formData.notes.trim(),
      createdBy: existing?.createdBy || displayName,
      createdByUserId: existing?.createdByUserId || actualAuthUid,
      updatedAt: Date.now(),
    };

    const targetId = editingId || `ms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Optimistic local update
    if (editingId) {
      setMasterSchedules((prev) =>
        prev.map((item) => (item.id === editingId ? { ...payload, id: editingId } : item))
      );
    } else {
      setMasterSchedules((prev) => [...prev, { ...payload, id: targetId, createdAt: Date.now() }]);
    }

    try {
      await saveItem("master-schedules", payload, targetId);
      setSaveSuccessMsg(
        editingId
          ? isEn
            ? "Master schedule updated successfully!"
            : "मास्टर शेड्युल यशस्वीरित्या अद्यतनित केले!"
          : isEn
          ? "New master schedule added successfully!"
          : "नवीन मास्टर शेड्युल यशस्वीरित्या जोडले गेले!"
      );
      setTimeout(() => setSaveSuccessMsg(""), 3500);
      setViewMode("list");
    } catch (err: any) {
      console.error("Failed to save master schedule:", err);
      setFormError(
        isEn
          ? "Error saving master schedule. Please try again."
          : "मास्टर शेड्युल सेव्ह करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा."
      );
    }
  };

  // Delete Handler
  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const idToDelete = deleteTargetId;
    setDeleteTargetId(null);

    // Optimistic remove
    setMasterSchedules((prev) => prev.filter((s) => s.id !== idToDelete));

    try {
      await deleteItem("master-schedules", idToDelete);
    } catch (err) {
      console.error("Failed to delete master schedule:", err);
    }
  };

  // Filtered and Grouped Master Schedules for List View
  const filteredList = useMemo(() => {
    return masterSchedules.filter((item) => {
      // Crop filter
      if (selectedCropFilter !== "all" && item.cropName !== selectedCropFilter) {
        return false;
      }
      // Variety filter
      if (selectedVarietyFilter !== "all" && item.variety !== selectedVarietyFilter) {
        return false;
      }
      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cropMatch = (item.cropName || "").toLowerCase().includes(q);
        const varietyMatch = (item.variety || "").toLowerCase().includes(q);
        const stageMatch = (item.stage || "").toLowerCase().includes(q);
        const methodMatch = (item.method || "").toLowerCase().includes(q);
        const notesMatch = (item.notes || "").toLowerCase().includes(q);
        const dayMatch = String(item.dayNo) === q || `दिवस ${item.dayNo}`.toLowerCase().includes(q);
        const productMatch = (item.selectedProducts || []).some(
          (p) =>
            (p.brandName || "").toLowerCase().includes(q) ||
            (p.marathiName || "").toLowerCase().includes(q) ||
            (p.companyName || "").toLowerCase().includes(q)
        );
        return cropMatch || varietyMatch || stageMatch || methodMatch || notesMatch || dayMatch || productMatch;
      }
      return true;
    });
  }, [masterSchedules, selectedCropFilter, selectedVarietyFilter, searchQuery]);

  // Grouped by Crop -> Variety -> Sorted by Day order (ascending)
  const groupedSchedules = useMemo(() => {
    const groups: {
      cropName: string;
      varieties: {
        variety: string;
        items: MasterSchedule[];
      }[];
    }[] = [];

    // Distinct crops
    const crops = Array.from(new Set(filteredList.map((i) => i.cropName))).sort();

    crops.forEach((crop) => {
      const cropItems = filteredList.filter((i) => i.cropName === crop);
      const distinctVarieties = Array.from(
        new Set(cropItems.map((i) => i.variety || "सर्व व्हरायटीज (All Varieties)"))
      ).sort();

      const varietyGroups = distinctVarieties.map((varName) => {
        const items = cropItems
          .filter((i) => (i.variety || "सर्व व्हरायटीज (All Varieties)") === varName)
          .sort((a, b) => Number(a.dayNo || 0) - Number(b.dayNo || 0));
        return {
          variety: varName,
          items,
        };
      });

      groups.push({
        cropName: crop,
        varieties: varietyGroups,
      });
    });

    return groups;
  }, [filteredList]);

  // Available Varieties for the Filter Bar
  const filterVarieties = useMemo(() => {
    if (selectedCropFilter === "all") return [];
    return CROP_VARIETIES[selectedCropFilter] || ["सर्व व्हरायटीज (All Varieties)"];
  }, [selectedCropFilter]);

  // Open "Apply to Plot" Modal
  const handleOpenApplyModal = (sched: MasterSchedule) => {
    setApplyTargetSchedule(sched);
    setApplyError("");
    setFarmerSearchQuery("");

    // Identify farmer
    const defaultFarmer =
      internalFarmers.find((f) => f.id === selectedFarmerId || f.mobile === selectedFarmerId) ||
      internalFarmers[0];

    if (defaultFarmer) {
      const fIdent = defaultFarmer.id || defaultFarmer.mobile || "";
      setSelectedFarmerId(fIdent);
      const plots = getPlotsForFarmer(defaultFarmer);
      // Preselect plot matching the schedule's crop if possible
      const matchedPlot =
        plots.find((p) => p.cropName.toLowerCase().trim() === sched.cropName.toLowerCase().trim()) ||
        plots[0];
      if (matchedPlot) {
        setSelectedPlotKey(matchedPlot.key);
        setCustomScheduleDate(calculateDateForDay(matchedPlot.plantationDate, sched.dayNo));
      } else {
        setSelectedPlotKey("");
        setCustomScheduleDate(calculateDateForDay(undefined, sched.dayNo));
      }
    } else {
      setSelectedFarmerId("");
      setSelectedPlotKey("");
      setCustomScheduleDate(calculateDateForDay(undefined, sched.dayNo));
    }
  };

  // Farmer selected in modal
  const selectedFarmer = useMemo(() => {
    if (!selectedFarmerId) return null;
    return (
      internalFarmers.find((f) => f.id === selectedFarmerId || f.mobile === selectedFarmerId) || null
    );
  }, [selectedFarmerId, internalFarmers]);

  // Plots for the selected farmer in modal
  const plotsForSelectedFarmer: PlotOption[] = useMemo(() => {
    if (!selectedFarmer) return [];
    return getPlotsForFarmer(selectedFarmer);
  }, [selectedFarmer]);

  // Currently selected plot option
  const activePlotOption = useMemo(() => {
    if (!plotsForSelectedFarmer.length) return null;
    return (
      plotsForSelectedFarmer.find((p) => p.key === selectedPlotKey) ||
      plotsForSelectedFarmer[0]
    );
  }, [plotsForSelectedFarmer, selectedPlotKey]);

  // Filtered farmers in modal search
  const filteredFarmersForModal = useMemo(() => {
    if (!farmerSearchQuery.trim()) return internalFarmers.slice(0, 100);
    const q = farmerSearchQuery.toLowerCase().trim();
    return internalFarmers
      .filter((f) => {
        const nameMatch = (f.name || "").toLowerCase().includes(q);
        const mobileMatch = (f.mobile || "").includes(q);
        const villageMatch = (f.village || "").toLowerCase().includes(q);
        return nameMatch || mobileMatch || villageMatch;
      })
      .slice(0, 100);
  }, [internalFarmers, farmerSearchQuery]);

  // Handle farmer selection change in modal
  const handleFarmerChange = (newFarmerId: string) => {
    setSelectedFarmerId(newFarmerId);
    setApplyError("");
    const f = internalFarmers.find((farm) => farm.id === newFarmerId || farm.mobile === newFarmerId);
    if (f) {
      const plots = getPlotsForFarmer(f);
      const matchedPlot = applyTargetSchedule
        ? plots.find((p) => p.cropName.toLowerCase().trim() === applyTargetSchedule.cropName.toLowerCase().trim()) ||
          plots[0]
        : plots[0];
      if (matchedPlot) {
        setSelectedPlotKey(matchedPlot.key);
        setCustomScheduleDate(calculateDateForDay(matchedPlot.plantationDate, applyTargetSchedule?.dayNo));
      } else {
        setSelectedPlotKey("");
        setCustomScheduleDate(calculateDateForDay(undefined, applyTargetSchedule?.dayNo));
      }
    } else {
      setSelectedPlotKey("");
    }
  };

  // Handle plot selection change in modal
  const handlePlotChange = (newPlotKey: string) => {
    setSelectedPlotKey(newPlotKey);
    const chosen = plotsForSelectedFarmer.find((p) => p.key === newPlotKey);
    if (chosen && applyTargetSchedule) {
      setCustomScheduleDate(calculateDateForDay(chosen.plantationDate, applyTargetSchedule.dayNo));
    }
  };

  // Confirm Apply to Plot Handler
  const handleConfirmApply = async () => {
    if (!applyTargetSchedule) return;

    if (!selectedFarmer) {
      setApplyError(isEn ? "Please select a registered farmer." : "कृपया नोंदणीकृत शेतकरी निवडा.");
      return;
    }
    if (!activePlotOption) {
      setApplyError(
        isEn
          ? "This farmer does not have any active crop plots. Please add a crop plot first."
          : "या शेतकऱ्याकडे कोणताही सक्रिय प्लॉट नाही. कृपया प्रथम शेतकरी प्रोफाइलमध्ये पीक/प्लॉट जोडा."
      );
      return;
    }
    if (!customScheduleDate) {
      setApplyError(isEn ? "Please enter a schedule date." : "कृपया शेड्युल तारीख निवडा.");
      return;
    }

    setIsApplying(true);
    setApplyError("");

    try {
      const { uniqueId } = await applyMasterScheduleToPlot({
        masterSchedule: applyTargetSchedule,
        farmer: selectedFarmer,
        plot: activePlotOption,
        scheduleDate: customScheduleDate,
        currentUser,
        isAdmin: isUserAdmin,
      });

      setSaveSuccessMsg(
        isEn
          ? `Day ${applyTargetSchedule.dayNo} schedule applied to ${selectedFarmer.name}'s plot!`
          : `दिवस ${applyTargetSchedule.dayNo} चे शेड्युल ${selectedFarmer.name} यांच्या प्लॉटवर यशस्वीरित्या लागू केले!`
      );
      setTimeout(() => setSaveSuccessMsg(""), 4500);
      setApplyTargetSchedule(null);
    } catch (err: any) {
      console.error("Failed to apply master schedule:", err);
      const isPermissionDenied =
        err?.code === "permission-denied" ||
        err?.message?.toLowerCase()?.includes("permission") ||
        err?.message?.toLowerCase()?.includes("unauthenticated");
      const errorMsg = isEn
        ? (isPermissionDenied
            ? "Permission denied — please log in with an authorized admin account."
            : `Error applying schedule — please try again. ${err.message ? `(${err.message})` : ""}`)
        : "शेड्युल लागू करताना त्रुटी आली — कृपया पुन्हा प्रयत्न करा";
      setApplyError(errorMsg);
      setApplyToastError(errorMsg);
      setTimeout(() => setApplyToastError(""), 5000);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 max-w-6xl mx-auto w-full">
      {/* Toast Alert */}
      {saveSuccessMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Toast Error Alert */}
      {applyToastError && (
        <div className="fixed top-4 right-4 z-50 bg-rose-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{applyToastError}</span>
        </div>
      )}

      {/* ===================== DARK GRADIENT HEADER CARD ===================== */}
      <div className="bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 border border-purple-900/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden mb-5">
        {/* Glow decoration */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -top-12 w-40 h-40 bg-indigo-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[11px] font-black uppercase tracking-wider shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>MASTER SCHEDULE</span>
            </div>

            <div className="flex items-center gap-3">
              {onBack && viewMode === "list" ? (
                <button
                  onClick={onBack}
                  type="button"
                  className="p-2 hover:bg-white/10 rounded-xl text-purple-200 border border-purple-400/20 transition-colors"
                  title={isEn ? "Back" : "मागे जा"}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : viewMode === "form" ? (
                <button
                  onClick={() => {
                    setFormError("");
                    setViewMode("list");
                  }}
                  type="button"
                  className="p-2 hover:bg-white/10 rounded-xl text-purple-200 border border-purple-400/20 transition-colors"
                  title={isEn ? "Back to List" : "यादीकडे परत जा"}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : null}

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {viewMode === "list"
                    ? isEn
                      ? "Master Schedule Management"
                      : "मास्टर शेड्युल व्यवस्थापन"
                    : editingId
                    ? isEn
                      ? "Edit Master Schedule"
                      : "मास्टर शेड्युल संपादित करा"
                    : isEn
                    ? "Create Master Schedule"
                    : "मास्टर शेड्युल तयार करा"}
                </h1>
                <p className="text-xs text-purple-200/80 font-medium">
                  {viewMode === "list"
                    ? isEn
                      ? "Standard crop protocols & spray schedules library"
                      : "सर्व पिकांचे प्रमाणित दिवसवार फवारणी व खत व्यवस्थापन"
                    : isEn
                    ? "Set standard crop spray/drench schedule protocol"
                    : "पिकासाठी दिवसनिहाय प्रमाणित शेड्युल टेम्पलेट नोंदवा"}
                </p>
              </div>
            </div>
          </div>

          {viewMode === "list" && isUserAdmin && (
            <button
              onClick={handleOpenCreate}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-950/50 transition-all border border-purple-400/30 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? "Add Master Schedule" : "नवीन मास्टर शेड्युल"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================== FORM VIEW ===================== */}
      {viewMode === "form" && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          {formError && (
            <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-4 sm:p-6 space-y-4">
            {/* Row 1: Crop and Variety */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {isEn ? "Crop" : "पीक"} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.cropName}
                  onChange={(e) => {
                    const newCrop = e.target.value;
                    const vars = CROP_VARIETIES[newCrop];
                    const firstVar = vars && vars.length > 0 ? vars[0] : isEn ? "All Varieties" : "सर्व व्हरायटीज";
                    setFormData((prev) => ({
                      ...prev,
                      cropName: newCrop,
                      variety: getSingleLangLabel(firstVar, isEn),
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:ring-1 focus:ring-purple-500 outline-none bg-slate-50"
                >
                  {MASTER_CROPS.map((c) => (
                    <option key={c} value={c}>
                      {getSingleLangLabel(c, isEn)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {isEn ? "Variety" : "वाण"}
                </label>
                <select
                  value={formData.variety}
                  onChange={(e) => setFormData((prev) => ({ ...prev, variety: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:ring-1 focus:ring-purple-500 outline-none bg-slate-50"
                >
                  {availableVarieties.map((v) => (
                    <option key={v} value={getSingleLangLabel(v, isEn)}>
                      {getSingleLangLabel(v, isEn)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Day No, Method, Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {isEn ? "Day No (e.g. 15)" : "दिवस क्रमांक (उदा. १५)"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="15"
                  value={formData.dayNo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dayNo: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold focus:ring-1 focus:ring-purple-500 outline-none bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {isEn ? "Application Method" : "पद्धत"}
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData((prev) => ({ ...prev, method: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:ring-1 focus:ring-purple-500 outline-none bg-slate-50"
                >
                  <option value="फवारणी">{isEn ? "Spray" : "फवारणी"}</option>
                  <option value="ड्रीप">{isEn ? "Drip" : "ड्रीप"}</option>
                  <option value="आळवणी / ड्रिंचिंग">{isEn ? "Drenching" : "आळवणी / ड्रिंचिंग"}</option>
                  <option value="खत व्यवस्थापन">{isEn ? "Fertilizer / Basal" : "खत व्यवस्थापन"}</option>
                  <option value="मिक्स डोस">{isEn ? "Mix Dose" : "मिक्स डोस"}</option>
                  <option value="मॅन्युअल/इतर">{isEn ? "Manual / Other" : "मॅन्युअल/इतर"}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {isEn ? "Crop Stage" : "अवस्था"}
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stage: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:ring-1 focus:ring-purple-500 outline-none bg-slate-50"
                >
                  {CROP_STAGES.map((s) => (
                    <option key={s} value={getSingleLangLabel(s, isEn)}>
                      {getSingleLangLabel(s, isEn)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.method === "मॅन्युअल/इतर" && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {isEn ? "Specify Method" : "इतर पद्धतीचे नाव"}
                </label>
                <input
                  type="text"
                  placeholder={isEn ? "e.g. Foliar feed, dusting" : "उदा. पानांवर खत फवारणी"}
                  value={formData.otherMethod}
                  onChange={(e) => setFormData((prev) => ({ ...prev, otherMethod: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-1 focus:ring-purple-500 outline-none bg-slate-50"
                />
              </div>
            )}

            {/* Product Selection Box */}
            <div className="bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-black text-slate-800">
                {isEn ? "Add Products & Recommended Dose" : "औषधे व डोस निवडा"}
              </label>

              {/* Product Autocomplete Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={
                    isEn
                      ? "Search product by brand, molecule, or company..."
                      : "औषध शोधा: ब्रँड नाव, घटक किंवा कंपनी..."
                  }
                  value={productSearch}
                  onFocus={() => setShowProductOptions(true)}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductOptions(true);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-1 focus:ring-purple-500 outline-none bg-white"
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Dropdown Options */}
                {showProductOptions && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                    <div className="p-2 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-bold sticky top-0">
                      <span>{isEn ? "Select products to include" : "समाविष्ट करण्यासाठी औषधे निवडा"}</span>
                      <button
                        type="button"
                        onClick={() => setShowProductOptions(false)}
                        className="text-purple-600 hover:underline"
                      >
                        {isEn ? "Close" : "बंद करा"}
                      </button>
                    </div>
                    {filteredProducts.map((prod: any, idx: number) => {
                      const isSel = formData.selectedProducts.some(
                        (p) =>
                          p.brandName &&
                          prod.brandName &&
                          p.brandName.toLowerCase().trim() === prod.brandName.toLowerCase().trim()
                      );
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleProduct(prod)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                            isSel ? "bg-purple-50 text-purple-900" : "hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div>
                            <span className="font-bold">
                              {formatDualDisplay(prod.brandName, prod.marathiName, language)}
                            </span>
                            {prod.companyName && (
                              <span className="text-[10px] text-slate-400 ml-1.5 font-medium">
                                ({prod.companyName})
                              </span>
                            )}
                            <div className="text-[10px] text-slate-500">
                              {prod.composition || prod.activeIngredients || ""}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              isSel ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isSel ? (isEn ? "Selected" : "निवडले") : isEn ? "+ Add" : "+ जोडा"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Products Table */}
              {formData.selectedProducts.length > 0 ? (
                <div className="space-y-2 mt-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {isEn ? "Selected Products & Dose:" : "निवडलेली उत्पादने व डोस:"}
                  </span>
                  {formData.selectedProducts.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200"
                    >
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 text-xs">
                          {formatDualDisplay(p.brandName, p.marathiName, language)}
                        </span>
                        {p.companyName && (
                          <span className="text-[10px] text-slate-400 ml-1 font-medium">
                            ({p.companyName})
                          </span>
                        )}
                        {p.composition && (
                          <p className="text-[10px] text-slate-400 font-mono leading-tight">
                            {p.composition}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={isEn ? "e.g. 2 gm/Ltr or 500 ml/Acre" : "उदा. 2 gm/Ltr किंवा 500 ml/एकर"}
                          value={p.dose || ""}
                          onChange={(e) => handleProductDoseChange(idx, e.target.value)}
                          className="w-full sm:w-36 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-purple-500 outline-none bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title={isEn ? "Remove" : "काढून टाका"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center text-slate-400 py-3 font-medium">
                  {isEn
                    ? "No products selected yet. Select products from the search box above."
                    : "अद्याप कोणतीही उत्पादने निवडलेली नाहीत. वरील शोधपेटीतून उत्पादने निवडा."}
                </p>
              )}
            </div>

            {/* Notes / Advice Box */}
            <div className="bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-purple-600" />
                  {isEn ? "Notes & Specialist Advice" : "टीप / सल्ला"}
                </label>
                <button
                  type="button"
                  onClick={startDictation}
                  className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                    isListening
                      ? "bg-red-100 text-red-600 animate-pulse border border-red-200"
                      : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>
                    {isListening
                      ? isEn
                        ? "Listening..."
                        : "ऐकत आहे..."
                      : isEn
                      ? "Voice Input"
                      : "बोलून सांगा"}
                  </span>
                </button>
              </div>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder={
                  isEn
                    ? "e.g. Spray early in the morning. Use silicone sticker with water..."
                    : "उदा. सकाळी लवकर फवारणी करावी. पाण्यात सिलिकॉन स्टिकर अवश्य वापरावे..."
                }
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-1 focus:ring-purple-500 outline-none bg-white resize-y"
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setFormError("");
                setViewMode("list");
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
            >
              {isEn ? "Cancel" : "रद्द करा"}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>
                {editingId
                  ? isEn
                    ? "Save Changes"
                    : "बदल जतन करा"
                  : isEn
                  ? "Save Schedule"
                  : "शेड्युल सेव्ह करा"}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* ===================== LIST VIEW ===================== */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Crop Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {isEn ? "Filter by Crop" : "पीक फिल्टर"}
                </label>
                <select
                  value={selectedCropFilter}
                  onChange={(e) => {
                    setSelectedCropFilter(e.target.value);
                    setSelectedVarietyFilter("all");
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-purple-500 outline-none bg-slate-50"
                >
                  <option value="all">{isEn ? "All Crops" : "सर्व पिके"}</option>
                  {MASTER_CROPS.map((crop) => (
                    <option key={crop} value={crop}>
                      {getSingleLangLabel(crop, isEn)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Variety Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {isEn ? "Filter by Variety" : "वाण फिल्टर"}
                </label>
                <select
                  value={selectedVarietyFilter}
                  onChange={(e) => setSelectedVarietyFilter(e.target.value)}
                  disabled={selectedCropFilter === "all"}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-purple-500 outline-none bg-slate-50 disabled:opacity-50"
                >
                  <option value="all">{isEn ? "All Varieties" : "सर्व व्हरायटीज"}</option>
                  {filterVarieties.map((v) => (
                    <option key={v} value={v}>
                      {getSingleLangLabel(v, isEn)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {isEn ? "Search Schedules" : "शोधा"}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isEn ? "Product, stage, or day..." : "उत्पादन, अवस्था किंवा दिवस..."}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-purple-500 outline-none bg-slate-50"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Counter Bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-semibold">
              <span>
                {isEn ? "Total Registered Master Schedules: " : "एकूण नोंदवलेली मास्टर शेड्युल्स: "}
                <strong className="text-purple-700 font-black">{filteredList.length}</strong>
              </span>
              {(selectedCropFilter !== "all" || selectedVarietyFilter !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCropFilter("all");
                    setSelectedVarietyFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-purple-600 hover:text-purple-800 font-bold hover:underline"
                >
                  {isEn ? "Reset Filters" : "फिल्टर क्लिअर करा"}
                </button>
              )}
            </div>
          </div>

          {/* Schedules Grouped Display */}
          {groupedSchedules.length > 0 ? (
            groupedSchedules.map((cropGroup) => (
              <div
                key={cropGroup.cropName}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Crop Header */}
                <div className="bg-purple-50/70 border-b border-purple-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-purple-700 shrink-0" />
                    <h2 className="text-sm sm:text-base font-black text-purple-950">
                      {getSingleLangLabel(cropGroup.cropName, isEn)}
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                    {cropGroup.varieties.reduce((acc, v) => acc + v.items.length, 0)}{" "}
                    {isEn ? "Schedules" : "शेड्युल्स"}
                  </span>
                </div>

                {/* Varieties inside Crop */}
                <div className="divide-y divide-slate-100">
                  {cropGroup.varieties.map((varGroup) => (
                    <div key={varGroup.variety} className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-black text-slate-700">
                          {getSingleLangLabel(varGroup.variety, isEn)}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          ({varGroup.items.length} {isEn ? "Stages" : "टप्पे"})
                        </span>
                      </div>

                      {/* Day Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {varGroup.items.map((sched) => {
                          const methodEn =
                            sched.method === "फवारणी"
                              ? "Spray"
                              : sched.method === "ड्रीप"
                              ? "Drip"
                              : sched.method === "आळवणी" || sched.method === "आळवणी / ड्रिंचिंग"
                              ? "Drenching"
                              : sched.method === "गॅप"
                              ? "Rest / Gap"
                              : sched.method === "खत व्यवस्थापन"
                              ? "Basal / Fertilizer"
                              : "";

                          const methodDisplay = isEn && methodEn ? methodEn : sched.method;

                          return (
                            <div
                              key={sched.id}
                              className="bg-white rounded-2xl border border-slate-200/90 hover:border-purple-300 hover:shadow-md transition-all p-4 flex flex-col justify-between group"
                            >
                              <div>
                                {/* Header: Day Badge, Title, Admin Action Buttons */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-purple-700 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-xs shrink-0">
                                      {isEn ? `Day ${sched.dayNo}` : `दिवस ${sched.dayNo}`}
                                    </span>
                                    <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                                      Day {sched.dayNo} — {sched.method}
                                      {methodEn && (
                                        <span className="text-slate-400 font-semibold ml-1">
                                          ({methodEn})
                                        </span>
                                      )}
                                    </h4>
                                  </div>

                                  {isUserAdmin && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEdit(sched)}
                                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                        title={isEn ? "Edit" : "संपादित करा"}
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteTargetId(sched.id || null)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title={isEn ? "Delete" : "हटवा"}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Chips: Crop Chip, Variety Chip, Stage Chip */}
                                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <Sprout className="w-3 h-3 text-emerald-600 shrink-0" />
                                    {getSingleLangLabel(sched.cropName, isEn)}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                                    <Layers className="w-3 h-3 text-purple-600 shrink-0" />
                                    {getSingleLangLabel(sched.variety || "सर्व व्हरायटीज", isEn)}
                                  </span>
                                  {sched.stage && (
                                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                      {getSingleLangLabel(sched.stage, isEn)}
                                    </span>
                                  )}
                                </div>

                                {/* Products & Dosage List */}
                                {sched.selectedProducts && sched.selectedProducts.length > 0 ? (
                                  <div className="space-y-1.5 mb-3 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                                    {sched.selectedProducts.map((p, pIdx) => (
                                      <div
                                        key={pIdx}
                                        className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0"
                                      >
                                        <div className="flex-1 pr-2">
                                          <span className="font-bold text-slate-800">
                                            {formatDualDisplay(p.brandName, p.marathiName, language)}
                                          </span>
                                          {p.companyName && (
                                            <span className="text-[10px] text-slate-400 ml-1">
                                              ({p.companyName})
                                            </span>
                                          )}
                                        </div>
                                        {p.dose && (
                                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 shrink-0 border border-purple-200">
                                            {p.dose}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 italic mb-3">
                                    {isEn
                                      ? "No products added (e.g. rest day or water management)."
                                      : "कोणतीही उत्पादने जोडलेली नाहीत (उदा. विश्रांती दिवस किंवा पाणी नियोजन)."}
                                  </p>
                                )}

                                {/* Notes */}
                                {sched.notes && (
                                  <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-1.5 text-xs text-slate-700 mb-3">
                                    <Leaf className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                    <p className="text-[11px] font-medium leading-relaxed">
                                      {sched.notes}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Card Bottom: Working Apply to Plot Button */}
                              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenApplyModal(sched)}
                                  className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                                >
                                  <Sprout className="w-4 h-4 shrink-0" />
                                  <span>{isEn ? "Apply to Plot" : "प्लॉटवर लागू करा"}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <CalendarDays className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-sm font-black text-slate-800 mb-1">
                {isEn ? "No Master Schedule Found" : "कोणतेही मास्टर शेड्युल आढळले नाही"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4 font-medium">
                {searchQuery || selectedCropFilter !== "all"
                  ? isEn
                    ? "No master schedules match the selected filters. Please adjust filters or create a new schedule."
                    : "निवडलेल्या फिल्टरनुसार कोणतेही मास्टर शेड्युल सापडले नाही. कृपया फिल्टर बदला किंवा नवीन शेड्युल तयार करा."
                  : isEn
                  ? "No master schedules created yet. Click the button below to create the first verified schedule."
                  : "अद्याप पिकांसाठी मास्टर शेड्युल तयार केलेले नाही. खालील बटणावर क्लिक करून पहिले प्रमाणित शेड्युल तयार करा."}
              </p>
              {isUserAdmin && (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isEn ? "Create First Master Schedule" : "पहिले मास्टर शेड्युल तयार करा"}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================== APPLY TO PLOT MODAL ===================== */}
      {applyTargetSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">
                    {isEn ? "Apply Master Schedule to Plot" : "शेड्युल प्लॉटवर लागू करा"}
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    Day {applyTargetSchedule.dayNo} • {getSingleLangLabel(applyTargetSchedule.cropName, isEn)} ({getSingleLangLabel(applyTargetSchedule.variety, isEn)})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApplyTargetSchedule(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                title={isEn ? "Close" : "बंद करा"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {applyError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{applyError}</span>
                </div>
              )}

              {/* Schedule Summary Banner */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-600">{isEn ? "Method & Stage:" : "पद्धत आणि अवस्था:"}</span>
                  <span className="text-purple-700 font-black">
                    {applyTargetSchedule.method} {applyTargetSchedule.stage ? `• ${applyTargetSchedule.stage}` : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>{isEn ? "Products included:" : "समाविष्ट उत्पादने:"}</span>
                  <span className="font-bold text-slate-800">
                    {applyTargetSchedule.selectedProducts?.length || 0} {isEn ? "Items" : "औषधे"}
                  </span>
                </div>
              </div>

              {/* Step 1: Select Farmer */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  १. शेतकरी निवडा (Select Farmer) <span className="text-red-500">*</span>
                </label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={
                      isEn
                        ? "Search farmer by name, mobile, or village..."
                        : "शेतकरी शोधा (नाव, मोबाईल किंवा गाव)..."
                    }
                    value={farmerSearchQuery}
                    onChange={(e) => setFarmerSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-50"
                  />
                </div>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => handleFarmerChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="">{isEn ? "-- Select Farmer --" : "-- शेतकरी निवडा --"}</option>
                  {filteredFarmersForModal.map((f: any) => (
                    <option key={f.id || f.mobile} value={f.id || f.mobile}>
                      {f.name} {f.village ? `(${f.village})` : ""} - {f.mobile}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Plot / Crop */}
              {selectedFarmer && (
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    २. प्लॉट / पीक निवडा (Select Plot / Crop) <span className="text-red-500">*</span>
                  </label>
                  {plotsForSelectedFarmer.length > 0 ? (
                    <select
                      value={selectedPlotKey}
                      onChange={(e) => handlePlotChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                    >
                      {plotsForSelectedFarmer.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.displayLabel}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-semibold">
                      {isEn
                        ? "This farmer has no plots registered yet. Please add a crop/plot under farmer profile first."
                        : "या शेतकऱ्याच्या नावावर अद्याप कोणताही प्लॉट किंवा पीक नोंदवलेले नाही. कृपया प्रथम शेतकरी प्रोफाइलमध्ये पीक जोडा."}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Schedule Date */}
              {selectedFarmer && plotsForSelectedFarmer.length > 0 && (
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    ३. शेड्युल तारीख (Schedule Date) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={customScheduleDate}
                    onChange={(e) => setCustomScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold font-mono focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                  />
                  {activePlotOption?.plantationDate && (
                    <p className="text-[10px] text-emerald-700 font-medium mt-1">
                      🌱 {isEn ? "Plantation date: " : "लागवड तारीख: "}{activePlotOption.plantationDate} (Day {applyTargetSchedule.dayNo} {isEn ? "auto-calculated" : "स्वयंचलित मोजली"})
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setApplyTargetSchedule(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
              >
                {isEn ? "Cancel" : "रद्द करा"}
              </button>
              <button
                type="button"
                disabled={!selectedFarmer || plotsForSelectedFarmer.length === 0 || isApplying}
                onClick={handleConfirmApply}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <Sprout className="w-4 h-4" />
                <span>
                  {isApplying
                    ? isEn
                      ? "Applying..."
                      : "लागू होत आहे..."
                    : isEn
                    ? "Apply to Plot"
                    : "प्लॉटवर लागू करा"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <ConfirmationModal
          isOpen={Boolean(deleteTargetId)}
          title={isEn ? "Delete Master Schedule" : "मास्टर शेड्युल हटवा"}
          message={
            isEn
              ? "Are you sure you want to permanently delete this master schedule? This action cannot be undone."
              : "तुम्हाला हे मास्टर शेड्युल कायमचे काढून टाकायचे आहे का? ही कृती पूर्ववत केली जाऊ शकत नाही."
          }
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}

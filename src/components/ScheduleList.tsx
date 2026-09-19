import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Calendar,
  Trash2,
  Edit,
  Share2,
  Plus,
  User,
  MapPin,
  Camera,
  Link,
  Copy,
  Eye,
  Sprout,
  Leaf,
  TestTube,
  CloudRain,
  AlertTriangle,
  Wind,
  Check,
  Search,
  ChevronDown,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import SchedulePreviewModal from "./SchedulePreviewModal";
import { saveItem } from "../lib/data-sync";
import { translateDoseToEnglish, isScheduleForFarmer, translateCompositionToMarathi, translateMarathiToEnglish, formatDualDisplay, getDoseLabel, formatModeOfAction, getCropPlotLabel } from "../lib/utils";
import { UserPermissions } from "../types";
import { HOSTING_URL } from "../lib/config";
import { registerBackHandler } from "../lib/backNavigation";

interface Product {
  brandName: string;
  marathiName?: string;
  composition?: string;
  activeIngredients?: string;
  dose?: string;
  doseSpray?: string;
  doseDrip?: string;
  doseBasal?: string;
  companyName?: string;
  formulation?: string;
  notes?: string;
}

interface Schedule {
  id?: string;
  day: string;
  scheduleDate: string;
  method: string;
  cropName: string;
  cropId?: string; // Add cropId for unique crop identification
  farmerId: string;
  dealer?: string;
  selectedProducts: Product[];
  notes?: string;
  done?: boolean;
  doneAt?: string;
  createdBy?: string;
  createdByUserId?: string;
  approvalStatus?: string;
  dayNo?: number;
  varietyName?: string;
  farmerName?: string;
}

interface ScheduleListProps {
  schedules: Schedule[];
  farmers: any[];
  isFarmerView?: boolean;
  onAddSchedule: (prefill?: any) => void;
  onEditSchedule: (index: number) => void;
  onDeleteSchedule: (index: number) => void;
  permissions?: UserPermissions;
  language?: "mr" | "en";
}

export default function ScheduleList({
  schedules,
  farmers,
  isFarmerView = false,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  permissions,
  language = "mr"
}: ScheduleListProps) {
  const isEn = language === "en";
  const [selectedFarmerId, setSelectedFarmerId] = useState(() => {
    if (isFarmerView && farmers.length > 0) {
      return farmers[0].id || farmers[0].mobile || "";
    }
    return localStorage.getItem("schedule_list_selected_farmer") || "";
  });
  const [selectedCropKey, setSelectedCropKey] = useState(() => {
    return (
      localStorage.getItem("schedule_list_selected_crop_key") ||
      localStorage.getItem("schedule_list_selected_crop") ||
      ""
    );
  });
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Back button handling: dismiss preview modal when open
  useEffect(() => {
    if (previewModalOpen) {
      return registerBackHandler(() => {
        setPreviewModalOpen(false);
        return true;
      });
    }
  }, [previewModalOpen]);

  const [isFarmerDropdownOpen, setIsFarmerDropdownOpen] = useState(false);
  const [farmerSearchQuery, setFarmerSearchQuery] = useState("");
  const farmerDropdownRef = useRef<HTMLDivElement>(null);
  const farmerSearchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isFarmerDropdownOpen) {
      const timer = setTimeout(() => {
        farmerSearchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setFarmerSearchQuery("");
    }
  }, [isFarmerDropdownOpen]);

  // Back button handling: dismiss farmer dropdown when open
  useEffect(() => {
    if (isFarmerDropdownOpen) {
      return registerBackHandler(() => {
        setIsFarmerDropdownOpen(false);
        return true;
      });
    }
  }, [isFarmerDropdownOpen]);

  // Click outside listener to close farmer dropdown
  useEffect(() => {
    if (!isFarmerDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        farmerDropdownRef.current &&
        !farmerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFarmerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFarmerDropdownOpen]);

  const [inlineEdit, setInlineEdit] = useState<{
    scheduleId: string;
    pIdx: number;
  } | null>(null);
  const [editData, setEditData] = useState<any>({});
  const scheduleRef = useRef<HTMLDivElement>(null);

  // Sync to localStorage
  useEffect(() => {
    if (selectedFarmerId) {
      localStorage.setItem("schedule_list_selected_farmer", selectedFarmerId);
    } else {
      localStorage.removeItem("schedule_list_selected_farmer");
    }
  }, [selectedFarmerId]);

  useEffect(() => {
    if (selectedCropKey) {
      localStorage.setItem("schedule_list_selected_crop_key", selectedCropKey);
    } else {
      localStorage.removeItem("schedule_list_selected_crop_key");
    }
  }, [selectedCropKey]);

  const activeFarmer = useMemo(() => {
    return farmers.find(
      (f) => f.mobile === selectedFarmerId || f.id === selectedFarmerId,
    );
  }, [farmers, selectedFarmerId]);

  const filteredFarmers = useMemo(() => {
    const query = farmerSearchQuery.trim().toLowerCase();
    if (!query) return farmers;
    return farmers.filter((f) => {
      const name = (f.name || "").toLowerCase();
      const mobile = (f.mobile || "").toLowerCase();
      const village = (f.village || "").toLowerCase();
      return name.includes(query) || mobile.includes(query) || village.includes(query);
    });
  }, [farmers, farmerSearchQuery]);

  const plotsForSelectedFarmer = useMemo(() => {
    if (!selectedFarmerId) return [];
    const selFarmer = farmers.find(
      (f) => f.mobile === selectedFarmerId || f.id === selectedFarmerId,
    );
    const matchedSchedules = schedules.filter((s) =>
      isScheduleForFarmer(s, selectedFarmerId, selFarmer),
    );

    const plots: {
      key: string;
      cropId: string;
      cropIndex: number;
      cropName: string;
      displayLabel: string;
      rawCrop?: any;
    }[] = [];

    if (selFarmer?.crops && Array.isArray(selFarmer.crops) && selFarmer.crops.length > 0) {
      selFarmer.crops.forEach((c: any, idx: number) => {
        const cropId = c.id || String(idx);
        const cropName = (c.crop || "नोंद नाही").trim();
        const displayLabel = getCropPlotLabel(c, idx, selFarmer.crops);
        const key = c.id ? `id_${c.id}` : `idx_${idx}_${cropName}`;

        plots.push({
          key,
          cropId,
          cropIndex: idx,
          cropName,
          displayLabel,
          rawCrop: c,
        });
      });
    }

    // Include any schedules that had custom/orphan crops not in farmer.crops
    matchedSchedules.forEach((s) => {
      const sCropName = (s.cropName || "").trim();
      const sCropId = s.cropId !== undefined && s.cropId !== null ? String(s.cropId).trim() : "";
      if (!sCropName) return;

      const alreadyCovered = plots.some(
        (p) =>
          (sCropId && (p.cropId === sCropId || String(p.cropIndex) === sCropId)) ||
          p.cropName.toLowerCase() === sCropName.toLowerCase(),
      );

      if (!alreadyCovered) {
        plots.push({
          key: `orphan_${sCropId || sCropName}`,
          cropId: sCropId || sCropName,
          cropIndex: plots.length,
          cropName: sCropName,
          displayLabel: sCropName,
        });
      }
    });

    return plots;
  }, [schedules, selectedFarmerId, farmers]);

  const activePlot = useMemo(() => {
    if (!plotsForSelectedFarmer.length) return null;
    return (
      plotsForSelectedFarmer.find((p) => p.key === selectedCropKey) ||
      plotsForSelectedFarmer.find((p) => p.cropId === selectedCropKey) ||
      plotsForSelectedFarmer.find((p) => p.cropName === selectedCropKey) ||
      plotsForSelectedFarmer[0]
    );
  }, [plotsForSelectedFarmer, selectedCropKey]);

  const selectedCrop = activePlot?.cropName || "";

  useEffect(() => {
    // Auto-select farmer if it's farmer view and we have farmers
    if (isFarmerView && farmers.length > 0) {
      const farmer = farmers[0];
      const targetId = farmer.id || farmer.mobile;
      setSelectedFarmerId(targetId);
    }
  }, [isFarmerView, farmers]);

  useEffect(() => {
    if (selectedFarmerId && plotsForSelectedFarmer.length > 0) {
      const isKeyValid = plotsForSelectedFarmer.some(
        (p) =>
          p.key === selectedCropKey ||
          p.cropId === selectedCropKey ||
          p.cropName === selectedCropKey,
      );
      if (!selectedCropKey || !isKeyValid) {
        const selFarmer = farmers.find(
          (f) => f.mobile === selectedFarmerId || f.id === selectedFarmerId,
        );
        const farmerSchedules = schedules.filter((s) =>
          isScheduleForFarmer(s, selectedFarmerId, selFarmer),
        );

        const firstWithSchedule = plotsForSelectedFarmer.find((p) =>
          farmerSchedules.some(
            (s) =>
              (s.cropId !== undefined &&
                s.cropId !== null &&
                (String(s.cropId).trim() === String(p.cropId).trim() ||
                  String(s.cropId).trim() === String(p.cropIndex))) ||
              (!s.cropId && s.cropName && s.cropName.trim() === p.cropName.trim()),
          ),
        );

        const chosen = firstWithSchedule || plotsForSelectedFarmer[0];
        setSelectedCropKey(chosen.key);
      }
    } else {
      setSelectedCropKey("");
    }
  }, [selectedFarmerId, plotsForSelectedFarmer, selectedCropKey, schedules, farmers]);

  const getMarathiDayOfWeek = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      const days = [
        "रविवार",
        "सोमवार",
        "मंगळवार",
        "बुधवार",
        "गुरूवार",
        "शुक्रवार",
        "शनिवार",
      ];
      return days[d.getDay()];
    } catch {
      return "";
    }
  };

  const getMarathiDateString = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      const months = [
        "जानेवारी",
        "फेब्रुवारी",
        "मार्च",
        "एप्रिल",
        "मे",
        "जून",
        "जुलै",
        "ऑगस्ट",
        "सप्टेंबर",
        "ऑक्टोबर",
        "नोव्हेंबर",
        "डिसेंबर",
      ];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    } catch {
      return "";
    }
  };

  const getDoneDisplay = (doneAtIso?: string) => {
    if (!doneAtIso) return "पूर्ण केले (Done)";
    try {
      const d = new Date(doneAtIso);
      const today = new Date();
      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
      const timeStr = d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      if (isToday) {
        return `आज डन केले (Completed Today) ${timeStr}`;
      } else {
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        return `पूर्ण केले (Completed): ${dateStr} ${timeStr}`;
      }
    } catch {
      return "पूर्ण केले (Done)";
    }
  };

  const getEnglishMethod = (m: string) => {
    if (!m) return "Spray";
    const lowM = m.toLowerCase();
    if (lowM.includes("drip") || m.includes("ड्रीप") || m.includes("ठिबक")) return "Drip";
    if (lowM.includes("gap") || m.includes("गॅप") || m.includes("विश्रांती")) return "Gap";
    if (lowM.includes("drenching") || m.includes("आळवणी")) return "Drenching";
    if (lowM.includes("mix") || m.includes("मिक्स")) return "Mix Dose";
    if (lowM.includes("manual") || m.includes("मॅन्युअल") || m.includes("इतर")) return "Other";
    return "Spray";
  };

  const getMarathiMethod = (schedule: Schedule) => {
    const m = schedule.method || "फवारणी";
    if (m === "मॅन्युअल/इतर") return schedule.method + (schedule.id ? " (" + (schedule as any).otherMethod + ")" : ""); 
    // Wait, the interface doesn't have otherMethod. I should add it or cast.
    return m;
  };

  const activeCropMeta = useMemo(() => {
    if (activePlot?.rawCrop) return activePlot.rawCrop;
    return activeFarmer?.crops?.[activePlot?.cropIndex || 0];
  }, [activeFarmer, activePlot]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (selectedFarmerId) {
        const selFarmer = farmers.find(
          (f) => f.mobile === selectedFarmerId || f.id === selectedFarmerId,
        );
        if (!isScheduleForFarmer(s, selectedFarmerId, selFarmer)) {
          return false;
        }
      }

      if (activePlot) {
        const sCropId =
          s.cropId !== undefined && s.cropId !== null ? String(s.cropId).trim() : "";
        const targetPlotId = String(activePlot.cropId || "").trim();
        const targetIndexStr = String(activePlot.cropIndex);

        if (sCropId !== "") {
          const matchId = sCropId === targetPlotId || sCropId === targetIndexStr;
          if (!matchId) return false;
        } else {
          // Legacy schedule without cropId: match by cropName
          const sCropName = (s.cropName || "").trim().toLowerCase();
          const targetCropName = (activePlot.cropName || "").trim().toLowerCase();
          if (sCropName !== targetCropName) return false;

          // If farmer has multiple plots of same crop, legacy schedules default to plot 0
          const sameCrops = activeFarmer?.crops?.filter(
            (c: any) => (c.crop || "").trim().toLowerCase() === targetCropName,
          );
          if (sameCrops && sameCrops.length > 1 && activePlot.cropIndex !== 0) {
            return false;
          }
        }
      }

      // Check target farmer settings for both Farmer and User if activeFarmer is matched
      if (activeFarmer) {
        if (activeFarmer.hideDoneSchedules && s.done === true) {
          return false;
        }
      }

      return true;
    });
  }, [
    schedules,
    selectedFarmerId,
    activePlot,
    activeFarmer,
    farmers,
  ]);

  const sortedSchedules = useMemo(() => {
    return [...filteredSchedules].sort((a, b) => {
      const dayA = parseInt(a.day, 10) || 0;
      const dayB = parseInt(b.day, 10) || 0;
      return dayA - dayB;
    });
  }, [filteredSchedules]);

  const groupedSchedules = useMemo(() => {
    const groups: { [date: string]: typeof sortedSchedules } = {};
    sortedSchedules.forEach((s) => {
      const d = s.scheduleDate;
      if (!groups[d]) {
        groups[d] = [];
      }
      groups[d].push(s);
    });

    return Object.keys(groups)
      .sort((dateA, dateB) => {
        const firstA = groups[dateA][0];
        const firstB = groups[dateB][0];
        const dayA = parseInt(firstA.day, 10) || 0;
        const dayB = parseInt(firstB.day, 10) || 0;
        return dayA - dayB;
      })
      .map((date) => {
        const sortedItems = [...groups[date]].sort((a, b) => {
          const methodA = getEnglishMethod(a.method);
          const methodB = getEnglishMethod(b.method);
          if (methodA === "Drip" && methodB !== "Drip") return -1;
          if (methodA !== "Drip" && methodB === "Drip") return 1;
          return 0;
        });
        return {
          date,
          day: sortedItems[0].day,
          schedules: sortedItems,
        };
      });
  }, [sortedSchedules]);

  const listItems = useMemo(() => {
    const res: any[] = [];
    for (let i = 0; i < groupedSchedules.length; i++) {
      res.push({ type: "schedule", data: groupedSchedules[i] });
      if (i < groupedSchedules.length - 1) {
        const currentDay = parseInt(groupedSchedules[i].day) || 0;
        const nextDay = parseInt(groupedSchedules[i + 1].day) || 0;
        if (nextDay - currentDay > 1) {
          res.push({
            type: "gap",
            startDay: currentDay + 1,
            endDay: nextDay - 1,
            gapDays: nextDay - currentDay - 1,
          });
        }
      }
    }
    return res;
  }, [groupedSchedules]);

  const handleAddNewAppend = () => {
    const lastDayNum =
      sortedSchedules.length > 0
        ? parseInt(sortedSchedules[sortedSchedules.length - 1].day, 10)
        : 0;
    const nextDay = isNaN(lastDayNum) ? 1 : lastDayNum + 3;

    onAddSchedule({
      farmerId: selectedFarmerId,
      selectedCropIndex: activePlot ? activePlot.cropIndex : 0,
      cropId: activePlot ? (activePlot.cropId || String(activePlot.cropIndex)) : "0",
      cropName: activePlot ? activePlot.cropName : "",
      day: nextDay.toString(),
    });
  };

  const safeFormatDate = (dateStr: any, formatStr: string = "dd/MM/yyyy") => {
    if (!dateStr) return "";
    try {
      const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return format(d, formatStr);
    } catch (e) {
      return String(dateStr);
    }
  };

  const shareWhatsApp = () => {
    if (sortedSchedules.length === 0) return;
    const farmerName = activeFarmer ? activeFarmer.name : "शेतकरी";
    const plantationDate =
      activeCropMeta?.plantationDate || activeCropMeta?.sowingDate;

    let text = `🌿 *VIONEX वेळापत्रक नियोजन* 🌿\n`;
    text += `*शेतकरी:* ${farmerName}\n`;
    text += `*पीक / प्लॉट:* ${activePlot?.displayLabel || selectedCrop}\n`;
    if (activeCropMeta?.variety) text += `*वाण:* ${activeCropMeta.variety}\n`;
    if (plantationDate)
      text += `*तारीख:* ${safeFormatDate(plantationDate)}\n`;
    text += `-------------------------------------------\n\n`;

    sortedSchedules.forEach((schedule) => {
      const dayName = getMarathiDayOfWeek(schedule.scheduleDate);
      const displayDate = safeFormatDate(schedule.scheduleDate);
      const engMethod = getEnglishMethod(schedule.method);
      const marathiMethod = schedule.method === "मॅन्युअल/इतर" 
        ? (schedule as any).otherMethod || "इतर"
        : schedule.method;

      text += `🗓️ *दिवस ${schedule.day}* (${marathiMethod})\n`;
      text += `तारीख: ${displayDate} (${dayName})\n`;

      if (
        engMethod === "Gap" &&
        (!schedule.selectedProducts || schedule.selectedProducts.length === 0)
      ) {
        text += `  *गॅप / विश्रांतीचा दिवस* 😴 (आज कोणतेही औषध फवारणी किंवा ड्रीप करू नये)\n`;
      } else {
        schedule.selectedProducts?.forEach((p, pIdx) => {
          const dose = p.dose || p.doseSpray || p.doseDrip || "-";
          text += `  ${pIdx + 1}) *${p.brandName}* - ${dose}\n`;
        });
      }
      if (schedule.notes) text += `📝 *नोंद:* ${schedule.notes}\n`;
      text += `\n`;
    });

    text += `*VIONEX - Smart Farming* 🚜🌿\n\n`;
    const baseHost = HOSTING_URL || (typeof window !== "undefined" && window.location.origin ? window.location.origin : "");
    if (baseHost) {
      const appUrl = baseHost.replace(/\/$/, "") + "/?type=farmer";
      text += `📱 *वेळापत्रक ॲप (App) पाहण्यासाठी लिंक:*\n🔗 ${appUrl}\n\n*(ही लिंक उघडून तुम्ही ॲप तुमच्या मोबाईलमध्ये Install करू शकता)*`;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const takePhoto = () => setPreviewModalOpen(true);

  const weatherAlerts = useMemo(
    () => [
      {
        text: "पुढील ४८ तासांत पावसाची १०% शक्यता. फवारणी नियोजनात खबरदारी घ्या.",
        type: "weather",
        icon: <CloudRain className="w-3 h-3" />,
      },
      {
        text: "जास्त आर्द्रतेमुळे करपा आणि भुरी रोगाचा प्रादुर्भाव वाढण्याची शक्यता.",
        type: "disease",
        icon: <AlertTriangle className="w-3 h-3" />,
      },
      {
        text: "उद्या हवेचा वेग जास्त राहण्याची शक्यता असल्याने उंच पिकांना आधार द्या.",
        type: "wind",
        icon: <Wind className="w-3 h-3" />,
      },
      {
        text: "तापमानात वाढ होत असल्याने पाण्याचे नियोजन वेळेवर करा.",
        type: "temp",
        icon: <AlertTriangle className="w-3 h-3" />,
      },
    ],
    [],
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const pullStartRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scheduleRef.current?.scrollTop === 0) {
      pullStartRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartRef.current !== null) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - pullStartRef.current;
      if (distance > 0) {
        setPullDistance(Math.min(distance * 0.4, 80));
        // Prevent scrolling while pulling
        if (distance > 10 && e.cancelable) {
          // e.preventDefault(); // can't prevent default in passive listener
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      triggerRefresh();
    }
    setPullDistance(0);
    pullStartRef.current = null;
  };

  const triggerRefresh = () => {
    setIsRefreshing(true);
    // In many real apps, this would be a re-fetch.
    // Here we rely on Firestore onSnapshot, but we'll show a visual feedback
    // to give the user confidence.
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  return (
    <div
      className="bg-[#f0f2f5] min-h-screen pb-20 overflow-y-auto"
      id="schedule-dashboard"
      ref={scheduleRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className="flex justify-center overflow-hidden transition-all duration-200"
        style={{
          height:
            pullDistance > 0
              ? `${pullDistance}px`
              : isRefreshing
                ? "50px"
                : "0px",
        }}
      >
        <div className="flex items-center gap-2 text-emerald-600 py-3">
          <div
            className={`w-5 h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full ${isRefreshing || pullDistance > 0 ? "animate-spin" : ""}`}
          ></div>
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isRefreshing ? "अपडेट घेत आहे..." : "ताजे करण्यासाठी खाली ओढा"}
          </span>
        </div>
      </div>

      {/* Farmer Welcome Banner */}
      {isFarmerView && activeFarmer && (
        <div className="bg-emerald-800 px-6 pt-6 pb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-700/20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-900/30 rounded-full -ml-20 -mb-20 blur-2xl"></div>
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h2 className="text-sm font-black text-white leading-tight uppercase tracking-tight">
                  {activeFarmer.name}
                </h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Controls: Compact Header Row */}
      {!isFarmerView && (
        <div
          className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-sm"
          id="filters-compact-row"
        >
          <div className="relative" ref={farmerDropdownRef}>
            {/* Custom Combobox Trigger Button */}
            <button
              type="button"
              id="select-farmer-filter"
              onClick={() => setIsFarmerDropdownOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between bg-slate-50 border rounded-lg py-2.5 px-3 text-xs font-bold font-sans transition-all ${
                isFarmerDropdownOpen
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-white"
                  : "border-slate-200 text-slate-800 hover:border-slate-300"
              }`}
              aria-haspopup="listbox"
              aria-expanded={isFarmerDropdownOpen}
            >
              <div className="flex items-center gap-2 truncate text-left mr-2">
                <User className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">
                  {activeFarmer
                    ? `${activeFarmer.name} - ${activeFarmer.mobile}`
                    : "-- शेतकरी निवडा (Select Farmer) --"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {selectedFarmerId && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFarmerId("");
                      setSelectedCropKey("");
                      setIsFarmerDropdownOpen(false);
                    }}
                    className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    title="निवड रद्द करा (Clear)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isFarmerDropdownOpen ? "rotate-180 text-emerald-600" : ""
                  }`}
                />
              </div>
            </button>

            {/* Dropdown Floating Panel */}
            {isFarmerDropdownOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
                style={{ maxHeight: "55vh" }}
              >
                {/* Search Box at the TOP */}
                <div className="p-2 border-b border-slate-100 bg-slate-50/90 backdrop-blur-sm sticky top-0 z-10">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      ref={farmerSearchInputRef}
                      type="text"
                      value={farmerSearchQuery}
                      onChange={(e) => setFarmerSearchQuery(e.target.value)}
                      placeholder="नाव किंवा मोबाईल नंबर शोधा..."
                      className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    {farmerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setFarmerSearchQuery("")}
                        className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable Options List */}
                <div className="overflow-y-auto overscroll-contain divide-y divide-slate-100">
                  {/* Default / Clear selection option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFarmerId("");
                      setSelectedCropKey("");
                      setIsFarmerDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between text-xs font-semibold hover:bg-slate-50 transition-colors ${
                      !selectedFarmerId
                        ? "bg-emerald-50/80 text-emerald-800 font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    <span className="truncate">-- शेतकरी निवडा (Select Farmer) --</span>
                    {!selectedFarmerId && (
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-1" />
                    )}
                  </button>

                  {/* Filtered Farmer List */}
                  {filteredFarmers.length > 0 ? (
                    filteredFarmers.map((f, idx) => {
                      const fId = f.id || f.mobile;
                      const isSelected = selectedFarmerId === fId;
                      return (
                        <button
                          key={fId || idx}
                          type="button"
                          onClick={() => {
                            setSelectedFarmerId(fId);
                            setSelectedCropKey("");
                            setIsFarmerDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-emerald-50/60 transition-colors ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-900 font-bold"
                              : "text-slate-800"
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-xs font-bold truncate">
                              {f.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-normal truncate mt-0.5">
                              📱 {f.mobile} {f.village ? `• 📍 ${f.village}` : ""}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-6 px-4 text-center">
                      <p className="text-xs font-semibold text-slate-600">
                        कोणताही शेतकरी सापडला नाही
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        (No farmer found for "{farmerSearchQuery}")
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className={`p-3 max-w-xl mx-auto space-y-4 ${isFarmerView ? "-mt-8 relative z-20" : ""}`}
      >
        {/* Crop Selection Section */}
        {activeFarmer ? (
          <div
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4"
            id="farmer-profile-card"
          >
            {!isFarmerView && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">
                      {activeFarmer.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                        <Share2 className="w-3 h-3" />
                        <span>{activeFarmer.mobile}</span>
                      </div>
                      {activeFarmer.village && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                          <MapPin className="w-3 h-3" />
                          <span className="uppercase tracking-tighter">
                            {activeFarmer.village}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-1 mt-2">
                  <button
                    onClick={() =>
                      onAddSchedule({
                        farmerId: selectedFarmerId,
                        selectedCropIndex: activePlot ? activePlot.cropIndex : 0,
                        cropId: activePlot ? (activePlot.cropId || String(activePlot.cropIndex)) : "0",
                        cropName: activePlot ? activePlot.cropName : "",
                      })
                    }
                    className="flex-1 py-1.5 flex justify-center items-center text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="शेड्युल जोडा"
                  >
                    <Plus className="w-5 h-5 drop-shadow-sm" />
                  </button>
                  <div className="w-[1px] h-5 bg-slate-200"></div>
                  <button
                    onClick={takePhoto}
                    className="flex-1 py-1.5 flex justify-center items-center text-cyan-600 hover:bg-cyan-100 rounded-lg transition-colors"
                    title="फोटो काढा / डाउनलोड"
                  >
                    <Camera className="w-5 h-5 drop-shadow-sm" />
                  </button>
                  <div className="w-[1px] h-5 bg-slate-200"></div>
                  <button
                    onClick={shareWhatsApp}
                    className="flex-1 py-1.5 flex justify-center items-center text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                    title="लिंक पाठवा"
                  >
                    <Share2 className="w-5 h-5 drop-shadow-sm" />
                  </button>
                  <div className="w-[1px] h-5 bg-slate-200"></div>
                  <button
                    onClick={() => {
                      if (sortedSchedules.length === 0) return;
                      let copyText = `VIONEX SCHEDULE - ${activeFarmer?.name || "Farmer"}\n\n`;
                      sortedSchedules.forEach((s) => {
                        copyText += `Day ${s.day} (${s.method}): ${s.scheduleDate}\n`;
                        s.selectedProducts.forEach((p) => {
                          copyText += `- ${p.brandName} (${p.dose || "-"})\n`;
                        });
                        copyText += `\n`;
                      });
                      navigator.clipboard.writeText(copyText);
                      alert("वेळापत्रक कॉपी झाले!");
                    }}
                    className="flex-1 py-1.5 flex justify-center items-center text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    title="कॉपी करा"
                  >
                    <Copy className="w-5 h-5 drop-shadow-sm" />
                  </button>
                </div>
              </>
            )}

            {/* Crop Filter Section */}
            <div className={`pt-2 ${isFarmerView ? "space-y-2" : "space-y-2"}`}>
              {isFarmerView && activeFarmer?.dealer && (
                <div className="flex items-center gap-1.5 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                    अधिकृत विक्रेता: {activeFarmer.dealer}
                  </span>
                </div>
              )}
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                <Sprout
                  className={`w-3 h-3 ${isFarmerView ? "text-emerald-500" : ""}`}
                />{" "}
                {isFarmerView ? "तुमचे पीक निवडा" : "पीक निवडा (Select Crop)"}
              </p>
              <div className="flex flex-wrap gap-1.5 px-0.5">
                {plotsForSelectedFarmer.map((plot) => (
                  <button
                    key={plot.key}
                    onClick={() => setSelectedCropKey(plot.key)}
                    className={`rounded-lg font-bold transition-all border px-2.5 py-1 text-[10px] ${
                      activePlot?.key === plot.key
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {plot.displayLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center flex flex-col items-center gap-4">
            <Calendar className="w-10 h-10 text-slate-200" />
            <p className="text-sm font-bold text-slate-400">
              शेड्युल पाहण्यासाठी शेतकरी निवडा
            </p>
          </div>
        )}

        {/* Schedule Cards Section */}
        {selectedFarmerId && activePlot && (
          <div className="space-y-4 pt-4 pb-12">
            {listItems.length > 0 ? (
              <>
              {listItems.slice(0, pageSize).map((item, idx) => {
                if (item.type === "gap") {
                  return (
                    <div
                      key={`gap-${idx}`}
                      className="rounded-2xl border border-amber-200 bg-amber-50/25 p-4 shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Leaf className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-amber-800 font-extrabold text-xs mb-0.5">
                          गॅप कालावधी - {item.gapDays} दिवस विश्रांती (Gap
                          Period) 😴
                        </h4>
                        <p className="text-amber-600 text-[10px] font-bold font-sans">
                          दिवस {item.startDay} ते दिवस {item.endDay} पर्यंत गॅप.
                          या काळात कोणतेही औषध फवारणी किंवा ठिबक नियोजन नाही.
                        </p>
                      </div>
                    </div>
                  );
                }

                const group = item.data;
                const displayDate = safeFormatDate(group.date);
                const dayName = getMarathiDayOfWeek(group.date);
                const isMultiple = group.schedules.length > 1;

                return (
                  <div
                    key={group.date || idx}
                    className={`rounded-2xl border overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all ${
                      isMultiple
                        ? "border-amber-400 bg-amber-50/5 shadow-sm ring-1 ring-amber-400/30"
                        : "bg-white border-slate-100 shadow-sm"
                    }`}
                  >
                    {/* Group's individual schedules vertically stacked */}
                    <div className="divide-y divide-slate-100">
                      {group.schedules.map((schedule, sIdx) => {
                        const originalIndex = schedules.findIndex(
                          (s) => s === schedule,
                        );
                        const engMethod = getEnglishMethod(schedule.method);

                        return (
                          <div
                            key={`${schedule.cropId || 'no-crop'}-${schedule.id || sIdx}`}
                            className="p-3 sm:p-4 space-y-3 animate-in fade-in duration-200"
                          >
                            {/* Single Line Header: Day, Date, Day Name, Method, Done, Edit, Delete */}
                            <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
                              {/* Left part: Day, Date, DayName, Method badge */}
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                                {/* Day Circle: adjusted/styled size */}
                                <div className="flex items-center justify-center bg-emerald-600 text-white rounded-full w-6 h-6 shrink-0 shadow-xs border border-emerald-500">
                                  <span className="text-[10px] font-black leading-none">
                                    {group.day}
                                  </span>
                                </div>

                                {/* Date & Day Name */}
                                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-700 tracking-tight shrink-0">
                                  <span>{displayDate}</span>
                                  <span className="text-slate-400 lowercase font-medium">({dayName})</span>
                                </div>

                                {/* Option Method Badge */}
                                <span
                                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                                    engMethod === "Drip"
                                      ? "bg-blue-50/75 border-blue-100 text-blue-700"
                                      : engMethod === "Gap"
                                        ? "bg-amber-50/75 border-amber-100 text-amber-700"
                                        : engMethod === "Drenching"
                                          ? "bg-indigo-50/75 border-indigo-100 text-indigo-700"
                                          : engMethod === "Mix Dose"
                                            ? "bg-purple-50/75 border-purple-100 text-purple-700"
                                            : "bg-emerald-50/75 border-emerald-100 text-emerald-700"
                                  }`}
                                >
                                  {engMethod === "Drip"
                                    ? "💧 ड्रीप"
                                    : engMethod === "Gap"
                                      ? "😴 गॅप"
                                      : schedule.method === "आळवणी / ड्रिंचिंग"
                                        ? "🪣 ड्रिंचिंग"
                                        : schedule.method === "मॅन्युअल/इतर"
                                          ? `🛠️ ${(schedule as any).otherMethod || "इतर"}`
                                          : schedule.method === "मिक्स डोस"
                                            ? "🧪 मिक्स"
                                            : `🌱 फवारणी`}
                                </span>

                                {!isFarmerView && schedule.done && (
                                  <span
                                    className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs shrink-0"
                                  >
                                    ✓ {getDoneDisplay(schedule.doneAt)}
                                  </span>
                                )}
                              </div>

                              {/* Right part: Done, Edit, Delete on the same line */}
                              <div className="flex items-center gap-1 shrink-0">
                                {(isFarmerView || permissions?.canMarkDone !== false) && engMethod !== "Gap" && (
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (schedule.id) {
                                        const isDone = !!schedule.done;
                                        const doneAtVal = isDone
                                          ? null
                                          : new Date().toISOString();
                                        saveItem(
                                          "schedules",
                                          {
                                            ...schedule,
                                            done: !isDone,
                                            doneAt: doneAtVal,
                                          },
                                          schedule.id,
                                        ).catch(console.error);
                                      }
                                    }}
                                    className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md border flex items-center gap-0.5 transition-all active:scale-95 shadow-xs cursor-pointer ${
                                      schedule.done
                                        ? "bg-emerald-600 border-emerald-600 text-white animate-pulse"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {schedule.done ? "Done ✓" : "Done"}
                                  </button>
                                )}

                                {!isFarmerView && (
                                  <div className="flex gap-0.5 items-center">
                                    {permissions?.schedules !== false && (
                                      <button
                                        onClick={() =>
                                          onEditSchedule(originalIndex)
                                        }
                                        className="p-1 hover:bg-slate-100 rounded text-blue-500 transition-colors cursor-pointer"
                                        title="बदला"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {(permissions?.canCancel !== false) && (
                                      <button
                                        onClick={() =>
                                          onDeleteSchedule(originalIndex)
                                        }
                                        className="p-1 hover:bg-slate-100 rounded text-red-500 transition-colors cursor-pointer"
                                        title="हटवा"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Products Section */}
                                {engMethod === "Gap" &&
                                (!schedule.selectedProducts ||
                                  schedule.selectedProducts.length === 0) ? (
                                  <div className="py-4 text-center border-2 border-dashed border-amber-200/50 rounded-2xl bg-amber-50/5">
                                    <p className="text-xs font-black text-amber-700">
                                      गॅप / विश्रांतीचा दिवस 😴
                                    </p>
                                    <p className="text-[10px] text-amber-600 mt-1 font-bold font-sans">
                                      आज कोणतेही औषध फवारणी किंवा ठिबक करू नये.
                                    </p>
                                  </div>
                                ) : (
                              <div className="space-y-3">
                                {schedule.selectedProducts?.map((p, pIdx) => {
                                  const rawDose =
                                    p.dose ||
                                    (engMethod === "Drip"
                                      ? p.doseDrip
                                      : engMethod === "Mix Dose"
                                      ? p.doseBasal
                                      : p.doseSpray) ||
                                    "-";
                                  const dose = translateDoseToEnglish(rawDose);
                                  const compositionText =
                                    p.composition || p.activeIngredients;
                                  return (
                                    <div
                                      key={pIdx}
                                      className="pb-3 border-b border-slate-50 last:border-0 last:pb-0"
                                    >
                                      {inlineEdit?.scheduleId === schedule.id &&
                                      inlineEdit?.pIdx === pIdx ? (
                                        <div className="bg-slate-50 p-2 rounded-lg border border-blue-200">
                                          <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div>
                                              <label className="text-[9px] font-black uppercase text-slate-500 mb-0.5 block">
                                                उत्पादनाचे नाव (Name)
                                              </label>
                                              <input
                                                type="text"
                                                className="w-full text-xs p-1.5 border rounded border-slate-200 font-bold outline-none focus:border-blue-400"
                                                value={editData.brandName || ""}
                                                onChange={(e) =>
                                                  setEditData({
                                                    ...editData,
                                                    brandName: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[9px] font-black uppercase text-slate-500 mb-0.5 block">
                                                Dose
                                              </label>
                                              <input
                                                type="text"
                                                className="w-full text-xs p-1.5 border rounded border-slate-200 font-bold outline-none focus:border-blue-400"
                                                value={editData.dose || ""}
                                                onChange={(e) =>
                                                  setEditData({
                                                    ...editData,
                                                    dose: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div>
                                              <label className="text-[9px] font-black uppercase text-slate-500 mb-0.5 block">
                                                Company
                                              </label>
                                              <input
                                                type="text"
                                                className="w-full text-xs p-1.5 border rounded border-slate-200 outline-none focus:border-blue-400"
                                                value={
                                                  editData.companyName || ""
                                                }
                                                onChange={(e) =>
                                                  setEditData({
                                                    ...editData,
                                                    companyName: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[9px] font-black uppercase text-slate-500 mb-0.5 block">
                                                Composition
                                              </label>
                                              <input
                                                type="text"
                                                className="w-full text-xs p-1.5 border rounded border-slate-200 outline-none focus:border-blue-400"
                                                value={
                                                  editData.composition || ""
                                                }
                                                onChange={(e) =>
                                                  setEditData({
                                                    ...editData,
                                                    composition: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                          </div>
                                          <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-200/60">
                                            <button
                                              onClick={() =>
                                                setInlineEdit(null)
                                              }
                                              className="text-[10px] px-2.5 py-1 rounded border border-slate-300 text-slate-600 font-bold"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              onClick={async () => {
                                                const updatedProducts = [
                                                  ...(schedule.selectedProducts ||
                                                    []),
                                                ];
                                                updatedProducts[pIdx] = {
                                                  ...p,
                                                  brandName: editData.brandName,
                                                  dose: editData.dose,
                                                  companyName:
                                                    editData.companyName,
                                                  activeIngredients:
                                                    editData.composition,
                                                  composition:
                                                    editData.composition,
                                                  doseSpray: editData.dose,
                                                  doseDrip: editData.dose,
                                                };
                                                const updatedSchedule = {
                                                  ...schedule,
                                                  selectedProducts:
                                                    updatedProducts,
                                                };
                                                setInlineEdit(null);
                                                if (schedule.id) {
                                                  saveItem(
                                                    "schedules",
                                                    updatedSchedule,
                                                    schedule.id,
                                                  ).catch(console.error);
                                                }
                                              }}
                                              className="text-[10px] px-2.5 py-1 rounded bg-blue-600 text-white font-bold shadow-sm"
                                            >
                                              Save
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div
                                            className={`block space-y-1.5 w-full ${!isFarmerView ? "cursor-pointer hover:bg-blue-50/50 rounded -mx-1.5 px-1.5 py-1.5 transition-colors" : ""}`}
                                            onClick={() => {
                                              if (
                                                !isFarmerView &&
                                                schedule.id
                                              ) {
                                                setInlineEdit({
                                                  scheduleId: schedule.id,
                                                  pIdx,
                                                });
                                                setEditData({
                                                  brandName: p.brandName || "",
                                                  dose:
                                                    rawDose === "-"
                                                      ? ""
                                                      : rawDose,
                                                  companyName:
                                                    p.companyName || "",
                                                  composition:
                                                    compositionText || "",
                                                });
                                              }
                                            }}
                                          >
                                            <div className="flex justify-between items-start gap-4">
                                              <div className="flex-1">
                                                <h5 className="text-sm font-black text-slate-800 leading-tight">
                                                   {formatDualDisplay(p.brandName, p.marathiName)}
                                                </h5>
                                              </div>
                                              <div className="shrink-0 pt-0.5">
                                                <span
                                                  className={`text-[11px] font-black px-2.5 py-1 rounded-lg border shadow-sm block ${
                                                    engMethod === "Drip"
                                                      ? "text-blue-700 bg-blue-50 border-blue-100"
                                                      : "text-emerald-700 bg-emerald-50 border-emerald-100"
                                                  }`}
                                                >
                                                  {dose}
                                                </span>
                                              </div>
                                            </div>

                                            {p.companyName && (
                                              <div className="text-[12px] font-semibold text-slate-500 mt-0.5">
                                                {p.companyName}
                                              </div>
                                            )}
                                            
                                            {p.modeOfAction && p.modeOfAction !== "लागू नाही" && p.modeOfAction !== "माहिती उपलब्ध नाही" && (
                                              <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                                                <span className="font-extrabold text-slate-700">Mode of Action: </span>
                                                <span>{formatModeOfAction(p.modeOfAction)}</span>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {(schedule.notes || (schedule as any).advisory) && (
                              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 shadow-sm">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                  <Leaf className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">
                                    Note/Tip (सल्ला/टीप)
                                  </p>
                                  <p className="text-xs text-slate-700 font-bold leading-relaxed">
                                    {schedule.notes || (schedule as any).advisory}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

                {listItems.length > pageSize && (
                  <div className="flex justify-center pt-2 pb-6">
                    <button
                      onClick={() => setPageSize(prev => prev + 15)}
                      className="px-6 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 active:bg-emerald-100 transition-colors shadow-sm"
                    >
                      {language === 'en' ? "Load More Schedules" : "आणखी वेळापत्रक पहा"}
                    </button>
                  </div>
                )}
              </>

            ) : (
              <div className="bg-white p-10 rounded-3xl border border-slate-100 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-slate-200" />
                </div>
                <h4 className="text-sm font-black text-slate-800 mb-1">
                  वेळापत्रक सापडले नाही
                </h4>
                <p className="text-[11px] text-slate-400 font-bold leading-tight">
                  निवडलेल्या पिकासाठी सध्या कोणतेही वेळापत्रक नियोजन केलेले
                  नाही.
                </p>
              </div>
            )}

            {!isFarmerView && (
              <div className="flex justify-center py-4">
                <button
                  onClick={handleAddNewAppend}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> पुढील शेड्युल जोडा
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {previewModalOpen && (
        <SchedulePreviewModal
          schedules={sortedSchedules}
          farmer={activeFarmer}
          cropName={activePlot?.displayLabel || selectedCrop}
          cropMeta={activeCropMeta}
          onClose={() => setPreviewModalOpen(false)}
        />
      )}
    </div>
  );
}

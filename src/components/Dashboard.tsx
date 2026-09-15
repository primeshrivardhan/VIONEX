import { 
  Users, 
  Package, 
  Calendar, 
  Store, 
  Settings, 
  UserCheck, 
  CalendarDays, 
  Shield,
  CloudRain,
  ChevronRight,
  FlaskConical,
  AlertTriangle,
  Globe,
  MapPin
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect, memo } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Props {
  onNavigate: (id: string) => void;
  toggleLanguage: () => void;
  isFarmer?: boolean;
  allowedNavIds?: string[];
  language?: "mr" | "en";
}

export default memo(function Dashboard({ onNavigate, toggleLanguage, isFarmer, allowedNavIds, language = "mr" }: Props) {
  const isEn = language === "en";

  const menuItems = [
    {
      id: "farmers",
      title: isEn ? "Farmers" : "शेतकरी",
      subtitle: isEn ? "Farmer list and details" : "शेतकरी यादी आणि माहिती",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: "schedule",
      title: isEn ? "Schedules" : "वेळापत्रक",
      subtitle: isEn ? "Scheduled spray/fertility tasks" : "नियोजित वेळापत्रक व योजना",
      icon: Calendar,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "language",
      title: isEn ? "मराठी" : "English",
      subtitle: isEn ? "Change to Marathi" : "इंग्रजी भाषेत पहा",
      icon: Globe,
      color: "bg-teal-50 text-teal-600",
    },
    {
      id: "advice",
      title: isEn ? "Alerts" : "सतर्कता",
      subtitle: isEn ? "Live crop & disease alerts" : "लाईव्ह पीक आणि रोग अपडेट्स",
      icon: AlertTriangle,
      color: "bg-amber-50 text-amber-600",
    },
    {
      id: "products",
      title: isEn ? "Products" : "उत्पादने",
      subtitle: isEn ? "Product catalog & list" : "उत्पादन कॅटलॉग व यादी",
      icon: Package,
      color: "bg-orange-50 text-orange-600",
    },
    {
      id: "dealers",
      title: isEn ? "Dealers" : "डीलर",
      subtitle: isEn ? "Dealer network & contact" : "डीलर नेटवर्क व संपर्क",
      icon: Store,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      id: "consultants",
      title: isEn ? "Consultants" : "कन्सल्टंट",
      subtitle: isEn ? "Agri experts & advisors" : "कृषी तज्ञ सल्लागार",
      icon: UserCheck,
      color: "bg-rose-50 text-rose-600",
    },
    {
      id: "masterSchedules",
      title: isEn ? "Master Schedules" : "मास्टर शेड्युल",
      subtitle: isEn ? "Standard crop schedules" : "सर्व पिकांचे मास्टर शेड्युल",
      icon: CalendarDays,
      color: "bg-purple-50 text-purple-600",
    },
    {
      id: "settings",
      title: isEn ? "Settings" : "सेटिंग्ज",
      subtitle: isEn ? "App settings & profile" : "ॲप सेटिंग्ज व प्रोफाईल",
      icon: Settings,
      color: "bg-slate-50 text-slate-600",
    },
    {
      id: "location-mapping",
      title: isEn ? "Locations" : "लोकेशन",
      subtitle: isEn ? "State/Dist/Taluka master" : "राज्य/जिल्हा/तालुका मास्टर",
      icon: MapPin,
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      id: "admin",
      title: isEn ? "Admin" : "ऍडमिन",
      subtitle: isEn ? "Admin control panel" : "प्रशासकीय नियंत्रण केंद्र",
      icon: Shield,
      color: "bg-red-50 text-red-600",
    },
  ].filter(item => {
    if (item.id === "language") {
      return true;
    }
    if (isFarmer) {
      return item.id === "schedule" || item.id === "settings" || item.id === "advice" || item.id === "products" || item.id === "dealers";
    }
    if (allowedNavIds) {
      return allowedNavIds.includes(item.id);
    }
    return true;
  });

  const numItems = menuItems.length;
  let gridColsClass = "grid-cols-3";
  let btnSizeClass = "w-14 h-14";
  let iconSizeClass = "w-6 h-6";
  let textSizeClass = "text-[11px]";

  if (numItems <= 3) {
    gridColsClass = "grid-cols-3 px-4";
    btnSizeClass = "w-24 h-24 sm:w-28 sm:h-28";
    iconSizeClass = "w-10 h-10 sm:w-12 sm:h-12";
    textSizeClass = "text-sm sm:text-base font-black";
  } else if (numItems > 6) {
    gridColsClass = "grid-cols-4 px-2 gap-x-3 gap-y-6";
    btnSizeClass = "w-16 h-16 sm:w-20 sm:h-20";
    iconSizeClass = "w-7 h-7 sm:w-8 sm:h-8";
    textSizeClass = "text-[11px] sm:text-xs font-bold";
  } else {
    // 4 to 6 items
    gridColsClass = "grid-cols-3 px-4 gap-6";
    btnSizeClass = "w-20 h-20 sm:w-24 sm:h-24";
    iconSizeClass = "w-8 h-8 sm:w-10 sm:h-10";
    textSizeClass = "text-xs sm:text-sm font-black";
  }

  return (
    <div className="h-full pb-12 flex flex-col items-center justify-start pt-4">
      <div className={`grid ${gridColsClass} gap-y-8 gap-x-4 w-full justify-items-center`}>
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center justify-start gap-1.5 relative group w-full"
            onClick={() => {
              if (item.id === "language") {
                toggleLanguage();
              } else {
                onNavigate(item.id);
              }
            }}
          >
            <div className={`${btnSizeClass} rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-95 border border-slate-100 shrink-0 ${item.color}`}>
              <item.icon className={iconSizeClass} />
            </div>
            <span className={`font-extrabold text-slate-700 leading-tight text-center break-words max-w-full px-1 ${textSizeClass}`}>{item.title}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
});

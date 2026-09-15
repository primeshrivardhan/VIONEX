import React from "react";
import { 
  X, 
  ShieldCheck, 
  FlaskConical, 
  Sprout, 
  Target, 
  Zap, 
  Droplet, 
  Waves, 
  MapPin,
  CheckCircle2,
  Package
} from "lucide-react";
import { Product } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ProductDetailsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailsModal({ product, isOpen, onClose }: ProductDetailsModalProps) {
  if (!isOpen) return null;

  // Clean brand name to remove any duplicate Marathi in parentheses from the brandName string itself
  const cleanBrandName = product.brandName?.replace(/\s?\(.*?\)/g, "").trim();
  const marathiBrandName = product.marathiName || product.brandName?.match(/\((.*?)\)/)?.[1];

  const infoRows = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#00875A]" />,
      titleEn: "Mode of Action",
      value: product.modeOfAction || "Contact + Systemic (स्पर्शजन्य व अंतरप्रवाही)",
    },
    {
      icon: <FlaskConical className="w-5 h-5 text-[#00875A]" />,
      titleEn: "Composition",
      value: product.composition || "Carbendazim (कार्बेन्डाझिम) 12% + Mancozeb (मॅन्कोझेब) 63% WP",
    },
    {
      icon: <Sprout className="w-5 h-5 text-[#00875A]" />,
      titleEn: "Recommended Crops",
      value: product.targetCrops || "Chilli (मिरची), Tomato (टोमॅटो), Soybean (सोयाबीन), Vegetables (भाजीपाला), Grapes (द्राक्ष), Pomegranate (डाळिंब) व फळझाडे",
    },
    {
      icon: <Target className="w-5 h-5 text-[#00875A]" />,
      titleEn: "Target Pest / Disease",
      value: product.targetPests || product.targetDiseases || "Leaf Spot (पानावरील डाग), Blight (करपा), Powdery Mildew (भुरी), Rust (गंज), Root Rot (मुळ कुज), Wilt (मर), Fungal Diseases (बुरशीजन्य रोग)",
    },
    {
      icon: <Zap className="w-5 h-5 text-[#00875A]" />,
      titleEn: "Spray Dose",
      value: product.doseSpray || "2 - 2.5 gm/Litre (2 - 2.5 ग्रॅम/लिटर)",
    },
    {
      icon: <Droplet className="w-5 h-5 text-[#00875A]" />,
      titleEn: "Drip Dose",
      value: product.doseDrip || "500 gm/Acre (500 ग्रॅम/एकर)",
    },
    {
      icon: <Waves className="w-5 h-5 text-[#00875A]" />,
      titleEn: "Drenching Dose",
      value: product.doseDrenching || "500 gm/Acre (500 ग्रॅम/एकर)",
    },
    {
      icon: <MapPin className="w-5 h-5 text-[#00875A]" />,
      titleEn: "Basal Dose",
      value: product.doseBasal || "Not Applicable (लागू नाही)",
    },
  ];

  const formatValue = (val: string, align: "left" | "right" = "right") => {
    if (!val || val === "माहिती उपलब्ध नाही") {
      return (
        <span className={`text-slate-400 italic text-[14px] ${align === "right" ? "text-right" : "text-left"}`}>
          माहिती उपलब्ध नाही
        </span>
      );
    }

    if (val === "Not Applicable (लागू नाही)") {
      return (
        <div className={`leading-snug ${align === "right" ? "text-right" : "text-left"}`}>
          <span className="text-slate-800 font-medium text-[14px]">Not Applicable </span>
          <span className="text-[#00875A] font-medium text-[13px]">(लागू नाही)</span>
        </div>
      );
    }

    // Split by parentheses to highlight the Marathi translations
    const parts = val.split(/(\([^)]+\))/g);
    
    return (
      <div className={`leading-normal text-[14px] font-medium text-slate-800 ${align === "right" ? "text-right" : "text-left"}`}>
        {parts.map((part, i) => {
          if (part.startsWith('(') && part.endsWith(')')) {
            return (
              <span key={i} className="text-[#00875A] font-medium text-[13px] mx-0.5">
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-100"
        >
          {/* Header */}
          <div className="p-6 pb-4 flex items-start gap-6 border-b border-slate-50 relative">
            {/* Product Image */}
            <div className="w-32 h-32 md:w-36 md:h-36 flex-shrink-0 bg-white rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden p-1.5 shadow-sm">
              {product.photoUrl ? (
                <img 
                  src={product.photoUrl} 
                  alt={product.brandName} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Package className="w-14 h-14 text-slate-200" />
              )}
            </div>

            {/* Product Basic Info */}
            <div className="flex-1 min-w-0 pt-1 pr-12">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                  {cleanBrandName} {marathiBrandName && <span className="text-[#00875A]">({marathiBrandName})</span>}
                </h2>
              </div>

              <div className="space-y-2 mt-3">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Company –</span>
                  <span className="text-[15px] font-bold text-[#006B3D] leading-tight">
                    {product.companyName || "माहिती उपलब्ध नाही"}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Category –</span>
                  <div className="text-[15px] font-bold leading-tight">
                    {formatValue(product.category || "माहिती उपलब्ध नाही", "left")}
                  </div>
                </div>
              </div>
            </div>



            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors z-10 border border-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Table */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm divide-y divide-slate-100">
              {infoRows.map((row, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50/40 transition-colors"
                >
                  {/* Left Side Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[#F0F9F4] flex items-center justify-center flex-shrink-0 border border-[#E1F3E9]">
                    {row.icon}
                  </div>
                  
                  {/* Title and Value */}
                  <div className="flex-1 flex justify-between items-center gap-6">
                    <div className="flex flex-col flex-shrink-0">
                      <span className="text-[14px] font-bold text-slate-800 leading-tight">
                        {row.titleEn}
                      </span>
                    </div>
                    
                    <div className="text-right max-w-[65%]">
                      {formatValue(row.value, "right")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import React, { useState, useMemo, useEffect, memo } from "react";
import { Package, Filter, Search, ChevronDown, Check, Info, Copy, Trash2, X, AlertTriangle, CheckSquare, Square } from "lucide-react";
import { translateCompositionToMarathi, translateMarathiToEnglish, formatDualDisplay, translateEnglishToMarathi, getSingleLangLabel } from "../lib/utils";
import { standardizeCompanyName } from "../lib/company-helper";
import ProductDetailsModal from "./ProductDetailsModal";
import { Product } from "../types";
import { registerBackHandler } from "../lib/backNavigation";

export interface DuplicateCandidate {
  key: string;
  brand: string;
  company: string;
  keepProduct: Product;
  removeProduct: Product;
  reason: string;
}

interface ProductListProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (index: number) => void;
  onDeleteProduct: (index: number) => void;
  onDeleteProductById?: (id: string) => Promise<void> | void;
  onDeleteAllProducts?: () => void;
  onRestoreDefaultProducts?: () => void;
  canManage?: boolean;
  isAdmin?: boolean;
  highlightedProductId?: string | null;
  language?: "mr" | "en";
}

const ALL_CATEGORIES = [
  "All",
  "Insecticide (कीटकनाशक)",
  "Fungicide (बुरशीनाशक)",
  "Herbicide (तणनाशक)",
  "Fertilizer (खत)",
  "Water Soluble Fertilizer (विद्राव्य खते)",
  "Micronutrient (सूक्ष्म अन्नद्रव्ये)",
  "Plant Growth Regulator (PGR) (संप्रेरके)",
  "Bio Fertilizer (जैविक खत)",
  "Bio Pesticide (जैविक कीटकनाशक)",
  "Seed Treatment (बीजप्रक्रिया)",
  "Seeds (बियाणे)",
  "Adjuvant / Sticker / Spreader (स्टिकर/स्प्रेडर)",
  "Organic Product (सेंद्रिय उत्पादन)",
  "Trap / Pheromone (सापळे)",
  "Nematocide (सूत्रकृमीनाशक)",
  "Rodenticide (उंदीरनाशक)",
  "Molluscicide (गोगलगायनाशक)"
];

const ALL_TYPES = [
  "Contact (स्पर्शजन्य)",
  "Systemic (अंतरप्रवाही)",
  "Contact + Systemic (स्पर्शजन्य व अंतरप्रवाही)",
  "Translaminar (ट्रान्सलॅमिनर)",
  "Stomach Poison (पोटातील विष)",
  "Fumigant (धुरीजन्य)",
  "Ovicide (अंडीनाशक)",
  "Larvicide (अळीनाशक)",
  "Adulticide (प्रौढनाशक)",
  "Growth Regulator (वाढ नियामक)",
  "Protectant (संरक्षक)",
  "Curative (निवारक)",
  "Eradicant (निर्मूलक)"
];

const ALL_PROBLEMS = [
  // Insects
  "Thrips", "Whitefly", "Jassid", "Bollworm", "Stem Borer", "Fruit Borer", "Leaf Miner", "Mealy Bug", "Aphid", "Mite", "Nematode", "Shoot Fly", "Armyworm", "Pink Bollworm", "Spodoptera", "Fall Armyworm",
  // Diseases
  "Powdery Mildew", "Downy Mildew", "Blast", "Anthracnose", "Leaf Spot", "Wilt", "Rust", "Blight", "Damping Off", "Stem Rot", "Root Rot", "Bacterial Blight", "Alternaria", "Cercospora", "Scab", "Red Rot", "Tikka", "Mosaic", "Yellow Vein Mosaic"
];

const ALL_CROPS = [
  "Cotton", "Soybean", "Sugarcane", "Rice", "Wheat", "Maize", "Tur", "Gram", "Groundnut", "Chilli", "Tomato", "Onion", "Potato", "Brinjal", "Okra", "Mango", "Grapes", "Pomegranate", "Banana", "Papaya"
];

export default memo(function ProductList({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onDeleteProductById,
  onDeleteAllProducts,
  onRestoreDefaultProducts,
  canManage = true,
  isAdmin = false,
  highlightedProductId = null,
  language = "mr"
}: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedProblem, setSelectedProblem] = useState<string>("");
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [pageSize, setPageSize] = useState(30);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    if (highlightedProductId) {
      const target = products.find(
        (p) => p.id === highlightedProductId || p.brandName === highlightedProductId
      );
      const key = target?.id || highlightedProductId;
      setExpandedProductIds((prev) => new Set(prev).add(key));
    }
  }, [highlightedProductId, products]);

  // Back button handling: dismiss product details modal when open
  useEffect(() => {
    if (selectedProductDetails) {
      return registerBackHandler(() => {
        setSelectedProductDetails(null);
        return true;
      });
    }
  }, [selectedProductDetails]);

  // Duplicate Products Review State (Admin manual tool)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [selectedDuplicatesToDelete, setSelectedDuplicatesToDelete] = useState<Set<string>>(new Set());
  const [isDeletingDuplicates, setIsDeletingDuplicates] = useState(false);

  // Back button handling: dismiss duplicate review modal when open
  useEffect(() => {
    if (showDuplicateModal) {
      return registerBackHandler(() => {
        setShowDuplicateModal(false);
        return true;
      });
    }
  }, [showDuplicateModal]);

  const handleFindDuplicates = () => {
    const exactSeenSet = new Map<string, Product>();
    const candidates: DuplicateCandidate[] = [];

    for (const p of products) {
      if (!p || !p.id || (p as any).isDeleted) continue;

      const brand = (p.brandName || p.name || "").trim().toLowerCase();
      const company = (p.companyName || "").trim().toLowerCase();

      const cleanBrand = brand.replace(/[^a-z0-9]/g, "");
      const cleanCompany = company.replace(/[^a-z0-9]/g, "");

      if (!cleanBrand && !cleanCompany) continue;

      const exactKey = `${cleanBrand}_${cleanCompany}`;

      if (exactSeenSet.has(exactKey)) {
        const existing = exactSeenSet.get(exactKey)!;
        let keep = existing;
        let remove = p;
        let reason = isEn
          ? "First encountered record retained as primary"
          : "पहिले नोंदवलेले उत्पादन मुख्य म्हणून ठेवले";

        if (existing.approvalStatus !== "approved" && p.approvalStatus === "approved") {
          keep = p;
          remove = existing;
          reason = isEn
            ? "Approved status preferred over non-approved"
            : "मंजूर (Approved) उत्पादन प्राधान्याने ठेवले";
        } else if (existing.id.startsWith("local_") && !p.id.startsWith("local_")) {
          keep = p;
          remove = existing;
          reason = isEn
            ? "Server ID preferred over temporary local ID"
            : "सर्व्हर ID असलेले उत्पादन स्थानिक तात्पुरत्या ID पेक्षा प्राधान्याने ठेवले";
        } else if (p.createdAt && existing.createdAt && new Date(p.createdAt) < new Date(existing.createdAt)) {
          keep = p;
          remove = existing;
          reason = isEn
            ? "Original/earlier creation date preferred"
            : "जुने/मूळ निर्मिती दिनांक असलेले उत्पादन प्राधान्याने ठेवले";
        }

        exactSeenSet.set(exactKey, keep);
        candidates.push({
          key: exactKey,
          brand: p.brandName || p.name || "उत्पादन",
          company: p.companyName || "कंपनी",
          keepProduct: keep,
          removeProduct: remove,
          reason,
        });
      } else {
        exactSeenSet.set(exactKey, p);
      }
    }

    if (candidates.length === 0) {
      alert(
        isEn
          ? "No duplicate products found in the catalog."
          : "कॅटलॉगमध्ये कोणतीही डुप्लिकेट उत्पादने आढळली नाहीत."
      );
      return;
    }

    setDuplicateCandidates(candidates);
    setSelectedDuplicatesToDelete(new Set()); // Require explicit user selection
    setShowDuplicateModal(true);
  };

  const toggleSelectDuplicate = (id: string) => {
    setSelectedDuplicatesToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllDuplicates = () => {
    if (selectedDuplicatesToDelete.size === duplicateCandidates.length) {
      setSelectedDuplicatesToDelete(new Set());
    } else {
      setSelectedDuplicatesToDelete(new Set(duplicateCandidates.map((c) => c.removeProduct.id)));
    }
  };

  const handleDeleteSelectedDuplicates = async () => {
    if (selectedDuplicatesToDelete.size === 0) {
      alert(
        isEn
          ? "Please select at least one duplicate product to delete."
          : "कृपया हटवण्यासाठी किमान एक डुप्लिकेट उत्पादन निवडा."
      );
      return;
    }

    const count = selectedDuplicatesToDelete.size;
    const confirmMsg = isEn
      ? `Are you sure you want to delete ${count} selected duplicate product(s)? This action cannot be undone.`
      : `तुम्हाला खात्री आहे की तुम्ही निवडलेली ${count} डुप्लिकेट उत्पादने हटवू इच्छिता? ही कृती पूर्ववत करता येणार नाही.`;

    if (!window.confirm(confirmMsg)) return;

    setIsDeletingDuplicates(true);
    try {
      const idsToDelete = Array.from(selectedDuplicatesToDelete);
      for (const id of idsToDelete) {
        if (onDeleteProductById) {
          await onDeleteProductById(id);
        } else {
          const idx = products.findIndex((p) => p.id === id);
          if (idx !== -1) onDeleteProduct(idx);
        }
      }
      alert(
        isEn
          ? `Successfully deleted ${count} duplicate product(s).`
          : `यशस्वीरित्या ${count} डुप्लिकेट उत्पादने हटवली गेली.`
      );
      setShowDuplicateModal(false);
      setDuplicateCandidates([]);
      setSelectedDuplicatesToDelete(new Set());
    } catch (err) {
      console.error("Failed to delete duplicates:", err);
      alert(
        isEn
          ? "Error deleting duplicate products."
          : "डुप्लिकेट उत्पादने हटवताना त्रुटी आली."
      );
    } finally {
      setIsDeletingDuplicates(false);
    }
  };

  const isEn = language === "en";

  // Smoothly scroll to the recently saved/highlighted product
  useEffect(() => {
    if (highlightedProductId) {
      const timer = setTimeout(() => {
        // Remove special chars for clean HTML selector id matching if any
        const cleanId = highlightedProductId.replace(/[^a-zA-Z0-9-]/g, "");
        const el = document.getElementById(`product-card-${highlightedProductId}`) || 
                   document.getElementById(`product-card-${cleanId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [highlightedProductId]);

  // Derive unique companies from current products
  const companies = useMemo(() => {
    const cos = new Set<string>();
    products.forEach((p) => {
      if (p.companyName && p.companyName.trim() !== "" && p.companyName !== "माहिती उपलब्ध नाही") {
        const stdCos = standardizeCompanyName(p.companyName);
        stdCos.forEach(c => cos.add(c));
      }
    });
    return Array.from(cos).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Admin vs normal user - normal user only sees approved
      

      // Category Match
      let matchesCategory = selectedCategory === "All";
      if (!matchesCategory && p.category) {
        matchesCategory = p.category === selectedCategory || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
      }
      if (!matchesCategory && selectedCategory !== "All") return false;

      // Type Match
      if (selectedType) {
        const typeLower = selectedType.toLowerCase();
        const modeMatch = p.modeOfAction && p.modeOfAction.toLowerCase().includes(typeLower);
        const classMatch = p.typeClassification && p.typeClassification.toLowerCase().includes(typeLower);
        if (!modeMatch && !classMatch) return false;
      }

      // Problem Match
      if (selectedProblem) {
        const probLower = selectedProblem.toLowerCase();
        const pestMatch = p.targetPests && p.targetPests.toLowerCase().includes(probLower);
        const diseaseMatch = p.targetDiseases && p.targetDiseases.toLowerCase().includes(probLower);
        if (!pestMatch && !diseaseMatch) return false;
      }

      // Crop Match
      if (selectedCrop && p.targetCrops && !p.targetCrops.toLowerCase().includes(selectedCrop.toLowerCase())) return false;

      // Company Match
      if (selectedCompany) {
        const stdCos = standardizeCompanyName(p.companyName);
        if (!stdCos.includes(selectedCompany)) return false;
      }

      // Search Match
      if (!searchTerm.trim()) return true;
      const s = searchTerm.toLowerCase().trim();
      return (
        (p.brandName || "").toLowerCase().includes(s) ||
        (p.marathiName || "").toLowerCase().includes(s) ||
        (p.companyName || "").toLowerCase().includes(s) ||
        (p.composition || "").toLowerCase().includes(s) ||
        (p.compositionEnglish || "").toLowerCase().includes(s) ||
        (p.category || "").toLowerCase().includes(s) ||
        (p.targetCrops || "").toLowerCase().includes(s) ||
        (p.targetPests || "").toLowerCase().includes(s) ||
        (p.targetDiseases || "").toLowerCase().includes(s) ||
        (p.iracCode || "").toLowerCase().includes(s) ||
        (p.fracCode || "").toLowerCase().includes(s) ||
        (p.formulation || "").toLowerCase().includes(s)
      );
    });
  }, [products, searchTerm, selectedCategory, selectedType, selectedProblem, selectedCrop, selectedCompany, canManage]);

  const pagedProducts = useMemo(() => {
    return filteredProducts.slice(0, pageSize);
  }, [filteredProducts, pageSize]);

  // Reset pagination when filters change
  useEffect(() => {
    setPageSize(30);
  }, [searchTerm, selectedCategory, selectedType, selectedProblem, selectedCrop, selectedCompany]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 mt-4 mx-4">
        <Package className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {isEn ? "Products" : "उत्पादने यादी"}
        </h2>
        <p className="text-sm text-slate-500 mb-6 text-center">
          {isEn
            ? "Product list is empty. You can register a new product."
            : "उत्पादने यादी रिकामी आहे. तुम्ही नवीन उत्पादन नोंदवू शकता."}
        </p>
        {canManage && (
          <div className="flex flex-wrap gap-2.5 justify-center">
            <button
              onClick={onAddProduct}
              className="flex items-center justify-center gap-1 text-[11px] bg-blue-100 text-blue-800 px-3.5 py-2 rounded font-bold hover:bg-blue-200 transition border border-blue-200"
            >
              {isEn ? "+ Register New Product" : "+ नवीन उत्पादन नोंदवा"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto max-w-7xl pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          {isEn ? "Products List" : "उत्पादने यादी"} ({filteredProducts.length})
        </h2>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {isAdmin && (
            <>
              <button
                onClick={handleFindDuplicates}
                className="flex items-center gap-1.5 text-[11px] bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded font-bold transition shadow-sm"
                title={isEn ? "Find Duplicate Products" : "डुप्लिकेट उत्पादने शोधा"}
              >
                <Copy className="w-3.5 h-3.5" />
                {isEn ? "Find Duplicates" : "डुप्लिकेट शोधा"}
              </button>
              {onDeleteAllProducts && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        isEn
                          ? "Are you sure you want to delete all products?"
                          : "तुम्हाला खात्री आहे की तुम्हाला सर्व उत्पादने हटवायची आहेत?"
                      )
                    ) {
                      onDeleteAllProducts();
                    }
                  }}
                  className="flex items-center gap-1 text-[11px] bg-red-600 text-white px-3 py-1.5 rounded font-bold hover:bg-red-700 transition shadow-sm"
                >
                  🗑️ {isEn ? "Delete All" : "सर्व हटवा"}
                </button>
              )}
            </>
          )}
          {canManage && (
            <button
              onClick={onAddProduct}
              className="flex items-center gap-1 text-[11px] bg-blue-600 text-white px-3 py-1.5 rounded font-bold hover:bg-blue-700 transition ml-auto sm:ml-0 shadow-sm"
            >
              + {isEn ? "Add Product" : "उत्पादन जोडा"}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isEn
                  ? "Smart search: Brand, company, molecule, pest or crop..."
                  : "स्मार्ट शोध: ब्रँड, कंपनी, मॉलिक्यूल, कीड किंवा पीक शोधा."
              }
              className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm placeholder:text-slate-400 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                title={isEn ? "Clear" : "साफ करा"}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button 
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors shrink-0 ${
              showFilters || selectedCategory !== "All" || selectedType || selectedProblem || selectedCrop || selectedCompany
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:text-blue-600 hover:border-blue-200"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {isEn ? "More Filters" : "अधिक फिल्टर्स"}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">{isEn ? "Category" : "श्रेणी"}</label>
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full text-[11px] p-1.5 border border-slate-200 rounded outline-none bg-slate-50"
              >
                {ALL_CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c === "All" ? (isEn ? "All" : "सर्व") : getSingleLangLabel(c, isEn)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">{isEn ? "Company" : "कंपनी"}</label>
              <select 
                value={selectedCompany} 
                onChange={e => setSelectedCompany(e.target.value)}
                className="w-full text-[11px] p-1.5 border border-slate-200 rounded outline-none bg-slate-50"
              >
                <option value="">{isEn ? "All Companies" : "सर्व कंपन्या"}</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">{isEn ? "Problem" : "समस्या"}</label>
              <select 
                value={selectedProblem} 
                onChange={e => setSelectedProblem(e.target.value)}
                className="w-full text-[11px] p-1.5 border border-slate-200 rounded outline-none bg-slate-50"
              >
                <option value="">{isEn ? "All Problems" : "सर्व समस्या"}</option>
                {ALL_PROBLEMS.map(c => <option key={c} value={c}>{getSingleLangLabel(c, isEn)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">{isEn ? "Crops" : "पिके"}</label>
              <select 
                value={selectedCrop} 
                onChange={e => setSelectedCrop(e.target.value)}
                className="w-full text-[11px] p-1.5 border border-slate-200 rounded outline-none bg-slate-50"
              >
                <option value="">{isEn ? "All Crops" : "सर्व पिके"}</option>
                {ALL_CROPS.map(c => <option key={c} value={c}>{getSingleLangLabel(c, isEn)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">{isEn ? "Type" : "प्रकार"}</label>
              <select 
                value={selectedType} 
                onChange={e => setSelectedType(e.target.value)}
                className="w-full text-[11px] p-1.5 border border-slate-200 rounded outline-none bg-slate-50"
              >
                <option value="">{isEn ? "All Types" : "सर्व प्रकार"}</option>
                {ALL_TYPES.map(c => <option key={c} value={c}>{getSingleLangLabel(c, isEn)}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 mt-4 text-slate-500">
          {isEn ? "No products found." : "कोणतीही उत्पादने आढळली नाहीत."}
        </div>
      ) : (
        <div className="space-y-2">
          {pagedProducts.map((product, idx) => {
            const originalIndex = products.findIndex((p) => (p.id && product.id) ? p.id === product.id : p === product);
            const productIndex = originalIndex !== -1 ? originalIndex : idx;
            const productKey = product.id || `${product.brandName || "prod"}-${productIndex}`;
            const isExpanded = expandedProductIds.has(productKey);
            const isHighlighted = highlightedProductId && (product.id === highlightedProductId || product.brandName === highlightedProductId);

            return (
              <div
                key={productKey}
                id={`product-card-${product.id || product.brandName}`}
                className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                  isHighlighted
                    ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-400 ring-opacity-50 shadow-md"
                    : "border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                {/* Collapsed Compact Row (Header) */}
                <div
                  onClick={() => toggleExpand(productKey)}
                  className="flex items-center justify-between p-3 sm:px-4 cursor-pointer select-none gap-3 hover:bg-slate-50/80 transition-colors"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleExpand(productKey);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                      <span className="text-blue-700 hover:text-blue-800 transition-colors">
                        {formatDualDisplay(
                          product.brandName?.replace(/\s?\(.*?\)/, ""),
                          product.marathiName || product.brandName?.match(/\((.*?)\)/)?.[1] || "",
                          language
                        )}
                      </span>
                    </h3>
                    {product.isNewMolecule && (
                      <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wider shrink-0">
                        {isEn ? "⭐ New" : "⭐ नवीन"}
                      </span>
                    )}
                    {isHighlighted && (
                      <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0">
                        {isEn ? "Saved" : "जतन केलेले"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Admin-only edit & delete actions */}
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProduct(productIndex);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title={isEn ? "Edit" : "संपादित करा"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const productName =
                              product.brandName || product.name || (isEn ? "this product" : "हे उत्पादन");
                            const confirmMsg = isEn
                              ? `Are you sure you want to delete "${productName}"? This action cannot be undone.`
                              : `तुम्हाला खात्री आहे की तुम्ही "${productName}" हे उत्पादन हटवू इच्छिता? ही कृती पूर्ववत करता येणार नाही.`;
                            if (window.confirm(confirmMsg)) {
                              onDeleteProduct(productIndex);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title={isEn ? "Delete" : "हटवा"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                        </button>
                      </>
                    )}

                    {/* Expand/Collapse Chevron */}
                    <div
                      className={`p-1 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-blue-600" : ""
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Inline Collapsible Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-3.5 sm:p-4 space-y-2 animate-in fade-in duration-150">
                    <p className="text-[11px] text-slate-700 flex justify-between gap-2">
                      <span className="font-bold text-slate-500 shrink-0">{isEn ? "Company –" : "कंपनी –"}</span>
                      <span className="font-medium text-right">{product.companyName}</span>
                    </p>
                    
                    <p className="text-[11px] text-slate-700 flex justify-between gap-2">
                      <span className="font-bold text-slate-500 shrink-0">{isEn ? "Category –" : "श्रेणी –"}</span>
                      <span className="font-medium text-right">{getSingleLangLabel(product.category, isEn)}</span>
                    </p>

                    {product.modeOfAction && (
                      <p className="text-[11px] text-slate-700 flex justify-between gap-2">
                        <span className="font-bold text-slate-500 shrink-0">{isEn ? "Mode of Action –" : "कृती पद्धत –"}</span>
                        <span className="font-medium text-right">{getSingleLangLabel(product.modeOfAction, isEn)}</span>
                      </p>
                    )}

                    {product.composition && (
                      <div className="pt-1.5 border-t border-slate-200/60">
                        <p className="text-[11px] font-bold text-emerald-700 mb-0.5">{isEn ? "Composition –" : "घटक –"}</p>
                        <p className="text-[11px] text-emerald-800 font-medium leading-tight">
                          {isEn ? product.composition : translateCompositionToMarathi(product.composition)}
                        </p>
                      </div>
                    )}

                    {product.targetCrops && (
                      <p className="text-[11px] text-slate-700 leading-tight">
                        <span className="font-bold text-slate-500">{isEn ? "Recommended Crops –" : "शिफारस पिके –"}</span> {product.targetCrops}
                      </p>
                    )}

                    {(product.targetPests || product.targetDiseases) && (
                      <p className="text-[11px] text-slate-700 leading-tight">
                        <span className="font-bold text-slate-500">{isEn ? "Target Pest / Disease –" : "कीड / रोग नियंत्रण –"}</span> {product.targetPests || product.targetDiseases}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1.5 border-t border-slate-200/60">
                      {product.doseSpray && (
                        <p className="text-[11px] text-slate-700">
                          <span className="font-bold text-slate-500 block">{isEn ? "Spray Dose –" : "फवारणी मात्रा –"}</span> {product.doseSpray}
                        </p>
                      )}
                      {product.doseDrip && (
                        <p className="text-[11px] text-slate-700">
                          <span className="font-bold text-slate-500 block">{isEn ? "Drip Dose –" : "ठिबक मात्रा –"}</span> {product.doseDrip}
                        </p>
                      )}
                      {product.doseDrenching && (
                        <p className="text-[11px] text-slate-700">
                          <span className="font-bold text-slate-500 block">{isEn ? "Drenching Dose –" : "आळवणी मात्रा –"}</span> {product.doseDrenching}
                        </p>
                      )}
                      {product.doseBasal && (
                        <p className="text-[11px] text-slate-700">
                          <span className="font-bold text-slate-500 block">{isEn ? "Basal Dose –" : "जमिनीत देण्याची मात्रा –"}</span> {product.doseBasal}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filteredProducts.length > pageSize && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setPageSize(prev => prev + 50)}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-black text-xs rounded-xl shadow-sm hover:bg-slate-50 transition-colors uppercase tracking-widest"
          >
            {isEn ? "Show More Products" : "आणखी उत्पादने पहा"}
          </button>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProductDetails && (
        <ProductDetailsModal 
          product={selectedProductDetails}
          isOpen={!!selectedProductDetails}
          onClose={() => setSelectedProductDetails(null)}
        />
      )}

      {/* Duplicate Products Review Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {isEn ? "Duplicate Products Review" : "डुप्लिकेट उत्पादने पडताळणी"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {duplicateCandidates.length}{" "}
                    {isEn ? "potential duplicate pair(s) detected" : "संभाव्य डुप्लिकेट जोड्या आढळल्या"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner & Selection Toolbar */}
            <div className="p-3 bg-amber-50 border-b border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-800 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {isEn
                    ? "Automatic deletion is disabled. Review each product below and select which duplicates to delete."
                    : "आपोआप हटवणे बंद केले आहे. खालील यादी तपासून ज्या नोंदी हटवायच्या आहेत त्या निवडा."}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllDuplicates}
                  className="px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition text-[11px]"
                >
                  {selectedDuplicatesToDelete.size === duplicateCandidates.length
                    ? (isEn ? "Deselect All" : "सर्व निवड रद्द करा")
                    : (isEn ? "Select All" : "सर्व निवडा")}
                </button>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded">
                  {selectedDuplicatesToDelete.size} / {duplicateCandidates.length} {isEn ? "selected" : "निवडले"}
                </span>
              </div>
            </div>

            {/* Candidate List */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {duplicateCandidates.map((candidate, idx) => {
                const isSelected = selectedDuplicatesToDelete.has(candidate.removeProduct.id);
                return (
                  <div
                    key={`${candidate.key}-${idx}`}
                    className={`rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-rose-300 bg-rose-50/40 shadow-sm"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {/* Header: Brand & Company */}
                    <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">
                          {candidate.brand}
                        </span>
                        <span className="text-slate-500 font-medium">
                          ({candidate.company})
                        </span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        💡 {candidate.reason}
                      </span>
                    </div>

                    {/* Comparison Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                      {/* Product to Keep */}
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-1.5 py-0.5 rounded">
                            ✅ {isEn ? "Keep (Primary)" : "ठेवणार (मुख्य)"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {candidate.keepProduct.id.slice(0, 10)}...
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs mt-1">
                          {candidate.keepProduct.brandName || candidate.keepProduct.name}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {isEn ? "Company:" : "कंपनी:"} {candidate.keepProduct.companyName || "N/A"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {isEn ? "Category:" : "प्रवर्ग:"} {candidate.keepProduct.category || "N/A"}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                          <span className="capitalize">
                            {isEn ? "Status:" : "स्थिती:"} {candidate.keepProduct.approvalStatus || "pending"}
                          </span>
                          {candidate.keepProduct.createdAt && (
                            <span>
                              • {new Date(candidate.keepProduct.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product to Remove */}
                      <div className={`rounded-lg border p-2.5 space-y-1 transition ${
                        isSelected
                          ? "border-rose-400 bg-rose-50"
                          : "border-slate-200 bg-slate-50"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider bg-rose-100 px-1.5 py-0.5 rounded">
                            🗑️ {isEn ? "Suggested to Remove" : "हटवण्यासाठी सुचवलेले"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {candidate.removeProduct.id.slice(0, 10)}...
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs mt-1">
                          {candidate.removeProduct.brandName || candidate.removeProduct.name}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {isEn ? "Company:" : "कंपनी:"} {candidate.removeProduct.companyName || "N/A"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {isEn ? "Category:" : "प्रवर्ग:"} {candidate.removeProduct.category || "N/A"}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                          <span className="capitalize">
                            {isEn ? "Status:" : "स्थिती:"} {candidate.removeProduct.approvalStatus || "pending"}
                          </span>
                          {candidate.removeProduct.createdAt && (
                            <span>
                              • {new Date(candidate.removeProduct.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Explicit Confirmation Checkbox */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => toggleSelectDuplicate(candidate.removeProduct.id)}
                            className={`w-full flex items-center justify-center gap-2 p-1.5 rounded-lg border font-bold text-xs transition ${
                              isSelected
                                ? "bg-rose-600 text-white border-rose-600"
                                : "bg-white text-slate-700 border-slate-300 hover:border-rose-400"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <CheckSquare className="w-4 h-4" />
                                {isEn ? "Marked for Deletion" : "हटवण्यासाठी निवडले आहे"}
                              </>
                            ) : (
                              <>
                                <Square className="w-4 h-4 text-slate-400" />
                                {isEn ? "Select to Delete" : "हटवण्यासाठी निवडा"}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                disabled={isDeletingDuplicates}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
              >
                {isEn ? "Cancel" : "रद्द करा"}
              </button>

              <button
                type="button"
                onClick={handleDeleteSelectedDuplicates}
                disabled={selectedDuplicatesToDelete.size === 0 || isDeletingDuplicates}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition ${
                  selectedDuplicatesToDelete.size === 0 || isDeletingDuplicates
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {isDeletingDuplicates
                  ? (isEn ? "Deleting..." : "हटवत आहे...")
                  : (isEn
                      ? `Delete Selected (${selectedDuplicatesToDelete.size})`
                      : `निवडलेले हटवा (${selectedDuplicatesToDelete.size})`)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

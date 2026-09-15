import React, { useState, useMemo, useEffect, memo } from "react";
import { Package, Filter, Search, ChevronDown, Check, Info } from "lucide-react";
import { translateCompositionToMarathi, translateMarathiToEnglish, formatDualDisplay, translateEnglishToMarathi } from "../lib/utils";
import { standardizeCompanyName } from "../lib/company-helper";
import ProductDetailsModal from "./ProductDetailsModal";
import { Product } from "../types";

interface ProductListProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (index: number) => void;
  onDeleteProduct: (index: number) => void;
  onDeleteAllProducts?: () => void;
  onRestoreDefaultProducts?: () => void;
  canManage?: boolean;
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
  onDeleteAllProducts,
  onRestoreDefaultProducts,
  canManage = true,
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
          उत्पादने यादी (Products)
        </h2>
        <p className="text-sm text-slate-500 mb-6 text-center">उत्पादने यादी रिकामी आहे. तुम्ही नवीन उत्पादन नोंदवू शकता.</p>
        {canManage && (
          <div className="flex flex-wrap gap-2.5 justify-center">
            <button
              onClick={onAddProduct}
              className="flex items-center justify-center gap-1 text-[11px] bg-blue-100 text-blue-800 px-3.5 py-2 rounded font-bold hover:bg-blue-200 transition border border-blue-200"
            >
              + नवीन उत्पादन नोंदवा
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
          उत्पादने यादी (Products List) ({filteredProducts.length})
        </h2>
        
        {canManage && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {onDeleteAllProducts && (
              <button
                onClick={() => {
                  if (window.confirm("तुम्हाला खात्री आहे की तुम्हाला सर्व उत्पादने हटवायची आहेत?")) {
                    onDeleteAllProducts();
                  }
                }}
                className="flex items-center gap-1 text-[11px] bg-red-600 text-white px-3 py-1.5 rounded font-bold hover:bg-red-700 transition shadow-sm"
              >
                🗑️ सर्व हटवा
              </button>
            )}
            <button
              onClick={onAddProduct}
              className="flex items-center gap-1 text-[11px] bg-blue-600 text-white px-3 py-1.5 rounded font-bold hover:bg-blue-700 transition ml-auto sm:ml-0 shadow-sm"
            >
              + उत्पादन जोडा
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-4 space-y-3">
        {/* 
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="स्मार्ट शोध: ब्रँड, कंपनी, मॉलिक्यूल, कीड किंवा पीक शोधा..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-none shadow-sm placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              Clear
            </button>
          )}
        </div>
        */}

        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <Filter className="w-3.5 h-3.5" />
          अधिक फिल्टर्स (Filters) {showFilters ? <ChevronDown className="w-3.5 h-3.5 rotate-180" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Category (श्रेणी)</label>
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full text-[11px] p-1.5 border border-slate-200 rounded outline-none bg-slate-50"
              >
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Company</label>
              <select 
                value={selectedCompany} 
                onChange={e => setSelectedCompany(e.target.value)}
                className="w-full text-[11px] p-1.5 border border-slate-200 rounded outline-none bg-slate-50"
              >
                <option value="">सर्व कंपन्या</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Problem (समस्या)</label>
              <select 
                value={selectedProblem} 
                onChange={e => setSelectedProblem(e.target.value)}
                className="w-full text-[11px] p-1.5 border border-slate-200 rounded outline-none bg-slate-50"
              >
                <option value="">सर्व समस्या</option>
                {ALL_PROBLEMS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Crops (पिके)</label>
              <select 
                value={selectedCrop} 
                onChange={e => setSelectedCrop(e.target.value)}
                className="w-full text-[11px] p-1.5 border border-slate-200 rounded outline-none bg-slate-50"
              >
                <option value="">All Crops</option>
                {ALL_CROPS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Type</label>
              <select 
                value={selectedType} 
                onChange={e => setSelectedType(e.target.value)}
                className="w-full text-[11px] p-1.5 border border-slate-200 rounded outline-none bg-slate-50"
              >
                <option value="">सर्व प्रकार</option>
                {ALL_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 mt-4 text-slate-500">
          कोणतीही उत्पादने आढळली नाहीत.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagedProducts.map((product, idx) => {
            const originalIndex = products.findIndex((p) => p === product);
            const isVerified = product.status === "verified" || product.status === "live" || product.approvalStatus === "approved";
            const isPending = false;
            const isHighlighted = highlightedProductId && (product.id === highlightedProductId || product.brandName === highlightedProductId);

            return (
              <div
                key={idx}
                id={`product-card-${product.id || product.brandName}`}
                className={`bg-white p-4 rounded-xl border transition-all duration-500 relative overflow-hidden ${
                  isHighlighted
                    ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-400 ring-opacity-50 shadow-md scale-[1.01] z-10"
                    : isPending
                    ? "border-amber-200 bg-amber-50/20 shadow-sm"
                    : "border-slate-200 shadow-sm"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg shadow-sm flex items-center gap-0.5 animate-pulse">
                    जतन केलेले
                  </div>
                )}
                


                <div className="flex justify-between items-start mb-2 mt-1">
                  <button 
                    onClick={() => setSelectedProductDetails(product)}
                    className="text-left group flex-1 pr-2"
                  >
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 flex-wrap">
                      <span className="text-blue-700 group-hover:text-blue-800 group-hover:underline underline-offset-2 transition-all">
                        {formatDualDisplay(product.brandName?.replace(/\s?\(.*?\)/, ""), product.marathiName || product.brandName?.match(/\((.*?)\)/)?.[1] || "")}
                      </span>
                      {product.isNewMolecule && (
                        <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wider leading-none shadow-sm h-3.5">
                          ⭐ नवीन (New)
                        </span>
                      )}
                    </h3>
                  </button>
                  
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      {isPending && (
                        <button
                          onClick={() => onEditProduct(originalIndex)}
                          className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded hover:bg-amber-200 transition-colors"
                          title="Verify / Approve"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => onEditProduct(originalIndex)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors border border-transparent hover:border-blue-100"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                      </button>
                      <button
                        onClick={() => onDeleteProduct(originalIndex)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors border border-transparent hover:border-red-100"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-2 space-y-1.5">
                  <p className="text-[10px] text-slate-700 flex justify-between gap-2">
                    <span className="font-bold text-slate-500 shrink-0">Company –</span>
                    <span className="font-medium text-right">{product.companyName}</span>
                  </p>
                  
                  <p className="text-[10px] text-slate-700 flex justify-between gap-2">
                    <span className="font-bold text-slate-500 shrink-0">Category –</span>
                    <span className="font-medium text-right">{product.category}</span>
                  </p>

                  {product.modeOfAction && (
                    <p className="text-[10px] text-slate-700 flex justify-between gap-2">
                      <span className="font-bold text-slate-500 shrink-0">Mode of Action –</span>
                      <span className="font-medium text-right">{product.modeOfAction}</span>
                    </p>
                  )}

                  {product.composition && (
                    <div className="pt-1.5 border-t border-slate-50">
                      <p className="text-[10px] font-bold text-emerald-700 mb-0.5">Composition –</p>
                      <p className="text-[10px] text-emerald-800 font-medium leading-tight">
                        {product.composition}
                      </p>
                    </div>
                  )}

                  {product.targetCrops && (
                    <p className="text-[10px] text-slate-700 leading-tight">
                      <span className="font-bold text-slate-500">Recommended Crops –</span> {product.targetCrops}
                    </p>
                  )}

                  {(product.targetPests || product.targetDiseases) && (
                    <p className="text-[10px] text-slate-700 leading-tight">
                      <span className="font-bold text-slate-500">Target Pest / Disease –</span> {product.targetPests || product.targetDiseases}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1.5 border-t border-slate-50">
                    {product.doseSpray && (
                      <p className="text-[10px] text-slate-700">
                        <span className="font-bold text-slate-500 block">Spray Dose –</span> {product.doseSpray}
                      </p>
                    )}
                    {product.doseDrip && (
                      <p className="text-[10px] text-slate-700">
                        <span className="font-bold text-slate-500 block">Drip Dose –</span> {product.doseDrip}
                      </p>
                    )}
                    {product.doseDrenching && (
                      <p className="text-[10px] text-slate-700">
                        <span className="font-bold text-slate-500 block">Drenching Dose –</span> {product.doseDrenching}
                      </p>
                    )}
                    {product.doseBasal && (
                      <p className="text-[10px] text-slate-700">
                        <span className="font-bold text-slate-500 block">Basal Dose –</span> {product.doseBasal}
                      </p>
                    )}
                  </div>
                </div>
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
            आणखी उत्पादने पहा (Show More Products)
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
    </div>
  );
});

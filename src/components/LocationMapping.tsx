import React, { useState, useMemo, useEffect } from "react";
import { 
  MapPin, 
  Search, 
  Plus, 
  X, 
  ChevronRight, 
  MapPinned, 
  Filter,
  Download,
  Trash2,
  Edit2,
  Phone,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Layout,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Database,
  Settings2,
  ChevronDown,
  Layers,
  Home,
  Users,
  Store
} from "lucide-react";
import { useMasterLocations } from "../hooks/useMasterLocations";
import { Dealer } from "../types";
import { COMPANY_NAME, COMPANY_INITIALS, COMPANY_ADDRESS, COMPANY_PHONE } from "../lib/config";
import { getVillagesForTaluka } from "../lib/maharashtra-locations";

interface LocationMappingProps {
  onBack?: () => void;
  language?: "mr" | "en";
  dealers: Dealer[];
  onDeleteDealer?: (id: string) => Promise<any>;
  onNavigateToDealers?: () => void;
}

export default function LocationMapping({ onBack, language = "mr", dealers, onDeleteDealer, onNavigateToDealers }: LocationMappingProps) {
  const isEn = language === "en";
  const { 
    locations, 
    loading, 
    addLocations, 
    fetchLocations, 
    deleteLocation, 
    getStates,
    getDistricts,
    getTalukas,
  } = useMasterLocations();

  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [selectedDistrict, setSelectedDistrict] = useState("Sangli");
  const [selectedTaluka, setSelectedTaluka] = useState(() => {
    if (dealers && dealers.length > 0 && dealers[0].taluka) {
      return dealers[0].taluka;
    }
    return "Miraj";
  });
  const [selectedVillage, setSelectedVillage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "mapped" | "pending">("all");
  
  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'village', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10000;

  const [showAddModal, setShowAddModal] = useState(false);
  const [isBulkAdd, setIsBulkAdd] = useState(false);
  const [bulkVillageList, setBulkVillageList] = useState("");
  const [isCustomTaluka, setIsCustomTaluka] = useState(false);
  const [customTalukaName, setCustomTalukaName] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const states = useMemo(() => getStates(), [getStates]);
  const districts = useMemo(() => selectedState ? getDistricts(selectedState) : [], [selectedState, getDistricts]);
  const talukas = useMemo(() => selectedDistrict ? getTalukas(selectedDistrict) : [], [selectedDistrict, getTalukas]);
  const villages = useMemo(() => {
    const list = locations.map(l => l.village).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [locations]);

  const currentTaluka = isCustomTaluka ? customTalukaName : selectedTaluka;

  // Load locations when filters change
  useEffect(() => {
    if (selectedState && selectedDistrict) {
      // If taluka is selected, fetch for taluka. Otherwise fetch for district.
      fetchLocations({ 
        state: selectedState, 
        district: selectedDistrict, 
        taluka: currentTaluka || undefined 
      });
    }
  }, [selectedState, selectedDistrict, currentTaluka, fetchLocations]);

  // Dealer Auto Mapping Logic (Flexible matching)
  const mappedData = useMemo(() => {
    // Only consider dealers in the currently selected taluka if currentTaluka is selected,
    // otherwise use all dealers.
    const relevantDealers = (dealers || []).filter(d => {
      if (!d) return false;
      if (!currentTaluka) return true;
      const dTalNorm = (d.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      const lTalNorm = currentTaluka.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      return dTalNorm === lTalNorm || dTalNorm.includes(lTalNorm) || lTalNorm.includes(dTalNorm);
    });

    // Combine locations from master database and dealers to ensure no missing data
    const uniqueLocationsMap: Record<string, any> = {};
    const normStr = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    
    // First, add all master locations for this taluka/district
    (locations || []).forEach(loc => {
       if (!loc) return;
       const key = `${normStr(loc.district)}_${normStr(loc.taluka)}_${normStr(loc.village)}`;
       if (!uniqueLocationsMap[key]) {
         uniqueLocationsMap[key] = {
           id: loc.id || key,
           villageCode: loc.villageCode || key,
           state: loc.state || "Maharashtra",
           district: loc.district,
           taluka: loc.taluka,
           village: loc.village,
           villageMarathi: loc.villageMarathi,
           updatedAt: loc.updatedAt || Date.now()
         };
       }
    });

    // Then, add any extra locations that might only exist in dealers data
    (dealers || []).forEach(d => {
       if (!d) return;
       const key = `${normStr(d.district)}_${normStr(d.taluka)}_${normStr(d.village)}`;
       if (!uniqueLocationsMap[key] && key !== "__") {
         uniqueLocationsMap[key] = {
           id: d.villageCode || key,
           villageCode: d.villageCode || key,
           state: d.state || "Maharashtra",
           district: d.district,
           taluka: d.taluka,
           village: d.village,
           updatedAt: d.updatedAt || Date.now()
         };
       }
    });
    const locationsFromDealers = Object.values(uniqueLocationsMap);
    
    const relevantLocations = locationsFromDealers.filter(loc => {
      if (!currentTaluka) return true;
      const locTalNorm = (loc.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      const currTalNorm = currentTaluka.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      return locTalNorm === currTalNorm || locTalNorm.includes(currTalNorm) || currTalNorm.includes(locTalNorm);
    });

    const grouped = relevantLocations.map((loc) => {
      const lVilNorm = (loc.village || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      const lVilMarNorm = (loc.villageMarathi || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      
      const villageDealers = relevantDealers.filter(d => {
        // Must match State, District, Taluka exactly (normalized) to avoid cross-taluka false matches
        const dStateNorm = (d.state || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const lStateNorm = (loc.state || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        if (dStateNorm && lStateNorm && dStateNorm !== lStateNorm) return false;

        const dDistNorm = (d.district || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const lDistNorm = (loc.district || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        if (dDistNorm && lDistNorm && dDistNorm !== lDistNorm) return false;

        const dTalNorm = (d.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const lTalNorm = (loc.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        if (dTalNorm && lTalNorm && dTalNorm !== lTalNorm && !dTalNorm.includes(lTalNorm) && !lTalNorm.includes(dTalNorm)) return false;

        const dVilNorm = (d.village || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        if (!dVilNorm) return false;
        
        // Exact matches
        if (dVilNorm === lVilNorm) return true;
        if (lVilMarNorm && dVilNorm === lVilMarNorm) return true;
        
        // Code match fallback
        if (d.villageCode && loc.villageCode && d.villageCode === loc.villageCode) return true;
        
        // Substring matches as fallback for slightly different spellings
        if (dVilNorm.length > 4 && lVilNorm.length > 4) {
          // If the length difference is greater than 3, they are likely different villages (e.g., Balvadi vs Balvadi Bhalvani)
          if (Math.abs(dVilNorm.length - lVilNorm.length) <= 3) {
            if (dVilNorm.includes(lVilNorm) || lVilNorm.includes(dVilNorm)) {
              // ONLY allow substring fallback if there is NO location in the entire list that matches this dealer EXACTLY
              const hasExactMatchInLocations = relevantLocations.some(otherLoc => {
                const otherLVilNorm = (otherLoc.village || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
                const otherLVilMarNorm = (otherLoc.villageMarathi || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
                
                if (dVilNorm === otherLVilNorm) return true;
                if (otherLVilMarNorm && dVilNorm === otherLVilMarNorm) return true;
                if (d.villageCode && otherLoc.villageCode && d.villageCode === otherLoc.villageCode) return true;
                return false;
              });
              
              if (!hasExactMatchInLocations) {
                return true;
              }
            }
          }
        }
        
        return false;
      });

      return {
        ...loc,
        villageDealers,
        status: villageDealers.length > 0 ? "mapped" : "pending",
        updatedAt: villageDealers.length > 0 ? Math.max(...villageDealers.map(d => d.updatedAt || 0)) : loc.updatedAt
      };
    });

    let filtered = grouped;

    // Apply Status Filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(row => row.status === statusFilter);
    }
    
    // Filter by village
    if (selectedVillage) {
      filtered = filtered.filter(v => v.village.toLowerCase() === selectedVillage.toLowerCase());
    }

    // Unified Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(row => 
        row.village.toLowerCase().includes(query) ||
        (row.villageMarathi && row.villageMarathi.toLowerCase().includes(query)) ||
        row.taluka.toLowerCase().includes(query) ||
        row.district.toLowerCase().includes(query) ||
        row.state.toLowerCase().includes(query) ||
        row.villageDealers.some((d: any) => 
          d.name.toLowerCase().includes(query) || 
          d.shopName.toLowerCase().includes(query) || 
          d.mobile.includes(query)
        )
      );
    }

    // Apply Sorting
    filtered.sort((a: any, b: any) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (sortConfig.key === 'shopName') {
        valA = a.villageDealers.length > 0 ? a.villageDealers[0].shopName : '';
        valB = b.villageDealers.length > 0 ? b.villageDealers[0].shopName : '';
      } else if (sortConfig.key === 'proprietor') {
        valA = a.villageDealers.length > 0 ? a.villageDealers[0].name : '';
        valB = b.villageDealers.length > 0 ? b.villageDealers[0].name : '';
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [currentTaluka, dealers, searchQuery, statusFilter, selectedVillage, sortConfig, locations]);

  const totalPages = Math.ceil(mappedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return mappedData.slice(start, start + itemsPerPage);
  }, [mappedData, currentPage, itemsPerPage]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: mappedData.length,
      mapped: mappedData.filter(l => l.status === 'mapped').length,
      dealers: dealers.filter(d => d.district === selectedDistrict && (!currentTaluka || d.taluka === currentTaluka)).length
    };
  }, [mappedData, dealers, selectedDistrict, currentTaluka]);

  const handleExport = () => {
    if (mappedData.length === 0) return;
    const flatData = mappedData.flatMap((row, idx) => {
      if (row.villageDealers.length === 0) {
        return [{
          "Sr No": (idx + 1).toString(),
          "Taluka": row.taluka,
          "Village": row.village,
          "Marathi Name": row.villageMarathi || "-",
          "District": row.district,
          "State": row.state,
          "Status": "Pending",
          "Dealer ID": "-",
          "Dealer Name": "-",
          "Shop Name": "-",
          "Mobile": "-",
          "Last Updated": row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "-"
        }];
      }
      
      return row.villageDealers.map((d: any, dIdx: number) => ({
        "Sr No": dIdx === 0 ? (idx + 1).toString() : "",
        "Taluka": row.taluka,
        "Village": row.village,
        "Marathi Name": row.villageMarathi || "-",
        "District": row.district,
        "State": row.state,
        "Status": "Mapped",
        "Dealer ID": d.dealerCode || d.id,
        "Dealer Name": d.name,
        "Shop Name": d.shopName,
        "Mobile": d.mobile,
        "Last Updated": d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : "-"
      }));
    });
    
    const headers = Object.keys(flatData[0]);
    const csvContent = [
      headers.join(','),
      ...flatData.map(row => headers.map(h => `"${(row as any)[h] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `locations_${currentTaluka || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddVillage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isBulkAdd) {
      if (!bulkVillageList.trim()) return;
      
      const names = bulkVillageList
        .split(/[\n,]+/)
        .map(v => v.trim())
        .filter(v => v.length > 0);
      
      if (names.length === 0) return;
      
      setIsSyncing(true);
      try {
        const existingVillages = new Set(locations.map(l => l.village.toLowerCase().trim()));
        const newVillages = names
          .filter(v => !existingVillages.has(v.toLowerCase().trim()))
          .map(v => ({
            village: v,
            villageMarathi: '',
            taluka: currentTaluka || selectedTaluka,
            district: selectedDistrict,
            state: selectedState
          }));
        
        if (newVillages.length > 0) {
          await addLocations(newVillages);
          
          // Re-fetch locations to show them immediately
          fetchLocations({ 
            state: selectedState, 
            district: selectedDistrict, 
            taluka: currentTaluka 
          });

          alert(isEn ? `Successfully added ${newVillages.length} villages!` : `${newVillages.length} गावे यशस्वीरित्या जोडली!`);
        } else {
          alert(isEn ? "All villages already exist!" : "ही सर्व गावे आधीच अस्तित्वात आहेत!");
        }
        setShowAddModal(false);
        setBulkVillageList("");
      } catch (error) {
        console.error("Bulk add error:", error);
        alert(isEn ? "Failed to add villages" : "गावे जोडण्यात त्रुटी");
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    const fd = new FormData(e.currentTarget);
    const vName = fd.get("village") as string;
    const vNameMar = fd.get("villageMarathi") as string;
    
    if (!vName) return;

    // Duplicate Check
    const isDuplicate = locations.some(l => 
      l.village.toLowerCase().trim() === vName.toLowerCase().trim() && 
      l.taluka === (currentTaluka || selectedTaluka)
    );

    if (isDuplicate) {
      alert(isEn ? "Village already exists in this taluka!" : "या तालुक्यात हे गाव आधीच अस्तित्वात आहे!");
      return;
    }
    
    try {
      await addLocations([{
        village: vName,
        villageMarathi: vNameMar,
        taluka: currentTaluka || selectedTaluka,
        district: selectedDistrict,
        state: selectedState
      }]);
      setShowAddModal(false);
    } catch (error) {
      console.error("Failed to add village:", error);
      alert(isEn ? "Failed to add village" : "गाव जोडण्यात त्रुटी");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-3 py-1.5 shrink-0 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {onBack && (
              <button 
                onClick={onBack}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shadow-sm shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-sm font-black text-slate-900 tracking-tight truncate">Location Mapping</h1>
                <div className="flex items-center gap-0.5 shrink-0 print:hidden">
                  <button 
                    onClick={handleExport}
                    disabled={mappedData.length === 0}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                    title="Export CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    className="p-1 flex items-center gap-1 text-slate-500 hover:bg-slate-100 rounded-md transition-colors text-xs font-bold"
                    title="Print / PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              </div>
          </div>
          
          <div className="flex items-center gap-1 print:hidden">
            <button 
              onClick={() => setShowAddModal(true)}
              disabled={!currentTaluka}
              className="p-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white px-2 py-1.5 no-print shrink-0 z-20 border-b border-slate-200 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {/* State Select */}
            <div className="relative">
              <select 
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict("");
                  setSelectedTaluka("");
                  setSelectedVillage("");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-600 appearance-none h-8"
              >
                <option value="">State / राज्य</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {/* District Select */}
            <div className="relative">
              <select 
                value={selectedDistrict}
                disabled={!selectedState}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedTaluka("");
                  setSelectedVillage("");
                  setIsCustomTaluka(false);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-600 appearance-none disabled:opacity-50 h-8"
              >
                <option value="">District / जिल्हा</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Taluka Select */}
            {!isCustomTaluka ? (
              <div className="relative">
                <select 
                  value={selectedTaluka}
                  disabled={!selectedDistrict}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomTaluka(true);
                      setSelectedTaluka("");
                    } else {
                      setSelectedTaluka(e.target.value);
                    }
                    setSelectedVillage("");
                    setSearchQuery("");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-600 appearance-none disabled:opacity-50 h-8"
                >
                  <option value="">Taluka / तालुका</option>
                  {talukas.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="custom" className="font-bold text-indigo-600">+ Add</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            ) : (
              <div className="flex gap-1 h-8">
                <input
                  autoFocus
                  type="text"
                  value={customTalukaName}
                  onChange={(e) => setCustomTalukaName(e.target.value)}
                  placeholder="Taluka Name"
                  className="w-full bg-white border border-indigo-600 rounded-md px-2 py-1 text-[11px] font-bold text-slate-900 outline-none"
                />
                <button onClick={() => { setIsCustomTaluka(false); setCustomTalukaName(""); }} className="px-1.5 bg-slate-100 rounded-md border border-slate-200">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Village Select */}
            <div className="relative">
              <select 
                value={selectedVillage}
                disabled={!selectedTaluka && !isCustomTaluka}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-600 appearance-none disabled:opacity-50 h-8"
              >
                <option value="">Village / गाव</option>
                {villages.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2 py-1.5 border border-slate-200 bg-slate-50 rounded-md text-[11px] font-bold outline-none focus:ring-1 focus:ring-indigo-600 w-full h-8"
              />
            </div>
            
            <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200 h-8">
              <button 
                onClick={() => setStatusFilter("all")}
                className={`px-2 h-full rounded text-[9px] font-black transition-all ${statusFilter === "all" ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500'}`}
              >
                ALL
              </button>
              <button 
                onClick={() => setStatusFilter("mapped")}
                className={`px-2 h-full rounded text-[9px] font-black transition-all flex items-center gap-1 ${statusFilter === "mapped" ? 'bg-white text-green-700 shadow-sm border border-slate-200' : 'text-slate-500'}`}
              >
                MAPPED
              </button>
              <button 
                onClick={() => setStatusFilter("pending")}
                className={`px-2 h-full rounded text-[9px] font-black transition-all flex items-center gap-1 ${statusFilter === "pending" ? 'bg-white text-orange-700 shadow-sm border border-slate-200' : 'text-slate-500'}`}
              >
                PENDING
              </button>
            </div>

            <button 
              onClick={() => {
                setSelectedState("Maharashtra");
                setSelectedDistrict("");
                setSelectedTaluka("");
                setSelectedVillage("");
                setSearchQuery("");
                setStatusFilter("all");
                fetchLocations({
                   state: "Maharashtra",
                   district: "",
                   taluka: undefined
                });
              }}
              className="p-2 bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 transition-colors h-8"
              title="Reset Filters & Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <main className="flex-1 flex flex-col min-h-0 bg-slate-50 p-2 lg:p-4 no-print">
        {/* Selected Location Summary Label */}
        <div className="mb-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-4 text-[10px] font-bold text-indigo-700 uppercase tracking-widest shadow-sm">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            <span>Taluka: <span className="text-indigo-900">{currentTaluka || "All"}</span></span>
          </div>
          <div className="w-1 h-1 bg-indigo-200 rounded-full"></div>
          <div>
            <span>District: <span className="text-indigo-900">{selectedDistrict || "All"}</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[10px] text-slate-700 uppercase bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 w-10 text-center font-bold">Sr</th>
                  <th className="px-2 py-2 font-bold">
                    <button onClick={() => handleSort('village')} className="flex items-center gap-1 hover:text-indigo-600 transition-colors uppercase font-bold w-full">
                      Village
                    </button>
                  </th>
                  <th className="px-2 py-2 font-bold">Dealer</th>
                  <th className="px-2 py-2 font-bold text-center">Status</th>
                  <th className="px-2 py-2 font-bold text-center w-10">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && mappedData.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="py-10 text-center flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin mb-3"></div>
                        <h3 className="text-sm font-bold text-slate-800">माहिती लोड होत आहे...</h3>
                        <p className="text-slate-500 text-[10px] mt-0.5">Please wait, loading locations.</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="py-10 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-200">
                          <Search className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No Matches Found</h3>
                        <p className="text-slate-500 text-[10px] mt-0.5">Try adjusting filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => {
                    const hasDealers = row.villageDealers.length > 0;
                    return (
                      <tr 
                        key={row.id} 
                        className={`hover:bg-slate-50 transition-colors ${hasDealers ? 'bg-indigo-50/30' : 'bg-white'}`}
                      >
                        <td className="px-2 py-1 text-center font-bold text-slate-500 border-r border-slate-100 text-[10px]">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="px-2 py-1 border-r border-slate-100 align-top">
                          <div className="font-bold text-slate-800 text-[11px] leading-tight">{row.village}</div>
                          {row.villageMarathi && row.villageMarathi !== row.village && (
                            <div className="text-[8px] text-slate-500 mt-0 leading-none">{row.villageMarathi}</div>
                          )}
                        </td>
                        <td className="px-2 py-1 min-w-[160px] border-r border-slate-100 align-top">
                          {hasDealers ? (
                            <div className="flex flex-col gap-1.5 py-0.5">
                              {row.villageDealers.map((d: any, dIdx: number) => (
                                <div key={d.id} className="flex items-start justify-between gap-1 group/dealer">
                                  <div className="flex items-start gap-1 min-w-0">
                                    <span className="text-[8px] font-black text-indigo-400 shrink-0 mt-0.5">{dIdx + 1}.</span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-bold text-indigo-700 text-[10px] leading-tight whitespace-nowrap">{d.shopName}</span>
                                      <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500">
                                        <span className="truncate">{d.name}</span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                        <span>{d.mobile}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover/dealer:opacity-100 transition-opacity shrink-0">
                                    <button 
                                      onClick={() => {
                                        if (onNavigateToDealers) onNavigateToDealers();
                                        setTimeout(() => window.dispatchEvent(new CustomEvent('edit-dealer', { detail: d })), 100);
                                      }}
                                      className="p-1 text-slate-400 hover:text-indigo-600 rounded bg-white shadow-sm border border-slate-100"
                                      title="Edit Dealer"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if(confirm(isEn ? `Delete dealer ${d.shopName}?` : `${d.shopName} हा डीलर डिलीट करायचा का?`)) {
                                          if (onDeleteDealer) onDeleteDealer(d.id);
                                        }
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded bg-white shadow-sm border border-slate-100"
                                      title="Delete Dealer"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-bold text-[7px] uppercase tracking-tight bg-slate-50 px-1 py-0.5 rounded border border-slate-200/60 inline-block my-1">No Dealer</span>
                          )}
                        </td>
                        <td className="px-2 py-1 text-center border-r border-slate-100 align-top">
                          <span className={`inline-flex items-center gap-0.5 px-1 py-0 rounded text-[8px] font-black ${row.status === 'mapped' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} uppercase mt-1`}>
                            {row.status === 'mapped' ? 'Mapped' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-center align-top">
                          <button 
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors mt-0.5" 
                            onClick={() => { 
                              if(confirm(isEn ? "Delete this village entry?" : "ही नोंद डिलीट करायची का?")) deleteLocation(row.id!); 
                            }} 
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {!loading && mappedData.length > itemsPerPage && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-slate-200 bg-slate-50 mt-auto">
              <div className="text-xs font-semibold text-slate-500">
                Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(currentPage * itemsPerPage, mappedData.length)}</span> of <span className="text-slate-900 font-bold">{mappedData.length}</span> entries
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 hover:bg-white border border-transparent hover:border-slate-300 rounded-lg disabled:opacity-30 transition-all text-slate-600 bg-slate-100 shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1 px-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                      return (
                        <button 
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-6 h-6 rounded-md text-[10px] font-bold transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="text-slate-400 font-bold px-0.5 text-[10px]">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 hover:bg-white border border-transparent hover:border-slate-300 rounded-lg disabled:opacity-30 transition-all text-slate-600 bg-slate-100 shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Action Bar (Footer) */}
      <footer className="bg-white border-t border-slate-200 px-4 py-1.5 flex items-center justify-between no-print gap-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-20">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-3">
          <span className="flex items-center gap-1"><div className="w-3 h-3 text-indigo-500" /> {stats.total} Villages</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {stats.mapped} Mapped</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></span>
          <span className="hidden sm:flex items-center gap-1"><Store className="w-3 h-3 text-blue-500" /> {stats.dealers} Dealers</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:flex">
          <span>{new Date().toLocaleDateString()}</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
          <span>Registry</span>
        </div>
      </footer>

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/60 transition-opacity">
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wide">{isBulkAdd ? 'Bulk Registry' : 'Manual Registry'}</h3>
                <p className="text-indigo-200 text-xs font-medium mt-1">Village Mapping Hub</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setIsBulkAdd(!isBulkAdd)}
                  className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold uppercase transition-colors"
                >
                  {isBulkAdd ? 'Single' : 'Bulk'}
                </button>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
            
            <form onSubmit={handleAddVillage} className="p-6 space-y-5">
              {isBulkAdd ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Village List (Comma or New Line separated)</label>
                  <textarea 
                    autoFocus
                    value={bulkVillageList}
                    onChange={(e) => setBulkVillageList(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all shadow-inner h-40 resize-none" 
                    placeholder="e.g. Village1, Village2, Village3..."
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Village Name (English)</label>
                    <input name="village" required autoFocus className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all shadow-inner" placeholder="e.g. Malgaon" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">गावचे नाव (मराठी)</label>
                    <input name="villageMarathi" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all shadow-inner" placeholder="उदा. माळगाव" />
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSyncing}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSyncing ? 'Adding...' : 'Save Registry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT WRAPPER */}
      <div className="hidden print:block p-0 font-sans">
        {/* Company Header */}
        {(COMPANY_NAME || COMPANY_INITIALS || COMPANY_ADDRESS || COMPANY_PHONE) ? (
          <div className="text-center mb-6 border-b-2 border-emerald-600 pb-4">
            {COMPANY_INITIALS && (
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-xl">
                  {COMPANY_INITIALS}
                </div>
              </div>
            )}
            {COMPANY_NAME && (
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{COMPANY_NAME}</h1>
            )}
            {COMPANY_ADDRESS && (
              <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">
                {COMPANY_ADDRESS}
              </p>
            )}
            {COMPANY_PHONE && (
              <div className="flex items-center justify-center gap-2 mt-1 text-[10px] font-bold text-slate-700">
                <Phone className="w-3 h-3" />
                <span>{COMPANY_PHONE}</span>
              </div>
            )}
          </div>
        ) : null}

        {/* Report Info Section */}
        <div className="bg-emerald-600 text-white px-4 py-2 flex justify-between items-center mb-4 rounded-sm">
          <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            LOCATION MAPPING REGISTRY - {currentTaluka || "ALL TALUKAS"}
          </h2>
          <div className="text-[10px] font-black uppercase tracking-wider">
            {mappedData.length} VILLAGES
          </div>
        </div>

        {/* Main Data Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[10px] uppercase font-black text-slate-700 border-y border-slate-200">
              <th className="p-2 border border-slate-200 w-10 text-center">SR. NO.</th>
              <th className="p-2 border border-slate-200 text-left">VILLAGE NAME</th>
              <th className="p-2 border border-slate-200 text-left">DEALER DETAILS</th>
              <th className="p-2 border border-slate-200 text-center w-24 bg-amber-500 text-white border-amber-600">STATUS</th>
            </tr>
          </thead>
          <tbody className="text-[10px] font-bold">
            {mappedData.map((row, idx) => {
              const hasDealers = row.villageDealers.length > 0;
              return (
                <React.Fragment key={row.id}>
                  {row.villageDealers.length > 0 ? (
                    row.villageDealers.map((d: any, dIdx: number) => (
                      <tr key={d.id} className="border-b border-slate-100 print:break-inside-avoid">
                        <td className="p-2 border border-slate-200 text-center align-top">
                          {dIdx === 0 ? idx + 1 : ""}
                        </td>
                        <td className="p-2 border border-slate-200 align-top">
                          {dIdx === 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-900 text-[11px]">{row.village}</span>
                              <span className="text-slate-500 font-medium text-[9px]">{row.villageMarathi}</span>
                            </div>
                          ) : ""}
                        </td>
                        <td className="p-2 border border-slate-200 align-top">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-emerald-700 font-black text-[11px]">{d.shopName}</span>
                            <span className="text-slate-600 font-medium text-[9px]">{d.name} • {d.mobile}</span>
                          </div>
                        </td>
                        <td className="p-2 border border-slate-200 text-center text-emerald-600 align-top">
                          MAPPED
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-slate-100 print:break-inside-avoid">
                      <td className="p-2 border border-slate-200 text-center align-top">{idx + 1}</td>
                      <td className="p-2 border border-slate-200 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-900 text-[11px]">{row.village}</span>
                          <span className="text-slate-500 font-medium text-[9px]">{row.villageMarathi}</span>
                        </div>
                      </td>
                      <td className="p-2 border border-slate-200 text-slate-400 italic font-medium align-top">
                        NO DEALER ASSIGNED
                      </td>
                      <td className="p-2 border border-slate-200 text-center text-amber-600 align-top">
                        PENDING
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Print Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[8px] font-black uppercase text-slate-400 tracking-widest">
          <div>Generated by Vionex CRM System</div>
          <div>Page 1 of 1</div>
          <div>{new Date().toLocaleDateString('mr-IN')}</div>
        </div>
      </div>
    </div>
  );
}

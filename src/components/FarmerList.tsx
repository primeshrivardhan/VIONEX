import { useState } from "react";
import { User, Search, Trash2, Edit2, Phone, MapPin, Store, Printer } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";
import { motion } from "motion/react";

interface Farmer {
  id?: string;
  name: string;
  mobile: string;
  district: string;
  taluka: string;
  village: string;
  dealer?: string;
  crop?: string;
  crops?: any[];
  createdBy?: string;
  createdByUserId?: string;
}

interface Props {
  farmers: Farmer[];
  onAddFarmer: () => void;
  onEditFarmer: (index: number) => void;
  onDeleteFarmer: (index: number) => void;
  canManage?: boolean;
  permissions?: any;
  currentUserId?: string;
  isAdmin?: boolean;
}

export default function FarmerList({
  farmers,
  onAddFarmer,
  onEditFarmer,
  onDeleteFarmer,
  canManage = true,
  permissions,
  currentUserId,
  isAdmin = false,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [farmerToDelete, setFarmerToDelete] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState(20);

  const filteredFarmers = farmers
    .map((farmer, index) => ({ ...farmer, originalIndex: index }))
    .filter(
      (farmer) =>
        farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farmer.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farmer.taluka.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farmer.district.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const pagedFarmers = filteredFarmers.slice(0, pageSize);

  if (farmers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-200 h-full"
      >
        <User className="w-12 h-12 text-slate-300 mb-2" />
        <h2 className="text-sm font-bold text-slate-800 mb-1">शेतकरी नाहीत</h2>
        <p className="text-xs text-slate-500 mb-4">प्रथम शेतकरी जोडा</p>
        {canManage && permissions?.farmerAdd !== false && (
          <button
            onClick={onAddFarmer}
            className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded font-bold hover:bg-emerald-200 transition"
          >
            नवीन शेतकरी नोंदवा
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-base font-bold text-slate-800">
          शेतकरी यादी ({filteredFarmers.length})
        </h2>
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-bold hover:bg-slate-200 transition uppercase tracking-wider"
            title="Download PDF / Print"
          >
            <Printer className="w-3.5 h-3.5" />
            PDF
          </button>
          {canManage && permissions?.farmerAdd !== false && (
            <button
              onClick={onAddFarmer}
              className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded font-bold hover:bg-emerald-200 transition uppercase tracking-wider"
            >
              + शेतकरी जोडा
            </button>
          )}
        </div>
      </div>

      <div className="relative print:hidden">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="नाव, गाव, तालुका किंवा जिल्ह्यानुसार शोधा..."
          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {pagedFarmers.map((farmer, index) => (
          <motion.div
            key={farmer.originalIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200 relative group hover:border-emerald-200 transition-colors"
          >
            {canManage && (() => {
              const isOwner = Boolean(currentUserId && ((farmer.createdBy && farmer.createdBy === currentUserId) || (farmer.createdByUserId && farmer.createdByUserId === currentUserId)));
              return (
                <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                  {(isAdmin || (permissions?.farmerEdit !== false && isOwner)) && (
                    <button
                      onClick={() => onEditFarmer(farmer.originalIndex)}
                      className="p-1 text-slate-400 hover:text-blue-600 bg-white rounded shadow-sm border border-slate-100"
                      title="Edit Farmer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(isAdmin || (permissions?.farmerDelete !== false && isOwner)) && (
                    <button
                      onClick={() => setFarmerToDelete(farmer.originalIndex)}
                      className="p-1 text-slate-400 hover:text-red-600 bg-white rounded shadow-sm border border-slate-100"
                      title="Delete Farmer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })()}
            
            <h3 className="font-bold text-sm text-slate-800 leading-tight pr-12">{farmer.name}</h3>
            
            <div className="mt-1.5 space-y-0.5">
              <p className="text-[11px] text-slate-600 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                {farmer.mobile}
              </p>
              <p className="text-[11px] text-slate-600 flex items-center gap-1 line-clamp-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                {farmer.village}, {farmer.taluka}
              </p>
              {farmer.dealer && (
                <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 line-clamp-1">
                  <Store className="w-3 h-3 text-emerald-500 shrink-0" />
                  {farmer.dealer}
                </p>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-50 flex flex-wrap gap-1">
              {farmer.crops && farmer.crops.length > 0 ? (
                farmer.crops.map((c: any, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                  >
                    {c.crop || "नोंद नाही"}
                    {c.area ? ` (${c.area}A)` : ""}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {farmer.crop || "पीक नोंद नाही"}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {filteredFarmers.length > pageSize && (
        <div className="flex justify-center mt-4 print:hidden">
          <button
            onClick={() => setPageSize(prev => prev + 20)}
            className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] rounded-md shadow-sm hover:bg-slate-50 transition-colors uppercase tracking-wider"
          >
            आणखी शेतकरी पहा (Show More)
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={farmerToDelete !== null}
        title="शेतकरी हटवा"
        message="तुम्हाला हा शेतकरी हटवायचा आहे का? ही क्रिया कायमस्वरूपी असेल."
        onConfirm={() => {
          if (farmerToDelete !== null) onDeleteFarmer(farmerToDelete);
          setFarmerToDelete(null);
        }}
        onCancel={() => setFarmerToDelete(null)}
      />
    </div>
  );
}

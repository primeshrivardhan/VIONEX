import React, { useState, useEffect } from "react";
import { 
  UserCheck, 
  Save, 
  Trash2, 
  Edit, 
  Plus, 
  Phone, 
  Briefcase, 
  MapPin, 
  Globe, 
  CheckCircle, 
  X, 
  AlertCircle,
  Clock,
  Layers
} from "lucide-react";
import { syncCollection, saveItem, deleteItem } from "../lib/data-sync";
import { Consultant } from "../types";

export default function ConsultantsView() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Consultant, "id" | "createdAt" | "updatedAt">>({
    name: "",
    phone: "",
    alternatePhone: "",
    specialty: "",
    experience: "",
    address: "",
    workingArea: "",
    consultingArea: ""
  });

  // Sync consultants collection in real-time (Offline-First!)
  useEffect(() => {
    const unsubscribe = syncCollection<Consultant>("consultants", (data) => {
      const sorted = [...data].sort((a, b) => {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return timeB - timeA; // Latest first
      });
      setConsultants(sorted);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = (c: Consultant) => {
    if (!c.id) return;
    setEditingId(c.id);
    setFormData({
      name: c.name || "",
      phone: c.phone || "",
      alternatePhone: c.alternatePhone || "",
      specialty: c.specialty || "",
      experience: c.experience || "",
      address: c.address || "",
      workingArea: c.workingArea || "",
      consultingArea: c.consultingArea || ""
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setDeletingId(null);
    
    // Scroll to top of view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: "",
      phone: "",
      alternatePhone: "",
      specialty: "",
      experience: "",
      address: "",
      workingArea: "",
      consultingArea: ""
    });
    setErrorMessage(null);
  };

  const confirmDelete = async (id: string) => {
    try {
      await deleteItem("consultants", id);
      showStatus("कन्सल्टंट माहिती यशस्वीरीत्या डिलीट केली आहे!", "success");
      setDeletingId(null);
      if (editingId === id) {
        handleCancelEdit();
      }
    } catch (err) {
      showStatus("डिलीट करताना त्रुटी आली. पुन्हा प्रयत्न करा.", "error");
    }
  };

  const showStatus = (msg: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccessMessage(msg);
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(msg);
      setSuccessMessage(null);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      showStatus("कृपया कन्सल्टंटचे नाव प्रविष्ट करा.", "error");
      return;
    }
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, "").length < 10) {
      showStatus("कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.", "error");
      return;
    }
    if (!formData.specialty.trim()) {
      showStatus("कृपया विशेषज्ञता (उदा. कापूस तज्ञ) प्रविष्ट करा.", "error");
      return;
    }

    try {
      const payload: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        alternatePhone: formData.alternatePhone?.trim() || "",
        specialty: formData.specialty.trim(),
        experience: formData.experience.trim(),
        address: formData.address?.trim() || "",
        workingArea: formData.workingArea?.trim() || "",
        consultingArea: formData.consultingArea?.trim() || "",
        updatedAt: Date.now()
      };

      if (!editingId) {
        payload.createdAt = Date.now();
      } else {
        // preserve original createdAt if available
        const original = consultants.find(c => c.id === editingId);
        if (original && original.createdAt) {
          payload.createdAt = original.createdAt;
        } else {
          payload.createdAt = Date.now();
        }
      }

      await saveItem("consultants", payload, editingId || undefined);
      
      showStatus(
        editingId 
          ? "कन्सल्टंट माहिती यशस्वीरीत्या अपडेट केली आहे!" 
          : "कन्सल्टंट माहिती यशस्वीरीत्या सेव्ह केली आहे!", 
        "success"
      );

      // Reset form
      handleCancelEdit();
    } catch (err) {
      console.error("Error saving consultant:", err);
      showStatus("माहिती सेव्ह करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.", "error");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Form (col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />
          
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            {editingId ? (
              <>
                <Edit className="w-5 h-5 text-amber-500" />
                माहिती अपडेट करा
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-emerald-600" />
                नवीन कन्सल्टंट जोडा
              </>
            )}
          </h2>

          {/* Status Messages */}
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">नाव *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                placeholder="उदा. डॉ. संजय पाटील"
              />
            </div>

            {/* Phone & Alternate Phone Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">मोबाईल नंबर *</label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                  placeholder="९८७६५४३२१०"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">अल्टरनेट मोबाईल</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.alternatePhone}
                  onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value.replace(/\D/g, "") })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                  placeholder="पर्यायी नंबर"
                />
              </div>
            </div>

            {/* Specialty & Experience Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">विशेषज्ञता *</label>
                <input
                  type="text"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                  placeholder="उदा. कापूस व सोयाबीन तज्ञ"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">अनुभव</label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                  placeholder="उदा. ८ वर्षे अनुभव"
                />
              </div>
            </div>

            {/* Address (कन्सल्टन्सी प्रॉपर ऍड्रेस) */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                कन्सल्टन्सी पत्ता (Proper Address)
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm font-medium resize-none"
                placeholder="कन्सल्टन्सीचा मुख्य / प्रॉपर पत्ता टाका"
              />
            </div>

            {/* Working Area & Consulting Area Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  कार्यक्षेत्र (Working Area)
                </label>
                <input
                  type="text"
                  value={formData.workingArea}
                  onChange={(e) => setFormData({ ...formData, workingArea: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                  placeholder="उदा. घाटंजी व पांढरकवडा तालुका"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  कन्सल्टिंग क्षेत्र (Consulting Area)
                </label>
                <input
                  type="text"
                  value={formData.consultingArea}
                  onChange={(e) => setFormData({ ...formData, consultingArea: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                  placeholder="उदा. १५० एकर / ५० शेतकरी"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  रद्द करा
                </button>
              )}
              <button
                type="submit"
                className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-emerald-700/20 transition-all text-sm flex items-center justify-center gap-2"
              >
                <Save className="w-4.5 h-4.5" />
                {editingId ? "माहिती अपडेट करा" : "डिटेल्स सेव्ह करा"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Saved List (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              सर्व कन्सल्टंट यादी ({consultants.length})
            </h2>

            {consultants.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">अद्याप कोणताही कन्सल्टंट जोडलेला नाही.</p>
                <p className="text-xs text-slate-400 mt-1">नवीन कन्सल्टंट जोडण्यासाठी शेजारील फॉर्म वापरा.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                {consultants.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-xl border transition-all relative overflow-hidden bg-white ${
                      editingId === item.id 
                        ? "border-amber-400 bg-amber-50/10 shadow-sm" 
                        : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
                    }`}
                  >
                    {editingId === item.id && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400" />
                    )}

                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-slate-800 tracking-tight truncate">
                            {item.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                            <Briefcase className="w-3 h-3" />
                            {item.specialty}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold">{item.phone}</span>
                            {item.alternatePhone && (
                              <span className="text-slate-400 font-normal">({item.alternatePhone})</span>
                            )}
                          </div>

                          {item.experience && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>अनुभव: <strong className="font-bold text-slate-700">{item.experience}</strong></span>
                            </div>
                          )}

                          {item.address && (
                            <div className="flex items-start gap-1.5 md:col-span-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">
                                पत्ता: <strong className="font-bold text-slate-700">{item.address}</strong>
                              </span>
                            </div>
                          )}

                          {item.workingArea && (
                            <div className="flex items-start gap-1.5 md:col-span-2">
                              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>
                                कार्यक्षेत्र: <strong className="font-bold text-slate-700">{item.workingArea}</strong>
                              </span>
                            </div>
                          )}

                          {item.consultingArea && (
                            <div className="flex items-start gap-1.5 md:col-span-2">
                              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>
                                कन्सल्टिंग क्षेत्र: <strong className="font-bold text-slate-700">{item.consultingArea}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons or delete confirm */}
                      <div className="shrink-0 flex items-center gap-1">
                        {deletingId === item.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 p-1 rounded-lg animate-fadeIn">
                            <span className="text-[10px] font-black text-rose-700 px-1">नक्की?</span>
                            <button
                              onClick={() => confirmDelete(item.id!)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded"
                            >
                              होय
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded"
                            >
                              नाही
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-colors"
                              title="माहिती बदला"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(item.id!)}
                              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 rounded-lg transition-colors"
                              title="काढून टाका"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

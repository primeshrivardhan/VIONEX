import React, { useState, useEffect } from "react";
import { Store, User, Phone, MapPin, MapPinned as MapIcon, Loader2, CheckCircle, Navigation } from "lucide-react";
import { db, auth, ensureAnonymousAuth } from "../lib/firebase";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { MAHARASHTRA_DISTRICTS, getTalukasForDistrict, getVillagesForTaluka } from "../lib/maharashtra-locations";
import { getSmartLocation } from "../lib/geo-helper";
import { Dealer } from "../types";

export default function StandaloneDealerForm() {
  const [formData, setFormData] = useState({
    shopName: "",
    name: "",
    mobile: "",
    state: "Maharashtra",
    district: "",
    taluka: "",
    village: "",
    address: "",
  });

  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [talukas, setTalukas] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  const [existingDealers, setExistingDealers] = useState<Dealer[]>([]);

  useEffect(() => {
    // Authenticate anonymously so we have a valid session to write to Firestore
    ensureAnonymousAuth().catch(err => {
      console.warn("Anonymous sign in notice (non-blocking)", err);
    });
  }, []);

  useEffect(() => {
    if (formData.district) {
      setTalukas(getTalukasForDistrict(formData.district));
      setFormData(prev => ({ ...prev, taluka: "", village: "" }));
    } else {
      setTalukas([]);
    }
  }, [formData.district]);

  useEffect(() => {
    if (formData.taluka) {
      setVillages(getVillagesForTaluka(formData.taluka));
      setFormData(prev => ({ ...prev, village: "" }));
    } else {
      setVillages([]);
    }
  }, [formData.taluka]);

  useEffect(() => {
    if (formData.district && formData.taluka && formData.village) {
      const fetchDealers = async () => {
        try {
          const q = query(
            collection(db, "dealers"),
            where("district", "==", formData.district),
            where("taluka", "==", formData.taluka),
            where("village", "==", formData.village)
          );
          const snap = await getDocs(q);
          setExistingDealers(snap.docs.map(d => d.data() as Dealer));
        } catch (err) {
          console.error("Error fetching dealers:", err);
        }
      };
      fetchDealers();
    } else {
      setExistingDealers([]);
    }
  }, [formData.district, formData.taluka, formData.village]);

  const handleLocationRequest = async () => {
    setLocationLoading(true);
    setLocationError("");
    const loc = await getSmartLocation();
    if (loc) {
      setLocation({
        lat: loc.latitude,
        lon: loc.longitude,
      });
      setLocationError("");
    } else {
      setLocationError("लोकेशन शोधता आले नाही. GPS सुरू करा किंवा फॉर्म न भरता जतन करू शकता.");
    }
    setLocationLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shopName || !formData.name || !formData.mobile || !formData.district || !formData.taluka || !formData.village) {
      setError("Please fill all required fields.");
      return;
    }

    if (formData.mobile.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Check for duplicate mobile number
      const dealersRef = collection(db, "dealers");
      const q = query(dealersRef, where("mobile", "==", formData.mobile));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError("A dealer with this mobile number already exists.");
        setLoading(false);
        return;
      }

      // 2. Generate new ID
      const newId = `D${Date.now()}`;
      const docRef = doc(db, "dealers", newId);
      
      const newDealer: Dealer = {
        id: newId,
        name: formData.name,
        shopName: formData.shopName,
        mobile: formData.mobile,
        state: formData.state,
        district: formData.district,
        taluka: formData.taluka,
        village: formData.village,
        address: formData.address || "",
        lat: location?.lat,
        lon: location?.lon,
        updatedAt: Date.now(),
        createdBy: "Officer Link",
      };

      // 3. Save to Firestore
      await setDoc(docRef, newDealer);

      // 4. Success state
      setSuccess(true);
      setFormData({
        shopName: "",
        name: "",
        mobile: "",
        state: "Maharashtra",
        district: "",
        taluka: "",
        village: "",
        address: "",
      });
      setLocation(null);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);

    } catch (err: any) {
      console.error("Error adding dealer:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 px-6 py-8 text-center relative">
          <button
            onClick={() => window.open(window.location.origin + "/public-gateway?type=consultant", "_blank")}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            Consulting Farm
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Dealer Registration</h1>
          <p className="text-indigo-100 text-sm mt-2 font-medium">Add new dealer to the registry</p>
        </div>

        <div className="p-6">
          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-emerald-800 mb-1">Registration Successful!</h3>
              <p className="text-emerald-600 text-sm">The dealer has been added securely to the main database.</p>
              <button 
                onClick={() => setSuccess(false)}
                className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors"
              >
                Register Another Dealer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 font-medium">
                  {error}
                </div>
              )}

              {formData.district && formData.taluka && formData.village && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Existing Dealers in {formData.village} ({existingDealers.length})</h3>
                  {existingDealers.length > 0 ? (
                    <ul className="space-y-2">
                      {existingDealers.map((d, i) => (
                        <li key={i} className="bg-white p-3 rounded-lg border border-slate-100 text-sm">
                          <div className="font-bold text-slate-900">{d.shopName}</div>
                          <div className="text-slate-600">{d.name} • {d.mobile}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">No dealers found in this village.</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shop Name *</label>
                <div className="relative">
                  <Store className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.shopName}
                    onChange={e => setFormData({ ...formData, shopName: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium text-slate-900"
                    placeholder="e.g. Balaji Krushi Kendra"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Owner Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium text-slate-900"
                    placeholder="e.g. Ramesh Patil"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/[^0-9]/g, '') })}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium text-slate-900"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">District *</label>
                  <select
                    required
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium text-slate-900"
                  >
                    <option value="">Select</option>
                    {MAHARASHTRA_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Taluka *</label>
                  <select
                    required
                    disabled={!formData.district}
                    value={formData.taluka}
                    onChange={e => setFormData({ ...formData, taluka: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium text-slate-900 disabled:bg-slate-50"
                  >
                    <option value="">Select</option>
                    {talukas.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Village *</label>
                {villages.length > 0 ? (
                  <select
                    required
                    value={formData.village}
                    onChange={e => setFormData({ ...formData, village: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium text-slate-900"
                  >
                    <option value="">Select Village</option>
                    {villages.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.village}
                      onChange={e => setFormData({ ...formData, village: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium text-slate-900"
                      placeholder="Village Name"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address</label>
                <div className="relative">
                  <MapIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium text-slate-900 resize-none"
                    placeholder="Full street address (optional)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GPS Location (Optional)</label>
                {location ? (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-bold">Location Captured ({location.lat.toFixed(4)}, {location.lon.toFixed(4)})</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleLocationRequest}
                    disabled={locationLoading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-bold text-sm"
                  >
                    {locationLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : (
                      <Navigation className="w-4 h-4 text-indigo-600" />
                    )}
                    {locationLoading ? "Getting Location..." : "Capture Current Location"}
                  </button>
                )}
                {locationError && <p className="text-red-500 text-xs mt-1 font-medium">{locationError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-wide hover:bg-indigo-700 transition-colors disabled:opacity-70 mt-6"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Submit Registration"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

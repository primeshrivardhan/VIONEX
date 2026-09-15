import React, { useState } from "react";
import { 
  User, 
  Shield, 
  Share2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Lock, 
  Key, 
  Trash2, 
  Plus,
  Users,
  Search,
  Bell,
  AlertTriangle,
  CloudRain,
  Wind,
  Megaphone,
  Send,
  Settings,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  MapPin,
  Download,
  Upload,
  Database,
  RefreshCw,
  FileJson
} from "lucide-react";
import { AppUser, UserPermissions, Farmer, MasterLocation } from "../types";

interface AdminViewProps {
  users: AppUser[];
  farmers: Farmer[];
  products?: any[];
  schedules?: any[];
  activityLogs?: any[];
  alerts?: any[];
  dealers?: any[];
  onUpdateUser: (userId: string, data: Partial<AppUser>) => void;
  onDeleteUser: (userId: string) => void;
  onAddUser: (user: Omit<AppUser, "id">) => void;
  onUpdateFarmer: (farmerId: string, data: Partial<Farmer>) => void;
  onDeleteFarmer: (farmerId: string) => void;
  onAddProduct?: (product: any) => void;
  onUpdateProduct?: (id: string, data: any) => void;
  onUpdateSchedule?: (id: string, data: any) => void;
  onUpdateDealer?: (id: string, data: any) => void;
  onAddAlert?: (alert: any) => void;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  farmers: true,
  schedules: true,
  products: true,
  dealers: true,
  consultants: false,
  weather: false,
  allCrops: false,
  solutions: false,
  masterSchedules: false,
  autoApproveSchedules: false,
  manageProducts: false,
  settings: true,
  alerts: true,
  farmerAdd: true,
  farmerEdit: true,
  farmerDelete: true,
  dealerAdd: true,
  dealerEdit: true,
  dealerDelete: true,
  productView: true,
  productAdd: true,
  productEdit: true,
  productDelete: true,
  orderCreate: true,
  orderEdit: true,
  paymentEntry: true,
  collectionEntry: true,
  reportsView: true,
  exportExcelPdf: true,
  dashboardView: true,
  userManagement: false,
  syncData: true,
  canCancel: true,
  canMarkDone: true,
};

const ROLE_PERMISSIONS: { [role: string]: UserPermissions } = {
  admin: {
    farmers: true, schedules: true, products: true, dealers: true, consultants: true, weather: true, allCrops: true, solutions: true, masterSchedules: true, autoApproveSchedules: true, manageProducts: true, settings: true, alerts: true,
    farmerAdd: true, farmerEdit: true, farmerDelete: true,
    dealerAdd: true, dealerEdit: true, dealerDelete: true,
    productView: true, productAdd: true, productEdit: true, productDelete: true,
    orderCreate: true, orderEdit: true, paymentEntry: true, collectionEntry: true,
    reportsView: true, exportExcelPdf: true, dashboardView: true, userManagement: true, syncData: true, canCancel: true, canMarkDone: true
  },
  manager: {
    farmers: true, schedules: true, products: true, dealers: true, consultants: true, weather: true, allCrops: true, solutions: true, masterSchedules: true, autoApproveSchedules: false, manageProducts: true, settings: true, alerts: true,
    farmerAdd: true, farmerEdit: true, farmerDelete: false,
    dealerAdd: true, dealerEdit: true, dealerDelete: false,
    productView: true, productAdd: true, productEdit: true, productDelete: false,
    orderCreate: true, orderEdit: true, paymentEntry: true, collectionEntry: true,
    reportsView: true, exportExcelPdf: true, dashboardView: true, userManagement: true, syncData: true, canCancel: true, canMarkDone: true
  },
  sales: {
    farmers: true, schedules: true, products: true, dealers: true, consultants: false, weather: true, allCrops: false, solutions: false, masterSchedules: false, autoApproveSchedules: false, manageProducts: false, settings: false, alerts: true,
    farmerAdd: true, farmerEdit: true, farmerDelete: false,
    dealerAdd: true, dealerEdit: true, dealerDelete: false,
    productView: true, productAdd: false, productEdit: false, productDelete: false,
    orderCreate: true, orderEdit: false, paymentEntry: true, collectionEntry: true,
    reportsView: false, exportExcelPdf: false, dashboardView: true, userManagement: false, syncData: true, canCancel: false, canMarkDone: true
  },
  viewer: {
    farmers: true, schedules: true, products: true, dealers: true, consultants: false, weather: true, allCrops: false, solutions: false, masterSchedules: false, autoApproveSchedules: false, manageProducts: false, settings: false, alerts: true,
    farmerAdd: false, farmerEdit: false, farmerDelete: false,
    dealerAdd: false, dealerEdit: false, dealerDelete: false,
    productView: true, productAdd: false, productEdit: false, productDelete: false,
    orderCreate: false, orderEdit: false, paymentEntry: false, collectionEntry: false,
    reportsView: true, exportExcelPdf: false, dashboardView: true, userManagement: false, syncData: false, canCancel: false, canMarkDone: false
  },
  user: {
    farmers: true, schedules: true, products: true, dealers: true, consultants: false, weather: false, allCrops: false, solutions: false, masterSchedules: false, autoApproveSchedules: false, manageProducts: false, settings: true, alerts: true,
    farmerAdd: true, farmerEdit: true, farmerDelete: true,
    dealerAdd: true, dealerEdit: true, dealerDelete: true,
    productView: true, productAdd: true, productEdit: true, productDelete: true,
    orderCreate: true, orderEdit: true, paymentEntry: true, collectionEntry: true,
    reportsView: true, exportExcelPdf: true, dashboardView: true, userManagement: false, syncData: true, canCancel: true, canMarkDone: true
  }
};

function AdminView({ 
  users, 
  farmers,
  products = [],
  schedules = [],
  activityLogs = [],
  alerts = [],
  dealers = [],
  onUpdateUser, 
  onDeleteUser, 
  onAddUser,
  onUpdateFarmer,
  onDeleteFarmer,
  onAddProduct,
  onUpdateProduct,
  onUpdateSchedule,
  onUpdateDealer,
  onAddAlert
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<"admin" | "user" | "farmer">("admin");
  const [alertType, setAlertType] = useState("weather");
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");



  const filteredAdmins = users.filter(u => u.role === "admin" && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.loginId.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredUsers = users.filter(u => u.role !== "admin" && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.loginId.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredFarmers = farmers.filter(f => (
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.mobile.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.village || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.taluka || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.dealer || "").toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const pendingProducts = products?.filter(p => p.createdBy && p.createdBy !== "admin" && p.approvalStatus !== "approved") || [];
  const pendingFarmers = farmers?.filter(f => f.createdBy && f.createdBy !== "admin" && f.approvalStatus !== "approved") || [];
  const pendingSchedules = schedules?.filter(s => s.createdBy && s.createdBy !== "admin" && s.approvalStatus !== "approved") || [];
  const totalPendingApprovals = pendingProducts.length + pendingFarmers.length + pendingSchedules.length;

  const togglePassword = (userId: string) => {
    setShowPassword(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserRole, setNewUserRole] = useState<"admin"| "manager" | "sales" | "viewer" | "user">("user");

  // Farmer alert states
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedAlertFarmer, setSelectedAlertFarmer] = useState<Farmer | null>(null);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertText, setAlertText] = useState("");
  const [alertPriority, setAlertPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>("High");
  const [alertTypeSelect, setAlertTypeSelect] = useState<'weather' | 'disease' | 'pest' | 'advisory' | 'system'>("advisory");

  const handleAddUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const loginId = formData.get("loginId") as string;
    const password = formData.get("password") as string;
    const selectedRole = formData.get("role") as any || newUserRole;

    if (name && loginId && password) {
      const cleanLoginId = loginId.trim().toLowerCase();
      const isDuplicate = users.some(
        (u) => u.loginId && u.loginId.trim().toLowerCase() === cleanLoginId
      );

      if (isDuplicate) {
        alert("हा मोबाईल नंबर/आयडी आधीपासूनच नोंदणीकृत आहे! (This Login ID/Mobile is already registered!)");
        return;
      }

      onAddUser({
        name,
        loginId: loginId.trim(),
        password,
        role: selectedRole,
        status: "approved",
        permissions: ROLE_PERMISSIONS[selectedRole] || DEFAULT_PERMISSIONS,
        paidStatus: "paid",
        access: true
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" id="admin-view-root">
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4"> नवीन युजर जोडा</h3>
            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name</label>
                <input required name="name" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="e.g. Rahul Patil" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Login ID (Mobile/Email)</label>
                <input required name="loginId" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Login ID" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Password</label>
                <input required name="password" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Password" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role (भूमिका)</label>
                <select name="role" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                  <option value="user">User (साधारण युजर)</option>
                  <option value="admin">Admin (सर्व अधिकार)</option>
                  <option value="manager">Manager (व्यवस्थापक)</option>
                  <option value="sales">Sales User (विक्री प्रतिनिधी)</option>
                  <option value="viewer">Viewer (फक्त दर्शक)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-500">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAlertModalOpen && selectedAlertFarmer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1">
              📢 शेतकरी अलर्ट पाठवा (Alert to {selectedAlertFarmer.name})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              या शेतकऱ्यासाठी नवीन अलर्ट/कृषी सल्ला संदेश तयार करा.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onAddAlert) {
                  onAddAlert({
                    title: alertTitle || `अलर्ट: ${selectedAlertFarmer.name}`,
                    text: alertText,
                    type: alertTypeSelect,
                    priority: alertPriority,
                    farmerId: selectedAlertFarmer.id,
                    area: selectedAlertFarmer.village,
                    createdAt: Date.now()
                  });
                }
                setIsAlertModalOpen(false);
                setAlertTitle("");
                setAlertText("");
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">शीर्षक (Title)</label>
                <input
                  required
                  type="text"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="उदा. हवामान अंदाज किंवा कीड नियंत्रण"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">अलर्ट संदेश (Message)</label>
                <textarea
                  required
                  rows={4}
                  value={alertText}
                  onChange={(e) => setAlertText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="संदेश सविस्तर लिहा..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">प्रकार (Type)</label>
                  <select
                    value={alertTypeSelect}
                    onChange={(e: any) => setAlertTypeSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="advisory">कृषी सल्ला (Advisory)</option>
                    <option value="weather">हवामान (Weather)</option>
                    <option value="disease">रोग नियंत्रण (Disease)</option>
                    <option value="pest">कीड नियंत्रण (Pest)</option>
                    <option value="system">प्रणाली (System)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">प्राधान्य (Priority)</label>
                  <select
                    value={alertPriority}
                    onChange={(e: any) => setAlertPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Low">कमी (Low)</option>
                    <option value="Medium">मध्यम (Medium)</option>
                    <option value="High">जास्त (High)</option>
                    <option value="Critical">तातडीचे (Critical)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAlertModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-500"
                >
                  अलर्ट पाठवा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tabs */}
        <div className="flex bg-slate-200 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "admin" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-800 hover:bg-slate-300"
            }`}
          >
            Admins
          </button>
          <button
            onClick={() => setActiveTab("user")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "user" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-800 hover:bg-slate-300"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("farmer")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "farmer" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-800 hover:bg-slate-300"
            }`}
          >
            Farmers
          </button>
        </div>

        {/* Header stats & search */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total: {activeTab === "admin" ? filteredAdmins.length : activeTab === "user" ? filteredUsers.length : filteredFarmers.length}
          </h2>
          {activeTab !== "farmer" && (
            <button
              onClick={() => {
                setNewUserRole(activeTab as "admin" | "user");
                setIsAddModalOpen(true);
              }}
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-500"
            >
              Add New {activeTab}
            </button>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* List */}
        <div className="space-y-3">
          {(activeTab === "admin" ? filteredAdmins : activeTab === "user" ? filteredUsers : []).map(u => (
            <div key={u.loginId} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm">{u.name}</h3>
              <p className="text-xs text-slate-500">ID: {u.loginId}</p>
              <p className="text-xs text-slate-500">Role: {u.role}</p>
              <div className="flex justify-end gap-2 mt-2">
                <button className="text-xs bg-slate-100 px-3 py-1 rounded text-slate-600 hover:bg-slate-200" onClick={() => togglePassword(u.loginId)}>
                  {showPassword[u.loginId] ? u.password : "Show Pass"}
                </button>
                <button className="text-xs bg-red-50 px-3 py-1 rounded text-red-600 hover:bg-red-100" onClick={() => onDeleteUser(u.loginId)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {activeTab === "farmer" && filteredFarmers.map((f, index) => {
            const isPaid = f.paidStatus === "paid";
            const isAccessOn = f.access !== false; // default is true/ON
            const farmerId = f.id || f.mobile;
            const isPassVisible = showPassword[farmerId] || false;

            return (
              <div key={farmerId} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 relative space-y-3 flex flex-col justify-between">
                {/* Top section: name & status badges */}
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">
                      {index + 1}. {f.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <span>{f.mobile}</span>
                      <span>•</span>
                      <span>{f.village || "N/A"}</span>
                      {f.taluka && (
                        <>
                          <span>({f.taluka})</span>
                        </>
                      )}
                      <span>•</span>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Paid/Unpaid badge */}
                    <button
                      onClick={() => {
                        const nextPaid = isPaid ? "unpaid" : "paid";
                        onUpdateFarmer(farmerId, { paidStatus: nextPaid });
                      }}
                      className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider transition-colors ${
                        isPaid
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      {isPaid ? "PAID" : "UNPAID"}
                    </button>

                    {/* Access ON/OFF badge */}
                    <button
                      onClick={() => {
                        onUpdateFarmer(farmerId, { access: !isAccessOn });
                      }}
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider transition-colors ${
                        isAccessOn
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {isAccessOn ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>

                {/* Shop / Dealer Name */}
                {f.dealer && (
                  <div>
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-md font-semibold inline-block">
                      दुकान: {f.dealer}
                    </span>
                  </div>
                )}

                {/* Password and online/offline status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <span>पासवर्ड:</span>
                    <span className="font-mono font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 min-w-[50px] text-center">
                      {isPassVisible ? (f.password || "1234") : "••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePassword(farmerId)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
                    >
                      {isPassVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    {/* Connection status */}
                    <span className="flex items-center gap-1.5 ml-2 text-slate-400 font-bold text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      OFFLINE
                    </span>
                  </div>

                  {/* ALERT button */}
                  <button
                    onClick={() => {
                      setSelectedAlertFarmer(f);
                      setIsAlertModalOpen(true);
                    }}
                    className="bg-[#0f9d58] text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-sm hover:bg-emerald-700 flex items-center gap-1 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    ALERT
                  </button>
                </div>

                {/* Schedule Settings panel */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                  <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    शेड्युल सेटिंग:
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {/* Full Schedule Toggle */}
                    <button
                      onClick={() => {
                        onUpdateFarmer(farmerId, { showFullSchedule: !f.showFullSchedule });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-black transition-all shadow-sm ${
                        f.showFullSchedule
                          ? "bg-amber-600 text-white hover:bg-amber-500"
                          : "bg-blue-600 text-white hover:bg-blue-500"
                      }`}
                    >
                      {f.showFullSchedule ? "पूर्ण शेड्युल (लपवा)" : "पूर्ण शेड्युल (दाखवा)"}
                    </button>

                    {/* Done Schedules Toggle */}
                    <button
                      onClick={() => {
                        onUpdateFarmer(farmerId, { hideDoneSchedules: !f.hideDoneSchedules });
                      }}
                      className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-black hover:bg-slate-50 shadow-sm transition-all"
                    >
                      {f.hideDoneSchedules ? "पुढचे शेड्युल (केलेले दाखवा)" : "पुढचे शेड्युल (केलेले लपवा)"}
                    </button>
                  </div>
                </div>

                {/* Delete button (discreet, bottom-right) */}
                <div className="flex justify-end pt-1">
                  <button
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      if (confirm(`${f.name} या शेतकऱ्याची नोंदणी डिलीट करायची आहे का?`)) {
                        onDeleteFarmer(farmerId);
                      }
                    }}
                  >
                    शेतकरी डिलीट करा
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default AdminView;

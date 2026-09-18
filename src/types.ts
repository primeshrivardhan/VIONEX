export interface Crop {
  id: string;
  name: string;
  plantingDate: string;
  soilType: string;
  stage: string;
  area: string;
  notes?: string;
  addedAt: number;
}

export interface UserPermissions {
  farmers: boolean;
  schedules: boolean;
  products: boolean;
  dealers: boolean;
  consultants: boolean;
  weather: boolean;
  allCrops: boolean;
  solutions: boolean;
  masterSchedules: boolean;
  autoApproveSchedules: boolean;
  manageProducts: boolean;
  settings?: boolean;
  alerts?: boolean; // New

  // Granular Access Control
  farmerAdd?: boolean;
  /** For consultants: strictly restricted to editing records where createdBy === request.auth.uid */
  farmerEdit?: boolean;
  /** For consultants: strictly restricted to deleting records where createdBy === request.auth.uid */
  farmerDelete?: boolean;
  dealerAdd?: boolean;
  dealerEdit?: boolean;
  dealerDelete?: boolean;
  productView?: boolean;
  productAdd?: boolean;
  productEdit?: boolean;
  productDelete?: boolean;
  orderCreate?: boolean;
  orderEdit?: boolean;
  paymentEntry?: boolean;
  collectionEntry?: boolean;
  reportsView?: boolean;
  exportExcelPdf?: boolean;
  dashboardView?: boolean;
  userManagement?: boolean;
  syncData?: boolean;
  canCancel?: boolean; // New
  canMarkDone?: boolean; // New
  diseaseId?: boolean;
}

export interface Farmer {
  id: string;
  name: string;
  mobile: string;
  password?: string;
  pincode: string;
  country: string;
  state: string;
  district: string;
  taluka: string;
  lat?: number;
  lon?: number;
  village: string;
  villageCode?: string; // Standardized village code for robust mapping
  crops: {
    crop: string;
    variety: string;
    season: string;
    area: string;
    plantationDate: string;
  }[];
  dealer?: string;
  alternateMobile?: string;
  paidStatus?: 'paid' | 'unpaid';
  photoUrl?: string;
  loginStatus?: 'active' | 'inactive';
  access?: boolean;
  createdBy?: string;
  createdByUserId?: string;
  approvalStatus?: string;
  showFullSchedule?: boolean;
  hideDoneSchedules?: boolean;
  // Soft Delete and Ownership
  isDeleted?: boolean;
  linkedUsers?: string[];
}

export interface AppUser {
  id: string;
  name: string;
  loginId: string;
  password?: string;
  role: 'admin' | 'manager' | 'sales' | 'viewer' | 'user' | 'consultant';
  status: 'approved' | 'frozen' | 'pending';
  permissions: UserPermissions;
  paidStatus?: 'paid' | 'unpaid';
  access?: boolean;
  linkedConsultantId?: string;
}

export const DEFAULT_PERMISSIONS: UserPermissions = {
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

export const ROLE_PERMISSIONS: { [role: string]: UserPermissions } = {
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
  },
  consultant: {
    farmers: true, schedules: true, products: true, dealers: false, consultants: false, weather: true, allCrops: false, solutions: false, masterSchedules: false, autoApproveSchedules: false, manageProducts: false, settings: false, alerts: true,
    farmerAdd: true, farmerEdit: true, farmerDelete: true,
    dealerAdd: false, dealerEdit: false, dealerDelete: false,
    productView: true, productAdd: true, productEdit: false, productDelete: false,
    orderCreate: false, orderEdit: false, paymentEntry: false, collectionEntry: false,
    reportsView: false, exportExcelPdf: false, dashboardView: true, userManagement: false, syncData: true, canCancel: false, canMarkDone: true
  }
};

export interface Dealer {
  id?: string;
  name: string;
  shopName: string;
  businessType?: string;
  isBranch?: boolean;
  mobile: string;
  alternateMobile?: string;
  alternateName?: string;
  village: string;
  villageCode?: string; // Standardized village code for robust mapping
  taluka: string;
  lat?: number;
  lon?: number;
  district: string;
  state?: string;
  country?: string;
  pincode?: string;
  createdBy?: string;
  createdByUserId?: string;
  approvalStatus?: string;
  address?: string;
  updatedAt?: number;
  // Soft Delete and Ownership
  isDeleted?: boolean;
  linkedUsers?: string[];
}

export interface Product {
  id?: string;
  brandName?: string;
  marathiName?: string;
  companyName?: string;
  category?: string;
  subCategory?: string;
  composition?: string;
  compositionEnglish?: string;
  modeOfAction?: string; // e.g. Systemic / Contact / Translaminar
  typeClassification?: string;
  iracCode?: string;
  fracCode?: string;
  hracCode?: string;
  doseSpray?: string;
  doseDrip?: string;
  doseDrenching?: string;
  doseBasal?: string;
  targetCrops?: string;
  targetPests?: string;
  targetDiseases?: string;
  photoUrl?: string;
  pdfUrl?: string;
  videoUrl?: string;
  isNewMolecule?: boolean;
  searchTags?: string[];
  imageUrl?: string;
  status?: "pending" | "verified" | "live";
  updatedAt?: number;
  version?: number;
  [key: string]: any;
}

export interface Alert {
  id: string;
  title: string;
  text: string;           // description
  type: 'weather' | 'disease' | 'pest' | 'advisory' | 'system';
  crop?: string;
  targetCrops?: string[]; // to match specific crops
  pestDiseaseName?: string;
  area?: string;          // Affected Area
  symptoms?: string;
  possibleCause?: string;
  preventiveMeasure?: string;
  recommendedManagement?: string;
  recommendations?: string; // string array or string, let's use string
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: number;
  readBy?: string[];      // Array of user IDs who have read this alert
  targetScope?: 'all' | 'state' | 'district' | 'taluka';
  targetState?: string;
  targetDistrict?: string;
  targetTaluka?: string;
  lat?: number;           // Target Latitude
  lng?: number;           // Target Longitude
  radius?: number;        // Target Radius in KM
  expiresAt?: number;     // Alert Expiry timestamp
}

export interface MasterLocation {
  id?: string;
  state: string;
  district: string;
  taluka: string;
  lat?: number;
  lon?: number;
  village: string;
  villageMarathi?: string;
  villageCode?: string; // Standardized village code for robust mapping
  pincode?: string;
  updatedAt?: number;
}

export interface Consultant {
  id?: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  specialty: string;
  experience: string;
  address?: string;      // कन्सल्टन्सी पत्ता / Consultancy Address
  workingArea?: string;  // कार्यक्षेत्र / Working Area
  consultingArea?: string; // कन्सल्टिंग क्षेत्र (उदा. १०० एकर) / Consulting Area
  linkedUserId?: string;   // Real Firebase Auth UID / AppUser ID (No password or auth secrets stored here!)
  createdAt?: number;
  updatedAt?: number;
}


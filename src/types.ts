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
  farmerEdit?: boolean;
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
  role: 'admin' | 'manager' | 'sales' | 'viewer' | 'user';
  status: 'approved' | 'frozen' | 'pending';
  permissions: UserPermissions;
  paidStatus?: 'paid' | 'unpaid';
  access?: boolean;
}

export interface Dealer {
  id?: string;
  name: string;
  shopName: string;
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
  createdAt?: number;
  updatedAt?: number;
}


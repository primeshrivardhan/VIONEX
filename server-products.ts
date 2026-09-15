export interface BackupProduct {
  brandName: string;
  marathiName: string;
  companyName: string;
  category: string;
  composition: string;
  modeOfAction: string;
  isNewMolecule?: boolean;
}

export interface FullProduct extends BackupProduct {
  compositionEnglish: string;
  doseSpray: string;
  doseDrip: string;
  doseDrenching: string;
  doseBasal: string;
  applicationTime: string;
  packingSizes: string;
  targetCrops: string;
  targetPests: string;
  applicationMethods: string;
  safetyInstructions: string;
  priceInfo: string;
  notes: string;
}

export const BACKUP_PRODUCTS: BackupProduct[] = [];

export function findBackupProducts(query: string): BackupProduct[] {
  return [];
}

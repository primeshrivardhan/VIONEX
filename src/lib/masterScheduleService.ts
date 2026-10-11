import { MasterSchedule, Farmer, MasterScheduleProduct } from "../types";
import { saveItem } from "./data-sync";
import { auth } from "./firebase";
import { getCropPlotLabel } from "./utils";

export interface PlotOption {
  key: string;
  cropIndex: number;
  cropId: string;
  cropName: string;
  variety: string;
  area: string;
  plantationDate?: string;
  displayLabel: string;
}

/**
 * Extracts and formats all available plots/crops for a selected farmer.
 * Uses getCropPlotLabel to support Option B multi-plot crop tracking.
 */
export function getPlotsForFarmer(farmer: Farmer | any): PlotOption[] {
  if (!farmer || !farmer.crops || !Array.isArray(farmer.crops) || farmer.crops.length === 0) {
    return [];
  }
  return farmer.crops.map((c: any, idx: number) => {
    const cropId = c.id || String(idx);
    const displayLabel = getCropPlotLabel(c, idx, farmer.crops);
    return {
      key: `plot_${idx}_${cropId}`,
      cropIndex: idx,
      cropId,
      cropName: c.crop || "",
      variety: c.variety || "",
      area: c.area || "",
      plantationDate: c.plantationDate || c.sowingDate || "",
      displayLabel,
    };
  });
}

/**
 * Calculates schedule date from planting date + day number.
 * If planting date is not set, falls back to today + day number.
 */
export function calculateDateForDay(plantationDateStr?: string, dayNo?: number): string {
  const day = typeof dayNo === "number" && !isNaN(dayNo) ? dayNo : 0;
  if (plantationDateStr) {
    const parts = plantationDateStr.split(/[-/]/);
    let pDate: Date | null = null;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        pDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        // DD-MM-YYYY
        pDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    } else {
      const d = new Date(plantationDateStr);
      if (!isNaN(d.getTime())) pDate = d;
    }

    if (pDate && !isNaN(pDate.getTime())) {
      const target = new Date(pDate.getTime() + day * 24 * 60 * 60 * 1000);
      const yyyy = target.getFullYear();
      const mm = String(target.getMonth() + 1).padStart(2, "0");
      const dd = String(target.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // Fallback: today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export interface ApplyMasterScheduleParams {
  masterSchedule: MasterSchedule;
  farmer: Farmer | any;
  plot: PlotOption;
  scheduleDate: string;
  currentUser?: any;
  isAdmin?: boolean;
}

/**
 * Single shared implementation: copies a master schedule as a fully independent
 * document in the 'schedules' collection for the selected farmer and plot.
 * 
 * - Generates unique schedule ID (schedule-TIMESTAMP-RANDOM)
 * - Deep copies selected products so editing master schedule will NOT retroactively alter plot copy
 * - Sets creator, approvalStatus, and timestamps matching standard schedule creation
 */
export async function applyMasterScheduleToPlot({
  masterSchedule,
  farmer,
  plot,
  scheduleDate,
  currentUser,
  isAdmin = false,
}: ApplyMasterScheduleParams): Promise<{ uniqueId: string; schedule: any }> {
  if (!farmer) {
    throw new Error("Farmer is required to apply schedule.");
  }
  if (!plot) {
    throw new Error("Plot is required to apply schedule.");
  }

  const creatorId =
    auth.currentUser?.uid ||
    currentUser?.id ||
    currentUser?.uid ||
    "admin-fixed";
  const creatorName =
    currentUser?.name ||
    currentUser?.data?.name ||
    auth.currentUser?.displayName ||
    "Admin";

  const uniqueId = `schedule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Deep clone selected products to guarantee total independence from master schedule
  const clonedProducts: MasterScheduleProduct[] = (masterSchedule.selectedProducts || []).map((p) => ({
    brandName: p.brandName || "",
    marathiName: p.marathiName || "",
    companyName: p.companyName || "",
    composition: p.composition || p.activeIngredients || "",
    dose: p.dose || "",
    doseSpray: p.doseSpray || "",
    doseDrip: p.doseDrip || "",
    modeOfAction: p.modeOfAction || "",
  }));

  const payload = {
    id: uniqueId,
    farmerId: String(farmer.id || farmer.mobile || ""),
    farmerName: farmer.name || "",
    cropId: String(plot.cropId || plot.cropIndex),
    cropName: plot.cropName || masterSchedule.cropName,
    varietyName: plot.variety || masterSchedule.variety || "",
    day: String(masterSchedule.dayNo ?? ""),
    dayNo: Number(masterSchedule.dayNo ?? 0),
    scheduleDate: scheduleDate,
    method: masterSchedule.method || "फवारणी",
    otherMethod: masterSchedule.otherMethod || "",
    stage: masterSchedule.stage || "",
    selectedProducts: clonedProducts,
    notes: masterSchedule.notes || "",
    done: false,
    doneAt: null,
    approvalStatus: isAdmin ? "approved" : "pending",
    createdBy: creatorName,
    createdByUserId: creatorId,
    updatedByUserId: creatorId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Write directly to 'schedules' collection using established production saveItem
  try {
    const savedId = await saveItem("schedules", payload, uniqueId);
    if (!savedId) {
      throw new Error("Failed to confirm schedule ID from Firestore.");
    }
  } catch (writeErr) {
    console.error(`[masterScheduleService] Firestore write rejected for schedule ${uniqueId}:`, writeErr);
    throw writeErr;
  }

  // Activity Log
  try {
    const logEntry = {
      type: "create",
      category: "schedule",
      description: `Applied master schedule Day ${masterSchedule.dayNo} to ${farmer.name} (${plot.displayLabel})`,
      targetId: uniqueId,
      userId: creatorId,
      userName: creatorName,
      timestamp: Date.now(),
    };
    await saveItem("activity-logs", logEntry);
  } catch (logErr) {
    console.warn("Failed to log activity for applyMasterScheduleToPlot:", logErr);
  }

  return { uniqueId, schedule: payload };
}

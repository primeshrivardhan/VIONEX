export const COMPANY_MAP: { [key: string]: string } = {
  "mahafeed": "Mahafeed Speciality Fertilizers India Pvt. Ltd.",
  "multiplex": "Multiplex Group",
  "mahadhan": "Mahadhan AgriTech Limited",
  "iffco": "Indian Farmers Fertiliser Cooperative Limited (IFFCO)",
  "rcf": "Rashtriya Chemicals & Fertilizers Limited (RCF)",
  "indofil": "Indofil Industries Limited",
  "rallis": "Rallis India Limited",
  "tata rallis": "Rallis India Limited",
  "syngenta": "Syngenta India Limited",
  "bayer": "Bayer CropScience Limited",
  "upl": "UPL Limited",
  "pi industries": "PI Industries Limited",
  "sumitomo": "Sumitomo Chemical India Limited",
  "dhanuka": "Dhanuka Agritech Limited",
  "fmc": "FMC India Pvt. Ltd.",
  "basf": "BASF India Limited",
  "corteva": "Corteva Agriscience India",
  "aries": "Aries Agro Limited",
  "crystal": "Crystal Crop Protection Ltd.",
  "best agrolife": "Best Agrolife Ltd.",
  "insecticides india": "Insecticides (India) Limited",
  "excel": "Excel Industries Limited",
  "excel crop care": "Excel Industries Limited",
  "biostadt": "Biostadt India Limited",
  "godrej": "Godrej Agrovet Limited"
};

export function standardizeCompanyName(name: string): string[] {
  if (!name) return [];
  const parts = name.split(/[\/]/).map(p => p.trim());
  return parts.map(part => {
    const lower = part.toLowerCase();
    for (const [key, val] of Object.entries(COMPANY_MAP)) {
      if (lower === key || lower.includes(key)) {
        return val;
      }
    }
    // Capitalize first letter of words as fallback
    return part.replace(/\b\w/g, c => c.toUpperCase());
  });
}

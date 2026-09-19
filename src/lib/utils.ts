export function translateCompositionToMarathi(text: string): string {
  if (!text) return "";
  
  // Standard mapping of chemical terms to Marathi
  const replacements: { [key: string]: string } = {
    "chlorantraniliprole": "क्लोरँट्रानिलीप्रोल",
    "lambda cyhalothrin": "लॅम्बडा सायहॅलोथ्रीन",
    "flubendiamide": "फ्लुबेंडियामाईड",
    "tebuconazole": "टेबुकॉनाझोल",
    "trifloxystrobin": "ट्रायफ्लोक्सिस्ट्रोबिन",
    "carbendazim": "कार्बेंडाझिम",
    "mancozeb": "मँकोझेब",
    "flonicamid": "फ्लोनिकामाईड",
    "cyantraniliprole": "सायनट्रानिलीप्रोल",
    "gibberellic acid": "जिबरेलिक ॲसिड",
    "chelated zinc": "चिलेटेड झिंक",
    "sulfur": "सल्फर",
    "sulphur": "सल्फर",
    "acetamiprid": "ॲसिटामीप्रिड",
    "imidacloprid": "इमिडाक्लोप्रिड",
    "fipronil": "फिप्रोनिल",
    "emamectin benzoate": "इमामेक्टिन बेंझोएट",
    "profenofos": "प्रोफेनोफॉस",
    "cypermethrin": "सायपरमेथ्रिन",
    "thiamethoxam": "थायमेथोक्साम",
    "azoxystrobin": "अझॉक्सीस्ट्रोबिन",
    "difenoconazole": "डायफेनोकोनाझोल",
    "hexaconazole": "हेक्साकोनाझोल",
    "propiconazole": "प्रोपिकोनाझोल",
    "metalaxyl": "मेटालेक्सिल",
    "copper oxychloride": "कॉपर ऑक्सिक्लोराईड",
    "streptocycline": "स्ट्रिप्टोसायक्लीन",
    "humic acid": "ह्युमिक ॲसिड",
    "fulvic acid": "फुलविक ॲसिड",
    "amino acid": "अमीनो ॲसिड",
    "seaweed extract": "सीवीड एक्सट्रॅक्ट (समुद्री शेवाळ)",
    "potassium phosphite": "पोटॅशियम फॉस्फाईट",
    "micronutrients": "सूक्ष्म अन्नद्रव्ये",
    "boron": "बोरॉन",
    "calcium": "कॅल्शियम",
    "magnesium": "मॅग्नेशियम",
    "nitrogen": "नायट्रोजन (नत्र)",
    "phosphorus": "फॉस्फरस (स्फुरद)",
    "potassium": "पोटॅशियम (पालाश)",
    "zinc": "झिंक (जस्त)",
    "iron": "आयर्न (लोह)",
    "manganese": "मँगनीज",
    "silicon": "सिलिकॉन",
    "alpha naphthyl acetic acid": "अल्फा नॅफ्थिल ॲसिटिक ॲसिड",
    "spinetoram": "स्पायनेटोरम",
    "diafenthiuron": "डायफेन्थियुरॉन",
    "buprofezin": "बुप्रोफेझिन",
    "abamectin": "अबामायसिन",
    "validamycin": "व्हॅलिडामायसिन",
    "tricyclazole": "ट्रायसायक्लाझोल",
    "chlorpyriphos": "क्लोरपायरीफॉस",
    "monocrotophos": "मोनोक्रोटोफॉस",
    "dimethoate": "डायमेथोएट",
    "neem oil": "कडुनिंब तेल (नीम ऑइल)",
    "bio": "बायो",
    "organic": "सेंद्रिय"
  };

  // Standard abbreviations mapping
  const abbrevReplacements: { [key: string]: string } = {
    "sc": "एससी",
    "ec": "ईसी",
    "wp": "डब्ल्यूपी",
    "wg": "डब्ल्यूजी",
    "wdg": "डब्ल्यूडीजी",
    "sg": "एसजी",
    "sp": "एसपी",
    "sl": "एसएल",
    "od": "ओडी",
    "zc": "झेडसी",
    "fs": "एफएस",
    "gr": "जीआर",
    "as": "एएस",
    "w/w": "वजन/वजन",
    "w/v": "वजन/कदम"
  };

  const englishDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const marathiDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  
  let translated = text.toLowerCase();
  
  // Replace long words first
  const sortedReplacementKeys = Object.keys(replacements).sort((a,b) => b.length - a.length);
  for (const key of sortedReplacementKeys) {
    const regex = new RegExp("\\b" + key + "\\b", "g");
    translated = translated.replace(regex, replacements[key]);
  }
  
  // Replace abbreviations
  const sortedAbbrevKeys = Object.keys(abbrevReplacements).sort((a,b) => b.length - a.length);
  for (const key of sortedAbbrevKeys) {
    const regex = new RegExp("\\b" + key + "\\b", "g");
    translated = translated.replace(regex, abbrevReplacements[key]);
  }

  // Convert English numbers to Marathi numbers inside the translated text
  for (let i = 0; i < 10; i++) {
    translated = translated.replace(new RegExp(englishDigits[i], "g"), marathiDigits[i]);
  }

  return translated.split(" ").map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}

export function translateDoseToEnglish(text: string): string {
  if (!text) return "";
  
  // If text has English dose format inside parentheses, like (1-1.5 gm/Ltr) or (1-2 kg/Acre),
  // extract and use that directly to avoid double displaying Marathi + English.
  const parenMatch = text.match(/\(([^)]*(?:gm|ml|kg|ltr|pump|acre|g|l|pcs)[^)]*)\)/i);
  if (parenMatch) {
    return parenMatch[1].trim();
  }

  let translated = text.toLowerCase().trim();

  // Convert Marathi digits to English digits
  const marathiDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  const englishDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  for (let i = 0; i < 10; i++) {
    translated = translated.replace(new RegExp(marathiDigits[i], "g"), englishDigits[i]);
  }

  const replacements: { [key: string]: string } = {
    "मिली/लिटर": "ml/Ltr",
    "मिली/लीटर": "ml/Ltr",
    "मिली प्रति लिटर": "ml/Ltr",
    "मिली प्रति लीटर": "ml/Ltr",
    "मिली. प्रति लिटर": "ml/Ltr",
    "मिली. प्रति लीटर": "ml/Ltr",
    "मिली / लिटर": "ml/Ltr",
    "मिली / )लीटर": "ml/Ltr",
    "मिली.": "ml",
    "मिली": "ml",
    "ग्रॅम/लिटर": "gm/Ltr",
    "ग्रॅम/लीटर": "gm/Ltr",
    "ग्रॅम प्रति लिटर": "gm/Ltr",
    "ग्रॅम प्रति लीटर": "gm/Ltr",
    "ग्रॅम. प्रति लिटर": "gm/Ltr",
    "ग्रॅम. प्रति लीटर": "gm/Ltr",
    "ग्रॅम / लिटर": "gm/Ltr",
    "ग्रॅम / )लीटर": "gm/Ltr",
    "ग्रॅम/पंप": "gm/Pump",
    "ग्रॅम/एकर": "gm/Acre",
    "ग्रॅम / एकर": "gm/Acre",
    "ग्रॅम.": "gm",
    "ग्रॅम": "gm",
    "ग्राम/लिटर": "gm/Ltr",
    "ग्राम/लीटर": "gm/Ltr",
    "ग्राम प्रति लिटर": "gm/Ltr",
    "ग्राम प्रति लीटर": "gm/Ltr",
    "ग्राम. प्रति लिटर": "gm/Ltr",
    "ग्राम. प्रति लीटर": "gm/Ltr",
    "ग्राम / लिटर": "gm/Ltr",
    "ग्राम / )लीटर": "gm/Ltr",
    "ग्राम/पंप": "gm/Pump",
    "ग्राम/एकर": "gm/Acre",
    "ग्राम / एकर": "gm/Acre",
    "ग्राम.": "gm",
    "ग्राम": "gm",
    "किलो/एकर": "kg/Acre",
    "किलो / एकर": "kg/Acre",
    "किलो प्रति एकर": "kg/Acre",
    "किलो प्रति एकड़": "kg/Acre",
    "किलो.": "kg",
    "किलो": "kg",
    "लिटर/एकर": "Ltr/Acre",
    "लिटर / एकर": "Ltr/Acre",
    "लिटर प्रति एकर": "Ltr/Acre",
    "लिटर प्रति एकड़": "Ltr/Acre",
    "लीटर/एकर": "Ltr/Acre",
    "लीटर/एकड़": "Ltr/Acre",
    "लीटर/एकड": "Ltr/Acre",
    "लिटर.": "Ltr",
    "लिटर": "Ltr",
    "लीटर": "Ltr",
    "एकड़": "Acre",
    "एकर": "Acre",
    "एकड": "Acre",
    "मिली/एकर": "ml/Acre",
    "मिली / एकर": "ml/Acre",
    "मिली प्रति एकर": "ml/Acre",
    "ते": "to",
    "किंवा": "or",
    "पंप": "Pump",
    "पाणी": "Water",
    "प्रमाण": "Dose",
    "प्रति": "per",
    "बियाणे": "Seed",
    "प्रति १५ लीटर पंप": "per 15 Ltr Pump",
    "प्रति १५ लिटर पंप": "per 15 Ltr Pump",
    "प्रति 15 लीटर पंप": "per 15 Ltr Pump",
    "प्रति 15 लिटर पंप": "per 15 Ltr Pump",
    "प्रति १५ लीटर": "per 15 Ltr",
    "प्रति १५ लिटर": "per 15 Ltr",
    "प्रति 15 लीटर": "per 15 Ltr",
    "प्रति 15 लिटर": "per 15 Ltr"
  };

  // Sort keys by length in descending order to avoid partial matching issues
  const keys = Object.keys(replacements).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedKey, "g");
    translated = translated.replace(regex, replacements[key]);
  }

  return translated;
}

export function translateMarathiToEnglish(text: string): string {
  if (!text) return "";
  let translated = text.toLowerCase().trim();

  // Basic Marathi to English mapping for agricultural terms
  const replacements: { [key: string]: string } = {
    "सोयाबीन": "Soybean",
    "कापूस": "Cotton",
    "मिरची": "Chilli",
    "टोमॅटो": "Tomato",
    "वांगी": "Brinjal",
    "कांदा": "Onion",
    "द्राक्षे": "Grapes",
    "डाळिंब": "Pomegranate",
    "भाजीपाला": "Vegetables",
    "फळपिके": "Fruit Crops",
    "अन्नधान्य": "Food Grains",
    "पिके": "Crops",
    "मावा": "Aphids",
    "तुडतुडे": "Jassids",
    "फुलकिडे": "Thrips",
    "पाने खाणारी अळी": "Leaf Eating Caterpillar",
    "लष्करी अळी": "Armyworm",
    "शेंगा पोखरणारी अळी": "Pod Borer",
    "करपा": "Leaf Spot / Blight",
    "भुरी": "Powdery Mildew",
    "तांबेरा": "Rust",
    "मूळकुज": "Root Rot",
    "सुकवा": "Wilt",
    "मर": "Wilt",
    "बुरशीजन्य": "Fungal",
    "रोग": "Diseases",
    "रस शोषक कीड": "Sucking Pests",
    "तण": "Weeds",
    "लव्हाळा": "Nutgrass",
    "हरळी": "Bermuda Grass",
    "गवत": "Grass",
    "लागू नाही": "Not Applicable",
    "माहिती उपलब्ध नाही": "Information Not Available",
    "प्रतिबंधक": "Preventive",
    "स्पेशालिस्ट शिफारस": "Specialist Recommendation",
    "सकाळी लवकर": "Early Morning",
    "संध्याकाळी उशिरा": "Late Evening",
    "पाण्यात": "In Water",
    "वापरावे": "Use",
    "अंदाजे": "Approximate",
    "किंमत": "Price",
    "नोंदणी": "Registration",
    "अधिकृत": "Official",
    "माहिती": "Information",
    "बुरशीनाशक": "Fungicide",
    "कीटकनाशक": "Insecticide",
    "तणनाशक": "Herbicide",
    "खत": "Fertilizer",
    "पोषक": "Nutrient / Tonic",
    "संप्रेरक": "Plant Growth Regulator",
    "सक्रीय": "Active",
    "घटक": "Ingredient / Composition",
    "स्पर्शजन्य": "Contact",
    "अंतरप्रवाही": "Systemic",
    "आणि": "and",
    "व": "and",
    "तूर": "Pigeon Pea (Tur)",
    "हरभरा": "Chickpea (Gram)",
    "मूग": "Green Gram (Moong)",
    "उडीद": "Black Gram (Urad)",
    "गहू": "Wheat",
    "भात": "Rice (Paddy)",
    "ऊस": "Sugarcane",
    "पांढरी माशी": "Whitefly",
    "अळी": "Caterpillar / Larva",
    "डावणी": "Downy Mildew",
    "माठ": "Pigweed",
    "चाकवत": "Bathua",
    "दुधी": "Milkweed",
    "गाजर गवत": "Parthenium",
    "फवारणी": "Spray",
    "ठिबक": "Drip",
    "आळवणी": "Drenching",
    "जमिनीत": "Basal / Soil",
    "मात्रा": "Dose",
    "प्रमाण": "Dose / Quantity"
  };

  const keys = Object.keys(replacements).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const regex = new RegExp(key, "g");
    translated = translated.replace(regex, replacements[key]);
  }

  // Capitalize first letter
  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

export function formatDualDisplay(english: string, marathi: string): string {
  if (!english && !marathi) return "Information Unavailable (माहिती उपलब्ध नाही)";
  if (!english) return marathi;
  if (!marathi || english.toLowerCase() === marathi.toLowerCase()) return english;
  
  // If the string already contains parentheses, don't double wrap
  if (english.includes("(") && english.includes(")")) return english;
  
  return `${english} (${marathi})`;
}

export function translateEnglishToMarathi(text: string): string {
  if (!text) return "";
  const lower = text.toLowerCase().trim();
  
  // Inverse mapping from translateMarathiToEnglish
  const mapping: { [key: string]: string } = {
    "soybean": "सोयाबीन",
    "cotton": "कापूस",
    "chilli": "मिरची",
    "tomato": "टोमॅटो",
    "brinjal": "वांगी",
    "onion": "कांदा",
    "vegetables": "भाजीपाला",
    "grapes": "द्राक्षे",
    "pomegranate": "डाळिंब",
    "fungicide": "बुरशीनाशक",
    "insecticide": "कीटकनाशक",
    "herbicide": "तणनाशक",
    "fertilizer": "खत",
    "tonic": "टॉनिक / पोषक",
    "systemic": "अंतरप्रवाही",
    "contact": "स्पर्शजन्य",
    "acre": "एकर",
    "ltr": "लिटर",
    "gm": "ग्रॅम",
    "ml": "मिली",
    "kg": "किलो",
    "blight": "करपा",
    "rust": "तांबेरा",
    "wilt": "मर / सुकवा",
    "aphids": "मावा",
    "thrips": "फुलकिडे",
    "whitefly": "पांढरी माशी",
    "jassids": "तुडतुडे",
    "caterpillar": "अळी",
    "powdery mildew": "भुरी",
    "downy mildew": "डावणी",
    "root rot": "मूळकुज",
    "leaf spot": "पानावरील डाग",
    "sugarcane": "ऊस",
    "paddy": "भात",
    "wheat": "गहू"
  };

  if (mapping[lower]) return mapping[lower];
  
  // Try to find partial matches if it's a list
  if (text.includes(",")) {
    return text.split(",").map(t => mapping[t.trim().toLowerCase()] || t.trim()).join(", ");
  }

  return "";
}

export function getDoseLabel(method: string): string {
  const m = method?.toLowerCase() || "";
  if (m.includes("drip") || m.includes("ठिबक")) return "Drip Dose (ठिबक मात्रा)";
  if (m.includes("drench") || m.includes("आळवणी")) return "Drenching Dose (आळवणी मात्रा)";
  if (m.includes("basal") || m.includes("जमिनीत")) return "Basal Dose (जमिनीत देण्याची मात्रा)";
  return "Spray Dose (फवारणी मात्रा)";
}

/**
 * Returns a distinct and human-friendly label for a farmer's crop planting/plot.
 * Supports:
 * - Custom plotName if entered (e.g. "प्लॉट १", "घरचा मळा")
 * - Automatic plot numbering if multiple plantings of the same crop exist
 * - Variety and acreage details to guarantee visual uniqueness
 */
export function getCropPlotLabel(
  cropEntry: any,
  index: number = 0,
  allCrops: any[] = [],
  options: { includeArea?: boolean; short?: boolean } = { includeArea: true }
): string {
  if (!cropEntry) return "";
  const cropName = (cropEntry.crop || "नोंद नाही").trim();
  const area = cropEntry.area ? `${cropEntry.area}A` : "";
  const variety = (cropEntry.variety || "").trim();
  const plotName = (cropEntry.plotName || "").trim();

  // Find how many entries of this exact crop exist for this farmer
  const sameCropEntries = (allCrops || []).filter(
    (c) => (c.crop || "").trim().toLowerCase() === cropName.toLowerCase()
  );
  const isMultiPlot = sameCropEntries.length > 1;

  // 1. If explicit plotName is provided by user (Option B)
  if (plotName) {
    if (variety && options.includeArea && area) {
      return `${cropName} - ${plotName} (${variety}, ${area})`;
    } else if (variety) {
      return `${cropName} - ${plotName} (${variety})`;
    } else if (options.includeArea && area) {
      return `${cropName} - ${plotName} (${area})`;
    }
    return `${cropName} - ${plotName}`;
  }

  // 2. If multiple plantings of the same crop exist, automatically number them
  if (isMultiPlot) {
    // Find plot index among the same crops (1, 2, 3...)
    const plotNumber =
      sameCropEntries.findIndex(
        (c) => (c.id && cropEntry.id && c.id === cropEntry.id) || c === cropEntry
      ) + 1 || (index + 1);

    const plotLabel = `प्लॉट ${plotNumber}`;

    if (variety && options.includeArea && area) {
      return `${cropName} - ${plotLabel} (${variety}, ${area})`;
    } else if (variety) {
      return `${cropName} - ${plotLabel} (${variety})`;
    } else if (options.includeArea && area) {
      return `${cropName} - ${plotLabel} (${area})`;
    }
    return `${cropName} - ${plotLabel}`;
  }

  // 3. Single planting of this crop
  if (variety && options.includeArea && area) {
    return `${cropName} (${variety}, ${area})`;
  } else if (options.includeArea && area) {
    return `${cropName} (${area})`;
  } else if (variety) {
    return `${cropName} (${variety})`;
  }
  return cropName;
}

export const isScheduleForFarmer = (s: any, selectedFarmerId: string, selFarmer?: any) => {
  if (!s) return false;
  const possibleIds = new Set<string>();
  if (selectedFarmerId) possibleIds.add(String(selectedFarmerId).trim());
  let mob10 = "";
  let fName = "";

  if (selFarmer) {
    if (selFarmer.id) possibleIds.add(String(selFarmer.id).trim());
    if (selFarmer.mobile) {
      const mob = String(selFarmer.mobile).trim();
      const cleanMob = mob.replace(/\D/g, "");
      mob10 = cleanMob.slice(-10);
      possibleIds.add(mob);
      possibleIds.add(cleanMob);
      possibleIds.add(mob10);
      if (mob10) {
        possibleIds.add(`91${mob10}`);
        possibleIds.add(`+91${mob10}`);
        possibleIds.add(`0${mob10}`);
      }
    }
    if (selFarmer.name) {
      fName = String(selFarmer.name).trim().toLowerCase();
    }
  } else if (selectedFarmerId) {
    const cleanMob = selectedFarmerId.replace(/\D/g, "");
    mob10 = cleanMob.slice(-10);
    possibleIds.add(cleanMob);
    possibleIds.add(mob10);
    if (mob10) {
      possibleIds.add(`91${mob10}`);
      possibleIds.add(`+91${mob10}`);
      possibleIds.add(`0${mob10}`);
    }
  }

  const sFarmerId = String(s.farmerId || "").trim();
  if (sFarmerId && possibleIds.has(sFarmerId)) {
    return true;
  }

  if (sFarmerId && !sFarmerId.toLowerCase().startsWith("farmer-")) {
    const sMob10 = sFarmerId.replace(/\D/g, "").slice(-10);
    if (sMob10 && sMob10 === mob10) return true;
  }

  if (fName && s.farmerName && String(s.farmerName).trim().toLowerCase() === fName) {
    return true;
  }

  return false;
};

export function translateModeOfActionToEnglish(text: string): string {
  if (!text) return "";
  const cleaned = text.trim();

  // If there is English text already in parentheses, extract it
  const parenthesized = cleaned.match(/\(([^)]+)\)/);
  if (parenthesized && parenthesized[1]) {
    const englishContent = parenthesized[1].trim();
    if (/^[A-Za-z0-9\s+\-/.,()]+$/.test(englishContent)) {
      return englishContent;
    }
  }

  // Exact mappings for the full sentences used in MOLECULE_TEMPLATES:
  const exactMappings: { [key: string]: string } = {
    "उत्कृष्ट आंतरप्रवाही आणि मेसोस्टेमिक कृती, जी पानांवर दीर्घकाळ राहून बुरशी वाढू देत नाही": "Excellent systemic and mesostemic action, remaining on leaves for long-term fungal control",
    "उत्कृष्ट फुलधारणा, फळांचा आकार आणि वजन वाढवण्यासाठी पोषक": "Excellent nutrient for promoting flowering, fruit size, and weight enhancement",
    "उष्णतेच्या प्रभावाने कीटकांचे अंडी आणि प्रौढ अवस्था एकाच वेळी नियंत्रित करणे": "Controls both insect eggs and adult stages simultaneously via thermal/contact effect",
    "कीटकांच्या नर्व्हस सिस्टीममध्ये अडथळा आणून त्यांना खाण्यापासून रोखणे आणि मारणे": "Disrupts the nervous system of insects, preventing feeding and causing mortality",
    "कीटकांच्या स्नायूंवर नियंत्रण ठेवून त्यांना निष्क्रिय करणे": "Controls and paralyzes insect muscles, rendering them inactive",
    "जलद शोषले जाणारे पावडर तणनाशक जे तणांना मुळापासून नष्ट करते": "Rapidly absorbed powder herbicide that destroys weeds from the roots",
    "झाडांची उंची नियंत्रण करणे आणि खोड जाड करून फुटव्यांना बळ देणे": "Regulates plant height, thickens the stem, and promotes robust branching",
    "तांब्याच्या कणांद्वारे बुरशी व जिवाणूंच्या प्रथिनांचे विघटन करणे": "Copper particles denature fungal and bacterial proteins",
    "दुहेरी ताकदीने रसशोषक कीटक व मातीतील कीटकांवर नियंत्रण": "Dual action control against sucking pests and soil-borne insects",
    "नैसर्गिक जिवाणू संवर्धनातून तयार केलेले अत्याधुनिक कीटकनाशक जे अळी आणि थ्रिप्स नियंत्रणात काम करते": "Advanced bacterial-fermented insecticide highly effective against caterpillars and thrips",
    "परागकण निर्मिती, फलधारणा आणि कॅल्शियम वहन सुधारणे": "Improves pollen formation, fruit setting, and calcium transport",
    "पानांच्या पृष्ठभागावर संरक्षक स्तर तयार करून बुरशीच्या बिजाणूंचे उगवण थांबवणे": "Creates a protective barrier on leaf surfaces to prevent fungal spore germination",
    "पानांद्वारे मुळांपर्यंत पोहोचून तण पूर्णपणे वाळवणे (बिननिवडक तणनाशक)": "Absorbed through leaves to roots, completely drying weeds (Non-selective herbicide)",
    "पानांमध्ये क्लोरोफिल (हरितद्रव्य) प्रमाण वाढवणे": "Increases chlorophyll content in the leaves",
    "पानांमध्ये त्वरित शोषले जाणारे औषध जे डाउन मिल्ड्यू व कुज रोगांना अटकाव करते": "Rapidly absorbed systemic action preventing downy mildew and rot diseases",
    "पिकाची अतिरिक्त शाकीय (पानांची) वाढ थांबवून तिचे रूपांतर फुलांमध्ये करणे": "Inhibits excessive vegetative growth, redirecting plant energy to flowering",
    "पिकाची प्रतिकारशक्ती वाढवणे, सेंद्रिय अन्नद्रव्यांचे शोषण आणि मूळ वाढवणे": "Enhances crop immunity, organic nutrient absorption, and root development",
    "पिकाच्या शाकीय वाढीसाठी आणि मुळांच्या विकासासाठी पोषक घटक": "Nutrient for vegetative growth and root development",
    "पिकाच्या संतुलित वाढीसाठी सर्व आवश्यक सूक्ष्म मूलद्रव्यांचा एकत्रित पुरवठा": "Provides a balanced supply of all essential micronutrients for optimal crop growth",
    "पिकात संप्रेरकांची वाढ उत्तेजित करून मादी फुलांचे प्रमाण वाढवणे": "Stimulates plant hormones to increase the ratio of female flowers",
    "पिकांमध्ये संप्रेरक आणि प्रथिनांच्या निर्मितीला गती देणे": "Accelerates hormone and protein synthesis in crops",
    "पिकाला जलद आणि भरपूर नत्राचा पुरवठा करून शाकीय वाढ करणे": "Provides rapid and abundant nitrogen supply for vegetative growth",
    "पेशींचे विभाजन व लांबी वाढवणे, फुले व फळांची संख्या वाढवणे": "Promotes cell division and elongation, increasing flowers and fruits count",
    "पेशींच्या भिंती मजबूत करणे आणि फळांची साल फुटणे टाळणे": "Strengthens cell walls and prevents fruit cracking",
    "पोटविष आणि स्पर्शजन्य कीटकनाशक जे अळ्यांच्या मज्जासंस्थेला अर्धांगवायू करते": "Stomach and contact insecticide that paralyzes the nervous system of caterpillars",
    "प्रकाश संश्लेषण प्रक्रियेत अडथळा निर्माण करून तण मारणे": "Kills weeds by disrupting their photosynthetic process",
    "फक्त अरुंद पानांच्या (एकदल) तणांच्या वाढीचा केंद्रबिंदू रोखून त्यांना वाळवणे": "Specifically targets narrow-leaved (monocot) weeds by inhibiting the growing point",
    "फळांची गुणवत्ता, साखर, चव, रंग आणि साठवणूक क्षमता वाढवणे": "Enhances fruit quality, sugar content, taste, color, and shelf life",
    "फळांची फुगवण आणि प्रतिकूल हवामानात पिकाला ताण सहन करण्याची क्षमता देणे": "Aids fruit sizing and builds tolerance to adverse weather conditions",
    "फुलधारणेला प्रोत्साहन आणि फुलांची गळ थांबवणे": "Promotes flowering and prevents flower drop",
    "फुलधारणेसाठी आणि मुळांच्या सशक्त वाढीसाठी उत्कृष्ट स्फुरद स्त्रोत": "Excellent phosphorus source for flowering and robust root establishment",
    "बुरशीच्या अर्गोस्टेरॉल निर्मितीमध्ये अडथळा आणून बुरशी नष्ट करणे": "Disrupts ergosterol biosynthesis to eliminate fungi",
    "बुरशीच्या पेशींची ऊर्जा रोखून बुरशीचा प्रसार वाढण्यापूर्वीच थांबवणे": "Inhibits fungal cell energy, preventing the spread of fungal disease",
    "मध्यवर्ती मज्जासंस्थेमध्ये अडथळा आणून स्पर्शजन्य व पोटविष म्हणून काम करणे": "Acts as a contact and stomach poison by disrupting the central nervous system",
    "मुळांच्या जोमदार वाढीसाठी फॉस्फरस, कॅल्शियम आणि सल्फर पुरवणे": "Supplies phosphorus, calcium, and sulfur for robust root development",
    "रस शोषक कीटकांच्या मज्जासंस्थेवर आघात करून त्यांना नष्ट करणे": "Attacks the nervous system of sucking pests to eliminate them",
    "रसशोषक कीटकांच्या मज्जासंस्थेवर जलद परिणाम करणारे अंतरप्रवाही औषध": "Fast-acting systemic action on the nervous system of sucking pests",
    "रसशोषक कीटकांच्या सुईसारख्या सुंडेला तात्काळ अर्धांगवायू करून त्यांना भुकेने मारणे": "Instantly paralyzes the sucking mouthparts of pests, leading to starvation",
    "स्पर्शजन्य आणि अंतरप्रवाही अशा दुहेरी पद्धतीने बुरशीच्या वाढीला रोखणे": "Dual action (contact and systemic) that inhibits fungal growth",
    "हरितद्रव्य निर्मिती वाढवणे आणि पानांमधील अन्न तयार करण्याची क्रिया वेगवान करणे": "Increases chlorophyll synthesis and accelerates photosynthesis in leaves"
  };

  if (exactMappings[cleaned]) {
    return exactMappings[cleaned];
  }

  // Fallback to translateMarathiToEnglish
  return translateMarathiToEnglish(cleaned);
}

export function formatModeOfAction(text: string): string {
  if (!text) return "";
  const cleaned = text.trim();

  // Strip all Devanagari characters (Marathi)
  let englishOnly = cleaned.replace(/[\u0900-\u097F]+/g, "");

  // Clean up punctuation, spaces, and empty brackets/parentheses that may be left
  englishOnly = englishOnly
    .replace(/\(\s*\)/g, "") // remove empty parentheses ()
    .replace(/\[\s*\]/g, "") // remove empty brackets []
    .replace(/\{\s*\}/g, "") // remove empty curly brackets {}
    .replace(/\s+/g, " ")    // collapse multiple spaces
    .replace(/\s*([+/&,-])\s*\1/g, "$1") // collapse duplicate symbols
    .trim();

  // If there are still English characters left, clean up stray leading/trailing punctuation and return
  if (/[a-zA-Z]/.test(englishOnly)) {
    englishOnly = englishOnly
      .replace(/^[^a-zA-Z0-9(]+/, "")
      .replace(/[^a-zA-Z0-9)]+$/, "")
      .trim();
    return englishOnly;
  }

  // If no English characters, it was purely Marathi. Translate it.
  return translateModeOfActionToEnglish(cleaned);
}

export function standardizeCategory(cat: string): string {
  if (!cat) return "Insecticide (कीटकनाशक)";
  const lower = cat.toLowerCase();
  
  if (lower.includes("insect") || lower.includes("कीटकनाशक")) {
    if (lower.includes("bio") || lower.includes("जैविक")) return "Bio Pesticide (जैविक कीटकनाशक)";
    return "Insecticide (कीटकनाशक)";
  }
  if (lower.includes("fungi") || lower.includes("बुरशीनाशक")) {
    return "Fungicide (बुरशीनाशक)";
  }
  if (lower.includes("herb") || lower.includes("तणनाशक")) {
    return "Herbicide (तणनाशक)";
  }
  if (lower.includes("water soluble") || lower.includes("विद्राव्य")) {
    return "Water Soluble Fertilizer (विद्राव्य खते)";
  }
  if (lower.includes("micronutrient") || lower.includes("सूक्ष्म")) {
    return "Micronutrient (सूक्ष्म अन्नद्रव्ये)";
  }
  if (lower.includes("growth regulator") || lower.includes("pgr") || lower.includes("संप्रेरक") || lower.includes("वाढ नियामक")) {
    return "Plant Growth Regulator (PGR) (संप्रेरके)";
  }
  if (lower.includes("bio fertilizer") || (lower.includes("जैविक") && lower.includes("खत"))) {
    return "Bio Fertilizer (जैविक खत)";
  }
  if (lower.includes("fertilizer") || lower.includes("खत")) {
    return "Fertilizer (खत)";
  }
  if (lower.includes("treatment") || lower.includes("बीजप्रक्रिया")) {
    return "Seed Treatment (बीजप्रक्रिया)";
  }
  if (lower.includes("seed") || lower.includes("बियाणे")) {
    return "Seeds (बियाणे)";
  }
  if (lower.includes("sticker") || lower.includes("spreader") || lower.includes("स्टिकर") || lower.includes("स्प्रेडर") || lower.includes("adjuvant")) {
    return "Adjuvant / Sticker / Spreader (स्टिकर/स्प्रेडर)";
  }
  if (lower.includes("organic") || lower.includes("सेंद्रिय")) {
    return "Organic Product (सेंद्रिय उत्पादन)";
  }
  if (lower.includes("trap") || lower.includes("pheromone") || lower.includes("सापळे")) {
    return "Trap / Pheromone (सापळे)";
  }
  if (lower.includes("nemato") || lower.includes("सूत्रकृमी")) {
    return "Nematocide (सूत्रकृमीनाशक)";
  }
  if (lower.includes("rodent") || lower.includes("उंदीर")) {
    return "Rodenticide (उंदीरनाशक)";
  }
  if (lower.includes("mollusc") || lower.includes("गोगलगाय")) {
    return "Molluscicide (गोगलगायनाशक)";
  }
  
  return "Other (इतर)";
}


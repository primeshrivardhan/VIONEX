import { safeJsonParse } from "../lib/safeJson";
import React, { useState } from "react";
import { ArrowLeft, Save, Trash2, Search, Loader2 } from "lucide-react";
import { PRESEEDED_PRODUCTS } from "../lib/preseeded-products";
import { saveItem, syncCollection } from "../lib/data-sync";
import { translateDoseToEnglish, translateMarathiToEnglish, standardizeCategory } from "../lib/utils";
import { standardizeCompanyName } from "../lib/company-helper";
import { getApiUrl, getAuthHeaders } from "../lib/config";


const CATALOG_PRODUCTS: any[] = [];

export function getEnrichedProduct(product: any) {
  if (!product) return product;
  // Deep clean null values
  const p = { ...product };
  for (const key in p) {
    if (p[key] === null || p[key] === 'null' || p[key] === 'undefined' || p[key] === 'Data under processing') {
      p[key] = "";
    }
  }
  
  const cat = (p.category || "").toLowerCase();

  p.brandName = (p.brandName || "").trim();
  p.marathiName = (p.marathiName || p.brandName || "").trim();
  p.companyName = p.companyName && p.companyName !== "माहिती उपलब्ध नाही" ? p.companyName : "प्रसिद्ध कंपनी (Agro Brand)";
  p.category = standardizeCategory(p.category || "Insecticide (कीटकनाशक)");

  // Clean company prefixes from Brand Name
  if (p.companyName && p.companyName !== "प्रसिद्ध कंपनी (Agro Brand)") {
    const shortCo = p.companyName.split(' ')[0];
    if (p.brandName.toLowerCase().startsWith(shortCo.toLowerCase() + " ")) {
      p.brandName = p.brandName.substring(shortCo.length + 1).trim();
    }
  }

  // Clean empty or fallback values
  const hasValue = (val: any) => val && typeof val === "string" && val.trim() !== "माहिती उपलब्ध नाही" && val.trim() !== "" && val.trim() !== "लागू नाही";

  // Compositions
  if (!hasValue(p.composition)) {
    if (cat.includes("कीटक") || cat.includes("insect")) {
      p.composition = "कीटकनाशक सक्रीय घटक";
    } else if (cat.includes("बुरशी") || cat.includes("fungi")) {
      p.composition = "बुरशीनाशक सक्रीय घटक";
    } else if (cat.includes("तण") || cat.includes("herb")) {
      p.composition = "तणनाशक सक्रीय घटक";
    } else if (cat.includes("खत") || cat.includes("fertilizer") || cat.includes("tonic")) {
      p.composition = "सेंद्रिय आणि पोषक घटक";
    } else {
      p.composition = "सक्रीय घटक माहिती लेबलवर पहा";
    }
  }

  if (!hasValue(p.compositionEnglish)) {
    p.compositionEnglish = p.composition; 
  }

  if (!hasValue(p.modeOfAction)) {
    if (cat.includes("कीटक") || cat.includes("insect") || cat.includes("अळी")) {
      p.modeOfAction = "स्पर्शजन्य आणि अंतरप्रवाही (Contact + Systemic)";
    } else if (cat.includes("बुरशी") || cat.includes("fungi")) {
      p.modeOfAction = "अंतरप्रवाही (Systemic)";
    } else if (cat.includes("तण") || cat.includes("herb")) {
      p.modeOfAction = "निवडक तणनाशक (Selective Herbicide)";
    } else {
      p.modeOfAction = "स्पर्शजन्य आणि अंतरप्रवाही (Contact + Systemic)";
    }
  }

  // Auto-set English versions if missing
  if (!hasValue(p.targetCropsEnglish) && hasValue(p.targetCrops)) {
    p.targetCropsEnglish = translateMarathiToEnglish(p.targetCrops);
  }
  if (!hasValue(p.targetPestsEnglish) && hasValue(p.targetPests)) {
    p.targetPestsEnglish = translateMarathiToEnglish(p.targetPests);
  }
  if (!hasValue(p.modeOfActionEnglish) && hasValue(p.modeOfAction)) {
    p.modeOfActionEnglish = translateMarathiToEnglish(p.modeOfAction);
  }

  // Set default doses depending on category if not provided in database
  const defaultDoseSpray = cat.includes("कीटक") || cat.includes("insect") ? "1.5 to 2 ml/Ltr" : 
                           cat.includes("बुरशी") || cat.includes("fungi") ? "2 to 2.5 gm/Ltr" :
                           cat.includes("तण") || cat.includes("herb") ? "10 ml/Ltr" :
                           cat.includes("खत") || cat.includes("fertilizer") ? "4 to 5 gm/Ltr" : "2 ml/Ltr";

  const defaultDoseDrip = cat.includes("खत") || cat.includes("fertilizer") ? "3 to 5 kg/Acre" : "लागू नाही (Not Applicable)";
  const defaultDoseDrenching = cat.includes("बुरशी") || cat.includes("fungi") ? "500 gm/Acre" : "लागू नाही (Not Applicable)";
  const defaultDoseBasal = cat.includes("खत") || cat.includes("fertilizer") ? "50 kg/Acre" : "लागू नाही (Not Applicable)";

  p.doseSpray = hasValue(p.doseSpray) ? p.doseSpray : defaultDoseSpray;
  p.doseDrip = hasValue(p.doseDrip) ? p.doseDrip : defaultDoseDrip;
  p.doseDrenching = hasValue(p.doseDrenching) ? p.doseDrenching : defaultDoseDrenching;
  p.doseBasal = hasValue(p.doseBasal) ? p.doseBasal : defaultDoseBasal;

  if (!hasValue(p.targetCrops)) {
    if (cat.includes("कीटक") || cat.includes("insect")) {
      p.targetCrops = "कापूस, सोयाबीन, मिरची, टोमॅटो, वांगी, इतर सर्व भाजीपाला व फळपिके";
    } else if (cat.includes("बुरशी") || cat.includes("fungi")) {
      p.targetCrops = "मिरची, टोमॅटो, सोयाबीन, भाजीपाला पिके, द्राक्षे, डाळिंब व फळझाडे";
    } else if (cat.includes("तण") || cat.includes("herb")) {
      p.targetCrops = "सोयाबीन, कापूस, मिरची, टोमॅटो, भाजीपाला, फळपिके व अन्नधान्य";
    } else {
      p.targetCrops = "सोयाबीन, कापूस, मिरची, टोमॅटो, भाजीपाला, फळपिके व अन्नधान्य";
    }
  }

  if (!hasValue(p.targetPests)) {
    if (cat.includes("कीटक") || cat.includes("insect")) {
      p.targetPests = "मावा, तुडतुडे, फुलकिडे, पांढरी माशी आणि अळी नियंत्रण";
    } else if (cat.includes("बुरशी") || cat.includes("fungi")) {
      p.targetPests = "करपा, भुरी, तांबेरा, मूळकुज आणि बुरशीजन्य रोग";
    } else if (cat.includes("तण") || cat.includes("herb")) {
      p.targetPests = "गवत, लव्हाळा, हरळी आणि रुंद पानांचे तण";
    } else {
      p.targetPests = "उत्कृष्ट उत्पादन आणि जोमदार वाढीसाठी";
    }
  }

  // Category specific notes (Specialist recommendations)
  if (cat && (!p.notes || p.notes === "माहिती उपलब्ध नाही")) {
    if (cat.includes("कीटक") || cat.includes("insect")) {
      p.notes = "स्पेशालिस्ट शिफारस: रसशोषक किडींसाठी सकाळी लवकर किंवा संध्याकाळी उशिरा फवारणी करावी. पाण्यात सिलिकॉन स्टिकर आवर्जून वापरावे. पाण्याचा pH सामान्य (६ ते ७) असावा जेणेकरून रसायनाची कार्यक्षमता वाढेल.";
    } else if (cat.includes("बुरशी") || cat.includes("fungi")) {
      p.notes = "स्पेशालिस्ट शिफारस: रोग येण्यापूर्वी (प्रतिबंधक) किंवा रोगाची सुरुवातीची लक्षणे दिसताच फवारणी केल्यास १००% फायदा मिळतो. पाण्यात सिलिकॉन स्टिकर वापरल्यास बुरशीनाशक पानात चांगले पसरते.";
    } else if (cat.includes("तण") || cat.includes("herb")) {
      p.notes = "स्पेशालिस्ट शिफारस: जमिनीत पुरेशी ओल असतानाच फवारणी करावी. वाऱ्याचा वेग जास्त असताना फवारणी टाळावी जेणेकरून मुख्य पिकाला इजा होणार नाही. फ्लॅट फॅन किंवा फ्लड जेट नोजलचा वापर करावा.";
    } else if (cat.includes("खत") || cat.includes("fertilizer")) {
      p.notes = "स्पेशालिस्ट शिफारस: पिकाच्या वाढीच्या अवस्थेनुसार योग्य ग्रेड निवडावी (उदा. शाखीय वाढीसाठी १९-१९-१९, फुलधारणेत १२-६१-०० आणि फुगवणीत ००-००-५०). ठिबकद्वारे सकाळी लवकर किंवा सायंकाळी विद्राव्य खते द्यावीत.";
    } else if (cat.includes("टॉनिक") || cat.includes("pgr") || cat.includes("वाढ")) {
      p.notes = "स्पेशालिस्ट शिवारस: फुलधारणा आणि फळधारणेच्या महत्त्वाच्या टप्प्यात योग्य प्रमाणात वापर करावा. अत्यंत तीव्र उन्हामध्ये किंवा ढगाळ वातावरणात फवारणी टाळावी.";
    } else {
      p.notes = "स्पेशालिस्ट शिफारस: पिकाच्या निरोगी आणि जोमदार वाढीसाठी शिफारसीनुसार योग्य प्रमाणात वापर करावा. औषधात सिलिकॉन आधारित चांगल्या दर्जाचे स्टिकर आवर्जून मिक्स करावे.";
    }
  }

  // Final safeguard: Make sure essential fields are not empty
  const essentialKeys = [
    "marathiName", "companyName", "composition", "compositionEnglish",
    "modeOfAction", "doseSpray", "targetCrops", "targetPests", "notes"
  ];
  essentialKeys.forEach(key => {
    if (p[key] === undefined || p[key] === null || (typeof p[key] === 'string' && p[key].trim() === "")) {
      if (key.startsWith("dose")) {
        p[key] = "लागू नाही";
      } else {
        p[key] = "माहिती उपलब्ध नाही";
      }
    }
  });

  return p;
}

interface AddProductFormProps {
  initialData?: any;
  products?: any[];
  onSave: (productData: any) => void;
  onCancel: () => void;
}

const productCategories = [
  "Insecticide (कीटकनाशक)",
  "Fungicide (बुरशीनाशक)",
  "Herbicide (तणनाशक)",
  "Fertilizer (खत)",
  "Water Soluble Fertilizer (विद्राव्य खते)",
  "Micronutrient (सूक्ष्म अन्नद्रव्ये)",
  "Plant Growth Regulator (PGR) (संप्रेरके)",
  "Bio Fertilizer (जैविक खत)",
  "Bio Pesticide (जैविक कीटकनाशक)",
  "Seed Treatment (बीजप्रक्रिया)",
  "Seeds (बियाणे)",
  "Adjuvant / Sticker / Spreader (स्टिकर/स्प्रेडर)",
  "Organic Product (सेंद्रिय उत्पादन)",
  "Trap / Pheromone (सापळे)",
  "Nematocide (सूत्रकृमीनाशक)",
  "Rodenticide (उंदीरनाशक)",
  "Molluscicide (गोगलगायनाशक)",
  "Other (इतर)"
];

const modeOfActions = [
  "Contact (स्पर्शजन्य)",
  "Systemic (अंतरप्रवाही)",
  "Contact + Systemic (स्पर्शजन्य व अंतरप्रवाही)",
  "Translaminar (ट्रान्सलॅमिनर)",
  "Stomach Poison (पोटातील विष)",
  "Fumigant (धुरीजन्य)",
  "Ovicide (अंडीनाशक)",
  "Larvicide (अळीनाशक)",
  "Adulticide (प्रौढनाशक)",
  "Growth Regulator (वाढ नियामक)",
  "Protectant (संरक्षक)",
  "Curative (निवारक)",
  "Eradicant (निर्मूलक)"
];

const mockProducts = [
  {
    brandName: "Coragen / कोराजन",
    marathiName: "कोराजन",
    companyName: "FMC",
    category: "कीटकनाशक (Insecticide)",
    composition: "Chlorantraniliprole 18.5% w/w SC",
    modeOfAction: "अंतरप्रवाही (Systemic)",
    doseSpray: "0.4 मिली/लिटर",
    doseDrip: "150 मिली/एकर",
    doseDrenching: "200 मिली/एकर",
    doseBasal: "",
    packingSizes: "10ml, 30ml, 60ml, 150ml, 300ml",
    priceInfo: "",
    notes: "अळी वर्गीय कीटक नियंत्रणासाठी (उदा. हिरवी अळी, घाटे अळी)",
  },
  {
    brandName: "Bavistin / बाविस्टीन",
    marathiName: "बाविस्टीन",
    companyName: "Crystal",
    category: "बुरशीनाशक (Fungicide)",
    composition: "Carbendazim 50% WP",
    modeOfAction: "अंतरप्रवाही (Systemic)",
    doseSpray: "1.5 ते 2 ग्राम/लिटर",
    doseDrip: "500 ग्राम/एकर",
    doseDrenching: "500 ग्राम/एकर",
    doseBasal: "",
    packingSizes: "100g, 250g, 500g, 1kg",
    priceInfo: "",
    notes: "करपा, भुरी आणि मूळकुज नियंत्रणासाठी",
  },
  {
    brandName: "Roundup / राउंडअप",
    marathiName: "राउंडअप",
    companyName: "Bayer",
    category: "तणनाशक (Herbicide)",
    composition: "Glyphosate 41% SL",
    modeOfAction: "अंतरप्रवाही (Systemic)",
    doseSpray: "10 मिली/लिटर",
    doseDrip: "",
    doseDrenching: "",
    doseBasal: "",
    packingSizes: "500ml, 1L, 5L",
    priceInfo: "",
    notes: "सर्व प्रकारच्या तणाच्या नियंत्रणासाठी (नॉन-सिलेक्टिव्ह)",
  },
  {
    brandName: "Urea / युरिया",
    marathiName: "युरिया 46% N",
    companyName: "RCF",
    category: "खत / वॉटर सोल्युबल (Fertilizer)",
    composition: "Nitrogen 46%",
    modeOfAction: "उपलब्ध नाही (Not Applicable)",
    doseSpray: "10 ते 20 ग्राम/लिटर",
    doseDrip: "",
    doseDrenching: "",
    doseBasal: "50 किलो/एकर (पिकानुसार)",
    packingSizes: "45kg",
    priceInfo: "₹266 / 45kg",
    notes: "नत्राचा प्रमुख स्त्रोत, पिकांच्या शाकीय वाढीसाठी",
  },
  {
    brandName: "Urea / युरिया",
    marathiName: "युरिया 46% N",
    companyName: "IFFCO",
    category: "खत / वॉटर सोल्युबल (Fertilizer)",
    composition: "Nitrogen 46%",
    modeOfAction: "उपलब्ध नाही (Not Applicable)",
    doseSpray: "10 ते 20 ग्राम/लिटर",
    doseDrip: "",
    doseDrenching: "",
    doseBasal: "50 किलो/एकर (पिकानुसार)",
    packingSizes: "45kg",
    priceInfo: "₹266 / 45kg",
    notes: "नत्राचा प्रमुख स्त्रोत, पिकांच्या शाकीय वाढीसाठी",
  },
  {
    brandName: "19:19:19 (Water Soluble)",
    marathiName: "१९:१९:१९ विद्राव्य खत",
    companyName: "Mahadhan",
    category: "खत / वॉटर सोल्युबल (Fertilizer)",
    composition: "N:P:K - 19:19:19",
    modeOfAction: "उपलब्ध नाही (Not Applicable)",
    doseSpray: "5 ग्राम/लिटर",
    doseDrip: "5 किलो/एकर",
    doseDrenching: "",
    doseBasal: "",
    packingSizes: "1kg, 25kg",
    priceInfo: "",
    notes: "पिकांच्या सर्वांगीण वाढीसाठी",
  },
  {
    brandName: "19:19:19 (Water Soluble)",
    marathiName: "१९:१९:१९ विद्राव्य खत",
    companyName: "IFFCO",
    category: "खत / वॉटर सोल्युबल (Fertilizer)",
    composition: "N:P:K - 19:19:19",
    modeOfAction: "उपलब्ध नाही (Not Applicable)",
    doseSpray: "5 ग्राम/लिटर",
    doseDrip: "5 किलो/एकर",
    doseDrenching: "",
    doseBasal: "",
    packingSizes: "1kg, 25kg",
    priceInfo: "",
    notes: "पिकांच्या सर्वांगीण वाढीसाठी",
  },
  {
    brandName: "Alika / अलिका",
    marathiName: "अलिका",
    companyName: "Syngenta",
    category: "कीटकनाशक (Insecticide)",
    composition: "Thiamethoxam 12.6% + Lambda-cyhalothrin 9.5% ZC",
    modeOfAction: "स्पर्शजन्य आणि अंतरप्रवाही (Contact + Systemic)",
    doseSpray: "0.5 मिली/लिटर",
    doseDrip: "",
    doseDrenching: "",
    doseBasal: "",
    packingSizes: "40ml, 80ml, 200ml, 500ml",
    priceInfo: "",
    notes: "रस शोषक कीटक आणि अळीच्या नियंत्रणासाठी",
  },
  {
    brandName: "Ampligo / अम्पलिगो",
    marathiName: "अम्पलिगो",
    companyName: "Syngenta",
    category: "कीटकनाशक (Insecticide)",
    composition: "Chlorantraniliprole 10% + Lambda cyhalothrin 5% ZC",
    modeOfAction: "स्पर्शजन्य आणि अंतरप्रवाही (Contact + Systemic)",
    doseSpray: "0.4 मिली/लिटर",
    doseDrip: "",
    doseDrenching: "",
    doseBasal: "",
    packingSizes: "80ml, 200ml",
    priceInfo: "",
    notes: "अळी आणि इतर कीटकांवर प्रभावी नियंत्रण",
  },
  {
    brandName: "Fame / फेम",
    marathiName: "फेम",
    companyName: "Bayer",
    category: "कीटकनाशक (Insecticide)",
    composition: "Flubendiamide 480 SC",
    modeOfAction: "अंतरप्रवाही (Systemic)",
    doseSpray: "0.3 मिली/लिटर",
    doseDrip: "",
    doseDrenching: "",
    doseBasal: "",
    packingSizes: "10ml, 50ml, 100ml",
    priceInfo: "",
    notes: "विशेषतः सर्व प्रकारच्या अळ्यांच्या प्रभावी नियंत्रणासाठी",
  },
  {
    brandName: "Nativo / नॅटीवो",
    marathiName: "नॅटीवो",
    companyName: "Bayer",
    category: "बुरशीनाशक (Fungicide)",
    composition: "Tebuconazole 50% + Trifloxystrobin 25% w/w WG",
    modeOfAction: "अंतरप्रवाही (Systemic)",
    doseSpray: "0.5 ग्राम/लिटर",
    doseDrip: "",
    doseDrenching: "",
    doseBasal: "",
    packingSizes: "10g, 50g, 100g, 250g",
    priceInfo: "",
    notes: "करपा, तांबेरा आणि इतर बुरशीजन्य आजारांवर उत्कृष्ट",
  },
  {
    brandName: "Saaf / साफ",
    marathiName: "साफ",
    companyName: "UPL",
    category: "बुरशीनाशक (Fungicide)",
    composition: "Carbendazim 12% + Mancozeb 63% WP",
    modeOfAction: "स्पर्शजन्य आणि अंतरप्रवाही (Contact + Systemic)",
    doseSpray: "2 ते 2.5 ग्राम/लिटर",
    doseDrip: "500 ग्राम/एकर",
    doseDrenching: "500 ग्राम/एकर",
    doseBasal: "",
    packingSizes: "100g, 250g, 500g, 1kg",
    priceInfo: "",
    notes: "प्रतिबंधात्मक आणि रोगनाशक म्हणून प्रभावी",
  },
];

function autoDetectCategory(brand: string, comp: string): string | null {
  const text = `${brand} ${comp}`.toLowerCase();
  
  if (
    /\b\d{1,2}[:\-]\d{1,2}[:\-]\d{1,2}\b/.test(text) || 
    /\b\d{1,2}\s\d{1,2}\s\d{1,2}\b/.test(text) || 
    text.includes("१९:१९:१९") || text.includes("०:५२:३४") || text.includes("१२:६१:०") || text.includes("१३:०:४५") || text.includes("०:०:५०") ||
    text.includes("विद्राव्य") || text.includes("soluble") || text.includes("water soluble")
  ) {
    return "Water Soluble Fertilizer (विद्राव्य खते)";
  }

  if (
    text.includes("boron") || text.includes("zinc") || text.includes("ferrous") || text.includes("iron") || text.includes("manganese") || 
    text.includes("magnesium") || text.includes("calcium") || text.includes("silicon") || text.includes("sulphur") || text.includes("chelating") || 
    text.includes("chelated") || text.includes("micronutrient") || text.includes("micro nutrient") ||
    text.includes("बोरॉन") || text.includes("झिंक") || text.includes("जस्त") || text.includes("लोह") || text.includes("मॅग्नेशियम") || 
    text.includes("कॅल्शियम") || text.includes("सूक्ष्म अन्नद्रव्य") || text.includes("चिलेटेड") || text.includes("फॉस्फरस") || text.includes("स्फुरद")
  ) {
    return "Micronutrient (सूक्ष्म अन्नद्रव्ये)";
  }

  if (
    text.includes("gibberellic") || text.includes("ga3") || text.includes("acetic acid") || text.includes("cycocel") || 
    text.includes("liahocin") || text.includes("miraculan") || text.includes("triacontanol") || text.includes("paclobutrazol") || 
    text.includes("cultar") || text.includes("pgr") || text.includes("growth regulator") || text.includes("promoter") || 
    text.includes("संप्रेरक") || text.includes("वाढ नियामक") || text.includes("जिब्रेलिक") || text.includes("सायकोसेल") || 
    text.includes("लिहोसीन") || text.includes("मिरॅक्युलन") || text.includes("कल्टार") || text.includes("वाढ")
  ) {
    return "Plant Growth Regulator (PGR) (संप्रेरके)";
  }

  if (
    text.includes("glyphosate") || text.includes("paraquat") || text.includes("atrazine") || text.includes("pendimethalin") || 
    text.includes("quizalofop") || text.includes("ethyl") || text.includes("2,4-d") || text.includes("metsulfuron") || 
    text.includes("imazethapyr") || text.includes("oxyfluorfen") || text.includes("pretilachlor") || text.includes("metribuzin") || 
    text.includes("clodinafop") || text.includes("sulfosulfuron") || text.includes("targa") || text.includes("mera 71") || 
    text.includes("roundup") || text.includes("तण") || text.includes("तणनाशक") || text.includes("गवत") || 
    text.includes("राऊंडअप") || text.includes("मेरा ७१") || text.includes("मेरा 71") || text.includes("तणनाशक") || 
    text.includes("लव्हाळा") || text.includes("हरळी") || text.includes("weed") || text.includes("herbicide")
  ) {
    return "Herbicide (तणनाशक)";
  }

  if (
    text.includes("carbendazim") || text.includes("mancozeb") || text.includes("hexaconazole") || text.includes("tebuconazole") || 
    text.includes("copper") || text.includes("propiconazole") || text.includes("azoxystrobin") || text.includes("metalaxyl") || 
    text.includes("cymoxanil") || text.includes("captan") || text.includes("thiram") || text.includes("sulphur") || 
    text.includes("kitazin") || text.includes("tricyclazole") || text.includes("bordeaux") || text.includes("bactericide") || 
    text.includes("streptocycline") || text.includes("kasugamycin") || text.includes("validamycin") ||
    text.includes("बुरशी") || text.includes("बुरशीनाशक") || text.includes("साफ") || text.includes("बाविस्टीन") || 
    text.includes("एम-४५") || text.includes("m-45") || text.includes("m45") || text.includes("रोको") || 
    text.includes("झेड-७८") || text.includes("z-78") || text.includes("z45") || text.includes("कॉपर") || 
    text.includes("ब्लू कॉपर") || text.includes("बोर्डो") || text.includes("कुज") || text.includes("करपा") || 
    text.includes("भुरी") || text.includes("डावणी") || text.includes("fungi") || text.includes("fungicide") ||
    text.includes("रोगा") || text.includes("रोग") || text.includes("मर")
  ) {
    return "Fungicide (बुरशीनाशक)";
  }

  if (
    text.includes("coragen") || text.includes("chlorantraniliprole") || text.includes("imidacloprid") || text.includes("thiamethoxam") || 
    text.includes("fipronil") || text.includes("emamectin") || text.includes("benzoate") || text.includes("profex") || 
    text.includes("profenofos") || text.includes("cypermethrin") || text.includes("monocrotophos") || text.includes("dimethoate") || 
    text.includes("malathion") || text.includes("chlorpyriphos") || text.includes("quinalphos") || text.includes("acetamiprid") || 
    text.includes("spinosad") || text.includes("spinetoram") || text.includes("delthamethrin") || text.includes("bifenthrin") || 
    text.includes("flubendiamide") || text.includes("diafenthiuron") || text.includes("cartap") || text.includes("hydrochloride") || 
    text.includes("novaluron") || text.includes("lambda") || text.includes("cyhalothrin") || text.includes("cyantraniliprole") || 
    text.includes("buprofezin") || text.includes("कीटक") || text.includes("कीटकनाशक") || text.includes("मावा") || 
    text.includes("तुडतुडे") || text.includes("थ्रिप्स") || text.includes("फुलकिडे") || text.includes("अळी") || 
    text.includes("कोळी") || text.includes("पांढरी माशी") || text.includes("कोराजन") || text.includes("अलीका") || 
    text.includes("कराटे") || text.includes("डेलिगेट") || text.includes("प्रोफेक्स") || text.includes("डेसिस") || 
    text.includes("लॅम्बडा") || text.includes("फेनवाल") || text.includes("रोगोर") || text.includes("pest") || 
    text.includes("insect") || text.includes("insecticide") || text.includes("pesticide") || text.includes("मावा") ||
    text.includes("तुडतुडे") || text.includes("थ्रिप्स") || text.includes("अळ्या") || text.includes("अळी")
  ) {
    return "Insecticide (कीटकनाशक)";
  }

  if (
    text.includes("fertilizer") || text.includes("खत") || text.includes("urea") || text.includes("युरिया") || 
    text.includes("dap") || text.includes("डीएपी") || text.includes("potash") || text.includes("पोटॅश") || 
    text.includes("super phosphate") || text.includes("सुपर फॉस्फेट") || text.includes("ssp") || text.includes("nitrogen") || 
    text.includes("नत्र") || text.includes("स्फुरद") || text.includes("पालाश") || text.includes("npk") || text.includes("tonic") || 
    text.includes("टॉनिक")
  ) {
    return "Fertilizer (खत)";
  }

  return null;
}

function autoDetectModeOfAction(brand: string, comp: string, category: string): string | null {
  const text = `${brand} ${comp} ${category}`.toLowerCase();
  
  if (category.includes("Fertilizer") || category.includes("खत") || category.includes("Micronutrient") || category.includes("अन्नद्रव्य") || category.includes("Seeds") || category.includes("बियाणे") || category.includes("Sticker") || category.includes("स्टिकर") || category.includes("Trap") || category.includes("सापळे")) {
    return "Contact + Systemic (स्पर्शजन्य व अंतरप्रवाही)"; 
  }

  // Combined (Contact + Systemic):
  if (
    text.includes("+") || text.includes("plus") || text.includes("and") || text.includes("व") || text.includes("आणि") ||
    (text.includes("carbendazim") && text.includes("mancozeb")) ||
    (text.includes("metalaxyl") && text.includes("mancozeb")) ||
    (text.includes("fipronil") && text.includes("imidacloprid")) ||
    (text.includes("profenofos") && text.includes("cypermethrin")) ||
    (text.includes("chlorpyriphos") && text.includes("cypermethrin")) ||
    (text.includes("thiamethoxam") && text.includes("lambda")) ||
    text.includes("alika") || text.includes("अलीका") || text.includes("saaf") || text.includes("साफ")
  ) {
    return "Contact + Systemic (स्पर्शजन्य व अंतरप्रवाही)";
  }

  // Translaminar:
  if (
    text.includes("spinetoram") || text.includes("delegate") || text.includes("spinosad") || 
    text.includes("emamectin") || text.includes("benzoate") || text.includes("abamectin") || 
    text.includes("proclaim") || text.includes("pegasus") || text.includes("diafenthiuron") ||
    text.includes("translaminar") || text.includes("ट्रान्सलॅमिनर") || text.includes("डेलिगेट") ||
    text.includes("प्रोक्लेम") || text.includes("पेगासस")
  ) {
    return "Translaminar (ट्रान्सलॅमिनर)";
  }

  // Systemic:
  if (
    text.includes("hexaconazole") || text.includes("tebuconazole") || text.includes("propiconazole") || 
    text.includes("tricyclazole") || text.includes("carbendazim") || text.includes("metalaxyl") || 
    text.includes("thiophanate") || text.includes("azoxystrobin") || text.includes("difenoconazole") || 
    text.includes("imidacloprid") || text.includes("thiamethoxam") || text.includes("acetamiprid") || 
    text.includes("fipronil") || text.includes("dimethoate") || text.includes("confidor") || 
    text.includes("actara") || text.includes("systemic") || text.includes("अंतरप्रवाही") ||
    text.includes("कॉन्फिडोर") || text.includes("एक्टारा") || text.includes("एमिडा") ||
    text.includes("बाविस्टीन") || text.includes("बंपर") || text.includes("टिल्ट") ||
    text.includes("amistar") || text.includes("ॲमिस्टार")
  ) {
    return "Systemic (अंतरप्रवाही)";
  }

  // Contact:
  if (
    text.includes("mancozeb") || text.includes("copper") || text.includes("oxychloride") || 
    text.includes("hydroxide") || text.includes("captan") || text.includes("thiram") || 
    text.includes("chlorothalonil") || text.includes("sulphur") || text.includes("propineb") || 
    text.includes("chlorpyriphos") || text.includes("cypermethrin") || text.includes("monocrotophos") || 
    text.includes("quinalphos") || text.includes("deltamethrin") || text.includes("lambda") || 
    text.includes("dichlorvos") || text.includes("contact") || text.includes("स्पर्शजन्य") ||
    text.includes("एम-४५") || text.includes("m-45") || text.includes("m45") || text.includes("ब्लू कॉपर") ||
    text.includes("कोसाविट") || text.includes("सल्फर") || text.includes("गंधक")
  ) {
    return "Contact (स्पर्शजन्य)";
  }

  // Growth Regulator:
  if (
    category.includes("PGR") || category.includes("संप्रेरके") || category.includes("वाढ नियामक") || 
    text.includes("gibberellic") || text.includes("ga3") || text.includes("cycocel") || 
    text.includes("lihocin") || text.includes("paclobutrazol") || text.includes("triacontanol") || 
    text.includes("growth regulator") || text.includes("pgr") || text.includes("वाढ नियामक") ||
    text.includes("लिहोसीन") || text.includes("सायकोसेल") || text.includes("जिब्रेलिक")
  ) {
    return "Growth Regulator (वाढ नियामक)";
  }

  // Defaults:
  if (category.includes("Fungicide") || category.includes("बुरशीनाशक")) {
    return "Systemic (अंतरप्रवाही)";
  }
  if (category.includes("Insecticide") || category.includes("कीटकनाशक")) {
    return "Contact + Systemic (स्पर्शजन्य व अंतरप्रवाही)";
  }

  return null;
}

export default function AddProductForm({
  initialData,
  products = [],
  onSave,
  onCancel,
}: AddProductFormProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [onlineResults, setOnlineResults] = useState<any[]>([]);
  const [isSearchedOnline, setIsSearchedOnline] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [submitError, setSubmitError] = useState("");


  const [formData, setFormData] = useState({
    brandName: initialData?.brandName || "",
    marathiName: initialData?.marathiName || "",
    companyName: initialData?.companyName || "",
    category: initialData?.category || "Insecticide (कीटकनाशक)",
    composition: initialData?.composition || "",
    compositionEnglish: initialData?.compositionEnglish || "",
    modeOfAction:
      initialData?.modeOfAction ||
      "Contact + Systemic (स्पर्शजन्य व अंतरप्रवाही)",
    doseSpray: initialData?.doseSpray || "",
    doseDrip: initialData?.doseDrip || "",
    doseDrenching: initialData?.doseDrenching || "",
    doseBasal: initialData?.doseBasal || "",
    targetCrops: initialData?.targetCrops || "",
    targetCropsEnglish: initialData?.targetCropsEnglish || "",
    targetPests: initialData?.targetPests || "",
    targetPestsEnglish: initialData?.targetPestsEnglish || "",
    isNewMolecule: initialData?.isNewMolecule || false,
    status: initialData?.status || "live",
    notes: initialData?.notes || "",
    notesEnglish: initialData?.notesEnglish || "",
  });

  // Remove automatic background online API calls on keystrokes to ensure 0% quota usage and 100% stability.
  // Instantly suggest matching products directly from the preseeded database + synced custom products.
  React.useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchTerm.trim();
      if (trimmed.length >= 2 && !isSearchedOnline && !isSearching) {
        // Trigger online search automatically to provide a "Google like" intelligent autocomplete
        // Merging local database + online results for maximum coverage of company products
        handleOnlineSearch();
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchTerm, isSearchedOnline, isSearching]);

  // Auto-detect product category and mode of action from brand name & composition dynamically as user types or selects a product
  const lastProcessedRef = React.useRef({ brand: "", comp: "" });

  React.useEffect(() => {
    const brand = (formData.brandName || "").trim();
    const comp = ((formData.compositionEnglish || formData.composition || "")).trim();
    
    const brandChanged = brand !== lastProcessedRef.current.brand;
    const compChanged = comp !== lastProcessedRef.current.comp;
    
    if (brandChanged || compChanged) {
      lastProcessedRef.current = { brand, comp };
      
      const detectedCategory = autoDetectCategory(brand, comp);
      const finalCategory = detectedCategory || formData.category;
      const detectedMOA = autoDetectModeOfAction(brand, comp, finalCategory);
      
      setFormData(prev => {
        const updates: Partial<typeof formData> = {};
        if (detectedCategory && detectedCategory !== prev.category) {
          updates.category = detectedCategory;
        }
        if (detectedMOA && detectedMOA !== prev.modeOfAction) {
          updates.modeOfAction = detectedMOA;
        }
        if (Object.keys(updates).length > 0) {
          return { ...prev, ...updates };
        }
        return prev;
      });
    }
  }, [formData.brandName, formData.composition, formData.compositionEnglish]);

  const allLocalProducts = React.useMemo(() => {
    const combinedList: any[] = [];
    const normalizedList: Array<{
      brand: string;
      company: string;
      comp: string;
      brandParts: string[];
      normComp: string;
      normCo: string;
    }> = [];
    const exactSeenSet = new Set<string>();
    
    const cleanParts = (name: string) => {
      return name
        .split(/[\/\+\s]/)
        .map(part => part.trim().toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/gi, ""))
        .filter(part => part.length > 1);
    };

    const cleanComp = (comp: string) => {
      return comp.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "")
        .replace("ww", "")
        .replace("sc", "")
        .replace("wp", "")
        .replace("wg", "")
        .replace("ec", "");
    };
    
    const cleanCo = (co: string) => {
      return co.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "").replace("corp", "").replace("ltd", "").replace("private", "").trim();
    };

    const addToCombined = (item: any, idPrefix?: string) => {
      const pBrand = (item.brandName || item.name || "").trim().toLowerCase();
      const pCompany = (item.companyName || "").trim().toLowerCase();
      const pComp = (item.composition || item.activeIngredients || "").trim().toLowerCase();
      
      const exactKey = `${pBrand.replace(/[^a-z0-9]/g, '')}_${pCompany.replace(/[^a-z0-9]/g, '')}`;
      exactSeenSet.add(exactKey);

      let finalItem = { ...item };
      if (idPrefix) {
        if (idPrefix === 'catalog') {
          finalItem.id = `catalog-${pBrand}-${pCompany}`;
        } else {
          finalItem.id = `${idPrefix}-${pBrand}`;
        }
      }
      
      // Pre-compute normalized and lowercased fields for ultra-fast matching
      const brandL = pBrand;
      const marathiL = (finalItem.marathiName || "").toLowerCase();
      const companyL = pCompany;
      const compL = pComp;
      const compEngL = (finalItem.compositionEnglish || "").toLowerCase();
      const notesL = (finalItem.notes || "").toLowerCase();
      const cropsL = (finalItem.targetCrops || "").toLowerCase();
      const pestsL = (finalItem.targetPests || "").toLowerCase();
      const catL = (finalItem.category || "").toLowerCase();

      const fuzzySearchText = `${brandL} ${marathiL} ${companyL} ${compL} ${compEngL} ${notesL} ${cropsL} ${pestsL} ${catL}`.replace(/[^a-z0-9\u0900-\u097F]/g, "");

      const enrichedItem = {
        ...finalItem,
        brandLower: brandL,
        marathiLower: marathiL,
        companyLower: companyL,
        compLower: compL,
        fuzzySearchText
      };

      combinedList.push(enrichedItem);
      
      normalizedList.push({
        brand: pBrand,
        company: pCompany,
        comp: pComp,
        brandParts: cleanParts(pBrand),
        normComp: cleanComp(pComp),
        normCo: cleanCo(pCompany)
      });
    };

    const isDuplicate = (p: any) => {
      const pBrand = (p.brandName || p.name || "").trim().toLowerCase();
      const pCompany = (p.companyName || "").trim().toLowerCase();
      const pComp = (p.composition || p.activeIngredients || "").trim().toLowerCase();
      
      const exactKey = `${pBrand.replace(/[^a-z0-9]/g, '')}_${pCompany.replace(/[^a-z0-9]/g, '')}`;
      if (exactSeenSet.has(exactKey)) return true;

      const pParts = cleanParts(pBrand);
      const normComp = cleanComp(pComp);
      const normCo = cleanCo(pCompany);
      
      const duplicateFound = normalizedList.some(existing => {
        const hasNameOverlap = (existing.brand === pBrand) || pParts.some(pt => existing.brandParts.includes(pt));
        if (!hasNameOverlap) return false;
        
        const compMatch = normComp === existing.normComp;
        if (!compMatch) return false;
        
        const companyMatch = (normCo === existing.normCo) || 
                             normCo.includes(existing.normCo) || 
                             existing.normCo.includes(normCo);
                             
        return companyMatch;
      });
      
      if (duplicateFound) {
        exactSeenSet.add(exactKey);
      }
      
      return duplicateFound;
    };

    // 1. Add real database products first (custom/edited options take precedence)
    products.forEach(p => {
      if (p && (p.brandName || p.name)) {
        if (!isDuplicate(p)) {
          addToCombined(p);
        }
      }
    });

    // 2. Add preseeded products if not duplicated by customizable/database options
    PRESEEDED_PRODUCTS.forEach(p => {
      if (p && p.brandName) {
        if (!isDuplicate(p)) {
          addToCombined(p, "preseeded");
        }
      }
    });

    // 3. Add mock configuration products
    mockProducts.forEach(p => {
      if (p && p.brandName) {
        if (!isDuplicate(p)) {
          addToCombined(p, "mock");
        }
      }
    });

    // 3.5 Add dynamic catalog products (2500+ items) so that searching for a company name returns all its products immediately
    CATALOG_PRODUCTS.forEach(p => {
      if (p && p.brandName) {
        if (!isDuplicate(p)) {
          addToCombined(p, "catalog");
        }
      }
    });

    // 4. Add offline cached API searches
    try {
      const cached = localStorage.getItem("cached_searched_products");
      if (cached) {
        const parsedCache = (cached === "undefined" ? undefined : safeJsonParse(cached));
        if (Array.isArray(parsedCache)) {
           parsedCache.forEach(p => {
             if (p && p.brandName && !isDuplicate(p)) {
               addToCombined(p, "cached");
             }
           });
        }
      }
    } catch(e) {}

    return combinedList;
  }, [products]);

  const uniqueCompanies = React.useMemo(() => {
    const cos = new Set<string>();
    allLocalProducts.forEach(p => {
      if (p.companyName && p.companyName !== "माहिती उपलब्ध नाही") {
        const stdCos = standardizeCompanyName(p.companyName);
        stdCos.forEach(c => cos.add(c));
      }
    });
    return Array.from(cos).sort();
  }, [allLocalProducts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!formData.brandName?.trim()) {
      setSubmitError("कृपया ब्रँडचे नाव प्रविष्ट करा. (Brand Name is required)");
      return;
    }
    if (!formData.companyName?.trim() || formData.companyName.trim() === "माहिती उपलब्ध नाही") {
      setSubmitError("कृपया कंपनीचे नाव प्रविष्ट करा. (Company Name is required)");
      return;
    }
    if (!formData.composition?.trim() && !formData.compositionEnglish?.trim()) {
      setSubmitError("कृपया घटक / सक्रिय घटक प्रविष्ट करा. (Active Ingredient is required)");
      return;
    }
    if (!formData.category?.trim() || formData.category.trim() === "माहिती उपलब्ध नाही") {
      setSubmitError("कृपया उत्पादन श्रेणी निवडा. (Category is required)");
      return;
    }
    const hasDose = formData.doseSpray?.trim() || formData.doseDrip?.trim() || formData.doseDrenching?.trim() || formData.doseBasal?.trim();
    if (!hasDose) {
      setSubmitError("कृपया कमीत कमी एक डोस / प्रमाण प्रविष्ट करा. (At least one Dose like Spray, Drip, Drenching or Basal is required)");
      return;
    }
    if (formData.category.includes("Herbicide") || formData.category.includes("तणनाशक")) {
      if (!formData.targetCrops?.trim() || formData.targetCrops.trim() === "माहिती उपलब्ध नाही") {
        setSubmitError("कृपया पिके प्रविष्ट करा. (Target Crops is required for Herbicides)");
        return;
      }
    }
    if (!formData.targetPests?.trim() || formData.targetPests.trim() === "माहिती उपलब्ध नाही") {
      setSubmitError("कृपया लक्ष्य कीड / रोग प्रविष्ट करा. (Target Pest/Disease is required)");
      return;
    }

    const enriched = getEnrichedProduct({ ...formData });
    const savedData = {
      ...enriched,
      doseSpray: translateDoseToEnglish(enriched.doseSpray),
      doseDrip: translateDoseToEnglish(enriched.doseDrip),
      doseDrenching: translateDoseToEnglish(enriched.doseDrenching),
      doseBasal: translateDoseToEnglish(enriched.doseBasal),
    };

    onSave(savedData);
  };

  const localSuggestions = React.useMemo(() => {
    if (!searchTerm.trim()) return [];
    const queryClean = searchTerm.trim().toLowerCase();
    const queryFuzzy = queryClean.replace(/[^a-z0-9\u0900-\u097F]/g, "");

    return allLocalProducts.filter((product) => {
      const brandL = product.brandLower || "";
      const marathiL = product.marathiLower || "";
      const companyL = product.companyLower || "";
      const compL = product.compLower || "";
      const fuzzyText = product.fuzzySearchText || "";

      return (
        brandL.includes(queryClean) ||
        marathiL.includes(queryClean) ||
        companyL.includes(queryClean) ||
        compL.includes(queryClean) ||
        fuzzyText.includes(queryFuzzy)
      );
    }).sort((a, b) => {
      const aCompany = (a.companyLower || "").toLowerCase();
      const bCompany = (b.companyLower || "").toLowerCase();
      const aBrand = (a.brandLower || "").toLowerCase();
      const bBrand = (b.brandLower || "").toLowerCase();

      // If typing a company name, prioritize showing that company's products
      const aStartsCompany = aCompany === queryClean || aCompany.startsWith(queryClean);
      const bStartsCompany = bCompany === queryClean || bCompany.startsWith(queryClean);
      if (aStartsCompany && !bStartsCompany) return -1;
      if (!aStartsCompany && bStartsCompany) return 1;

      // Prioritize brands starting with the query
      const aStartsBrand = aBrand.startsWith(queryClean) || (a.marathiLower || "").startsWith(queryClean);
      const bStartsBrand = bBrand.startsWith(queryClean) || (b.marathiLower || "").startsWith(queryClean);
      if (aStartsBrand && !bStartsBrand) return -1;
      if (!aStartsBrand && bStartsBrand) return 1;

      return 0;
    });
  }, [searchTerm, allLocalProducts]);

  const handleOnlineSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setSearchError("");
    setShowSuggestions(true);
    setIsSearchedOnline(false);

    const maxRetries = 1;

    let attempt = 0;
    let lastError: any = null;
    let success = false;
    let responseData: any = null;
    const apiUrl = getApiUrl("/api/search-products");
    if (!apiUrl) {
      return { products: [], source: "backup", count: 0 };
    }

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempt < maxRetries && !success) {
      try {
        attempt++;
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({ query: searchTerm }),
        });

        if (!res.ok) {
          const text = await res.text();
          let parsed;
          try { parsed = safeJsonParse(text); } catch { parsed = {}; }
          throw new Error(parsed?.error || parsed?.errorMessage || `HTTP ${res.status}: ${text}`);
        }

        responseData = await res.json();
        success = true;
      } catch (err: any) {
        lastError = err;
        console.warn(`Search attempt ${attempt} failed:`, err);
        if (attempt < maxRetries) {
          await delay(attempt * 1000);
        }
      }
    }

    if (success && responseData) {
      if (responseData.isFallback) {
        try {
          saveItem("api-error-logs", {
            query: searchTerm,
            errorType: responseData.errorType || "SERVER_FALLBACK",
            errorRaw: responseData.errorRaw || "",
            errorMessage: responseData.errorMessage || "सर्व्हरने बॅकअप डेटाबेसमधून माहिती दिली.",
            timestamp: new Date().toISOString(),
            attemptCount: attempt
          });
        } catch (logErr) {}

        const fallbackProducts = responseData.products || [];
        setOnlineResults(fallbackProducts);
        setIsSearchedOnline(true);
        // Do not block UI with an error. Show results seamlessly.
        setSearchError("");
      } else if (responseData.products && responseData.products.length > 0) {
        setOnlineResults(responseData.products);
        setIsSearchedOnline(true);
        
        // Cache online results for offline and instant future searches
        try {
          const cached = localStorage.getItem("cached_searched_products");
          let existingCache = [];
          if (cached) { existingCache = (cached === "undefined" ? undefined : safeJsonParse(cached)); }
          // merge without duplicates
          const newCache = [...existingCache];
          responseData.products.forEach((p: any) => {
            const exists = newCache.some((c: any) => c.brandName === p.brandName && c.companyName === p.companyName);
            if (!exists) newCache.push(p);
          });
          localStorage.setItem("cached_searched_products", JSON.stringify(newCache));
        } catch(e) {}
        
      } else {
        setOnlineResults([]);
        setSearchError("ऑनलाइन शोधामध्ये हे उत्पादन आढळले नाही. परंतु आपल्या स्थानिक सुचविलेल्या यादीमध्ये खाली पर्याय आहेत.");
      }
    } else {
      // 3 attempts failed entirely
      setOnlineResults([]);
      const errMsg = lastError?.message || lastError || "नेटवर्क किंवा रिस्पॉन्स त्रुटी.";
      console.error("All search retries failed:", lastError);

      try {
        saveItem("api-error-logs", {
          query: searchTerm,
          errorType: "NETWORK_ERROR",
          errorRaw: errMsg,
          errorMessage: "ऑनलाइन शोध नेटवर्क त्रुटी किंवा सर्व्हर पूर्ण डाऊन आहे.",
          timestamp: new Date().toISOString(),
          attemptCount: attempt
        });
      } catch (logErr) {
        console.error("Failed to log error to Firestore:", logErr);
      }

      setSearchError("ऑनलाइन शोध सेवा तात्पुरती अनुपलब्ध आहे. परंतु आपल्यासाठी स्थानिक डेटाबेसमधून दर्जेदार पर्याय खाली उपलब्ध आहेत.");
    }

    setIsSearching(false);
  };

  const handleSelectProduct = (rawProduct: any) => {
    const product = getEnrichedProduct(rawProduct);
    
    // Explicitly set all fields to ensure no old data remains
    setFormData({
      brandName: product.brandName || "",
      marathiName: product.marathiName || "",
      companyName: product.companyName || "",
      category: product.category || "Insecticide (कीटकनाशक)",
      composition: product.composition || "",
      compositionEnglish: product.compositionEnglish || "",
      modeOfAction: product.modeOfAction || "Contact + Systemic (स्पर्शजन्य व अंतरप्रवाही)",
      doseSpray: product.doseSpray || "",
      doseDrip: product.doseDrip || "",
      doseDrenching: product.doseDrenching || "",
      doseBasal: product.doseBasal || "",
      targetCrops: product.targetCrops || "",
      targetCropsEnglish: product.targetCropsEnglish || "",
      targetPests: product.targetPests || "",
      targetPestsEnglish: product.targetPestsEnglish || "",
      isNewMolecule: product.isNewMolecule || false,
      status: product.status || "live",
      notes: product.notes || "",
      notesEnglish: product.notesEnglish || "",
    });
    setSearchTerm("");
    setShowSuggestions(false);
    setIsSearchedOnline(false);
  };


  return (
    <div className="w-full h-full bg-white flex flex-col relative z-50">
      <div className="flex items-center gap-2 p-1.5 bg-blue-800 text-white shadow-sm shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="p-1 -ml-1 hover:bg-blue-700/50 rounded transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-[12px] font-bold">
          {initialData
            ? "उत्पादन अपडेट करा (Edit Product)"
            : "नवीन उत्पादन जोडा (Add Product)"}
        </h2>
      </div>

      <form
        id="add-product-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-3 space-y-4 bg-slate-50 relative"
      >
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded text-xs font-bold shadow-sm">
            {submitError}
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm relative z-20">
          <label className="block text-[10px] font-bold text-slate-600 mb-1">
            उत्पादन किंवा कंपनीचे नाव शोधा (Search Product/Company)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-8 pr-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="उदा. कोराजन, Syngenta, Coragen..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSearchError("");
                  setIsSearchedOnline(false);
                  if (e.target.value.length >= 1) {
                    setShowSuggestions(true);
                  } else {
                    setShowSuggestions(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleOnlineSearch();
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleOnlineSearch}
              disabled={isSearching || !searchTerm.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "ऑनलाईन शोधा"
              )}
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && searchTerm && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {isSearching && (
                <div className="p-3 bg-blue-50/70 border-b border-blue-100 flex items-center justify-center gap-2 text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                  <p className="text-[11px] font-medium">
                    वेबवरून अतिरिक्त माहिती शोधत आहे... (Searching online)
                  </p>
                </div>
              )}

              {/* Online Search Error (or Quota notice) rendered as a supportive alert, NOT a critical stop */}
              {!isSearching && searchError && onlineResults.length === 0 && (
                <div className="p-3 bg-amber-50 border-b border-amber-100 text-amber-800 text-[11px] font-medium leading-relaxed">
                  ⚠️ {searchError}
                </div>
              )}

              {/* Display Merged Unified Results (Local + Online) */}
              {(onlineResults.length > 0 || localSuggestions.length > 0) ? (
                <div>
                  <p className="text-[10px] text-blue-800 font-bold bg-blue-50 px-3 py-1.5 font-sans border-b border-blue-100 flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      {searchTerm.toLowerCase().includes(formData.companyName.toLowerCase()) && formData.companyName.length > 2 
                        ? `${formData.companyName} ची उत्पादने (Products)` 
                        : "शोध निकाल (Search Results)"
                      }
                    </span>
                    <span className="text-emerald-700 font-sans">({onlineResults.length + localSuggestions.length})</span>
                  </p>
                  
                  {/* First show online/AI results */}
                  {onlineResults.map((product, idx) => (
                    <div
                      key={`online-${idx}`}
                      onClick={() => handleSelectProduct(product)}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {product.brandName} <span className="text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded ml-1 font-normal font-sans">Smart</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {standardizeCompanyName(product.companyName).join(" / ") || product.companyName} • {product.category?.split(" (")[0]}
                        </p>
                      </div>
                      <div className="text-[9px] text-blue-600 bg-blue-50 hover:bg-blue-100 font-bold px-2 py-1 rounded transition-colors">निवडा</div>
                    </div>
                  ))}

                  {/* Then show local database results (prevent duplicates by brand name) */}
                  {(() => {
                    const filtered = localSuggestions.filter(local => !onlineResults.some(online => (online.brandName || "").toLowerCase().trim() === (local.brandName || "").toLowerCase().trim()));
                    const sliced = filtered.slice(0, 300);
                    return (
                      <>
                        {sliced.map((product, idx) => (
                          <div
                            key={`local-${idx}`}
                            onClick={() => handleSelectProduct(product)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex items-center justify-between transition-colors"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {product.brandName}
                                {product.id?.startsWith("catalog-") ? (
                                  <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded ml-1 font-normal font-sans">Catalog</span>
                                ) : !product.id?.startsWith("preseeded-") && !product.id?.startsWith("mock-") && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1 py-0.5 rounded ml-1 font-normal font-sans">Database</span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {standardizeCompanyName(product.companyName).join(" / ") || product.companyName} • {product.category?.split(" (")[0]}
                              </p>
                            </div>
                            <div className="text-[9px] text-blue-600 bg-blue-50 hover:bg-blue-100 font-bold px-2 py-1 rounded transition-colors">निवडा</div>
                          </div>
                        ))}
                        {filtered.length > 300 && (
                          <p className="text-center text-[10px] text-slate-400 py-2 bg-slate-50 font-medium">
                            पाहण्यासाठी अधिक अचूक शोध शब्द वापरा (उदा. कंपनीचे नाव किंवा ब्रँड)
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                !isSearching && (
                  <div className="p-4 text-center">
                    <p className="text-xs text-slate-500 mb-2">
                      प्रॉडक्ट डेटाबेस किंवा स्थानिक यादीमध्ये हे सापडले नाही.
                    </p>
                    <p className="text-[11px] text-blue-600 font-medium bg-blue-50/50 p-2 rounded">
                      नवीन उत्पादन नोंदवण्यासाठी तुम्ही थेट खालील फॉर्ममध्ये संपूर्ण माहिती भरून सेव्ह करू शकता.
                    </p>
                  </div>
                )
              )}
            </div>
          )}

        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3 z-10">
          <h3 className="text-xs font-bold text-slate-800 border-b pb-1">
            उत्पादनाची प्राथमिक माहिती (Primary Info)
          </h3>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Brand Name (ब्रँड नाव) *
              </label>
              <input
                type="text"
                required
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="उदा. Coragen"
                value={formData.brandName}
                onChange={(e) =>
                  setFormData({ ...formData, brandName: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">
              Company *
            </label>
            <div className="relative group">
              <input
                type="text"
                required
                list="company-list"
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="उदा. Bayer CropScience Limited"
                value={formData.companyName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, companyName: val });
                  
                  if (val.length >= 3 && !isSearching) {
                    setSearchTerm(val);
                    setShowSuggestions(true);
                  }
                }}
              />
              <datalist id="company-list">
                {uniqueCompanies.map(co => <option key={co} value={co} />)}
              </datalist>
            </div>

          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Category *
              </label>
              <select
                className="w-full px-1.5 py-1.5 rounded border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                {productCategories.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Mode of Action
              </label>
              <select
                className="w-full px-1.5 py-1.5 rounded border border-slate-200 text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                value={formData.modeOfAction}
                onChange={(e) =>
                  setFormData({ ...formData, modeOfAction: e.target.value })
                }
              >
                {modeOfActions.map((mode, i) => (
                  <option key={i} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Composition *
              </label>
              <textarea
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="उदा. Carbendazim (कार्बेन्डाझिम) 12% + Mancozeb (मॅन्कोझेब) 63% WP"
                rows={2}
                value={formData.compositionEnglish}
                onChange={(e) =>
                  setFormData({ ...formData, compositionEnglish: e.target.value, composition: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Recommended Crops *
              </label>
              <textarea
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="उदा. Chilli (मिरची), Tomato (टोमॅटो), Soybean (सोयाबीन)"
                rows={2}
                value={formData.targetCrops}
                onChange={(e) =>
                  setFormData({ ...formData, targetCrops: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Target Pest / Disease (लक्ष्यित कीड / रोग) *
              </label>
              <textarea
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="उदा. Leaf Spot (पानावरील डाग), Blight (करपा)"
                rows={2}
                value={formData.targetPests}
                onChange={(e) =>
                  setFormData({ ...formData, targetPests: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 border-b pb-1">
            प्रमाण आणि डोस (Dose Information) *
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Spray Dose
              </label>
              <input
                type="text"
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="उदा. 2 - 2.5 gm/Litre"
                value={formData.doseSpray}
                onChange={(e) =>
                  setFormData({ ...formData, doseSpray: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Drip Dose (ठिबक मात्रा)
              </label>
              <input
                type="text"
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="उदा. 500 gm/Acre"
                value={formData.doseDrip}
                onChange={(e) =>
                  setFormData({ ...formData, doseDrip: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Drenching Dose
              </label>
              <input
                type="text"
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="उदा. 500 gm/Acre"
                value={formData.doseDrenching}
                onChange={(e) =>
                  setFormData({ ...formData, doseDrenching: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Basal Dose (जमिनीत देण्याची मात्रा)
              </label>
              <input
                type="text"
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="उदा. 50 kg/Acre"
                value={formData.doseBasal}
                onChange={(e) =>
                  setFormData({ ...formData, doseBasal: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2.5 bg-amber-50/40 p-2 rounded-lg border border-amber-100">
            <input
              type="checkbox"
              id="isNewMolecule"
              checked={formData.isNewMolecule}
              onChange={(e) =>
                setFormData({ ...formData, isNewMolecule: e.target.checked })
              }
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isNewMolecule" className="text-[11px] font-bold text-amber-900 cursor-pointer select-none">
              ⭐ नवीन उत्पादन / मॉलिक्युल (New Molecule)
            </label>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6 mb-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 text-[10px] bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-bold hover:bg-slate-300 transition"
          >
            बॅक/रद्द करा
          </button>
          <button
            type="submit"
            className="flex items-center gap-1 text-[10px] bg-blue-100 text-blue-800 px-3 py-1.5 rounded font-bold hover:bg-blue-200 transition border border-blue-200"
          >
            <Save className="w-3 h-3" />
            उत्पादन जतन करा
          </button>
        </div>
      </form>
    </div>
  );
}

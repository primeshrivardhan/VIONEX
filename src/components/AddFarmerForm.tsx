import { useState } from "react";
import { ArrowLeft, Save, MapPin, Eye, EyeOff, Camera } from "lucide-react";
import DatePicker from "./DatePicker";
import { MAHARASHTRA_DISTRICTS, getTalukasForDistrict, getVillagesForTaluka } from "../lib/maharashtra-locations";
import { getSmartLocation } from "../lib/geo-helper";

const indianStates = [
  "Maharashtra",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman & Nicobar Islands",
  "Chandigarh",
  "Dadra & Nagar Haveli",
  "Daman & Diu",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const commonCrops = [
  "सोयाबीन (Soybean)",
  "कापूस (Cotton)",
  "बाजरी (Pearl Millet)",
  "ज्वारी (Sorghum)",
  "गहू (Wheat)",
  "मका (Maize)",
  "सूर्यफूल (Sunflower)",
  "मूग (Green Gram)",
  "तूर (Pigeon Pea)",
  "हरभरा (Chickpea)",
  "आंबा (Mango)",
  "केळी (Banana)",
  "द्राक्ष (Grape)",
  "डाळिंब (Pomegranate)",
  "सफरचंद (Apple)",
  "पेरू (Guava)",
  "पपई (Papaya)",
  "कांदा (Onion)",
  "टोमॅटो (Tomato)",
  "बटाटा (Potato)",
  "वांगी (Brinjal/Eggplant)",
  "भेंडी (Okra)",
  "मिरची (Chili)",
  "लसूण (Garlic)",
  "आले (Ginger)",
  "हळद (Turmeric)",
  "कोबी (Cabbage)",
  "फ्लॉवर (Cauliflower)",
  "सिमला मिरची (Capsicum)",
  "गाजर (Carrot)",
  "मुळा (Radish)",
  "बीट (Beetroot)",
  "काकडी (Cucumber)",
  "कारले (Bitter Gourd)",
  "दूधी भोपळा (Bottle Gourd)",
  "दोडका (Ridge Gourd)",
  "घोसाळे (Sponge Gourd)",
  "भोपळा (Pumpkin)",
  "पालक (Spinach)",
  "मेथी (Fenugreek)",
  "कोथिंबीर (Coriander)",
  "पुदीना (Mint)",
  "शेपू (Dill)",
  "कढीपत्ता (Curry Leaves)",
  "ऊस (Sugarcane)",
  "भुईमूग (Peanut)",
  "भात / धाण (Rice/Paddy)",
  "उडीद (Black Gram)",
  "मोहरी (Mustard)",
  "तीळ (Sesame)",
  "करडई (Safflower)",
  "एरंडी (Castor)",
  "जवस (Linseed)",
  "मोसंबी (Sweet Lime)",
  "संत्रा (Orange)",
  "लिंबू (Lemon)",
  "इतर (Other)",
];

const cropSeasons: Record<string, string[]> = {
  "डाळिंब (Pomegranate)": [
    "मृग बहार (जून-जुलै)",
    "हस्त बहार (सप्टेंबर-ऑक्टोबर)",
    "आंबे बहार (जानेवारी-फेब्रुवारी)",
  ],
  "पेरू (Guava)": [
    "मृग बहार (जून-जुलै)",
    "हस्त बहार (सप्टेंबर-ऑक्टोबर)",
    "आंबे बहार (जानेवारी-फेब्रुवारी)",
  ],
  "द्राक्ष (Grape)": [
    "ऑक्टोबर छाटणी",
    "एप्रिल छाटणी",
    "गोड छाटणी",
    "खोड छाटणी",
  ],
  "आंबा (Mango)": ["नियमित", "ऑफ-सीझन", "आंबे बहार (जानेवारी-फेब्रुवारी)"],
  "मोसंबी (Sweet Lime)": [
    "मृग बहार (जून-जुलै)",
    "हस्त बहार (सप्टेंबर-ऑक्टोबर)",
    "आंबे बहार (जानेवारी-फेब्रुवारी)",
  ],
  "संत्रा (Orange)": [
    "मृग बहार (जून-जुलै)",
    "हस्त बहार (सप्टेंबर-ऑक्टोबर)",
    "आंबे बहार (जानेवारी-फेब्रुवारी)",
  ],
  "लिंबू (Lemon)": [
    "मृग बहार (जून-जुलै)",
    "हस्त बहार (सप्टेंबर-ऑक्टोबर)",
    "आंबे बहार (जानेवारी-फेब्रुवारी)",
    "नियमित",
  ],
  "केळी (Banana)": [
    "खरीप (जून-जुलै)",
    "रब्बी (ऑक्टोबर-नोव्हेंबर)",
    "कांदेबाग (ऑक्टोबर-नोव्हेंबर)",
    "मृगबाग (जून-जुलै)",
  ],
  "पपई (Papaya)": [
    "खरीप (जून-जुलै)",
    "रब्बी (ऑक्टोबर-नोव्हेंबर)",
    "उन्हाळी (फेब्रुवारी-मार्च)",
  ],
  "कापूस (Cotton)": ["खरीप (मे-जून)", "उन्हाळी (मार्च-एप्रिल)"],
  "सोयाबीन (Soybean)": ["खरीप (जून-जुलै)", "उन्हाळी (जानेवारी-फेब्रुवारी)"],
  "ऊस (Sugarcane)": [
    "आडसाली (जुलै-ऑगस्ट)",
    "पूर्वहंगामी (ऑक्टोबर-नोव्हेंबर)",
    "सुरू (जानेवारी-फेब्रुवारी)",
    "खोडवा",
  ],
  "कांदा (Onion)": [
    "खरीप (जून-जुलै)",
    "रांगडा (ऑक्टोबर-नोव्हेंबर)",
    "रब्बी / उन्हाळ कांदा (डिसेंबर-जानेवारी)",
  ],
  "टोमॅटो (Tomato)": [
    "खरीप (जून-जुलै)",
    "रब्बी (सप्टेंबर-ऑक्टोबर)",
    "उन्हाळी (जानेवारी-फेब्रुवारी)",
  ],
  "मिरची (Chili)": [
    "खरीप (जून-जुलै)",
    "रब्बी (सप्टेंबर-ऑक्टोबर)",
    "उन्हाळी (जानेवारी-फेब्रुवारी)",
  ],
  "हरभरा (Chickpea)": ["रब्बी (ऑक्टोबर-नोव्हेंबर)"],
  "गहू (Wheat)": ["रब्बी (नोव्हेंबर-डिसेंबर)"],
  "ज्वारी (Sorghum)": [
    "खरीप (जून-जुलै)",
    "रब्बी (सप्टेंबर-ऑक्टोबर)",
    "उन्हाळी (जानेवारी-फेब्रुवारी)",
  ],
  "मका (Maize)": [
    "खरीप (जून-जुलै)",
    "रब्बी (ऑक्टोबर-नोव्हेंबर)",
    "उन्हाळी (जानेवारी-फेब्रुवारी)",
  ],
  "बाजरी (Pearl Millet)": ["खरीप (जून-जुलै)", "उन्हाळी (जानेवारी-फेब्रुवारी)"],
};

const defaultSeasons = [
  "खरीप (जून ते ऑक्टोबर)",
  "रब्बी (ऑक्टोबर ते मार्च)",
  "उन्हाळी (मार्च ते जून)",
  "वर्षभर / फळबागा",
];

const cropVarieties: Record<string, string[]> = {
  "डाळिंब (Pomegranate)": ["भगवा", "आरक्ता", "मृदुला", "गणेश", "सुपर भगवा"],
  "द्राक्ष (Grape)": [
    "थॉमसन सीडलेस",
    "सोनाका",
    "शरद सीडलेस",
    "माणिक चमन",
    "तास-ए-गणेश",
    "क्रिमसन",
    "सुपर सोनाका",
    "जंबो",
    "अनुष्का",
    "सुधाकर सीडलेस",
  ],
  "सोयाबीन (Soybean)": [
    "JS 335",
    "JS 9305",
    "KDS 726 (फुले संगम)",
    "KDS 753",
    "MACS 1188",
    "RVS 18",
    "MAUS 71",
    "MAUS 158",
  ],
  "कापूस (Cotton)": [
    "अजित 155",
    "मल्लिकार्जुन",
    "राशी 659",
    "निर्मल",
    "विठ्ठल",
    "US 71",
    "मकालू",
    "मोक्ष",
    "तुलसी",
  ],
  "गहू (Wheat)": [
    "लोकवन",
    "फुले समाधान",
    "त्र्यंबक",
    "तपोवन",
    "गोदावरी",
    "सिहोरे",
    "पंचवटी",
  ],
  "कांदा (Onion)": [
    "पुणे फुरसुंगी",
    "N-53",
    "भीमा सुपर",
    "भीमा रेड",
    "भीमा डार्क रेड",
    "अ‍ॅग्रीफाऊंड लाईट रेड",
    "प्राची",
    "नासिक रेड",
  ],
  "ऊस (Sugarcane)": [
    "Co 86032",
    "CoM 0265",
    "CoVSI 9805",
    "VSI 434",
    "VSI 08005",
  ],
  "टोमॅटो (Tomato)": [
    "अभिनव",
    "आर्यन",
    "रुपाली",
    "वैशाली",
    "तेजस",
    "साई",
    "सोनाली",
    "नामधारी",
  ],
  "हरभरा (Chickpea)": ["दिग्विजय", "विजय", "विशाल", "कृपा", "फुले विक्रम"],
  "तूर (Pigeon Pea)": [
    "बीडीएन 711",
    "बीडीएन 708",
    "विपुल",
    "कल्याणी",
    "मारुती",
  ],
  "आंबा (Mango)": ["हापूस (Alphonso)", "केशर", "रत्ना", "तोतापुरी", "पायरी"],
  "मका (Maize)": ["पायोनियर", "डिकाल्ब", "अद्वंता", "कावेरी", "सुपर 900M"],
  "पेरू (Guava)": [
    "सरदार (L-49)",
    "अलाहाबाद सफेदा",
    "तैवान पिंक",
    "व्हीएनआर बिही (VNR Bihi)",
    "अर्का अमूल्य",
  ],
  "केळी (Banana)": [
    "ग्रँड नैन (Grand Naine)",
    "श्रीमंती",
    "अर्धापुरी",
    "बसवण",
    "रस्तळी",
  ],
  "पपई (Papaya)": ["तैवान 786", "रेड लेडी", "वाशिंग्टन", "को-1"],
  "मिरची (Chili)": ["तेजा", "बायडगी", "संकेश्वरी", "ज्वाला", "फुले ज्योती"],
  "आले (Ginger)": ["माहिम", "वरदा", "सुप्रभा", "कलकत्ता"],
  "हळद (Turmeric)": ["सेलम", "राजापुरी", "टेकुरपेटा", "कृष्णा"],
};

interface Props {
  initialData?: any;
  farmers?: any[];
  onSave: (farmerData: any) => void;
  onCancel: () => void;
  dealers?: any[];
}

export default function AddFarmerForm({
  initialData,
  farmers = [],
  onSave,
  onCancel,
  dealers = [],
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [isDealerDropdownOpen, setIsDealerDropdownOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [isManualVillage, setIsManualVillage] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    mobile: initialData?.mobile || "",
    password: initialData?.password || "",
    pincode: initialData?.pincode || "",
    country: initialData?.country || "India",
    state: initialData?.state || "Maharashtra",
    district: initialData?.district || "",
    taluka: initialData?.taluka || "",
    village: initialData?.village || "",
    dealer: initialData?.dealer || "",
    photoUrl: initialData?.photoUrl || "",
  });

  const [crops, setCrops] = useState(
    initialData?.crops?.length > 0
      ? initialData.crops.map((c: any, i: number) => ({
          id: c.id || `crop_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          plotName: c.plotName || "",
          crop: c.crop || "",
          variety: c.variety || "",
          season: c.season || "खरीप (जून ते ऑक्टोबर)",
          area: c.area || "",
          plantationDate: c.plantationDate || "",
        }))
      : [
          {
            id: `crop_${Date.now()}_0_${Math.random().toString(36).substring(2, 6)}`,
            plotName: "",
            crop: "",
            variety: "",
            season: "खरीप (जून ते ऑक्टोबर)",
            area: "",
            plantationDate: "",
          },
        ],
  );

  const addCrop = () => {
    setCrops([
      ...crops,
      {
        id: `crop_${Date.now()}_${crops.length}_${Math.random().toString(36).substring(2, 6)}`,
        plotName: "",
        crop: "",
        variety: "",
        season: "खरीप (जून ते ऑक्टोबर)",
        area: "",
        plantationDate: "",
      },
    ]);
  };

  const updateCrop = (index: number, field: string, value: string) => {
    const newCrops = [...crops];
    newCrops[index] = { ...newCrops[index], [field]: value };

    if (field === "crop") {
      newCrops[index].variety = ""; // Reset variety on crop change
      const availableSeasons = cropSeasons[value] || defaultSeasons;
      newCrops[index].season = availableSeasons[0] || "खरीप"; // Default to first season
    }

    setCrops(newCrops);
  };

  const removeCrop = (index: number) => {
    const newCrops = crops.filter((_, i) => i !== index);
    if (newCrops.length === 0) {
      newCrops.push({
        id: `crop_${Date.now()}_0_${Math.random().toString(36).substring(2, 6)}`,
        plotName: "",
        crop: "",
        variety: "",
        season: "खरीप (जून ते ऑक्टोबर)",
        area: "",
        plantationDate: "",
      });
    }
    setCrops(newCrops);
  };

  const [isLoadingPincode, setIsLoadingPincode] = useState(false);
  const [villageOptions, setVillageOptions] = useState<string[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Get unique list of villages for the selected taluka
  const getTalukaVillageOptions = () => {
    if (!formData.taluka) return [];
    
    // Predefined villages for this taluka
    const preseeded = getVillagesForTaluka(formData.taluka);
    
    // Villages of existing dealers in this taluka
    const dealerVills = (dealers || [])
      .filter(d => d.taluka && d.taluka.toLowerCase().trim() === formData.taluka.toLowerCase().trim() && d.village)
      .map(d => d.village);
      
    // Combine and remove duplicates
    const combined = Array.from(new Set([...preseeded, ...dealerVills])).filter(Boolean) as string[];
    return combined.sort();
  };

  const computedVillages = formData.state === "Maharashtra" && formData.taluka
    ? Array.from(new Set([...getTalukaVillageOptions(), ...villageOptions])).filter(Boolean) as string[]
    : villageOptions;

  // Helper to compress images client-side to ensure small Firestore payload size (under 20KB)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
            resolve(compressedBase64);
          } else {
            reject(new Error("कॅनव्हास उपलब्ध नाही."));
          }
        };
        img.onerror = () => reject(new Error("फोटो वाचताना त्रुटी आली."));
      };
      reader.onerror = () => reject(new Error("फोटो लोड करताना त्रुटी आली."));
    });
  };

  const fetchPincodeData = async (pincodeToFetch: string, options?: { village?: string }) => {
    setIsLoadingPincode(true);
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincodeToFetch}`,
      );
      const data = await response.json();

      if (data && data[0] && data[0].Status === "Success") {
        const postOffices = data[0].PostOffice;
        const firstPO = postOffices[0];

        const villages = postOffices.map((po: any) => po.Name);
        setVillageOptions(villages);

        let matchedVillage = villages[0] || "";
        if (options?.village) {
          const target = options.village.toLowerCase().replace(/\s+/g, "");
          const found = villages.find((v: string) => 
            v.toLowerCase().replace(/\s+/g, "").includes(target) || 
            target.includes(v.toLowerCase().replace(/\s+/g, ""))
          );
          if (found) {
            matchedVillage = found;
          }
        }

        const resolvedTaluka = firstPO.Block !== 'N.A.' && firstPO.Block !== 'NA' ? firstPO.Block : (firstPO.Taluka || firstPO.Region || firstPO.Division || "");

        setFormData((prev) => ({
          ...prev,
          pincode: pincodeToFetch,
          country: firstPO.Country === "India" ? "India" : prev.country,
          state: firstPO.State || prev.state,
          district: firstPO.District || prev.district,
          taluka: resolvedTaluka || prev.taluka,
          village: matchedVillage || prev.village,
        }));
      }
    } catch (error) {
      console.error("Error fetching pincode data:", error);
    } finally {
      setIsLoadingPincode(false);
    }
  };

  const autoDetectLocation = async () => {
    setIsDetectingLocation(true);
    const loc = await getSmartLocation();
    if (!loc) {
      alert("लोकेशन शोधता आले नाही. GPS ऑन असल्याविषयी खात्री करा.");
      setIsDetectingLocation(false);
      return;
    }

    const { latitude: lat, longitude: lon } = loc;
    setFormData(prev => ({ ...prev, lat, lon }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=en-US,en`,
        {
          headers: {
            "User-Agent": "VionexSmartFarming/1.0",
          },
        }
      );
          const data = await response.json();

          if (data && data.address) {
            const address = data.address;
            
            const rawState = address.state || "";
            const rawDistrict = address.state_district || address.district || address.county || address.city_district || "";
            const rawTaluka = address.subdistrict || address.tehsil || address.taluk || address.suburb || address.taluka || address.city || address.town || address.municipality || "";
            const rawVillage = address.village || address.suburb || address.town || address.neighbourhood || address.hamlet || address.locality || address.croft || "";
            
            const extractPincode = (p: string, d: string): string => {
              const combined = `${p || ""} ${d || ""}`;
              const match = combined.match(/\b\d{6}\b/);
              return match ? match[0] : "";
            };

            const rawPincode = extractPincode(address.postcode, data.display_name);

            // Gather all text values from structured address and comma-split display name
            const addrValues = [
              ...Object.values(address).map(v => String(v)),
              ...(data.display_name ? data.display_name.split(",").map(s => s.trim()) : [])
            ].filter(Boolean);

            const cleanAndNormalize = (str: string): string => {
              if (!str) return "";
              return str.toLowerCase()
                .replace(/\(.*\)/g, "")
                .replace(/district|tehsil|taluka|taluk|subdistrict|division|village|town|city|state/g, "")
                .replace(/[^a-z0-9]/g, "")
                .trim();
            };

            const isNameMatch = (nameA: string, nameB: string): boolean => {
              if (!nameA || !nameB) return false;
              const normA = cleanAndNormalize(nameA);
              const normB = cleanAndNormalize(nameB);
              if (!normA || !normB) return false;
              
              if (normA === normB) {
                return true;
              }
              
              if (normA.length >= 5 && normB.length >= 5) {
                if (normA.includes(normB) || normB.includes(normA)) {
                  return true;
                }
              }
              
              return false;
            };

            // Check if it's Maharashtra
            const isMaha = rawState.toLowerCase().includes("maharashtra") ||
                           addrValues.some(v => v.toLowerCase().includes("maharashtra")) ||
                           MAHARASHTRA_DISTRICTS.some(d => isNameMatch(d, rawDistrict));

            let finalState = "Other";
            let finalDistrict = "";
            let finalTaluka = "";
            let finalVillage = "";
            let setManual = true;

            if (isMaha) {
              finalState = "Maharashtra";

              // 1. Find matched district
              let matchedDist = MAHARASHTRA_DISTRICTS.find(d => isNameMatch(d, rawDistrict));
              if (!matchedDist) {
                matchedDist = MAHARASHTRA_DISTRICTS.find(d => addrValues.some(val => isNameMatch(d, val)));
              }
              finalDistrict = matchedDist || rawDistrict || "Yavatmal";

              // 2. Find matched taluka
              const talukas = getTalukasForDistrict(finalDistrict);
              let matchedTal = talukas.find(t => isNameMatch(t, rawTaluka));
              if (!matchedTal) {
                matchedTal = talukas.find(t => addrValues.some(val => isNameMatch(t, val)));
              }
              finalTaluka = matchedTal || rawTaluka || "";

              // 3. Find matched village
              if (finalTaluka) {
                const villages = getVillagesForTaluka(finalTaluka);
                
                // Prioritize rawVillage (from address.village, hamlet, etc.)
                let matchedVill = villages.find(v => isNameMatch(v, rawVillage));
                
                if (matchedVill) {
                  finalVillage = matchedVill;
                  setManual = false;
                } else {
                  // Fallback: check other address fields, but avoid aggressive matching
                  // We only check if it matches EXACTLY to avoid "Siddhewadi road" matching "Siddhewadi"
                  const exactVill = villages.find(v => {
                    const normV = cleanAndNormalize(v);
                    return addrValues.some(val => cleanAndNormalize(val) === normV);
                  });
                  
                  if (exactVill) {
                    finalVillage = exactVill;
                    setManual = false;
                  } else {
                    finalVillage = rawVillage;
                    setManual = true;
                  }
                }
              } else {
                finalVillage = rawVillage;
                setManual = true;
              }
            } else {
              finalState = rawState || "Other";
              finalDistrict = rawDistrict;
              finalTaluka = rawTaluka;
              finalVillage = rawVillage;
              setManual = true;
            }

            setIsManualVillage(setManual);
            setFormData((prev) => ({
              ...prev,
              address: data.display_name,
              pincode: rawPincode,
              state: finalState,
              district: finalDistrict,
              taluka: finalTaluka,
              village: finalVillage,
              country: (address.country === "India" || address.country_code === "in") ? "India" : (address.country || prev.country),
            }));
          }
        } catch (error) {
          console.error("Error detecting location:", error);
          alert("लोकेशन शोधण्यात अडचण आली.");
        } finally {
          setIsDetectingLocation(false);
        }
  };

  const handlePincodeChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const rawValue = e.target.value;
    const pincode = rawValue.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode }));

    if (pincode.length === 6) {
      await fetchPincodeData(pincode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    onSave({ ...formData, crops });
  };

  return (
    <div className="w-full h-full bg-white flex flex-col relative z-50">
      <div className="flex items-center gap-2 p-1.5 bg-emerald-800 text-white shadow-sm shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="p-1 -ml-1 hover:bg-emerald-700/50 rounded transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-[11px] font-bold">
          {initialData ? "शेतकरी माहिती अपडेट करा" : "शेतकरी नोंदणी"}
        </h2>
      </div>
      <form
        id="add-farmer-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs font-bold shadow-sm">
            {submitError}
          </div>
        )}
        {/* Farmer Details */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase">
            शेतकरी फोटो
          </label>
          <div className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-100 bg-slate-100 flex items-center justify-center">
             {isCompressingPhoto ? (
               <div className="flex flex-col items-center justify-center text-center p-1">
                 <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-[8px] text-emerald-700 font-bold mt-1">प्रक्रिया सुरू...</span>
               </div>
             ) : formData.photoUrl ? (
                <img src={formData.photoUrl} alt="Farmer" className="w-full h-full object-cover" />
             ) : (
                <Camera className="w-8 h-8 text-slate-400" />
             )}
             {!isCompressingPhoto && (
               <input
                 type="file"
                 accept="image/*"
                 capture="environment"
                 className="absolute inset-0 opacity-0 cursor-pointer"
                 onChange={async (e) => {
                   const file = e.target.files?.[0];
                   if (file) {
                     setIsCompressingPhoto(true);
                     setPhotoError("");
                     try {
                       const compressedBase64 = await compressImage(file);
                       setFormData((prev) => ({ ...prev, photoUrl: compressedBase64 }));
                     } catch (err: any) {
                       console.error("Image compression error:", err);
                       setPhotoError("फोटो जतन करण्यास असमर्थ: " + (err.message || "अज्ञात त्रुटी"));
                     } finally {
                       setIsCompressingPhoto(false);
                     }
                   }
                 }}
               />
             )}
          </div>
          {photoError && (
            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
              {photoError}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            placeholder="पूर्ण नाव"
            required
            className="w-full px-2 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="tel"
            placeholder="मोबाईल नंबर"
            required
            className="w-full px-2 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none"
            value={formData.mobile}
            onChange={(e) =>
              setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })
            }
          />
        </div>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="ॲप पासवर्ड"
            required
            autoComplete="new-password"
            style={{ WebkitTextSecurity: showPassword ? "none" : "disc" } as React.CSSProperties}
            className="w-full pl-2 pr-8 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
          >
            {showPassword ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mb-2 mt-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase">
            पत्त्याचा तपशील
          </label>
          <button
            type="button"
            onClick={autoDetectLocation}
            disabled={isDetectingLocation}
            className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-200 transition disabled:opacity-50"
          >
            <MapPin className="w-3 h-3" />
            {isDetectingLocation ? "लोकत आहे..." : "माझे लोकेशन वापरा"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            className="w-full px-1 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
          >
            <option value="India">India (भारत)</option>
          </select>
          <select
            className="w-full px-1 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none"
            value={formData.state}
            onChange={(e) => {
              const s = e.target.value;
              setFormData({ 
                ...formData, 
                state: s, 
                district: s === "Maharashtra" ? "Yavatmal" : "", 
                taluka: "", 
                village: "", 
                dealer: "" 
              });
              setIsManualVillage(false);
            }}
          >
            <option value="">राज्य निवडा</option>
            {indianStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder={isLoadingPincode ? "शोधत आहे..." : "पिन नंबर"}
            required
            className="w-full px-2 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none"
            value={formData.pincode}
            onChange={handlePincodeChange}
          />
          {formData.state === "Maharashtra" ? (
            <select
              className="w-full px-1 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none font-medium"
              value={formData.district}
              onChange={(e) => {
                const distVal = e.target.value;
                setFormData({ 
                  ...formData, 
                  district: distVal, 
                  taluka: "", 
                  village: "", 
                  dealer: "" 
                });
                setIsManualVillage(false);
              }}
            >
              <option value="">जिल्हा निवडा (District)</option>
              {MAHARASHTRA_DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
              {formData.district && !MAHARASHTRA_DISTRICTS.includes(formData.district) && (
                <option value={formData.district}>{formData.district}</option>
              )}
            </select>
          ) : (
            <input
              type="text"
              placeholder="जिल्हा"
              className="w-full px-2 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none"
              value={formData.district}
              onChange={(e) =>
                setFormData({ ...formData, district: e.target.value })
              }
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {formData.state === "Maharashtra" ? (
            <select
              className="w-full px-1 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none font-medium"
              value={formData.taluka}
              onChange={(e) => {
                const talVal = e.target.value;
                setFormData({ 
                  ...formData, 
                  taluka: talVal, 
                  village: "", 
                  dealer: "" 
                });
                setIsManualVillage(false);
              }}
              disabled={!formData.district}
            >
              <option value="">तालुका निवडा (Taluka)</option>
              {getTalukasForDistrict(formData.district).map((tal) => (
                <option key={tal} value={tal}>
                  {tal}
                </option>
              ))}
              {formData.taluka && !getTalukasForDistrict(formData.district).includes(formData.taluka) && (
                <option value={formData.taluka}>{formData.taluka}</option>
              )}
            </select>
          ) : (
            <input
              type="text"
              placeholder="तालुका/तहसील"
              className="w-full px-2 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none"
              value={formData.taluka}
              onChange={(e) =>
                setFormData({ ...formData, taluka: e.target.value })
              }
            />
          )}

          {(!isManualVillage && computedVillages.length > 0) ? (
            <div className="relative w-full">
              <select
                className="w-full px-1 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none font-medium text-slate-800"
                value={formData.village}
                onChange={(e) => {
                  if (e.target.value === "__manual__") {
                    setIsManualVillage(true);
                    setFormData({ ...formData, village: "", dealer: "" });
                  } else {
                    setFormData({ ...formData, village: e.target.value, dealer: "" });
                  }
                }}
              >
                <option value="">गाव निवडा (Village)</option>
                {computedVillages.map((v, i) => (
                  <option key={i} value={v}>
                    {v}
                  </option>
                ))}
                <option value="__manual__">➕ इतर गाव (मॅन्युअली लिहा)</option>
              </select>
            </div>
          ) : (
            <div className="relative w-full flex items-center">
              <input
                type="text"
                placeholder="गाव (Village)"
                className="w-full px-2 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none pr-8"
                value={formData.village}
                onChange={(e) =>
                  setFormData({ ...formData, village: e.target.value, dealer: "" })
                }
              />
              {computedVillages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsManualVillage(false)}
                  className="absolute right-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-black transition"
                  title="परत यादीत जा"
                >
                  यादी
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="विक्रेता (Dealer / Shop Name)"
              className="w-full px-2 py-2 rounded border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none"
              value={formData.dealer}
              onChange={(e) => {
                setFormData({ ...formData, dealer: e.target.value });
                setIsDealerDropdownOpen(true);
              }}
              onFocus={() => setIsDealerDropdownOpen(true)}
              onBlur={() => {
                // Wait for the click/touchstart event to trigger on list elements
                setTimeout(() => setIsDealerDropdownOpen(false), 200);
              }}
            />
            
            {isDealerDropdownOpen && (
              <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl divide-y divide-slate-100">
                {(() => {
                  const matchVillage = (v1: string, v2: string) => {
                    if (!v1 || !v2) return false;
                    const clean1 = v1.toLowerCase().replace(/[\u0900-\u097F\s()]+/g, "").trim();
                    const clean2 = v2.toLowerCase().replace(/[\u0900-\u097F\s()]+/g, "").trim();
                    if (clean1 && clean2 && (clean1 === clean2 || clean1.includes(clean2) || clean2.includes(clean1))) return true;
                    return v1.toLowerCase().trim() === v2.toLowerCase().trim();
                  };

                  if (!formData.village) {
                    return (
                      <div className="p-3 text-[10px] text-red-500 font-bold text-center">
                        कृपया प्रथम वरून तुमचे गाव निवडा.
                      </div>
                    );
                  }

                  const matchedDealers = (dealers || []).filter(d => matchVillage(d.village, formData.village));

                  if (matchedDealers.length === 0) {
                    return (
                      <div className="p-3 text-[10px] text-slate-400 text-center">
                        या गावासाठी कोणताही डीलर सापडला नाही. मॅन्युअली टाईप करा.
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="px-2 py-1.5 text-[9px] font-black tracking-wider text-slate-400 bg-slate-50 uppercase">
                        गावातील अधिकृत विक्रेते (Dealers in your village):
                      </div>
                      {matchedDealers.filter(d => {
                        const searchStr = (formData.dealer || "").toLowerCase();
                        const nameMatch = (d.name || "").toLowerCase().includes(searchStr);
                        const shopMatch = (d.shopName || "").toLowerCase().includes(searchStr);
                        return nameMatch || shopMatch;
                      }).map((d, i) => {
                        const dispValue = d.shopName || d.name;
                        return (
                          <button
                            key={i}
                            type="button"
                            className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 active:bg-emerald-100 flex flex-col transition-colors"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, dealer: dispValue }));
                              setIsDealerDropdownOpen(false);
                            }}
                          >
                            <span className="font-bold text-slate-800">{dispValue}</span>
                            <span className="text-[10px] text-slate-500">
                              {d.name && d.name !== d.shopName ? `${d.name} | ` : ""}
                              {[d.village, d.taluka].filter(Boolean).join(", ")}
                            </span>
                          </button>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        <hr className="my-2 border-slate-100" />

        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase">
            पिकाचा तपशील
          </label>
          <button
            type="button"
            onClick={addCrop}
            className="text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 bg-emerald-50 px-2 py-1 rounded transition-colors"
          >
            + आणखी पीक जोडा
          </button>
        </div>

        {crops.map((cropEntry, index) => (
          <div
            key={index}
            className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg relative"
          >
            {crops.length > 1 && (
              <button
                type="button"
                onClick={() => removeCrop(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold"
              >
                टाळा (X)
              </button>
            )}

            <div className="grid grid-cols-2 gap-2 mt-2">
              <select
                className="w-full px-2 py-2 rounded border border-slate-200 text-xs bg-white"
                value={cropEntry.crop}
                onChange={(e) => updateCrop(index, "crop", e.target.value)}
              >
                <option value="">पीक निवडा</option>
                {commonCrops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="प्लॉटचे नाव (ऐच्छिक उदा. प्लॉट १)"
                className="w-full px-2 py-2 rounded border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                value={cropEntry.plotName || ""}
                onChange={(e) => updateCrop(index, "plotName", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  placeholder="वाण / व्हरायटी"
                  list={`variety-options-${index}`}
                  className="w-full px-2 py-2 rounded border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  value={cropEntry.variety}
                  onChange={(e) => updateCrop(index, "variety", e.target.value)}
                />
                <datalist id={`variety-options-${index}`}>
                  {(cropVarieties[cropEntry.crop] || []).map((v, i) => (
                    <option key={i} value={v} />
                  ))}
                </datalist>
              </div>
              <select
                className="w-full px-1 py-2 rounded border border-slate-200 text-[10px] font-bold bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                value={cropEntry.season}
                onChange={(e) => updateCrop(index, "season", e.target.value)}
              >
                {(cropSeasons[cropEntry.crop] || defaultSeasons).map((s, i) => (
                  <option key={i} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="क्षेत्र (एकर)"
                className="w-full px-2 py-2 rounded border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                value={cropEntry.area}
                onChange={(e) => updateCrop(index, "area", e.target.value)}
              />
              <div className="flex items-center w-full px-2 py-1.5 rounded border border-slate-200 bg-white focus-within:ring-1 focus-within:ring-emerald-500">
                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap mr-1.5">
                  लागवड/छाटणी:
                </span>
                <div className="flex-1">
                  <DatePicker
                    value={cropEntry.plantationDate}
                    onChange={(date) => updateCrop(index, "plantationDate", date)}
                    className="border-none hover:bg-transparent px-0 py-0 text-slate-700 bg-transparent flex flex-row-reverse justify-end gap-1.5"
                    placeholder="तारीख..."
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-center gap-4 mt-6 mb-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-3 py-1.5 rounded font-bold hover:bg-slate-200 transition"
          >
            बॅक/रद्द करा
          </button>
          <button
            type="submit"
            className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded font-bold hover:bg-emerald-200 transition"
          >
            जतन करा
          </button>
        </div>
      </form>
    </div>
  );
}

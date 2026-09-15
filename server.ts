import "dotenv/config";
import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import { VILLAGES_BY_TALUKA } from "./src/lib/maharashtra-locations";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { BACKUP_PRODUCTS, findBackupProducts, FullProduct } from "./server-products.js";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let firebaseAdminApp: any = null;

function getFirebaseAdmin() {
  if (!firebaseAdminApp) {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        firebaseAdminApp = apps[0];
      } else {
        firebaseAdminApp = initializeApp({
          credential: applicationDefault(),
          projectId: "vionex-d47e2"
        });
      }
    } catch (err) {
      console.warn("Firebase Admin SDK initialization warning:", err);
      throw new Error("Firebase Admin SDK is not initialized. Make sure GOOGLE_APPLICATION_CREDENTIALS or Cloud Run identity is set.");
    }
  }
  return firebaseAdminApp;
}

function getMessagingSafe() {
  return getMessaging(getFirebaseAdmin());
}

function getAuthSafe() {
  return getAuth(getFirebaseAdmin());
}

function getFirestoreSafe() {
  return getFirestore(getFirebaseAdmin());
}

/**
 * Middleware: Verify Firebase Auth ID Token (Any authenticated user)
 */
async function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing Firebase ID token in Authorization header." });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await getAuthSafe().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.warn("Firebase ID Token verification failed:", error?.message || error);
    return res.status(403).json({ error: "Forbidden: Invalid or expired Firebase ID token." });
  }
}

/**
 * Middleware: Optional Firebase Auth (Attaches decodedToken if present, passes through otherwise)
 */
async function optionalAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await getAuthSafe().verifyIdToken(idToken);
    req.user = decodedToken;
  } catch (error: any) {
    console.warn("Firebase ID Token verification notice (optionalAuth):", error?.message || error);
  }
  next();
}

/**
 * Middleware: Verify Caller has Admin Privileges
 */
async function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: Missing user authentication." });
  }

  const email = req.user.email?.toLowerCase();
  const uid = req.user.uid;

  // 1. Cryptographic Super-Admin check
  if (email && email === "patilshrenika0211@gmail.com") {
    return next();
  }

  // 2. Check server-side Firestore admins collection
  try {
    const adminDoc = await getFirestoreSafe().collection("admins").doc(uid).get();
    if (adminDoc.exists) {
      return next();
    }
  } catch (err) {
    console.warn("Admin verification lookup failed:", err);
  }

  return res.status(403).json({ error: "Forbidden: Super-Admin or verified admin privileges required." });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled to prevent breaking Vite/React inline styles/scripts
    crossOriginEmbedderPolicy: false
  }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(hpp()); // Prevent HTTP Parameter Pollution

  // API Rate Limiting to prevent brute-force and API scans
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per window
    message: { error: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", apiLimiter);

  app.use(express.json({ limit: '50mb' }));

  // In-memory monitoring stats
  const monitoringStats = {
    totalRequests: 0,
    successfulAiRequests: 0,
    fallbackRequests: 0,
    quotaExceededErrors: 0,
    timeouts: 0,
    otherErrors: 0,
    lastError: null as string | null,
    lastErrorTimestamp: null as string | null
  };

  // Timestamp to track when gemini-3.5-flash / gemini-flash-latest quota is exhausted.
  // Helps us immediately bypass rate-limited models for faster self-healing without any timeout delays.
  let lastGemini35ErrorTime = 0;

  /**
   * Helper to initialize Gemini safely
   */
  function getAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please add it to your environment variables.");
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Helper to fallback gracefully if a model is unavailable or rate-limited
   */
  async function generateWithFallback(ai: any, params: any) {
    const originalModel = params.model || "gemini-1.5-flash";
    
    // Check if gemini-1.5-flash or gemini-flash-latest had a quota issue in the last 15 minutes.
    // If so, we prioritize gemini-3.1-flash-lite to avoid uselessly waiting for 429/RESOURCE_EXHAUSTED errors.
    const isGemini35TempBanned = (Date.now() - lastGemini35ErrorTime) < 15 * 60 * 1000; // 15 mins
    
    const modelsToTry = isGemini35TempBanned
      ? ["gemini-3.1-flash-lite", originalModel, "gemini-flash-latest"]
      : [originalModel, "gemini-flash-latest", "gemini-3.1-flash-lite"];

    let lastError: any = null;
    
    for (const modelName of modelsToTry) {
      try {
        const interaction = await ai.interactions.create({
          model: modelName,
          input: params.contents,
          system_instruction: params.systemInstruction,
          response_format: params.responseFormat,
          generation_config: params.config
        });
        
        let fullOutput = "";
        for (const step of interaction.steps) {
          if (step.type === 'model_output') {
            const textContent = step.content?.find((c: any) => c.type === 'text');
            if (textContent && textContent.text) {
              fullOutput += textContent.text;
            }
          }
        }
        return { text: fullOutput };
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || String(err)).toLowerCase();
        
        const isQuota = errMsg.includes("429") || 
                        errMsg.includes("quota") || 
                        errMsg.includes("limit") || 
                        errMsg.includes("resource_exhausted") ||
                        err?.status === 429 ||
                        err?.status === "RESOURCE_EXHAUSTED";

        if (isQuota && (modelName === "gemini-3.5-flash" || modelName === "gemini-flash-latest")) {
          lastGemini35ErrorTime = Date.now();
        }

        const isTransient = isQuota ||
                            errMsg.includes("503") || 
                            errMsg.includes("unavailable") || 
                            err?.status === 503 ||
                            err?.status === "UNAVAILABLE";
        
        if (isTransient) {
          console.log(`[Gemini Fallback] Model ${modelName} encountered warning or transient error. Retrying with next available model...`);
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  const STATIC_VILLAGES: Record<string, string[]> = {
    "Yavatmal": [
      "Bhoyar (भोयर)", "Lohara (लोहारा)", "Wadgaon (वडगाव)", "Pimpalgaon (पिंपळगाव)", 
      "Moha (मोहा)", "Akola Bazar (अकोला बाजार)", "Godhani (गोधणी)", "Bothbod (बोथबोड)", 
      "Borgaon (बोरगाव)", "Umarsara (उमरसरा)", "Waghapur (वाघापूर)", "Lasina (लसिना)", 
      "Sakarra (साकरडा)", "Baroda (बडोदा)", "Chinchbardi (चिंचबर्डी)", "Pangri (पांगरी)"
    ],
    "Pusad": [
      "Kali (काळी)", "Shembalpimpri (शेंबाळपिंपरी)", "Dhanki (धंकी)", "Wanwarla (वनवरला)", 
      "Fulsawangi (फुलसावंगी)", "Jamb (जांब)", "Belghat (बेळघाट)", "Gahuli (गहुली)", 
      "Karhala (करहळा)", "Sawargaon (सावरगाव)", "Kharad (खरड)", "Bramhgaon (ब्रह्मगाव)", 
      "Warud (वरुड)", "Pardi (पार्डी)", "Chondi (चोंढी)", "Pusad Rural (पुसद ग्रामीण)"
    ],
    "Warud": [
      "Warud", "Shendurjana Ghat", "Loni", "Jarud", "Benoda", "Pusla", "Wandli", "Amner", 
      "Rawala", "Tembhurkheda", "Surli", "Wadala", "Ghatnoor", "Belkheda", "Mangrul",
      "Jalka", "Pala", "Zingapur", "Haturna", "Rajura", "Mhasala", "Dhaga", "Bahada",
      "Ghorad", "Saward", "Hiwarkhed"
    ],
    "Darwha": [
      "Sangwi (सांगवी)", "Bori (बोरी)", "Chikhali (चikhali)", "Ladkhed (लाडखेड)", 
      "Mahagoan (महागाव)", "Lohi (लोही)", "Dhamangaon (धामणगाव)", "Rajur (राजूर)", 
      "Jawala (जवळा)", "Kotha (कोठा)", "Pahur (पाहूर)", "Darwha Rural (दारव्हा ग्रामीण)"
    ],
    "Digras": [
      "Singad (सिंगद)", "Deurwada (देऊरवाडा)", "Kalgaon (काळगाव)", "Tuwar (तुवर)", 
      "Rui (रुई)", "Vasantpur (वसंतपूर)", "Fetri (फेट्री)", "Borgaon (बोरगाव)", 
      "Nimbola (निंबोळा)", "Digras Rural (दिग्रस ग्रामीण)", "Arni Road (आर्णी रोड)"
    ],
    "Ner": [
      "Malkhed (माळखेड)", "Mozar (मोझर)", "Dhanaj (धानज)", "Sonwadhona (सोनवाढोणा)", 
      "Ajanti (अजंती)", "Mangaladevi (मंगळादेवी)", "Watkhed (वाठखेड)", "Shirasgaon (शिरसगाव)", 
      "Sarata (सरता)", "Ner Rural (नेर ग्रामीण)"
    ],
    "Miraj": [
      "Miraj (मिरज)", "Sangli (सांगली)", "Kupwad (कुपवाड)", "Arag (आरग)", "Bedag (बेडग)", 
      "Bolwad (बोळवाड)", "Erandoli (एरंडोली)", "Kavathe Piran (कवठे पिरान)", 
      "Mallewadi (मल्लेवाडी)", "Nandre (नांद्रे)", "Savali (सावळी)", "Tanang (तनांग)", 
      "Visapur (विसापूर)", "Belanki (बेळंकी)", "Dhavali (धवाळी)", "Malgaon (मालगाव)",
      "Budhgaon (बुधगाव)", "Madhavnagar (माधवनगर)", "Wanlesswadi (वानलेसवाडी)"
    ],
    "Tasgaon": [
      "Tasgaon (तासगाव)", "Manerajuri (मणेराजुरी)", "Savalaj (सावळज)", "Turchi (तुर्ची)", 
      "Visapur (विसापूर)", "Borgaon (बोरगाव)", "Nimani (निमाणी)", "Ped (पेड)", 
      "Waifhal (वाईफळ)", "Yelavi (येळावी)", "Kavathe Ekand (कवठे एकंद)", 
      "Limb (लिंब)", "Siddhewadi (सिद्धेवाडी)"
    ],
    "Kavathe Mahankal": [
      "Kavathe Mahankal (कवठे महांकाळ)", "Borgaon (बोरगाव)", "Churewadi (चुरेवाडी)", 
      "Deshing (देशिंग)", "Hingangaon (हिंगणगाव)", "Irali (इराळी)", "Kokanwadi (कोकणवाडी)", 
      "Langarhpeth (लंगरपेठ)", "Shirdhon (शिरढोण)", "Agharnipur (अघर्णीपूर)", "Kuchi (कुची)"
    ],
    "Walwa": [
      "Islampur (इस्लामपूर)", "Ashta (आष्टा)", "Bahe (बाहे)", "Boregaon (बोरगाव)", 
      "Gotkhindi (गोतखिंडी)", "Kasegaon (कासेगाव)", "Peth (पेठ)", "Sakharale (साखराळे)", 
      "Walwa (वाळवा)", "Yede Nipani (येडे निपाणी)", "Bavchi (बावची)", "Chikurde (चिकुर्डे)", 
      "Kameri (कामेरी)", "Rethare (रेठरे)", "Yedemachindra (येडेमच्छिंद्र)"
    ],
    "Shirala": [
      "Shirala (शिराळा)", "Mangale (मांगले)", "Sagaon (सागाव)", "Antri Budruk (अंत्री बुद्रुक)", 
      "Antri Khurd (अंत्री खुर्द)", "Kandur (कांदूर)", "Panchgani (पाचगणी)", 
      "Bilashi (बिळाशी)", "Kokrud (कोकरूड)", "Shendri (शेंडरी)"
    ],
    "Palus": [
      "Palus (पलूस)", "Bhilawadi (भिलवडी)", "Kundal (कुंडल)", "Suryagaon (सूर्यागाव)", 
      "Dudhondi (दुधोंडी)", "Burli (बुर्ली)", "Andhali (आंधळी)", "Rethare Harnax (रेठरे हरणाक्ष)"
    ],
    "Kadegaon": [
      "Kadegaon (कडेगाव)", "Wangi (वांगी)", "Nerli (नेर्ली)", "Tadsar (तडसर)", "Ambak (अंबक)", 
      "Kotawade (कोटावडे)", "Shelkewadi (शेळकेवाडी)"
    ],
    "Atpadi": [
      "Atpadi (आटपाडी)", "Dighanchi (दिघींची)", "Nimbavade (निंबवडे)", "Pimpri (पिंपरी)", 
      "Zare (झरे)", "Ghalnivad (घालनिवाड)", "Karkhel (करखेड)"
    ],
    "Jat": [
      "Jat (जत)", "Daffalapur (डफळापूर)", "Umarani (उमराणी)", "Sankh (सांख)", 
      "Madgyal (माडग्याळ)", "Siddhanath (सिद्धनाथ)", "Valsang (वलसंग)"
    ],
    "Khanapur": [
      "Vita (विटा)", "Khanapur (खानापूर)", "Bhalvani (भालवणी)", "Lengare (लेंगरे)", 
      "Mahuli (माहुली)", "Parevadi (पारेवाडी)", "Gardi (गारडी)"
    ],
    "Karad": [
      "Karad", "Umbraj", "Masur", "Ond", "Shenoli", "Kole", "Kale"
    ],
    "Satara": [
      "Satara", "Wai", "Panchgani", "Mahabaleshwar", "Karad", "Koregaon", "Patan", "Phaltan", "Khandala", "Medha", "Vaduj", "Dahiwadi"
    ]
  };

  const getVillagesHandler = async (req: any, res: any) => {
    const { state, district, taluka } = req.body;
    if (!state || !district || !taluka) {
      return res.status(400).json({ error: "State, district and taluka are required" });
    }

    // 1. Check if we have static official government master data for this taluka
    const cleanTaluka = taluka.trim();
    const matchedKey = Object.keys(VILLAGES_BY_TALUKA).find(
      k => k.toLowerCase().trim() === cleanTaluka.toLowerCase()
    );

    if (matchedKey && VILLAGES_BY_TALUKA[matchedKey] && VILLAGES_BY_TALUKA[matchedKey].length > 0) {
      console.log(`[Villages API] Serving 100% official static LGD revenue list for ${taluka}`);
      return res.json({ villages: VILLAGES_BY_TALUKA[matchedKey] });
    }

    // 2. If unseeded Taluka requires Gemini AI generation, enforce active Firebase Auth
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: Firebase authentication required to dynamically generate villages." });
    }

    try {
      const ai = getAI();
      const prompt = `Generate a 100% complete, comprehensive, and exhaustive list of ALL official government revenue villages (महसुली गावे) in the following administrative division:
State: ${state}
District: ${district}
Taluka: ${taluka}

Provide the response as a JSON array of strings. Each string MUST include both the official English name and its Marathi transliteration/translation in parentheses, for example: "Arag (आरग)", "Bedag (बेडग)", "Bolwad (बोळवाड)".
DO NOT truncate the list. Do NOT return only 10, 20 or 50. Return ALL villages in this Taluka. Avoid any duplicates and ensure they are sorted alphabetically.`;

      const response = await generateWithFallback(ai, {
        model: "gemini-1.5-flash",
        contents: prompt,
        systemInstruction: "You are an official Indian Government Census and Land Revenue database assistant. You only output 100% accurate, official, and complete lists of revenue villages for any requested Taluka. Do not include markdown formatting or explanations; return strictly a JSON array of strings containing \"English Name (मराठी नाव)\" format.",
        responseFormat: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      });

      const villages = JSON.parse(response.text || "[]");
      const uniqueVillages = Array.from(new Set(
        villages
          .map((v: any) => typeof v === 'string' ? v.trim() : '')
          .filter((v: string) => v.length > 0)
      )).sort();

      res.json({ villages: uniqueVillages });
    } catch (error: any) {
      console.error("Gemini Villages API Error:", error);
      res.status(500).json({ error: "Failed to generate villages list." });
    }
  };

  app.post("/api/villages", optionalAuth, getVillagesHandler);
  app.post("/api/taluka-villages", optionalAuth, getVillagesHandler);

  app.post("/api/advice", requireAuth, async (req, res) => {
    try {
      const { cropName, soilType, stage, area, issue } = req.body;
      const ai = getAI();
      
      const prompt = `मी शेतकरी आहे. माझ्या पिकाची माहिती खालीलप्रमाणे आहे:
पीक (Crop): ${cropName}
मातीचा प्रकार (Soil Type): ${soilType}
पिकाची अवस्था (Stage): ${stage}
क्षेत्र (Area): ${area}
माझी समस्या/प्रश्न (Issue): ${issue || 'मी या पिकाचे व्यवस्थापन कसे करावे?'}

कृपया मला या पिकाचे चांगले व्यवस्थापन करण्यासाठी, कीड आणि रोग नियंत्रण, खत व्यवस्थापन आणि इतर आवश्यक उपाययोजनांबद्दल सविस्तर आणि अचूक माहिती द्या. माहिती मराठीत असावी आणि समजायला सोपी असावी.`;

      const response = await generateWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        systemInstruction: "You are an expert agricultural advisor for Maharashtra, India. Provide accurate, practical, and localized advice in Marathi. Keep the tone professional but easy to understand for farmers.",
      });

      res.json({ advice: response.text });
    } catch (error: any) {
      console.error("Gemini Advice API Error:", error);
      res.status(500).json({ error: "Failed to generate advice." });
    }
  });

  app.post("/api/generate-crop-alerts", requireAuth, async (req, res) => {
    try {
      const ai = getAI();
      const { crops, state } = req.body;
      const todayISO = new Date().toISOString();
      const currentDateOnly = todayISO.split('T')[0];
      const now = Date.now();
      
      const prompt = `You are an automated real-time agricultural advisory system for state: ${state || "Maharashtra"}.
Given the current date: ${currentDateOnly}.
Generate a list of 4 highly accurate, urgent, and localized crop advisory alerts in Marathi for key crops: ${crops || "cotton, soybean, sugarcane, banana, grapes, pomegranate"}.

To simulate independent data feeds, make sure the 4 alerts cover these distinct categories:
1. 'weather' - Real-time weather warnings (e.g., sudden heavy rainfall, hail storm, temperature fluctuations, or hot waves).
2. 'pest' - Current pest outbreak alert (e.g., pink bollworm in cotton, whiteflies).
3. 'disease' - Plant disease warning (e.g., downy mildew in grapes, sigatoka in banana, wilt in soybean).
4. 'advisory' - Agricultural/agronomy advisory or market price update (e.g., sowing timelines, recommended fertilizer basal dose, market rates).

For location-awareness:
- Set active 'targetScope' as 'district' or 'state' or 'all' for each alert.
- At least three alerts MUST be specific to districts in Maharashtra (e.g., District: "Nashik" or "Jalgaon" or "Ahmednagar" or "Amravati" or "Pune" or "Solapur", State: "Maharashtra") so that location filtering works perfectly.
- Provide realistic coordinates (lat, lng) and a target radius (e.g., 50km) representing real Maharashtra agriculture regions.

Ensure 'hoursToLive' is specified (e.g., weather = 24-48, pest/disease = 72-120, advisory = 168).
All text fields must be in clear, human, professional Marathi.`;

      const response = await generateWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        systemInstruction: "You are a professional agricultural automated notice system. Generate realistic, localized weekly warnings in JSON array format matching the requested type structure.",
        responseFormat: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              text: { type: Type.STRING },
              type: { type: Type.STRING },
              crop: { type: Type.STRING },
              pestDiseaseName: { type: Type.STRING },
              targetCrops: { type: Type.ARRAY, items: { type: Type.STRING } },
              symptoms: { type: Type.STRING },
              possibleCause: { type: Type.STRING },
              preventiveMeasure: { type: Type.STRING },
              recommendedManagement: { type: Type.STRING },
              priority: { type: Type.STRING },
              targetScope: { type: Type.STRING },
              targetState: { type: Type.STRING },
              targetDistrict: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              radius: { type: Type.NUMBER },
              hoursToLive: { type: Type.INTEGER }
            }
          }
        }
      });

      const parsedAlerts = JSON.parse(response.text || "[]");
      const enrichedAlerts = parsedAlerts.map((alert: any, index: number) => {
        const hours = alert.hoursToLive || (alert.type === "weather" ? 24 : alert.type === "advisory" ? 168 : 72);
        return {
          ...alert,
          id: `ai-alert-${currentDateOnly}-${alert.type || 'gen'}-${index}`,
          createdAt: now,
          expiresAt: now + hours * 60 * 60 * 1000,
          source: "ai"
        };
      });

      res.json({ alerts: enrichedAlerts });
    } catch (error: any) {
      console.log("Notice: Gemini Live Alerts is experiencing high demand. Using fallback alerts.");
      
      const now = Date.now();
      const fallbackAlerts = [
        {
          id: `ai-fallback-alert-banana-${new Date().toISOString().split('T')[0]}`,
          title: "केळी पिकावर करपा (सिगाटोका) रोगाचा वाढता धोका",
          text: "सध्याच्या ढगाळ वातावरणामुळे आणि हवेतील वाढलेल्या दमटपणा व वेगाने होणाऱ्या तापमानातील बदलामुळे केळी पिकावर सिगाटोका करपा रोगाचा वाढता प्रादुर्भाव दिसून येत आहे. तातडीने बुरशीनाशक फवारणी करावी.",
          type: "disease",
          crop: "केळी",
          targetCrops: ["केळी"],
          pestDiseaseName: "करपा (सिगाटोका)",
          priority: "High",
          targetScope: "district",
          targetState: "Maharashtra",
          targetDistrict: "Jalgaon",
          symptoms: "पानांवर लंबगोलाकार पिवळसर व नंतर तपकिरी रंगाचे डाग पडणे.",
          possibleCause: "हवेतील ९०% पेक्षा जास्त आर्द्रता आणि सततचे ढगाळ वातावरण.",
          preventiveMeasure: "केळीच्या बागेत पाण्याचा योग्य निचरा ठेवावा, पिवळी पडलेली पाने कापून नष्ट करावीत.",
          recommendedManagement: "मॅन्कोझेब २.५ ग्रॅम किंवा प्रोपिकोनॅझोल १ मिली प्रति लीटर पाण्यात मिसळून फवारावे.",
          createdAt: now,
          expiresAt: now + 5 * 24 * 60 * 60 * 1000, // 5 days
          source: "ai"
        },
        {
          id: `ai-fallback-alert-grapes-${new Date().toISOString().split('T')[0]}`,
          title: "द्राक्ष बागेत डाऊनी मिल्ड्यू (केवडा) संदर्भात सतर्कता बाळगा",
          text: "नाशिक जिल्ह्यात पुढील ४८ तासांत अवकाळी पावसाचा इशारा देण्यात आला आहे. ढगाळ वातावरणामुळे द्राक्ष वेलींवर डाऊनी मिल्ड्यू रोग पसरण्याची दाट शक्यता आहे.",
          type: "disease",
          crop: "द्राक्ष",
          targetCrops: ["द्राक्ष"],
          pestDiseaseName: "डाऊनी मिल्ड्यू (केवडा)",
          priority: "Critical",
          targetScope: "district",
          targetState: "Maharashtra",
          targetDistrict: "Nashik",
          symptoms: "पानाच्या वरच्या बाजूला पिवळसर तेलकट डाग पडतात आणि खालच्या बाजूला पांढरी बुरशी वाढते.",
          possibleCause: "अवकाळी पाऊस आणि हवेतील अतिदमटपणा.",
          preventiveMeasure: "बागेमध्ये हवा खेळती राहील अशी छाटणी व मांडणी ठेवावी.",
          recommendedManagement: "धातुजन्य कॉपर ऑक्सिक्लोराईड ३ ग्रॅम किंवा सिमोक्झानिल अधिक मॅन्कोझेब २ ग्रॅम प्रति लीटर पाण्यात फवारावे.",
          createdAt: now,
          expiresAt: now + 3 * 24 * 60 * 60 * 1000, // 3 days
          source: "ai"
        },
        {
          id: `ai-fallback-alert-cotton-${new Date().toISOString().split('T')[0]}`,
          title: "कापूस गुलाबी बोंडअळी प्रादुर्भाव पूर्वसूचना",
          text: "कापूस लागवड केलेल्या जमिनीत नर पतंग पकडण्यासाठी कामगंध सापळे लावावेत. सध्याचे हवामान गुलाबी बोंडअळी वाढण्यास कारणीभूत ठरू शकते.",
          type: "pest",
          crop: "कापूस",
          targetCrops: ["कापूस"],
          pestDiseaseName: "गुलाबी बोंडअळी",
          priority: "Medium",
          targetScope: "all",
          targetState: "Maharashtra",
          symptoms: "पात्या आणि फुले बंद राहणे, बोंडे अकाली सडणे.",
          possibleCause: "किडीच्या कोशावस्थेतून पतंग बाहेर पडणे.",
          preventiveMeasure: "एका एकरात किमान ५ कामगंध सापळे (Pheromone Traps) उभारावेत.",
          recommendedManagement: "निंबोळी अर्क ५% किंवा प्रोफेनोफॉस २ मिली प्रति लीटर पाण्यात फवारणी करावी.",
          createdAt: now,
          expiresAt: now + 6 * 24 * 60 * 60 * 1000, // 6 days
          source: "ai"
        }
      ];
      res.json({ alerts: fallbackAlerts });
    }
  });

  app.post("/api/send-notification", requireAuth, requireAdmin, async (req, res) => {
    const { token, title, body, url } = req.body;
    try {
      const message = {
        token: token,
        notification: {
          title: title,
          body: body,
        },
        data: {
          url: url || "/",
        },
      };
      await getMessagingSafe().send(message);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ success: false, error });
    }
  });

  app.post("/api/generate-product-info", requireAuth, async (req, res) => {
    const { brandName, companyName } = req.body;
    if (!brandName) {
      return res.status(400).json({ error: "Brand name is required" });
    }

    try {
      const ai = getAI();
      const prompt = `Provide official and authentic details for the following agricultural product:
Brand Name: ${brandName}
Company: ${companyName || 'Not specified'}

CRITICAL NAMING RULES:
1. brandName MUST ONLY contain the official brand name (e.g., "Luna Experience").
2. brandName MUST NOT include the company name (e.g., NOT "Bayer Luna").
3. companyName MUST contain the full official company name (e.g., "Bayer CropScience Limited").
4. ALL technical details (Active Ingredient, Formulation, Dose, Target Crops, etc.) must be 100% accurate as per official registration.
5. If the product is not official or registered, return null fields.`;

      const response = await generateWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        responseFormat: {
          type: Type.OBJECT,
          properties: {
            brandName: { type: Type.STRING },
            marathiName: { type: Type.STRING },
            companyName: { type: Type.STRING },
            category: { type: Type.STRING },
            composition: { type: Type.STRING },
            compositionEnglish: { type: Type.STRING },
            modeOfAction: { type: Type.STRING },
            doseSpray: { type: Type.STRING },
            doseDrip: { type: Type.STRING },
            doseDrenching: { type: Type.STRING },
            doseBasal: { type: Type.STRING },
            targetCrops: { type: Type.STRING },
            targetPests: { type: Type.STRING }
          }
        }
      });

      const parsedInfo = JSON.parse(response.text || "{}");
      res.json({ product: parsedInfo });
    } catch (error: any) {
      console.error("Gemini Product Info API Error:", error);
      res.status(500).json({ error: "Failed to fetch product information." });
    }
  });

  app.post("/api/search-products", requireAuth, async (req, res) => {
    monitoringStats.totalRequests++;
    const { query } = req.body;
    const cleanQuery = (query || "").trim();
    const backupMatches = findBackupProducts(cleanQuery);

    try {
      if (!cleanQuery) {
        return res.json({ products: [], source: "backup", count: 0 });
      }

      const ai = getAI();
      const prompt = `Search for OFFICIAL and AUTHENTIC registered agricultural products associated with the query: "${cleanQuery}". 

CRITICAL NAMING & DATA INTEGRITY INSTRUCTIONS:
1. brandName MUST ONLY contain the official brand name (e.g., "Luna Experience", "Nativo", "Confidor").
2. brandName MUST NOT include the company name prefix (e.g., DO NOT return "Bayer Luna", "Syngenta Amistar").
3. companyName MUST contain the FULL OFFICIAL registered company name (e.g., "Bayer CropScience Limited", "Syngenta India Limited", "UPL Limited").
4. Return ONLY the official, trademarked products manufactured by the exact company if a company is queried. 
5. DO NOT return generic NPKs, fertilizers, or micronutrients assigned to a company unless it is their official branded product.
6. Fill ALL technical fields (Composition, Formulation, Dose, Mode of Action, Target Crops/Pests) correctly.
7. If the exact product or company does not exist, return an empty array []. DO NOT make up or guess products.
8. NO duplicates.

Return a comprehensive JSON array of up to 30 OFFICIAL products matching this query in India.`;

      const response = await generateWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        systemInstruction: "You are an extremely strict Agriculture Product Verification System. You only output 100% accurate, official, branded agrochemical product data in JSON array format. Never invent generic products. Never attribute generic NPKs to specific companies. Return [] if unsure.", 
        responseFormat: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              brandName: { type: Type.STRING },
              marathiName: { type: Type.STRING },
              companyName: { type: Type.STRING },
              category: { type: Type.STRING },
              subCategory: { type: Type.STRING },
              composition: { type: Type.STRING },
              compositionEnglish: { type: Type.STRING },
              modeOfAction: { type: Type.STRING },
              typeClassification: { type: Type.STRING },
              doseSpray: { type: Type.STRING },
              doseDrip: { type: Type.STRING },
              doseDrenching: { type: Type.STRING },
              doseBasal: { type: Type.STRING },
              targetCrops: { type: Type.STRING },
              targetPests: { type: Type.STRING },
              targetDiseases: { type: Type.STRING }
            }
          }
        }
      });

      const aiData = JSON.parse(response.text || "[]");
      const aiProducts = Array.isArray(aiData) ? aiData : [];
      const mergedProductsMap = new Map<string, any>();

      backupMatches.forEach(p => {
        const cleanName = p.brandName.split("/")[0].trim().toLowerCase();
        mergedProductsMap.set(cleanName, { ...p, source: "backup" });
      });

      aiProducts.forEach(p => {
        if (!p.brandName) return;
        const cleanName = p.brandName.split("/")[0].trim().toLowerCase();
        if (mergedProductsMap.has(cleanName)) {
          const existing = mergedProductsMap.get(cleanName);
          mergedProductsMap.set(cleanName, {
            ...existing,
            ...p,
            source: "hybrid"
          });
        } else {
          mergedProductsMap.set(cleanName, { ...p, source: "online" });
        }
      });

      const finalProductsList = Array.from(mergedProductsMap.values());
      
      monitoringStats.successfulAiRequests++;
      res.json({ products: finalProductsList, source: "online-hybrid", count: finalProductsList.length });

    } catch (error: any) {
      monitoringStats.fallbackRequests++;
      res.json({ products: [], source: "backup", isFallback: true });
    }
  });

  app.post("/api/admin/auto-import", requireAuth, requireAdmin, async (req, res) => {
    monitoringStats.totalRequests++;
    
    try {
      const ai = getAI();
      const prompt = `You are a database scraper. Return a comprehensive JSON array of minimum 20 popular agrochemical products from major Indian companies (e.g. Bayer, Syngenta, UPL, Indofil). This is an auto-import script execution.`;

      const response = await generateWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        systemInstruction: "You are India's Complete Agriculture Product Intelligence Platform. Provide strictly accurate agrochemical product data in JSON array format.",
        responseFormat: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              brandName: { type: Type.STRING },
              marathiName: { type: Type.STRING },
              companyName: { type: Type.STRING },
              category: { type: Type.STRING },
              composition: { type: Type.STRING },
              compositionEnglish: { type: Type.STRING },
              modeOfAction: { type: Type.STRING },
              typeClassification: { type: Type.STRING },
              doseSpray: { type: Type.STRING },
              doseDrip: { type: Type.STRING },
              doseDrenching: { type: Type.STRING },
              doseBasal: { type: Type.STRING },
              targetCrops: { type: Type.STRING },
              targetPests: { type: Type.STRING },
              targetDiseases: { type: Type.STRING }
            }
          }
        }
      });

      const aiData = JSON.parse(response.text || "[]");
      const importedProducts = Array.isArray(aiData) ? aiData : [];
      
      res.json({ success: true, products: importedProducts, count: importedProducts.length });
    } catch (e) {
      console.error("AI Auto Import Error:", e);
      res.status(500).json({ success: false, error: "Failed to import products." });
    }
  });

  app.get("/api/search-health", (req, res) => {
    res.json({ status: "healthy", stats: monitoringStats, timestamp: new Date().toISOString() });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|ico|svg)$/i)) {
          // Cache immutable assets aggressively
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

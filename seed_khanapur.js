import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore";
import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("./firebase-applet-config.json", "utf8"));
const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, config.firestoreDatabaseId);

const villages = [
  { en: "Ainwadi", mr: "ऐनवाडी" },
  { en: "Alsund", mr: "आळसुंद" },
  { en: "Balvadi", mr: "बाळवाडी" },
  { en: "Balvadi Bhalvani", mr: "बाळवाडी भाळवणी" },
  { en: "Bamani", mr: "बामणी" },
  { en: "Banurgad", mr: "बाणूरगड" },
  { en: "Benapur", mr: "बेणापूर" },
  { en: "Bhadakewadi", mr: "भडकेवाडी" },
  { en: "Bhagyanagar", mr: "भाग्यनगर" },
  { en: "Bhalwani", mr: "भाळवणी" },
  { en: "Bhambarde", mr: "भांबर्डे" },
  { en: "Bhendvade", mr: "भेंडवडे" },
  { en: "Bhikawadi Bk.", mr: "भिकवडी बुद्रुक" },
  { en: "Bhood", mr: "भूड" },
  { en: "Chikhalhol", mr: "चिखलहोळ" },
  { en: "Chinchani", mr: "चिंचणी" },
  { en: "Devikhindi", mr: "देवीखिंडी" },
  { en: "Devnagar", mr: "देवनगर" },
  { en: "Dhawaleshwar", mr: "धवळेश्वर" },
  { en: "Dhondewadi", mr: "धोंडेवाडी" },
  { en: "Dhondgewadi", mr: "धोंडगेवाडी" },
  { en: "Gardi", mr: "गार्डी" },
  { en: "Ghadgewadi", mr: "घाडगेवाडी" },
  { en: "Ghanwad", mr: "घानवड" },
  { en: "Ghoti Bk", mr: "घोटी बुद्रुक" },
  { en: "Ghoti Kh", mr: "घोटी खुर्द" },
  { en: "Gorewadi", mr: "गोरेवाडी" },
  { en: "Himgangade", mr: "हिमगंगडे" },
  { en: "Hivare", mr: "हिवरे" },
  { en: "Jadhavnagar", mr: "जाधवनगर" },
  { en: "Jadhavwadi", mr: "जाधववाडी" },
  { en: "Jakhinwadi", mr: "जखीनवाडी" },
  { en: "Jondhalkhindi", mr: "जोंधळखिंडी" },
  { en: "Kalambi", mr: "कळंबी" },
  { en: "Kamlapur", mr: "कमलापूर" },
  { en: "Karanje", mr: "करंजे" },
  { en: "Karve", mr: "कर्वे" },
  { en: "Khambale Bhalvani", mr: "खांबळे भाळवणी" },
  { en: "Khanapur", mr: "खानापूर" },
  { en: "Kurli", mr: "कुर्ली" },
  { en: "Kusbavade", mr: "कुसबावडे" },
  { en: "Lengre", mr: "लेंगरे" },
  { en: "Madhalmuthi", mr: "माढळमुठी" },
  { en: "Mahuli", mr: "माहुली" },
  { en: "Mangrul", mr: "मंगरूळ" },
  { en: "Menganwadi", mr: "मेंगणवाडी" },
  { en: "Mohi", mr: "मोही" },
  { en: "Nagewadi", mr: "नागेवाडी" },
  { en: "Palashi", mr: "पळशी" },
  { en: "Panchlingnagar", mr: "पंचलिंगनगर" },
  { en: "Pare", mr: "पारे" },
  { en: "Posewadi", mr: "पोसेवाडी" },
  { en: "Ramnagar", mr: "रामनगर" },
  { en: "Renavi", mr: "रेणावी" },
  { en: "Rewangaon", mr: "रेवणगाव" },
  { en: "Salshinge", mr: "साळशिंगे" },
  { en: "Sangole", mr: "सांगोले" },
  { en: "Shendgewadi", mr: "शेंडगेवाडी" },
  { en: "Sultangade", mr: "सुलतानगादे" },
  { en: "Tadachiwadi", mr: "तडाचीवाडी" },
  { en: "Tandalgaon", mr: "तांदळगाव" },
  { en: "Vejegaon", mr: "वेजेगाव" },
  { en: "Vita", mr: "विटा" },
  { en: "Walkhad", mr: "वाळखड" },
  { en: "Waluj", mr: "वाळूज" },
  { en: "Wasumbe", mr: "वासुंबे" },
  { en: "Wazar", mr: "वाझर" }
];

async function run() {
  console.log('Adding new villages for Khanapur (Vita)...');
  let batch = writeBatch(db);
  let count = 0;
  
  for (const v of villages) {
    let base = v.en;
    const vilCode = base.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase().replace(/W/g, 'V');
    const code = `MA_SAN_KHA_${vilCode}`;
    
    const docRef = doc(db, 'master-locations', code);
    batch.set(docRef, {
      id: code,
      villageCode: code,
      state: "Maharashtra",
      district: "Sangli",
      taluka: "Khanapur (Vita)",
      village: v.en,
      villageMarathi: v.mr,
      updatedAt: Date.now()
    });
    count++;
    
    if (count % 50 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  
  if (count % 50 !== 0) {
    await batch.commit();
  }
  
  console.log(`Added ${count} villages for Khanapur (Vita).`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

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
  { en: "Ahirwadi", mr: "अहिरवाडी" },
  { en: "Aitavade Bk", mr: "ऐतवडे बु." },
  { en: "Aitavade Kh", mr: "ऐतवडे खु." },
  { en: "Bagani", mr: "बागणी" },
  { en: "Bahadurwadi", mr: "बहादूरवाडी" },
  { en: "Bahe", mr: "बाहे" },
  { en: "Banewadi", mr: "बाणेवाडी" },
  { en: "Bavchi", mr: "बावची" },
  { en: "Beradmachi", mr: "बेरडमाची" },
  { en: "Bhadkimbe", mr: "भडकिंबे" },
  { en: "Bharatwadi", mr: "भरतवाडी" },
  { en: "Bhatwadi", mr: "भाटवाडी" },
  { en: "Bhavaninagar", mr: "भवानीनगर" },
  { en: "Bichud", mr: "बिचूद" },
  { en: "Borgaon", mr: "बोरगाव" },
  { en: "Chikurde", mr: "चिकुर्डे" },
  { en: "Devarde", mr: "देवर्डे" },
  { en: "Dhagewadi", mr: "ढगेवाडी" },
  { en: "Dhavali", mr: "ढवळी" },
  { en: "Dhotrewadi", mr: "धोत्रेवाडी" },
  { en: "Dongarwadi", mr: "डोंगरवाडी" },
  { en: "Dudhari", mr: "दुधारी" },
  { en: "Farnewadi", mr: "फरणेवाडी" },
  { en: "Gatadwadi", mr: "गताडवाडी" },
  { en: "Gaundwadi", mr: "गौंडवाडी" },
  { en: "Ghabakwadi", mr: "घबकवाडी" },
  { en: "Gotkhindi", mr: "गोटखिंडी" },
  { en: "Hubalwadi", mr: "हुबलवाडी" },
  { en: "Itakare", mr: "इटकरे" },
  { en: "Jakraiwadi", mr: "जक्राईवाडी" },
  { en: "Jambhulwadi", mr: "जांभूळवाडी" },
  { en: "June Khed", mr: "जुने खेड" },
  { en: "Kakachiwadi", mr: "काकाचीवाडी" },
  { en: "Kalamwadi", mr: "काळमवाडी" },
  { en: "Kameri", mr: "कामेरी" },
  { en: "Kanegaon", mr: "कानेगाव" },
  { en: "Kapuskhed", mr: "कापूसखेड" },
  { en: "Karandwadi", mr: "करंदवाडी" },
  { en: "Karanjvade", mr: "करंजवडे" },
  { en: "Karve", mr: "कार्वे" },
  { en: "Kasegaon", mr: "कासेगाव" },
  { en: "Kedarwadi", mr: "केदारवाडी" },
  { en: "Kharatwadi", mr: "खरातवाडी" },
  { en: "Kille Machhindra Gad", mr: "किल्ले मच्छिंद्र गड" },
  { en: "Kole", mr: "कोळे" },
  { en: "Konoli", mr: "कोनोली" },
  { en: "Koregaon", mr: "कोरेगाव" },
  { en: "Krishnanagar", mr: "कृष्णानगर" },
  { en: "Kundalwadi", mr: "कुंडलवाडी" },
  { en: "Kurlap", mr: "कुर्लाप" },
  { en: "Ladegaon", mr: "लाडेगाव" },
  { en: "Lavanmachi", mr: "लवणमाची" },
  { en: "Mahadevwadi", mr: "महादेववाडी" },
  { en: "Malewadi", mr: "माळेवाडी" },
  { en: "Manikwadi", mr: "माणिकवाडी" },
  { en: "Maralnathpur", mr: "मराळनाथपूर" },
  { en: "Mardawadi", mr: "मर्दावाडी" },
  { en: "Masuchiwadi", mr: "मसुचीवाडी" },
  { en: "Mirajwadi", mr: "मिरजवाडी" },
  { en: "Nagaon", mr: "नागाव" },
  { en: "Narsihapur", mr: "नरसिंहपूर" },
  { en: "Nave Khed", mr: "नवे खेड" },
  { en: "Naykalwadi", mr: "नायकलवाडी" },
  { en: "Nerle", mr: "नेर्ले" },
  { en: "Ozarde", mr: "ओझर्डे" },
  { en: "Padavalwadi", mr: "पडवळवाडी" },
  { en: "Peth", mr: "पेठ" },
  { en: "Phalkewadi & Chandachiwadi", mr: "फळकेवाडी आणि चंदाचीवाडी" },
  { en: "Pharnewadi", mr: "फरणेवाडी" },
  { en: "Pokharni", mr: "पोखर्णी" },
  { en: "Rethare Dharan", mr: "रेठरे धरण" },
  { en: "Rethare Harnaksha", mr: "रेठरे हरणाक्ष" },
  { en: "Rozawadi", mr: "रोजावाडी" },
  { en: "Sakharale", mr: "साखराळे" },
  { en: "Satapewadi", mr: "सतापेवाडी" },
  { en: "Shekharwadi", mr: "शेखरवाडी" },
  { en: "Shene", mr: "शेणे" },
  { en: "Shigaon", mr: "शिगाव" },
  { en: "Shirate", mr: "शिरटे" },
  { en: "Shirgaon", mr: "शिरगाव" },
  { en: "Shivpuri", mr: "शिवपुरी" },
  { en: "Surul", mr: "सुरूल" },
  { en: "Takari", mr: "ताकारी" },
  { en: "Tambave", mr: "तांबवे" },
  { en: "Tandulwadi", mr: "तांदुळवाडी" },
  { en: "Thanapude", mr: "ठाणापुडे" },
  { en: "Tujarpur", mr: "तुजारपूर" },
  { en: "Vashi", mr: "वाशी" },
  { en: "Vitthalwadi", mr: "विठ्ठलवाडी" },
  { en: "Waghwadi", mr: "वाघवाडी" },
  { en: "Walwa", mr: "वाळवा" },
  { en: "Wategaon", mr: "वाटेगाव" },
  { en: "Yede Machchhindra", mr: "येडे मच्छिंद्र" },
  { en: "Yede Nipani", mr: "येडे निपाणी" },
  { en: "Yelur", mr: "येळूर" },
  { en: "Yewalewadi", mr: "येवलेवाडी" },
  { en: "Islampur", mr: "इस्लामपूर" },
  { en: "Ashta", mr: "आष्टा" }
];

async function run() {
  console.log('Adding new villages for Walwa...');
  let batch = writeBatch(db);
  let count = 0;
  
  for (const v of villages) {
    let base = v.en;
    const vilCode = base.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase().replace(/W/g, 'V');
    const code = `MA_SAN_WAL_${vilCode}`;
    
    const docRef = doc(db, 'master-locations', code);
    batch.set(docRef, {
      id: code,
      villageCode: code,
      state: "Maharashtra",
      district: "Sangli",
      taluka: "Walwa",
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
  
  console.log(`Added ${count} villages for Walwa.`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

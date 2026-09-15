const fs = require('fs');

const products = [
  {
    brandName: "Saaf (साफ)",
    marathiName: "साफ",
    companyName: "UPL",
    category: "Fungicide (बुरशीनाशक)",
    composition: "Carbendazim (कार्बेन्डाझिम) 12% + Mancozeb (मॅन्कोझेब) 63% WP",
    compositionEnglish: "Carbendazim 12% + Mancozeb 63% WP",
    modeOfAction: "Contact + Systemic (स्पर्शजन्य व आंतरप्रवाही)",
    targetCrops: "Chilli (मिरची), Tomato (टोमॅटो), Soybean (सोयाबीन), Vegetables (भाजीपाला), Grapes (द्राक्षे), Pomegranate (डाळिंब) व फळझाडे",
    targetPests: "Leaf Spot (पानावरील डाग), Blight (करपा), Powdery Mildew (भुरी), Rust (गंज), Root Rot (मूळ कुज), Wilt (मर), Fungal Diseases (बुरशीजन्य रोग)",
    doseSpray: "2 - 2.5 gm/Litre (२ - २.५ ग्रॅम/लिटर)",
    doseDrip: "500 gm/Acre (५०० ग्रॅम/एकर)",
    doseDrenching: "500 gm/Acre (५०० ग्रॅम/एकर)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: रोग येण्यापूर्वी (प्रतिबंधक) किंवा रोगाची सुरुवातीची लक्षणे दिसताच फवारणी केल्यास १००% फायदा मिळतो. पाण्यात सिलिकॉन स्टिकर वापरल्यास बुरशीनाशक पानात चांगले पसरते.",
    status: "live"
  },
  {
    brandName: "Coragen (कोराजन)",
    marathiName: "कोराजन",
    companyName: "FMC",
    category: "Insecticide (कीटकनाशक)",
    composition: "Chlorantraniliprole (क्लोरँट्रानिलीप्रोल) 18.5% SC",
    compositionEnglish: "Chlorantraniliprole 18.5% SC",
    modeOfAction: "Systemic (आंतरप्रवाही)",
    targetCrops: "Sugarcane (ऊस), Soybean (सोयाबीन), Cotton (कापूस), Maize (मका), Tomato (टोमॅटो), Chilli (मिरची), Brinjal (वांगी), Pigeon Pea (तूर)",
    targetPests: "Stem Borer (खोडकिडा), Fruit Borer (फळ पोखरणारी अळी), Diamondback Moth (डीबीएम), Pod Borer (शेंगा पोखरणारी अळी), Green Semilooper (लष्करी अळी)",
    doseSpray: "0.4 ml/Litre (०.४ मिली/लिटर)",
    doseDrip: "150 ml/Acre (१५० मिली/एकर)",
    doseDrenching: "150 ml/Acre (१५० मिली/एकर)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: अळीच्या सर्व अवस्थांवर अत्यंत प्रभावी. पिकाच्या फुलोरा अवस्थेत किंवा फळधारणेच्या वेळी वापरल्यास दीर्घकाळ संरक्षण मिळते.",
    status: "live"
  },
  {
    brandName: "Nativo (नॅटीवो)",
    marathiName: "नॅटीवो",
    companyName: "Bayer",
    category: "Fungicide (बुरशीनाशक)",
    composition: "Tebuconazole (टेबुकॉनाझोल) 50% + Trifloxystrobin (ट्रायफ्लोक्सिस्ट्रोबिन) 25% WG",
    compositionEnglish: "Tebuconazole 50% + Trifloxystrobin 25% WG",
    modeOfAction: "Systemic (आंतरप्रवाही)",
    targetCrops: "Rice (भात), Chilli (मिरची), Tomato (टोमॅटो), Grapes (द्राक्षे), Mango (आंबा), Pomegranate (डाळिंब)",
    targetPests: "Blast (करपा), Powdery Mildew (भुरी), Anthracnose (काळा करपा), Leaf Spot (पानावरील डाग), Fruit Rot (फळ सड)",
    doseSpray: "0.5 gm/Litre (०.५ ग्रॅम/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: उच्च दर्जाचे आधुनिक बुरशीनाशक. पिकाला काळोखी आणते आणि उत्पन्नात वाढ करते.",
    status: "live"
  },
  {
    brandName: "Alika (अलिका)",
    marathiName: "अलिका",
    companyName: "Syngenta",
    category: "Insecticide (कीटकनाशक)",
    composition: "Thiamethoxam (थायमेथोक्साम) 12.6% + Lambda-cyhalothrin (लॅम्बडा सायहॅलोथ्रीन) 9.5% ZC",
    compositionEnglish: "Thiamethoxam 12.6% + Lambda-cyhalothrin 9.5% ZC",
    modeOfAction: "Contact + Systemic (स्पर्शजन्य व आंतरप्रवाही)",
    targetCrops: "Cotton (कापूस), Soybean (सोयाबीन), Chilli (मिरची), Tomato (टोमॅटो), Maize (मका), Vegetables (भाजीपाला)",
    targetPests: "Aphids (मावा), Jassids (तुडतुडे), Thrips (फुलकिडे), Whitefly (पांढरी माशी), Bollworm (बोंड अळी), Caterpillar (अळी)",
    doseSpray: "0.5 ml/Litre (०.५ मिली/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: एकाच वेळी रसशोषक कीड आणि अळीच्या नियंत्रणासाठी अत्यंत प्रभावी. नवीन तंत्रज्ञानामुळे दीर्घकाळ रिझल्ट मिळतो.",
    status: "live"
  },
  {
    brandName: "Ulala (उलाला)",
    marathiName: "उलाला",
    companyName: "UPL",
    category: "Insecticide (कीटकनाशक)",
    composition: "Flonicamid (फ्लोनिकामाईड) 50% WG",
    compositionEnglish: "Flonicamid 50% WG",
    modeOfAction: "Systemic (आंतरप्रवाही)",
    targetCrops: "Cotton (कापूस), Chilli (मिरची), Tomato (टोमॅटो), Brinjal (वांगी), Onion (कांदा), Vegetables (भाजीपाला)",
    targetPests: "Aphids (मावा), Jassids (तुडतुडे), Whitefly (पांढरी माशी), Thrips (फुलकिडे)",
    doseSpray: "0.4 gm/Litre (०.४ ग्रॅम/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: रसशोषक किडींसाठी जागतिक स्तरावर प्रसिद्ध. किडींना तात्काळ खाण्यापासून रोखते, ज्यामुळे पिकाचे नुकसान थांबते.",
    status: "live"
  },
  {
    brandName: "Bavistin (बाविस्टीन)",
    marathiName: "बाविस्टीन",
    companyName: "Crystal",
    category: "Fungicide (बुरशीनाशक)",
    composition: "Carbendazim (कार्बेन्डाझिम) 50% WP",
    compositionEnglish: "Carbendazim 50% WP",
    modeOfAction: "Systemic (आंतरप्रवाही)",
    targetCrops: "Grape (द्राक्षे), Walnut (अक्रोड), Apple (सफरचंद), Rose (गुलाब), Wheat (गहू), Barley (बार्ली)",
    targetPests: "Powdery Mildew (भुरी), Loose Smut (काणी रोग), Scab (खवले रोग)",
    doseSpray: "1 - 1.5 gm/Litre (१ - १.५ ग्रॅम/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: अत्यंत प्रभावी आणि सर्वत्र वापरले जाणारे बुरशीनाशक. बियाणे प्रक्रियेसाठी उत्तम.",
    status: "live"
  },
  {
    brandName: "Regent (रीजेंट)",
    marathiName: "रीजेंट",
    companyName: "Bayer",
    category: "Insecticide (कीटकनाशक)",
    composition: "Fipronil (फिप्रोनिल) 5% SC",
    compositionEnglish: "Fipronil 5% SC",
    modeOfAction: "Contact + Systemic (स्पर्शजन्य व आंतरप्रवाही)",
    targetCrops: "Cotton (कापूस), Cabbage (कोबी), Chilli (मिरची), Sugarcane (ऊस), Rice (भात)",
    targetPests: "Thrips (फुलकिडे), Aphids (मावा), Stem Borer (खोडकिडा), Diamondback Moth (डीबीएम)",
    doseSpray: "1.5 - 2 ml/Litre (१.५ - २ मिली/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: फुलकिडे (Thrips) आणि खोडकिड्यावर अत्यंत प्रभावी. पिकाला हिरवेगार बनवते.",
    status: "live"
  },
  {
    brandName: "Pegasus (पेगासस)",
    marathiName: "पेगासस",
    companyName: "Syngenta",
    category: "Insecticide (कीटकनाशक)",
    composition: "Diafenthiuron (डायफेनथियुरॉन) 50% WP",
    compositionEnglish: "Diafenthiuron 50% WP",
    modeOfAction: "Contact (स्पर्शजन्य) व Translaminar",
    targetCrops: "Cotton (कापूस), Cabbage (कोबी), Chilli (मिरची), Brinjal (वांगी), Cardamom (वेलची)",
    targetPests: "Whitefly (पांढरी माशी), Thrips (फुलकिडे), Aphids (मावा), Jassids (तुडतुडे), Mites (कोळी)",
    doseSpray: "1.2 - 1.5 gm/Litre (१.२ - १.५ ग्रॅम/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: पांढरी माशी आणि कोळी (Mites) किडीसाठी एक सर्वोत्तम पर्याय. पानाच्या खालच्या बाजूला लपलेल्या किडींनाही मारते.",
    status: "live"
  },
  {
    brandName: "Amistar Top (अमिस्टार टॉप)",
    marathiName: "अमिस्टार टॉप",
    companyName: "Syngenta",
    category: "Fungicide (बुरशीनाशक)",
    composition: "Azoxystrobin (अझोक्सीस्ट्रोबिन) 18.2% + Difenoconazole (डायफेनोकोनाझोल) 11.4% SC",
    compositionEnglish: "Azoxystrobin 18.2% + Difenoconazole 11.4% SC",
    modeOfAction: "Systemic (आंतरप्रवाही)",
    targetCrops: "Tomato (टोमॅटो), Chilli (मिरची), Cotton (कापूस), Wheat (गहू), Corn (मका), Onion (कांदा)",
    targetPests: "Blight (करपा), Rust (गंज), Leaf Spot (पानावरील डाग), Powdery Mildew (भुरी)",
    doseSpray: "1 ml/Litre (१ मिली/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: पीक वाढीच्या कोणत्याही टप्प्यावर वापरता येते. बुरशीचा प्रादुर्भाव रोखते व पिकाची गुणवत्ता सुधारते.",
    status: "live"
  },
  {
    brandName: "Fame (फेम)",
    marathiName: "फेम",
    companyName: "Bayer",
    category: "Insecticide (कीटकनाशक)",
    composition: "Flubendiamide (फ्लुबेंडामाइड) 39.35% SC",
    compositionEnglish: "Flubendiamide 39.35% SC",
    modeOfAction: "Systemic (आंतरप्रवाही)",
    targetCrops: "Cotton (कापूस), Cabbage (कोबी), Tomato (टोमॅटो), Chilli (मिरची), Pigeon Pea (तूर), Rice (भात)",
    targetPests: "Bollworm (बोंड अळी), Fruit Borer (फळ पोखरणारी अळी), Pod Borer (शेंगा पोखरणारी अळी), Stem Borer (खोडकिडा)",
    doseSpray: "0.2 - 0.3 ml/Litre (०.२ - ०.३ मिली/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: अळी वर्गातील सर्व प्रकारच्या किडींवर अत्यंत वेगाने नियंत्रण मिळवते. पिकासाठी सुरक्षित.",
    status: "live"
  },
  {
    brandName: "Roundup (राऊंडअप)",
    marathiName: "राऊंडअप",
    companyName: "Bayer",
    category: "Herbicide (तणनाशक)",
    composition: "Glyphosate (ग्लायफोसेट) 41% SL",
    compositionEnglish: "Glyphosate 41% SL",
    modeOfAction: "Systemic (आंतरप्रवाही) - Non-Selective",
    targetCrops: "Non-cropped areas (पडीक जमीन), Orchards (फळबागा)",
    targetPests: "All types of weeds (सर्व प्रकारची तणे)",
    doseSpray: "8 - 10 ml/Litre (८ - १० मिली/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: तणाच्या मुळांपर्यंत जाऊन पूर्णपणे नायनाट करते. चुकूनही मुख्य पिकावर फवारणी उडू देऊ नये.",
    status: "live"
  },
  {
    brandName: "Urea (युरिया)",
    marathiName: "युरिया",
    companyName: "IFFCO",
    category: "Fertilizer (खत)",
    composition: "Nitrogen (नत्र) 46%",
    compositionEnglish: "Nitrogen 46%",
    modeOfAction: "Nutrient (पोषक घटक)",
    targetCrops: "All Crops (सर्व पिके)",
    targetPests: "Nitrogen Deficiency (नत्राची कमतरता)",
    doseSpray: "1 - 2% Solution (१ - २% द्रावण)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "50 kg/Acre (५० किलो/एकर)",
    notes: "स्पेशालिस्ट शिफारस: पिकाच्या शाकीय वाढीसाठी सर्वात महत्त्वाचे खत. पिकाला गडद हिरवा रंग मिळतो.",
    status: "live"
  },
  {
    brandName: "DAP 18:46:00 (डीएपी)",
    marathiName: "डीएपी 18:46:00",
    companyName: "IFFCO",
    category: "Fertilizer (खत)",
    composition: "Nitrogen (नत्र) 18% + Phosphorus (स्फुरद) 46%",
    compositionEnglish: "Nitrogen 18% + Phosphorus 46%",
    modeOfAction: "Nutrient (पोषक घटक)",
    targetCrops: "All Crops (सर्व पिके)",
    targetPests: "Phosphorus Deficiency (स्फुरद कमतरता)",
    doseSpray: "Not Applicable (लागू नाही)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "50 kg/Acre (५० किलो/एकर)",
    notes: "स्पेशालिस्ट शिफारस: पेरणीच्या वेळी किंवा लागवडीच्या वेळी बेस डोस म्हणून वापरण्यास उत्तम. मुळांची जोमदार वाढ होते.",
    status: "live"
  },
  {
    brandName: "MOP 00:00:60 (एमओपी)",
    marathiName: "एमओपी 00:00:60",
    companyName: "Mahadhan",
    category: "Fertilizer (खत)",
    composition: "Potassium (पालाश) 60%",
    compositionEnglish: "Potassium 60%",
    modeOfAction: "Nutrient (पोषक घटक)",
    targetCrops: "All Crops (सर्व पिके)",
    targetPests: "Potassium Deficiency (पालाश कमतरता)",
    doseSpray: "Not Applicable (लागू नाही)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "25 - 50 kg/Acre (२५ - ५० किलो/एकर)",
    notes: "स्पेशालिस्ट शिफारस: फळांचा आकार, रंग आणि चव सुधारण्यासाठी आवश्यक. पिकामध्ये रोगप्रतिकारक शक्ती वाढवते.",
    status: "live"
  },
  {
    brandName: "Humic Acid (ह्युमिक ॲसिड)",
    marathiName: "ह्युमिक ॲसिड",
    companyName: "Multiplex",
    category: "Bio-Stimulant (बायो-स्टिम्युलंट)",
    composition: "Humic Acid (ह्युमिक ॲसिड) 98%",
    compositionEnglish: "Humic Acid 98%",
    modeOfAction: "Root Enhancer (मुळांची वाढ करणारे)",
    targetCrops: "All Crops (सर्व पिके)",
    targetPests: "Poor Root Growth (मुळांची कमी वाढ)",
    doseSpray: "1 - 1.5 gm/Litre (१ - १.५ ग्रॅम/लिटर)",
    doseDrip: "1 kg/Acre (१ किलो/एकर)",
    doseDrenching: "1 kg/Acre (१ किलो/एकर)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: पांढऱ्या मुळांच्या जोमदार वाढीसाठी उत्कृष्ट. जमिनीचा पोत सुधारते व अन्नद्रव्ये शोषून घेण्यास मदत करते.",
    status: "live"
  },
  {
    brandName: "Confidor (कॉन्फिडोर)",
    marathiName: "कॉन्फिडोर",
    companyName: "Bayer",
    category: "Insecticide (कीटकनाशक)",
    composition: "Imidacloprid (इमिडाक्लोप्रिड) 17.8% SL",
    compositionEnglish: "Imidacloprid 17.8% SL",
    modeOfAction: "Systemic (आंतरप्रवाही)",
    targetCrops: "Cotton (कापूस), Chilli (मिरची), Tomato (टोमॅटो), Sugarcane (ऊस), Mango (आंबा)",
    targetPests: "Aphids (मावा), Jassids (तुडतुडे), Thrips (फुलकिडे), Whitefly (पांढरी माशी), Hoppers (तुडतुडे)",
    doseSpray: "0.5 - 0.75 ml/Litre (०.५ - ०.७५ मिली/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: रसशोषक किडींसाठी अत्यंत प्रभावी. दीर्घकाळ संरक्षण देते.",
    status: "live"
  },
  {
    brandName: "Sprint (स्प्रिंट)",
    marathiName: "स्प्रिंट",
    companyName: "Indofil",
    category: "Fungicide (बुरशीनाशक)",
    composition: "Mancozeb (मॅन्कोझेब) 50% + Carbendazim (कार्बेन्डाझिम) 25% WS",
    compositionEnglish: "Mancozeb 50% + Carbendazim 25% WS",
    modeOfAction: "Contact + Systemic (स्पर्शजन्य व आंतरप्रवाही)",
    targetCrops: "Potato (बटाटा), Tomato (टोमॅटो), Groundnut (भुईमूग), Wheat (गहू)",
    targetPests: "Late Blight (उशिरा येणारा करपा), Early Blight (लवकर येणारा करपा), Leaf Spot (पानावरील डाग)",
    doseSpray: "2 - 2.5 gm/Litre (२ - २.५ ग्रॅम/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: बियाणे प्रक्रियेसाठी (Seed Treatment) उत्कृष्ट. उगवण क्षमता सुधारते.",
    status: "live"
  },
  {
    brandName: "Largo (लार्गो)",
    marathiName: "लार्गो",
    companyName: "Dhanuka",
    category: "Insecticide (कीटकनाशक)",
    composition: "Spinetoram (स्पिनेटोरम) 11.7% SC",
    compositionEnglish: "Spinetoram 11.7% SC",
    modeOfAction: "Contact + Translaminar (स्पर्शजन्य व ट्रान्सलॅमिनार)",
    targetCrops: "Cotton (कापूस), Chilli (मिरची), Soybean (सोयाबीन)",
    targetPests: "Thrips (फुलकिडे), Bollworm (बोंड अळी), Fall Armyworm (लष्करी अळी)",
    doseSpray: "0.8 - 1 ml/Litre (०.८ - १ मिली/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: फुलकिडे (Thrips) आणि अळी दोन्हीवर एकाच वेळी प्रभावी नियंत्रण देते.",
    status: "live"
  },
  {
    brandName: "Sivanto (सिव्हँटो)",
    marathiName: "सिव्हँटो",
    companyName: "Bayer",
    category: "Insecticide (कीटकनाशक)",
    composition: "Flupyradifurone (फ्लुपायराडिफ्युरोन) 17.09% SL",
    compositionEnglish: "Flupyradifurone 17.09% SL",
    modeOfAction: "Systemic (आंतरप्रवाही)",
    targetCrops: "Cotton (कापूस), Chilli (मिरची), Okra (भेंडी)",
    targetPests: "Whitefly (पांढरी माशी), Jassids (तुडतुडे), Aphids (मावा)",
    doseSpray: "2 ml/Litre (२ मिली/लिटर)",
    doseDrip: "Not Applicable (लागू नाही)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: पांढऱ्या माशीवर अत्यंत वेगाने कार्य करते. मित्र कीटकांसाठी (उदा. मधमाशी) सुरक्षित.",
    status: "live"
  },
  {
    brandName: "NPK 19:19:19",
    marathiName: "१९:१९:१९",
    companyName: "Mahadhan",
    category: "Fertilizer (खत)",
    composition: "Nitrogen 19%, Phosphorus 19%, Potassium 19%",
    compositionEnglish: "Nitrogen 19%, Phosphorus 19%, Potassium 19%",
    modeOfAction: "Nutrient (पोषक घटक)",
    targetCrops: "All Crops (सर्व पिके)",
    targetPests: "Nutrient Deficiency (अन्नद्रव्य कमतरता)",
    doseSpray: "5 gm/Litre (५ ग्रॅम/लिटर)",
    doseDrip: "2 - 3 kg/Acre (२ - ३ किलो/एकर)",
    doseDrenching: "Not Applicable (लागू नाही)",
    doseBasal: "Not Applicable (लागू नाही)",
    notes: "स्पेशालिस्ट शिफारस: पिकाच्या सुरुवातीच्या शाकीय वाढीच्या अवस्थेत वापरल्यास सर्वांगीण वाढ होते.",
    status: "live"
  }
];

const tsCode = `export interface PreseededProduct {
  brandName: string;
  marathiName: string;
  companyName: string;
  category: string;
  composition: string;
  compositionEnglish?: string;
  formulation?: string;
  applicationMethods?: string;
  waitingPeriod?: string;
  compatibility?: string;
  registrationInfo?: string;
  packingSizes?: string;
  targetCrops?: string;
  targetPests?: string;
  doseSpray?: string;
  doseDrip?: string;
  doseDrenching?: string;
  doseBasal?: string;
  applicationTime?: string;
  priceInfo?: string;
  notes?: string;
  photoUrl?: string;
  modeOfAction?: string;
  isNewMolecule?: boolean;
  status?: string;
}

export const PRESEEDED_PRODUCTS: PreseededProduct[] = ${JSON.stringify(products, null, 2)};
`;

fs.writeFileSync('src/lib/preseeded-products.ts', tsCode);
console.log('Done generating preseeded-products.ts');

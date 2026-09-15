const fs = require('fs');
const content = fs.readFileSync('src/components/DealersView.tsx', 'utf-8');
const lines = content.split('\n');

const validateIdx = lines.findIndex(l => l.includes('const validateForm = () => {'));
lines.splice(validateIdx + 1, 0, `
    // Duplicate validation
    const existingDealer = (allDealers || []).find((d) => {
      if (editingDealer && d.id === editingDealer.id) return false;
      const dMob = d.mobile ? String(d.mobile).replace(/\\D/g, "").slice(-10) : "";
      const ndMob = formData.mobile ? String(formData.mobile).replace(/\\D/g, "").slice(-10) : "";
      const isMobileDuplicate = dMob && ndMob && dMob.length >= 10 && dMob === ndMob;
      const dName = d.shopName ? d.shopName.trim().toLowerCase() : "";
      const ndName = formData.shopName ? formData.shopName.trim().toLowerCase() : "";
      const isNameDuplicate = dName && ndName && dName === ndName;
      // GST Number match if available
      const dGst = (d as any).gstNumber ? String((d as any).gstNumber).trim().toLowerCase() : "";
      const ndGst = (formData as any).gstNumber ? String((formData as any).gstNumber).trim().toLowerCase() : "";
      const isGstDuplicate = dGst && ndGst && dGst === ndGst;
      
      return (isNameDuplicate && isMobileDuplicate) || isMobileDuplicate || isGstDuplicate;
    });
    
    if (existingDealer) {
      alert("हा डीलर आधीपासून नोंदणीकृत आहे. (This dealer is already added.)");
      return false;
    }
`);

fs.writeFileSync('src/components/DealersView.tsx', lines.join('\n'));

import sys

with open('src/components/DealersView.tsx') as f:
    lines = f.read().split('\n')

validate_idx = next(i for i, l in enumerate(lines) if 'const validateForm = () => {' in l)

injection = """    // Duplicate validation
    const existingDealer = (allDealers || []).find((d) => {
      if (editingDealer && d.id === editingDealer.id) return false;
      const dMob = d.mobile ? String(d.mobile).replace(/\\D/g, "").slice(-10) : "";
      const ndMob = formData.mobile ? String(formData.mobile).replace(/\\D/g, "").slice(-10) : "";
      const isMobileDuplicate = dMob && ndMob && dMob.length >= 10 && dMob === ndMob;
      const dName = d.shopName ? d.shopName.trim().toLowerCase() : "";
      const ndName = formData.shopName ? formData.shopName.trim().toLowerCase() : "";
      const isNameDuplicate = dName && ndName && dName === ndName;
      const dGst = (d as any).gstNumber ? String((d as any).gstNumber).trim().toLowerCase() : "";
      const ndGst = (formData as any).gstNumber ? String((formData as any).gstNumber).trim().toLowerCase() : "";
      const isGstDuplicate = dGst && ndGst && dGst === ndGst;
      return isMobileDuplicate || isGstDuplicate;
    });
    
    if (existingDealer) {
      alert("हा डीलर आधीपासून नोंदणीकृत आहे. (This dealer is already added.)");
      return false;
    }"""

lines.insert(validate_idx + 1, injection)

with open('src/components/DealersView.tsx', 'w') as f:
    f.write('\n'.join(lines))

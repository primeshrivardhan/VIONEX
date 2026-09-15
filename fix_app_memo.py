import sys
import re

with open('src/App.tsx') as f:
    content = f.read()

# Replace healedProducts and healedSchedules logic with useMemo

old_logic = r"""  // 1\. Heal products
  const healedProducts = \(rawProducts \|\| \[\]\)\.map\(p => \{.*?if \(needsCloudSchedules\.length > 0\) \{
    // Background cloud sync
    setTimeout\(\(\) => \{
      updateItems\("schedules", needsCloudSchedules\);
    \}, 2000\);
  \}"""

new_logic = """  // 1. Heal products - MEMOIZED to prevent UI freezing
  const { healedProducts, healedSchedules } = useMemo(() => {
    const healedProducts = (rawProducts || []).map(p => {
      if (!p) return p;
      let productChanged = false;
      const updated = { ...p };
      
      if (!updated.brandName && updated.name) {
        updated.brandName = updated.name;
        productChanged = true;
      }
      if (updated.brandName && !updated.name) {
        updated.name = updated.brandName;
        productChanged = true;
      }
      if (!updated.companyName || updated.companyName.trim() === "" || updated.companyName === "माहिती उपलब्ध नाही") {
        updated.companyName = "प्रसिद्ध कंपनी (Agro Brand)";
        productChanged = true;
      }
      if (!updated.formulation || updated.formulation.trim() === "" || updated.formulation === "माहिती उपलब्ध नाही") {
        updated.formulation = "लागू नाही";
        productChanged = true;
      }
      if (productChanged) {
        return { ...updated, _needsCloudUpdate: true };
      }
      return p;
    });

    const productLookupById = new Map<string, any>();
    const productLookupByName = new Map<string, any>();
    healedProducts.forEach(p => {
      if (p.id) {
        productLookupById.set(String(p.id), p);
      }
      const brandLower = String(p.brandName || p.name || "").trim().toLowerCase();
      if (brandLower) {
        productLookupByName.set(brandLower, p);
      }
    });

    const healedSchedules = (rawSchedules || []).map(s => {
      if (!s || !Array.isArray(s.selectedProducts)) return s;
      
      let scheduleChanged = false;
      const updatedProducts = s.selectedProducts.map((sp: any) => {
        if (!sp) return sp;
        let match = null;
        if (sp.id) {
          match = productLookupById.get(String(sp.id));
        }
        if (!match) {
          const spBrandLower = String(sp.brandName || sp.name || "").trim().toLowerCase();
          if (spBrandLower) {
            match = productLookupByName.get(spBrandLower);
          }
        }
        
        const updatedSp = { ...sp };
        let productInScheduleChanged = false;
        
        if (!updatedSp.brandName && updatedSp.name) {
          updatedSp.brandName = updatedSp.name;
          productInScheduleChanged = true;
        }
        
        if (match) {
          if (!updatedSp.brandName && match.brandName) {
            updatedSp.brandName = match.brandName;
            productInScheduleChanged = true;
          }
          if (!updatedSp.companyName && match.companyName && match.companyName !== "माहिती उपलब्ध नाही") {
            if (updatedSp.companyName !== match.companyName) {
              updatedSp.companyName = match.companyName;
              productInScheduleChanged = true;
            }
          }
          if (!updatedSp.composition && match.composition && match.composition !== "माहिती उपलब्ध नाही") {
            if (updatedSp.composition !== match.composition) {
              updatedSp.composition = match.composition;
              productInScheduleChanged = true;
            }
          }
          if (!updatedSp.activeIngredients && (match.composition || match.activeIngredients)) {
            const newIng = match.composition || match.activeIngredients;
            if (newIng !== "माहिती उपलब्ध नाही" && updatedSp.activeIngredients !== newIng) {
              updatedSp.activeIngredients = newIng;
              productInScheduleChanged = true;
            }
          }
          if (!updatedSp.formulation && match.formulation && match.formulation !== "माहिती उपलब्ध नाही") {
            if (updatedSp.formulation !== match.formulation) {
              updatedSp.formulation = match.formulation;
              productInScheduleChanged = true;
            }
          }
        }
        if (productInScheduleChanged) {
          scheduleChanged = true;
          return updatedSp;
        }
        return sp;
      });

      if (scheduleChanged) {
        return { ...s, selectedProducts: updatedProducts, _needsCloudUpdate: true };
      }
      return s;
    });

    return { healedProducts, healedSchedules };
  }, [rawProducts, rawSchedules]);

  // Sync background updates safely using useEffect
  useEffect(() => {
    const needsCloudProducts = healedProducts.filter(p => p._needsCloudUpdate).map(({ _needsCloudUpdate, ...rest }) => ({ id: rest.id, data: rest }));
    if (needsCloudProducts.length > 0) {
      setTimeout(() => {
        updateItems("products", needsCloudProducts);
      }, 5000); // give UI time to paint
    }
  }, [healedProducts]);

  useEffect(() => {
    const needsCloudSchedules = healedSchedules.filter(s => s._needsCloudUpdate).map(({ _needsCloudUpdate, ...rest }) => ({ id: rest.id, data: rest }));
    if (needsCloudSchedules.length > 0) {
      setTimeout(() => {
        updateItems("schedules", needsCloudSchedules);
      }, 5000);
    }
  }, [healedSchedules]);"""

content = re.sub(old_logic, new_logic, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)

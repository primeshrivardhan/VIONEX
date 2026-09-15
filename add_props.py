import sys

with open('src/App.tsx') as f:
    content = f.read()

old = """                  <LocationMapping 
                    language={language} 
                    onBack={handleBack} 
                    dealers={dealers}
                  />"""

new = """                  <LocationMapping 
                    language={language} 
                    onBack={handleBack} 
                    dealers={dealers}
                    onNavigateToDealers={() => setActiveTab('dealers')}
                    onDeleteDealer={async (id) => {
                      const d = dealers.find((dl) => dl.id === id);
                      if (d) {
                        const res = await saveItem("dealers", { ...d, isDeleted: true }, id);
                        logUserActivity("delete", "dealer", d.shopName || d.name || "Dealer", id);
                        return res;
                      }
                    }}
                  />"""

content = content.replace(old, new)
with open('src/App.tsx', 'w') as f:
    f.write(content)

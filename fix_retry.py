import sys

with open('src/components/LocationMapping.tsx') as f:
    content = f.read()

old_reset = """            <button 
              onClick={() => {
                setSelectedState("Maharashtra");
                setSelectedDistrict("");
                setSelectedTaluka("");
                setSelectedVillage("");
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="p-2 bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 transition-colors h-8"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>"""

new_reset = """            <button 
              onClick={() => {
                setSelectedState("Maharashtra");
                setSelectedDistrict("");
                setSelectedTaluka("");
                setSelectedVillage("");
                setSearchQuery("");
                setStatusFilter("all");
                fetchLocations({
                   state: "Maharashtra",
                   district: "",
                   taluka: undefined
                });
              }}
              className="p-2 bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 transition-colors h-8"
              title="Reset Filters & Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>"""

content = content.replace(old_reset, new_reset)

with open('src/components/LocationMapping.tsx', 'w') as f:
    f.write(content)

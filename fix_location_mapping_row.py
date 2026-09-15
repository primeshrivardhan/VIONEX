import sys
import re

with open('src/components/LocationMapping.tsx') as f:
    content = f.read()

old_dealer_div = """                                <div key={d.id} className="flex items-start gap-1">
                                  <span className="text-[8px] font-black text-indigo-400 shrink-0 mt-0.5">{dIdx + 1}.</span>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-indigo-700 text-[10px] leading-tight whitespace-nowrap">{d.shopName}</span>
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500">
                                      <span className="truncate">{d.name}</span>
                                      <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                      <span>{d.mobile}</span>
                                    </div>
                                  </div>
                                </div>"""

new_dealer_div = """                                <div key={d.id} className="flex items-start justify-between gap-1 group/dealer">
                                  <div className="flex items-start gap-1 min-w-0">
                                    <span className="text-[8px] font-black text-indigo-400 shrink-0 mt-0.5">{dIdx + 1}.</span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-bold text-indigo-700 text-[10px] leading-tight whitespace-nowrap">{d.shopName}</span>
                                      <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500">
                                        <span className="truncate">{d.name}</span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                        <span>{d.mobile}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover/dealer:opacity-100 transition-opacity shrink-0">
                                    <button 
                                      onClick={() => {
                                        if (onNavigateToDealers) onNavigateToDealers();
                                        setTimeout(() => window.dispatchEvent(new CustomEvent('edit-dealer', { detail: d })), 100);
                                      }}
                                      className="p-1 text-slate-400 hover:text-indigo-600 rounded bg-white shadow-sm border border-slate-100"
                                      title="Edit Dealer"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if(confirm(isEn ? `Delete dealer ${d.shopName}?` : `${d.shopName} हा डीलर डिलीट करायचा का?`)) {
                                          if (onDeleteDealer) onDeleteDealer(d.id);
                                        }
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded bg-white shadow-sm border border-slate-100"
                                      title="Delete Dealer"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>"""

content = content.replace(old_dealer_div, new_dealer_div)

# Now remove the location delete button
old_td = """                        <td className="px-2 py-1 text-center align-top">
                          <button 
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors mt-0.5"
                            onClick={() => {
                              if(confirm(isEn ? "Delete this village entry?" : "ही नोंद डिलीट करायची का?")) deleteLocation(row.id!);
                            }}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </td>"""
new_td = """                        <td className="px-2 py-1 text-center align-top">
                          {/* Location delete removed per user request */}
                        </td>"""
content = content.replace(old_td, new_td)

with open('src/components/LocationMapping.tsx', 'w') as f:
    f.write(content)

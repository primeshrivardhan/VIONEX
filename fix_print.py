import sys

with open('src/components/LocationMapping.tsx') as f:
    content = f.read()

old_print = """                        <td className="p-2 border border-slate-200 text-center align-top">
                          {dIdx === 0 ? idx + 1 : ""}
                        </td>
                        <td className="p-2 border border-slate-200 align-top">
                          {dIdx === 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-900 text-[11px]">{row.village}</span>
                              <span className="text-slate-500 font-medium text-[9px]">{row.villageMarathi}</span>
                            </div>
                          ) : null}
                        </td>
                        <td className="p-2 border border-slate-200 align-top">
                          {dIdx === 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-900 text-[11px]">{row.taluka}</span>
                              <span className="text-slate-500 font-medium text-[9px]">{row.district}</span>
                            </div>
                          ) : null}
                        </td>"""

new_print = """                        <td className="p-2 border border-slate-200 text-center align-top">
                          {dIdx === 0 ? idx + 1 : ""}
                        </td>
                        <td className="p-2 border border-slate-200 align-top">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-900 text-[11px]">{row.village}</span>
                            <span className="text-slate-500 font-medium text-[9px]">{row.villageMarathi}</span>
                          </div>
                        </td>
                        <td className="p-2 border border-slate-200 align-top">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-900 text-[11px]">{row.taluka}</span>
                            <span className="text-slate-500 font-medium text-[9px]">{row.district}</span>
                          </div>
                        </td>"""

if old_print in content:
    content = content.replace(old_print, new_print)
    with open('src/components/LocationMapping.tsx', 'w') as f:
        f.write(content)
    print("Fixed Print loop")
else:
    print("Could not find old_print")


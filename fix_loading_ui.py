import sys

with open('src/components/LocationMapping.tsx') as f:
    content = f.read()

old_tbody = """              <tbody className="divide-y divide-slate-100">
                {paginatedData.length === 0 ? ("""

new_tbody = """              <tbody className="divide-y divide-slate-100">
                {loading && mappedData.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="py-10 text-center flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin mb-3"></div>
                        <h3 className="text-sm font-bold text-slate-800">माहिती लोड होत आहे...</h3>
                        <p className="text-slate-500 text-[10px] mt-0.5">Please wait, loading locations.</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? ("""

content = content.replace(old_tbody, new_tbody)

with open('src/components/LocationMapping.tsx', 'w') as f:
    f.write(content)

import sys

with open('src/components/DealersView.tsx') as f:
    lines = f.read().split('\n')

start = next(i for i, l in enumerate(lines) if '{filteredDealers.length === 0 ? (' in l)
form_start = next(i for i, l in enumerate(lines) if '<form onSubmit={handleSubmit} className="p-4 space-y-3">' in l)
end = form_start - 12  # We'll replace everything up to the form header

replacement = """      {filteredDealers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
          <Store className="w-16 h-16 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-base font-bold text-slate-800 mb-1">कोणतेही डीलर सापडले नाहीत</h3>
          <p className="text-xs text-slate-500 mb-6">कृपया डीलरची नोंदणी करून नेटवर्क वाढवा.</p>
          {!isFarmerView && (
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              पहिला डीलर जोडा
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDealers.map((dealer, idx) => (
            <motion.div
              key={dealer.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.4) }}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-slate-800 text-base leading-tight break-words">
                  {dealer.shopName}
                </h3>
                <p className="text-sm text-indigo-600 font-bold mt-0.5">
                  {dealer.name}
                </p>

                <div className="space-y-2 my-3 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="font-mono text-slate-700 font-medium break-all">
                      <div>{dealer.mobile}</div>
                      {dealer.alternateMobile && (
                        <div className="text-slate-500 text-[11px] mt-0.5 flex flex-wrap items-center gap-1">
                          <span>Alt: {dealer.alternateMobile}</span>
                          {dealer.alternateName && (
                            <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-sans font-bold text-[10px]">
                              ({dealer.alternateName})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="break-words leading-snug">
                      {dealer.village}, ता. {dealer.taluka}, जि. {dealer.district}{dealer.state ? `, ${dealer.state}` : ""}
                      {dealer.pincode && ` - ${dealer.pincode}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-row items-center justify-around gap-2 mt-2 pt-3 border-t border-slate-100">
                <a
                  href={`tel:${dealer.mobile}`}
                  className="flex items-center justify-center w-11 h-11 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 active:scale-95 transition-all shrink-0"
                  title="कॉल करा (Call)"
                >
                  <Phone className="w-5 h-5" />
                </a>
                {dealer.lat && dealer.lon ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${dealer.lat},${dealer.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 active:scale-95 transition-all shrink-0"
                    title="मॅपवर पहा (Map)"
                  >
                    <MapPin className="w-5 h-5" />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    const cleanNumber = dealer.mobile.replace(/\D/g, "");
                    const msg = `नमस्कार ${dealer.shopName} (${dealer.name}),\\n\\nनवीन कृषी माहिती, उत्पादने व शेड्युल अपडेट्स आपल्या Dealer Network पोर्टलमध्ये उपलब्ध करण्यात आले आहेत. कृपया खालील लिंकवर जाऊन त्वरित तपासा:\\n\\n${window.location.origin}/?loginType=user\\n\\nआपला नम्र,\\nVIONEX ऍडमिन.`;
                    const waUrl = `https://wa.me/91${cleanNumber}?text=${msg}`;
                    window.open(waUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="flex items-center justify-center w-11 h-11 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 active:scale-95 transition-all shrink-0"
                  title="WhatsApp वर अलर्ट पाठवा"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.516.893 3.004 1.347 4.509 1.348 5.123 0 9.289-4.167 9.291-9.291.001-2.481-.964-4.813-2.719-6.569-1.754-1.755-4.088-2.72-6.571-2.72-5.124 0-9.291 4.167-9.293 9.291-.001 1.956.611 3.407 1.645 4.908l-.968 3.541 3.606-.948zm9.581-6.195c-.247-.123-1.464-.722-1.692-.804-.226-.082-.392-.123-.556.123s-.638.804-.783.968c-.144.164-.289.185-.536.062-.247-.124-1.043-.385-1.986-1.227-.733-.654-1.228-1.463-1.372-1.71-.144-.247-.015-.38.109-.502.112-.11.247-.288.37-.432.124-.144.165-.247-.247-.412.082-.164.041-.31-.021-.432s-.556-1.339-.762-1.833c-.2-.482-.403-.416-.556-.425-.144-.006-.31-.008-.474-.008s-.433.062-.659.31-.865.845-.865 2.06.891 2.391.994 2.535c.103.144 1.754 2.678 4.248 3.753.593.256 1.056.409 1.417.523.596.189 1.139.162 1.567.098.477-.071 1.464-.598 1.67-.1.175.206.516.206.556 1.031.041 0 .288-.062.433-.124z" />
                  </svg>
                </button>
                {!isFarmerView && (
                  <>
                    {permissions?.dealerEdit !== false && (
                      <button
                        onClick={() => handleOpenEditForm(dealer)}
                        className="flex items-center justify-center w-11 h-11 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl active:scale-95 transition-all shrink-0"
                        title="दुरुस्त करा (Edit)"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    {permissions?.dealerDelete !== false && (
                      <button
                        onClick={() => setDealerToDelete(dealer)}
                        className="flex items-center justify-center w-11 h-11 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-xl active:scale-95 transition-all shrink-0"
                        title="हटवा (Delete)"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              <div className="bg-indigo-700 text-white px-4 py-3 flex justify-between items-center">
                <h3 className="font-black text-sm flex items-center gap-1.5">
                  <Store className="w-4 h-4" />
                  {editingDealer ? "Edit Dealer" : "Add Dealer"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>"""

lines = lines[:start] + replacement.split('\n') + lines[form_start:]
with open('src/components/DealersView.tsx', 'w') as f:
    f.write('\n'.join(lines))

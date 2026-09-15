import React, { useRef, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { format, parseISO, addDays } from 'date-fns';
import { X, Download, Sprout } from 'lucide-react';
import { translateDoseToEnglish, formatDualDisplay, translateCompositionToMarathi, translateMarathiToEnglish, getDoseLabel, formatModeOfAction } from '../lib/utils';

export default function SchedulePreviewModal({ schedules, farmer, cropName, cropMeta, onClose }: any) {
  const previewRef = useRef<HTMLDivElement>(null);

  const getMarathiDayOfWeek = (dateStr: string) => {
    try {
      const days = ["रविवार", "सोमवार", "मंगळवार", "बुधवार", "गुरूवार", "शुक्रवार", "शनिवार"];
      return days[parseISO(dateStr).getDay()];
    } catch { return ""; }
  };

  const getMarathiMonth = (dateStr: string) => {
    try {
      const months = ["जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"];
      return months[parseISO(dateStr).getMonth()];
    } catch { return ""; }
  };

  const getEnglishMethod = (m: string) => {
    if (!m) return "Spray";
    if (m.toLowerCase().includes("drip") || m.includes("ड्रीप")) return "Drip";
    if (m.toLowerCase().includes("gap") || m.includes("गॅप") || m.includes("विश्रांती")) return "Gap";
    return "Spray";
  };

  const groupedSchedules = useMemo(() => {
    const groups: { [date: string]: any[] } = {};
    (schedules || []).forEach((s: any) => {
      const d = s.scheduleDate;
      if (!groups[d]) {
        groups[d] = [];
      }
      groups[d].push(s);
    });
    
    const sortedDates = Object.keys(groups).sort((dateA, dateB) => {
      const firstA = groups[dateA][0];
      const firstB = groups[dateB][0];
      const dayA = parseInt(firstA.day, 10) || 0;
      const dayB = parseInt(firstB.day, 10) || 0;
      return dayA - dayB;
    });

    return sortedDates.map(date => {
      const sortedItems = [...groups[date]].sort((a, b) => {
        const methodA = getEnglishMethod(a.method);
        const methodB = getEnglishMethod(b.method);
        if (methodA === 'Drip' && methodB !== 'Drip') return -1;
        if (methodA !== 'Drip' && methodB === 'Drip') return 1;
        return 0;
      });
      return {
        date,
        day: sortedItems[0].day,
        schedules: sortedItems
      };
    });
  }, [schedules]);

  const items = useMemo(() => {
    const res: any[] = [];
    for (let i = 0; i < groupedSchedules.length; i++) {
      res.push({ type: 'schedule', data: groupedSchedules[i] });
      if (i < groupedSchedules.length - 1) {
        const currentDay = parseInt(groupedSchedules[i].day) || 0;
        const nextDay = parseInt(groupedSchedules[i+1].day) || 0;
        if (nextDay - currentDay > 1) {
          res.push({
            type: 'gap',
            startDay: currentDay + 1,
            endDay: nextDay - 1,
            gapDays: nextDay - currentDay - 1,
          });
        }
      }
    }
    return res;
  }, [groupedSchedules]);

  const handleDownload = async () => {
    if (!previewRef.current) return;
    try {
      const node = previewRef.current;
      const dataUrl = await toPng(node, { 
        cacheBust: true, 
        backgroundColor: '#f9fafb', 
        pixelRatio: 2,
        width: node.scrollWidth,
        height: node.scrollHeight,
        style: { margin: '0' }
      });
      const link = document.createElement("a");
      link.download = `schedule-${farmer?.name || "farmer"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Failed to download image.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 p-4 sm:p-8 backdrop-blur-sm">
      {/* Modal Actions */}
      <div className="w-full max-w-4xl flex justify-end gap-3 mb-4">
        <button onClick={handleDownload} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-emerald-500 transition-colors">
          <Download className="w-5 h-5" /> डाउनलोड करा
        </button>
        <button onClick={onClose} className="p-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Preview Container */}
      <div className="w-full max-w-4xl flex-1 overflow-y-auto bg-slate-100 rounded-2xl shadow-2xl custom-scrollbar p-4 lg:p-8">
        {/* Actual Image Canvas to Capture */}
        <div ref={previewRef} className="bg-[#f9fafb] w-[800px] mx-auto h-max p-8 shadow-sm rounded-xl relative" style={{ fontFamily: 'Inter, sans-serif' }}>
          
          {/* Header Box */}
          <div className="border border-slate-200 rounded-[2rem] p-8 flex items-stretch gap-6 shadow-sm mb-12 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            {/* Left Col: Dealer Info */}
            <div className="flex-[0.8] flex gap-4 items-center">
              <div className="w-[84px] h-[84px] border border-emerald-100 rounded-2xl bg-white flex flex-col items-center justify-center text-emerald-600 shadow-sm shrink-0">
                <Sprout className="w-8 h-8 mb-1" />
                <span className="text-[10px] font-black leading-none uppercase tracking-widest">VIONEX</span>
                <span className="text-[7.5px] font-bold">Smart Farming</span>
              </div>
              <div>
                {farmer?.dealer && (
                  <p className="text-emerald-600 text-[11px] font-black tracking-widest uppercase mb-1">
                    अधिकृत विक्रेते <span className="text-emerald-500/70">(AUTHORIZED DEALER)</span>
                  </p>
                )}
                <h1 className="text-[26px] font-black text-slate-800 tracking-tight leading-none mb-1.5 uppercase">
                  {farmer?.dealer || ""}
                </h1>
                <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Smart Farming Partner</p>
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-px bg-slate-200 shrink-0"></div>
            
            {/* Right Col: Farmer Info */}
            <div className="flex-[1.2] relative z-10">
              <p className="text-slate-400 text-[11px] font-black tracking-widest uppercase mb-2">शेतकरी व पीक तपशील <span className="opacity-70">(FARMER & CROP DETAILS)</span></p>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-5">{farmer?.name || "-"}</h2>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">गाव <span className="opacity-70">(VILLAGE)</span></p>
                  <p className="font-bold text-slate-700">{farmer?.village || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">संपर्क <span className="opacity-70">(PHONE)</span></p>
                  <p className="font-bold text-slate-700">{farmer?.mobile || "-"}</p>
                </div>
                <div className="bg-emerald-50/70 rounded-lg px-2.5 py-1.5 -ml-2.5">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">पीक / वाण <span className="opacity-70">(CROP & VARIETY)</span></p>
                  <p className="font-bold text-emerald-900">{cropName} <span className="text-emerald-700">{cropMeta?.variety ? `(${cropMeta.variety})` : "(super)"}</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">लागवड <span className="opacity-70">(PLANTATION)</span></p>
                  <p className="font-bold text-slate-700">{cropMeta?.plantationDate || cropMeta?.sowingDate || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">प्लॉट नंबर <span className="opacity-70">(PLOT NO)</span></p>
                  <p className="font-bold text-slate-700">-</p>
                </div>
                <div className="bg-blue-50/70 rounded-lg px-2.5 py-1.5 -ml-2.5">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-0.5">दिनांक <span className="opacity-70">(DATE)</span></p>
                  <p className="font-bold text-blue-900">{format(new Date(), 'dd/MM/yyyy')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative border-l-2 border-slate-200 ml-10 pl-14 pb-4 space-y-8">
            {items.map((item, idx) => {
              if (item.type === 'gap') {
                return (
                  <div key={`gap-${idx}`} className="relative mt-4">
                    {/* Orange Dot / Rest Icon */}
                    <div className="absolute -left-[73px] top-6 w-8 h-8 rounded-full bg-[#fdf3da] border border-[#f3d797] flex items-center justify-center shadow-sm">
                      <span className="text-xl leading-none -mt-1"><Sprout className="w-4 h-4 text-[#c88d22]"/></span>
                    </div>
                    {/* Gap Card */}
                    <div className="bg-[#fdf9ef] border border-[#fae8b1] rounded-[2rem] p-5 shadow-sm flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-[#f5e2a8]/50 flex items-center justify-center shrink-0">
                        <span className="text-2xl text-[#c88d22]">⚲</span>
                      </div>
                      <div>
                        <h4 className="text-[#a5700d] font-black text-[15px] mb-1">गॅप कालावधी - {item.gapDays} दिवस विश्रांती (REST PLAN)</h4>
                        <p className="text-[#c29633] font-bold text-[13px]">दिवस {item.startDay} ते दिवस {item.endDay} पर्यंत गॅप.</p>
                      </div>
                    </div>
                  </div>
                );
              }

              const group = item.data;
              const dateObj = group.date ? parseISO(group.date) : null;
              const dateText = dateObj ? format(dateObj, 'dd/MM/yyyy') : "-";
              const dayOfWeek = dateObj ? getMarathiDayOfWeek(group.date) : "-";
              const isMultiple = group.schedules.length > 1;

              return (
                <div key={group.date || idx} className="relative mt-6">
                  {/* Timeline Node */}
                  <div className="absolute -left-[85px] top-4 flex flex-col items-center bg-[#f9fafb] py-2 z-10 w-16">
                    <div className="w-[50px] h-[50px] bg-white border border-slate-200 rounded-full flex items-center justify-center font-black text-[22px] text-slate-800 tracking-tighter shadow-sm mb-1 mt-[-6px]">
                      {group.day}
                    </div>
                    <div className="text-[11px] font-black text-slate-800 tracking-wide bg-[#f9fafb] w-full text-center">
                      {dateObj ? `${dateObj.getDate()} ${getMarathiMonth(group.date)}` : ""}
                    </div>
                  </div>

                  {/* Schedule Card */}
                  <div className={`border rounded-[2rem] p-6 shadow-sm bg-white transition-colors ${
                    isMultiple 
                      ? 'border-amber-400 bg-amber-50/5 shadow-sm ring-1 ring-amber-400/30' 
                      : (getEnglishMethod(group.schedules[0].method) === 'Gap' 
                          ? 'border-amber-200 bg-amber-50/10' 
                          : (getEnglishMethod(group.schedules[0].method) === 'Drip' ? 'border-blue-100 bg-white' : 'border-emerald-100 bg-white'))
                  }`}>
                    {isMultiple && (
                      <div className="mb-4 bg-amber-505 text-white bg-amber-500 text-[11px] font-black px-4 py-1.5 rounded-2xl flex items-center gap-1.5 uppercase tracking-wide">
                        <span>💡 या दिवशी स्प्रे + ड्रीप दोन्ही नियोजन एकत्र आहे (डबल शेड्युल)</span>
                      </div>
                    )}
                    <h3 className="text-lg font-black mb-5 tracking-tight text-slate-800">
                      दिनांक: {dateText} - {dayOfWeek} - Variety: {cropMeta?.variety || "super"}
                    </h3>
                    
                    <div className="space-y-6 divide-y divide-slate-100">
                      {group.schedules.map((schedItem: any, sIdx: number) => {
                        const engMethod = getEnglishMethod(schedItem.method);
                        const isDripItem = engMethod === "Drip";
                        const isGapItem = engMethod === "Gap";
                        const headerColor = isGapItem ? "text-amber-800" : (isDripItem ? "text-blue-800" : "text-emerald-800");

                        return (
                          <div key={sIdx} className={`${sIdx > 0 ? 'pt-5' : ''} space-y-4`}>
                            <h4 className={`text-sm font-black flex items-center gap-2 ${headerColor}`}>
                              <span className={`w-2 h-2 rounded-full ${isDripItem ? 'bg-blue-500' : (isGapItem ? 'bg-amber-500' : 'bg-emerald-500')}`}></span>
                              {isGapItem ? "गॅप / विश्रांतीचा दिवस (Gap Day)" : (isDripItem ? "ठिबक नियोजन (Drip)" : schedItem.method === "आळवणी / ड्रिंचिंग" ? "आळवणी / ड्रिंचिंग (Drenching)" : "फवारणी नियोजन (Spray)")}
                            </h4>

                            {isGapItem && (!schedItem.selectedProducts || schedItem.selectedProducts.length === 0) ? (
                              <div className="py-6 text-center border-2 border-dashed border-amber-200 rounded-3xl bg-amber-50/10">
                                <p className="text-sm font-black text-amber-800">गॅप / विश्रांतीचा दिवस 😴</p>
                                <p className="text-xs text-amber-600 mt-1 font-bold">आज कोणतेही औषध फवारणी किंवा ठिबकचे नियोजन करू नये.</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {schedItem.selectedProducts?.map((p: any, pIdx: number) => {
                                  const rawDose = p.dose || (isDripItem ? p.doseDrip : p.doseSpray) || "-";
                                  const activeDose = translateDoseToEnglish(rawDose);
                                  return (
                                    <div key={pIdx} className="flex justify-between items-start gap-5 pb-5 border-b border-dashed border-slate-100 last:border-0 last:pb-0">
                                      <div>
                                        <h4 className="text-[17px] font-black text-slate-800 mb-1.5 flex items-baseline gap-1">
                                          {formatDualDisplay(p.brandName, p.marathiName)}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-600 font-bold">
                                          {false && (p.activeIngredients || p.composition) && (
                                            <span>
                                              <span className="text-emerald-500 mr-1.5 font-bold">•</span>
                                              Composition (घटक): {formatDualDisplay(p.compositionEnglish || p.activeIngredients || p.composition, translateCompositionToMarathi(p.activeIngredients || p.composition))}
                                            </span>
                                          )}
                                          {p.companyName && (
                                            <span>
                                              <span className="text-blue-500 mr-1.5 font-bold">•</span>
                                              {p.companyName}
                                            </span>
                                          )}
                                          {p.formulation && p.formulation !== "लागू नाही" && p.formulation !== "माहिती उपलब्ध नाही" && (
                                            <span>
                                              <span className="text-purple-500 mr-1.5 font-bold">•</span>
                                              Formulation (फॉर्म्युलेशन): {p.formulation}
                                            </span>
                                          )}
                                        </div>
                                        {p.modeOfAction && p.modeOfAction !== "लागू नाही" && p.modeOfAction !== "माहिती उपलब्ध नाही" && (
                                          <div className="text-[11px] font-semibold text-slate-600 mt-1">
                                            <span className="font-extrabold text-slate-700">Mode of Action: </span>
                                            <span>{formatModeOfAction(p.modeOfAction)}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="shrink-0 text-right w-36">
                                        <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">{getDoseLabel(schedItem.method)}</span>
                                        <div className={`px-4 py-2 rounded-[14px] border text-center ${isDripItem ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                          <span className={`text-[13px] font-black leading-tight block ${isDripItem ? 'text-blue-900' : 'text-emerald-900'}`}>{activeDose}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {schedItem.notes && (
                              <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[12px] text-slate-600 font-bold leading-relaxed italic">
                                📝 Note (नोंद): {schedItem.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Box */}
          <div className="mt-16 pt-8 border-t-2 border-slate-100 flex justify-between items-end pb-4">
            <div>
              <h1 className="text-[32px] font-black tracking-tight text-slate-800 flex items-center gap-1 leading-none mb-1.5">
                VIONEX <span className="text-emerald-600">(वी ऑ नेक्स)</span>
              </h1>
              <p className="text-[11px] font-black tracking-[0.4em] text-slate-400 uppercase">VISION BEYOND LIMITS</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase leading-tight mb-1">Generated BY</p>
              <p className="text-[14px] font-black text-slate-800 tracking-tight uppercase leading-none">VIONEX SMART FARMING</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

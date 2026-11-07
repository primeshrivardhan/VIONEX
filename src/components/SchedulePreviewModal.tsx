import React, { useRef, useMemo, useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { X, Download, Sprout, FileImage, FileText } from 'lucide-react';
import { translateDoseToEnglish, formatDualDisplay, getDoseLabel, formatModeOfAction } from '../lib/utils';
import { downloadFile } from '../lib/fileDownload';
import { computeGap } from '../lib/scheduleGaps';
import { planPages } from '../lib/sheetPagination';

export default function SchedulePreviewModal({
  schedules,
  farmer,
  cropName,
  cropMeta,
  dealer,
  onClose,
  language = "mr"
}: any) {
  const isEn = language === "en";
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [showChooser, setShowChooser] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  // Recompute preview scale on resize / orientation change so sheet fits phone screen width
  const updateScale = () => {
    if (containerRef.current && previewRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      if (containerWidth > 0) {
        const padding = typeof window !== 'undefined' && window.innerWidth < 640 ? 16 : 32;
        const availableWidth = Math.max(280, containerWidth - padding);
        const newScale = Math.min(1, availableWidth / 794);
        setScale(newScale);
        setSheetHeight(previewRef.current.scrollHeight || previewRef.current.offsetHeight || 1000);
      }
    }
  };

  useEffect(() => {
    updateScale();
    const handleResize = () => updateScale();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => updateScale()) : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);
    if (ro && previewRef.current) ro.observe(previewRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      ro?.disconnect();
    };
  }, []);

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

  const formatPlantationDate = (dateVal?: string) => {
    if (!dateVal) return "-";
    try {
      const parts = dateVal.trim().split(/[-/]/);
      if (parts.length === 3) {
        let y: number, m: number, d: number;
        if (parts[0].length === 4) {
          y = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10) - 1;
          d = parseInt(parts[2], 10);
        } else {
          d = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10) - 1;
          y = parseInt(parts[2], 10);
        }
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return format(new Date(y, m, d), 'dd/MM/yyyy');
        }
      }
      const parsed = new Date(dateVal);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, 'dd/MM/yyyy');
      }
    } catch {}
    return dateVal;
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
        const currentDay = parseInt(groupedSchedules[i].day, 10);
        const nextDay = parseInt(groupedSchedules[i + 1].day, 10);
        const gap = computeGap(currentDay, nextDay);
        if (gap) {
          res.push({
            type: 'gap',
            gap,
            startDay: gap.from,
            endDay: gap.to,
            gapDays: gap.count,
          });
        }
      }
    }
    return res;
  }, [groupedSchedules]);

  const sanitizeFileName = (name: string) => {
    return (name || 'Farmer')
      .replace(/[/\\:*?"<>|]/g, '')
      .replace(/\s+/g, '_')
      || 'Farmer';
  };

  const exportAs = async (kind: 'pdf' | 'png') => {
    if (!previewRef.current) return;
    setIsExporting(true);
    setShowChooser(false);
    const farmerSlug = sanitizeFileName(farmer?.name || 'Farmer');
    const dateSlug = format(new Date(), 'yyyyMMdd');
    const baseName = `VIONEX_Schedule_${farmerSlug}_${dateSlug}`;
    
    try {
      setExportProgress(isEn ? 'Preparing…' : 'तयार होत आहे…');
      await document.fonts.ready;

      const node = previewRef.current;
      const sheetWidth = 794;

      // Measure block boundaries for PDF pagination
      const sheetRect = node.getBoundingClientRect();
      const blocks = Array.from(node.querySelectorAll<HTMLElement>('[data-sheet-block]'));
      const blockTops = blocks.map(b => b.getBoundingClientRect().top - sheetRect.top);
      const blockBottoms = blocks.map(b => b.getBoundingClientRect().bottom - sheetRect.top);

      // Usable page height: A4 is 210 x 297 mm. Sheet width = 794px. Total A4 height in px = 794 * (297 / 210) ≈ 1123px.
      // Top and bottom margins 24px each -> 1075px usable height.
      const pageHeightPx = 1075;
      let pages = planPages(blockTops, blockBottoms, pageHeightPx);
      if (pages.length === 0) {
        pages = [[0, node.scrollHeight || 1123]];
      }

      setExportProgress(isEn ? 'Rendering…' : 'प्रतिमा तयार करत आहे…');

      // Temporarily clear transform for crisp, unscaled 794px rendering
      const origTransform = node.style.transform;
      node.style.transform = 'none';

      // Safeguard: browser canvas limit is ~16 384 px per side.
      // Sheet CSS height at pixelRatio 2 must not exceed ~8 000 px.
      // Auto-downgrade pixelRatio if the sheet is too tall.
      const sheetCssHeight = node.scrollHeight || node.offsetHeight || 1000;
      let pixelRatio = 2;
      if (sheetCssHeight * 2 > 16000) pixelRatio = 1.5;
      if (sheetCssHeight * 1.5 > 16000) pixelRatio = 1;

      let canvas: HTMLCanvasElement;
      try {
        const { toCanvas } = await import('html-to-image');
        canvas = await toCanvas(node, {
          pixelRatio,
          backgroundColor: '#ffffff',
          cacheBust: false,
          width: sheetWidth,
          style: {
            margin: '0',
            transform: 'none',
          }
        });
      } finally {
        node.style.transform = origTransform;
      }

      if (kind === 'png') {
        setExportProgress(isEn ? 'Saving PNG…' : 'PNG जतन करत आहे…');
        const dataUrl = canvas.toDataURL('image/png');
        await downloadFile({
          fileName: `${baseName}.png`,
          data: dataUrl,
          mimeType: 'image/png',
          dialogTitle: isEn ? 'Save / Share Schedule' : 'शेड्युल सेव्ह / शेअर करा',
          language,
        });
      } else {
        setExportProgress(isEn ? 'Building PDF…' : 'PDF तयार करत आहे…');
        const { jsPDF } = await import('jspdf');

        const pageWidthMm = 210;
        const pageHeightMm = 297;
        const marginMm = 8;
        const scaleFactor = canvas.width / sheetWidth; // = pixelRatio (auto-selected above)

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        for (let i = 0; i < pages.length; i++) {
          if (i > 0) pdf.addPage();
          const [startY, endY] = pages[i];
          const sliceHeightPx = endY - startY;
          if (sliceHeightPx <= 0) continue;

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.round(sliceHeightPx * scaleFactor);
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(
              canvas,
              0, Math.round(startY * scaleFactor),
              canvas.width, Math.round(sliceHeightPx * scaleFactor),
              0, 0,
              canvas.width, pageCanvas.height
            );
          }

          const sliceDataUrl = pageCanvas.toDataURL('image/jpeg', 0.92);
          const sliceHeightMm = (sliceHeightPx / sheetWidth) * pageWidthMm;
          pdf.addImage(sliceDataUrl, 'JPEG', 0, marginMm, pageWidthMm, sliceHeightMm);

          // Page footer
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`${i + 1} / ${pages.length}`, pageWidthMm - 16, pageHeightMm - 4);
        }

        // Footer on last page
        pdf.setFontSize(7);
        pdf.setTextColor(180, 180, 180);
        pdf.text(
          `Generated by VIONEX · ${format(new Date(), 'dd/MM/yyyy')}`,
          marginMm,
          pageHeightMm - 4
        );

        setExportProgress(isEn ? 'Saving PDF…' : 'PDF जतन करत आहे…');
        const pdfBlob = pdf.output('blob');
        await downloadFile({
          fileName: `${baseName}.pdf`,
          data: pdfBlob,
          mimeType: 'application/pdf',
          dialogTitle: isEn ? 'Save / Share PDF' : 'PDF सेव्ह / शेअर करा',
          language,
        });
      }

      setExportProgress(isEn ? 'File ready ✓' : 'फाइल तयार झाली ✓');
      setTimeout(() => setExportProgress(''), 3000);
    } catch (err: any) {
      console.error('Export failed:', err);
      const msg = isEn
        ? `Could not create file: ${err?.message || 'Unknown error'}`
        : `फाइल तयार करता आली नाही: ${err?.message || 'अज्ञात त्रुटी'}`;
      setExportProgress(msg);
      setTimeout(() => setExportProgress(''), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 p-4 sm:p-8 backdrop-blur-sm">
      {/* Modal Actions */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <button
          onClick={() => !isExporting && setShowChooser(true)}
          disabled={isExporting}
          aria-label={isEn ? "Download schedule" : "शेड्युल डाउनलोड करा"}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-lg transition-colors ${
            isExporting
              ? 'bg-emerald-800 text-emerald-300 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin" />
              <span className="text-sm">{exportProgress || (isEn ? 'Preparing…' : 'तयार होत आहे…')}</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              {isEn ? "Download" : "डाउनलोड करा"}
            </>
          )}
        </button>
        <button
          onClick={onClose}
          aria-label={isEn ? "Close preview" : "बंद करा"}
          className="p-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Format Chooser Bottom Sheet */}
      {showChooser && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center"
          onClick={() => setShowChooser(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-black text-slate-800 mb-1 text-center">
              {isEn ? "Choose Format" : "फॉरमॅट निवडा"}
            </h3>
            <p className="text-xs text-slate-400 text-center mb-5">
              {isEn ? "Schedule Sheet" : "शेड्युल शीट"}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => exportAs('pdf')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <FileText className="w-8 h-8 text-red-500" />
                <span className="text-sm font-black text-red-700">PDF</span>
                <span className="text-[10px] text-red-500 font-bold">A4 Multi-Page</span>
              </button>
              <button
                onClick={() => exportAs('png')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <FileImage className="w-8 h-8 text-blue-500" />
                <span className="text-sm font-black text-blue-700">{isEn ? "Image (PNG)" : "इमेज (PNG)"}</span>
                <span className="text-[10px] text-blue-500 font-bold">
                  {isEn ? "Full sheet" : "पूर्ण शीट"}
                </span>
              </button>
            </div>
            <button
              onClick={() => setShowChooser(false)}
              className="w-full py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              {isEn ? "Cancel" : "रद्द करा"}
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Preview Container */}
      <div
        ref={containerRef}
        className="w-full max-w-4xl flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 rounded-2xl shadow-2xl custom-scrollbar p-2 sm:p-4 lg:p-8 flex justify-center"
      >
        <div
          style={{
            width: `${794 * scale}px`,
            height: `${sheetHeight * scale}px`,
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* Actual Image Canvas to Capture */}
          <div
            ref={previewRef}
            className="bg-[#f9fafb] p-8 shadow-sm rounded-xl relative"
            style={{
              width: '794px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {/* Header Box */}
            <div data-sheet-block="true" className="border border-slate-200 rounded-[2rem] p-8 flex items-stretch gap-6 shadow-sm mb-12 bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              {/* Left Col: Dealer Info */}
              <div className="flex-[0.8] flex gap-4 items-center">
                <div className="w-[84px] h-[84px] border border-emerald-100 rounded-2xl bg-white flex flex-col items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <Sprout className="w-8 h-8 mb-1" />
                  <span className="text-[10px] font-black leading-none uppercase tracking-widest">VIONEX</span>
                  <span className="text-[7.5px] font-bold">Smart Farming</span>
                </div>
                <div className="min-w-0">
                  {(farmer?.dealer || dealer) && (
                    <p className="text-emerald-600 text-[10px] font-black tracking-widest uppercase mb-1">
                      {isEn ? "AUTHORIZED DEALER" : "अधिकृत विक्रेते"}
                    </p>
                  )}
                  <h1 className="text-[20px] font-black text-slate-800 tracking-tight leading-tight mb-1 uppercase truncate">
                    {dealer?.shopName || farmer?.dealer || ""}
                  </h1>
                  {dealer?.name && (
                    <p className="text-slate-600 text-[11px] font-bold tracking-tight mb-1 uppercase">
                      PROP. {dealer.name}
                    </p>
                  )}
                  {dealer?.mobile && (
                    <p className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      📞 {dealer.mobile}
                    </p>
                  )}
                  {!dealer?.name && !dealer?.mobile && (
                    <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Smart Farming Partner</p>
                  )}
                </div>
              </div>
              
              {/* Divider */}
              <div className="w-px bg-slate-200 shrink-0"></div>
              
              {/* Right Col: Farmer Info */}
              <div className="flex-[1.2] relative z-10">
                <p className="text-slate-400 text-[11px] font-black tracking-widest uppercase mb-2">
                  {isEn ? "FARMER & CROP DETAILS" : "शेतकरी व पीक तपशील"}
                </p>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-5">{farmer?.name || "-"}</h2>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                      {isEn ? "VILLAGE" : "गाव"}
                    </p>
                    <p className="font-bold text-slate-700">{farmer?.village || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                      {isEn ? "PHONE" : "संपर्क"}
                    </p>
                    <p className="font-bold text-slate-700">{farmer?.mobile || "-"}</p>
                  </div>
                  <div className="bg-emerald-50/70 rounded-lg px-2.5 py-1.5 -ml-2.5">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">
                      {isEn ? "CROP & VARIETY" : "पीक / वाण"}
                    </p>
                    <p className="font-bold text-emerald-900">{cropName} <span className="text-emerald-700">{cropMeta?.variety ? `(${cropMeta.variety})` : "(super)"}</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                      {isEn ? "PLANTATION" : "लागवड"}
                    </p>
                    <p className="font-bold text-slate-700">{formatPlantationDate(cropMeta?.plantationDate || cropMeta?.sowingDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                      {isEn ? "PLOT NO" : "प्लॉट नंबर"}
                    </p>
                    <p className="font-bold text-slate-700">-</p>
                  </div>
                  <div className="bg-blue-50/70 rounded-lg px-2.5 py-1.5 -ml-2.5">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-0.5">
                      {isEn ? "DATE" : "दिनांक"}
                    </p>
                    <p className="font-bold text-blue-900">{format(new Date(), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative border-l-2 border-slate-200 ml-10 pl-14 pb-4 space-y-8">
              {items.map((item, idx) => {
                if (item.type === 'gap') {
                  const gap = item.gap;
                  return (
                    <div key={`gap-${idx}`} data-sheet-block="true" className="relative mt-4">
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
                          <h4 className="text-[#a5700d] font-black text-[15px] mb-1">
                            {gap
                              ? (isEn ? gap.englishText : gap.marathiText)
                              : (isEn 
                                  ? (item.gapDays === 1 ? `Gap day ${item.startDay} (1-day gap)` : `Gap days ${item.startDay} to ${item.endDay} (${item.gapDays}-day gap)`)
                                  : (item.gapDays === 1 ? `गॅप दिवस ${item.startDay} (1 दिवस गॅप)` : `गॅप दिवस ${item.startDay} ते ${item.endDay} (${item.gapDays} दिवस गॅप)`))}
                          </h4>
                        </div>
                      </div>
                    </div>
                  );
                }

                const group = item.data;
                const dateObj = group.date ? parseISO(group.date) : null;
                const dateText = dateObj ? format(dateObj, 'dd/MM/yyyy') : "-";
                const dayOfWeek = isEn ? (dateObj ? format(dateObj, 'EEEE') : "-") : (dateObj ? getMarathiDayOfWeek(group.date) : "-");
                const isMultiple = group.schedules.length > 1;

                return (
                  <div key={group.date || idx} data-sheet-block="true" className="relative mt-6">
                    {/* Timeline Node */}
                    <div className="absolute -left-[85px] top-4 flex flex-col items-center bg-[#f9fafb] py-2 z-10 w-16">
                      <div className="w-[50px] h-[50px] bg-white border border-slate-200 rounded-full flex items-center justify-center font-black text-[22px] text-slate-800 tracking-tighter shadow-sm mb-1 mt-[-6px]">
                        {group.day}
                      </div>
                      <div className="text-[11px] font-black text-slate-800 tracking-wide bg-[#f9fafb] w-full text-center">
                        {dateObj ? (isEn ? format(dateObj, 'd MMM') : `${dateObj.getDate()} ${getMarathiMonth(group.date)}`) : ""}
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
                        <div className="mb-4 bg-amber-500 text-white text-[11px] font-black px-4 py-1.5 rounded-2xl flex items-center gap-1.5 uppercase tracking-wide">
                          <span>{isEn ? "💡 Dual Schedule: Spray + Drip combined today" : "💡 या दिवशी फवारणी + ठिबक दोन्ही नियोजन एकत्र आहे"}</span>
                        </div>
                      )}
                      <h3 className="text-lg font-black mb-5 tracking-tight text-slate-800">
                        {isEn ? `Date: ${dateText} - ${dayOfWeek} - Variety: ${cropMeta?.variety || "All"}` : `दिनांक: ${dateText} - ${dayOfWeek} - वाण: ${cropMeta?.variety || "सर्व"}`}
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
                                {isGapItem ? (isEn ? "Gap Day" : "गॅप / विश्रांतीचा दिवस") : (isDripItem ? (isEn ? "Drip Schedule" : "ठिबक नियोजन") : schedItem.method === "आळवणी / ड्रिंचिंग" ? (isEn ? "Drenching Schedule" : "आळवणी / ड्रिंचिंग") : (isEn ? "Spray Schedule" : "फवारणी नियोजन"))}
                              </h4>

                              {isGapItem && (!schedItem.selectedProducts || schedItem.selectedProducts.length === 0) ? (
                                <div className="py-6 text-center border-2 border-dashed border-amber-200 rounded-3xl bg-amber-50/10">
                                  <p className="text-sm font-black text-amber-800">{isEn ? "Rest Day 😴" : "गॅप / विश्रांतीचा दिवस 😴"}</p>
                                  <p className="text-xs text-amber-600 mt-1 font-bold">{isEn ? "No spray or drip application scheduled for today." : "आज कोणतेही औषध फवारणी किंवा ठिबकचे नियोजन करू नये."}</p>
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
                                            {formatDualDisplay(p.brandName, p.marathiName, language)}
                                          </h4>
                                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-600 font-bold">
                                            {p.companyName && (
                                              <span>
                                                <span className="text-blue-500 mr-1.5 font-bold">•</span>
                                                {p.companyName}
                                              </span>
                                            )}
                                            {p.formulation && p.formulation !== "लागू नाही" && p.formulation !== "माहिती उपलब्ध नाही" && (
                                              <span>
                                                <span className="text-purple-500 mr-1.5 font-bold">•</span>
                                                {isEn ? "Formulation: " : "फॉर्म्युलेशन: "}{p.formulation}
                                              </span>
                                            )}
                                          </div>
                                          {p.modeOfAction && p.modeOfAction !== "लागू नाही" && p.modeOfAction !== "माहिती उपलब्ध नाही" && (
                                            <div className="text-[11px] font-semibold text-slate-600 mt-1">
                                              <span className="font-extrabold text-slate-700">{isEn ? "Mode of Action: " : "कृती पद्धत: "}</span>
                                              <span>{formatModeOfAction(p.modeOfAction)}</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="shrink-0 text-right w-36">
                                          <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">{getDoseLabel(schedItem.method, language)}</span>
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
                                  {isEn ? "📝 Note: " : "📝 नोंद: "}{schedItem.notes}
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
            <div data-sheet-block="true" className="mt-16 pt-8 border-t-2 border-slate-100 flex justify-between items-end pb-4">
              <div>
                <h1 className="text-[32px] font-black tracking-tight text-slate-800 flex items-center gap-1 leading-none mb-1.5">
                  VIONEX {!isEn && <span className="text-emerald-600">(वी ऑ नेक्स)</span>}
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
    </div>
  );
}

import { safeJsonParse } from "../lib/safeJson";
import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Trash2, HelpCircle } from "lucide-react";
import { standardizeCompanyName } from "../lib/company-helper";


interface BulkImportSectionProps {
  products: any[];
  onAddProduct: (product: any) => void;
}

interface ParsedProduct {
  brandName: string;
  marathiName?: string;
  companyName: string;
  category?: string;
  composition?: string;
  compositionEnglish?: string;
  formulation?: string;
  modeOfAction?: string;
  typeClassification?: string;
  iracCode?: string;
  fracCode?: string;
  doseSpray?: string;
  targetCrops?: string;
  targetPests?: string;
  targetDiseases?: string;
}

interface ValidationItem {
  product: ParsedProduct;
  status: "valid" | "duplicate" | "invalid";
  errors: string[];
}

export function BulkImportSection({ products, onAddProduct }: BulkImportSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationItem[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple and robust parser for CSV format
  const parseCSV = (text: string): ParsedProduct[] => {
    const lines: string[] = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push("");
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        lines.push(row.join("\x01")); // Temporal safe delimiter
        row = [""];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row.join("\x01"));
    }

    if (lines.length < 2) return [];
    
    // Header processing
    const headers = lines[0].split("\x01").map(h => {
      let cleaned = h.trim().replace(/^"|"$/g, "");
      // Support camelCase or lowercase headers
      return cleaned;
    });

    const parsedList: ParsedProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split("\x01").map(v => v.trim().replace(/^"|"$/g, ""));
      if (values.length < headers.length || values.every(v => v === "")) continue;

      const item: any = {};
      headers.forEach((header, idx) => {
        const value = values[idx] || "";
        // Map common column name variations to properties
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normalizedHeader === "brandname" || normalizedHeader === "name" || normalizedHeader === "brand") {
          item.brandName = value;
        } else if (normalizedHeader === "marathiname" || normalizedHeader === "nameinmarathi") {
          item.marathiName = value;
        } else if (normalizedHeader === "companyname" || normalizedHeader === "company" || normalizedHeader === "brandcompany") {
          item.companyName = value;
        } else if (normalizedHeader === "category" || normalizedHeader === "type") {
          item.category = value;
        } else if (normalizedHeader === "composition" || normalizedHeader === "molecule") {
          item.composition = value;
        } else if (normalizedHeader === "compositionenglish" || normalizedHeader === "moleculeenglish") {
          item.compositionEnglish = value;
        } else if (normalizedHeader === "formulation") {
          item.formulation = value;
        } else if (normalizedHeader === "modeofaction") {
          item.modeOfAction = value;
        } else if (normalizedHeader === "typeclassification" || normalizedHeader === "classification") {
          item.typeClassification = value;
        } else if (normalizedHeader === "iraccode" || normalizedHeader === "irac") {
          item.iracCode = value;
        } else if (normalizedHeader === "fraccode" || normalizedHeader === "frac") {
          item.fracCode = value;
        } else if (normalizedHeader === "dosespray" || normalizedHeader === "dose") {
          item.doseSpray = value;
        } else if (normalizedHeader === "targetcrops" || normalizedHeader === "crops") {
          item.targetCrops = value;
        } else if (normalizedHeader === "targetpests" || normalizedHeader === "pests") {
          item.targetPests = value;
        } else if (normalizedHeader === "targetdiseases" || normalizedHeader === "diseases") {
          item.targetDiseases = value;
        } else {
          // Dynamic assignment
          item[header] = value;
        }
      });

      if (item.brandName || item.companyName) {
        parsedList.push({
          brandName: item.brandName || "",
          marathiName: item.marathiName || "",
          companyName: item.companyName || "",
          category: item.category || "",
          composition: item.composition || "",
          compositionEnglish: item.compositionEnglish || "",
          formulation: item.formulation || "",
          modeOfAction: item.modeOfAction || "",
          typeClassification: item.typeClassification || "",
          iracCode: item.iracCode || "",
          fracCode: item.fracCode || "",
          doseSpray: item.doseSpray || "",
          targetCrops: item.targetCrops || "",
          targetPests: item.targetPests || "",
          targetDiseases: item.targetDiseases || ""
        });
      }
    }

    return parsedList;
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      let rawList: ParsedProduct[] = [];

      try {
        if (file.name.endsWith(".json")) {
          const jsonParsed = (content === "undefined" ? undefined : safeJsonParse(content));
          rawList = Array.isArray(jsonParsed) ? jsonParsed : [jsonParsed];
        } else {
          rawList = parseCSV(content);
        }

        validateAndGenerateReport(rawList);
      } catch (err) {
        console.error(err);
        alert("फाइल वाचताना त्रुटी आली. कृपया अचूक JSON किंवा CSV फॉरमॅट वापरा.");
      }
    };
    reader.readAsText(file);
  };

  const validateAndGenerateReport = (rawList: ParsedProduct[]) => {
    const report: ValidationItem[] = [];
    const seenInUpload = new Set<string>();

    rawList.forEach((rawProd, index) => {
      const errors: string[] = [];
      let status: "valid" | "duplicate" | "invalid" = "valid";

      // 1. Mandatory Field Checks
      if (!rawProd.brandName || rawProd.brandName.trim() === "") {
        errors.push("ब्रांड नाव (Brand Name) रिकामे आहे");
        status = "invalid";
      }
      if (!rawProd.companyName || rawProd.companyName.trim() === "") {
        errors.push("कंपनी नाव (Company Name) रिकामे आहे");
        status = "invalid";
      }

      // 2. Normalize and Map Companies
      let stdCompanies: string[] = [];
      if (rawProd.companyName) {
        stdCompanies = standardizeCompanyName(rawProd.companyName);
        if (stdCompanies.length === 0) {
          errors.push(`अवैध कंपनी नाव: "${rawProd.companyName}"`);
          status = "invalid";
        }
      }

      // 3. Duplicate checks inside existing system database
      if (status !== "invalid" && rawProd.brandName) {
        const brandLower = rawProd.brandName.trim().toLowerCase();
        
        // Find if product with same brand name exists in standard companies
        const systemDuplicate = products.some((p) => {
          if (!p.brandName || p.isDeleted) return false;
          const sysBrandLower = p.brandName.trim().toLowerCase();
          if (sysBrandLower !== brandLower) return false;

          // Check if system product company standard match
          const sysStdCos = standardizeCompanyName(p.companyName);
          return stdCompanies.some(c => sysStdCos.includes(c));
        });

        if (systemDuplicate) {
          errors.push("डेटाबेसमध्ये आधीपासूनच हे उत्पादन अस्तित्वात आहे (Duplicate in System)");
          status = "duplicate";
        }

        // 4. Duplicate checks inside this current CSV/JSON list
        const internalKey = `${brandLower}::${stdCompanies.join("|")}`;
        if (seenInUpload.has(internalKey)) {
          errors.push("याच फाइलमध्ये हे उत्पादन पुन्हा आले आहे (Duplicate in File)");
          status = "duplicate";
        } else {
          seenInUpload.add(internalKey);
        }
      }

      // Re-map with standard company name if valid
      const updatedProduct = {
        ...rawProd,
        companyName: stdCompanies.length > 0 ? stdCompanies.join(" / ") : rawProd.companyName,
      };

      report.push({
        product: updatedProduct,
        status,
        errors,
      });
    });

    setValidationReport(report);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearReport = () => {
    setValidationReport(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCommitImport = () => {
    if (!validationReport) return;
    
    const validItems = validationReport.filter((item) => item.status === "valid");
    if (validItems.length === 0) {
      alert("आयात करण्यासाठी कोणतेही नवीन/वैध उत्पादन सापडले नाही.");
      return;
    }

    if (window.confirm(`निश्चितपणे ${validItems.length} उत्पादने डेटाबेसमध्ये समाविष्ट करायची आहेत का?`)) {
      validItems.forEach((item) => {
        onAddProduct({
          ...item.product,
          status: "verified",
          approvalStatus: "approved",
          createdAt: new Date().toISOString(),
          createdBy: "bulk_admin_import",
        });
      });
      alert(`यशस्वीरित्या ${validItems.length} उत्पादने आयात करण्यात आली!`);
      clearReport();
    }
  };

  // Stats calculation
  const totalCount = validationReport?.length || 0;
  const validCount = validationReport?.filter(r => r.status === "valid").length || 0;
  const duplicateCount = validationReport?.filter(r => r.status === "duplicate").length || 0;
  const invalidCount = validationReport?.filter(r => r.status === "invalid").length || 0;

  return (
    <div id="bulk-import-container" className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" /> बल्क डेटा आयात (Bulk CSV/JSON Import)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            अधिकृत स्रोत सूचीमधील उत्पादने थेट समाविष्ट करा. स्वयंचलित डुप्लिकेट तपासणी आणि कंपनी प्रमाणीकरण उपलब्ध आहे.
          </p>
        </div>
        {validationReport && (
          <button
            onClick={clearReport}
            className="text-xs text-slate-400 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> रिसेट करा
          </button>
        )}
      </div>

      {!validationReport ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.json"
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <Upload className="w-5 h-5 text-indigo-600 animate-bounce" />
            </div>
            <p className="text-xs font-black text-slate-700">
              CSV किंवा JSON फाइल ड्रॅग करा किंवा इथे क्लिक करा
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              कमाल फाइल साईझ: 5MB • स्वरूप: .csv किंवा .json
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File summary and controls */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <div>
                <span className="text-xs font-black text-slate-700 block">{fileName}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                  एकूण डेटा: {totalCount} नोंदी
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                disabled={validCount === 0}
                onClick={handleCommitImport}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> {validCount} उत्पादने आयात करा
              </button>
            </div>
          </div>

          {/* Verification Statistics widgets */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2.5 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-emerald-700 font-bold block">नवीन आणि वैध</span>
                <span className="text-sm font-black text-emerald-800">{validCount} / {totalCount}</span>
              </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-[10px] text-amber-700 font-bold block">आधीपासून अस्तित्वात</span>
                <span className="text-sm font-black text-amber-800">{duplicateCount}</span>
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-2.5 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="text-[10px] text-rose-700 font-bold block">त्रुटी / अवैध डेटा</span>
                <span className="text-sm font-black text-rose-800">{invalidCount}</span>
              </div>
            </div>
          </div>

          {/* Validations table / logs list */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-80 overflow-y-auto shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-widest text-[9px] border-b border-slate-100">
                  <th className="px-4 py-3">Product Identity</th>
                  <th className="px-4 py-3">Standardized Company</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Validation Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700 bg-white">
                {validationReport.map((item, idx) => {
                  let statusBg = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  let statusLabel = "Ready";
                  
                  if (item.status === "duplicate") {
                    statusBg = "bg-amber-50 text-amber-700 border-amber-100";
                    statusLabel = "Duplicate";
                  } else if (item.status === "invalid") {
                    statusBg = "bg-rose-50 text-rose-700 border-rose-100";
                    statusLabel = "Invalid";
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {item.product.brandName || <span className="text-rose-500 italic">Missing Brand</span>}
                          </span>
                          {item.product.marathiName && <span className="text-[10px] text-slate-400 font-bold tracking-tight">{item.product.marathiName}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-slate-200 rounded-full group-hover:bg-indigo-400"></div>
                          <span className="text-[12px] font-bold text-slate-600">
                            {item.product.companyName || <span className="text-rose-500 italic">Missing Company</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${statusBg}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.errors.length > 0 ? (
                          <div className="text-[10px] text-rose-600 space-y-1">
                            {item.errors.map((err, errIdx) => (
                              <div key={errIdx} className="flex items-start gap-1.5 leading-tight">
                                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                <span className="font-bold">{err}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-tight">Verified</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick guide formatting support */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <h4 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" /> फाइल स्वरूपन सहाय्यक (Required Formatting Columns)
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              तुमच्या CSV फाईलमध्ये खालीलपैकी किमान स्तंभ (Headers) असणे गरजेचे आहे:
              <br />
              <code className="bg-white border border-slate-200 px-1 py-0.5 rounded font-mono text-[9px] text-slate-700 block mt-1">
                brandName, companyName, category, composition, formulation, doseSpray, targetCrops
              </code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

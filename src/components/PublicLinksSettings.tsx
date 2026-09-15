import React, { useState, useEffect } from "react";
import { Copy, Check, Share2, RefreshCw, Power } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

interface PublicLinksSettingsProps {
  appLink: string;
}

export default function PublicLinksSettings({ appLink }: PublicLinksSettingsProps) {
  const [config, setConfig] = useState<any>(null);
  const [copiedDealer, setCopiedDealer] = useState(false);
  const [copiedConsultant, setCopiedConsultant] = useState(false);

  useEffect(() => {
    const docRef = doc(db, "settings", "public_links");
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setConfig(snap.data());
      } else {
        // Default config
        const defaultConfig = {
          dealer: { enabled: true, token: crypto.randomUUID() },
          consultant: { enabled: true, token: crypto.randomUUID() }
        };
        setDoc(docRef, defaultConfig).catch(console.error);
        setConfig(defaultConfig);
      }
    });
    return () => unsub();
  }, []);

  const handleToggle = async (type: "dealer" | "consultant") => {
    if (!config) return;
    const docRef = doc(db, "settings", "public_links");
    const updated = {
      ...config,
      [type]: {
        ...config[type],
        enabled: !config[type].enabled
      }
    };
    await setDoc(docRef, updated);
  };

  const handleRegenerate = async (type: "dealer" | "consultant") => {
    if (!config) return;
    if (!confirm("Are you sure? Old links will stop working immediately.")) return;
    const docRef = doc(db, "settings", "public_links");
    const updated = {
      ...config,
      [type]: {
        ...config[type],
        token: crypto.randomUUID()
      }
    };
    await setDoc(docRef, updated);
  };

  const copyText = (text: string, type: "dealer" | "consultant") => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "dealer") {
        setCopiedDealer(true);
        setTimeout(() => setCopiedDealer(false), 2000);
      } else {
        setCopiedConsultant(true);
        setTimeout(() => setCopiedConsultant(false), 2000);
      }
    });
  };

  const shareLink = (link: string, title: string) => {
    const shareText = `*VIONEX - ${title}*\n\nयेथे क्लिक करून माहिती भरा:\n🔗 ${link}`;
    if (navigator.share) {
      navigator.share({ title: `VIONEX ${title}`, text: shareText, url: link }).catch((err) => {
        if (err.name !== "AbortError") window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    }
  };

  if (!config) return null;

  const renderLinkSection = (type: "dealer" | "consultant", title: string, data: any) => {
    const link = `${appLink.replace(/\/$/, "")}/?view=public-form&type=${type}&token=${data.token}`;
    const copied = type === "dealer" ? copiedDealer : copiedConsultant;

    return (
      <div className="space-y-3 mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {title}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleRegenerate(type)}
              className="text-[10px] flex items-center gap-1 font-bold text-slate-400 hover:text-emerald-600"
            >
              <RefreshCw className="w-3 h-3" /> Regenerate
            </button>
            <button
              onClick={() => handleToggle(type)}
              className={`text-[10px] flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border ${data.enabled ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-200 text-slate-500 border-slate-300"}`}
            >
              <Power className="w-3 h-3" /> {data.enabled ? "Enabled" : "Disabled"}
            </button>
          </div>
        </div>
        
        {data.enabled ? (
          <>
            <div className="flex bg-white border border-slate-200 rounded-lg px-2.5 py-2 items-center justify-between gap-3 text-[11px] font-bold text-slate-400 truncate">
              {link}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => copyText(link, type)}
                className="flex items-center justify-center gap-1.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer active:scale-95"
              >
                {copied ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> कॉपी केली!</> : <><Copy className="w-3.5 h-3.5" /> लिंक कॉपी</>}
              </button>
              <button
                onClick={() => shareLink(link, title)}
                className="flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp शेअर
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-2 text-[10px] text-slate-400 font-bold">
            ही लिंक सध्या बंद (Disabled) आहे.
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <hr className="border-slate-100" />
      <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
          🌐 Public Form Links (No Login Required)
        </label>
        {renderLinkSection("dealer", "Dealer Registration Form", config.dealer)}
        {renderLinkSection("consultant", "Consultant Form", config.consultant)}
      </div>
    </>
  );
}

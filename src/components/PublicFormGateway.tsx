import React, { useState, useEffect } from "react";
import { db, ensureAnonymousAuth } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import NeutralPublicPortal from "./NeutralPublicPortal";

export default function PublicFormGateway() {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState<"dealer" | "consultant">("dealer");

  useEffect(() => {
    document.title = "Vionex - Public Form";
    ensureAnonymousAuth().catch(err => console.warn("Public form anonymous auth notice:", err));

    const searchParams = new URLSearchParams(window.location.search);
    const hashStr = window.location.hash.includes("?")
      ? window.location.hash.substring(window.location.hash.indexOf("?"))
      : window.location.hash.replace("#", "?");
    const hashParams = new URLSearchParams(hashStr);

    const getParam = (k: string) => searchParams.get(k) || hashParams.get(k);

    const rawType = (getParam("type") || getParam("form") || "dealer").toLowerCase();
    const token = getParam("token");

    const targetType: "dealer" | "consultant" = rawType === "consultant" ? "consultant" : "dealer";
    setFormType(targetType);

    const checkToken = async () => {
      try {
        if (token) {
          const docRef = doc(db, "settings", "public_links");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const config = snap.data();
            if (config[targetType] && config[targetType].enabled === false) {
              setError("ही लिंक सध्या अ‍ॅडमिनद्वारे बंद (Disabled) करण्यात आली आहे.");
              setIsValid(false);
              return;
            }
          }
        }
        setIsValid(true);
      } catch (err) {
        console.warn("Public form validation fallback:", err);
        setIsValid(true);
      }
    };

    checkToken();
  }, []);

  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-sm w-full">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return <NeutralPublicPortal initialTab={formType} isLocked={true} />;
}

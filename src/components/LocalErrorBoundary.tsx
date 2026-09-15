import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  featureName: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class LocalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error caught in feature isolation [${this.props.featureName}]:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col items-center justify-center text-center my-4">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-base font-bold text-slate-800 tracking-tight mb-1">
            {this.props.featureName} उघडण्यात तांत्रिक अडचण आली
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm">
            या विशिष्ट फीचरमध्ये त्रुटी आढळली आहे. संपूर्ण ॲप सुरळीतपणे कार्यरत आहे, तुम्ही इतर पर्याय वापरू शकता.
          </p>
          {this.state.error && (
            <p className="text-[10px] font-mono text-rose-600 bg-rose-100/50 px-2 py-1 rounded mb-4 max-w-xs break-all">
              {this.state.error.message}
            </p>
          )}
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" /> पुन्हा प्रयत्न करा
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

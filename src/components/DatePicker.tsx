import React, { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import CalendarPicker from "./CalendarPicker";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  schedules?: any[];
  farmerId?: string;
  cropName?: string;
  cropId?: string;
  className?: string;
  hasError?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "तारीख निवडा (Select Date)",
  schedules,
  farmerId,
  cropName,
  cropId,
  className = "",
  hasError = false,
}: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setShowCalendar(!showCalendar)}
        className={`w-full px-2 py-1.5 rounded text-xs outline-none flex justify-between items-center cursor-pointer ${
          hasError
            ? "border-2 border-red-500 bg-red-50 text-red-900 font-sans font-bold"
            : "border border-slate-200 bg-white hover:bg-slate-50 focus:ring-1 focus:ring-emerald-500"
        } ${className}`}
      >
        <span>{value || placeholder}</span>
        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
      </div>

      {showCalendar && (
        <div className="absolute z-50 mt-1 left-0 sm:left-auto right-auto">
          <CalendarPicker
            selectedDate={value}
            onSelectDate={(newDate) => {
              onChange(newDate);
              setShowCalendar(false);
            }}
            schedules={schedules || []}
            farmerId={farmerId || ""}
            cropName={cropName}
            cropId={cropId}
          />
        </div>
      )}
    </div>
  );
}

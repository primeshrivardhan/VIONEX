import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface CalendarPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  schedules: any[];
  farmerId: string;
  cropName?: string;
  cropId?: string;
}

export default function CalendarPicker({ selectedDate, onSelectDate, schedules, farmerId, cropName, cropId }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date();
  });

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const farmerSchedulesDates = useMemo(() => {
    if (!schedules || !farmerId) return [];
    return schedules
      .filter(s => {
        if (!s || !s.farmerId) return false;
        const matchesFarmer = String(s.farmerId) === String(farmerId);
        // Prioritize cropId if provided, fallback to cropName
        const matchesCrop = cropId 
          ? String(s.cropId || "").trim() === String(cropId).trim()
          : (cropName ? String(s.cropName || "").trim() === String(cropName).trim() : true);
        return matchesFarmer && matchesCrop && s.scheduleDate;
      })
      .map(s => s.scheduleDate);
  }, [schedules, farmerId, cropName, cropId]);

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    
    // Check if this date has a schedule for the selected farmer
    const hasSchedule = farmerSchedulesDates.includes(dateStr);
    const isSelected = selectedDate === dateStr;
    const isToday = dateStr === new Date().toISOString().split('T')[0];

    days.push(
      <button
        key={d}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectDate(dateStr);
        }}
        className={`relative h-9 w-9 flex flex-col items-center justify-center rounded-md text-sm font-medium transition-colors ${
          isSelected 
            ? 'bg-emerald-600 text-white shadow-sm' 
            : isToday 
              ? 'bg-emerald-50 text-emerald-700' 
              : 'hover:bg-slate-100 text-slate-700'
        }`}
      >
        <span>{d}</span>
        {hasSchedule && (
          <Check className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'} drop-shadow-sm`} strokeWidth={3} />
        )}
      </button>
    );
  }

  const monthNames = [
    "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
    "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-3 w-[280px] select-none" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-slate-800 text-sm">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-bold text-slate-400">
        <div>रवि</div>
        <div>सोम</div>
        <div>मंगळ</div>
        <div>बुध</div>
        <div>गुरु</div>
        <div>शुक्र</div>
        <div>शनी</div>
      </div>

      <div className="grid grid-cols-7 gap-1 place-items-center">
        {days}
      </div>
    </div>
  );
}

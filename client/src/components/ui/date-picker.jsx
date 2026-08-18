import * as React from "react"
import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { cn } from "../../lib/utils"
import { CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react"

export function DatePicker({
  value = "",
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  max,
  min,
  className,
  id,
  required = false,
}) {
  const [open, setOpen] = useState(false)
  
  // Keep track of the active month/year in the calendar view
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        if (!isNaN(dateObj.getTime())) return dateObj;
      }
    }
    return new Date();
  });

  // Sync current calendar view if value changes externally
  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        if (!isNaN(dateObj.getTime())) {
          setCurrentDate(dateObj);
        }
      }
    }
  }, [value]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Format month name
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to format date as YYYY-MM-DD
  const formatISO = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Helper to format date for display (DD/MM/YYYY)
  const formatDisplay = (val) => {
    if (!val) return "";
    const parts = val.split("-");
    if (parts.length !== 3) return "";
    const yyyy = parts[0];
    const mm = parts[1];
    const dd = parts[2];
    return `${dd}/${mm}/${yyyy}`;
  };

  // Days in month
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  // First day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Generate days grid
  const days = [];
  // Padding for previous month
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false
    });
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month,
      year,
      isCurrentMonth: true
    });
  }
  // Padding for next month to complete the row
  const totalSlots = 42; // 6 rows of 7 days
  const nextMonthPadding = totalSlots - days.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    days.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false
    });
  }

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (dayObj) => {
    const selectedDate = new Date(dayObj.year, dayObj.month, dayObj.day);
    const isoString = formatISO(selectedDate);
    
    // Check min/max constraints
    if (min && isoString < min) return;
    if (max && isoString > max) return;

    onChange(isoString);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
  };

  const isSelected = (dayObj) => {
    if (!value) return false;
    const parts = value.split("-");
    if (parts.length !== 3) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return y === dayObj.year && m === dayObj.month && d === dayObj.day;
  };

  const isToday = (dayObj) => {
    const today = new Date();
    return (
      today.getFullYear() === dayObj.year &&
      today.getMonth() === dayObj.month &&
      today.getDate() === dayObj.day
    );
  };

  const isDisabled = (dayObj) => {
    const isoString = formatISO(new Date(dayObj.year, dayObj.month, dayObj.day));
    if (min && isoString < min) return true;
    if (max && isoString > max) return true;
    return false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          disabled={disabled}
          variant="outline"
          className={cn(
            "w-full justify-between font-semibold text-left h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none",
            disabled && "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75 active:scale-100",
            !value && "text-slate-400",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{value ? formatDisplay(value) : placeholder}</span>
          </span>
          {value && !required && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 bg-white" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-slate-900">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day} className="text-xs font-bold text-slate-400 py-1">
                {day}
              </span>
            ))}
            {days.map((dayObj, index) => {
              const selected = isSelected(dayObj);
              const todayFlag = isToday(dayObj);
              const disabledFlag = isDisabled(dayObj);
              return (
                <button
                  key={index}
                  type="button"
                  disabled={disabledFlag}
                  onClick={() => handleDaySelect(dayObj)}
                  className={cn(
                    "h-9 w-9 text-xs rounded-xl flex items-center justify-center transition-all focus:outline-none cursor-pointer",
                    dayObj.isCurrentMonth ? "text-slate-800 font-medium" : "text-slate-300",
                    todayFlag && !selected && "border border-indigo-200 text-indigo-650 bg-indigo-50/30",
                    selected && "bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm",
                    !selected && !disabledFlag && "hover:bg-slate-100",
                    disabledFlag && "opacity-30 cursor-not-allowed text-slate-300 hover:bg-transparent"
                  )}
                >
                  {dayObj.day}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;

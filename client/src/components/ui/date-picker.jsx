import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "../../lib/utils"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

// Helper to format ISO date string (YYYY-MM-DD) to DD/MM/YYYY for display
const formatDisplay = (val) => {
  if (!val) return "";
  const parts = val.split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
};

// Helper to format Date object as YYYY-MM-DD
const formatISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Days in month helper
const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

// Parse DD/MM/YYYY to YYYY-MM-DD if valid and within optional min/max bounds
const parseDMY = (str, min, max) => {
  if (!str) return null;
  const match = str.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return null;
  if (year < 1900 || year > 2100) return null;

  const daysInMonth = getDaysInMonth(year, month - 1);
  if (day < 1 || day > daysInMonth) return null;

  const yyyy = String(year);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const iso = `${yyyy}-${mm}-${dd}`;

  if (min && iso < min) return null;
  if (max && iso > max) return null;

  return iso;
};

export function DatePicker({
  value = "",
  onChange,
  placeholder = "DD/MM/YYYY",
  disabled = false,
  max,
  min,
  className,
  id,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  // Active month/year displayed in calendar popover
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

  // Sync state when `value` prop changes externally
  useEffect(() => {
    if (value) {
      const formatted = formatDisplay(value);
      if (document.activeElement !== inputRef.current) {
        setInputValue(formatted);
      }
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
    } else {
      if (document.activeElement !== inputRef.current) {
        setInputValue("");
      }
    }
  }, [value]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month,
      year,
      isCurrentMonth: true
    });
  }
  const totalSlots = 42;
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

    if (min && isoString < min) return;
    if (max && isoString > max) return;

    setInputValue(formatDisplay(isoString));
    if (typeof onChange === "function") {
      onChange(isoString);
    }
    setOpen(false);
  };

  const handleInputChange = (e) => {
    let val = e.target.value;

    // Remove any character that isn't a digit or slash
    val = val.replace(/[^0-9/]/g, "");

    // Auto-insert slashes as user types forward
    if (val.length > inputValue.length) {
      if (val.length === 2 && !val.includes("/")) {
        val += "/";
      } else if (val.length === 5 && (val.match(/\//g) || []).length === 1) {
        val += "/";
      }
    }

    if (val.length <= 10) {
      setInputValue(val);
    } else {
      return;
    }

    const isoDate = parseDMY(val, min, max);
    if (isoDate) {
      if (typeof onChange === "function") {
        onChange(isoDate);
      }
      const parts = isoDate.split("-");
      const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      if (!isNaN(dateObj.getTime())) {
        setCurrentDate(dateObj);
      }
    } else if (val === "") {
      if (typeof onChange === "function") {
        onChange("");
      }
    }
  };

  const handleBlur = () => {
    const isoDate = parseDMY(inputValue, min, max);
    if (isoDate) {
      setInputValue(formatDisplay(isoDate));
      if (typeof onChange === "function") {
        onChange(isoDate);
      }
    } else {
      if (value) {
        setInputValue(formatDisplay(value));
      } else {
        setInputValue("");
      }
    }
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

  const yearsList = React.useMemo(() => {
    const currentY = new Date().getFullYear();
    let startYear = currentY - 50;
    let endYear = 2030; // Limit year selector till 2030 max

    if (min) {
      const minY = parseInt(min.split("-")[0], 10);
      if (!isNaN(minY)) startYear = Math.min(startYear, minY);
    }
    if (max) {
      const maxY = parseInt(max.split("-")[0], 10);
      if (!isNaN(maxY)) endYear = Math.min(2030, maxY);
    }
    if (year < startYear) startYear = year;
    if (year > endYear) endYear = Math.min(year, 2030);

    const list = [];
    for (let y = startYear; y <= endYear; y++) {
      list.push(y);
    }
    return list;
  }, [min, max, year]);

  return (
    <div className="relative w-full flex items-center">
      <input
        ref={inputRef}
        id={id}
        type="text"
        disabled={disabled}
        required={required && !value}
        className={cn(
          "w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 outline-none text-sm transition-all focus:ring-4 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50 text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed",
          className
        )}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3 bg-white" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5">
                <select
                  value={month}
                  onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value, 10), 1))}
                  className="text-xs font-bold text-slate-800 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer transition-all"
                >
                  {monthNames.map((mName, idx) => (
                    <option key={mName} value={idx}>
                      {mName}
                    </option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value, 10), month, 1))}
                  className="text-xs font-bold text-slate-800 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer transition-all"
                >
                  {yearsList.map((yVal) => (
                    <option key={yVal} value={yVal}>
                      {yVal}
                    </option>
                  ))}
                </select>
              </div>
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
    </div>
  );
}

export default DatePicker;


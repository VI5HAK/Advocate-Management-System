import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { cn } from "@/utils/cn";
import { Clock } from "lucide-react"

const parseTime = (str) => {
  if (!str) return null;
  // Matches "h:mm am/pm", "hh:mm am/pm", "h:mm", or "hh:mm"
  const match = str.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (m < 0 || m > 59) return null;

  if (ampm) {
    if (h < 1 || h > 12) return null;
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
  } else {
    if (h < 0 || h > 23) return null;
  }

  const hStr = String(h).padStart(2, "0");
  const mStr = String(m).padStart(2, "0");
  return `${hStr}:${mStr}`;
};

export function TimePicker({
  value = "",
  onChange,
  placeholder = "Pick a time",
  disabled = false,
  className,
  id,
}) {
  const [open, setOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState("12")
  const [selectedMinute, setSelectedMinute] = useState("00")
  const [selectedAmpm, setSelectedAmpm] = useState("AM")
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef(null)

  const getDisplayTime = (val) => {
    if (!val) return ""
    const [hStr, mStr] = val.split(":")
    const h = parseInt(hStr, 10)
    const ampmVal = h >= 12 ? "PM" : "AM"
    let h12 = h % 12
    if (h12 === 0) h12 = 12
    return `${String(h12).padStart(2, "0")}:${mStr} ${ampmVal}`
  }

  // Parse 24h format (HH:MM) to 12h format state
  useEffect(() => {
    if (value) {
      const [hStr, mStr] = value.split(":")
      const h = parseInt(hStr, 10)
      const m = mStr || "00"
      
      const ampmVal = h >= 12 ? "PM" : "AM"
      let h12 = h % 12
      if (h12 === 0) h12 = 12
      const h12Str = String(h12).padStart(2, "0")
      
      setSelectedHour(h12Str)
      setSelectedMinute(m)
      setSelectedAmpm(ampmVal)
      
      if (document.activeElement !== inputRef.current) {
        setInputValue(`${h12Str}:${m} ${ampmVal}`)
      }
    } else {
      setSelectedHour("12")
      setSelectedMinute("00")
      setSelectedAmpm("AM")
      if (document.activeElement !== inputRef.current) {
        setInputValue("")
      }
    }
  }, [value])

  const handleTimeChange = (h12, m, ampmVal) => {
    let h24 = parseInt(h12, 10)
    if (ampmVal === "PM" && h24 !== 12) {
      h24 += 12
    } else if (ampmVal === "AM" && h24 === 12) {
      h24 = 0
    }
    const h24Str = String(h24).padStart(2, "0")
    onChange({ target: { value: `${h24Str}:${m}` } })
  }

  const handleInputChange = (e) => {
    let val = e.target.value;
    
    // Auto insert colon
    if (val.length > inputValue.length) {
      if (val.length === 2 && !val.includes(":")) {
        val += ":";
      }
    }
    setInputValue(val);

    const parsed = parseTime(val);
    if (parsed) {
      onChange({ target: { value: parsed } });
    }
  };

  const handleBlur = () => {
    const parsed = parseTime(inputValue);
    if (parsed) {
      onChange({ target: { value: parsed } });
      const [hStr, mStr] = parsed.split(":")
      const h = parseInt(hStr, 10)
      const ampmVal = h >= 12 ? "PM" : "AM"
      let h12 = h % 12
      if (h12 === 0) h12 = 12
      setInputValue(`${String(h12).padStart(2, "0")}:${mStr} ${ampmVal}`)
    } else {
      if (value) {
        setInputValue(getDisplayTime(value));
      } else {
        setInputValue("");
      }
    }
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))

  return (
    <div className="relative w-full flex items-center">
      <input
        ref={inputRef}
        id={id}
        type="text"
        disabled={disabled}
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
            <Clock className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-3 bg-white" align="end">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 justify-center">
              {/* Hour Selector */}
              <div className="flex flex-col gap-1 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hour</span>
                <div className="h-[120px] overflow-y-auto border border-slate-100 rounded-lg p-1 space-y-1 w-14 scrollbar-thin">
                  {hours.map((h) => {
                    const active = h === selectedHour
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setSelectedHour(h)
                          handleTimeChange(h, selectedMinute, selectedAmpm)
                        }}
                        className={cn(
                          "w-full h-8 text-xs font-semibold rounded-md flex items-center justify-center transition-all cursor-pointer",
                          active ? "bg-indigo-600 text-white font-bold" : "hover:bg-slate-100 text-slate-700"
                        )}
                      >
                        {h}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Minute Selector */}
              <div className="flex flex-col gap-1 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Min</span>
                <div className="h-[120px] overflow-y-auto border border-slate-100 rounded-lg p-1 space-y-1 w-14 scrollbar-thin">
                  {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => {
                    const active = m === selectedMinute
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setSelectedMinute(m)
                          handleTimeChange(selectedHour, m, selectedAmpm)
                        }}
                        className={cn(
                          "w-full h-8 text-xs font-semibold rounded-md flex items-center justify-center transition-all cursor-pointer",
                          active ? "bg-indigo-600 text-white font-bold" : "hover:bg-slate-100 text-slate-700"
                        )}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* AM/PM Selector */}
              <div className="flex flex-col gap-1 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">AM/PM</span>
                <div className="border border-slate-100 rounded-lg p-1 space-y-1 w-14 flex flex-col justify-center h-[120px]">
                  {["AM", "PM"].map((ampmVal) => {
                    const active = ampmVal === selectedAmpm
                    return (
                      <button
                        key={ampmVal}
                        type="button"
                        onClick={() => {
                          setSelectedAmpm(ampmVal)
                          handleTimeChange(selectedHour, selectedMinute, ampmVal)
                        }}
                        className={cn(
                          "w-full h-8 text-xs font-semibold rounded-md flex items-center justify-center transition-all cursor-pointer",
                          active ? "bg-indigo-600 text-white font-bold" : "hover:bg-slate-100 text-slate-700"
                        )}
                      >
                        {ampmVal}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 rounded-lg cursor-pointer"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default TimePicker;

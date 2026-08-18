import * as React from "react"
import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"

/**
 * CheckboxDropdown Component
 * A custom select dropdown that allows selecting multiple options via checkboxes.
 * Refactored to match Shadcn styling and includes search capability.
 *
 * @param {string} id - HTML ID for the trigger button.
 * @param {Array} options - List of select options: [{ id, name }]
 * @param {Array} selectedIds - List of currently selected IDs: [id1, id2]
 * @param {Function} onChange - Callback triggered when selection changes: (newIds) => void
 * @param {string} placeholder - Default trigger text when no option is selected.
 */
export function CheckboxDropdown({
  id,
  options = [],
  selectedIds = [],
  onChange,
  placeholder = "Select options",
  autoFocus = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedNames = options
    .filter((opt) => selectedIds.includes(opt.id))
    .map((opt) => opt.name)
    .join(", ");

  const handleCheckboxChange = (optionId) => {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter((id) => id !== optionId));
    } else {
      onChange([...selectedIds, optionId]);
    }
  };

  const filteredOptions = options.filter((opt) =>
    String(opt.name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          variant="outline"
          autoFocus={autoFocus}
          className={cn(
            "w-full justify-between font-semibold text-left h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none",
            disabled && "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75 active:scale-100",
            selectedIds.length === 0 && "text-slate-400",
          )}
        >
          <span className="truncate">
            {selectedNames || placeholder}
          </span>
          <svg
            className="ml-2 h-4 w-4 shrink-0 opacity-55 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 bg-white" align="start">
        {options.length > 5 && (
          <div className="pb-2 mb-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>
        )}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {filteredOptions.length === 0 ? (
            <div className="py-2 px-3 text-sm text-slate-400 text-center">No results found.</div>
          ) : (
            filteredOptions.map((opt) => {
              const isChecked = selectedIds.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-all",
                    isChecked && "bg-indigo-50/50 text-indigo-900"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCheckboxChange(opt.id)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500/20 cursor-pointer"
                  />
                  <span className="truncate">{opt.name}</span>
                </label>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default CheckboxDropdown;

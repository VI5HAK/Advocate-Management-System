import * as React from "react"
import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

/**
 * Reusable SearchableSelect Component
 * Renders a searchable popover combobox.
 *
 * @param {Array} options - List of options: [{ value, label }]
 * @param {string|number} value - Currently selected value.
 * @param {Function} onChange - Callback triggered on selection change: (newValue) => void
 * @param {string} placeholder - Default trigger text when empty.
 * @param {string} searchPlaceholder - Placeholder inside the search input.
 * @param {string} emptyMessage - Message shown when no search results match.
 * @param {boolean} disabled - Whether the combobox is disabled.
 * @param {string} id - HTML id attribute for the button trigger.
 * @param {string} className - Additional CSS classes.
 */
export function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  id,
  className,
}) {
  const [open, setOpen] = useState(false)

  // Find currently selected option
  const selectedOption = options.find((opt) => String(opt.value) === String(value))

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
          className={cn(
            "w-full justify-between font-semibold text-left h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none",
            disabled && "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75 active:scale-100",
            !value && "text-slate-400",
            className
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {/* Dropdown Chevron Down Icon */}
          <svg
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
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
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={String(opt.label).toLowerCase()}
                    onSelect={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex items-center justify-between",
                      isSelected && "bg-indigo-50 text-indigo-900"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <svg
                        className="h-4 w-4 text-indigo-650 shrink-0 ml-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default SearchableSelect;

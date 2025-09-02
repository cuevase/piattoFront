"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded-sm border border-purple-300 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            checked
              ? "bg-purple-600 text-white border-purple-600"
              : "bg-white hover:bg-purple-50",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          onClick={() => !disabled && onCheckedChange?.(!checked)}
        >
          {checked && (
            <Check className="h-3 w-3 text-white mx-auto" />
          )}
        </div>
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox } 
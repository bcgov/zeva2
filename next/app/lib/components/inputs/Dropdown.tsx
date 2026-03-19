"use client";

import { FC, useState, useRef, useEffect } from "react";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface IDropdownProps {
  id?: string;
  label?: string;
  helperText?: string;
  placeholder?: string;
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  className?: string;
}

export const Dropdown: FC<IDropdownProps> = ({
  id,
  label,
  helperText,
  placeholder = "Select an Option",
  options,
  value,
  onChange,
  disabled = false,
  error = false,
  errorMessage,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Get the selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case "Escape":
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
    }
  };

  // Handle option selection
  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Handle option keyboard navigation
  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    optionValue: string,
    index: number,
  ) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        handleOptionClick(optionValue);
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        const nextButton = e.currentTarget
          .nextElementSibling as HTMLButtonElement;
        if (nextButton) {
          nextButton.focus();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        const prevButton = e.currentTarget
          .previousElementSibling as HTMLButtonElement;
        if (prevButton) {
          prevButton.focus();
        } else {
          triggerRef.current?.focus();
        }
        break;
    }
  };

  // Base trigger styles matching form-input-base
  const baseTriggerStyles =
    "w-full rounded-md border px-3 py-2.5 text-sm text-left flex items-center justify-between transition-all duration-200 m-0";

  // State-based trigger styles
  const getTriggerStyles = () => {
    if (disabled) {
      return "bg-disabledSurface border-dividerMedium text-disabledText cursor-not-allowed";
    }
    if (error) {
      return "bg-white border-error text-primaryText hover:bg-lightGrey hover:border-errorIcon focus:border-error focus:ring-2 focus:ring-error/20";
    }
    if (isOpen) {
      return "bg-white border-primaryBlue text-primaryText ring-2 ring-primaryBlue/20 hover:bg-lightGrey";
    }
    if (isFocused) {
      return "bg-white border-primaryBlue text-primaryText ring-2 ring-primaryBlue/20 hover:bg-lightGrey";
    }
    return "bg-white border-dividerMedium text-primaryText hover:bg-lightGrey hover:border-dividerDark focus:border-primaryBlue focus:ring-2 focus:ring-primaryBlue/20";
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="form-label block mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-xs text-secondaryText mb-1.5">{helperText}</p>
      )}

      {/* Dropdown Trigger */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        className={`${baseTriggerStyles} ${getTriggerStyles()}`}
      >
        <span
          className={`truncate ${!selectedOption ? "text-placeholder" : ""}`}
        >
          {displayValue}
        </span>
        {/* Chevron Icon */}
        <svg
          className={`w-4 h-4 ml-2 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          } ${disabled ? "text-disabledIcon" : error ? "text-errorIcon" : "text-primaryIcon"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-dividerMedium rounded-md shadow-level-3 max-h-60 overflow-y-auto"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleOptionClick(option.value)}
                onKeyDown={(e) => handleOptionKeyDown(e, option.value, index)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors duration-150 bg-white m-0 ${
                  isSelected
                    ? "text-primaryText font-medium"
                    : "text-primaryText"
                } hover:bg-lightGrey active:bg-disabledSurface focus:outline-none focus:bg-lightGrey`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Error Message */}
      {error && errorMessage && (
        <div className="flex items-start gap-1 mt-1.5">
          <svg
            className="w-4 h-4 text-errorIcon flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs text-error">{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

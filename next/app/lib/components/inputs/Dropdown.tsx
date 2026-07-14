"use client";

import { FC, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

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

type MenuPosition = { top: number; left: number; width: number };

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
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const updateMenuPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  const openMenu = useCallback(() => {
    updateMenuPosition();
    setIsOpen(true);
  }, [updateMenuPosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleScrollOrResize = () => {
      if (isOpen) updateMenuPosition();
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isOpen, updateMenuPosition]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (isOpen) {
          setIsOpen(false);
        } else {
          openMenu();
        }
        break;
      case "Escape":
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) openMenu();
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) openMenu();
        break;
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    optionValue: string,
    _index: number,
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
      case "ArrowDown": {
        e.preventDefault();
        const next = e.currentTarget.nextElementSibling as HTMLButtonElement;
        if (next) next.focus();
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = e.currentTarget
          .previousElementSibling as HTMLButtonElement;
        if (prev) {
          prev.focus();
        } else {
          triggerRef.current?.focus();
        }
        break;
      }
    }
  };

  const baseTriggerStyles =
    "w-full rounded-md border px-3 py-2.5 text-sm text-left flex items-center justify-between transition-all duration-200 m-0";

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

  const menu =
    isOpen && !disabled
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "absolute",
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 9999,
            }}
            className="mt-1 bg-white border border-dividerMedium rounded-md shadow-level-3 max-h-60 overflow-y-auto"
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
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="form-label block mb-1.5">
          {label}
        </label>
      )}
      {helperText && !error && (
        <p className="text-xs text-secondaryText mb-1.5">{helperText}</p>
      )}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => !disabled && (isOpen ? setIsOpen(false) : openMenu())}
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
        <svg
          className={`w-4 h-4 ml-2 transition-transform duration-200 shrink-0 ${
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

      {menu}

      {error && errorMessage && (
        <div className="flex items-start gap-1 mt-1.5">
          <svg
            className="w-4 h-4 text-errorIcon shrink-0 mt-0.5"
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

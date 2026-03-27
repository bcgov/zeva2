"use client";

import { FC, TextareaHTMLAttributes, useRef, useEffect, useState } from "react";

export interface ITextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  id?: string;
  label?: string;
  helperText?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  destructive?: boolean;
  showButton?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
}

export const Textarea: FC<ITextareaProps> = ({
  id,
  label,
  helperText,
  placeholder = "Enter a description...",
  value = "",
  onChange,
  disabled = false,
  error = false,
  errorMessage,
  destructive = false,
  showButton = false,
  buttonText = "Small button",
  onButtonClick,
  className = "",
  minHeight = 80,
  maxHeight = 200,
  rows = 3,
  ...rest
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;

    if (scrollHeight <= maxHeight) {
      textarea.style.height = `${Math.max(scrollHeight, minHeight)}px`;
      textarea.style.overflowY = "hidden";
    } else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = "auto";
    }
  }, [value, minHeight, maxHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setIsTyping(newValue.length > 0);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const getStateStyles = () => {
    if (disabled) {
      return "bg-disabledSurface border-dividerMedium text-disabledText cursor-not-allowed";
    }
    if (error || destructive) {
      if (isFocused) {
        return "bg-white border-error text-primaryText ring-2 ring-error/20";
      }
      return "bg-white border-error text-primaryText hover:bg-lightGrey hover:border-errorIcon";
    }
    if (isFocused) {
      return "bg-white border-primaryBlue text-primaryText ring-2 ring-primaryBlue/20";
    }
    if (isTyping) {
      return "bg-white border-primaryBlue text-primaryText hover:bg-lightGrey";
    }
    return "bg-white border-dividerMedium text-primaryText hover:bg-lightGrey hover:border-dividerDark";
  };

  return (
    <div className={`relative ${className}`} style={{ minWidth: "280px", maxWidth: "700px" }}>
      {label && (
        <label htmlFor={id} className="form-label block mb-1.5">
          {label}
        </label>
      )}

      {helperText && !error && !destructive && (
        <p className="text-xs text-secondaryText mb-1.5">{helperText}</p>
      )}

      <div className={`relative rounded-md border transition-all duration-200 ${getStateStyles()}`}>
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`w-full px-3 py-2.5 text-sm text-primaryText placeholder:text-placeholder bg-transparent border-none outline-none resize-none rounded-md ${showButton ? "pb-12" : ""}`}
          aria-invalid={error || destructive}
          aria-describedby={
            error || destructive
              ? `${id}-error`
              : helperText
                ? `${id}-helper`
                : undefined
          }
          {...rest}
        />

        {showButton && (
          <button
            type="button"
            onClick={onButtonClick}
            disabled={disabled}
            className={`absolute bottom-2 right-2 h-8 px-3 text-sm rounded transition-all duration-200 ${
              disabled
                ? "bg-disabledBG text-disabledText cursor-not-allowed"
                : "bg-white border border-dividerMedium text-primaryText hover:bg-lightGrey hover:border-dividerDark active:border-primaryBlue"
            }`}
          >
            {buttonText}
          </button>
        )}
      </div>

      {(error || destructive) && errorMessage && (
        <p id={`${id}-error`} className="text-xs text-error mt-1.5">
          {errorMessage}
        </p>
      )}

      {helperText && !error && !destructive && (
        <p id={`${id}-helper`} className="text-xs text-secondaryText mt-1.5 sr-only">
          {helperText}
        </p>
      )}
    </div>
  );
};

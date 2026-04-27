"use client";

import { FC, InputHTMLAttributes, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";

export interface ITextInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  id?: string;
  label?: string;
  hintText?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  destructive?: boolean;
  leadingIcon?: boolean;
  helpIcon?: boolean;
  className?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
}

export const TextInput: FC<ITextInputProps> = ({
  id,
  label,
  hintText,
  placeholder = "Example text",
  value = "",
  onChange,
  disabled = false,
  error = false,
  errorMessage,
  destructive = false,
  leadingIcon = false,
  helpIcon = false,
  className = "",
  type = "text",
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const toggleHint = () => {
    setShowHint(!showHint);
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

  const getIconColor = () => {
    if (disabled) {
      return "text-disabledText";
    }
    if (error || destructive) {
      return "text-error";
    }
    return "text-secondaryText";
  };

  return (
    <div
      className={`relative ${className}`}
      style={{ minWidth: "280px", maxWidth: "700px" }}
    >
      {label && (
        <label
          htmlFor={id}
          className="form-label block mb-1.5 text-sm text-primaryText"
        >
          {label}
        </label>
      )}

      <div
        className={`relative rounded-md border transition-all duration-200 ${getStateStyles()}`}
      >
        {leadingIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className={`h-4 w-4 ${getIconColor()}`}
            />
          </div>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full py-2.5 text-sm text-primaryText placeholder:text-placeholder bg-transparent border-none outline-none rounded-md ${
            leadingIcon ? "pl-10 pr-3" : "px-3"
          } ${helpIcon ? "pr-10" : ""}`}
          aria-invalid={error || destructive}
          aria-describedby={
            error || destructive
              ? `${id}-error`
              : hintText
                ? `${id}-hint`
                : undefined
          }
          {...rest}
        />

        {helpIcon && (
          <button
            type="button"
            onClick={toggleHint}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer bg-transparent border-none p-0 outline-none flex items-center justify-center leading-none"
            aria-label="Toggle hint"
            style={{ marginTop: "-1px" }}
          >
            <FontAwesomeIcon
              icon={faCircleQuestion}
              className={`h-4 w-4 ${getIconColor()}`}
            />
          </button>
        )}
      </div>

      {(error || destructive) && errorMessage && (
        <p id={`${id}-error`} className="text-xs text-error mt-1.5">
          {errorMessage}
        </p>
      )}

      {hintText && !error && !destructive && showHint && (
        <p id={`${id}-hint`} className="text-xs text-secondaryText mt-1.5">
          {hintText}
        </p>
      )}
    </div>
  );
};

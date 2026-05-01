"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ColiseuSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface ColiseuSelectProps {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: ColiseuSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ColiseuSelect({
  name,
  value,
  onChange,
  options,
  placeholder = "Selecione uma opção",
  required = false,
  disabled = false,
  className,
}: ColiseuSelectProps) {
  const selectId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const firstEnabledIndex = useMemo(
    () => options.findIndex((option) => !option.disabled),
    [options],
  );

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value && !option.disabled),
    [options, value],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
    window.setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  }

  function openMenu() {
    const targetIndex =
      selectedIndex >= 0 ? selectedIndex : firstEnabledIndex >= 0 ? firstEnabledIndex : -1;

    setHighlightedIndex(targetIndex);
    setIsOpen(true);

    if (targetIndex >= 0) {
      window.setTimeout(() => {
        optionRefs.current[targetIndex]?.focus();
      }, 0);
    }
  }

  function selectValue(nextValue: string) {
    onChange(nextValue);
    setIsOpen(false);
    window.setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  }

  function findNextEnabledIndex(startIndex: number, direction: 1 | -1) {
    if (options.length === 0) {
      return -1;
    }

    let currentIndex = startIndex;

    for (let step = 0; step < options.length; step += 1) {
      currentIndex = (currentIndex + direction + options.length) % options.length;

      if (!options[currentIndex]?.disabled) {
        return currentIndex;
      }
    }

    return -1;
  }

  function moveHighlight(direction: 1 | -1) {
    const baseIndex = highlightedIndex >= 0 ? highlightedIndex : selectedIndex;
    const nextIndex = findNextEnabledIndex(baseIndex >= 0 ? baseIndex : -1, direction);

    if (nextIndex < 0) {
      return;
    }

    setHighlightedIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Enter":
      case " ":
        event.preventDefault();
        openMenu();
        break;
      default:
        break;
    }
  }

  function handleOptionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveHighlight(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveHighlight(-1);
        break;
      case "Home":
        event.preventDefault();
        if (firstEnabledIndex >= 0) {
          setHighlightedIndex(firstEnabledIndex);
          optionRefs.current[firstEnabledIndex]?.focus();
        }
        break;
      case "End": {
        event.preventDefault();
        const lastEnabledIndex = [...options]
          .map((option, optionIndex) => ({ option, optionIndex }))
          .reverse()
          .find((entry) => !entry.option.disabled)?.optionIndex;

        if (lastEnabledIndex !== undefined) {
          setHighlightedIndex(lastEnabledIndex);
          optionRefs.current[lastEnabledIndex]?.focus();
        }
        break;
      }
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "Tab":
        setIsOpen(false);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!options[index]?.disabled) {
          selectValue(options[index]!.value);
        }
        break;
      default:
        break;
    }
  }

  return (
    <div className={cn("relative", className)}>
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${selectId}-listbox`}
        className={cn(
          "coliseu-select-trigger",
          isOpen && "border-[rgba(245,197,66,0.65)] bg-[rgba(42,25,13,0.92)] shadow-[0_0_0_1px_rgba(245,197,66,0.1),0_16px_40px_rgba(0,0,0,0.28)]",
          disabled && "cursor-not-allowed opacity-60",
        )}
        onClick={() => {
          if (!disabled) {
            if (isOpen) {
              setIsOpen(false);
              return;
            }

            openMenu();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="min-w-0 text-left">
          <span
            className={cn(
              "block truncate text-sm font-medium",
              selectedOption ? "text-[var(--white)]" : "text-[rgba(214,214,214,0.7)]",
            )}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          {selectedOption?.description ? (
            <span className="mt-1 block truncate text-xs text-[var(--muted)]">
              {selectedOption.description}
            </span>
          ) : null}
        </span>

        <ChevronDown
          className={cn(
            "ml-3 h-4 w-4 shrink-0 text-[var(--gold)] transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          id={`${selectId}-listbox`}
          role="listbox"
          className="coliseu-select-panel"
        >
          <div className="max-h-72 overflow-y-auto p-2">
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={option.value || `option-${index}`}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  className={cn(
                    "coliseu-select-option",
                    isSelected && "border-[rgba(245,197,66,0.4)] bg-[rgba(245,197,66,0.12)] text-[var(--white)]",
                    isHighlighted && "border-[rgba(245,197,66,0.32)] bg-[rgba(245,197,66,0.08)]",
                    option.disabled && "cursor-not-allowed opacity-50",
                  )}
                  onClick={() => {
                    if (!option.disabled) {
                      selectValue(option.value);
                    }
                  }}
                  onFocus={() => setHighlightedIndex(index)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
                >
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-sm font-medium">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                        {option.description}
                      </span>
                    ) : null}
                  </span>

                  {isSelected ? (
                    <Check className="ml-3 h-4 w-4 shrink-0 text-[var(--gold)]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

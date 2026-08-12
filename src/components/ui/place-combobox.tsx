"use client";

import * as React from "react";

import { searchPlaces, type Place } from "@/lib/geo";
import { cn } from "@/lib/utils";

/**
 * Free-text town field with suggestions.
 *
 * The typed value is what counts — you can name a village that isn't in the
 * gazetteer and it is stored verbatim. Suggestions are an aid, not a
 * constraint, and they match on a diacritic-stripped comparison so "zilina"
 * finds "Žilina" without anyone reaching for the accent keys.
 *
 * A native <datalist> would have been less code, but it can't be styled, is
 * inconsistent across browsers, and on several of them refuses to match at all
 * once the accents are missing — which is the one thing this needs to do.
 */
export function PlaceCombobox({
  value,
  onChange,
  id = "home-location",
  placeholder = "Start typing your town or village",
  autoFocus,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const suggestions = React.useMemo<Place[]>(
    () => (value.trim().length >= 1 ? searchPlaces(value, 6) : []),
    [value],
  );

  // An exact hit needs no dropdown — it would just cover the next field.
  const settled =
    suggestions.length === 1 &&
    suggestions[0]!.name.toLowerCase() === value.trim().toLowerCase();

  const showList = open && suggestions.length > 0 && !settled;

  // Close on outside click; the field keeps whatever was typed.
  React.useEffect(() => {
    if (!showList) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showList]);

  const commit = (place: Place) => {
    onChange(place.name);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) {
      if (event.key === "ArrowDown" && suggestions.length > 0) {
        setOpen(true);
        event.preventDefault();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      // Only swallow Enter when a suggestion is highlighted, so the form can
      // still be submitted from the keyboard the rest of the time.
      event.preventDefault();
      commit(suggestions[activeIndex]!);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const listId = `${id}-suggestions`;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input
        id={id}
        type="text"
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          // The list is rebuilt for the new value, so the old highlight index
          // would point at an unrelated row.
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        className="h-14 w-full border border-ink/20 bg-paper px-4 text-lg text-ink transition-colors placeholder:text-stone/60 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 sm:text-xl"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching places"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto border border-ink/20 bg-paper shadow-lg"
        >
          {suggestions.map((place, index) => (
            <li key={place.name} role="none">
              <button
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                // pointerdown fires before the input's blur, so the click isn't
                // lost to the outside-click handler closing the list first.
                onPointerDown={(event) => {
                  event.preventDefault();
                  commit(place);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-baseline justify-between gap-4 px-4 py-3 text-left transition-colors",
                  index === activeIndex ? "bg-moss text-paper" : "hover:bg-ink/5",
                )}
              >
                <span className="font-medium">{place.name}</span>
                <span
                  className={cn(
                    "text-xs",
                    index === activeIndex ? "text-paper/70" : "text-stone",
                  )}
                >
                  {place.region}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

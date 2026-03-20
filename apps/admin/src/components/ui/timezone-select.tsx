"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { POPULAR_TIMEZONES, formatTimezoneLabel } from "@/lib/utils/timezone";

interface TimezoneSelectProps {
  value?: string;
  onChange?: (timezone: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimezoneSelect({ value, onChange, className, disabled }: TimezoneSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // 選択されたタイムゾーンのラベル
  const selectedLabel = value ? formatTimezoneLabel(value) : "タイムゾーンを選択";

  // 検索でフィルタリングされたタイムゾーンリスト
  const filteredTimezones = React.useMemo(() => {
    if (!searchValue) {
      return POPULAR_TIMEZONES;
    }

    const lowerSearch = searchValue.toLowerCase();
    return POPULAR_TIMEZONES.filter((tz) => tz.toLowerCase().includes(lowerSearch));
  }, [searchValue]);

  const handleSelect = (currentValue: string) => {
    onChange?.(currentValue);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-100 p-0">
        <Command>
          <CommandInput
            placeholder="タイムゾーンを検索..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>タイムゾーンが見つかりません</CommandEmpty>
            <CommandGroup heading="代表的なタイムゾーン">
              {filteredTimezones.map((timezone) => (
                <CommandItem
                  key={timezone}
                  value={timezone}
                  onSelect={() => handleSelect(timezone)}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === timezone ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{formatTimezoneLabel(timezone)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XIcon,
  ClockIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// NOTE: 重要な制限事項
// - Date object is created in browser's local timezone
// - timezone prop is for DISPLAY ONLY
// - Actual UTC conversion happens on backend (convertToUTC)
// - Do NOT use toISOString() on the Date from this component without backend conversion
interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  timezone?: string; // For display only
}

/**
 * 時刻スピナーコンポーネント（時/分の上下ボタン付き入力）
 */
function TimeSpinner({
  value,
  onChange,
  min,
  max,
  disabled,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
  label: string;
}) {
  const increment = () => {
    onChange(value >= max ? min : value + 1);
  };
  const decrement = () => {
    onChange(value <= min ? max : value - 1);
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-muted-foreground font-medium">
        {label}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={disabled}
        className="flex items-center justify-center h-6 w-10 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        aria-label={`${label}を増やす`}
      >
        <ChevronUpIcon className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center justify-center h-9 w-10 rounded-md border border-input bg-background text-sm font-medium tabular-nums">
        {String(value).padStart(2, "0")}
      </div>
      <button
        type="button"
        onClick={decrement}
        disabled={disabled}
        className="flex items-center justify-center h-6 w-10 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        aria-label={`${label}を減らす`}
      >
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "日時を選択",
  className,
  disabled,
  timezone = "Asia/Tokyo",
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value
  );
  const [hours, setHours] = React.useState<number>(
    value ? value.getHours() : 0
  );
  const [minutes, setMinutes] = React.useState<number>(
    value ? value.getMinutes() : 0
  );
  const [timezoneAbbr, setTimezoneAbbr] = React.useState<string>("");

  // タイムゾーン略称をクライアントサイドで取得（SSR/CSR の差分を避ける）
  React.useEffect(() => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "short",
      });
      const parts = formatter.formatToParts(new Date());
      const tzPart = parts.find((part) => part.type === "timeZoneName");
      setTimezoneAbbr(tzPart?.value || timezone.split("/").pop() || timezone);
    } catch {
      setTimezoneAbbr(timezone);
    }
  }, [timezone]);

  // 日付と時刻を結合してDateオブジェクトを作成
  const applyDateTime = (
    date: Date | undefined,
    h: number,
    m: number
  ) => {
    if (!date) {
      setSelectedDate(undefined);
      onChange?.(undefined);
      return;
    }
    const newDate = new Date(date);
    newDate.setHours(h, m, 0, 0);
    setSelectedDate(newDate);
    onChange?.(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined);
      onChange?.(undefined);
      return;
    }
    applyDateTime(date, hours, minutes);
  };

  const handleHoursChange = (h: number) => {
    setHours(h);
    if (selectedDate) {
      applyDateTime(selectedDate, h, minutes);
    }
  };

  const handleMinutesChange = (m: number) => {
    setMinutes(m);
    if (selectedDate) {
      applyDateTime(selectedDate, hours, m);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(undefined);
    setHours(0);
    setMinutes(0);
    onChange?.(undefined);
  };

  // 外部から value が変更された場合の同期
  React.useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setHours(value.getHours());
      setMinutes(value.getMinutes());
    }
  }, [value]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {selectedDate ? (
              <span className="flex-1">
                {format(selectedDate, "yyyy/MM/dd HH:mm")}
              </span>
            ) : (
              <span className="flex-1">{placeholder}</span>
            )}
            {selectedDate && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-accent transition-colors"
                aria-label="日時をクリア"
              >
                <XIcon className="h-3.5 w-3.5" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              disabled={disabled}
            />
          </div>
          <div className="border-t px-3 py-3">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1">
                <TimeSpinner
                  value={hours}
                  onChange={handleHoursChange}
                  min={0}
                  max={23}
                  disabled={disabled}
                  label="時"
                />
                <span className="text-lg font-medium text-muted-foreground mt-5">
                  :
                </span>
                <TimeSpinner
                  value={minutes}
                  onChange={handleMinutesChange}
                  min={0}
                  max={59}
                  disabled={disabled}
                  label="分"
                />
              </div>
              <span className="text-xs text-muted-foreground ml-auto">
                {timezoneAbbr}
              </span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

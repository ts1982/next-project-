"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

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
  const [timeValue, setTimeValue] = React.useState<string>(
    value ? format(value, "HH:mm") : "00:00"
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
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined);
      onChange?.(undefined);
      return;
    }

    // 時刻部分を取得
    const [hours, minutes] = timeValue.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);

    setSelectedDate(newDate);
    onChange?.(newDate);
  };

  // 時刻変更ハンドラー
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);

    if (selectedDate) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);

      setSelectedDate(newDate);
      onChange?.(newDate);
    }
  };

  // 外部から value が変更された場合の同期
  React.useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setTimeValue(format(value, "HH:mm"));
    }
  }, [value]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              <span>
                {format(selectedDate, "yyyy/MM/dd HH:mm")}
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              disabled={disabled}
            />
            <div className="border-t pt-3">
              <label className="text-sm font-medium mb-2 block">時刻</label>
              <Input
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                disabled={disabled}
                className="w-full"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">
        タイムゾーン: {timezone}
      </p>
    </div>
  );
}

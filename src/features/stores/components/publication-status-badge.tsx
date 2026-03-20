"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { getPublicationStatus } from "@/lib/utils/publication";
import { getDefaultTimezone } from "@/lib/utils/timezone";

interface PublicationStatusBadgeProps {
  publishedAt: string | null;
  unpublishedAt: string | null;
  timezone?: string;
  className?: string;
}

export function PublicationStatusBadge({
  publishedAt,
  unpublishedAt,
  timezone,
  className,
}: PublicationStatusBadgeProps) {
  const tz = timezone || getDefaultTimezone();
  const status = getPublicationStatus(publishedAt, unpublishedAt, tz);

  // ステータスに応じてスタイルを設定（className のみで管理）
  const getBadgeClassName = () => {
    let baseClass = "";

    if (status === "公開中") {
      baseClass = "bg-green-500 hover:bg-green-600 text-white border-green-500";
    } else if (status.startsWith("予約公開")) {
      baseClass = "bg-blue-500 hover:bg-blue-600 text-white border-blue-500";
    } else if (status === "公開終了") {
      baseClass = "bg-gray-500 hover:bg-gray-600 text-white border-gray-500";
    } else {
      baseClass = "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500";
    }

    return `${baseClass} ${className || ""}`;
  };

  return <Badge className={getBadgeClassName()}>{status}</Badge>;
}

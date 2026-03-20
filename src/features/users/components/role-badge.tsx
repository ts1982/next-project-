"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, User } from "lucide-react";

interface RoleBadgeProps {
  roleName: string;
}

export function RoleBadge({ roleName }: RoleBadgeProps) {
  const isAdmin = roleName.toUpperCase() === "ADMIN";

  return (
    <Badge variant={isAdmin ? "default" : "secondary"} className="gap-1">
      {isAdmin ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
      {roleName}
    </Badge>
  );
}

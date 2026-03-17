"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  className?: string;
  iconColor?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  className,
  iconColor = "text-primary"
}: StatCardProps) {
  return (
    <Card className={cn("rounded-xl border-none shadow-sm hover:shadow-md transition-all bg-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg bg-muted", iconColor)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-1 mt-1 text-[10px]">
            {trend && (
              <span className={cn("font-bold", trend.isUp ? "text-green-600" : "text-destructive")}>
                {trend.value}
              </span>
            )}
            {description && <span className="text-muted-foreground">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

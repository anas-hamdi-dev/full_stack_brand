import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = "neutral",
  className 
}: StatsCardProps) {
  return (
    <div className={cn("glass rounded-2xl p-4 sm:p-6 w-full", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 sm:mt-2">{value}</p>
          {change && (
            <p className={cn(
              "text-xs sm:text-sm mt-1 sm:mt-2",
              changeType === "positive" && "text-green-500",
              changeType === "negative" && "text-red-500",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

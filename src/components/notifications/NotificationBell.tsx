import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnreadCount } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  onClick: () => void;
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const count = useUnreadCount();
  const displayCount = count > 99 ? "99+" : count;

  return (
    <Button
      size="icon"
      variant="ghost"
      className="relative shrink-0"
      onClick={onClick}
      aria-label={count > 0 ? `${count} unread notifications` : "Notifications"}
    >
      <Bell className={cn("h-4 w-4", count > 0 && "animate-[shake_0.5s_ease-in-out]")} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-mono text-[10px] font-bold text-destructive-foreground">
          {displayCount}
        </span>
      )}
    </Button>
  );
}

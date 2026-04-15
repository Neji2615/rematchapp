import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: unreadCount } = useQuery({
    queryKey: ["unread-count", profiles?.id],
    enabled: !!profiles?.id,
    refetchInterval: 30000,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      return count ?? 0;
    },
  });

  return (
    <button onClick={() => navigate("/notifications")} className="relative p-2">
      <Bell size={22} className="text-muted-foreground" />
      {(unreadCount ?? 0) > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full text-[9px] font-bold text-primary-foreground flex items-center justify-center">
          {unreadCount! > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;

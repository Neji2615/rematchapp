import { ArrowLeft, Bell, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", profiles?.id],
    enabled: !!profiles?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unread-count"] });
  };

  const markAllRead = async () => {
    if (!user) return;
    const unread = notifications?.filter((n) => !n.is_read) ?? [];
    for (const n of unread) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
    }
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unread-count"] });
  };

  const typeIcon = (type: string) => {
    if (type === "promotion") return "🎉";
    if (type === "demotion") return "📉";
    return "🔔";
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/home")} className="text-muted-foreground">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold">Notificações</h1>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-primary">
              <Check size={14} className="mr-1" />
              Marcar tudo
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {notifications && notifications.length > 0 ? (
            notifications.map((n: any) => (
              <div
                key={n.id}
                className={`glass-card p-4 flex items-start gap-3 transition-all ${!n.is_read ? "border-l-2 border-l-primary" : "opacity-70"}`}
                onClick={() => !n.is_read && markAsRead(n.id)}
              >
                <span className="text-xl mt-0.5">{typeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell size={40} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">Sem notificações</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Notifications;

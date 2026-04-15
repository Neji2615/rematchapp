import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Minus, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AvatarDisplay from "@/components/AvatarDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <ChevronUp size={14} className="text-success" />;
  if (trend === "down") return <ChevronDown size={14} className="text-destructive" />;
  return <Minus size={14} className="text-muted-foreground" />;
};

const Rankings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string>("");

  const { data: divisions } = useQuery({
    queryKey: ["all-divisions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("divisions")
        .select("*")
        .order("level", { ascending: true });
      return data || [];
    },
  });

  const { data: allProfiles } = useQuery({
    queryKey: ["all-profiles-ranked"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, division_id, total_points, avatar_url")
        .not("username", "is", null)
        .order("total_points", { ascending: false });
      return data || [];
    },
  });

  const userDivision = divisions?.find((d) =>
    allProfiles?.some((p) => p.user_id === profiles?.id && p.division_id === d.id)
  );

  const currentExpanded = expanded || userDivision?.name || divisions?.[0]?.name || "";

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => navigate("/home")} className="text-muted-foreground mb-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Ranking Geral</h1>
        <p className="text-muted-foreground text-sm mt-1">Classificação por divisões</p>
      </div>

      <div className="px-6 space-y-3">
        {divisions?.map((div) => {
          const players = allProfiles
            ?.filter((p) => p.division_id === div.id)
            .map((p, idx) => ({
              pos: idx + 1,
              name: p.user_id === profiles?.id ? "Tu" : (p.full_name?.split(" ")[0] || p.username || "Jogador"),
              points: p.total_points,
              isCurrentUser: p.user_id === profiles?.id,
              trend: "same" as string,
              avatarUrl: p.avatar_url,
            })) || [];

          return (
            <div key={div.id} className="glass-card overflow-hidden">
              <button
                onClick={() => setExpanded(currentExpanded === div.name ? "" : div.name)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <Crown size={16} className="text-primary" />
                  <span className="font-bold text-sm">{div.name}</span>
                  <span className="text-xs text-muted-foreground">({players.length})</span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-muted-foreground transition-transform ${currentExpanded === div.name ? "rotate-180" : ""}`}
                />
              </button>
              {currentExpanded === div.name && (
                <div className="border-t border-border/50 divide-y divide-border/50 animate-slide-up">
                  {players.length > 0 ? (
                    players.map((player, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === players.length - 1 && players.length > 1;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center px-4 py-3 ${
                            player.isCurrentUser ? "bg-primary/5" : ""
                          } ${isFirst ? "border-l-2 border-l-success" : ""} ${
                            isLast ? "border-l-2 border-l-destructive" : ""
                          }`}
                        >
                          <span className={`w-7 text-sm font-bold ${player.pos <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                            {player.pos}
                          </span>
                          <AvatarDisplay
                            avatarUrl={player.avatarUrl}
                            name={player.name}
                            size="sm"
                            className="mr-3"
                          />
                          <span className={`flex-1 text-sm font-medium ${player.isCurrentUser ? "text-primary" : ""}`}>
                            {player.name}
                          </span>
                          <TrendIcon trend={player.trend} />
                          <span className="text-sm font-bold ml-2 w-14 text-right">{player.points} pts</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-4 text-center text-muted-foreground text-sm">Sem jogadores</div>
                  )}
                  {players.length > 1 && (
                    <div className="px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" /> Sobe</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Desce</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
};

export default Rankings;

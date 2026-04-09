import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Swords, TrendingUp, Medal } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const { data: rankingData } = useQuery({
    queryKey: ["weekly-ranking", profile?.division_id],
    enabled: !!profile?.division_id,
    queryFn: async () => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1);
      const weekStartStr = weekStart.toISOString().split("T")[0];

      const { data } = await supabase
        .from("rankings")
        .select("points, position, profiles(full_name, username, user_id)")
        .eq("division_id", profile!.division_id!)
        .eq("week_start", weekStartStr)
        .order("points", { ascending: false })
        .limit(5);

      return data ?? [];
    },
  });

  const { data: divisionData } = useQuery({
    queryKey: ["division", profile?.division_id],
    enabled: !!profile?.division_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("divisions")
        .select("name, level")
        .eq("id", profile!.division_id!)
        .maybeSingle();
      return data;
    },
  });

  const displayName = profile?.full_name?.split(" ")[0] || profile?.username || "Jogador";

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="px-6 pt-12 pb-6">
        <p className="text-muted-foreground text-sm">Ola,</p>
        <h1 className="text-2xl font-bold">{displayName}</h1>
      </div>

      <div className="px-6 mb-6">
        <div className="glass-card p-5 glow-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Divisao atual</p>
              <p className="text-3xl font-black text-gradient mt-1">
                {divisionData ? divisionData.name : "Bronze"}
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Medal size={28} className="text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingUp size={16} className="text-success" />
            <span className="text-success font-medium">{profile?.total_points ?? 0} pontos totais</span>
          </div>
        </div>
      </div>

      <div className="px-6 mb-6 flex gap-3">
        <Button
          onClick={() => navigate("/insert-result")}
          className="flex-1 h-14 font-bold text-sm glow-primary gap-2"
        >
          <Plus size={20} />
          Inserir Resultado
        </Button>
        <Button
          onClick={() => navigate("/rematches")}
          variant="outline"
          className="flex-1 h-14 font-bold text-sm gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
          <Swords size={20} />
          Desforras
        </Button>
      </div>

      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Ranking Semanal</h2>
          <button onClick={() => navigate("/rankings")} className="text-primary text-xs font-semibold">
            Ver tudo
          </button>
        </div>
        <div className="glass-card divide-y divide-border/50">
          {rankingData && rankingData.length > 0 ? (
            rankingData.map((entry: any, idx: number) => {
              const isCurrentUser = entry.profiles?.user_id === user?.id;
              const name = isCurrentUser
                ? "Tu"
                : entry.profiles?.full_name?.split(" ")[0] || entry.profiles?.username || "Jogador";
              return (
                <div key={idx} className={`flex items-center px-4 py-3 ${isCurrentUser ? "bg-primary/5" : ""}`}>
                  <span className={`w-7 text-sm font-bold ${idx < 3 ? "text-primary" : "text-muted-foreground"}`}>
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold mr-3">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`flex-1 text-sm font-medium ${isCurrentUser ? "text-primary" : ""}`}>
                    {name}
                  </span>
                  <span className="text-sm font-bold">{entry.points} pts</span>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              Sem dados de ranking para esta semana
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;

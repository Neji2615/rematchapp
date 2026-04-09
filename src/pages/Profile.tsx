import { ArrowLeft, TrendingUp, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();

  const { data: matchStats } = useQuery({
    queryKey: ["match-stats", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: matches } = await supabase
        .from("matches")
        .select("winner_team, player1_id, player2_id, player3_id, player4_id, points_awarded, created_at, team1_score, team2_score")
        .or(`player1_id.eq.${user!.id},player2_id.eq.${user!.id},player3_id.eq.${user!.id},player4_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!matches) return { wins: 0, losses: 0, recentMatches: [] };

      let wins = 0;
      let losses = 0;
      const recentMatches = matches.map((m) => {
        const isTeam1 = m.player1_id === user!.id || m.player2_id === user!.id;
        const won = (isTeam1 && m.winner_team === 1) || (!isTeam1 && m.winner_team === 2);
        if (won) wins++;
        else losses++;

        const score = `${m.team1_score}-${m.team2_score}`;
        const date = new Date(m.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
        return { won, score, points: won ? m.points_awarded : 0, date };
      });

      return { wins, losses, recentMatches };
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

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.full_name || profile?.username || "Jogador";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => navigate("/home")} className="text-muted-foreground mb-4">
          <ArrowLeft size={24} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-black text-primary">
            {initial}
          </div>
          <div>
            <h1 className="text-xl font-bold">{displayName}</h1>
            <p className="text-muted-foreground text-sm">
              {profile?.username ? `@${profile.username}` : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Divisao", value: divisionData?.name || "Bronze" },
            { label: "Vitorias", value: matchStats?.wins ?? 0 },
            { label: "Derrotas", value: matchStats?.losses ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-3 text-center">
              <p className="text-lg font-black text-primary">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="glass-card p-4 mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Dados</p>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-muted-foreground">Genero</span>
            <span className="font-medium">{profile?.gender || "-"}</span>
            <span className="text-muted-foreground">Mao</span>
            <span className="font-medium">{profile?.preferred_hand || "-"}</span>
            <span className="text-muted-foreground">Lado</span>
            <span className="font-medium">{profile?.preferred_side || "-"}</span>
            <span className="text-muted-foreground">Pontos totais</span>
            <span className="font-medium">{profile?.total_points ?? 0}</span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-bold text-base mb-3">Ultimos Jogos</h2>
          <div className="glass-card divide-y divide-border/50">
            {matchStats?.recentMatches && matchStats.recentMatches.length > 0 ? (
              matchStats.recentMatches.map((game, i) => (
                <div key={i} className="flex items-center px-4 py-3">
                  <span className={`w-2 h-2 rounded-full mr-3 ${game.won ? "bg-success" : "bg-destructive"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{game.won ? "Vitoria" : "Derrota"}</p>
                    <p className="text-xs text-muted-foreground">{game.score} · {game.date}</p>
                  </div>
                  <span className={`text-xs font-bold ${game.won ? "text-success" : "text-muted-foreground"}`}>
                    +{game.points}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                Sem jogos registados
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="glass-card p-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp size={16} className="text-primary" />
              <span className="text-muted-foreground">Email: </span>
              <span className="font-medium truncate">{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <Button variant="outline" className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut size={18} />
            Terminar sessao
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Swords, CheckCircle2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Tab = "pending" | "active" | "history";

const Rematches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");

  // Matches where user lost and no rematch requested yet
  const { data: lostMatches } = useQuery({
    queryKey: ["lost-matches", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: matches } = await supabase
        .from("matches")
        .select("*, profiles!matches_player1_id_fkey(full_name, username), p2:profiles!matches_player2_id_fkey(full_name, username), p3:profiles!matches_player3_id_fkey(full_name, username), p4:profiles!matches_player4_id_fkey(full_name, username)")
        .or(`player1_id.eq.${user!.id},player2_id.eq.${user!.id},player3_id.eq.${user!.id},player4_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });

      if (!matches) return [];

      // Get existing rematches for these matches
      const matchIds = matches.map((m) => m.id);
      const { data: existingRematches } = await supabase
        .from("rematches")
        .select("original_match_id")
        .in("original_match_id", matchIds);

      const rematchedMatchIds = new Set(existingRematches?.map((r) => r.original_match_id) || []);

      return matches
        .filter((m) => {
          const isTeam1 = m.player1_id === user!.id || m.player2_id === user!.id;
          const lost = (isTeam1 && m.winner_team === 2) || (!isTeam1 && m.winner_team === 1);
          return lost && !rematchedMatchIds.has(m.id);
        })
        .map((m) => {
          const isTeam1 = m.player1_id === user!.id || m.player2_id === user!.id;
          const partnerId = isTeam1
            ? (m.player1_id === user!.id ? m.player2_id : m.player1_id)
            : (m.player3_id === user!.id ? m.player4_id : m.player3_id);

          const getName = (p: any) => p?.full_name?.split(" ")[0] || p?.username || "?";
          const p1Name = getName(m.profiles);
          const p2Name = getName(m.p2);
          const p3Name = getName(m.p3);
          const p4Name = getName(m.p4);

          return {
            id: m.id,
            teams: isTeam1
              ? `${p1Name} & ${p2Name} vs ${p3Name} & ${p4Name}`
              : `${p3Name} & ${p4Name} vs ${p1Name} & ${p2Name}`,
            score: `${m.team1_score}-${m.team2_score}`,
            date: new Date(m.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }),
            partnerId,
            opp1Id: isTeam1 ? m.player3_id : m.player1_id,
            opp2Id: isTeam1 ? m.player4_id : m.player2_id,
          };
        });
    },
  });

  // Active rematches
  const { data: activeRematches } = useQuery({
    queryKey: ["active-rematches", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("rematches")
        .select("*, req:profiles!rematches_requester_id_fkey(full_name, username), par:profiles!rematches_partner_id_fkey(full_name, username), op1:profiles!rematches_opponent1_id_fkey(full_name, username), op2:profiles!rematches_opponent2_id_fkey(full_name, username)")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user!.id},partner_id.eq.${user!.id},opponent1_id.eq.${user!.id},opponent2_id.eq.${user!.id}`);

      return (data || []).map((r) => {
        const getName = (p: any) => p?.full_name?.split(" ")[0] || p?.username || "?";
        const now = new Date();
        const expires = new Date(r.expires_at);
        const diff = expires.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        const hoursLeft = Math.max(0, Math.ceil((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

        // Determine if current user is on the losing team (requester/partner)
        const isLoser = r.requester_id === user!.id || r.partner_id === user!.id;

        return {
          id: r.id,
          teams: `${getName(r.req)} & ${getName(r.par)} vs ${getName(r.op1)} & ${getName(r.op2)}`,
          deadline: `${daysLeft}d ${hoursLeft}h`,
          matchNum: r.rematch_count,
          bonusPoints: r.rematch_count,
          expired: diff <= 0,
          isLoser,
          // Player IDs for auto-fill
          requesterId: r.requester_id,
          partnerId: r.partner_id,
          opponent1Id: r.opponent1_id,
          opponent2Id: r.opponent2_id,
        };
      });
    },
  });

  // Pending rematches (waiting for acceptance)
  const { data: pendingRematches } = useQuery({
    queryKey: ["pending-rematches", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("rematches")
        .select("*, req:profiles!rematches_requester_id_fkey(full_name, username), par:profiles!rematches_partner_id_fkey(full_name, username), op1:profiles!rematches_opponent1_id_fkey(full_name, username), op2:profiles!rematches_opponent2_id_fkey(full_name, username)")
        .eq("status", "pending")
        .or(`opponent1_id.eq.${user!.id},opponent2_id.eq.${user!.id}`);

      return (data || []).map((r) => {
        const getName = (p: any) => p?.full_name?.split(" ")[0] || p?.username || "?";
        return {
          id: r.id,
          teams: `${getName(r.req)} & ${getName(r.par)} vs ${getName(r.op1)} & ${getName(r.op2)}`,
          requesterName: getName(r.req),
        };
      });
    },
  });

  // History
  const { data: historyRematches } = useQuery({
    queryKey: ["history-rematches", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("rematches")
        .select("*, req:profiles!rematches_requester_id_fkey(full_name, username), par:profiles!rematches_partner_id_fkey(full_name, username), op1:profiles!rematches_opponent1_id_fkey(full_name, username), op2:profiles!rematches_opponent2_id_fkey(full_name, username)")
        .in("status", ["completed", "rejected", "expired"])
        .or(`requester_id.eq.${user!.id},partner_id.eq.${user!.id},opponent1_id.eq.${user!.id},opponent2_id.eq.${user!.id}`)
        .order("updated_at", { ascending: false })
        .limit(20);

      return (data || []).map((r) => {
        const getName = (p: any) => p?.full_name?.split(" ")[0] || p?.username || "?";
        return {
          id: r.id,
          teams: `${getName(r.req)} & ${getName(r.par)} vs ${getName(r.op1)} & ${getName(r.op2)}`,
          status: r.status,
          matchNum: r.rematch_count,
        };
      });
    },
  });

  const requestRematch = async (match: any) => {
    if (!user) return;

    // Calculate expiry: 7 business days from now
    const now = new Date();
    let businessDays = 0;
    const expiresAt = new Date(now);
    while (businessDays < 7) {
      expiresAt.setDate(expiresAt.getDate() + 1);
      const day = expiresAt.getDay();
      if (day !== 0 && day !== 6) businessDays++;
    }

    // Check existing rematch count
    const { data: existingRematches } = await supabase
      .from("rematches")
      .select("rematch_count")
      .eq("original_match_id", match.id)
      .order("rematch_count", { ascending: false })
      .limit(1);

    const rematchCount = (existingRematches?.[0]?.rematch_count ?? 0) + 1;

    const { error } = await supabase.from("rematches").insert({
      original_match_id: match.id,
      requester_id: user.id,
      partner_id: match.partnerId,
      opponent1_id: match.opp1Id,
      opponent2_id: match.opp2Id,
      expires_at: expiresAt.toISOString(),
      rematch_count: rematchCount,
    });

    if (error) {
      toast.error("Erro ao pedir desforra: " + error.message);
    } else {
      toast.success("Pedido de desforra enviado!");
      queryClient.invalidateQueries({ queryKey: ["lost-matches"] });
      queryClient.invalidateQueries({ queryKey: ["pending-rematches"] });
    }
  };

  const respondRematch = async (rematchId: string, accept: boolean) => {
    const { error } = await supabase
      .from("rematches")
      .update({ status: accept ? "accepted" : "rejected" })
      .eq("id", rematchId);

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success(accept ? "Desforra aceite!" : "Desforra recusada");
      queryClient.invalidateQueries({ queryKey: ["pending-rematches"] });
      queryClient.invalidateQueries({ queryKey: ["active-rematches"] });
      queryClient.invalidateQueries({ queryKey: ["history-rematches"] });
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "pending", label: "Pendentes", icon: <Clock size={16} /> },
    { key: "active", label: "Ativas", icon: <Swords size={16} /> },
    { key: "history", label: "Histórico", icon: <CheckCircle2 size={16} /> },
  ];

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="px-6 pt-12 pb-4">
        <button onClick={() => navigate("/home")} className="text-muted-foreground mb-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Desforras</h1>
      </div>

      <div className="px-6 mb-6">
        <div className="flex bg-secondary rounded-xl p-1">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-3">
        {tab === "pending" && (
          <>
            {/* Incoming rematch requests */}
            {pendingRematches && pendingRematches.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Pedidos recebidos</p>
                {pendingRematches.map((r) => (
                  <div key={r.id} className="glass-card p-4 space-y-3">
                    <p className="text-sm font-medium">{r.teams}</p>
                    <p className="text-xs text-muted-foreground">{r.requesterName} pediu desforra</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondRematch(r.id, true)}
                        className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => respondRematch(r.id, false)}
                        className="flex-1 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs font-bold"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lost matches eligible for rematch */}
            {lostMatches && lostMatches.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Pedir desforra</p>
                {lostMatches.map((m) => (
                  <div key={m.id} className="glass-card p-4 space-y-3">
                    <p className="text-sm font-medium">{m.teams}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Perdeste {m.score} · {m.date}</span>
                      <button
                        onClick={() => requestRematch(m)}
                        className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
                      >
                        Pedir Desforra
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!lostMatches || lostMatches.length === 0) && (!pendingRematches || pendingRematches.length === 0) && (
              <p className="text-center text-muted-foreground text-sm py-8">Sem desforras pendentes</p>
            )}
          </>
        )}

        {tab === "active" && (
          <>
            {activeRematches && activeRematches.length > 0 ? (
              activeRematches.map((m) => (
                <div key={m.id} className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{m.teams}</p>
                    <span className="text-xs font-bold text-warning">Jogo #{m.matchNum}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className={m.expired ? "text-destructive" : "text-warning"} />
                    <span className={`text-xs font-medium ${m.expired ? "text-destructive" : "text-warning"}`}>
                      {m.expired ? "Expirado" : `Tempo restante: ${m.deadline}`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Bónus desforra: +{m.bonusPoints} ponto(s)</p>
                  {!m.expired && m.isLoser && (
                    <button
                      onClick={() => navigate("/insert-result", {
                        state: {
                          rematchId: m.id,
                          partnerId: m.requesterId === user?.id ? m.partnerId : m.requesterId,
                          opp1Id: m.opponent1Id,
                          opp2Id: m.opponent2Id,
                          bonusPoints: m.bonusPoints,
                        },
                      })}
                      className="w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold"
                    >
                      Inserir Resultado
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">Sem desforras ativas</p>
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {historyRematches && historyRematches.length > 0 ? (
              historyRematches.map((m) => (
                <div key={m.id} className="glass-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{m.teams}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      m.status === "completed" ? "bg-success/20 text-success" :
                      m.status === "rejected" ? "bg-destructive/20 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {m.status === "completed" ? "Concluída" :
                       m.status === "rejected" ? "Recusada" : "Expirada"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">Sem histórico</p>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Rematches;

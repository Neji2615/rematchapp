import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlayerOption {
  user_id: string;
  username: string | null;
  full_name: string | null;
}

const InsertResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [partner, setPartner] = useState<PlayerOption | null>(null);
  const [opp1, setOpp1] = useState<PlayerOption | null>(null);
  const [opp2, setOpp2] = useState<PlayerOption | null>(null);
  const [sets, setSets] = useState([
    { us: "", them: "" },
    { us: "", them: "" },
    { us: "", them: "" },
  ]);
  const [activeSelector, setActiveSelector] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Rematch state from navigation
  const rematchState = location.state as {
    rematchId?: string;
    partnerId?: string;
    opp1Id?: string;
    opp2Id?: string;
    bonusPoints?: number;
  } | null;
  const isRematch = !!rematchState?.rematchId;

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, full_name")
        .not("username", "is", null);
      if (data) {
        const allPlayers = data.filter((p) => p.user_id !== user?.id);
        setPlayers(allPlayers);

        // Auto-fill from rematch state
        if (rematchState?.partnerId) {
          const p = data.find((x) => x.user_id === rematchState.partnerId);
          if (p) setPartner(p);
        }
        if (rematchState?.opp1Id) {
          const p = data.find((x) => x.user_id === rematchState.opp1Id);
          if (p) setOpp1(p);
        }
        if (rematchState?.opp2Id) {
          const p = data.find((x) => x.user_id === rematchState.opp2Id);
          if (p) setOpp2(p);
        }
      }
    };
    fetchPlayers();
  }, [user?.id, rematchState?.partnerId, rematchState?.opp1Id, rematchState?.opp2Id]);

  const updateSet = (index: number, side: "us" | "them", value: string) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [side]: value };
    setSets(newSets);
  };

  const isOneOne = () => {
    const s1Us = parseInt(sets[0].us);
    const s1Them = parseInt(sets[0].them);
    const s2Us = parseInt(sets[1].us);
    const s2Them = parseInt(sets[1].them);
    if (isNaN(s1Us) || isNaN(s1Them) || isNaN(s2Us) || isNaN(s2Them)) return false;
    const set1Won = s1Us > s1Them;
    const set2Won = s2Us > s2Them;
    return set1Won !== set2Won;
  };

  const getDisplayName = (p: PlayerOption) =>
    p.full_name || p.username || "Jogador";

  const selectedIds = [partner?.user_id, opp1?.user_id, opp2?.user_id].filter(Boolean);

  const filteredPlayers = players.filter(
    (p) =>
      !selectedIds.includes(p.user_id) &&
      (getDisplayName(p).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.username && p.username.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const selectPlayer = (p: PlayerOption) => {
    if (activeSelector === "partner") setPartner(p);
    else if (activeSelector === "opp1") setOpp1(p);
    else if (activeSelector === "opp2") setOpp2(p);
    setActiveSelector(null);
    setSearchTerm("");
  };

  const calculateWinner = () => {
    let team1Sets = 0;
    let team2Sets = 0;
    const numSets = isOneOne() ? 3 : 2;

    for (let i = 0; i < numSets; i++) {
      const us = parseInt(sets[i].us);
      const them = parseInt(sets[i].them);
      if (isNaN(us) || isNaN(them)) return null;
      if (us === them) return null; // sets can't be tied
      if (us > them) team1Sets++;
      else team2Sets++;
    }

    if (team1Sets === team2Sets) return null;

    const needsThird = numSets === 3;
    return {
      winner_team: team1Sets > team2Sets ? 1 : 2,
      team1_score: team1Sets, // sets won
      team2_score: team2Sets,
      set1_team1: parseInt(sets[0].us),
      set1_team2: parseInt(sets[0].them),
      set2_team1: parseInt(sets[1].us),
      set2_team2: parseInt(sets[1].them),
      set3_team1: needsThird ? parseInt(sets[2].us) : null,
      set3_team2: needsThird ? parseInt(sets[2].them) : null,
    };
  };

  const handleSubmit = async () => {
    if (!user || !partner || !opp1 || !opp2) {
      toast.error("Seleciona todos os jogadores");
      return;
    }

    const result = calculateWinner();
    if (!result) {
      toast.error("Resultado inválido - preenche todos os sets");
      return;
    }

    setLoading(true);

    const bonusPoints = isRematch ? (rematchState?.bonusPoints ?? 1) : 0;

    const { error } = await supabase.from("matches").insert({
      player1_id: user.id,
      player2_id: partner.user_id,
      player3_id: opp1.user_id,
      player4_id: opp2.user_id,
      team1_score: result.team1_score,
      team2_score: result.team2_score,
      winner_team: result.winner_team,
      set1_team1: result.set1_team1,
      set1_team2: result.set1_team2,
      set2_team1: result.set2_team1,
      set2_team2: result.set2_team2,
      set3_team1: result.set3_team1,
      set3_team2: result.set3_team2,
      points_awarded: 3,
      bonus_points: bonusPoints,
      is_rematch: isRematch,
      rematch_id: rematchState?.rematchId || null,
      confirmed_by: [user.id],
    });

    setLoading(false);

    if (error) {
      toast.error("Erro ao inserir resultado: " + error.message);
      return;
    }

    // Mark rematch as completed
    if (isRematch && rematchState?.rematchId) {
      await supabase.from("rematches").update({ status: "completed" }).eq("id", rematchState.rematchId);
    }

    toast.success("Resultado inserido! A aguardar confirmação dos outros jogadores.");
    navigate("/home");
  };

  const PlayerSelector = ({
    label,
    selectorKey,
    value,
    disabled,
  }: {
    label: string;
    selectorKey: string;
    value: PlayerOption | null;
    disabled?: boolean;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setActiveSelector(activeSelector === selectorKey ? null : selectorKey);
          setSearchTerm("");
        }}
        className={`w-full text-left px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {value ? (
          getDisplayName(value)
        ) : (
          <span className="text-muted-foreground">Selecionar jogador</span>
        )}
      </button>
      {activeSelector === selectorKey && (
        <div className="glass-card p-2 space-y-1 animate-slide-up">
          <Input
            placeholder="Procurar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background/50 border-border mb-1 h-9 text-sm"
          />
          {filteredPlayers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Sem jogadores encontrados</p>
          ) : (
            filteredPlayers.map((p) => (
              <button
                key={p.user_id}
                onClick={() => selectPlayer(p)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/10 transition-colors"
              >
                {getDisplayName(p)}
                {p.username && (
                  <span className="text-muted-foreground ml-1">@{p.username}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen px-6 pt-12 pb-8 animate-fade-in">
      <button onClick={() => navigate("/home")} className="text-muted-foreground mb-6">
        <ArrowLeft size={24} />
      </button>

      <h1 className="text-2xl font-bold mb-6">Inserir Resultado</h1>

      <div className="space-y-5">
        <div className="glass-card p-4 space-y-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Jogadores</p>
          <PlayerSelector label="Parceiro" selectorKey="partner" value={partner} />
          <div className="border-t border-border/50 pt-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Adversários</p>
            <div className="space-y-3">
              <PlayerSelector label="Adversário 1" selectorKey="opp1" value={opp1} />
              <PlayerSelector label="Adversário 2" selectorKey="opp2" value={opp2} />
            </div>
          </div>
        </div>

        <div className="glass-card p-4 space-y-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Resultado</p>
          {[0, 1, 2].map((i) => {
            if (i === 2 && !isOneOne()) return null;
            return (
              <div key={i} className="space-y-2">
                <Label className="text-xs">{i === 2 ? "3º Set (Desempate)" : `${i + 1}º Set`}</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="7"
                    placeholder="0"
                    value={sets[i].us}
                    onChange={(e) => updateSet(i, "us", e.target.value)}
                    className="bg-secondary border-border text-center font-bold text-lg h-12"
                  />
                  <span className="text-muted-foreground font-bold">-</span>
                  <Input
                    type="number"
                    min="0"
                    max="7"
                    placeholder="0"
                    value={sets[i].them}
                    onChange={(e) => updateSet(i, "them", e.target.value)}
                    className="bg-secondary border-border text-center font-bold text-lg h-12"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 font-bold text-sm glow-primary gap-2"
        >
          <Check size={18} />
          {loading ? "A enviar..." : "Confirmar Resultado"}
        </Button>
      </div>
    </div>
  );
};

export default InsertResult;

import { useState } from "react";
import { Check, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface MatchConfirmationProps {
  match: {
    id: string;
    confirmed_by: string[] | null;
    player1_id: string;
    player2_id: string;
    player3_id: string;
    player4_id: string;
    winner_team: number;
    team1_score: number;
    team2_score: number;
    points_awarded: number;
    created_at: string;
  };
  playerNames?: Record<string, string>;
}

const MatchConfirmation = ({ match, playerNames = {} }: MatchConfirmationProps) => {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const confirmed = match.confirmed_by || [];
  const isConfirmed = user ? confirmed.includes(user.id) : false;
  const allConfirmed = confirmed.length === 4;
  const confirmCount = confirmed.length;

  const handleConfirm = async () => {
    if (!user || isConfirmed || allConfirmed) return;
    setLoading(true);

    const { data, error } = await supabase.rpc("confirm_match", {
      match_id: match.id,
    });

    setLoading(false);

    if (error) {
      toast.error("Erro ao confirmar: " + error.message);
      return;
    }

    const result = data as any;
    if (result?.error) {
      toast.error(result.error);
      return;
    }

    if (result?.status === "confirmed_and_points_awarded") {
      toast.success(`Resultado confirmado! ${result.points} pontos atribuídos aos vencedores.`);
      await refreshProfile();
    } else {
      toast.success(`Confirmado! (${result?.confirmed_count}/4)`);
    }

    queryClient.invalidateQueries({ queryKey: ["pending-confirmations"] });
    queryClient.invalidateQueries({ queryKey: ["match-stats"] });
  };

  const getName = (id: string) => playerNames[id] || "Jogador";

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {getName(match.player1_id)} & {getName(match.player2_id)} vs{" "}
          {getName(match.player3_id)} & {getName(match.player4_id)}
        </p>
        <span className="text-xs text-muted-foreground">
          {new Date(match.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">
          {match.team1_score} - {match.team2_score}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          allConfirmed ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
        }`}>
          {allConfirmed ? "Confirmado" : `${confirmCount}/4 confirmações`}
        </span>
      </div>

      <div className="flex gap-1">
        {[match.player1_id, match.player2_id, match.player3_id, match.player4_id].map((pid) => (
          <div
            key={pid}
            className={`flex-1 h-1.5 rounded-full ${
              confirmed.includes(pid) ? "bg-success" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      {!allConfirmed && user && !isConfirmed && (
        [match.player1_id, match.player2_id, match.player3_id, match.player4_id].includes(user.id) && (
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Check size={14} />
            {loading ? "A confirmar..." : "Confirmar Resultado"}
          </button>
        )
      )}

      {isConfirmed && !allConfirmed && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
          <Clock size={12} />
          <span>Confirmaste. A aguardar os outros jogadores.</span>
        </div>
      )}
    </div>
  );
};

export default MatchConfirmation;

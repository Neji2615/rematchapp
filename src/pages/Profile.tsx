import { ArrowLeft, TrendingUp, TrendingDown, Minus, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const mockProfile = {
  name: "Jogador",
  username: "@jogador",
  gender: "Masculino",
  hand: "Direita",
  side: "Esquerda",
  division: 3,
  totalPoints: 42,
  wins: 8,
  losses: 3,
};

const lastGames = [
  { opponent: "Carlos & Miguel", result: "6-3, 6-2", won: true, points: 3, date: "07 Abr" },
  { opponent: "Sofia & João", result: "4-6, 6-3, 6-4", won: true, points: 4, date: "05 Abr" },
  { opponent: "Hugo & Sara", result: "2-6, 4-6", won: false, points: 0, date: "03 Abr" },
  { opponent: "André & Inês", result: "6-1, 6-3", won: true, points: 3, date: "01 Abr" },
  { opponent: "Tiago & Maria", result: "3-6, 6-4, 2-6", won: false, points: 0, date: "29 Mar" },
];

const divisionHistory = [
  { from: 4, to: 3, date: "Semana 3", direction: "up" },
  { from: 3, to: 4, date: "Semana 2", direction: "down" },
  { from: 4, to: 4, date: "Semana 1", direction: "same" },
];

const Profile = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => navigate("/home")} className="text-muted-foreground mb-4">
          <ArrowLeft size={24} />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-black text-primary">
            J
          </div>
          <div>
            <h1 className="text-xl font-bold">{mockProfile.name}</h1>
            <p className="text-muted-foreground text-sm">{mockProfile.username}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Divisão", value: mockProfile.division },
            { label: "Vitórias", value: mockProfile.wins },
            { label: "Derrotas", value: mockProfile.losses },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-3 text-center">
              <p className="text-lg font-black text-primary">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="glass-card p-4 mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Dados</p>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-muted-foreground">Género</span><span className="font-medium">{mockProfile.gender}</span>
            <span className="text-muted-foreground">Mão</span><span className="font-medium">{mockProfile.hand}</span>
            <span className="text-muted-foreground">Lado</span><span className="font-medium">{mockProfile.side}</span>
            <span className="text-muted-foreground">Pontos totais</span><span className="font-medium">{mockProfile.totalPoints}</span>
          </div>
        </div>

        {/* Last 5 games */}
        <div className="mb-6">
          <h2 className="font-bold text-base mb-3">Últimos 5 Jogos</h2>
          <div className="glass-card divide-y divide-border/50">
            {lastGames.map((game, i) => (
              <div key={i} className="flex items-center px-4 py-3">
                <span className={`w-2 h-2 rounded-full mr-3 ${game.won ? "bg-success" : "bg-destructive"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">vs {game.opponent}</p>
                  <p className="text-xs text-muted-foreground">{game.result} · {game.date}</p>
                </div>
                <span className={`text-xs font-bold ${game.won ? "text-success" : "text-muted-foreground"}`}>
                  +{game.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Division history */}
        <div>
          <h2 className="font-bold text-base mb-3">Histórico de Divisão</h2>
          <div className="glass-card divide-y divide-border/50">
            {divisionHistory.map((h, i) => (
              <div key={i} className="flex items-center px-4 py-3">
                {h.direction === "up" && <TrendingUp size={16} className="text-success mr-3" />}
                {h.direction === "down" && <TrendingDown size={16} className="text-destructive mr-3" />}
                {h.direction === "same" && <Minus size={16} className="text-muted-foreground mr-3" />}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Div. {h.from} → Div. {h.to}
                  </p>
                  <p className="text-xs text-muted-foreground">{h.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;

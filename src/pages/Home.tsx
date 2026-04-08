import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Swords, TrendingUp, Medal } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const mockRanking = [
  { pos: 1, name: "Carlos M.", points: 18, trend: "up" },
  { pos: 2, name: "Ana R.", points: 15, trend: "up" },
  { pos: 3, name: "Miguel S.", points: 12, trend: "same" },
  { pos: 4, name: "Tu", points: 9, trend: "down" },
  { pos: 5, name: "João P.", points: 6, trend: "down" },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <p className="text-muted-foreground text-sm">Olá,</p>
        <h1 className="text-2xl font-bold">Jogador 👋</h1>
      </div>

      {/* Division Card */}
      <div className="px-6 mb-6">
        <div className="glass-card p-5 glow-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Divisão atual</p>
              <p className="text-3xl font-black text-gradient mt-1">Divisão 3</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Medal size={28} className="text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingUp size={16} className="text-success" />
            <span className="text-success font-medium">4ª posição</span>
            <span className="text-muted-foreground">· 9 pontos esta semana</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
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

      {/* Weekly Ranking */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Ranking Semanal</h2>
          <button onClick={() => navigate("/rankings")} className="text-primary text-xs font-semibold">
            Ver tudo →
          </button>
        </div>
        <div className="glass-card divide-y divide-border/50">
          {mockRanking.map((player) => (
            <div key={player.pos} className={`flex items-center px-4 py-3 ${player.name === "Tu" ? "bg-primary/5" : ""}`}>
              <span className={`w-7 text-sm font-bold ${player.pos <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                {player.pos}
              </span>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold mr-3">
                {player.name.charAt(0)}
              </div>
              <span className={`flex-1 text-sm font-medium ${player.name === "Tu" ? "text-primary" : ""}`}>
                {player.name}
              </span>
              <span className="text-sm font-bold">{player.points} pts</span>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;

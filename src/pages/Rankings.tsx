import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Minus, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const divisions = [
  {
    name: "Divisão 1",
    players: [
      { pos: 1, name: "Ricardo F.", points: 24, trend: "up" },
      { pos: 2, name: "Beatriz L.", points: 21, trend: "same" },
      { pos: 3, name: "Tiago M.", points: 18, trend: "up" },
      { pos: 4, name: "Maria S.", points: 12, trend: "down" },
    ],
  },
  {
    name: "Divisão 2",
    players: [
      { pos: 1, name: "Hugo A.", points: 21, trend: "up" },
      { pos: 2, name: "Sara C.", points: 18, trend: "same" },
      { pos: 3, name: "André P.", points: 15, trend: "down" },
      { pos: 4, name: "Inês R.", points: 9, trend: "down" },
    ],
  },
  {
    name: "Divisão 3",
    players: [
      { pos: 1, name: "Carlos M.", points: 18, trend: "up" },
      { pos: 2, name: "Ana R.", points: 15, trend: "up" },
      { pos: 3, name: "Miguel S.", points: 12, trend: "same" },
      { pos: 4, name: "Tu", points: 9, trend: "down" },
      { pos: 5, name: "João P.", points: 6, trend: "down" },
    ],
  },
];

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <ChevronUp size={14} className="text-success" />;
  if (trend === "down") return <ChevronDown size={14} className="text-destructive" />;
  return <Minus size={14} className="text-muted-foreground" />;
};

const Rankings = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string>("Divisão 3");

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
        {divisions.map((div) => (
          <div key={div.name} className="glass-card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === div.name ? "" : div.name)}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-primary" />
                <span className="font-bold text-sm">{div.name}</span>
              </div>
              <ChevronDown
                size={18}
                className={`text-muted-foreground transition-transform ${expanded === div.name ? "rotate-180" : ""}`}
              />
            </button>
            {expanded === div.name && (
              <div className="border-t border-border/50 divide-y divide-border/50 animate-slide-up">
                {div.players.map((player, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === div.players.length - 1;
                  return (
                    <div
                      key={player.pos}
                      className={`flex items-center px-4 py-3 ${
                        player.name === "Tu" ? "bg-primary/5" : ""
                      } ${isFirst ? "border-l-2 border-l-success" : ""} ${
                        isLast ? "border-l-2 border-l-destructive" : ""
                      }`}
                    >
                      <span className={`w-7 text-sm font-bold ${player.pos <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                        {player.pos}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold mr-3">
                        {player.name.charAt(0)}
                      </div>
                      <span className={`flex-1 text-sm font-medium ${player.name === "Tu" ? "text-primary" : ""}`}>
                        {player.name}
                      </span>
                      <TrendIcon trend={player.trend} />
                      <span className="text-sm font-bold ml-2 w-14 text-right">{player.points} pts</span>
                    </div>
                  );
                })}
                <div className="px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" /> Sobe</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Desce</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Rankings;

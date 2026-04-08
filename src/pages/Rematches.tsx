import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Swords, CheckCircle2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

type Tab = "pending" | "active" | "history";

const mockPending = [
  { id: 1, teams: "Tu & Ana vs Carlos & Miguel", date: "05 Abr", result: "2-6, 4-6" },
];

const mockActive = [
  { id: 2, teams: "Tu & Sofia vs João & Pedro", deadline: "3d 14h", matchNum: 2, bonusPoints: 1 },
];

const mockHistory = [
  { id: 3, teams: "Tu & Ana vs Carlos & Miguel", result: "6-3, 6-2", won: true, points: 4, matchNum: 2 },
  { id: 4, teams: "Tu & Pedro vs Sofia & João", result: "4-6, 3-6", won: false, points: 0, matchNum: 1 },
];

const Rematches = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("pending");

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

      {/* Tabs */}
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
        {tab === "pending" && mockPending.map((m) => (
          <div key={m.id} className="glass-card p-4 space-y-3">
            <p className="text-sm font-medium">{m.teams}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Perdeste {m.result} · {m.date}</span>
              <button className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                Pedir Desforra
              </button>
            </div>
          </div>
        ))}

        {tab === "active" && mockActive.map((m) => (
          <div key={m.id} className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{m.teams}</p>
              <span className="text-xs font-bold text-warning">Jogo #{m.matchNum}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-destructive" />
              <span className="text-xs text-destructive font-medium">Tempo restante: {m.deadline}</span>
            </div>
            <p className="text-xs text-muted-foreground">Bónus desforra: +{m.bonusPoints} ponto(s)</p>
            <button
              onClick={() => navigate("/insert-result")}
              className="w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold"
            >
              Inserir Resultado
            </button>
          </div>
        ))}

        {tab === "history" && mockHistory.map((m) => (
          <div key={m.id} className="glass-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{m.teams}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                m.won ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              }`}>
                {m.won ? "Vitória" : "Derrota"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{m.result}</span>
              <span>{m.won ? `+${m.points} pts (bónus incl.)` : "0 pts"}</span>
            </div>
          </div>
        ))}

        {tab === "pending" && mockPending.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Sem desforras pendentes</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Rematches;

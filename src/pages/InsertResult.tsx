import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check } from "lucide-react";

const mockPlayers = ["Carlos M.", "Ana R.", "Miguel S.", "João P.", "Sofia L.", "Pedro G."];

const InsertResult = () => {
  const navigate = useNavigate();
  const [partner, setPartner] = useState("");
  const [opp1, setOpp1] = useState("");
  const [opp2, setOpp2] = useState("");
  const [sets, setSets] = useState([
    { us: "", them: "" },
    { us: "", them: "" },
    { us: "", them: "" },
  ]);
  const [showPartnerList, setShowPartnerList] = useState(false);
  const [showOpp1List, setShowOpp1List] = useState(false);
  const [showOpp2List, setShowOpp2List] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const PlayerSelector = ({
    label,
    value,
    showList,
    setShowList,
  }: {
    label: string;
    value: string;
    showList: boolean;
    setShowList: (v: boolean) => void;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => {
          setShowList(!showList);
          setSearchTerm("");
        }}
        className="w-full text-left px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm"
      >
        {value || <span className="text-muted-foreground">Selecionar jogador</span>}
      </button>
      {showList && (
        <div className="glass-card p-2 space-y-1 animate-slide-up">
          <Input
            placeholder="Procurar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background/50 border-border mb-1 h-9 text-sm"
          />
          {mockPlayers
            .filter((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((p) => (
              <button
                key={p}
                onClick={() => {
                  if (label.includes("Parceiro")) setPartner(p);
                  else if (label.includes("1")) setOpp1(p);
                  else setOpp2(p);
                  setShowList(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/10 transition-colors"
              >
                {p}
              </button>
            ))}
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
          <PlayerSelector label="Parceiro" value={partner} showList={showPartnerList} setShowList={setShowPartnerList} />
          <div className="border-t border-border/50 pt-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Adversários</p>
            <div className="space-y-3">
              <PlayerSelector label="Adversário 1" value={opp1} showList={showOpp1List} setShowList={setShowOpp1List} />
              <PlayerSelector label="Adversário 2" value={opp2} showList={showOpp2List} setShowList={setShowOpp2List} />
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

        <Button className="w-full h-12 font-bold text-sm glow-primary gap-2">
          <Check size={18} />
          Confirmar Resultado
        </Button>
      </div>
    </div>
  );
};

export default InsertResult;

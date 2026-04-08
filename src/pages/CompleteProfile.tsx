import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";

const options = {
  gender: ["Masculino", "Feminino"],
  hand: ["Direita", "Esquerda"],
  side: ["Direita", "Esquerda"],
};

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [hand, setHand] = useState("");
  const [side, setSide] = useState("");

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/home");
  };

  const OptionGroup = ({
    label,
    value,
    onChange,
    items,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    items: string[];
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              value === item
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 animate-fade-in">
      <div className="w-full max-w-sm mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Completa o teu perfil</h1>
          <p className="text-muted-foreground text-sm">Diz-nos mais sobre ti</p>
        </div>

        <form onSubmit={handleComplete} className="space-y-5">
          <div className="flex justify-center">
            <button
              type="button"
              className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
            >
              <Camera size={28} className="text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="@username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-secondary border-border" />
          </div>

          <OptionGroup label="Género" value={gender} onChange={setGender} items={options.gender} />
          <OptionGroup label="Mão preferida" value={hand} onChange={setHand} items={options.hand} />
          <OptionGroup label="Lado do campo" value={side} onChange={setSide} items={options.side} />

          <Button type="submit" className="w-full font-bold text-sm h-11 glow-primary">
            Começar a jogar
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;

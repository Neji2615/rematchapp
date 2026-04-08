import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/complete-profile");
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 animate-fade-in">
      <button onClick={() => navigate("/login")} className="text-muted-foreground mb-8 self-start">
        <ArrowLeft size={24} />
      </button>

      <div className="w-full max-w-sm mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Criar conta</h1>
          <p className="text-muted-foreground text-sm">Junta-te à comunidade Rematch</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="O teu nome" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="o-teu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary border-border" />
          </div>
          <Button type="submit" className="w-full font-bold text-sm h-11 glow-primary">
            Criar conta
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tens conta?{" "}
          <button onClick={() => navigate("/login")} className="text-primary font-semibold hover:underline">
            Entra aqui
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;

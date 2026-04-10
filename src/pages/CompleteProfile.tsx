import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const options = {
  gender: ["Masculino", "Feminino"],
  hand: ["Direita", "Esquerda"],
  side: ["Direita", "Esquerda"],
};

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [hand, setHand] = useState("");
  const [side, setSide] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!gender || !hand || !side) {
      toast.error("Por favor preenche todos os campos");
      return;
    }

    if (username.length < 3) {
      toast.error("O username deve ter pelo menos 3 caracteres");
      return;
    }

    setLoading(true);

    let avatarUrl: string | null = null;

    // Upload avatar if selected
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });

      if (uploadError) {
        toast.error("Erro ao enviar foto: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.startsWith("@") ? username.slice(1) : username,
        gender,
        preferred_hand: hand,
        preferred_side: side,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      .eq("user_id", user.id);

    if (error) {
      setLoading(false);
      if (error.message.includes("unique")) {
        toast.error("Este username já está a ser usado");
      } else {
        toast.error("Erro ao guardar perfil: " + error.message);
      }
      return;
    }

    await refreshProfile();
    setLoading(false);
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors overflow-hidden"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera size={28} className="text-muted-foreground" />
              )}
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="@username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-secondary border-border" required />
          </div>

          <OptionGroup label="Género" value={gender} onChange={setGender} items={options.gender} />
          <OptionGroup label="Mão preferida" value={hand} onChange={setHand} items={options.hand} />
          <OptionGroup label="Lado do campo" value={side} onChange={setSide} items={options.side} />

          <Button type="submit" className="w-full font-bold text-sm h-11 glow-primary" disabled={loading}>
            {loading ? "A guardar..." : "Começar a jogar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;

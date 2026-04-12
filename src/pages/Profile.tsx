import { useState, useRef } from "react";
import { ArrowLeft, TrendingUp, LogOut, Pencil, Camera, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AvatarDisplay from "@/components/AvatarDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const genderOptions = ["Masculino", "Feminino"];
const handOptions = ["Direita", "Esquerda"];
const sideOptions = ["Direita", "Esquerda"];

const Profile = () => {
  const { signOut, user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editHand, setEditHand] = useState("");
  const [editSide, setEditSide] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setEditUsername(profile?.username || "");
    setEditFullName(profile?.full_name || "");
    setEditGender(profile?.gender || "");
    setEditHand(profile?.preferred_hand || "");
    setEditSide(profile?.preferred_side || "");
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

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

  const handleSave = async () => {
    if (!user) return;
    if (editUsername.length < 3) {
      toast.error("O username deve ter pelo menos 3 caracteres");
      return;
    }
    setSaving(true);

    let avatarUrl: string | null = null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });
      if (uploadError) {
        toast.error("Erro ao enviar foto: " + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: editUsername.startsWith("@") ? editUsername.slice(1) : editUsername,
        full_name: editFullName,
        gender: editGender,
        preferred_hand: editHand,
        preferred_side: editSide,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      .eq("user_id", user.id);

    if (error) {
      if (error.message.includes("unique")) {
        toast.error("Este username já está a ser usado");
      } else {
        toast.error("Erro ao guardar: " + error.message);
      }
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSaving(false);
    setEditing(false);
    toast.success("Perfil atualizado!");
  };

  const { data: matchStats } = useQuery({
    queryKey: ["match-stats", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: matches } = await supabase
        .from("matches")
        .select("winner_team, player1_id, player2_id, player3_id, player4_id, points_awarded, created_at, team1_score, team2_score, confirmed_by")
        .or(`player1_id.eq.${user!.id},player2_id.eq.${user!.id},player3_id.eq.${user!.id},player4_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!matches) return { wins: 0, losses: 0, recentMatches: [] };

      const confirmedMatches = matches.filter((m) => (m.confirmed_by || []).length === 4);
      let wins = 0;
      let losses = 0;
      const recentMatches = confirmedMatches.slice(0, 5).map((m) => {
        const isTeam1 = m.player1_id === user!.id || m.player2_id === user!.id;
        const won = (isTeam1 && m.winner_team === 1) || (!isTeam1 && m.winner_team === 2);
        if (won) wins++;
        else losses++;
        const score = `${m.team1_score}-${m.team2_score}`;
        const date = new Date(m.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
        return { won, score, points: won ? m.points_awarded : 0, date };
      });

      return { wins, losses, recentMatches };
    },
  });

  const { data: divisionData } = useQuery({
    queryKey: ["division", profile?.division_id],
    enabled: !!profile?.division_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("divisions")
        .select("name, level")
        .eq("id", profile!.division_id!)
        .maybeSingle();
      return data;
    },
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.full_name || profile?.username || "Jogador";

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
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
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
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/home")} className="text-muted-foreground">
            <ArrowLeft size={24} />
          </button>
          {!editing && (
            <button onClick={startEditing} className="text-primary flex items-center gap-1 text-sm font-semibold">
              <Pencil size={16} />
              Editar
            </button>
          )}
        </div>

        {/* Avatar + Name */}
        <div className="flex items-center gap-4 mb-6">
          {editing ? (
            <div className="relative">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-full bg-secondary border-2 border-dashed border-primary/40 flex items-center justify-center overflow-hidden"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={20} className="text-muted-foreground" />
                )}
              </button>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Camera size={12} className="text-primary-foreground" />
              </div>
            </div>
          ) : (
            <AvatarDisplay avatarUrl={profile?.avatar_url} name={displayName} size="lg" />
          )}
          <div className="flex-1">
            {editing ? (
              <div className="space-y-2">
                <Input
                  placeholder="Nome completo"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="bg-secondary border-border h-9 text-sm"
                />
                <Input
                  placeholder="@username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="bg-secondary border-border h-9 text-sm"
                />
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold">{displayName}</h1>
                <p className="text-muted-foreground text-sm">
                  {profile?.username ? `@${profile.username}` : ""}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="glass-card p-4 mb-6 space-y-4">
            <OptionGroup label="Género" value={editGender} onChange={setEditGender} items={genderOptions} />
            <OptionGroup label="Mão preferida" value={editHand} onChange={setEditHand} items={handOptions} />
            <OptionGroup label="Lado do campo" value={editSide} onChange={setEditSide} items={sideOptions} />
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 gap-1 border-border"
                onClick={cancelEditing}
                disabled={saving}
              >
                <X size={16} />
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-1 glow-primary"
                onClick={handleSave}
                disabled={saving}
              >
                <Check size={16} />
                {saving ? "A guardar..." : "Guardar"}
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        {!editing && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Divisão", value: divisionData?.name || "Bronze" },
                { label: "Vitórias", value: matchStats?.wins ?? 0 },
                { label: "Derrotas", value: matchStats?.losses ?? 0 },
              ].map((stat) => (
                <div key={stat.label} className="glass-card p-3 text-center">
                  <p className="text-lg font-black text-primary">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="glass-card p-4 mb-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Dados</p>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">Género</span>
                <span className="font-medium">{profile?.gender || "-"}</span>
                <span className="text-muted-foreground">Mão</span>
                <span className="font-medium">{profile?.preferred_hand || "-"}</span>
                <span className="text-muted-foreground">Lado</span>
                <span className="font-medium">{profile?.preferred_side || "-"}</span>
                <span className="text-muted-foreground">Pontos totais</span>
                <span className="font-medium">{profile?.total_points ?? 0}</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="font-bold text-base mb-3">Últimos Jogos</h2>
              <div className="glass-card divide-y divide-border/50">
                {matchStats?.recentMatches && matchStats.recentMatches.length > 0 ? (
                  matchStats.recentMatches.map((game, i) => (
                    <div key={i} className="flex items-center px-4 py-3">
                      <span className={`w-2 h-2 rounded-full mr-3 ${game.won ? "bg-success" : "bg-destructive"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{game.won ? "Vitória" : "Derrota"}</p>
                        <p className="text-xs text-muted-foreground">{game.score} · {game.date}</p>
                      </div>
                      <span className={`text-xs font-bold ${game.won ? "text-success" : "text-muted-foreground"}`}>
                        +{game.points}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                    Sem jogos confirmados
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="glass-card p-4 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp size={16} className="text-primary" />
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-medium truncate">{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="mt-2">
              <Button variant="outline" className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                <LogOut size={18} />
                Terminar sessão
              </Button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;

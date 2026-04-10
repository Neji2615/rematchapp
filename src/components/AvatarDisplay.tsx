import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarDisplayProps {
  avatarUrl?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-xl",
};

const AvatarDisplay = ({ avatarUrl, name, size = "md", className = "" }: AvatarDisplayProps) => {
  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <Avatar className={`${sizeMap[size]} ${className}`}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name || "Avatar"} />}
      <AvatarFallback className="bg-primary/20 text-primary font-bold">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
};

export default AvatarDisplay;

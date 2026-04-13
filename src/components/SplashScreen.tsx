import { useState, useEffect } from "react";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 100);
    const t2 = setTimeout(() => setPhase("exit"), 2000);
    const t3 = setTimeout(() => onFinish(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`transition-all duration-700 ease-out ${
          phase === "enter"
            ? "opacity-0 scale-75"
            : phase === "hold"
            ? "opacity-100 scale-100"
            : "opacity-0 scale-110"
        }`}
      >
        <h1 className="text-5xl font-black tracking-tight text-gradient glow-primary">
          REMATCH
        </h1>
        <div className="mt-3 flex justify-center">
          <div className="h-1 rounded-full bg-primary/80 animate-splash-bar" />
        </div>
        <p className="text-center text-muted-foreground text-sm mt-4 animate-fade-in" style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
          O teu padel. A tua desforra.
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;

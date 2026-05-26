import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Film, ArrowLeft, Bell, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import GoldWatermark from "@/components/GoldWatermark";

export default function Showcase() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    toast.success("You're on the list — we'll notify you when films go live.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden">
      <GoldWatermark />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-amber-600/5 blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl mx-auto w-full">

        {/* Back button */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors mb-12 self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Virelle
        </button>

        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-8 shadow-lg shadow-amber-500/10">
          <Film className="h-9 w-9 text-amber-400" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-6">
          <Sparkles className="h-3 w-3" />
          Coming Soon
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          The Virelle{" "}
          <span style={{ background: "linear-gradient(135deg, #d4af37, #f5e6a3, #d4af37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Showcase
          </span>
        </h1>

        <p className="text-foreground/60 text-lg leading-relaxed mb-10 max-w-lg">
          A curated gallery of films, trailers, and commercials made entirely inside Virelle Studios.
          <br /><br />
          We're finalising the first batch of productions. Be the first to know when it goes live.
        </p>

        {/* Waitlist form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 h-11 px-4 rounded-lg bg-card border border-border text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
            <Button
              type="submit"
              className="h-11 px-6 text-sm font-semibold text-black shrink-0"
              style={{ background: "linear-gradient(135deg, #d4af37 0%, #f5e6a3 50%, #d4af37 100%)" }}
            >
              <Bell className="h-4 w-4 mr-2" />
              Notify Me
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
            <Sparkles className="h-5 w-5 shrink-0" />
            <span>You're on the list. We'll be in touch.</span>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 mt-12 mb-8 w-full max-w-md">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-foreground/30 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* CTA */}
        <Button
          variant="outline"
          onClick={() => setLocation("/register")}
          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
        >
          Start making your own films
          <Film className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
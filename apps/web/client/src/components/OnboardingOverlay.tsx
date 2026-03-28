import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

const ONBOARDING_KEY = "virelle-onboarding-v3-completed";

const STEPS = [
  {
    icon: "🎬",
    title: "Create Your Project",
    description:
      "Start by creating a new project. Give it a title, genre, and logline. Your project is the container for your entire film — script, storyboard, characters, sound, and more.",
    tip: "A strong logline (one sentence that captures your story) helps the AI generate better content throughout your project.",
    color: "#b45309",
    action: { label: "Create a Project →", path: "/projects/new" },
  },
  {
    icon: "📝",
    title: "Write Your Script",
    description:
      "Use the AI Script Writer to generate a full screenplay from your premise. Choose your genre and tone, then let the AI draft your script — or write it yourself. Edit freely in the built-in editor.",
    tip: "Script generation costs 10 credits. You can regenerate as many times as you like to find the right voice.",
    color: "#0a7ea4",
    action: null,
  },
  {
    icon: "🎨",
    title: "Build Your Storyboard",
    description:
      "Visualise your film panel by panel. Describe each scene and camera angle, and the AI generates a storyboard description. Add as many panels as you need to map out your entire film.",
    tip: "Each panel costs 5 credits. Use the Shot List tool to plan camera angles before storyboarding.",
    color: "#7c3aed",
    action: null,
  },
  {
    icon: "🎭",
    title: "Develop Your Characters",
    description:
      "Add your cast with names, roles, and descriptions. The Dialogue Editor lets you write and refine character dialogue scene by scene, with AI assistance to match each character's voice.",
    tip: "The more detail you give each character, the more consistent the AI-generated dialogue will be.",
    color: "#059669",
    action: { label: "Manage Characters →", path: "/characters" },
  },
  {
    icon: "🎵",
    title: "Post-Production Sound",
    description:
      "Add professional sound to your film. Use the Film Post-Production tool to layer ADR (re-recorded dialogue), Foley (ambient sounds), and a Score (AI-generated music cues). Mix all tracks in the Mix Panel.",
    tip: "AI suggestions for ADR, Foley, and Score are available inside each project — each costs a small number of credits.",
    color: "#dc2626",
    action: null,
  },
  {
    icon: "🌍",
    title: "Subtitles & Funding",
    description:
      "Export your film with subtitles in 130+ languages using the Subtitles tool. When you're ready to fund your project, browse 94 international film funds in the Funding Directory and generate a professional application package.",
    tip: "The Funding Directory application is a working pack — always verify exact requirements on each fund's live portal before submitting.",
    color: "#d97706",
    action: { label: "Browse Funding Directory →", path: "/funding" },
  },
];

interface OnboardingOverlayProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export default function OnboardingOverlay({ forceShow = false, onClose }: OnboardingOverlayProps = {}) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [doNotShow, setDoNotShow] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (forceShow) { setVisible(true); return; }
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleClose = () => {
    if (doNotShow) localStorage.setItem(ONBOARDING_KEY, "true");
    setVisible(false);
    onClose?.();
  };

  const handleFinish = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setVisible(false);
    onClose?.();
  };

  const goToAction = (path: string) => {
    handleFinish();
    setLocation(path);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full transition-colors duration-300" style={{ backgroundColor: current.color }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663418605762/hxRQQgsmyjgcByim.png"
              alt="Virelle Studios"
              className="w-7 h-7 rounded-lg"
            />
            <span className="text-sm font-semibold text-foreground">Virelle Studios — Getting Started</span>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-surface"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step progress dots */}
        <div className="flex items-center gap-1.5 px-6 pb-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 8,
                backgroundColor: i === step ? current.color : i < step ? current.color + "70" : "#334155",
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-2">
          <div className="flex flex-col items-center text-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
              style={{ backgroundColor: current.color + "18", border: `1px solid ${current.color}35` }}
            >
              {current.icon}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: current.color }}>
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
            </div>
            <div
              className="w-full rounded-xl p-3.5 text-left"
              style={{ backgroundColor: current.color + "0d", border: `1px solid ${current.color}22` }}
            >
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold" style={{ color: current.color }}>Tip: </span>
                {current.tip}
              </p>
            </div>
            {current.action && (
              <button
                onClick={() => goToAction(current.action!.path)}
                className="text-xs font-medium underline underline-offset-2 transition-colors"
                style={{ color: current.color }}
              >
                {current.action.label}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pt-4 pb-6 space-y-3">
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button
              onClick={isLast ? handleFinish : () => setStep((s) => s + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ backgroundColor: current.color }}
            >
              {isLast ? (
                <><CheckCircle2 className="h-4 w-4" />Start Creating</>
              ) : (
                <>Next<ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
          <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={doNotShow}
              onChange={(e) => setDoNotShow(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer"
            />
            <span className="text-xs text-muted-foreground">Do not show this again</span>
          </label>
        </div>
      </div>
    </div>
  );
}


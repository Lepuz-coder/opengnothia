import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface BreathingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const phases = [
  { label: "Nefes Al", duration: 4 },
  { label: "Tut", duration: 7 },
  { label: "Nefes Ver", duration: 8 },
];

export function BreathingOverlay({ isOpen, onClose }: BreathingOverlayProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setPhaseIndex(0);
    setCount(0);
    setCycle(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCount((prev) => {
        const currentDuration = phases[phaseIndex].duration;
        if (prev + 1 >= currentDuration) {
          setPhaseIndex((pi) => {
            if (pi + 1 >= phases.length) {
              setCycle((c) => c + 1);
              return 0;
            }
            return pi + 1;
          });
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, phaseIndex]);

  if (!isOpen) return null;

  const phase = phases[phaseIndex];
  const progress = (count + 1) / phase.duration;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white">
        <X className="w-6 h-6" />
      </button>

      <div className="text-center text-white">
        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="4"
              strokeDasharray={`${progress * 283} 283`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-light">{phase.duration - count}</span>
          </div>
        </div>

        <p className="text-2xl font-light mb-2">{phase.label}</p>
        <p className="text-white/40 text-sm">Döngü {cycle + 1}</p>
      </div>
    </div>
  );
}

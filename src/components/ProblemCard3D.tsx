import React, { useRef, useState } from 'react';

interface ProblemCardProps {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  acceptance: string;
  tags: string[];
  solved?: boolean;
  onSolve?: (id: string) => void;
}

export const ProblemCard3D: React.FC<ProblemCardProps> = ({
  id,
  title,
  difficulty,
  acceptance,
  tags,
  solved = false,
  onSolve
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const rotateX = (((e.clientY - rect.top) - rect.height / 2) / (rect.height / 2)) * -10;
    const rotateY = (((e.clientX - rect.left) - rect.width / 2) / (rect.width / 2)) * 10;
    setRotation({ x: rotateX, y: rotateY });
  };

  const difficultyColors = {
    Easy: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', glow: 'rgba(16, 185, 129, 0.2)' },
    Medium: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', glow: 'rgba(245, 158, 11, 0.2)' },
    Hard: { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30', glow: 'rgba(244, 63, 94, 0.2)' }
  }[difficulty];

  return (
    <div className="perspective-1000 w-full">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setRotation({ x: 0, y: 0 }); setIsHovered(false); }}
        style={{
          transform: isHovered
            ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(10px)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
          boxShadow: isHovered
            ? `0 24px 48px -12px ${difficultyColors.glow}`
            : '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
        className="preserve-3d relative rounded-2xl glass-panel-3d p-6 border border-white/10 transition-transform duration-150 ease-out flex flex-col justify-between h-56"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${difficultyColors.badge}`}>
              {difficulty}
            </span>
            {solved && (
              <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                Solved
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-slate-400">Acc: {acceptance}</span>
        </div>

        <div className="my-auto">
          <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <span key={tag} className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-white/5">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex justify-end">
          <button
            onClick={() => onSolve?.(id)}
            className="btn-tactile-primary px-4 py-1.5 rounded-lg text-xs font-bold text-white tracking-wider"
          >
            CODE SOLUTION →
          </button>
        </div>
      </div>
    </div>
  );
};

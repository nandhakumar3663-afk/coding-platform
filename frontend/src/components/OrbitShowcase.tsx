import React from 'react';
import { Braces, CheckCircle2, Code2, Terminal, Zap } from 'lucide-react';

/**
 * Lightweight CSS-3D artwork for the practice landing page.
 * It is decorative by design: all real navigation and progress remain in the
 * semantic UI around it, and the scene does not require WebGL or a GPU.
 */
export const OrbitShowcase: React.FC = () => (
  <div className="orbit-scene" aria-hidden="true">
    <div className="orbit-stage">
      <div className="orbit-halo orbit-halo-back" />
      <div className="orbit-halo orbit-halo-front" />
      <div className="orbit-planet orbit-planet-violet" />
      <div className="orbit-planet orbit-planet-cyan" />
      <div className="orbit-planet orbit-planet-coral" />

      <div className="orbit-code-window">
        <div className="orbit-window-toolbar">
          <span className="window-dot window-dot-coral" />
          <span className="window-dot window-dot-amber" />
          <span className="window-dot window-dot-green" />
          <span className="orbit-file-name"><Code2 size={13} /> solution.cpp</span>
          <span className="orbit-live-pill"><span /> LIVE</span>
        </div>
        <div className="orbit-editor">
          <div className="orbit-code-line"><span className="orbit-line-number">01</span><span className="code-purple">#include</span> <span className="code-mint">&lt;iostream&gt;</span></div>
          <div className="orbit-code-line"><span className="orbit-line-number">02</span><span className="code-muted">// small steps, big wins</span></div>
          <div className="orbit-code-line"><span className="orbit-line-number">03</span><span className="code-pink">int</span> <span className="code-yellow">main</span><span className="code-white">() {'{'}</span></div>
          <div className="orbit-code-line orbit-indent"><span className="orbit-line-number">04</span><span className="code-purple">  int</span> <span className="code-white">solved = </span><span className="code-cyan">1</span><span className="code-white">;</span></div>
          <div className="orbit-code-line orbit-indent"><span className="orbit-line-number">05</span><span className="code-purple">  return</span> <span className="code-white">solved;</span></div>
          <div className="orbit-code-line"><span className="orbit-line-number">06</span><span className="code-white">{'}'}</span><span className="orbit-cursor" /></div>
        </div>
        <div className="orbit-window-footer">
          <span><Terminal size={12} /> C++17</span>
          <span className="orbit-pass"><CheckCircle2 size={13} /> All samples passed</span>
        </div>
      </div>

      <div className="orbit-float-card orbit-streak-card">
        <span className="orbit-card-icon"><Zap size={15} /></span>
        <span><strong>Keep the streak</strong><small>One problem at a time</small></span>
      </div>
      <div className="orbit-float-card orbit-braces-card">
        <span className="orbit-braces-icon"><Braces size={19} /></span>
        <span><strong>Think in patterns</strong><small>Practice makes progress</small></span>
      </div>
      <div className="orbit-center-mark"><Code2 size={30} strokeWidth={2.2} /></div>
      <span className="orbit-spark orbit-spark-one" />
      <span className="orbit-spark orbit-spark-two" />
      <span className="orbit-spark orbit-spark-three" />
    </div>
    <div className="orbit-caption"><span className="orbit-caption-dot" /> YOUR NEXT SOLUTION IS CLOSER THAN YOU THINK</div>
  </div>
);

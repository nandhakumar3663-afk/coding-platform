import React from 'react';
import './ui-refresh.css';
import { Navbar3D } from './components/Navbar3D';
import { ProblemCard3D } from './components/ProblemCard3D';
import { Compiler3D } from './components/Compiler3D';
import { Leaderboard3D } from './components/Leaderboard3D';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      <Navbar3D />
      <main className="w-full max-w-7xl px-4 py-8 space-y-12">
        <section>
          <h2 className="text-xl font-bold mb-4 tracking-tight">Featured Challenges</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProblemCard3D id="1" title="Two Sum" difficulty="Easy" acceptance="54.2%" tags={["Array", "Hash Table"]} solved />
            <ProblemCard3D id="2" title="Longest Palindromic Substring" difficulty="Medium" acceptance="34.8%" tags={["String", "DP"]} />
            <ProblemCard3D id="3" title="Trapping Rain Water" difficulty="Hard" acceptance="21.5%" tags={["Two Pointers", "Stack"]} />
          </div>
        </section>
        <section><Compiler3D /></section>
        <section><Leaderboard3D /></section>
      </main>
    </div>
  );
}

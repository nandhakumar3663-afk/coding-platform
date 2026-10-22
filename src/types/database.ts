export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  acceptance: string;
  tags: string[];
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  score: number;
  problems_solved: number;
  streak: number;
  rank?: number;
}

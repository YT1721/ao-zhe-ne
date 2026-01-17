
export type Tab = 'home' | 'benefits' | 'profile';

export interface WorkItem {
  id: string;
  type: 'photo' | 'video';
  title: string;
  imageUrl: string;
  date: string;
  createdAt: number; // 用于计算 24 小时存续期
}

export interface RestorationState {
  step: 1 | 2;
  originalImage: string | null;
  restoredImage: string | null;
  isProcessing: boolean;
  aiAnalysis?: string;
}

export interface UserStats {
  energy: number;
  level: string;
  checkInDays: number;
  totalRestored: number;
  invites: number;
}

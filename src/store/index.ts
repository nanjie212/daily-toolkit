import { create } from 'zustand';
import type { ToolRecord, CategoryRecord } from '@/types';
import { loadAllTools } from '@/engine/ToolLoader';
import { categories } from '@/tools/categories';
import { safeStorage } from '@/lib/safeStorage';

interface ToolBoxState {
  tools: ToolRecord[];
  categories: CategoryRecord[];
  recentToolIds: string[];
  favoriteToolIds: string[];
  searchQuery: string;
  selectedCategory: string | null;
  selectedTool: ToolRecord | null;
  detailOpen: boolean;
  theme: 'dark' | 'light';

  toolLikes: Record<string, number>;
  toolFeedbacks: Record<string, string[]>;

  addTool: (tool: ToolRecord) => void;
  removeTool: (id: string) => void;
  selectTool: (tool: ToolRecord | null) => void;
  toggleFavorite: (id: string) => void;
  likeTool: (toolId: string) => void;
  addFeedback: (toolId: string, feedback: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setDetailOpen: (open: boolean) => void;
  updateRecentUse: (id: string) => void;
  reloadTools: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

const RECENT_KEY = 'toolbox_recent_tools';
const FAVORITE_KEY = 'toolbox_favorite_tools';
const LIKES_KEY = 'toolbox_tool_likes';
const FEEDBACKS_KEY = 'toolbox_tool_feedbacks';

function loadFromStorage<T>(key: string, fallback: T): T {
  return safeStorage.getJSON(key, fallback);
}

function saveToStorage(key: string, value: unknown): void {
  safeStorage.setJSON(key, value);
}

export const useStore = create<ToolBoxState>((set, get) => ({
  tools: loadAllTools(),
  categories,
  recentToolIds: loadFromStorage<string[]>(RECENT_KEY, []),
  favoriteToolIds: loadFromStorage<string[]>(FAVORITE_KEY, []),
  searchQuery: '',
  selectedCategory: null,
  selectedTool: null,
  detailOpen: false,
  theme: safeStorage.getJSON('toolbox-theme', 'dark') as 'dark' | 'light',
  toolLikes: loadFromStorage<Record<string, number>>(LIKES_KEY, {}),
  toolFeedbacks: loadFromStorage<Record<string, string[]>>(FEEDBACKS_KEY, {}),

  addTool: (tool) =>
    set((state) => {
      const tools = [...state.tools, { ...tool, installedAt: Date.now() }];
      return { tools };
    }),

  removeTool: (id) =>
    set((state) => ({
      tools: state.tools.filter((t) => t.id !== id),
      favoriteToolIds: state.favoriteToolIds.filter((fid) => fid !== id),
      recentToolIds: state.recentToolIds.filter((rid) => rid !== id),
    })),

  selectTool: (tool) => set({ selectedTool: tool }),

  toggleFavorite: (id) =>
    set((state) => {
      const favorites = state.favoriteToolIds.includes(id)
        ? state.favoriteToolIds.filter((fid) => fid !== id)
        : [...state.favoriteToolIds, id];
      saveToStorage(FAVORITE_KEY, favorites);
      return { favoriteToolIds: favorites };
    }),

  likeTool: (toolId) => {
    const current = get().toolLikes[toolId] || 0;
    const toolLikes = { ...get().toolLikes, [toolId]: current + 1 };
    saveToStorage(LIKES_KEY, toolLikes);
    set({ toolLikes });
  },

  addFeedback: (toolId, feedback) => {
    const current = get().toolFeedbacks[toolId] || [];
    const toolFeedbacks = { ...get().toolFeedbacks, [toolId]: [...current, feedback] };
    saveToStorage(FEEDBACKS_KEY, toolFeedbacks);
    set({ toolFeedbacks });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  setDetailOpen: (open) => set({ detailOpen: open }),

  updateRecentUse: (id) =>
    set((state) => {
      const recent = [id, ...state.recentToolIds.filter((rid) => rid !== id)].slice(0, 10);
      saveToStorage(RECENT_KEY, recent);
      return { recentToolIds: recent };
    }),

  reloadTools: () => set({ tools: loadAllTools() }),

  setTheme: (theme) => {
    set({ theme });
    saveToStorage('toolbox-theme', theme);
    document.documentElement.classList.toggle('light', theme === 'light');
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },
}));

const initTheme = useStore.getState().theme;
if (initTheme === 'light') {
  document.documentElement.classList.add('light');
}

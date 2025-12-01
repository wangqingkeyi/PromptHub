import { create } from 'zustand';
import type { Folder, CreateFolderDTO, UpdateFolderDTO } from '../types';
import * as db from '../services/database';

interface FolderState {
  folders: Folder[];
  selectedFolderId: string | null;
  expandedIds: Set<string>;

  // Actions
  fetchFolders: () => Promise<void>;
  createFolder: (data: CreateFolderDTO) => Promise<Folder>;
  updateFolder: (id: string, data: UpdateFolderDTO) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  selectFolder: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  reorderFolders: (ids: string[]) => Promise<void>;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  selectedFolderId: null,
  expandedIds: new Set(),

  fetchFolders: async () => {
    try {
      const folders = await db.getAllFolders();
      set({ folders });
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  },

  createFolder: async (data) => {
    const folder = await db.createFolder({
      ...data,
      order: get().folders.length,
    });
    set((state) => ({ folders: [...state.folders, folder] }));
    return folder;
  },

  updateFolder: async (id, data) => {
    set((state) => ({
      folders: state.folders.map((f) => (f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString() } : f)),
    }));
  },

  deleteFolder: async (id) => {
    await db.deleteFolder(id);
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      selectedFolderId:
        state.selectedFolderId === id ? null : state.selectedFolderId,
    }));
  },

  selectFolder: (id) => set({ selectedFolderId: id }),

  toggleExpand: (id) =>
    set((state) => {
      const newExpanded = new Set(state.expandedIds);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { expandedIds: newExpanded };
    }),

  reorderFolders: async (ids) => {
    set((state) => ({
      folders: ids.map((id, index) => {
        const folder = state.folders.find((f) => f.id === id)!;
        return { ...folder, order: index };
      }),
    }));
  },
}));

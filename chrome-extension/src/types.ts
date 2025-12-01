/**
 * Prompt core type definitions
 */

export interface Prompt {
  id: string;
  title: string;
  description?: string;
  systemPrompt?: string;
  userPrompt: string;
  variables: Variable[];
  tags: string[];
  folderId?: string;
  isFavorite: boolean;
  version: number;
  usageCount: number;
  createdAt: string;  // ISO 8601 format
  updatedAt: string;  // ISO 8601 format
}

export interface Variable {
  name: string;
  type: VariableType;
  label?: string;
  defaultValue?: string;
  options?: string[]; // for select type
  required: boolean;
}

export type VariableType = 'text' | 'textarea' | 'number' | 'select';

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  systemPrompt?: string;
  userPrompt: string;
  variables: Variable[];
  note?: string;
  createdAt: string;  // ISO 8601 format
}

// DTO Types
export interface CreatePromptDTO {
  title: string;
  description?: string;
  systemPrompt?: string;
  userPrompt: string;
  variables?: Variable[];
  tags?: string[];
  folderId?: string;
}

export interface UpdatePromptDTO {
  title?: string;
  description?: string;
  systemPrompt?: string;
  userPrompt?: string;
  variables?: Variable[];
  tags?: string[];
  folderId?: string;
  isFavorite?: boolean;
}

/**
 * Folder type definitions
 */

export interface Folder {
  id: string;
  name: string;
  icon?: string; // emoji
  parentId?: string;
  order: number;
  createdAt: string;  // ISO 8601 format
  updatedAt: string;  // ISO 8601 format
}

export interface CreateFolderDTO {
  name: string;
  icon?: string;
  parentId?: string;
}

export interface UpdateFolderDTO {
  name?: string;
  icon?: string;
  parentId?: string;
  order?: number;
}

/**
 * Settings type definitions
 */

export interface Settings {
  theme: Theme;
  language: Language;
  autoSave: boolean;
  defaultFolderId?: string;
}

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'zh';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'zh',
  autoSave: true,
};

// AI Model types
export type AIModelType = 'chat' | 'image';

export interface AIModelConfig {
  id: string;
  type: AIModelType;
  name?: string;
  provider: string;
  apiKey: string;
  apiUrl: string;
  model: string;
  isDefault?: boolean;
}

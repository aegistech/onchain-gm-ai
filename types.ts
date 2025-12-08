export enum AppMode {
  GM_TEXT = 'GM_TEXT',
  GM_IMAGE = 'GM_IMAGE',
}

export interface GeneratedContent {
  text?: string;
  imageUrl?: string;
}

export interface HistoryItem {
  id: string;
  mode: AppMode;
  prompt: string;
  result: GeneratedContent;
  timestamp: number;
}

export enum AppTab {
  BRAND = 'brand',
  GENERATOR = 'generator',
  DEVELOPMENT = 'development',
  GALLERY = 'gallery'
}

export interface Asset {
  id: string;
  url: string;
  type: 'render' | 'reference' | 'video';
  timestamp: number;
  metadata: {
    prompt?: string;
    dimensions?: { w: number; h: number; d: number };
    brandStyle?: string;
    lighting?: string;
    viewName?: string;
  };
}

export interface ProductReference {
  id: string;
  url: string;
  description: string;
  mimeType: string;
}

export interface HumanModel {
  id: string;
  gender: 'male' | 'female';
  interaction: string;
  referenceUrl?: string;
}

export interface BrandContext {
  name: string;
  sector: string;
  market: string;
  aesthetic: string;
  systemPrompt: string;
}

export interface WorkspaceState {
  handle: FileSystemDirectoryHandle | null;
  path: string;
  status: 'disconnected' | 'connected';
}

export type LightingType = 'Soft' | 'Studio' | 'Natural' | 'Dramatic' | 'Custom';

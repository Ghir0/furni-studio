
import React from 'react';

export const VIEW_TYPES = [
  'Frontal', 'Laterale', 'Macro', 'Retro', 'Wide', 'Tre Quarti', 
  'Altezza Seduta', 'Prospettiva Angolare', 'Zenitale', 'Framing'
];

export const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9", "21:9"];
export const IMAGE_SIZES = ["1K", "2K", "4K"];

export const LIGHTING_OPTIONS: { label: string; value: string }[] = [
  { label: 'Soft (Morbida)', value: 'Soft' },
  { label: 'Studio (Professionale)', value: 'Studio' },
  { label: 'Natural (Luce Naturale)', value: 'Natural' },
  { label: 'Dramatic (Contrastata)', value: 'Dramatic' },
  { label: 'Custom (Manuale)', value: 'Custom' },
];

export const Icons = {
  Brand: () => <i className="fas fa-fingerprint"></i>,
  Generator: () => <i className="fas fa-magic"></i>,
  Development: () => <i className="fas fa-flask"></i>,
  Gallery: () => <i className="fas fa-images"></i>,
  Settings: () => <i className="fas fa-cog"></i>,
  Plus: () => <i className="fas fa-plus"></i>,
  Trash: () => <i className="fas fa-trash"></i>,
  Download: () => <i className="fas fa-download"></i>,
  Save: () => <i className="fas fa-save"></i>,
  Refresh: () => <i className="fas fa-sync"></i>,
  Model: () => <i className="fas fa-user-friends"></i>,
  Layers: () => <i className="fas fa-layer-group"></i>,
  Camera: () => <i className="fas fa-camera"></i>,
  Light: () => <i className="fas fa-lightbulb"></i>,
  Box: () => <i className="fas fa-box"></i>,
};

import type { FurnitureType } from '../types';

export const FURNITURE_CATALOG: FurnitureType[] = [
  { id: 'bed-single', label: 'Single Bed', category: 'bedroom', icon: 'mdi:bed', defaultWidth: 900, defaultDepth: 2000, defaultHeight: 500 },
  { id: 'bed-double', label: 'Double Bed', category: 'bedroom', icon: 'mdi:bed-double', defaultWidth: 1400, defaultDepth: 2000, defaultHeight: 500 },
  { id: 'bed-king', label: 'King Bed', category: 'bedroom', icon: 'mdi:bed-king', defaultWidth: 1800, defaultDepth: 2000, defaultHeight: 500 },
  { id: 'nightstand', label: 'Nightstand', category: 'bedroom', icon: 'mdi:table-furniture', defaultWidth: 450, defaultDepth: 450, defaultHeight: 500 },
  { id: 'wardrobe', label: 'Wardrobe', category: 'bedroom', icon: 'mdi:wardrobe', defaultWidth: 1200, defaultDepth: 600, defaultHeight: 2000 },
  { id: 'sofa-2seat', label: '2-Seat Sofa', category: 'living-room', icon: 'mdi:sofa', defaultWidth: 1600, defaultDepth: 900, defaultHeight: 800 },
  { id: 'sofa-3seat', label: '3-Seat Sofa', category: 'living-room', icon: 'mdi:sofa', defaultWidth: 2200, defaultDepth: 900, defaultHeight: 800 },
  { id: 'armchair', label: 'Armchair', category: 'living-room', icon: 'mdi:seat', defaultWidth: 900, defaultDepth: 900, defaultHeight: 800 },
  { id: 'coffee-table', label: 'Coffee Table', category: 'living-room', icon: 'mdi:table', defaultWidth: 1200, defaultDepth: 600, defaultHeight: 400 },
  { id: 'tv-stand', label: 'TV Stand', category: 'living-room', icon: 'mdi:television', defaultWidth: 1600, defaultDepth: 450, defaultHeight: 500 },
  { id: 'bookshelf', label: 'Bookshelf', category: 'living-room', icon: 'mdi:bookshelf', defaultWidth: 800, defaultDepth: 300, defaultHeight: 1800 },
  { id: 'desk', label: 'Desk', category: 'office', icon: 'mdi:desk', defaultWidth: 1400, defaultDepth: 700, defaultHeight: 750 },
  { id: 'office-chair', label: 'Office Chair', category: 'office', icon: 'mdi:seat', defaultWidth: 600, defaultDepth: 600, defaultHeight: 1100 },
  { id: 'dining-table-4', label: 'Dining Table (4)', category: 'dining', icon: 'mdi:table-chair', defaultWidth: 1200, defaultDepth: 800, defaultHeight: 750 },
  { id: 'dining-table-6', label: 'Dining Table (6)', category: 'dining', icon: 'mdi:table-chair', defaultWidth: 1800, defaultDepth: 900, defaultHeight: 750 },
  { id: 'dining-chair', label: 'Dining Chair', category: 'dining', icon: 'mdi:chair-rolling', defaultWidth: 450, defaultDepth: 500, defaultHeight: 900 },
];

export function getFurnitureByCategory(category: string): FurnitureType[] {
  if (category === 'all') return FURNITURE_CATALOG;
  return FURNITURE_CATALOG.filter(f => f.category === category);
}

export function getFurnitureById(id: string): FurnitureType | undefined {
  return FURNITURE_CATALOG.find(f => f.id === id);
}

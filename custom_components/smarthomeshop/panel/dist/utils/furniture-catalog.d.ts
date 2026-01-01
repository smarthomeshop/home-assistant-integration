import type { FurnitureType } from '../types';
export declare const FURNITURE_CATALOG: FurnitureType[];
export declare function getFurnitureByCategory(category: string): FurnitureType[];
export declare function getFurnitureById(id: string): FurnitureType | undefined;

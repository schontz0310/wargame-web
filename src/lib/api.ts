// Wargame API Service - Routes through Next.js proxy to avoid CORS
const API_BASE_URL = typeof window === 'undefined'
  ? process.env.NEXT_PUBLIC_API_BASE_URL
  : '/api/proxy';

export interface ColorMeaning {
  id: string;
  colorId: string;
  meaning: string;
  description: string;
  context: string;
  usageType: string;
  color: {
    id: string;
    name: string;
    hexCode: string;
  };
}

export interface AttackStat {
  unitId: string;
  attackType: "primary" | "secondary";
  damageType: "ballistic" | "energetic" | "melee";
  targetCount: number;
  minRange: number;
  maxRange: number;
}

export interface CombatDialStep {
  unitId: string;
  step: number;
  marker: "none" | "black" | "green";
  primaryValue: number;
  secondaryValue: number;
  movementValue: number;
  defenseValue: number;
  attackValue: number;
  primaryEquipType: string;
  primaryEquipColorMeaningId?: string;
  primaryEquipUsageType?: "standard" | "single-use" | "unknown";
  secondaryEquipType?: string;
  secondaryEquipColorMeaningId?: string;
  secondaryEquipUsageType?: "standard" | "single-use" | "unknown";
  movementEquipType: string;
  movementEquipColorMeaningId?: string;
  movementEquipUsageType?: "standard" | "single-use" | "unknown";
  defenseEquipType: string;
  defenseEquipColorMeaningId?: string;
  defenseEquipUsageType?: "standard" | "single-use" | "unknown";
  attackEquipType?: string;
  attackEquipColorMeaningId?: string;
  attackEquipUsageType?: "standard" | "single-use" | "unknown";
}

export interface HeatDialStep {
  unitId: string;
  step: number;
  primaryHeatValue: number;
  primaryHeatColorMeaningId?: string;
  secondaryHeatValue: number;
  secondaryHeatColorMeaningId?: string;
  movementHeatValue: number;
  movementHeatColorMeaningId?: string;
}

export interface DraftUnit {
  id: string;
  name: string;
  points: number;
  faction: string;
  type: string;
  quantity: number;
  expansion?: string;
  collectionNumber?: string;
}

export interface DraftBoosterConfig {
  unitType: string; // 'Infantry', 'Vehicle', 'Mech', etc.
  quantity: number;
}

export interface DraftSettings {
  numberOfPlayers: number;
  boostersPerPlayer: number;
  boosterConfigs: DraftBoosterConfig[];
  useCollection: boolean; // true = use my-collection, false = use search results
  respectFilters: boolean; // respect current page filters
}

export interface DraftResult {
  playerId: number;
  playerName: string;
  units: DraftUnit[];
  totalPoints: number;
}

export interface DraftUnitWithQuantity {
  unit: Unit;
  quantity: number;
}

export interface Draft {
  id: string;
  name: string;
  description?: string;
  settings: DraftSettings;
  availableUnits: DraftUnitWithQuantity[]; // Units that can be drafted with quantities
  results: DraftResult[];
  sourceFilters?: Record<string, unknown>; // Store the filters used when generating
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string; // Format: EXPANSION-TYPE-NUMBER (e.g., AOD-F-001)
  name: string;
  type: "F" | "P" | "G" | "S" | "C" | "MC"; // F=Faction Pride, P=Pilot, G=Gear, S=Special, C=Command, MC=Mercenary Contract
  typeName: "Faction Pride" | "Pilot" | "Gear" | "Special" | "Command" | "Mercenary Contract";
  cost: string | number; // Can be string like "10/150" or number
  alternativeCost?: string | number; // Optional alternative cost
  haveAlternativeCost?: boolean; // Optional flag for alternative cost
  haveLogo?: boolean; // Optional flag for faction logo
  haveSeeText?: boolean; // Optional flag for see text
  faction: string;
  factionLogoVersion?: "standard" | "blue" | "gray" | "black";
  rarity: "Common" | "Uncommon" | "Rare" | "Ultra Rare" | "Promo";
  expansion: string; // e.g., "AOD", "DA", "FI"
  collectionNumber: string; // e.g., "001", "002", etc.
  imageUrl: string;
  description: string;
  flavorText?: string;
  keywords?: string[];
  requirements?: string[];
  effects?: CardEffect[];
  isUnique: boolean;
  cardModel?: string; // e.g. 'single', 'double'
  frontImage?: string; // override card front image path
  backImage?: string;  // override card back image path
  contractText?: string; // mercenary contract text
  variant?: string;
  // Back side properties
  backImageUrl?: string;
  backDescription?: string;
  backFlavorText?: string;
  backEffects?: CardEffect[];
  backKeywords?: string[];
}

export interface IFactionPride {
  id: string;
  cardId: string;
  type: string;
  faction: string;
  expansion: string;
  collectionNumber: string;
  description: string;
  flavorText?: string | null;
  cost: string;
  alternativeCost?: string | null;
  haveAlternativeCost: boolean;
  haveSeeText: boolean;
  haveLogo: boolean;
  logoVariant: string;
  createdAt: string;
  updatedAt: string;
}

export interface FactionPridesResponse {
  factionPrides: IFactionPride[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FactionPridesFilters {
  page?: number;
  limit?: number;
  faction?: string;
  expansion?: string;
  type?: string;
  logoVariant?: string;
  haveSeeText?: boolean;
  haveLogo?: boolean;
  search?: string;
}


export interface IMercenaryContract {
  id: string;
  cardId: string;
  type: string;
  faction: string;
  expansion: string;
  collectionNumber: string;
  description: string;
  flavorText?: string | null;
  cost: string;
  alternativeCost?: string | null;
  haveAlternativeCost?: boolean;
  haveSeeText?: boolean;
  haveLogo?: boolean;
  logoVariant?: string;
  cardModel: string;
  contractText?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MercenaryContractsResponse {
  mercenaryContracts: IMercenaryContract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MercenaryContractsFilters {
  page?: number;
  limit?: number;
  faction?: string;
  expansion?: string;
  cardModel?: string;
  search?: string;
}

export interface CardEffect {
  type: "passive" | "active" | "triggered";
  timing?: "deployment" | "combat" | "end_turn" | "start_turn";
  description: string;
  target?: string;
  condition?: string;
}

export interface Unit {
  id: string;
  name: string;
  type: string;
  speedMode: string;
  class: string;
  points: number;
  health: number;
  faction: string;
  frontArc: string;
  rearArc: string;
  maxSpeed: number;
  ventCapacity: number;
  maxAttack: number;
  maxDefense: number;
  maxDamage: number;
  variant: string;
  isUnique: boolean;
  rank: "Elite" | "Green" | "Veteran" | "NA";
  expansion: string;
  imageUrl: string;
  collectionNumber: number;
  attackStats?: AttackStat[];
  combatDial?: CombatDialStep[];
  heatDial?: HeatDialStep[];
}

export interface ApiResponse {
  units: Unit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: unknown) {
      throw error;
    }
  }

  // Get all units with pagination support
  async getUnits(page: number = 1, limit: number = 100): Promise<Unit[]> {
    try {
      const response = await this.request<ApiResponse>(`/units?page=${page}&limit=${limit}`);
      return response.units;
    } catch {
      return []; // Return empty array on error
    }
  }

  // Get all units across all pages
  async getAllUnits(): Promise<Unit[]> {
    try {
      const firstPage = await this.request<ApiResponse>('/units?page=1&limit=100');
      const allUnits = [...firstPage.units];
      
      // If there are more pages, fetch them
      if (firstPage.pagination.totalPages > 1) {
        const promises = [];
        for (let page = 2; page <= firstPage.pagination.totalPages; page++) {
          promises.push(this.request<ApiResponse>(`/units?page=${page}&limit=100`));
        }
        
        const additionalPages = await Promise.all(promises);
        additionalPages.forEach(pageResponse => {
          allUnits.push(...pageResponse.units);
        });
      }
      
      return allUnits;
    } catch (error) {
      throw error; // Re-throw to trigger error handling in useUnits
    }
  }

  // Get unit by ID
  async getUnit(id: string): Promise<Unit | null> {
    try {
      const unit = await this.request<Unit>(`/units/${id}`);
      return unit;
    } catch (error: unknown) {
      console.error(`Failed to fetch unit with id ${id}:`, error);
      return null;
    }
  }

  // Search units by name
  async searchUnits(query: string): Promise<Unit[]> {
    return this.request<Unit[]>(`/units/search?q=${encodeURIComponent(query)}`);
  }

  // Get units by faction
  async getUnitsByFaction(faction: string): Promise<Unit[]> {
    return this.request<Unit[]>(`/units/faction/${faction}`);
  }

  // Get faction prides with filters and pagination
  async getFactionPrides(filters: FactionPridesFilters = {}): Promise<FactionPridesResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.faction) params.set('faction', filters.faction);
    if (filters.expansion) params.set('expansion', filters.expansion);
    if (filters.type) params.set('type', filters.type);
    if (filters.logoVariant) params.set('logoVariant', filters.logoVariant);
    if (filters.haveSeeText !== undefined) params.set('haveSeeText', String(filters.haveSeeText));
    if (filters.haveLogo !== undefined) params.set('haveLogo', String(filters.haveLogo));
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    return this.request<FactionPridesResponse>(`/faction-prides${qs ? `?${qs}` : ''}`);
  }

  // Get faction pride by id
  async getFactionPrideById(id: string): Promise<IFactionPride | null> {
    try {
      return await this.request<IFactionPride>(`/faction-prides/${id}`);
    } catch {
      return null;
    }
  }

  // Get mercenary contracts with filters and pagination
  async getMercenaryContracts(filters: MercenaryContractsFilters = {}): Promise<MercenaryContractsResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.faction) params.set('faction', filters.faction);
    if (filters.expansion) params.set('expansion', filters.expansion);
    if (filters.cardModel) params.set('cardModel', filters.cardModel);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    const raw = await this.request<MercenaryContractsResponse | IMercenaryContract[]>(`/mercenary-contracts${qs ? `?${qs}` : ''}`);
    if (Array.isArray(raw)) {
      return { mercenaryContracts: raw, total: raw.length, page: 1, limit: raw.length, totalPages: 1 };
    }
    return raw;
  }

  // Get mercenary contract by id
  async getMercenaryContractById(id: string): Promise<IMercenaryContract | null> {
    try {
      return await this.request<IMercenaryContract>(`/mercenary-contracts/${id}`);
    } catch {
      return null;
    }
  }

  // Get all color meanings for dynamic color mapping
  async getColorMeanings(): Promise<ColorMeaning[]> {
    try {
      const response = await this.request<{ colorMeanings: ColorMeaning[] }>('/color-meanings');
      return response.colorMeanings || [];
    } catch (error) {
      console.error('Failed to fetch color meanings:', error);
      return []; // Return empty array on error
    }
  }
}

export const apiService = new ApiService();

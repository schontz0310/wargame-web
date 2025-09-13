// Wargame API Service - Direct API calls for static export
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
  heatDial?: unknown[];
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
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all units with pagination support
  async getUnits(page: number = 1, limit: number = 100): Promise<Unit[]> {
    try {
      const response = await this.request<ApiResponse>(`/units?page=${page}&limit=${limit}`);
      return response.units;
    } catch (error) {
      console.error('Failed to fetch units:', error);
      return []; // Return empty array on error
    }
  }

  // Get all units across all pages
  async getAllUnits(): Promise<Unit[]> {
    try {
      console.log('ApiService - API_BASE_URL:', API_BASE_URL);
      const firstPage = await this.request<ApiResponse>('/units?page=1&limit=100');
      console.log('ApiService - First page response:', firstPage);
      const allUnits = [...firstPage.units];
      
      // If there are more pages, fetch them
      if (firstPage.pagination.totalPages > 1) {
        console.log('ApiService - Fetching additional pages:', firstPage.pagination.totalPages - 1);
        const promises = [];
        for (let page = 2; page <= firstPage.pagination.totalPages; page++) {
          promises.push(this.request<ApiResponse>(`/units?page=${page}&limit=100`));
        }
        
        const additionalPages = await Promise.all(promises);
        additionalPages.forEach(pageResponse => {
          allUnits.push(...pageResponse.units);
        });
      }
      
      console.log('ApiService - Total units fetched:', allUnits.length);
      return allUnits;
    } catch (error) {
      console.error('ApiService - Failed to fetch all units:', error);
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
}

export const apiService = new ApiService();

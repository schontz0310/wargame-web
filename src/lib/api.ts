// Wargame API Service - Using Next.js API Routes to avoid CORS
const API_BASE_URL = '/api';

export interface AttackStat {
  unitId: string;
  attackType: "primary" | "secondary";
  damageType: "ballistic" | "energy" | "melee";
  targetCount: number;
  minRange: number;
  maxRange: number;
}

export interface CombatDialStep {
  unitId: string;
  step: number;
  marker: string;
  primaryValue: number;
  secondaryValue: number;
  movementValue: number;
  defenseValue: number;
  attackValue: number;
  primaryEquipType: string;
  movementEquipType: string;
  defenseEquipType: string;
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
  rank: "Elite" | "Green" | "Veteran";
  expansion: string;
  imageUrl: string;
  collectionNumber: number;
  attackStats?: AttackStat[];
  combatDial?: CombatDialStep[];
  heatDial?: any[];
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
        headers: {
          'Content-Type': 'application/json',
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
      console.error('Failed to fetch all units:', error);
      throw error; // Re-throw to trigger error handling in useUnits
    }
  }

  // Get unit by ID
  async getUnit(id: string): Promise<Unit> {
    return this.request<Unit>(`/units/${id}`);
  }

  // Get unit details by ID (same as getUnit but more explicit naming)
  async getUnitDetails(id: string): Promise<Unit> {
    return this.getUnit(id);
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

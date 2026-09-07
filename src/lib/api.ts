// Wargame API Service - Direct API calls (required for static export)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
  isCard?: boolean; // Flag to distinguish cards from units
  cardType?: string; // Card type if it's a card
  cardDbId?: string; // Database primary key for card detail navigation
  instanceId?: string; // Stable per-copy id, used to attach a pilot/gear to a specific mech
  attachedInstanceIds?: string[]; // instanceIds of Pilot/Gear cards mounted on this Mech's 2 CEC slots (max 2, at most 1 Pilot)
  class?: string; // Mech's own class, or a Gear/Pilot's class requirement, for attach validation
  factionLeft?: string; // A Pilot's faction requirement(s) (a Gear's sits in `faction`, possibly dash-joined)
  factionRight?: string;
  attachesTo?: string; // A Gear's damage-type requirement (Ballistic/Energy/Melee/Attack/Defense/Speed/Damage)
}

export interface DraftBoosterConfig {
  unitType: string; // 'Infantry', 'Vehicle', 'Mech', 'Card', etc.
  quantity: number;
  cardType?: string; // Optional card type filter: 'F', 'P', 'G', 'S', 'C', 'MC'
}

export interface DraftSettings {
  numberOfPlayers: number;
  boostersPerPlayer: number;
  boosterConfigs: DraftBoosterConfig[];
  useCollection: boolean; // true = use my-collection, false = use search results
  respectFilters: boolean; // respect current page filters
  armyPointLimit?: number; // Point limit for each player's army (0 = no limit)
}

export interface DraftResult {
  playerId: number;
  playerName: string;
  playerAlias?: string; // Custom display alias for the player, falls back to playerName
  units: DraftUnit[]; // Units drafted
  armyUnits: DraftUnit[]; // Units actually in the army (can be modified)
  totalPoints: number;
  armyPoints: number; // Points of army units
  armyPointsLimit?: number; // Optional point limit for the army
}

export interface DraftUnitWithQuantity {
  unit: Unit;
  quantity: number;
}

export interface DraftCardWithQuantity {
  card: Card;
  quantity: number;
}

export interface Draft {
  id: string;
  name: string;
  description?: string;
  settings: DraftSettings;
  availableUnits: DraftUnitWithQuantity[]; // Units that can be drafted with quantities
  availableCards?: DraftCardWithQuantity[]; // Cards that can be drafted with quantities
  results: DraftResult[];
  sourceFilters?: Record<string, unknown>; // Store the filters used when generating
  preparationCompleted?: boolean; // Whether the preparation phase has been completed
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string; // Format: EXPANSION-TYPE-NUMBER (e.g., AOD-F-001)
  dbId?: string; // Database primary key (used for detail page navigation)
  name: string;
  type: "F" | "P" | "G" | "S" | "C" | "MC" | "SA" | "PC" | "M"; // F=Faction Pride, P=Pilot, G=Gear, S=Special, C=Command, MC=Mercenary Contract, SA=Situational Alliance, PC=Planetary Condition, M=Mission
  typeName: "Faction Pride" | "Pilot" | "Gear" | "Special" | "Command" | "Mercenary Contract" | "Situational Alliance" | "Planetary Condition" | "Mission";
  cost: string | number; // Can be string like "10/150" or number
  alternativeCost?: string | number; // Optional alternative cost
  haveAlternativeCost?: boolean; // Optional flag for alternative cost
  haveLogo?: boolean; // Optional flag for faction logo
  haveSeeText?: boolean; // Optional flag for see text
  faction: string;
  factionLogoVersion?: "standard" | "blue" | "gray" | "black";
  // Dual-faction cards (e.g. Situational Alliance) carry each side separately
  factionLeft?: string;
  factionLeftLogoVersion?: "standard" | "blue" | "gray" | "black";
  factionRight?: string;
  factionRightLogoVersion?: "standard" | "blue" | "gray" | "black";
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
  class?: string; // Gear/Pilot class restriction (Light/Medium/Heavy/Assault), for mech attach validation
  attachesTo?: string; // Gear's damage-type restriction (Ballistic/Energy/Melee/Attack/Defense/Speed/Damage)
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

export interface ISituationalAlliance {
  id: string;
  cardId: string;
  type: string;
  name: string;
  factionLeft: string;
  factionLeftLogoVariant: string;
  factionRight: string;
  factionRightLogoVariant: string;
  expansion: string;
  collectionNumber: string;
  description: string;
  flavorText?: string | null;
  cost: string;
  createdAt: string;
  updatedAt: string;
}

export interface SituationalAlliancesResponse {
  situationalAlliances: ISituationalAlliance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SituationalAlliancesFilters {
  page?: number;
  limit?: number;
  expansion?: string;
  search?: string;
}

export interface IRecruitCost {
  cost: number;
  label: string;
}

export interface IPilot {
  id: string;
  cardId: string;
  type: string;
  pilotType: "CommonPilot" | "LegendaryPilot" | "GunslingerPilot" | string;
  name: string;
  factionLeft?: string | null;
  factionLeftLogoVariant?: string;
  factionRight?: string | null;
  factionRightLogoVariant?: string;
  expansion: string;
  collectionNumber: string;
  class: string;
  points: number;
  speed: number;
  attack: number;
  defense: number;
  description?: string | null;
  isUnique: boolean;
  rank?: string | null;
  preferredMechId?: string | null;
  costInPreferredMech?: number | null;
  recruitCosts?: IRecruitCost[] | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

// A pilot's points always show as "standard cost / preferred mech cost" when it has one
// (e.g. "21/32"); with no preferred mech it's just the standard cost.
export function pilotPointsLabel(pilot: Pick<IPilot, 'points' | 'costInPreferredMech'>): string {
  return pilot.costInPreferredMech != null ? `${pilot.points}/${pilot.costInPreferredMech}` : `${pilot.points}`;
}

export interface PilotsResponse {
  pilots: IPilot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PilotsFilters {
  page?: number;
  limit?: number;
  faction?: string;
  expansion?: string;
  class?: string;
  pilotType?: string;
  search?: string;
}

export interface IGear {
  id: string;
  cardId: string;
  type: string;
  name: string;
  expansion: string;
  collectionNumber: string;
  class: string;
  points: number;
  isSingleUse: boolean;
  attachesTo: string;
  faction?: string | null;
  effect?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GearsResponse {
  gears: IGear[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GearsFilters {
  page?: number;
  limit?: number;
  faction?: string;
  expansion?: string;
  class?: string;
  attachesTo?: string;
  search?: string;
}

export interface IPlanetaryCondition {
  id: string;
  cardId: string;
  type: string;
  name: string;
  expansion: string;
  collectionNumber: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanetaryConditionsResponse {
  planetaryConditions: IPlanetaryCondition[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlanetaryConditionsFilters {
  page?: number;
  limit?: number;
  expansion?: string;
  search?: string;
}

export interface IMission {
  id: string;
  cardId: string;
  type: string;
  name: string;
  expansion: string;
  collectionNumber: string;
  effect?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MissionsResponse {
  missions: IMission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MissionsFilters {
  page?: number;
  limit?: number;
  expansion?: string;
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
  cargoCapacity: number;
  maxAttack: number;
  maxDefense: number;
  maxDamage: number;
  variant: string;
  isUnique: boolean;
  rank: "Elite" | "Green" | "Veteran" | "NA";
  expansion: string;
  imageUrl: string;
  collectionNumber: number;
  hasArtillery: boolean;
  artilleryRange: number;
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

  // Resolve a unit's id from a mech code like "AOD113" (expansion + collectionNumber,
  // matching the tail of its imageUrl, e.g. .../AOD/AOD113.jpg). Used to link a pilot's
  // preferredMechId to its unit detail page. Tries the given expansion first (cheap),
  // then falls back to scanning all units (used only when that first lookup misses).
  async findUnitIdByMechCode(code: string, expansionHint?: string): Promise<string | null> {
    const scan = async (expansion?: string): Promise<string | null> => {
      let page = 1;
      const suffix = `/${code}.jpg`.toLowerCase();
      while (true) {
        const qs = `limit=100&page=${page}${expansion ? `&expansion=${encodeURIComponent(expansion)}` : ''}`;
        const res = await this.request<ApiResponse>(`/units?${qs}`);
        const match = res.units.find(u => u.imageUrl?.toLowerCase().endsWith(suffix));
        if (match) return match.id;
        if (page >= res.pagination.totalPages) return null;
        page++;
      }
    };
    try {
      if (expansionHint) {
        const found = await scan(expansionHint);
        if (found) return found;
      }
      return await scan(undefined);
    } catch {
      return null;
    }
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

  // Get situational alliances with filters and pagination
  // Note: the backend has no faction filter for this endpoint (factions come in pairs),
  // so faction filtering is done client-side by the caller.
  async getSituationalAlliances(filters: SituationalAlliancesFilters = {}): Promise<SituationalAlliancesResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.expansion) params.set('expansion', filters.expansion);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    const raw = await this.request<{ data: ISituationalAlliance[]; total: number; page: number; limit: number; totalPages: number }>(`/situational-alliances${qs ? `?${qs}` : ''}`);
    return { situationalAlliances: raw.data, total: raw.total, page: raw.page, limit: raw.limit, totalPages: raw.totalPages };
  }

  // Get situational alliance by id
  async getSituationalAllianceById(id: string): Promise<ISituationalAlliance | null> {
    try {
      return await this.request<ISituationalAlliance>(`/situational-alliances/${id}`);
    } catch {
      return null;
    }
  }

  // Get pilots with filters and pagination
  async getPilots(filters: PilotsFilters = {}): Promise<PilotsResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.faction) params.set('faction', filters.faction);
    if (filters.expansion) params.set('expansion', filters.expansion);
    if (filters.class) params.set('class', filters.class);
    if (filters.pilotType) params.set('pilotType', filters.pilotType);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    const raw = await this.request<{ data: IPilot[]; total: number; page: number; limit: number; totalPages: number }>(`/pilots${qs ? `?${qs}` : ''}`);
    return { pilots: raw.data, total: raw.total, page: raw.page, limit: raw.limit, totalPages: raw.totalPages };
  }

  // Get pilot by id
  async getPilotById(id: string): Promise<IPilot | null> {
    try {
      return await this.request<IPilot>(`/pilots/${id}`);
    } catch {
      return null;
    }
  }

  // Get gears with filters and pagination
  async getGears(filters: GearsFilters = {}): Promise<GearsResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.faction) params.set('faction', filters.faction);
    if (filters.expansion) params.set('expansion', filters.expansion);
    if (filters.class) params.set('class', filters.class);
    if (filters.attachesTo) params.set('attachesTo', filters.attachesTo);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    const raw = await this.request<{ data: IGear[]; total: number; page: number; limit: number; totalPages: number }>(`/gears${qs ? `?${qs}` : ''}`);
    return { gears: raw.data, total: raw.total, page: raw.page, limit: raw.limit, totalPages: raw.totalPages };
  }

  // Get gear by id
  async getGearById(id: string): Promise<IGear | null> {
    try {
      return await this.request<IGear>(`/gears/${id}`);
    } catch {
      return null;
    }
  }

  // Get planetary conditions with filters and pagination
  async getPlanetaryConditions(filters: PlanetaryConditionsFilters = {}): Promise<PlanetaryConditionsResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.expansion) params.set('expansion', filters.expansion);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    const raw = await this.request<{ data: IPlanetaryCondition[]; total: number; page: number; limit: number; totalPages: number }>(`/planetary-conditions${qs ? `?${qs}` : ''}`);
    return { planetaryConditions: raw.data, total: raw.total, page: raw.page, limit: raw.limit, totalPages: raw.totalPages };
  }

  // Get planetary condition by id
  async getPlanetaryConditionById(id: string): Promise<IPlanetaryCondition | null> {
    try {
      return await this.request<IPlanetaryCondition>(`/planetary-conditions/${id}`);
    } catch {
      return null;
    }
  }

  // Get missions with filters and pagination
  async getMissions(filters: MissionsFilters = {}): Promise<MissionsResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.expansion) params.set('expansion', filters.expansion);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    const raw = await this.request<{ data: IMission[]; total: number; page: number; limit: number; totalPages: number }>(`/missions${qs ? `?${qs}` : ''}`);
    return { missions: raw.data, total: raw.total, page: raw.page, limit: raw.limit, totalPages: raw.totalPages };
  }

  // Get mission by id
  async getMissionById(id: string): Promise<IMission | null> {
    try {
      return await this.request<IMission>(`/missions/${id}`);
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

import { safeLocalStorage } from './storage';

// Same "have / want" collection pattern already used for units (myHaveCollection /
// myWantCollection), applied to any card type (Faction Pride, Mercenary Contract,
// Situational Alliance, Pilot, Gear, Planetary Condition, Mission).

export type CardListType = 'have' | 'want';

export interface MyCard {
  id: string; // the card's real record id (dbId), used as the identity key
  cardId: string; // display code, e.g. "AOD-F-001"
  name: string;
  cardType: string; // 'F' | 'MC' | 'SA' | 'P' | 'G' | 'PC' | 'M'
  expansion: string;
  collectionNumber: string;
  quantity: number;
}

const STORAGE_KEYS: Record<CardListType, string> = {
  have: 'myHaveCards',
  want: 'myWantCards',
};

export function getCardCollection(listType: CardListType): MyCard[] {
  try {
    return JSON.parse(safeLocalStorage.getItem(STORAGE_KEYS[listType]) || '[]');
  } catch {
    return [];
  }
}

export function saveCardCollection(listType: CardListType, cards: MyCard[]): void {
  safeLocalStorage.setItem(STORAGE_KEYS[listType], JSON.stringify(cards));
}

export function getCardCounts(id: string): { haveCount: number; wantCount: number } {
  const have = getCardCollection('have').find(c => c.id === id);
  const want = getCardCollection('want').find(c => c.id === id);
  return { haveCount: have?.quantity || 0, wantCount: want?.quantity || 0 };
}

export function addCardToCollection(card: Omit<MyCard, 'quantity'>, listType: CardListType): MyCard[] {
  const existing = getCardCollection(listType);
  const idx = existing.findIndex(c => c.id === card.id);
  const updated = idx >= 0
    ? existing.map((c, i) => i === idx ? { ...c, quantity: (c.quantity || 1) + 1 } : c)
    : [...existing, { ...card, quantity: 1 }];
  saveCardCollection(listType, updated);
  return updated;
}

// Removes the card entirely from the given list (matches the units page's behavior:
// there is no per-unit decrement, only "remove from this list").
export function removeCardFromCollection(id: string, listType: CardListType): MyCard[] {
  const updated = getCardCollection(listType).filter(c => c.id !== id);
  saveCardCollection(listType, updated);
  return updated;
}

// The base route for a card's detail page, keyed by its cardType.
export const CARD_TYPE_ROUTES: Record<string, string> = {
  F: '/cards/faction-pride/detail',
  MC: '/cards/mercenary-contract/detail',
  SA: '/cards/situational-alliance/detail',
  P: '/cards/pilot/detail',
  G: '/cards/gear/detail',
  PC: '/cards/planetary-condition/detail',
  M: '/cards/mission/detail',
};

export const CARD_TYPE_LABELS: Record<string, string> = {
  F: 'Faction Pride',
  MC: 'Mercenary Contract',
  SA: 'Situational Alliance',
  P: 'Pilot',
  G: 'Gear',
  PC: 'Planetary Condition',
  M: 'Mission',
};

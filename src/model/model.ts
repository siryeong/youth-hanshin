export interface Account {
  id: string;
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: number;
  name: string;
  phone: string | null;
  birthDate: string | null;
  extra: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Village {
  id: number;
  name: string;
  members: Member[];
  createdAt: string;
  updatedAt: string;
}

export type CafeMenuItemCategoryType = 'coffee' | 'tea' | 'beverage';
export type TemperatureType = 'ice' | 'hot' | null;
export type StrengthType = 'mild' | 'default' | null;
export type CafeMenuItemOptionType = 'temperature' | 'strength';

export interface CafeMenuItemOption {
  temperature: TemperatureType;
  strength: StrengthType;
}

export const CAFE_MENU_ITEM_CATEGORY = {
  COFFEE: 'coffee',
  TEA: 'tea',
  BEVERAGE: 'beverage',
};

export const TEMPERATURE = {
  ICE: 'ice',
  HOT: 'hot',
};

export const STRENGTH = {
  MILD: 'mild',
  DEFAULT: 'default',
};

export interface CafeMenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  requiredOptions: Record<CafeMenuItemOptionType, boolean>;
  category: CafeMenuItemCategoryType;
  createdAt: string;
  updatedAt: string;
}

export type CafeOrderStatus = 'pending' | 'completed';

export const CAFE_ORDER_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
};

export interface CafeOrder {
  id: number;
  village: Village;
  member: Member | null;
  cafeMenuItem: CafeMenuItem;
  customName: string | null;
  options: CafeMenuItemOption;
  status: CafeOrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CafeSetting {
  id: number;
  openingTime: string;
  closingTime: string;
  openDays: number[];
  createdAt: string;
  updatedAt: string;
}

// 이벤트 참가자
export interface EventParticipant {
  id: number;
  name: string;
  village: Village;
  createdAt: string;
}

// 선물 교환 매칭
export interface GiftExchangeMatch {
  id: number;
  eventId: string;
  giver: EventParticipant;
  receiver: EventParticipant;
  isRevealed: boolean;
  createdAt: string;
}

// 선물 교환 결과 (클라이언트용)
export interface GiftExchangeResult {
  participant: EventParticipant;
  receiver: EventParticipant;
}

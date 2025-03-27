import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 타입 정의
export type Village = {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type VillageMember = {
  id: number;
  villageId: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type MenuCategory = {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  imagePath: string;
  isTemperatureRequired: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  category: {
    name: string;
  };
};

export type Order = {
  id: number;
  villageId: number;
  menuItemId: number;
  memberName: string;
  isCustomName: boolean;
  temperature: string | null;
  isMild: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  village: {
    id: number;
    name: string;
  };
  menuItem: {
    id: number;
    name: string;
  };
};

export type OrderItem = {
  id: number;
  orderId: number;
  menuItemId: number;
  quantity: number;
  temperature: string | null;
  createdAt: Date;
  updatedAt: Date;
  menuItem?: {
    name: string;
  };
};

// 카페 설정 타입
export type CafeSetting = {
  id: number;
  openingTime: string; // HH:MM:SS 형식의 시간
  closingTime: string; // HH:MM:SS 형식의 시간
  openDays: number[];
  createdAt?: Date;
  updatedAt?: Date;
};

// 주문 생성 데이터 타입
export type CreateOrderData = {
  villageId: number;
  menuItemId: number;
  memberName: string;
  isCustomName: boolean;
  temperature?: string | null;
  isMild?: boolean;
  status?: string;
};

// Supabase 클라이언트 싱글톤
let supabaseClient: ReturnType<typeof createClient> | null = null;

// Supabase 클라이언트 초기화
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL과 Anon Key가 환경 변수에 설정되어 있지 않습니다.');
    }
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

// 데이터베이스 API
export const supabase = {
  // 마을 관련 메서드
  async getVillages(): Promise<Village[]> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('villages').select('*').order('name');

    if (error) throw error;
    return data as Village[];
  },

  async getVillageMembers(villageId: number): Promise<VillageMember[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('village_members')
      .select('*')
      .eq('village_id', villageId)
      .order('name');

    if (error) throw error;
    return data as VillageMember[];
  },

  // 메뉴 관련 메서드
  async getMenuItems(categoryId?: number): Promise<MenuItem[]> {
    const client = getSupabaseClient();
    let query = client.from('menu_items').select('*, category:menu_categories(name)');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    // Supabase 결과를 일관된 형식으로 변환
    return (data as unknown[]).map((item) => {
      const typedItem = item as Record<string, unknown>;
      return {
        id: typedItem.id as number,
        name: typedItem.name as string,
        description: typedItem.description as string,
        categoryId: typedItem.category_id as number,
        imagePath: typedItem.image_path as string,
        isTemperatureRequired: typedItem.is_temperature_required as boolean,
        createdAt: new Date(typedItem.created_at as string),
        updatedAt: new Date(typedItem.updated_at as string),
        category: {
          name: ((typedItem.category as Record<string, unknown>) || {}).name as string,
        },
      };
    }) as MenuItem[];
  },

  // 주문 관련 메서드
  async getOrders(): Promise<Order[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('orders')
      .select('*, village:villages(id, name), menuItem:menu_items(id, name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Supabase 결과를 일관된 형식으로 변환
    return (data as unknown[]).map((item) => {
      const order = item as Record<string, unknown>;
      const village = (order.village as Record<string, unknown>) || {};
      const menuItem = (order.menuItem as Record<string, unknown>) || {};

      return {
        id: order.id as number,
        villageId: order.village_id as number,
        menuItemId: order.menu_item_id as number,
        memberName: order.member_name as string,
        isCustomName: order.is_custom_name as boolean,
        temperature: order.temperature as string | null,
        isMild: order.is_mild as boolean,
        status: order.status as string,
        createdAt: new Date(order.created_at as string),
        updatedAt: new Date(order.updated_at as string),
        village: {
          id: village.id as number,
          name: village.name as string,
        },
        menuItem: {
          id: menuItem.id as number,
          name: menuItem.name as string,
        },
      };
    }) as Order[];
  },

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    const client = getSupabaseClient();
    // Supabase 형식으로 변환
    const supabaseData = {
      village_id: orderData.villageId,
      menu_item_id: orderData.menuItemId,
      member_name: orderData.memberName,
      is_custom_name: orderData.isCustomName,
      temperature: orderData.temperature,
      is_mild: orderData.isMild,
      status: orderData.status || 'pending',
    };

    const { data, error } = await client
      .from('orders')
      .insert(supabaseData)
      .select('*, village:villages(id, name), menuItem:menu_items(id, name)')
      .single();

    if (error) throw error;

    const orderResult = data as unknown as Record<string, unknown>;
    const village = (orderResult.village as Record<string, unknown>) || {};
    const menuItem = (orderResult.menuItem as Record<string, unknown>) || {};

    // 일관된 형식으로 변환
    return {
      id: orderResult.id as number,
      villageId: orderResult.village_id as number,
      menuItemId: orderResult.menu_item_id as number,
      memberName: orderResult.member_name as string,
      isCustomName: orderResult.is_custom_name as boolean,
      temperature: orderResult.temperature as string | null,
      isMild: orderResult.is_mild as boolean,
      status: orderResult.status as string,
      createdAt: new Date(orderResult.created_at as string),
      updatedAt: new Date(orderResult.updated_at as string),
      village: {
        id: village.id as number,
        name: village.name as string,
      },
      menuItem: {
        id: menuItem.id as number,
        name: menuItem.name as string,
      },
    } as Order;
  },

  // 카페 설정 관련 메서드
  async getCafeSettings(): Promise<CafeSetting | null> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('cafe_settings').select('*').single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터가 없는 경우
        return null;
      }
      throw error;
    }

    // Supabase 결과를 일관된 형식으로 변환
    return {
      id: data.id as number,
      openingTime: data.opening_time as string,
      closingTime: data.closing_time as string,
      openDays: data.open_days as number[],
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    } as CafeSetting;
  },

  async updateCafeSettings(
    settings: Omit<CafeSetting, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<CafeSetting> {
    const client = getSupabaseClient();

    // 기존 설정 확인
    const { data: existingData } = await client.from('cafe_settings').select('id');

    // Supabase 형식으로 변환
    const supabaseData = {
      opening_time: settings.openingTime,
      closing_time: settings.closingTime,
      open_days: settings.openDays,
    };

    let result;

    if (existingData && existingData.length > 0) {
      // 기존 설정 업데이트
      const { data, error } = await client
        .from('cafe_settings')
        .update(supabaseData)
        .eq('id', existingData[0].id as number)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // 새 설정 생성
      const { data, error } = await client
        .from('cafe_settings')
        .insert(supabaseData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // 일관된 형식으로 변환
    return {
      id: result.id as number,
      openingTime: result.opening_time as string,
      closingTime: result.closing_time as string,
      openDays: result.open_days as number[],
      createdAt: new Date(result.created_at as string),
      updatedAt: new Date(result.updated_at as string),
    } as CafeSetting;
  },
};

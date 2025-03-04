import { createClient } from '@supabase/supabase-js';
import { prisma, connectPrisma, disconnectPrisma } from './prisma';
import { Prisma } from '@prisma/client';

// 환경 변수
const isProduction = process.env.NODE_ENV === 'production';
const useSupabase = isProduction || process.env.USE_SUPABASE === 'true';

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 타입 정의 - Prisma 타입을 재내보내기
export type Village = Prisma.VillageGetPayload<object>;
export type VillageMember = Prisma.VillageMemberGetPayload<object>;
export type MenuCategory = Prisma.MenuCategoryGetPayload<object>;
export type MenuItem = Prisma.MenuItemGetPayload<{
  include: { category: true };
}>;
export type Order = Prisma.OrderGetPayload<{
  include: { village: true; menuItem: true };
}>;

// 주문 생성 데이터 타입
export type CreateOrderData = {
  villageId: number;
  menuItemId: number;
  memberName: string;
  isCustomName: boolean;
  temperature?: string | null;
  status?: string;
};

// Supabase 클라이언트
let supabaseClient: ReturnType<typeof createClient> | null = null;

// Supabase 클라이언트 초기화
const initSupabaseClient = () => {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL과 Anon Key가 환경 변수에 설정되어 있지 않습니다.');
    }
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

// 데이터베이스 어댑터 인터페이스
interface DbAdapter {
  // 마을 관련 메서드
  getVillages(): Promise<Village[]>;
  getVillageMembers(villageId: number): Promise<VillageMember[]>;

  // 메뉴 관련 메서드
  getMenuItems(categoryId?: number): Promise<MenuItem[]>;

  // 주문 관련 메서드
  getOrders(): Promise<Order[]>;
  createOrder(orderData: CreateOrderData): Promise<Order>;
}

// Prisma 어댑터 구현
class PrismaAdapter implements DbAdapter {
  async getVillages(): Promise<Village[]> {
    try {
      await connectPrisma();
      const result = await prisma.village.findMany({
        orderBy: { name: 'asc' },
      });
      return result;
    } finally {
      await disconnectPrisma();
    }
  }

  async getVillageMembers(villageId: number): Promise<VillageMember[]> {
    try {
      await connectPrisma();
      const result = await prisma.villageMember.findMany({
        where: { villageId },
        orderBy: { name: 'asc' },
      });
      return result;
    } finally {
      await disconnectPrisma();
    }
  }

  async getMenuItems(categoryId?: number): Promise<MenuItem[]> {
    try {
      await connectPrisma();
      const result = await prisma.menuItem.findMany({
        where: categoryId ? { categoryId } : undefined,
        include: { category: true },
        orderBy: { name: 'asc' },
      });
      return result;
    } finally {
      await disconnectPrisma();
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      await connectPrisma();
      const result = await prisma.order.findMany({
        include: {
          village: true,
          menuItem: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return result;
    } finally {
      await disconnectPrisma();
    }
  }

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    try {
      await connectPrisma();
      const result = await prisma.order.create({
        data: {
          villageId: orderData.villageId,
          menuItemId: orderData.menuItemId,
          memberName: orderData.memberName,
          isCustomName: orderData.isCustomName,
          temperature: orderData.temperature,
          status: orderData.status || 'pending',
        },
        include: {
          village: true,
          menuItem: true,
        },
      });
      return result;
    } finally {
      await disconnectPrisma();
    }
  }
}

// Supabase 어댑터 구현
class SupabaseAdapter implements DbAdapter {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = initSupabaseClient();
  }

  async getVillages(): Promise<Village[]> {
    const { data, error } = await this.client.from('villages').select('*').order('name');

    if (error) throw error;
    return data as unknown as Village[];
  }

  async getVillageMembers(villageId: number): Promise<VillageMember[]> {
    const { data, error } = await this.client
      .from('village_members')
      .select('*')
      .eq('village_id', villageId)
      .order('name');

    if (error) throw error;
    return data as unknown as VillageMember[];
  }

  async getMenuItems(categoryId?: number): Promise<MenuItem[]> {
    let query = this.client.from('menu_items').select('*, category:menu_categories(name)');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    // Supabase 결과를 Prisma 형식으로 변환
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
    }) as unknown as MenuItem[];
  }

  async getOrders(): Promise<Order[]> {
    const { data, error } = await this.client
      .from('orders')
      .select('*, village:villages(id, name), menuItem:menu_items(id, name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Supabase 결과를 Prisma 형식으로 변환
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
    }) as unknown as Order[];
  }

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    // Prisma 형식을 Supabase 형식으로 변환
    const supabaseData = {
      village_id: orderData.villageId,
      menu_item_id: orderData.menuItemId,
      member_name: orderData.memberName,
      is_custom_name: orderData.isCustomName,
      temperature: orderData.temperature,
      status: orderData.status || 'pending',
    };

    const { data, error } = await this.client
      .from('orders')
      .insert(supabaseData)
      .select('*, village:villages(id, name), menuItem:menu_items(id, name)')
      .single();

    if (error) throw error;

    const orderData1 = data as unknown as Record<string, unknown>;
    const village = (orderData1.village as Record<string, unknown>) || {};
    const menuItem = (orderData1.menuItem as Record<string, unknown>) || {};

    // Supabase 결과를 Prisma 형식으로 변환
    return {
      id: orderData1.id as number,
      villageId: orderData1.village_id as number,
      menuItemId: orderData1.menu_item_id as number,
      memberName: orderData1.member_name as string,
      isCustomName: orderData1.is_custom_name as boolean,
      temperature: orderData1.temperature as string | null,
      status: orderData1.status as string,
      createdAt: new Date(orderData1.created_at as string),
      updatedAt: new Date(orderData1.updated_at as string),
      village: {
        id: village.id as number,
        name: village.name as string,
      },
      menuItem: {
        id: menuItem.id as number,
        name: menuItem.name as string,
      },
    } as unknown as Order;
  }
}

// 현재 환경에 맞는 데이터베이스 어댑터 생성
const createDbAdapter = (): DbAdapter =>
  useSupabase ? new SupabaseAdapter() : new PrismaAdapter();

// 데이터베이스 어댑터 인스턴스
const dbAdapter = createDbAdapter();

// 현재 사용 중인 데이터베이스 타입 반환
export const getDatabaseType = () => (useSupabase ? 'supabase' : 'prisma');

// Supabase 클라이언트 직접 접근 (필요한 경우)
export const getSupabaseClient = () => initSupabaseClient();

// 데이터베이스 클라이언트 가져오기 (하위 호환성)
export const getDbClient = () => {
  if (useSupabase) {
    return initSupabaseClient();
  } else {
    return prisma;
  }
};

// 데이터베이스 어댑터 내보내기
export const db = dbAdapter;

import { 기본저장소 } from './기본저장소';
import { Order, OrderItem } from '@/lib/supabase';

/**
 * 주문 관련 데이터 저장소
 */
export class 주문저장소 extends 기본저장소 {
  private static instance: 주문저장소;

  private constructor() {
    super();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static 인스턴스가져오기(): 주문저장소 {
    if (!주문저장소.instance) {
      주문저장소.instance = new 주문저장소();
    }
    return 주문저장소.instance;
  }

  /**
   * 모든 주문 목록 조회
   */
  public async 주문목록가져오기(): Promise<Order[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('orders')
        .select('*, village: villages(name), menu_item: menu_items(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Record<string, unknown>[]).map((item) => ({
        id: item.id as number,
        village: item.village as { id: number; name: string },
        memberName: item.member_name as string,
        isCustomName: item.is_custom_name as boolean,
        menuItem: item.menu_item as { id: number; name: string },
        temperature: item.temperature as string,
        isMild: item.is_mild as boolean,
        status: item.status as string,
        createdAt: new Date(item.created_at as string),
        updatedAt: new Date(item.updated_at as string),
        menuItemId: item.menu_item_id as number,
        villageId: item.village_id as number,
      }));
    } catch (error) {
      return this.오류처리(error, '주문 목록 조회 중 오류가 발생했습니다');
    }
  }

  /**
   * 특정 주문 상세 정보 조회
   */
  public async 주문상세가져오기(id: number): Promise<Order> {
    try {
      const { data, error } = await this.supabaseClient
        .from('orders')
        .select('*, village: villages(name), menu_item: menu_items(name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return {
        id: data.id as number,
        village: data.village as { id: number; name: string },
        memberName: data.member_name as string,
        isCustomName: data.is_custom_name as boolean,
        menuItem: data.menu_item as { id: number; name: string },
        temperature: data.temperature as string,
        isMild: data.is_mild as boolean,
        status: data.status as string,
        createdAt: new Date(data.created_at as string),
        updatedAt: new Date(data.updated_at as string),
        villageId: data.village_id as number,
        menuItemId: data.menu_item_id as number,
      };
    } catch (error) {
      return this.오류처리(error, `주문 ID ${id}번 조회 중 오류가 발생했습니다`);
    }
  }

  /**
   * 특정 주문의 주문 항목 목록 조회
   */
  public async 주문항목가져오기(orderId: number): Promise<OrderItem[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('order_items')
        .select('*, menu_item:menu_items(name)')
        .eq('order_id', orderId);

      if (error) throw error;

      // Supabase 결과를 일관된 형식으로 변환
      return (data as unknown[]).map((item) => {
        const typedItem = item as Record<string, unknown>;
        return {
          id: typedItem.id as number,
          orderId: typedItem.order_id as number,
          menuItemId: typedItem.menu_item_id as number,
          quantity: typedItem.quantity as number,
          temperature: typedItem.temperature as string,
          createdAt: new Date(typedItem.created_at as string),
          updatedAt: new Date(typedItem.updated_at as string),
          menuItem: typedItem.menu_item as { id: number; name: string },
        };
      }) as OrderItem[];
    } catch (error) {
      return this.오류처리(error, `주문 ID ${orderId}번의 주문 항목 조회 중 오류가 발생했습니다`);
    }
  }

  /**
   * 새 주문 생성
   */
  public async 주문생성하기(orderData: Partial<Order>): Promise<Order> {
    try {
      const { data, error } = await this.supabaseClient
        .from('orders')
        .insert({
          status: 'pending',
          village_id: orderData.villageId,
          member_name: orderData.memberName,
          is_custom_name: orderData.isCustomName,
          menu_item_id: orderData.menuItemId,
          temperature: orderData.temperature,
          is_mild: orderData.isMild,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id as number,
        status: data.status as string,
        villageId: data.village_id as number,
        memberName: data.member_name as string,
        isCustomName: data.is_custom_name as boolean,
        menuItemId: data.menu_item_id as number,
        temperature: data.temperature as string,
        isMild: data.is_mild as boolean,
        createdAt: new Date(data.created_at as string),
        updatedAt: new Date(data.updated_at as string),
        village: {
          id: data.village_id as number,
          name: data.village_name as string,
        },
        menuItem: {
          id: data.menu_item_id as number,
          name: data.menu_item_name as string,
        },
      };
    } catch (error) {
      return this.오류처리(error, '주문 생성 중 오류가 발생했습니다');
    }
  }

  /**
   * 주문 항목 생성
   */
  public async 주문항목생성하기(orderItems: Partial<OrderItem>[]): Promise<OrderItem[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('order_items')
        .insert({
          order_id: orderItems[0].orderId,
          menu_item_id: orderItems[0].menuItemId,
          quantity: orderItems[0].quantity,
          temperature: orderItems[0].temperature,
        })
        .select();

      if (error) throw error;
      return (data as Record<string, unknown>[]).map((item) => ({
        id: item.id as number,
        orderId: item.order_id as number,
        menuItemId: item.menu_item_id as number,
        quantity: item.quantity as number,
        temperature: item.temperature as string,
        createdAt: new Date(item.created_at as string),
        updatedAt: new Date(item.updated_at as string),
        menuItem: {
          id: item.menu_item_id as number,
          name: item.menu_item_name as string,
        },
      }));
    } catch (error) {
      return this.오류처리(error, '주문 항목 생성 중 오류가 발생했습니다');
    }
  }

  /**
   * 주문 상태 업데이트
   */
  public async 주문상태업데이트(id: number, status: string): Promise<Order> {
    try {
      const { data, error } = await this.supabaseClient
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id as number,
        status: data.status as string,
        villageId: data.village_id as number,
        memberName: data.member_name as string,
        isCustomName: data.is_custom_name as boolean,
        menuItemId: data.menu_item_id as number,
        temperature: data.temperature as string,
        isMild: data.is_mild as boolean,
        createdAt: new Date(data.created_at as string),
        updatedAt: new Date(data.updated_at as string),
        village: {
          id: data.village_id as number,
          name: data.village_name as string,
        },
        menuItem: {
          id: data.menu_item_id as number,
          name: data.menu_item_name as string,
        },
      };
    } catch (error) {
      return this.오류처리(error, `주문 ID ${id}번 상태 업데이트 중 오류가 발생했습니다`);
    }
  }

  /**
   * 주문 상태 변경
   */
  public async 주문상태변경하기(id: number, status: string): Promise<Order> {
    return this.주문상태업데이트(id, status);
  }

  /**
   * 주문 삭제
   */
  public async 주문삭제하기(id: number): Promise<void> {
    try {
      const { error } = await this.supabaseClient.from('orders').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.오류처리(error, `주문 ID ${id}번 삭제 중 오류가 발생했습니다`);
    }
  }

  /**
   * 중복 주문 확인
   * 특정 마을의 특정 회원이 같은 날짜에 주문한 내역이 있는지 확인
   */
  public async 중복주문확인하기(
    villageId: number,
    memberName: string,
    date?: Date,
  ): Promise<{
    hasDuplicate: boolean;
    order?: {
      id: number;
      villageId: number;
      memberName: string;
      menuItemId: number;
      menuItemName: string;
      temperature: string | null;
      isMild: boolean;
      status: string;
      createdAt: Date;
    };
  }> {
    try {
      // 날짜 파라미터 처리 (기본값: 오늘)
      const targetDate = date || new Date();

      // 날짜 범위 설정 (해당 날짜의 00:00:00부터 23:59:59까지)
      const startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);

      // 중복 주문 확인 쿼리
      const { data, error } = await this.supabaseClient
        .from('orders')
        .select(
          'id, village_id, member_name, menu_item_id, temperature, is_mild, status, created_at',
        )
        .eq('village_id', villageId)
        .eq('member_name', memberName)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      // 중복 주문이 있는 경우
      if (data && data.length > 0) {
        const order = data[0] as Record<string, unknown>;

        // 메뉴 아이템 정보 가져오기
        const { data: menuItemData, error: menuItemError } = await this.supabaseClient
          .from('menu_items')
          .select('name')
          .eq('id', order.menu_item_id)
          .single();

        if (menuItemError) throw menuItemError;

        const menuItemName = menuItemData
          ? ((menuItemData as Record<string, unknown>).name as string)
          : '알 수 없는 메뉴';

        return {
          hasDuplicate: true,
          order: {
            id: order.id as number,
            villageId: order.village_id as number,
            memberName: order.member_name as string,
            menuItemId: order.menu_item_id as number,
            menuItemName: menuItemName,
            temperature: order.temperature as string | null,
            isMild: order.is_mild as boolean,
            status: order.status as string,
            createdAt: new Date(order.created_at as string),
          },
        };
      }

      // 중복 주문이 없는 경우
      return {
        hasDuplicate: false,
      };
    } catch (error) {
      return this.오류처리(error, '중복 주문 확인 중 오류가 발생했습니다');
    }
  }
}

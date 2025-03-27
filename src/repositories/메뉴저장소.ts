import { 기본저장소 } from './기본저장소';
import { MenuItem, MenuCategory } from '@/lib/supabase';

/**
 * 메뉴 관련 데이터 저장소
 */
export class 메뉴저장소 extends 기본저장소 {
  private static instance: 메뉴저장소;

  private constructor() {
    super();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static 인스턴스가져오기(): 메뉴저장소 {
    if (!메뉴저장소.instance) {
      메뉴저장소.instance = new 메뉴저장소();
    }
    return 메뉴저장소.instance;
  }

  /**
   * 모든 메뉴 항목 조회 또는 카테고리별 메뉴 항목 조회
   */
  public async 메뉴항목가져오기(categoryId?: number): Promise<MenuItem[]> {
    try {
      let query = this.supabaseClient
        .from('menu_items')
        .select('*, category:menu_categories(name)');

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
    } catch (error) {
      return this.오류처리(
        error,
        categoryId
          ? `카테고리 ID ${categoryId}번의 메뉴 항목 조회 중 오류가 발생했습니다`
          : '메뉴 항목 조회 중 오류가 발생했습니다',
      );
    }
  }

  /**
   * 특정 메뉴 항목 상세 정보 조회
   */
  public async 메뉴항목상세가져오기(id: number): Promise<MenuItem> {
    try {
      const { data, error } = await this.supabaseClient
        .from('menu_items')
        .select('*, category:menu_categories(name)')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Supabase 결과를 일관된 형식으로 변환
      const typedItem = data as Record<string, unknown>;
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
      } as MenuItem;
    } catch (error) {
      return this.오류처리(error, `메뉴 항목 ID ${id}번 조회 중 오류가 발생했습니다`);
    }
  }

  /**
   * 모든 메뉴 카테고리 조회
   */
  public async 메뉴카테고리가져오기(): Promise<MenuCategory[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('menu_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as MenuCategory[];
    } catch (error) {
      return this.오류처리(error, '메뉴 카테고리 조회 중 오류가 발생했습니다');
    }
  }

  /**
   * 특정 메뉴 카테고리 상세 정보 조회
   */
  public async 메뉴카테고리상세가져오기(id: number): Promise<MenuCategory> {
    try {
      const { data, error } = await this.supabaseClient
        .from('menu_categories')
        .select('*, menu_items:menu_items(name)')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Supabase 결과를 일관된 형식으로 변환
      const typedCategory = data as Record<string, unknown>;
      return {
        id: typedCategory.id as number,
        name: typedCategory.name as string,
        menuItems: (typedCategory.menu_items as Record<string, unknown>[]).map((item) => ({
          id: item.id as number,
          name: item.name as string,
        })),
      } as MenuCategory;
    } catch (error) {
      return this.오류처리(error, `메뉴 카테고리 ID ${id}번 조회 중 오류가 발생했습니다`);
    }
  }
}

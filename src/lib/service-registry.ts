/**
 * 서비스 레지스트리
 * 서비스 인스턴스를 싱글톤으로 관리하는 레지스트리
 */

import { VillageService } from '@/services/village.service';
import { CafeSettingService } from '@/services/cafe-setting.service';
import { CafeSettingsService } from '@/services/cafe-settings.service';
import { VillageMemberService } from '@/services/village-member.service';
import { MenuCategoryService } from '@/services/menu-category.service';
import { MenuItemService } from '@/services/menu-item.service';
import { OrderService } from '@/services/order.service';
import { UserService } from '@/services/user.service';

// 서비스 인스턴스 타입
type ServiceInstances = {
  villageService?: VillageService;
  cafeSettingService?: CafeSettingService;
  cafeSettingsService?: CafeSettingsService;
  villageMemberService?: VillageMemberService;
  menuCategoryService?: MenuCategoryService;
  menuItemService?: MenuItemService;
  orderService?: OrderService;
  userService?: UserService;
};

// 싱글톤 인스턴스 저장소
const instances: ServiceInstances = {};

/**
 * 서비스 레지스트리 클래스
 * 모든 서비스 인스턴스를 중앙에서 관리
 */
export class ServiceRegistry {
  /**
   * VillageService 인스턴스 반환
   * 없으면 생성 후 반환
   */
  static getVillageService(): VillageService {
    if (!instances.villageService) {
      instances.villageService = VillageService.getInstance();
    }
    return instances.villageService;
  }

  /**
   * CafeSettingService 인스턴스 반환
   * 없으면 생성 후 반환
   */
  static getCafeSettingService(): CafeSettingService {
    if (!instances.cafeSettingService) {
      instances.cafeSettingService = CafeSettingService.getInstance();
    }
    return instances.cafeSettingService;
  }

  /**
   * CafeSettingsService 인스턴스 반환
   * 없으면 생성 후 반환
   */
  static getCafeSettingsService(): CafeSettingsService {
    if (!instances.cafeSettingsService) {
      instances.cafeSettingsService = CafeSettingsService.getInstance();
    }
    return instances.cafeSettingsService;
  }

  /**
   * VillageMemberService 인스턴스 반환
   * 없으면 생성 후 반환
   */
  static getVillageMemberService(): VillageMemberService {
    if (!instances.villageMemberService) {
      instances.villageMemberService = VillageMemberService.getInstance();
    }
    return instances.villageMemberService;
  }

  /**
   * MenuCategoryService 인스턴스 반환
   * 없으면 생성 후 반환
   */
  static getMenuCategoryService(): MenuCategoryService {
    if (!instances.menuCategoryService) {
      instances.menuCategoryService = MenuCategoryService.getInstance();
    }
    return instances.menuCategoryService;
  }

  /**
   * MenuItemService 인스턴스 반환
   * 없으면 생성 후 반환
   */
  static getMenuItemService(): MenuItemService {
    if (!instances.menuItemService) {
      instances.menuItemService = MenuItemService.getInstance();
    }
    return instances.menuItemService;
  }

  /**
   * OrderService 인스턴스 반환
   * 없으면 생성 후 반환
   */
  static getOrderService(): OrderService {
    if (!instances.orderService) {
      instances.orderService = OrderService.getInstance();
    }
    return instances.orderService;
  }

  /**
   * UserService 인스턴스 반환
   * 없으면 생성 후 반환
   */
  static getUserService(): UserService {
    if (!instances.userService) {
      instances.userService = UserService.getInstance();
    }
    return instances.userService;
  }

  /**
   * 모든 서비스 인스턴스 초기화
   * 테스트 등의 목적으로 사용
   */
  static resetAll(): void {
    Object.keys(instances).forEach((key) => {
      delete instances[key as keyof ServiceInstances];
    });
  }

  /**
   * 애플리케이션 시작시 모든 서비스 인스턴스를 미리 생성
   * 요청시 생성하는 방식이 아닌 애플리케이션 시작시 미리 생성하는 방식으로 변경
   */
  static initializeAllServices(): ServiceInstances {
    // 각 서비스 인스턴스 미리 생성
    this.getVillageService();
    this.getVillageMemberService();
    this.getCafeSettingService();
    this.getCafeSettingsService();
    this.getMenuCategoryService();
    this.getMenuItemService();
    this.getOrderService();
    this.getUserService();

    console.log('초기화된 서비스 인스턴스:', Object.keys(instances).length);
    return instances;
  }
}

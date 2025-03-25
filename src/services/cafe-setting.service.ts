import { prisma } from '@/lib/prisma';

type CafeSettingResponse = {
  openingTime: string;
  closingTime: string;
  openDays: number[];
};

/**
 * Cafe Setting Service
 * Handles all operations related to cafe settings
 */
export class CafeSettingService {
  // 싱글톤 인스턴스
  private static instance: CafeSettingService;

  /**
   * 싱글톤 인스턴스 반환
   * @returns CafeSettingService 인스턴스
   */
  public static getInstance(): CafeSettingService {
    if (!CafeSettingService.instance) {
      CafeSettingService.instance = new CafeSettingService();
    }
    return CafeSettingService.instance;
  }

  // 외부에서 생성자 접근 방지
  private constructor() {}
  /**
   * Get cafe settings
   * @returns Promise resolving to the cafe settings or null if not found
   */
  async getCafeSettings(): Promise<CafeSettingResponse | null> {
    try {
      const settings = await prisma.cafeSetting.findFirst();

      if (!settings) {
        return null;
      }

      // Format time as HH:MM:SS
      const formatTime = (date: Date): string => {
        return date.toTimeString().split(' ')[0];
      };

      return {
        openingTime: formatTime(settings.openingTime),
        closingTime: formatTime(settings.closingTime),
        openDays: (settings.openDays as number[]) || [0], // Default to Sunday (0) if undefined
      };
    } catch (error) {
      console.error('Error fetching cafe settings:', error);
      throw new Error('Failed to fetch cafe settings');
    }
  }

  /**
   * Update cafe settings
   * @param data - The updated cafe settings data
   * @returns Promise resolving to the updated cafe settings
   */
  async updateCafeSettings(data: { openingTime: Date; closingTime: Date; openDays: number[] }): Promise<CafeSettingResponse> {
    try {
      // Check if settings exist
      const existingSettings = await prisma.cafeSetting.findFirst();

      let updatedSettings;

      if (existingSettings) {
        // Update existing settings
        updatedSettings = await prisma.cafeSetting.update({
          where: { id: existingSettings.id },
          data: {
            openingTime: data.openingTime,
            closingTime: data.closingTime,
            openDays: data.openDays,
          },
        });
      } else {
        // Create new settings if none exist
        updatedSettings = await prisma.cafeSetting.create({
          data: {
            openingTime: data.openingTime,
            closingTime: data.closingTime,
            openDays: data.openDays,
          },
        });
      }

      // Format time as HH:MM:SS for the response
      const formatTime = (date: Date): string => {
        return date.toTimeString().split(' ')[0];
      };

      return {
        openingTime: formatTime(updatedSettings.openingTime),
        closingTime: formatTime(updatedSettings.closingTime),
        openDays: (updatedSettings.openDays as number[]) || [0], // Default to Sunday (0) if undefined
      };
    } catch (error) {
      console.error('Error updating cafe settings:', error);
      throw new Error('Failed to update cafe settings');
    }
  }
}

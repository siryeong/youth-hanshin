import { prisma } from '@/lib/prisma';

type CafeSettings = {
  openingTime: string;
  closingTime: string;
  openDays: number[];
};

/**
 * Cafe Settings Service
 * Handles all operations related to cafe settings
 */
export class CafeSettingsService {
  // 싱글톤 인스턴스
  private static instance: CafeSettingsService;

  /**
   * 싱글톤 인스턴스 반환
   * @returns CafeSettingsService 인스턴스
   */
  public static getInstance(): CafeSettingsService {
    if (!CafeSettingsService.instance) {
      CafeSettingsService.instance = new CafeSettingsService();
    }
    return CafeSettingsService.instance;
  }

  // 외부에서 생성자 접근 방지
  private constructor() {}
  /**
   * Get cafe settings
   * @returns Promise resolving to the cafe settings or null if not found
   */
  async getCafeSettings(): Promise<CafeSettings | null> {
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
   * @param settings - The new cafe settings
   * @returns Promise resolving to the updated cafe settings
   */
  async updateCafeSettings(settings: CafeSettings): Promise<CafeSettings> {
    try {
      const { openingTime, closingTime, openDays } = settings;

      // Convert time strings to DateTime objects
      // Use a reference date (today) and set the time portion
      const parseTimeToDateTime = (timeString: string): Date => {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, seconds || 0, 0);
        return date;
      };

      // Check if settings exist
      const existingSettings = await prisma.cafeSetting.findFirst();

      let updatedSettings;

      if (existingSettings) {
        // Update existing settings
        updatedSettings = await prisma.cafeSetting.update({
          where: { id: existingSettings.id },
          data: {
            openingTime: parseTimeToDateTime(openingTime),
            closingTime: parseTimeToDateTime(closingTime),
            openDays,
          },
        });
      } else {
        // Create new settings if none exist
        updatedSettings = await prisma.cafeSetting.create({
          data: {
            openingTime: parseTimeToDateTime(openingTime),
            closingTime: parseTimeToDateTime(closingTime),
            openDays,
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

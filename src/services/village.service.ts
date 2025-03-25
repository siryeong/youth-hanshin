import { Village, VillageMember } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { memoryCache } from '@/lib/cache';

// 캐시 키 상수
const CACHE_KEYS = {
  ALL_VILLAGES: 'villages:all',
  ALL_VILLAGES_WITH_COUNTS: 'villages:all:with-counts',
  VILLAGE_BY_ID: (id: number) => `villages:${id}`,
  VILLAGE_MEMBERS: (villageId: number) => `villages:${villageId}:members`,
};

// 캐시 TTL 설정 (밀리초)
const CACHE_TTL = {
  VILLAGES: 5 * 60 * 1000, // 5분
  MEMBERS: 2 * 60 * 1000, // 2분
};

/**
 * Village Service
 * Handles all operations related to villages
 */
export class VillageService {
  // 싱글톤 인스턴스
  private static instance: VillageService;

  /**
   * 싱글톤 인스턴스 반환
   * @returns VillageService 인스턴스
   */
  public static getInstance(): VillageService {
    if (!VillageService.instance) {
      VillageService.instance = new VillageService();
    }
    return VillageService.instance;
  }

  // 외부에서 생성자 접근 방지
  private constructor() {}
  /**
   * Get all villages with member counts
   * @returns Promise resolving to an array of villages with member counts
   */
  async getAllVillagesWithMemberCounts() {
    try {
      // 캐시에서 먼저 확인
      const cachedData = memoryCache.get(CACHE_KEYS.ALL_VILLAGES_WITH_COUNTS);
      if (cachedData) {
        return cachedData;
      }

      // 캐시 미스 시 DB에서 조회
      const villages = await prisma.village.findMany({
        orderBy: {
          name: 'asc',
        },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      // 결과 캐싱
      memoryCache.set(CACHE_KEYS.ALL_VILLAGES_WITH_COUNTS, villages, CACHE_TTL.VILLAGES);
      return villages;
    } catch (error) {
      console.error('Error fetching villages with member counts:', error);
      throw new Error('Failed to fetch villages with member counts');
    }
  }

  /**
   * Get all villages
   * @returns Promise resolving to an array of villages
   */
  async getAllVillages(): Promise<Village[]> {
    try {
      // 캐시에서 먼저 확인
      const cachedData = memoryCache.get<Village[]>(CACHE_KEYS.ALL_VILLAGES);
      if (cachedData) {
        return cachedData;
      }

      // 캐시 미스 시 DB에서 조회
      const villages = await prisma.village.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      // 결과 캐싱
      memoryCache.set(CACHE_KEYS.ALL_VILLAGES, villages, CACHE_TTL.VILLAGES);
      return villages;
    } catch (error) {
      console.error('Error fetching villages:', error);
      throw new Error('Failed to fetch villages');
    }
  }

  /**
   * Get a village by ID
   * @param id - The village ID
   * @returns Promise resolving to the village or null if not found
   */
  async getVillageById(id: number): Promise<Village | null> {
    try {
      return await prisma.village.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error(`Error fetching village with ID ${id}:`, error);
      throw new Error(`Failed to fetch village with ID ${id}`);
    }
  }

  /**
   * Create a new village
   * @param name - The name of the village
   * @returns Promise resolving to the created village
   */
  async createVillage(name: string): Promise<Village> {
    try {
      return await prisma.village.create({
        data: { name },
      });
    } catch (error) {
      console.error('Error creating village:', error);
      throw new Error('Failed to create village');
    }
  }

  /**
   * Update a village
   * @param id - The village ID
   * @param name - The new name for the village
   * @returns Promise resolving to the updated village
   */
  async updateVillage(id: number, name: string): Promise<Village> {
    try {
      return await prisma.village.update({
        where: { id },
        data: { name },
      });
    } catch (error) {
      console.error(`Error updating village with ID ${id}:`, error);
      throw new Error(`Failed to update village with ID ${id}`);
    }
  }

  /**
   * Delete a village
   * @param id - The village ID
   * @returns Promise resolving to the deleted village
   */
  async deleteVillage(id: number): Promise<Village> {
    try {
      return await prisma.village.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Error deleting village with ID ${id}:`, error);
      throw new Error(`Failed to delete village with ID ${id}`);
    }
  }

  /**
   * Get all members of a village
   * @param villageId - The village ID
   * @returns Promise resolving to an array of village members
   */
  async getVillageMembers(villageId: number): Promise<VillageMember[]> {
    try {
      return await prisma.villageMember.findMany({
        where: {
          villageId,
        },
        orderBy: {
          name: 'asc',
        },
      });
    } catch (error) {
      console.error(`Error fetching members for village with ID ${villageId}:`, error);
      throw new Error(`Failed to fetch members for village with ID ${villageId}`);
    }
  }
}

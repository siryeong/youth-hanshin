import { VillageMember } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { memoryCache } from '@/lib/cache';

// 캐시 키 상수
const CACHE_KEYS = {
  VILLAGE_MEMBERS: (villageId: number) => `village-members:${villageId}`,
  MEMBER_BY_ID: (id: number) => `village-member:${id}`,
  ALL_MEMBERS_WITH_VILLAGES: 'village-members:all-with-villages',
  VILLAGE_MEMBER_COUNT: (villageId: number) => `village-members:count:${villageId}`,
};

// 캐시 TTL 설정 (밀리초)
const CACHE_TTL = {
  MEMBERS: 2 * 60 * 1000, // 2분
  MEMBER_COUNT: 5 * 60 * 1000, // 5분
};

/**
 * Village Member Service
 * Handles all operations related to village members
 */
export class VillageMemberService {
  // 싱글톤 인스턴스
  private static instance: VillageMemberService;

  /**
   * 싱글톤 인스턴스 반환
   * @returns VillageMemberService 인스턴스
   */
  public static getInstance(): VillageMemberService {
    if (!VillageMemberService.instance) {
      VillageMemberService.instance = new VillageMemberService();
    }
    return VillageMemberService.instance;
  }

  // 외부에서 생성자 접근 방지
  private constructor() {}
  /**
   * Get all members of a village
   * @param villageId - The village ID
   * @returns Promise resolving to an array of village members
   */
  async getVillageMembers(villageId: number): Promise<VillageMember[]> {
    try {
      // 캐시에서 먼저 확인
      const cachedData = memoryCache.get<VillageMember[]>(CACHE_KEYS.VILLAGE_MEMBERS(villageId));
      if (cachedData) {
        return cachedData;
      }

      // 캐시 미스 시 DB에서 조회
      const members = await prisma.villageMember.findMany({
        where: {
          villageId,
        },
        orderBy: {
          name: 'asc',
        },
      });

      // 결과 캐싱
      memoryCache.set(CACHE_KEYS.VILLAGE_MEMBERS(villageId), members, CACHE_TTL.MEMBERS);
      return members;
    } catch (error) {
      console.error(`Error fetching members for village with ID ${villageId}:`, error);
      throw new Error(`Failed to fetch members for village with ID ${villageId}`);
    }
  }

  /**
   * Get a village member by ID
   * @param id - The village member ID
   * @returns Promise resolving to the village member or null if not found
   */
  async getVillageMemberById(id: number): Promise<VillageMember | null> {
    try {
      // 캐시에서 먼저 확인
      const cachedData = memoryCache.get<VillageMember | null>(CACHE_KEYS.MEMBER_BY_ID(id));
      if (cachedData !== undefined) {
        return cachedData;
      }

      // 캐시 미스 시 DB에서 조회
      const member = await prisma.villageMember.findUnique({
        where: { id },
      });

      // 결과 캐싱 (null도 캐싱)
      memoryCache.set(CACHE_KEYS.MEMBER_BY_ID(id), member, CACHE_TTL.MEMBERS);
      return member;
    } catch (error) {
      console.error(`Error fetching village member with ID ${id}:`, error);
      throw new Error(`Failed to fetch village member with ID ${id}`);
    }
  }

  /**
   * Create a new village member
   * @param data - The village member data
   * @returns Promise resolving to the created village member
   */
  async createVillageMember(data: { name: string; villageId: number }): Promise<VillageMember> {
    try {
      return await prisma.villageMember.create({
        data,
      });
    } catch (error) {
      console.error('Error creating village member:', error);
      throw new Error('Failed to create village member');
    }
  }

  /**
   * Update a village member
   * @param id - The village member ID
   * @param data - The updated village member data
   * @returns Promise resolving to the updated village member
   */
  async updateVillageMember(id: number, data: { name?: string; villageId?: number }): Promise<VillageMember> {
    try {
      return await prisma.villageMember.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error(`Error updating village member with ID ${id}:`, error);
      throw new Error(`Failed to update village member with ID ${id}`);
    }
  }

  /**
   * Delete a village member
   * @param id - The village member ID
   * @returns Promise resolving to the deleted village member
   */
  async deleteVillageMember(id: number): Promise<VillageMember> {
    try {
      return await prisma.villageMember.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Error deleting village member with ID ${id}:`, error);
      throw new Error(`Failed to delete village member with ID ${id}`);
    }
  }

  /**
   * Get all village members with their village information
   * @returns Promise resolving to an array of village members with their village information
   */
  async getAllMembersWithVillages(): Promise<Array<VillageMember & { villageName: string }>> {
    try {
      // 캐시에서 먼저 확인
      const cachedData = memoryCache.get<Array<VillageMember & { villageName: string }>>(CACHE_KEYS.ALL_MEMBERS_WITH_VILLAGES);
      if (cachedData) {
        return cachedData;
      }

      // 캐시 미스 시 DB에서 조회
      // Get all members with their village relation
      const members = await prisma.villageMember.findMany({
        include: {
          village: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ villageId: 'asc' }, { name: 'asc' }],
      });

      // Format the response to include villageName
      const formattedMembers = members.map((member) => ({
        ...member,
        villageName: member.village.name,
      }));

      // 결과 캐싱
      memoryCache.set(CACHE_KEYS.ALL_MEMBERS_WITH_VILLAGES, formattedMembers, CACHE_TTL.MEMBERS);
      return formattedMembers;
    } catch (error) {
      console.error('Error fetching all members with villages:', error);
      throw new Error('Failed to fetch all members with villages');
    }
  }

  /**
   * Get the count of members in a village
   * @param villageId - The village ID
   * @returns Promise resolving to the count of members in the village
   */
  async getVillageMemberCount(villageId: number): Promise<number> {
    try {
      // 캐시에서 먼저 확인
      const cachedData = memoryCache.get<number>(CACHE_KEYS.VILLAGE_MEMBER_COUNT(villageId));
      if (cachedData !== undefined) {
        return cachedData;
      }

      // 캐시 미스 시 DB에서 조회
      const count = await prisma.villageMember.count({
        where: {
          villageId,
        },
      });

      // 결과 캐싱
      memoryCache.set(CACHE_KEYS.VILLAGE_MEMBER_COUNT(villageId), count, CACHE_TTL.MEMBER_COUNT);
      return count;
    } catch (error) {
      console.error(`Error counting members for village with ID ${villageId}:`, error);
      throw new Error(`Failed to count members for village with ID ${villageId}`);
    }
  }
}

import { VillageMember } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Village Member Service
 * Handles all operations related to village members
 */
export class VillageMemberService {
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

  /**
   * Get a village member by ID
   * @param id - The village member ID
   * @returns Promise resolving to the village member or null if not found
   */
  async getVillageMemberById(id: number): Promise<VillageMember | null> {
    try {
      return await prisma.villageMember.findUnique({
        where: { id },
      });
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
      return members.map((member) => ({
        ...member,
        villageName: member.village.name,
      }));
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
      return await prisma.villageMember.count({
        where: {
          villageId,
        },
      });
    } catch (error) {
      console.error(`Error counting members for village with ID ${villageId}:`, error);
      throw new Error(`Failed to count members for village with ID ${villageId}`);
    }
  }
}

import { Village, VillageMember } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Village Service
 * Handles all operations related to villages
 */
export class VillageService {
  /**
   * Get all villages with member counts
   * @returns Promise resolving to an array of villages with member counts
   */
  async getAllVillagesWithMemberCounts() {
    try {
      return await prisma.village.findMany({
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
      return await prisma.village.findMany({
        orderBy: {
          name: 'asc',
        },
      });
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

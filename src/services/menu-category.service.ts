import { MenuCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Menu Category Service
 * Handles all operations related to menu categories
 */
export class MenuCategoryService {
  /**
   * Get all menu categories
   * @returns Promise resolving to an array of menu categories
   */
  async getAllCategories(): Promise<MenuCategory[]> {
    try {
      return await prisma.menuCategory.findMany({
        orderBy: {
          name: 'asc',
        },
      });
    } catch (error) {
      console.error('Error fetching menu categories:', error);
      throw new Error('Failed to fetch menu categories');
    }
  }

  /**
   * Get a menu category by ID
   * @param id - The menu category ID
   * @returns Promise resolving to the menu category or null if not found
   */
  async getCategoryById(id: number): Promise<MenuCategory | null> {
    try {
      return await prisma.menuCategory.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error(`Error fetching menu category with ID ${id}:`, error);
      throw new Error(`Failed to fetch menu category with ID ${id}`);
    }
  }

  /**
   * Create a new menu category
   * @param name - The name of the menu category
   * @returns Promise resolving to the created menu category
   */
  async createCategory(name: string): Promise<MenuCategory> {
    try {
      return await prisma.menuCategory.create({
        data: { name },
      });
    } catch (error) {
      console.error('Error creating menu category:', error);
      throw new Error('Failed to create menu category');
    }
  }

  /**
   * Update a menu category
   * @param id - The menu category ID
   * @param name - The new name for the menu category
   * @returns Promise resolving to the updated menu category
   */
  async updateCategory(id: number, name: string): Promise<MenuCategory> {
    try {
      return await prisma.menuCategory.update({
        where: { id },
        data: { name },
      });
    } catch (error) {
      console.error(`Error updating menu category with ID ${id}:`, error);
      throw new Error(`Failed to update menu category with ID ${id}`);
    }
  }

  /**
   * Delete a menu category
   * @param id - The menu category ID
   * @returns Promise resolving to the deleted menu category
   */
  async deleteCategory(id: number): Promise<MenuCategory> {
    try {
      return await prisma.menuCategory.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Error deleting menu category with ID ${id}:`, error);
      throw new Error(`Failed to delete menu category with ID ${id}`);
    }
  }

  /**
   * Get a menu category by ID with its menu items
   * @param id - The menu category ID
   * @returns Promise resolving to the menu category with its menu items or null if not found
   */
  async getCategoryWithMenuItems(id: number): Promise<{ category: MenuCategory; menuItems: any[] } | null> {
    try {
      // Get the category
      const category = await prisma.menuCategory.findUnique({
        where: { id },
      });

      if (!category) {
        return null;
      }

      // Get menu items for this category
      const menuItems = await prisma.menuItem.findMany({
        where: { categoryId: id },
      });

      return { category, menuItems };
    } catch (error) {
      console.error(`Error fetching menu category with items for ID ${id}:`, error);
      throw new Error(`Failed to fetch menu category with items for ID ${id}`);
    }
  }

  /**
   * Get all categories with menu item counts
   * @returns Promise resolving to an array of categories with menu item counts
   */
  async getCategoriesWithItemCounts(): Promise<(MenuCategory & { _count: { menuItems: number } })[]> {
    try {
      const categories = await prisma.menuCategory.findMany({
        orderBy: {
          name: 'asc',
        },
        include: {
          _count: {
            select: {
              menuItems: true,
            },
          },
        },
      });

      return categories;
    } catch (error) {
      console.error('Error fetching categories with item counts:', error);
      throw new Error('Failed to fetch categories with item counts');
    }
  }

  /**
   * Check if a category has menu items
   * @param id - The menu category ID
   * @returns Promise resolving to a boolean indicating if the category has menu items
   */
  async categoryHasMenuItems(id: number): Promise<boolean> {
    try {
      const count = await prisma.menuItem.count({
        where: { categoryId: id },
      });
      return count > 0;
    } catch (error) {
      console.error(`Error checking if category with ID ${id} has menu items:`, error);
      throw new Error(`Failed to check if category with ID ${id} has menu items`);
    }
  }
}

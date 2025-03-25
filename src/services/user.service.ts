import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcrypt';

/**
 * User Service
 * Handles all operations related to users including authentication
 */
export class UserService {
  private static instance: UserService;

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {}

  /**
   * Get the singleton instance of UserService
   * @returns The singleton instance
   */
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }
  /**
   * Get a user by email
   * @param email - The user's email
   * @returns Promise resolving to the user or null if not found
   */
  async getUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error(`Error fetching user with email ${email}:`, error);
      throw new Error(`Failed to fetch user with email ${email}`);
    }
  }

  /**
   * Authenticate a user with email and password
   * @param email - The user's email
   * @param password - The user's password
   * @returns Promise resolving to the authenticated user or null if authentication fails
   */
  async authenticateUser(email: string, password: string) {
    try {
      // Get user by email
      const user = await this.getUserByEmail(email);

      // Check if user exists
      if (!user) {
        return null;
      }

      // Verify password
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      console.error(`Error authenticating user with email ${email}:`, error);
      throw new Error(`Failed to authenticate user with email ${email}`);
    }
  }

  /**
   * Verify if a user is an admin
   * @param email - The user's email
   * @param password - The user's password
   * @returns Promise resolving to the authenticated admin user or null if not an admin
   */
  async authenticateAdmin(email: string, password: string) {
    try {
      const user = await this.authenticateUser(email, password);

      // Check if user exists and is an admin
      if (!user || !user.isAdmin) {
        return null;
      }

      return user;
    } catch (error) {
      console.error(`Error authenticating admin with email ${email}:`, error);
      throw new Error(`Failed to authenticate admin with email ${email}`);
    }
  }

  /**
   * Get a user by ID
   * @param id - The user ID
   * @returns Promise resolving to the user or null if not found
   */
  async getUserById(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw new Error(`Failed to fetch user with ID ${id}`);
    }
  }

  /**
   * Create a new admin user
   * @param name - The user's name
   * @param email - The user's email
   * @param password - The user's password (will be hashed)
   * @returns Promise resolving to the created user
   */
  async createAdminUser(name: string, email: string, password: string) {
    try {
      // Hash the password
      const hashedPassword = await hash(password, 10);

      // Create the user with admin privileges
      return await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          isAdmin: true,
        },
      });
    } catch (error) {
      console.error(`Error creating admin user with email ${email}:`, error);
      throw new Error(`Failed to create admin user with email ${email}`);
    }
  }

  /**
   * Check if an email is already in use
   * @param email - The email to check
   * @returns Promise resolving to a boolean indicating if the email exists
   */
  async isEmailInUse(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      return !!user;
    } catch (error) {
      console.error(`Error checking if email ${email} is in use:`, error);
      throw new Error(`Failed to check if email ${email} is in use`);
    }
  }
}

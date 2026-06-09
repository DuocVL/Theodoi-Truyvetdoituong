
import { HttpException } from '../exceptions/http-exception';
import { updateUserSchema } from '../dtos/users.dto';
import * as accountRepository from '../repositories/account.repository';
import { AccountStatus } from '../../generated/prisma/client';
import Zod from 'zod';

type UpdateUserData = Zod.infer<typeof updateUserSchema>;

class UserService {

  /**
   * Get all users (officers)
   * Fetches all accounts with type 'USER' and their associated user profiles
   */
  public async findAllUsers(): Promise<any[]> {
    try {
      // Query accounts with type USER and include their user profile using repository
      const users = await accountRepository.findMany(
        { type: 'USER' },
        {
          user: {
            select: {
              id: true,
              full_name: true,
              status: true,
            }
          }
        }
      );

      // Transform to flatten structure
      return users.map(account => ({
        account_id: account.id,
        username: account.username,
        email: account.email,
        status: account.status,
        user_id: (account as any).user?.id,
        full_name: (account as any).user?.full_name,
        user_status: (account as any).user?.status,
        roles: (account as any).user?.userRole.map((ur: any) => ({
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description
        })) || [],
        created_at: account.created_at
      }));
    } catch (error) {
      throw new HttpException(500, `Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user by ID
   * Fetches a specific user with their profile and roles
   */
  public async findUserById(userId: string): Promise<any> {
    try {
      // Query account by ID
      const account = await accountRepository.findById(userId);
      if (!account) {
        throw new HttpException(404, 'User not found');
      }

      if (account.type !== 'USER') {
        throw new HttpException(400, 'Account is not a user account');
      }

      // Fetch user profile with roles using repository
      const user = await accountRepository.findByIdWithUserProfile(userId);

      if (!user || !user.user) {
        throw new HttpException(404, 'User profile not found');
      }

      return {
        account_id: user.id,
        username: user.username,
        email: user.email,
        account_status: user.status,
        user_id: user.user.id,
        full_name: user.user.full_name,
        user_status: user.user.status,
        avatar_id: user.user.avatar_id,
        roles: user.user.userRole.map((ur: any) => ({
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description
        })),
        subjects_created: user.user.subject,
        created_at: user.created_at,
        updated_at: user.user.update_at
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user information
   * Updates both account and user profile data
   */
  public async updateUser(userId: string, userData: UpdateUserData): Promise<any> {
    try {
      // Verify user exists
      const existingAccount = await accountRepository.findById(userId);
      if (!existingAccount) {
        throw new HttpException(404, 'User not found');
      }

      if (existingAccount.type !== 'USER') {
        throw new HttpException(400, 'Account is not a user account');
      }

      // Check if another user already has the new email or username
      if (userData.username || userData.email) {
        // Build OR conditions dynamically
        const orConditions: any[] = [];
        if (userData.username) {
          orConditions.push({ username: userData.username });
        }
        if (userData.email) {
          orConditions.push({ email: userData.email });
        }

        // Only query if there are conditions to check
        if (orConditions.length > 0) {
          const existingUser = await accountRepository.findFirst({
            NOT: { id: userId },
            OR: orConditions
          });

          if (existingUser) {
            throw new HttpException(409, 'Username or email already in use');
          }
        }
      }

      // Update account information
      const updateAccountData: any = {};
      if (userData.username !== undefined) updateAccountData.username = userData.username;
      if (userData.email !== undefined) updateAccountData.email = userData.email;
      if (userData.status !== undefined) updateAccountData.status = userData.status;

      if (Object.keys(updateAccountData).length > 0) {
        await accountRepository.update(userId, {
          username: userData.username,
          email: userData.email,
          status: updateAccountData.status || existingAccount.status
        });
      }

      // Return updated user
      return this.findUserById(userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Soft delete user by setting status to SUSPENDED
   * This prevents hard deletion which could orphan related records
   */
  public async deleteUser(userId: string): Promise<any> {
    try {
      // Verify user exists
      const existingAccount = await accountRepository.findById(userId);
      if (!existingAccount) {
        throw new HttpException(404, 'User not found');
      }

      if (existingAccount.type !== 'USER') {
        throw new HttpException(400, 'Account is not a user account');
      }

      // Soft delete: Set account status to SUSPENDED
      await accountRepository.updateStatus(userId, 'SUSPENDED' as AccountStatus);

      return {
        id: userId,
        message: 'User deactivated successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default new UserService();

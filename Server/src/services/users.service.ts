
import { prisma } from '../configs/prisma';
import { HttpException } from '../exceptions/HttpException';
import { updateUserSchema } from '../dtos/users.dto';

type UpdateUserData = Zod.infer<typeof updateUserSchema>;

class UserService {

  public async findAllUsers(): Promise<any[]> {
    const users = await prisma.account.findMany({
      where: {
        type: 'USER' // Filter for accounts that are users/officers
      },
      select: { // Select specific fields to avoid exposing sensitive data
        id: true,
        username: true,
        email: true,
        status: true,
        role: true,
        created_at: true
      }
    });
    return users;
  }

  public async findUserById(userId: string): Promise<any> {
    const user = await prisma.account.findUnique({
      where: { id: userId, type: 'USER' },
      select: { 
        id: true,
        username: true,
        email: true,
        status: true,
        role: true,
        created_at: true,
        // Optionally, you might want to include subjects created by this user
        subjects_created: {
          select: {
            id: true,
            full_name: true
          }
        }
      }
    });

    if (!user) {
      throw new HttpException(404, 'User not found');
    }
    return user;
  }

  public async updateUser(userId: string, userData: UpdateUserData): Promise<any> {
    const user = await prisma.account.findUnique({ where: { id: userId, type: 'USER' } });
    if (!user) {
      throw new HttpException(404, 'User not found');
    }

    // Check if another user already has the new email or username if they are being changed
    if (userData.username || userData.email) {
      const existingAccount = await prisma.account.findFirst({
        where: {
          NOT: { id: userId },
          OR: [
            { username: userData.username },
            { email: userData.email },
          ],
        },
      });

      if (existingAccount) {
        throw new HttpException(409, `Username or email already in use.`);
      }
    }

    const updatedUser = await prisma.account.update({
      where: { id: userId },
      data: {
        username: userData.username,
        email: userData.email,
        role: userData.role, // Allow changing the role
        status: userData.status
      },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        role: true,
        created_at: true
      }
    });

    return updatedUser;
  }

  public async deleteUser(userId: string): Promise<any> {
    const user = await prisma.account.findUnique({ where: { id: userId, type: 'USER' } });
    if (!user) {
      throw new HttpException(404, 'User not found');
    }
    
    // It's generally better to deactivate than to delete. A true delete could orphan records.
    // Here, we will implement a soft delete by setting status to INACTIVE.
    // For a hard delete, you would need to handle related records (e.g., reassign subjects_created).

    const deletedUser = await prisma.account.update({
        where: { id: userId },
        data: { status: 'INACTIVE' } // Soft delete
    });

    // For a hard delete, you would use:
    // await prisma.account.delete({ where: { id: userId } });

    return { message: "User deactivated successfully." };
  }
}

export default UserService;

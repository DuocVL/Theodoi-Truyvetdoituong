import { updateUserSchema } from '../dtos/users.dto';
import { AccountStatus, User } from '../../generated/prisma/client';
import { deleteUser, getAllUsers, getUserById, updateUser } from '../repositories/user.repository'
import Zod, { date } from 'zod';
import { UserUpdateInput } from '../../generated/prisma/models';

type UpdateUserData = Zod.infer<typeof updateUserSchema>;

class UserService {

  public async findAllUsers(fullName?: string, role?: string): Promise<User[]> {
    return await getAllUsers(fullName, role);
  }

  public async findUserById(userId: string): Promise<any> {
    return await getUserById(userId);
  }

  public async updateUser(userId: string, userData: UpdateUserData): Promise<any> {
   return await updateUser(userId, userData as UserUpdateInput);
  }

  public async deleteUser(userId: string): Promise<any> {
    return await deleteUser(userId);
  }
}

export default new UserService();

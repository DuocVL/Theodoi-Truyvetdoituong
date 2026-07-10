import { updateUserSchema } from '../dtos/users.dto';
import { User } from '../../generated/prisma/client';
import { deleteUser, getAllUsers, getUserById, updateUser } from '../repositories/user.repository'
import Zod from 'zod';
import { UserUpdateInput } from '../../generated/prisma/models';

type UpdateUserData = Zod.infer<typeof updateUserSchema>;

//nghiệp vụ xử lý với cán bộ

class UserService {

  //lấy danh sách kèm bộ lọc nếu có
  public async findAllUsers(fullName?: string, role?: string): Promise<User[]> {
    return await getAllUsers(fullName, role);
  }

  //lấy thông tin chi tiết theo id
  public async findUserById(userId: string): Promise<any> {
    return await getUserById(userId);
  }

  //cập nhật thông rin user
  public async updateUser(userId: string, userData: UpdateUserData): Promise<any> {
   return await updateUser(userId, userData as UserUpdateInput);
  }

  //xóa user
  public async deleteUser(userId: string): Promise<any> {
    return await deleteUser(userId);
  }
}

export default new UserService();

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // Độ khó tiêu chuẩn hiện nay

//Hàm mã hóa mật khẩu khi Register
export const hashData = async (data: string): Promise<string> => {
  return await bcrypt.hash(data, SALT_ROUNDS);
};

//Hàm so sánh mật khẩu khi Login
export const compareData = async (data: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(data, hash);
};
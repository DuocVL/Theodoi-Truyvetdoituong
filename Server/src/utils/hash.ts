import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; //Số lần thực hiện lại việc băm 2^SALT_ROUNDS

//Hàm mã hóa mật khẩu khi đăng ký
export const hashData = async (data: string): Promise<string> => {
  return await bcrypt.hash(data, SALT_ROUNDS);
};

//Hàm so sánh mật khẩu khi đăng nhập
export const compareData = async (data: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(data, hash);
};
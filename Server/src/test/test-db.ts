/**
 * @file Server/src/scripts/test-db.ts
 * @role Kịch bản kiểm tra toàn diện cho CSDL
 * @description
 * File này thực hiện một chu trình CRUD (Create, Read, Update, Delete) hoàn chỉnh 
 * cho một thực thể người dùng, bao gồm tạo Account, User, gán Role và kiểm tra 
 * hành vi xóa theo tầng (cascade delete). Nó được thiết kế để xác thực các mối quan hệ 
 * phức tạp trong `schema.prisma`.
 * 
 * --- CÁCH CHẠY ---
 * 1. Mở terminal và trỏ đến thư mục `Server` của bạn.
 * 2. Cài đặt ts-node nếu chưa có: `npm install -g ts-node`
 * 3. Chạy lệnh: `ts-node --esm ./src/scripts/test-db.ts` (cần cờ --esm vì dự án dùng ES Modules)
 */

import { AccountType } from '../../generated/prisma/client';
import { prisma } from '../configs/prisma';

async function main() {
  console.log('--- Bắt đầu kịch bản kiểm tra CSDL toàn diện ---');

  const uniqueId = `test_${Date.now()}`;
  let accountId: string;
  let userId: string;
  let roleId: number;

  console.log(process.env.DATABASE_URL);

  // --- BƯỚC 1: CREATE --- //
  console.log('\n[1] Thử nghiệm CREATE một chuỗi thực thể (Account -> User -> Role -> UserRole)');
  try {
    // 1a. Tạo Account
    const account = await prisma.account.create({
      data: {
        username: `${uniqueId}_user`,
        email: `${uniqueId}@example.com`,
        type: AccountType.USER,
        status: 'ACTIVE',
        // 1b. Tạo User liên quan ngay trong lệnh tạo Account (Nested Write)
        user: {
          create: {
            full_name: 'Test User Full Name',
          },
        },
      },
      include: {
        user: true, // Lấy luôn thông tin user vừa tạo
      },
    });

    if (!account.user) {
      throw new Error('Không thể tạo User liên kết với Account');
    }
    accountId = account.id;
    userId = account.user.id;
    console.log(`   -> Thành công: Đã tạo Account (ID: ${accountId}) và User (ID: ${userId})`);

    // 1c. Tạo hoặc lấy một Role (Dùng upsert để không bị lỗi nếu chạy lại)
    const role = await prisma.role.upsert({
        where: { name: 'TESTER' },
        update: {},
        create: {
            name: 'TESTER',
            description: 'Vai trò dành cho kịch bản test tự động',
        },
    });
    roleId = role.id;
    console.log(`   -> Thành công: Đã có Role 'TESTER' (ID: ${roleId})`);

    // 1d. Gán Role cho User thông qua bảng UserRole
    await prisma.userRole.create({
      data: {
        user_id: userId,
        role_id: roleId,
      },
    });
    console.log(`   -> Thành công: Đã gán Role 'TESTER' cho User '${userId}'`);

  } catch (error) {
    console.error('   -> Thất bại ở bước CREATE:', error);
    throw new Error('Dừng kiểm tra do lỗi CREATE.');
  }

  // --- BƯỚC 2: READ & VERIFY --- //
  console.log('\n[2] Thử nghiệm READ và xác thực các mối quan hệ');
  try {
    const createdUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        account: true,
        userRole: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!createdUser) throw new Error('Không tìm thấy User vừa tạo');
    if (createdUser.account.id !== accountId) throw new Error('Liên kết Account-User sai');
    if (createdUser.userRole[0]?.role.name !== 'TESTER') throw new Error('Liên kết User-Role sai');

    console.log(`   -> Thành công: Đã đọc và xác thực User '${createdUser.full_name}' với vai trò '${createdUser.userRole[0].role.name}'`);

  } catch (error) {
    console.error('   -> Thất bại ở bước READ:', error);
    throw new Error('Dừng kiểm tra do lỗi READ.');
  }

  // --- BƯỚC 3: UPDATE --- //
  console.log('\n[3] Thử nghiệm UPDATE User');
  try {
    const updatedFullName = 'Test User Updated Name';
    await prisma.user.update({
      where: { id: userId },
      data: { full_name: updatedFullName },
    });
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    if (updatedUser?.full_name !== updatedFullName) throw new Error('Tên chưa được cập nhật đúng');
    console.log(`   -> Thành công: Đã cập nhật full_name thành '${updatedUser.full_name}'`);

  } catch (error) {
    console.error('   -> Thất bại ở bước UPDATE:', error);
    throw new Error('Dừng kiểm tra do lỗi UPDATE.');
  }

  // --- BƯỚC 4: DELETE & VERIFY CASCADE --- //
  console.log('\n[4] Thử nghiệm DELETE và xác thực xóa theo tầng (onDelete: Cascade)');
  try {
    // Chỉ cần xóa Account, các bản ghi liên quan phải tự động bị xóa
    await prisma.account.delete({ where: { id: accountId } });
    console.log(`   -> Thành công: Đã gửi lệnh xóa Account (ID: ${accountId})`);

    // Xác thực
    const deletedUser = await prisma.user.findUnique({ where: { id: userId } });
    const deletedUserRole = await prisma.userRole.findFirst({ where: { user_id: userId } });
    
    if (deletedUser) throw new Error('Xóa thất bại: User vẫn còn tồn tại');
    console.log('   -> Xác thực thành công: User đã được xóa theo.');

    if (deletedUserRole) throw new Error('Xóa thất bại: UserRole vẫn còn tồn tại');
    console.log('   -> Xác thực thành công: UserRole đã được xóa theo.');

  } catch (error) {
    console.error('   -> Thất bại ở bước DELETE:', error);
    throw new Error('Dừng kiểm tra do lỗi DELETE.');
  }

  console.log('\n--- Kịch bản kiểm tra CSDL đã hoàn tất thành công! ---');
}

main()
  .catch((e) => {
    console.error('\n--- ĐÃ XẢY RA LỖI NGHIÊM TRỌNG ---');
    console.error(e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n--- Đã ngắt kết nối với cơ sở dữ liệu. ---');
  });

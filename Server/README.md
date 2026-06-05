- Cập nhật schema 
npx prisma migrate dev --name add_account_table
- Genarate lại
npx prisma generate
- Reset database
npx prisma migrate reset

- Trực quan hóa CSDL
+ npx prisma studio

- Test
npx tsx test-db.ts

* Redis setup

- Tạo container Redis
docker run --name redis-local -p 6379:6379 -d redis

- kết nối vào Redis:

 docker exec -it redis-local redis-cli


 * Tạo mã bí mật
 node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"


 * Test email

npx tsx src\test\test-email.ts
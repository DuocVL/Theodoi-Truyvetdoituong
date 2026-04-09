- Cập nhật schema 
npx prisma migrate dev --name add_account_table
- Genarate lại
npx prisma generate
- Reset database
npx prisma migrate reset
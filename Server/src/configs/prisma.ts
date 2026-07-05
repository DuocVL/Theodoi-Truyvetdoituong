import { env } from '../configs/env.js';
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

//tệp cấu hình prisma

const connectionString = env.DATABASE_URL;//lấy URL csdl

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
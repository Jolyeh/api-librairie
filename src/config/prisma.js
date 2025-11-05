/* import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient(); */

import { PrismaClient } from "../generated/prisma/client.js";

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export { prisma };
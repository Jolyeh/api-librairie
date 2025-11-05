import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
    console.log("Starting seeding...");

    const roles = [
        { name: 'ADMIN' },
        { name: 'SELLER' },
        { name: 'BUYER' }
    ];

    for (const role of roles) {
        const exist = await prisma.role.findUnique({ where: { name: role.name } });
        if (!exist) {
            await prisma.role.create({ data: role });
        }
    }

    const statuses = [
        { name: 'PENDING' },
        { name: 'CONFIRM' },
        { name: 'REFUSE' }
    ];

    for (const status of statuses) {
        const exist = await prisma.status.findUnique({ where: { name: status.name } });
        if (!exist) {
            await prisma.status.create({ data: status });
        }
    }

    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.create({
        data: {
            name: 'Joel',
            surname: 'Prince',
            email: 'yehezekocolojoelprince@gmail.com',
            password: hashedPassword,
            roleId: adminRole.id
        }
    });

    const categories = [
        { name: 'Informatique' },
        { name: 'Science' },
        { name: 'Roman' },
        { name: 'Histoire' },
        { name: 'Art' },
        { name: 'Jeunesse' },
        { name: 'Pratique' },
        { name: 'Loisirs' },
        { name: 'Bande Dessinée' },
        { name: 'Manga' },
        { name: 'Comics' },
        { name: 'Philosophie' },
        { name: 'Poésie / Théâtre' },
        { name: 'Théâtre' },
        { name: 'Spiritualité' },
        { name: 'Religion' }
    ];

    for (const category of categories) {
        const exist = await prisma.category.findUnique({ where: { name: category.name } });
        if (!exist) {
            await prisma.category.create({ data: category });
        }
    }

    console.log("Seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

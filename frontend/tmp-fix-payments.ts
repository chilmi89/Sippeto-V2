import prisma from "./src/lib/prisma";

async function makeGlobal() {
    await prisma.payment_methods.updateMany({
        data: { profile_id: null }
    });
    console.log('Done mapping to global!');
}
makeGlobal()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

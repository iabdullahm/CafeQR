
const { PrismaClient } = require('@prisma/client');

async function testConn(url) {
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });
  try {
    console.log(`Testing ${url}...`);
    await prisma.$connect();
    console.log('CONNECTED!');
    return true;
  } catch (e) {
    console.error(`FAILED: ${e.message.substring(0, 50)}...`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const urls = [
    'postgresql://postgres:postgres@localhost:5432/cafeqr_db',
    'postgresql://postgres:Admin@123@localhost:5432/cafeqr_db',
    'postgresql://postgres:admin@localhost:5432/cafeqr_db',
    'postgresql://postgres:password@localhost:5432/cafeqr_db',
    'postgresql://postgres@localhost:5432/cafeqr_db',
    'postgresql://admin:admin@localhost:5432/cafeqr_db',
  ];

  for (const url of urls) {
    if (await testConn(url)) {
      console.log('FOUND WORKING URL:', url);
      process.exit(0);
    }
  }
}

main();

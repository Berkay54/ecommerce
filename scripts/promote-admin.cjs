const dotenv = require("dotenv");
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@"))
    throw new Error(
      "Kullanım: npm.cmd run admin:promote -- mevcut-kullanici@alan.com",
    );
  const url = new URL(process.env.DATABASE_URL);
  const db = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: url.href, connectionTimeoutMillis: 5000, max: 1 },
      { schema: url.searchParams.get("schema") ?? "public" },
    ),
  });
  try {
    const user = await db.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (!user)
      throw new Error(
        "Mevcut bir kullanıcı bulunamadı. Önce gerçek hesabınızla kayıt olun. Yeni kullanıcı oluşturulmadı.",
      );
    await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    console.log(
      "Mevcut hesabın rolü ADMIN olarak güncellendi. Yeni kullanıcı oluşturulmadı.",
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

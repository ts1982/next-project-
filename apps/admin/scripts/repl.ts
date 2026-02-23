import { PrismaClient } from "@prisma/client";
import repl from "repl";

const prisma = new PrismaClient();

console.log(
  "✅ Prisma REPL ready! Use `prisma` variable to interact with the database."
);
console.log("Example: await prisma.user.findMany()");
console.log("");

const replServer = repl.start({
  prompt: "prisma> ",
  useGlobal: true,
  ignoreUndefined: true,
});

replServer.context.prisma = prisma;

// Ctrl+C または .exit でクリーンアップ
replServer.on("exit", async () => {
  await prisma.$disconnect();
  console.log("\n👋 Disconnected from database");
  process.exit(0);
});

import "dotenv/config"
import { defineConfig } from "drizzle-kit"

const dbFileName = process.env.DB_FILE_NAME
if (!dbFileName) throw new Error("環境変数「DB_FILE_NAME」が設定されていません")

export default defineConfig({
	out: "./drizzle",
	schema: "./app/db/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: dbFileName,
	},
})

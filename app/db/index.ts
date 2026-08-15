import "dotenv/config"
import { drizzle } from "drizzle-orm/libsql"

const dbFileName = process.env.DB_FILE_NAME
if (!dbFileName) throw new Error("環境変数「DB_FILE_NAME」が設定されていません")

export const db = drizzle(`file:${dbFileName}`)
export type DrizzleDB = typeof db

import { $ } from "bun"
import * as v from "valibot"
import { logError, logInfo } from "../utils/logger"

const UserSchema = v.object({ login: v.string() })

export async function getGitHubUserName() {
	logInfo("GitHubのユーザー名を取得しています...")
	const shellResult = await $`gh api user`.quiet().nothrow()
	if (shellResult.exitCode !== 0) {
		logError("GitHubのユーザー名取得に失敗しました。")
		process.exit(1)
	}

	const parseResult = v.safeParse(UserSchema, shellResult.json())
	if (!parseResult.success) {
		logError("GitHubのユーザー情報の解析に失敗しました。")
		process.exit(1)
	}

	const userName = parseResult.output.login
	logInfo([
		"GitHubのユーザーログインIDを取得しました。",
		`LOGIN ID : ${userName}`,
	])
	return userName
}

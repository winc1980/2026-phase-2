import { $ } from "bun"
import { logError, logInfo } from "../utils/logger"

export async function getGitHubUserName() {
	logInfo("GitHubのユーザー名を取得しています...")
	const shellResult = await $`gh api user --jq .login`.quiet().nothrow()
	if (shellResult.exitCode !== 0) {
		logError("GitHubのユーザー名取得に失敗しました。")
		process.exit(1)
	}
	const userName = shellResult.text().trim()
	logInfo([
		"GitHubのユーザーログインIDを取得しました。",
		`LOGIN ID : ${userName}`,
	])
	return userName
}

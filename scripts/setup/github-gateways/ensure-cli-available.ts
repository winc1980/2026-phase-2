import { $ } from "bun"
import { logError, logInfo } from "../utils/logger"

export async function ensureGitHubCliAvailable() {
	const versionResult = await $`gh --version`.quiet().nothrow()
	if (versionResult.exitCode !== 0) {
		logError(
			"「gh」コマンドが見つかりません。GitHub CLIをインストールしてください。",
		)
		process.exit(1)
	}
	logInfo("GitHub CLIが使用可能であることを確認できました。")

	logInfo("GitHub CLIでユーザー認証されているか確認しています...")
	const authResult = await $`gh auth status`.quiet().nothrow()
	if (authResult.exitCode !== 0) {
		logError([
			"GitHub CLIでログインしていません。次のコマンドを実行してログイン操作を行ってください。",
			"gh auth login",
		])
		process.exit(1)
	}
	logInfo("GitHub CLIでユーザー認証済みであることが確認できました。")
}

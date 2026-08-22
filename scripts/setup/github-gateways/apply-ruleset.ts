import { $, file } from "bun"
import { logError, logInfo } from "../utils/logger"
import { GITHUB_REPO_NAME } from "./constants"
import { findMainProtectionRulesetId } from "./ruleset-utils"

async function readRuleset() {
	try {
		const rulesetFile = file("./scripts/setup/main-protection-ruleset.json")
		const ruleset = await rulesetFile.text()
		return ruleset
	} catch {
		logError("ルールセットファイルの読み込みに失敗しました。")
		process.exit(1)
	}
}

export async function applyRuleset(userName: string) {
	logInfo("ルールセットの一覧を取得しています...")
	const rulesetId = await findMainProtectionRulesetId(userName)

	const isExisting = rulesetId !== undefined

	if (isExisting) {
		logInfo([
			"既存のルールセットがあることが確認されました。",
			"内容を更新します...",
		])
		const id = rulesetId
		const ruleset = await readRuleset()
		const shellUpdateResult =
			await $`echo '${ruleset}' | gh api --method PUT /repos/${userName}/${GITHUB_REPO_NAME}/rulesets/${id} --input -`
				.quiet()
				.nothrow()

		if (shellUpdateResult.exitCode !== 0) {
			logError("ルールセットの更新に失敗しました。")
			process.exit(1)
		}
		logInfo("ルールセットを更新しました。")
		return
	}

	logInfo("新しくルールセットを作成します...")
	const ruleset = await readRuleset()
	const shellCreateResult =
		await $`echo '${ruleset}' | gh api --method POST /repos/${userName}/${GITHUB_REPO_NAME}/rulesets --input -`
			.quiet()
			.nothrow()

	if (shellCreateResult.exitCode !== 0) {
		logError("ルールセットの作成に失敗しました。")
		process.exit(1)
	}
	logInfo("ルールセットを作成しました。")
	return
}

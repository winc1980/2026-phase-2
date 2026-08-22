import { $ } from "bun"
import { logError } from "../utils/logger"
import { GITHUB_REPO_NAME } from "./constants"

export const MAIN_PROTECTION_RULESET_NAME = "main-protection"

export async function findMainProtectionRulesetId(
	userName: string,
): Promise<number | undefined> {
	const shellListResult =
		await $`gh api /repos/${userName}/${GITHUB_REPO_NAME}/rulesets`
			.quiet()
			.nothrow()

	if (shellListResult.exitCode !== 0) {
		logError("ルールセット一覧の取得に失敗しました。")
		process.exit(1)
	}

	const targetRule = (
		JSON.parse(shellListResult.text().trim()) as {
			name: string
			id: number
		}[]
	).find((rule) => rule.name === MAIN_PROTECTION_RULESET_NAME)

	return targetRule?.id
}

export async function setRulesetEnforcement(
	userName: string,
	rulesetId: number,
	enforcement: "active" | "disabled",
) {
	const body = JSON.stringify({ enforcement })
	const shellResult =
		await $`echo '${body}' | gh api --method PUT /repos/${userName}/${GITHUB_REPO_NAME}/rulesets/${rulesetId} --input -`
			.quiet()
			.nothrow()

	if (shellResult.exitCode !== 0) {
		logError(
			`ルールセットの enforcement を「${enforcement}」に変更できませんでした。`,
		)
		process.exit(1)
	}
}

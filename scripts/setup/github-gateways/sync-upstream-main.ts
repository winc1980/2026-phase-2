import { $ } from "bun"
import { logError, logInfo } from "../utils/logger"
import {
	findMainProtectionRulesetId,
	setRulesetEnforcement,
} from "./ruleset-utils"

export async function syncUpstreamMain(userName: string) {
	const rulesetId = await findMainProtectionRulesetId(userName)

	if (rulesetId !== undefined) {
		logInfo(
			"upstreamの変更を取り込むため、ルールセットを一時的に無効化します...",
		)
		await setRulesetEnforcement(userName, rulesetId, "disabled")
	}

	let syncError: string | null = null

	try {
		const checkoutResult = await $`git checkout main`.quiet().nothrow()
		if (checkoutResult.exitCode !== 0) {
			syncError = "ブランチ「main」への切り替えに失敗しました。"
		}

		if (syncError === null) {
			const pullResult = await $`git pull upstream main`.quiet().nothrow()
			if (pullResult.exitCode !== 0) {
				syncError = "リモート「upstream」の「main」からのpullに失敗しました。"
			}
		}

		if (syncError === null) {
			const pushResult = await $`git push origin main`.quiet().nothrow()
			if (pushResult.exitCode !== 0) {
				syncError = "リモート「origin」の「main」へのpushに失敗しました。"
			}
		}
	} finally {
		if (rulesetId !== undefined) {
			await setRulesetEnforcement(userName, rulesetId, "active")
			logInfo("ルールセットを再度有効化しました。")
		}
	}

	if (syncError !== null) {
		logError(syncError)
		process.exit(1)
	}

	logInfo("リモート「upstream」の「main」の変更を取り込みました。")
}

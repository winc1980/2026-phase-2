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

	let syncError: string | string[] | null = null

	try {
		const checkoutResult = await $`git checkout main`.quiet().nothrow()
		if (checkoutResult.exitCode !== 0) {
			syncError = "ブランチ「main」への切り替えに失敗しました。"
		}

		if (syncError === null) {
			const fetchResult = await $`git fetch upstream`.quiet().nothrow()
			if (fetchResult.exitCode !== 0) {
				syncError = "リモート「upstream」からのfetchに失敗しました。"
			}
		}

		if (syncError === null) {
			// 受講者のmainには自分のPull Requestのマージが積まれているため、履歴を書き換えないマージで取り込む。
			// pullではなくmergeを直接使うことで、ローカルのpull.rebase設定に挙動を左右されないようにする。
			const mergeResult = await $`git merge --no-edit upstream/main`
				.quiet()
				.nothrow()
			if (mergeResult.exitCode !== 0) {
				// 中断したマージ状態を残さないように元に戻す
				await $`git merge --abort`.quiet().nothrow()
				syncError = [
					"リモート「upstream」の「main」の取り込みに失敗しました。",
					"コンフリクトが発生している可能性があります。次のコマンドで手動で取り込み、解決してください。",
					"git merge upstream/main",
				]
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

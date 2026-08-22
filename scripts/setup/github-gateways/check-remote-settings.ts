import { $ } from "bun"
import { logError, logInfo } from "../utils/logger"
import { GITHUB_REPO_NAME, GITHUB_WINC_OWNER_ID } from "./constants"

function extractRepoInfoFromUrl(
	url: string,
): { owner: string; repo: string } | null {
	const regExp = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/

	const matchResult = url.match(regExp)
	if (matchResult === null) return null
	const [, owner, repo] = matchResult
	if (!owner || !repo) return null
	return { owner, repo }
}

export async function checkRemoteOriginSettings(userName: string) {
	const shellResult = await $`git config --get "remote.origin.url"`
		.quiet()
		.nothrow()

	if (shellResult.exitCode !== 0) {
		logError("リモート「origin」のURLの取得に失敗しました。")
		process.exit(1)
	}

	const url = shellResult.text().trim()

	const extractResult = extractRepoInfoFromUrl(url)
	if (extractResult === null) {
		logError("リモート「origin」の解析に失敗しました。")
		process.exit(1)
	}

	const { owner, repo } = extractResult

	if (owner !== userName) {
		logError([
			"リモート「origin」の owner がユーザーと一致していません。",
			`owner : ${owner}`,
		])
		process.exit(1)
	}

	if (repo !== GITHUB_REPO_NAME) {
		logError([
			`リモート「origin」のリポジトリ名が「${GITHUB_REPO_NAME}」と一致していません。`,
			`repo : ${repo}`,
		])
		process.exit(1)
	}

	logInfo([
		"リモート「origin」が正しく設定されていることを確認しました。",
		`url : ${url}`,
		`owner : ${owner}`,
		`repo : ${repo}`,
	])
}

export async function checkRemoteUpstreamSettings() {
	const shellResult = await $`git config --get "remote.upstream.url"`
		.quiet()
		.nothrow()

	if (shellResult.exitCode !== 0) {
		logError("リモート「upstream」のURLの取得に失敗しました。")
		process.exit(1)
	}

	const url = shellResult.text().trim()

	const extractResult = extractRepoInfoFromUrl(url)
	if (extractResult === null) {
		logError("リモート「upstream」の解析に失敗しました。")
		process.exit(1)
	}

	const { owner, repo } = extractResult

	if (owner !== GITHUB_WINC_OWNER_ID) {
		logError([
			`リモート「upstream」の owner が「${GITHUB_WINC_OWNER_ID}」と一致していません。`,
			`owner : ${owner}`,
		])
		process.exit(1)
	}

	if (repo !== GITHUB_REPO_NAME) {
		logError([
			`リモート「upstream」のリポジトリ名が「${GITHUB_REPO_NAME}」と一致していません。`,
			`repo : ${repo}`,
		])
		process.exit(1)
	}

	logInfo([
		"リモート「upstream」が正しく設定されていることを確認しました。",
		`url : ${url}`,
		`owner : ${owner}`,
		`repo : ${repo}`,
	])
}

export async function disableRemoteUpstreamPush() {
	const shellResult = await $`git remote set-url --push upstream DISABLED`
		.quiet()
		.nothrow()

	if (shellResult.exitCode !== 0) {
		logError("リモート「upstream」へのプッシュ無効化に失敗しました。")
		process.exit(1)
	}

	logInfo("リモート「upstream」へのプッシュを無効化しました。")
}

export async function setRemoteRepoDefault() {
	const shellResult = await $`gh repo set-default origin`.quiet().nothrow()
	if (shellResult.exitCode !== 0) {
		logError("デフォルトリポジトリの設定に失敗しました。")
		process.exit(1)
	}

	logInfo("デフォルトリポジトリをoriginに設定しました。")
}

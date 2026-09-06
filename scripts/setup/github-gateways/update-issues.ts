import { $, file, Glob } from "bun"
import matter from "gray-matter"
import * as v from "valibot"
import { logError, logInfo } from "../utils/logger"
import { GITHUB_REPO_NAME, LABEL_NAMES, type LabelName } from "./constants"

type Issue = {
	title: string
	body: string // MarkDown
	labels: [LabelName]
	assignees: [string]
}

type IssueFrontMatter = {
	seq: number
	title: string
	difficulty: LabelName
}

const IssueFrontMatterSchema = v.object({
	seq: v.number(),
	title: v.string(),
	difficulty: v.picklist(LABEL_NAMES),
}) satisfies v.GenericSchema<IssueFrontMatter>

const issueFileNameRegExp = /^(\d{2})-([a-z-]+)\.md$/

export async function enableIssues(userName: string) {
	const shellResult =
		await $`gh api --method PATCH /repos/${userName}/${GITHUB_REPO_NAME} -f has_issues=true`
			.quiet()
			.nothrow()
	if (shellResult.exitCode !== 0) {
		logError("Issueの有効化に失敗しました。")
		process.exit(1)
	}
	logInfo("Issueを有効化しました。")
}

export async function updateIssues(userName: string) {
	const existingIssueInfo = await fetchExistingIssueInfo(userName)

	const glob = new Glob("*.md")
	for await (const file of glob.scan("issues")) {
		const validationResult = await validateIssueFile(file)
		if (validationResult === null) {
			logInfo(`「${file}」はスキップされました。`)
			continue
		}
		const existing = existingIssueInfo.find(
			(info) => info.seq === validationResult.seq,
		)
		const newIssue: Issue = {
			title: `#${validationResult.seq} ${validationResult.title}`,
			body: validationResult.content,
			labels: [validationResult.difficulty],
			assignees: [userName],
		}
		if (existing) {
			// 更新処理

			logInfo(`Issue #${validationResult.seq} を更新しています。`)
			const apiResult =
				await $`echo '${JSON.stringify(newIssue)}' | gh api --method PATCH /repos/${userName}/${GITHUB_REPO_NAME}/issues/${existing.number} --input -`
					.quiet()
					.nothrow()
			if (apiResult.exitCode !== 0) {
				logError(`Issue #${validationResult.seq} の更新に失敗しました。`)
				process.exit(1)
			}
			logInfo(`Issue #${validationResult.seq} を更新しました。`)
			continue
		}

		// 新規登録処理

		logInfo(`Issue #${validationResult.seq} を作成しています。`)
		const apiResult =
			await $`echo '${JSON.stringify(newIssue)}' | gh api --method POST /repos/${userName}/${GITHUB_REPO_NAME}/issues --input -`
				.quiet()
				.nothrow()
		if (apiResult.exitCode !== 0) {
			logError(`Issue #${validationResult.seq} の作成に失敗しました。`)
			process.exit(1)
		}
		logInfo(`Issue #${validationResult.seq} を作成しました。`)
	}
}

export async function fetchExistingIssueInfo(userName: string) {
	const issues = await fetchAllIssues(userName)

	const objectParser = v.pipe(
		v.object({ number: v.number(), title: v.string() }),
		v.rawTransform(({ dataset, addIssue, NEVER }) => {
			const regExpResult = dataset.value.title.match(/^#(\d+)\s/)
			if (regExpResult === null) {
				addIssue({ message: "有効なタイトルの形式ではありません" })
				return NEVER
			}
			const seq = Number(regExpResult[1])
			return {
				number: dataset.value.number,
				seq,
			}
		}),
	)

	const issuesInfo: { number: number; seq: number }[] = []

	for (const issueInfo of issues) {
		const objectParseResult = v.safeParse(objectParser, issueInfo)
		if (!objectParseResult.success) continue
		issuesInfo.push(objectParseResult.output)
	}

	return issuesInfo
}

/** 1ページあたりのIssue取得件数（GitHub APIの上限値） */
const ISSUES_PER_PAGE = 100

/** Issueの一覧を全ページ分取得する */
async function fetchAllIssues(userName: string) {
	const pageParser = v.array(
		v.object({ number: v.number(), title: v.string() }),
	)

	const issues: { number: number; title: string }[] = []

	for (let page = 1; ; page++) {
		const shellResult =
			await $`gh api --method GET /repos/${userName}/${GITHUB_REPO_NAME}/issues -f state=all -f per_page=${ISSUES_PER_PAGE} -f page=${page}`
				.quiet()
				.nothrow()
		if (shellResult.exitCode !== 0) {
			logError("Issueの一覧の取得に失敗しました。")
			process.exit(1)
		}

		const pageParseResult = v.safeParse(pageParser, shellResult.json())
		if (!pageParseResult.success) {
			logError("Issueの解析に失敗しました。")
			process.exit(1)
		}

		issues.push(...pageParseResult.output)
		// 取得件数が上限に満たなければ最終ページ
		if (pageParseResult.output.length < ISSUES_PER_PAGE) break
	}

	return issues
}

async function validateIssueFile(
	fileName: string,
): Promise<(IssueFrontMatter & { content: string }) | null> {
	// ファイル名のパターンマッチ
	const matchResult = fileName.match(issueFileNameRegExp)
	if (matchResult === null) return null

	const seqNumber = Number(matchResult[1])
	// 英語の短縮名
	const _issueName = matchResult[2]

	// フロントマターをパース
	const issueFile = file(`issues/${fileName}`)
	const { data, content } = matter(await issueFile.text())
	const validationResult = v.safeParse(IssueFrontMatterSchema, data)
	if (!validationResult.success) return null
	const frontMatter: IssueFrontMatter = validationResult.output
	if (seqNumber !== frontMatter.seq) return null

	return { ...frontMatter, content }
}

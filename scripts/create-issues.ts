import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as readline from "node:readline/promises"

type Difficulty = "Easy" | "Normal" | "Hard"

type IssueDef = {
	file: string
	seq: number
	difficulty: Difficulty
	title: string
	body: string
}

const DIFFICULTIES: Difficulty[] = ["Easy", "Normal", "Hard"]

const LABEL_COLORS: Record<Difficulty, string> = {
	Easy: "0e8a16",
	Normal: "fbca04",
	Hard: "d93f0b",
}

const LABEL_DESCRIPTIONS: Record<Difficulty, string> = {
	Easy: "初心者向けの課題",
	Normal: "標準的な難易度の課題",
	Hard: "発展的な難易度の課題",
}

const ISSUES_DIR = join(import.meta.dirname, "..", "issues")

function parseArgs(argv: string[]) {
	const args = {
		dryRun: false,
		yes: false,
		repo: undefined as string | undefined,
		only: undefined as Set<number> | undefined,
	}

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i]
		if (arg === "--dry-run") {
			args.dryRun = true
		} else if (arg === "--yes" || arg === "-y") {
			args.yes = true
		} else if (arg === "--repo") {
			args.repo = argv[++i]
		} else if (arg === "--only") {
			const csv = argv[++i]
			if (!csv)
				throw new Error("--only にはカンマ区切りの番号を指定してください")
			args.only = new Set(csv.split(",").map((s) => Number(s.trim())))
		} else {
			throw new Error(`不明な引数です: ${arg}`)
		}
	}

	return args
}

function ensureGhAvailable() {
	try {
		execFileSync("gh", ["--version"], { stdio: "ignore" })
	} catch {
		console.error(
			"エラー: `gh` コマンドが見つかりません。GitHub CLI をインストールしてください。\n" +
				"https://github.com/cli/cli#installation",
		)
		process.exit(1)
	}

	try {
		execFileSync("gh", ["auth", "status"], { stdio: "ignore" })
	} catch {
		console.error(
			"エラー: `gh` にログインしていません。`gh auth login` を実行してください。",
		)
		process.exit(1)
	}
}

function parseOwnerRepo(remoteUrl: string): string | undefined {
	const match = remoteUrl
		.trim()
		.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/)
	if (!match) return undefined
	const [, owner, repo] = match
	return `${owner}/${repo}`
}

function resolveRepo(explicitRepo: string | undefined): string {
	if (explicitRepo) return explicitRepo

	try {
		const out = execFileSync("git", ["remote", "get-url", "origin"], {
			encoding: "utf-8",
		})
		const repo = parseOwnerRepo(out)
		if (!repo) throw new Error("empty")
		return repo
	} catch {
		console.error(
			"エラー: 対象リポジトリを特定できませんでした。\n" +
				"originリモートが設定されていないか、GitHubのURL形式ではありません。\n" +
				"`--repo owner/name` を指定して実行し直してください。",
		)
		return process.exit(1)
	}
}

function parseFrontmatter(
	raw: string,
	file: string,
): { data: Record<string, string>; body: string } {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
	if (!match) {
		throw new Error(`${file}: frontmatter (--- ... ---) が見つかりません`)
	}
	const [, frontmatterRaw, body] = match

	const data: Record<string, string> = {}
	for (const line of frontmatterRaw.split("\n")) {
		if (!line.trim()) continue
		const sep = line.indexOf(":")
		if (sep === -1) {
			throw new Error(`${file}: frontmatterの行が不正です: "${line}"`)
		}
		const key = line.slice(0, sep).trim()
		const value = line.slice(sep + 1).trim()
		data[key] = value
	}

	return { data, body: body.trim() }
}

function loadIssueDefs(): IssueDef[] {
	const files = readdirSync(ISSUES_DIR)
		.filter((f) => /^\d+-.+\.md$/.test(f))
		.sort()

	const defs: IssueDef[] = []
	const errors: string[] = []

	for (const file of files) {
		const raw = readFileSync(join(ISSUES_DIR, file), "utf-8")
		try {
			const { data, body } = parseFrontmatter(raw, file)

			const seq = Number(data.seq)
			if (!data.seq || Number.isNaN(seq)) {
				errors.push(`${file}: seq が不正です ("${data.seq}")`)
				continue
			}

			const difficulty = data.difficulty as Difficulty
			if (!DIFFICULTIES.includes(difficulty)) {
				errors.push(
					`${file}: difficulty が不正です ("${data.difficulty}")。${DIFFICULTIES.join(" / ")} のいずれかにしてください`,
				)
				continue
			}

			if (!data.title) {
				errors.push(`${file}: title がありません`)
				continue
			}

			if (!body) {
				errors.push(`${file}: 本文が空です`)
				continue
			}

			defs.push({ file, seq, difficulty, title: data.title, body })
		} catch (e) {
			errors.push(e instanceof Error ? e.message : String(e))
		}
	}

	if (errors.length > 0) {
		console.error(
			"issueファイルの検証に失敗しました。1件も作成せず終了します。\n",
		)
		for (const err of errors) console.error(`  - ${err}`)
		process.exit(1)
	}

	defs.sort((a, b) => a.seq - b.seq)
	return defs
}

function issueTitle(def: IssueDef): string {
	return `#${def.seq}[${def.difficulty}]${def.title}`
}

async function confirm(message: string): Promise<boolean> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})
	try {
		const answer = await rl.question(`${message} [y/N]: `)
		return answer.trim().toLowerCase() === "y"
	} finally {
		rl.close()
	}
}

function ensureLabels(repo: string, difficulties: Set<Difficulty>) {
	for (const difficulty of difficulties) {
		execFileSync(
			"gh",
			[
				"label",
				"create",
				difficulty,
				"--repo",
				repo,
				"--color",
				LABEL_COLORS[difficulty],
				"--description",
				LABEL_DESCRIPTIONS[difficulty],
				"--force",
			],
			{ stdio: "ignore" },
		)
	}
}

function enableIssue(repo: string) {
	execFileSync("gh", ["repo", "edit", repo, "--enable-issues",], {
		stdio: "ignore",
	})
}

function createIssue(repo: string, def: IssueDef): string {
	const tmpFile = join(tmpdir(), `winc-issue-${def.seq}-${Date.now()}.md`)
	writeFileSync(tmpFile, def.body, "utf-8")
	try {
		const out = execFileSync(
			"gh",
			[
				"issue",
				"create",
				"--repo",
				repo,
				"--title",
				issueTitle(def),
				"--body-file",
				tmpFile,
				"--label",
				def.difficulty,
			],
			{ encoding: "utf-8" },
		)
		return out.trim()
	} finally {
		rmSync(tmpFile, { force: true })
	}
}

async function main() {
	let args: ReturnType<typeof parseArgs>
	try {
		args = parseArgs(process.argv.slice(2))
	} catch (e) {
		console.error(`エラー: ${e instanceof Error ? e.message : String(e)}`)
		process.exit(1)
	}

	ensureGhAvailable()

	const repo = resolveRepo(args.repo)
	let defs = loadIssueDefs()

	if (args.only) {
		defs = defs.filter((d) => args.only?.has(d.seq))
		if (defs.length === 0) {
			console.error(
				"エラー: --only で指定された番号に該当するissueがありません",
			)
			process.exit(1)
		}
	}

	console.log(`対象リポジトリ: ${repo}`)
	console.log(`作成予定のIssue: ${defs.length}件\n`)

	for (const def of defs) {
		console.log(`  ${issueTitle(def)}`)
		if (args.dryRun) {
			const preview = def.body.split("\n").slice(0, 3).join("\n")
			console.log(`    ${preview.split("\n").join("\n    ")}\n`)
		}
	}

	if (args.dryRun) {
		console.log("\n--dry-run のため、実際の作成は行いませんでした。")
		return
	}

	if (!args.yes) {
		const ok = await confirm(
			`\n${repo} に上記 ${defs.length} 件のIssueを作成します。よろしいですか？`,
		)
		if (!ok) {
			console.log("中止しました。")
			return
		}
	}

	const difficulties = new Set(defs.map((d) => d.difficulty))
	console.log("\nラベルを準備しています...")
	ensureLabels(repo, difficulties)

	console.log("\nIssueを有効化しています...")
	enableIssue(repo)

	console.log("\nIssueを作成しています...")
	const succeeded: string[] = []
	const failed: { def: IssueDef; error: unknown }[] = []

	for (const def of defs) {
		try {
			const url = createIssue(repo, def)
			console.log(`  ✓ ${issueTitle(def)} -> ${url}`)
			succeeded.push(url)
		} catch (error) {
			console.error(`  ✗ ${issueTitle(def)} -> 失敗`)
			failed.push({ def, error })
		}
	}

	console.log(`\n成功: ${succeeded.length}件 / 失敗: ${failed.length}件`)

	if (failed.length > 0) {
		console.error("\n失敗したIssue:")
		for (const { def, error } of failed) {
			console.error(
				`  - ${issueTitle(def)}: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
		process.exit(1)
	}
}

main()

import { $ } from "bun"
import { logError, logInfo } from "../utils/logger"
import { GITHUB_REPO_NAME, MENTORS } from "./constants"

export async function inviteMentor(userName: string) {
	logInfo("メンターをCollaboratorとして招待しています...")
	const promises = MENTORS.map(async (mentor) => {
		const shellCheckResult =
			await $`gh api /repos/${userName}/${GITHUB_REPO_NAME}/collaborators/${mentor}`
				.quiet()
				.nothrow()
		if (shellCheckResult.exitCode === 0) {
			logInfo(`${mentor}はすでにCollaboratorとして登録されています。`)
			return
		}
		logInfo(`${mentor}をCollaboratorとして登録しています...`)
		await $`gh api --method PUT /repos/${userName}/${GITHUB_REPO_NAME}/collaborators/${mentor} -f 'permission=admin'`.quiet()
		logInfo(`${mentor}をCollaboratorとして招待しました。`)
	})

	try {
		await Promise.all(promises)
	} catch {
		logError("メンターの招待に失敗しました。")
		process.exit(1)
	}

	logInfo(["メンター全員の招待に成功しました。", MENTORS.join(", ")])
}

export const GITHUB_WINC_OWNER_ID = "winc1980"
export const GITHUB_REPO_NAME = "2026-phase-2"

export const MENTORS = ["Hattori-1104"]

export const LABEL_NAMES = ["EASY", "NORMAL", "HARD", "EXTREME"] as const

export type LabelName = (typeof LABEL_NAMES)[number]

export const LABEL_COLORS: Record<LabelName, string> = {
	EASY: "047D39",
	NORMAL: "067FC2",
	HARD: "E6500F",
	EXTREME: "7422E7",
}

export const LABEL_DESCRIPTIONS: Record<LabelName, string> = {
	EASY: "基礎的な難易度の課題",
	NORMAL: "標準的、発展的な難易度の課題",
	HARD: "発展的で他分野の知識が必要な課題",
	EXTREME: "専門的で複数レイヤーにまたがる技能が求められる課題",
}

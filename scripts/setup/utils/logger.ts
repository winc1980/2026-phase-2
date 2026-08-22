export function logInfo(message: string | string[]) {
	const prefix = "[INFO]"

	if (typeof message === "string") {
		console.log(`${prefix} ${message}`)
	} else if (typeof message === "object") {
		let firstLine = true
		for (const line of message) {
			if (firstLine) {
				console.log(`${prefix} ${line}`)
				firstLine = false
			} else {
				console.log(`${" ".repeat(prefix.length)} - ${line}`)
			}
		}
	}
}

export function logError(message: string | string[]) {
	const prefix = "[ERROR]"

	if (typeof message === "string") {
		console.error(`${prefix} ${message}`)
	} else if (typeof message === "object") {
		let firstLine = true
		for (const line of message) {
			if (firstLine) {
				console.error(`${prefix} ${line}`)
				firstLine = false
			} else {
				console.error(`${" ".repeat(prefix.length)} - ${line}`)
			}
		}
	}
}

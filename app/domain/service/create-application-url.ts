export function createApplicationUrl(
	token: string,
	origin: string,
	message: string,
) {
	return `${origin}/app/out/${message}/live-application/${encodeURIComponent(token)}`
}

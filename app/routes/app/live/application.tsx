import {
	ChevronsUpDownIcon,
	CopyIcon,
	LoaderCircleIcon,
	PauseIcon,
	PlayIcon,
	SendIcon,
} from "lucide-react"
import { useRef, useState } from "react"
import { redirect, useFetcher } from "react-router"
import * as v from "valibot"
import { showToast } from "~/components/common/toast"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "~/components/ui/collapsible"
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { Separator } from "~/components/ui/separator"
import { Switch } from "~/components/ui/switch"
import type { LiveApplication } from "~/domain/entities/live-application"
import { createApplicationUrl } from "~/domain/service/create-application-url"
import { formatPlainDateTime } from "~/lib/plain-datetime-utils"
import { wrapPromise } from "~/lib/result"
import { liveContext } from "~/middlewares/live"
import { repositoryContext } from "~/middlewares/repositories"
import {
	createSessionCommittedHeader,
	getSessionFromRequest,
} from "~/sessions/sessions"
import type { Route } from "./+types/application"

export type LiveApplicationWithUrl = LiveApplication & { url: string }

export async function loader({ context, request }: Route.LoaderArgs) {
	const { live, isOwner } = context.get(liveContext)

	const session = await getSessionFromRequest(request)

	if (!isOwner) {
		session.flash("toastPayload", {
			type: "error",
			message: "ライブ管理者ではないのでアクセスできません",
		})
		return redirect(`/app/live/${live.id}`)
	}

	const { liveRepository } = context.get(repositoryContext)
	const result = await liveRepository.getAllApplications(live.id)

	if (!result.success) throw result.error

	const applications = result.value

	const [availableApplicationsWithUrl, suspendedApplicationsWithUrl] =
		applications
			.map<LiveApplicationWithUrl>((apl) => ({
				...apl,
				url: createApplicationUrl(
					apl.token,
					new URL(request.url).origin,
					`${live.name}への参加の申請を受け付けています！`,
				),
			}))
			.reduce<[LiveApplicationWithUrl[], LiveApplicationWithUrl[]]>(
				(acc, apl) => {
					acc[apl.available ? 0 : 1].push(apl)
					return acc
				},
				[[], []],
			)

	return {
		availableApplicationsWithUrl,
		suspendedApplicationsWithUrl,
	}
}

export default function LiveApplicationPage({
	loaderData: { availableApplicationsWithUrl, suspendedApplicationsWithUrl },
}: Route.ComponentProps) {
	const [openCreateDialog, setOpenCreateDialog] = useState(false)
	const [initialAvailability, setInitialAvailability] = useState(false)

	const formRef = useRef<HTMLFormElement>(null)
	const fetcher1 = useFetcher()

	const fetcher2 = useFetcher()

	const handleCopy = async (url: string) => {
		const result = await wrapPromise(navigator.clipboard.writeText(url))
		if (!result.success) {
			showToast({
				type: "error",
				message: "クリップボードへのコピーが失敗しました",
			})
		}
		showToast({ type: "success", message: "申請リンクをコピーしました" })
	}

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold">バンドの募集</h1>
				<p className="text-muted-foreground text-sm">
					参加を希望するバンドにこのURLを共有してください
				</p>
			</div>
			<Collapsible>
				<Card>
					<CardHeader>
						<CardTitle className="flex justify-between items-center">
							<div>新しいバンド募集リンクを作成</div>
							<CollapsibleTrigger asChild>
								<Button size="icon" variant="ghost">
									<ChevronsUpDownIcon />
								</Button>
							</CollapsibleTrigger>
						</CardTitle>
					</CardHeader>
					<CollapsibleContent asChild>
						<CardContent>
							<fetcher1.Form method="POST" ref={formRef}>
								<input type="hidden" name="intent" value="create" />
								<FieldGroup>
									<Field>
										<FieldLabel htmlFor="application-name">
											募集分類名（任意）
										</FieldLabel>
										<FieldDescription>
											ライブ管理者の識別のためにのみ使用します。外部へ公開されません。
										</FieldDescription>
										<Input
											id="application-name"
											name="application-name"
											placeholder="例：一次募集"
										/>
									</Field>
									<Field>
										<FieldLabel>初期設定</FieldLabel>
										<div className="inline-flex gap-2">
											<Switch
												id="available"
												checked={initialAvailability}
												onCheckedChange={setInitialAvailability}
											/>
											<input
												type="hidden"
												name="initial-available"
												value={Number(initialAvailability)}
											/>
											<FieldLabel htmlFor="available">停止・有効</FieldLabel>
										</div>
									</Field>
									<Field>
										<Button
											type="button"
											className="w-full"
											onClick={() => setOpenCreateDialog(true)}
											disabled={fetcher1.state === "submitting"}
										>
											{fetcher1.state === "submitting" ? (
												<LoaderCircleIcon className="animate-spin" />
											) : (
												<SendIcon />
											)}
											作成
										</Button>
									</Field>
								</FieldGroup>
							</fetcher1.Form>
						</CardContent>
					</CollapsibleContent>
				</Card>
				<AlertDialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{initialAvailability
									? "本当に募集を始めてもいいですか？"
									: "募集リンクを作成します。"}
							</AlertDialogTitle>
							<AlertDialogDescription>
								<span>
									現在の初期設定は「{initialAvailability ? "有効" : "停止"}
									」です。
								</span>
								<span>いつでも停止・再開できます。</span>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>キャンセル</AlertDialogCancel>
							<AlertDialogAction
								type="button"
								onClick={() => {
									if (formRef.current) fetcher1.submit(formRef.current)
								}}
							>
								募集を始める
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</Collapsible>
			<Card>
				<CardHeader>
					<CardTitle className="flex gap-1 items-center">
						有効なリンク
					</CardTitle>
				</CardHeader>
				<CardContent>
					{availableApplicationsWithUrl.length === 0 ? (
						<span className="text-muted-foreground text-sm">
							有効なリンクはありません
						</span>
					) : (
						<div className="space-y-4">
							{availableApplicationsWithUrl.map((apl) => (
								<div className="space-y-1" key={apl.id}>
									<div className="w-full flex items-baseline gap-2">
										<span className="shrink-0">{apl.name}</span>
										<span className="shrink-0 text-muted-foreground text-xs">
											{formatPlainDateTime(apl.updatedAt)}
										</span>
									</div>
									<div className="flex gap-2 items-center">
										<div className="grow truncate text-muted-foreground py-2 px-4 bg-muted rounded-lg">
											{apl.url}
										</div>
										<Button
											size="icon-lg"
											variant="destructive"
											onClick={() => {
												const formData = new FormData()
												formData.append("intent", "suspend-application")
												formData.append("application-id", String(apl.id))
												fetcher2.submit(formData, { method: "POST" })
											}}
										>
											<PauseIcon />
										</Button>
										<Button
											size="icon-lg"
											className="w-16"
											onClick={() => handleCopy(apl.url)}
										>
											<CopyIcon />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
				<Separator />
				<CardHeader>
					<CardTitle className="flex gap-1 items-center">
						停止されたリンク
					</CardTitle>
				</CardHeader>
				<CardContent>
					{suspendedApplicationsWithUrl.length === 0 ? (
						<span className="text-muted-foreground text-sm">
							有効なリンクはありません
						</span>
					) : (
						<div className="space-y-4">
							{suspendedApplicationsWithUrl.map((apl) => (
								<div className="space-y-1" key={apl.id}>
									<div className="shrink-0 inline-flex w-24 gap-2">
										<span className="shrink-0">{apl.name}</span>
										<span className="shrink-0 text-muted-foreground">
											{formatPlainDateTime(apl.updatedAt)}
										</span>
									</div>
									<div className="flex gap-2 items-center">
										<div className="grow truncate text-muted-foreground py-2 px-4 bg-muted rounded-lg">
											{apl.url}
										</div>
										<Button
											size="icon-lg"
											variant="destructive"
											onClick={() => {
												const formData = new FormData()
												formData.append("intent", "enable-application")
												formData.append("application-id", String(apl.id))
												fetcher2.submit(formData, { method: "POST" })
											}}
										>
											<PlayIcon />
										</Button>
										<Button
											size="icon-lg"
											className="w-16"
											onClick={() => handleCopy(apl.url)}
										>
											<CopyIcon />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

const FormDataSchema = v.variant("intent", [
	v.pipe(
		v.object({
			intent: v.literal("create"),
			"application-name": v.pipe(
				v.string(),
				v.transform((input) => (input === "" ? "募集" : input)),
			),
			"initial-available": v.pipe(
				v.string(),
				v.transform((input) => input === "1"),
				v.boolean(),
			),
		}),
		v.transform((input) => ({
			intent: input.intent,
			applicationName: input["application-name"],
			initialAvailable: input["initial-available"],
		})),
	),
	v.pipe(
		v.object({
			intent: v.picklist(["suspend-application", "enable-application"]),
			"application-id": v.pipe(
				v.string(),
				v.transform((input) => Number(input)),
			),
		}),
		v.transform((input) => ({
			intent: input.intent,
			applicationId: input["application-id"],
		})),
	),
])

export async function action({ request, context }: Route.ActionArgs) {
	const session = await getSessionFromRequest(request)

	const formData = await request.formData()
	const parseResult = await wrapPromise(
		v.parseAsync(FormDataSchema, Object.fromEntries(formData)),
	)

	if (!parseResult.success) {
		session.flash("toastPayload", {
			type: "error",
			message: "エラー：フォームの形式が不明です",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const formPayload = parseResult.value

	if (formPayload.intent === "create") {
		const { liveRepository } = context.get(repositoryContext)
		const { live } = context.get(liveContext)

		const creationResult = await liveRepository.createApplication(
			live.id,
			formPayload.applicationName,
			formPayload.initialAvailable,
		)

		if (!creationResult.success) {
			session.flash("toastPayload", {
				type: "error",
				message: "データベースエラー",
			})
			return new Response(null, {
				headers: await createSessionCommittedHeader(session),
			})
		}
		return
	}

	if (formPayload.intent === "suspend-application") {
		const { liveRepository } = context.get(repositoryContext)
		const result = await liveRepository.suspendApplication(
			formPayload.applicationId,
		)
		if (!result.success) {
			session.flash("toastPayload", {
				type: "error",
				message: "データベースエラー",
			})
			return new Response(null, {
				headers: await createSessionCommittedHeader(session),
			})
		}
		session.flash("toastPayload", {
			type: "info",
			message: "一つの募集を停止しました",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	if (formPayload.intent === "enable-application") {
		const { liveRepository } = context.get(repositoryContext)
		const result = await liveRepository.enableApplication(
			formPayload.applicationId,
		)
		if (!result.success) {
			session.flash("toastPayload", {
				type: "error",
				message: "データベースエラー",
			})
			return new Response(null, {
				headers: await createSessionCommittedHeader(session),
			})
		}
		session.flash("toastPayload", {
			type: "info",
			message: "一つの募集を再開しました",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}
}

import { LoaderCircleIcon, SendIcon } from "lucide-react"
import { Form, Link, redirect, useNavigation } from "react-router"
import { PasswordInput } from "~/components/common/PasswordInput"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSet,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { PasswordConfirmationMismatchError } from "~/domain/data/errors"
import { fail } from "~/lib/result"
import { repositoryContext } from "~/middlewares/repositories"
import { commitSession, getSession } from "~/sessions/sessions"
import type { Route } from "./+types/register"

export default function RegisterPage({ actionData }: Route.ComponentProps) {
	const navigation = useNavigation()

	return (
		<div className="h-full flex flex-col justify-center items-center gap-4 w-full">
			<Card className="w-full max-w-xl">
				<CardHeader>
					<CardTitle>新規アカウント登録</CardTitle>
				</CardHeader>
				<CardContent>
					<Form method="POST">
						<FieldGroup>
							<FieldSet>
								<FieldGroup>
									<Field>
										<FieldLabel htmlFor="name">名前</FieldLabel>
										<Input id="name" name="name" required />
									</Field>
									<Field>
										<FieldLabel htmlFor="mail">早稲田メールアドレス</FieldLabel>
										<Input
											id="mail"
											name="mail"
											placeholder="waseda@asagi.waseda.jp"
											required
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="password">パスワード</FieldLabel>
										<PasswordInput id="password" name="password" required />
									</Field>
									<Field>
										<FieldLabel htmlFor="passwordConfirm">
											パスワード（確認）
										</FieldLabel>
										<PasswordInput
											id="passwordConfirm"
											name="passwordConfirm"
											required
										/>
									</Field>
								</FieldGroup>
							</FieldSet>
							{actionData?.result && !actionData.result.success && (
								<Field>
									<FieldError>{actionData.result.error.message}</FieldError>
								</Field>
							)}
							<Field orientation="horizontal">
								<Button
									type="submit"
									className="w-full"
									disabled={navigation.state === "submitting"}
								>
									{navigation.state === "submitting" ? (
										<LoaderCircleIcon className="animate-spin" />
									) : (
										<SendIcon />
									)}
									登録する
								</Button>
							</Field>
						</FieldGroup>
					</Form>
				</CardContent>
			</Card>
			<Card className="w-full max-w-xl">
				<CardContent>
					<Button variant="link" className="w-full" asChild>
						<Link to="/auth/login">既にアカウントをお持ちの方はこちら</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}

export async function action({ request, context }: Route.ActionArgs) {
	const formData = await request.formData()
	const name = String(formData.get("name") || "")
	const mail = String(formData.get("mail") || "")
	const password = String(formData.get("password") || "")
	const passwordConfirm = String(formData.get("passwordConfirm") || "")

	if (password !== passwordConfirm) {
		return {
			result: fail(
				new PasswordConfirmationMismatchError(
					"パスワードとパスワード（確認）が一致しません",
				),
			),
		}
	}

	const { userRepository } = context.get(repositoryContext)

	const createResult = await userRepository.create({ name, mail, password })

	if (!createResult.success) return { result: createResult }

	const session = await getSession(request.headers.get("Cookie"))

	session.flash("toastPayload", {
		type: "success",
		message: "ユーザー登録が完了しました",
	})
	return redirect("/auth/login", {
		headers: { "Set-Cookie": await commitSession(session) },
	})
}

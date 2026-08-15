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
import { InvalidPasswordError, UserNotFoundError } from "~/domain/data/errors"
import { fail } from "~/lib/result"
import { repositoryContext } from "~/middlewares/repositories"
import { signToken } from "~/sessions/jwt"
import { commitSession, getSession } from "~/sessions/sessions"
import type { Route } from "./+types/login"

export default function LoginPage({ actionData }: Route.ComponentProps) {
	const navigation = useNavigation()
	return (
		<div className="h-full flex flex-col justify-center items-center gap-4 w-full">
			<Card className="w-full max-w-xl">
				<CardHeader>
					<CardTitle>ログイン</CardTitle>
				</CardHeader>
				<CardContent>
					<Form method="POST">
						<FieldGroup>
							<FieldSet>
								<FieldGroup>
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
								</FieldGroup>
							</FieldSet>
							{actionData?.result.error && (
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
									ログイン
								</Button>
							</Field>
						</FieldGroup>
					</Form>
				</CardContent>
			</Card>
			<Card className="w-full max-w-xl">
				<CardContent>
					<Button variant="link" className="w-full" asChild>
						<Link to="/auth/register">新規アカウント登録はこちら</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}

export async function action({ request, context }: Route.ActionArgs) {
	const formData = await request.formData()
	const mail = String(formData.get("mail") || "")
	const password = String(formData.get("password") || "")

	const { userRepository } = context.get(repositoryContext)
	const userResult = await userRepository.getByMail(mail)

	if (!userResult.success) return { result: userResult }

	const user = userResult.value

	if (user === null)
		return {
			result: fail(
				new UserNotFoundError(
					`メール「${mail}」に一致するユーザーが見つかりませんでした`,
				),
			),
		}

	const authResult = await userRepository.authenticateWithPassword(
		user.id,
		password,
	)

	if (!authResult.success) return { result: authResult }

	const isAuthenticated = authResult.value
	if (!isAuthenticated)
		return {
			result: fail(new InvalidPasswordError("パスワードが間違っています")),
		}

	const token = await signToken(user.id)

	const session = await getSession(request.headers.get("Cookie"))
	session.set("sessionToken", token)
	session.flash("toastPayload", {
		type: "success",
		message: `${user.name} としてログインしました`,
	})
	const redirectUrl = session.get("redirectAfterAuth")

	return redirect(redirectUrl ?? "/app", {
		headers: { "Set-Cookie": await commitSession(session) },
	})
}

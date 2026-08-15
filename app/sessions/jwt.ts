import "dotenv"
import { errors, type JWSAlgorithm, jwtVerify, SignJWT } from "jose"
import * as v from "valibot"
import {
	ExpiredSessionTokenError,
	InvalidSessionTokenError,
} from "~/domain/data/errors"
import { fail, type Result, success, wrapPromise } from "~/lib/result"

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error("環境変数「JWT_SECRET」が設定されていません")
const secret = new TextEncoder().encode(JWT_SECRET)

const algorithm: JWSAlgorithm = "HS256"
const expiration = "30d"

const JWTSessionPayloadSchema = v.object({
	id: v.number(),
})

export type JWTSessionPayload = v.InferOutput<typeof JWTSessionPayloadSchema>

export const signToken = async (id: number) => {
	const payload: JWTSessionPayload = { id }
	const token = await new SignJWT(payload)
		.setProtectedHeader({ alg: algorithm })
		.setIssuedAt()
		.setExpirationTime(expiration)
		.sign(secret)
	return token
}

export const verifyToken = async (
	token: string,
): Promise<
	Result<JWTSessionPayload, InvalidSessionTokenError | ExpiredSessionTokenError>
> => {
	const verificationResult = await wrapPromise(
		jwtVerify(token, secret, {
			algorithms: [algorithm],
			clockTolerance: "5s",
		}),
	)
	if (!verificationResult.success) {
		const error = verificationResult.error.cause
		if (error instanceof errors.JWTExpired) {
			return fail(new ExpiredSessionTokenError("セッション期限切れです"))
		}
		if (error instanceof errors.JWTClaimValidationFailed) {
			return fail(new InvalidSessionTokenError("無効なセッションです"))
		}
		if (error instanceof errors.JWSSignatureVerificationFailed) {
			return fail(new InvalidSessionTokenError("改ざんされたセッションです"))
		}
		return fail(new InvalidSessionTokenError("無効なセッションです"))
	}

	const { payload } = verificationResult.value

	const validationResult = await wrapPromise(
		v.parseAsync(JWTSessionPayloadSchema, payload),
	)

	if (!validationResult.success)
		return fail(
			new InvalidSessionTokenError("無効なセッションペイロードの形式です"),
		)

	return success(validationResult.value)
}

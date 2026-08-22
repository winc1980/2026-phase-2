---
seq: 7
difficulty: EXTREME
title: 早稲田メールアドレスのバリデーションがない
---

このアプリの認証にはメールアドレスを用いています。
早稲田の学生向けアプリにするために、受け取ったメールアドレスが早稲田メールであることを確認する処理を作りましょう。

## 1 今の状態を確認する

`app/routes/auth/register.tsx`の`action`関数を見てください。

```tsx
const mail = String(formData.get("mail") || "")
```

フォームから受け取った値を、**そのまま**使っています。チェックが一切ありません。

実際に`/auth/register`から`aaa`のようなメールアドレスですらない文字列で登録できてしまうことを、開発サーバで確かめてみましょう。

```sh
bun run dev
```

> [!note]
> `app/domain/entities/user.ts`には`mail: string // 早稲田メール`とコメントが書かれています。
> つまり「早稲田メールが入るはず」という前提でコードが書かれているのに、それを保証する処理が無い状態です。

## 2 バリデーションとは

「バリデーション」とは、入力された値が期待した形式やルールを満たしているかどうかをチェックする処理のことです。
フォームやAPI経由で届く値は、悪意のある入力や単純な入力ミスなど、必ずしもこちらの想定通りとは限りません。
バリデーションをせずにそのまま使ってしまうと、不正なデータがデータベースに保存されたり、思わぬバグやセキュリティ上の問題につながったりします。

判定のやり方はいろいろありますが、まずは一番シンプルな方法から試してみましょう。JavaScript/TypeScriptの文字列には、`endsWith`のような判定用のメソッドが標準で用意されています。

```ts
const mail = "student@waseda.jp"

mail.endsWith("@waseda.jp") // true
```

今回はこれを使って、まずは1パターンだけを判定できるバリデーションを作ります（複数のパターンへの対応は後の発展でやります）。

## 3 早稲田メールのドメインを調べる

早稲田大学のメールアドレスには、いくつかの種類があります。

`@fuji.waseda.jp`、`@asagi.waseda.jp`のような、**実際に存在する早稲田メールのドメイン**を調べてみましょう。
自分や周りの人が持っているメールアドレスも確認してみてください。

調べた結果を、あとでコードに書く形（配列など）でメモしておきましょう（この一覧は後の発展で使います）。

## 4 endsWithでバリデーションを実装する

まずは`@waseda.jp`で終わるメールアドレスのみ登録できるようにしましょう。他のドメイン（`@fuji.waseda.jp`など）への対応はいったん考えなくて構いません。

`app/routes/auth/register.tsx`の`action`関数に、`endsWith`を使った条件分岐を追加してください。

```tsx
if (!mail.endsWith("@waseda.jp")) {
 // ここでエラーを返す（やり方は次のセクションで説明します）
}
```

## 5 バリデーション失敗を表示する

バリデーションに失敗したとき、ただ処理を止めるだけでは不十分です。ユーザーに「何が悪かったのか」が伝わるようにしましょう。

`register.tsx`には、実はすでに同じ仕組みがあります。パスワード確認のチェックを見てください。

```tsx
if (password !== passwordConfirm) {
 return {
  result: fail(
   new PasswordConfirmationMismatchError(
    "パスワードとパスワード（確認）が一致しません",
   ),
  ),
 }
}
```

`fail`は`~/lib/result`にある関数で、「失敗」を表す`Result`オブジェクトを作ります。`PasswordConfirmationMismatchError`は`~/domain/data/errors.ts`に定義されている、このプロジェクト独自のエラークラスです。

このエラー付きの`result`は、コンポーネント側の`actionData`から参照され、画面に表示されます。

```tsx
{actionData?.result && !actionData.result.success && (
 <Field>
  <FieldError>{actionData.result.error.message}</FieldError>
 </Field>
)}
```

つまり、バリデーションエラーを表示する手順は次の通りです。

1. `app/domain/data/errors.ts`に、新しいエラークラスを追加する（例：`InvalidMailDomainError`）
2. メールアドレスのチェックに失敗したら、そのエラーを`fail(...)`に包んで`return { result: fail(...) }`する
3. 画面側は変更不要——上のコードがすでに`result`を見て表示してくれます

先ほど`endsWith`で書いた条件分岐の中身を、この手順で埋めてみましょう。

## 6 発展：複数のドメインに対応する

実際の早稲田メールは`@waseda.jp`だけでなく、`@fuji.waseda.jp`や`@asagi.waseda.jp`のように複数の種類があります（セクション3で調べたものです）。
`endsWith`を1回呼ぶだけの今の実装では、これらを弾いてしまいます。

複数のパターンに対応する方法はいくつかあります。好きな方法で挑戦してみましょう。

### 方法A: ドメインの配列 + some

```ts
const wasedaMailDomains = [".waseda.jp"]

wasedaMailDomains.some((domain) => mail.endsWith(domain))
```

### 方法B: 正規表現

正規表現（`RegExp`）を使うと、文字列の形式を「パターン」として一度に表現できます。

```ts
const WasedaMailPattern = /@[a-z0-9-]+\.waseda\.jp$/i

WasedaMailPattern.test("student@fuji.waseda.jp") // true
WasedaMailPattern.test("student@gmail.com") // false
```

表現力は高くなりますが、書き方に独特の癖があり、複雑になると読みづらくなりがちです。

### 方法C: バリデーションライブラリ（valibot）

このプロジェクトには`valibot`というバリデーションライブラリがすでに入っています。ルールを「スキーマ」として宣言的に書けるのが特徴です。

```ts
import * as v from "valibot"

const MailSchema = v.pipe(
 v.string(),
 v.email("メールアドレスの形式が正しくありません"),
 // ここに「早稲田メールであること」のルールを足す
)

const result = v.safeParse(MailSchema, mail)
```

`v.endsWith()`や`v.check()`が使えそうです。
このプロジェクト内でも`app/routes/app/live/application.tsx`の下のほうで`valibot`が使われているので、書き方の参考になります。

自前のif文や正規表現と比べて、次のような利点があります。

- ルールを複数組み合わせても読みやすい（`v.pipe`の中に並べるだけ）
- どのルールに違反したかのエラーメッセージを、ルールと一緒に定義できる
- TypeScriptの型を自動的に導出できる（`v.InferOutput<typeof MailSchema>`）

どの方法を選んでも構いません。実際に書き比べてみて、読みやすさや書きやすさの違いを感じてみてください。

## 7 loginにも同じ処理を入れる

`app/routes/auth/login.tsx`にも同じ問題があります。こちらにも同様のバリデーションを入れましょう。

> [!note]
> 2つのファイルに同じコードをコピーしましたか？
> それを共通の場所に切り出せないか考えてみましょう。`app/domain/`や`app/lib/`の中を覗いて、このプロジェクトが共通処理をどこに置いているか確認してください。

## 8 動作確認

以下のすべてを試して、意図通りになっているか確認しましょう。

- `aaa` → 登録できない
- `test@gmail.com` → 登録できない
- 調べた早稲田メールのドメイン（`@fuji.waseda.jp`、`@asagi.waseda.jp`など） → 登録できる

## 9 達成条件

- [ ] `register.tsx`・`login.tsx`の両方で、`.waseda.jp`で終わらないメールアドレス（`aaa`、`test@gmail.com`など）では登録・ログインできない
- [ ] バリデーションに失敗した場合、既存のエラー表示の仕組み（`fail()` + 新しいエラークラス + `FieldError`）でユーザーにエラーメッセージが表示される

### 発展（任意）

- [ ] 調べた実在の早稲田メールドメイン（`@fuji.waseda.jp`、`@asagi.waseda.jp`など）でも登録できる

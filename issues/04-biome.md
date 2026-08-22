---
seq: 4
difficulty: NORMAL
title: フォーマッター・リンターが導入されていない
---

チームで複数人で開発する際には、コードの細かな差異や、各個人特有の書き方の違いがどうしても生まれてしまいます。
それを防ぐために、コードの書き方にルールを課す「リンター」、コードを自動で整形する「フォーマッター」を導入します。

今回は「Biome」というツールと、そのVSCode拡張機能を導入します。

## 1 今の状態を確認する

まず、このコマンドを実行してみてください。

```sh
bun run check
```

`Script not found "check"`のようなエラーになるはずです。なぜでしょうか？

<details>
<summary>ヒント</summary>

`package.json`を開いて、`scripts`の中に`check`という名前が存在するかを確認してください。

</details>

## 2 package.jsonを理解する

npmやbunでのパッケージ管理は、すべて`package.json`というファイルを中心に行われます。プロジェクトのルートにある`package.json`を開いて、以下の2点を確認してください。

- [ ] `scripts`の中に、`check`という名前が**無い**こと
- [ ] `devDependencies`の中に、`@biomejs/biome`が**すでにある**こと

### scripts

`scripts`は、`bun run <名前>`（npmなら`npm run <名前>`）で実行できるコマンドに、好きな名前を付けて登録しておく場所です。

```json
"scripts": {
 "dev": "react-router dev",
 "typecheck": "react-router typegen && tsc"
}
```

例えば`bun run dev`は、実体としては`react-router dev`というコマンドを実行しています。先ほど`bun run check`がエラーになったのは、`scripts`の中に`check`という名前がまだ登録されていないからです。

### dependencies と devDependencies

`package.json`には、インストールされているパッケージが`dependencies`と`devDependencies`の2種類に分かれて書かれています。

> [!note]
>
> - `dependencies`：アプリを実際に動かすときにも必要なパッケージ（例：`react`、`react-router`）
> - `devDependencies`：開発中にだけ必要で、アプリの実行そのものには不要なパッケージ（例：型チェッカーの`typescript`、ビルドツールの`vite`）
>
> フォーマッターやリンターは、コードを書く手助けをするだけで本番のアプリの動作には関わらないため、`devDependencies`にあたります。

`devDependencies`を見てみると、すでに`@biomejs/biome`が入っていることに気づくはずです。

```json
"devDependencies": {
 "@biomejs/biome": "^2.5.9",
 ...
}
```

つまりBiome自体はすでにインストール済みで、足りないのは「それを呼び出すための`scripts`」だけだったということです。

> [!note]
> パッケージを新しく追加するときは`bun add <パッケージ名>`、devDependenciesとして追加するときは`bun add -d <パッケージ名>`のようにコマンドを使い分けます。
> どのオプションでdevDependenciesになるか、`bun add --help`などで確認してみましょう。

## 3 コマンドラインからBiomeを直接実行する

`@biomejs/biome`は`devDependencies`にインストールされていますが、これはあくまで**このプロジェクトの中だけ**で使えるようにインストールされたものです。グローバルにはインストールされていないため、ターミナルでいきなり`biome`と打っても実行できません。

ローカルにインストールされたパッケージの実行ファイルを呼び出すには、`bunx`というコマンドを使います（npmでの`npx`にあたるものです）。試しに実行してみましょう。

```sh
bunx biome check .
```

Biomeによるリント・フォーマットの指摘が表示されるはずです。指摘された箇所を自動修正するには、`--write`オプションを付けます。

```sh
bunx biome check --write .
```

## 4 checkスクリプトに落とし込む

`bunx`を毎回打つのは面倒です。先ほどの2つのコマンドを、`package.json`の`scripts`に`check`・`check:write`という名前で登録して、`bun run check` / `bun run check:write`で実行できるようにしましょう。

> [!note]
> `scripts`に登録したコマンドを`bun run`経由で実行する場合、`node_modules/.bin`にあるコマンドが自動的に解決されるため、`bunx`を付ける必要はありません。
> この違いに注意しながら、`scripts`にはどんな値を書けばよいか考えてみてください。

追加できたら、それぞれ実行して動作を確認してください。

```sh
bun run check
```

先ほどの`bunx biome check .`と同じように、Biomeによるリント・フォーマットの指摘が表示されれば成功です。指摘があれば、次のコマンドで自動修正してみましょう。

```sh
bun run check:write
```

もう一度`bun run check`を実行し、指摘が減っている（または無くなっている）ことを確認してください。

<details>
<summary>模範解答</summary>

```json
"scripts": {
 "check": "biome check .",
 "check:write": "biome check --write ."
}
```

</details>

## 5 VSCodeに拡張機能を導入する

VSCodeの拡張機能タブ（左のサイドバー）で`biomejs.biome`を検索して、インストールしましょう。

導入できたら、適当な`.tsx`ファイルでインデントをわざと崩して保存してみてください。自動で整形されれば成功です。

> [!note]
> このプロジェクトの`.vscode/settings.json`には、保存時にBiomeで整形する設定がすでに書かれています。
> 一度開いて、何が設定されているか読んでみましょう。

## 6 発展：拡張機能をチームに推奨する

`.vscode/extensions.json`というファイルを作ると、**そのリポジトリを開いた人全員に拡張機能をおすすめできます**。

このファイルを作って、Biomeを推奨に入れましょう。
うまくいくと、リポジトリを開いたときにVSCodeが「おすすめの拡張機能があります」と教えてくれるようになります。

## 7 達成条件

- [ ] `package.json`の`scripts`に`check`・`check:write`が追加され、`bun run check` / `bun run check:write`が実行できる
- [ ] VSCodeにBiome拡張機能（`biomejs.biome`）が導入され、保存時に自動整形される

### 発展（任意）

- [ ] `.vscode/extensions.json`が作成され、Biomeが推奨拡張機能として登録されている

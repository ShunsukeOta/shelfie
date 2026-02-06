# Shelfie Expo 引継ぎメモ

## 概要
- Expo + React Native + TypeScript
- Firebase Auth + Firestore
- PWA（Vercel）公開

## 主要機能
- Googleログイン（Expo Auth Session）
- 初回ログイン時オンボーディング（名前＋IDのみ設定）
- 本棚（登録・更新・削除）
- タイムライン（フォロー中ユーザーのログ表示）
- マイページ（プロフィール編集、フォロー/フォロワー表示と一覧）

## 直近の重要変更
- **PWA**
  - `app.json` に `display: "standalone"`, `startUrl: "/"`, `viewport-fit=cover` などを追加
  - `global.css` に `env(safe-area-inset-*)` 追加（PWA上部の余白対策）
  - `vercel.json` で SPA リライト（/me 直アクセスの 404 防止）
- **AuthGate**
  - 初回設定を `app/(onboarding)/profile.tsx` に追加
  - `AuthGate` は Firestore 監視で `displayName`/`handle` が未設定ならオンボーディングへ
- **タイムライン**
  - `users/{uid}/logs` にログを保存
  - フォロー中ユーザーのログをまとめて表示
  - ユーザー名＋アイコン表示、相対時間表示（たった今/分/時間/日）
  - ID表示は削除
- **フォロー**
  - `users/{uid}/following/{target}` / `users/{target}/followers/{uid}`
  - マイページのフォロー/フォロワー一覧で実際にDB更新

## Firestore 構造
- users/{uid}
  - displayName, handle, profileText, photoUrl, headerUrl, email, createdAt, updatedAt
- users/{uid}/books/{bookId}
  - title, author, statusKey, status, category, publisher, year, volume, tags, memo, imageUrl, createdAt, updatedAt
- users/{uid}/logs/{logId}
  - title, status, statusKey, action(add/update/remove), statusLabel, message, createdAt, userId
- users/{uid}/following/{targetId}
  - createdAt
- users/{uid}/followers/{sourceId}
  - createdAt

## PWAの注意点
- PWA反映されない場合は **PWA削除 → Safariのサイトデータ削除 → 再インストール** が必要
- Vercelデプロイ後にキャッシュが残りやすい

## 主要ファイル
- `app/_layout.tsx` AuthGate + Providers
- `components/auth-gate.tsx` 初回設定遷移
- `app/(onboarding)/profile.tsx` 初回設定画面
- `app/(tabs)/timeline.tsx` タイムライン
- `app/(tabs)/me.tsx` マイページ
- `lib/library.tsx` 本棚/ログ連携
- `components/register-modal-provider.tsx` 本登録モーダル
- `vercel.json` SPAリライト

## 未対応/注意点
- handleLowerは使わない設計に変更済み
- Firestoreルールは一時的に全許可（期限付き）

## よくあるトラブル
- PWAでSafariツールバーが残る → PWA再追加
- /me 直アクセスで404 → `vercel.json` が反映されているか確認
- 初回設定から進めない → AuthGate がリアルタイム監視に変更済み


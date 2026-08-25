import type { NextConfig } from "next";

/**
 * 設定は空でよい。
 *
 * 【turbopack.root を置かない理由】
 * 一時期 `turbopack: { root: path.resolve(...) }` を書いていたが、外した。
 *
 * 1. 本番ビルドで警告が出る。設定ファイルの中で path.resolve / process.cwd() を
 *    呼ぶと、Turbopack のファイルトレース（NFT）が
 *    「プロジェクト全体が意図せずトレースされた」と判定する：
 *      ./next.config.ts
 *      Encountered unexpected file in NFT list
 *    配信物に不要なファイルが混ざり、関数が肥大化する。
 *
 * 2. そもそも要らなかった。書いた動機は開発サーバーが白画面になる件
 *    （Could not find the module ... in the React Client Manifest）だったが、
 *    実際の原因は古い .next キャッシュで、`rm -rf .next` で直る。
 *    同時に両方やったため、設定の効果と取り違えていた。
 *
 * ホーム直下（~/）に別プロジェクトの pnpm-lock.yaml があるため、
 * 開発サーバーの起動時に「inferred your workspace root」という警告が出るが、
 * 動作に影響はない。消したければ ~/pnpm-lock.yaml を片付ける。
 */
const nextConfig: NextConfig = {};

export default nextConfig;

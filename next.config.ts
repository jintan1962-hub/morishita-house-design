import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // ホーム直下（~/）に別プロジェクトの pnpm-lock.yaml があるため、
    // Next.js がワークスペースの根を ~/ と誤って判定していた。
    // その状態では開発サーバーが
    // 「Could not find the module ... in the React Client Manifest」を出し、
    // 画面が真っ白になる（本番ビルドは通るので気づきにくい）。
    // 根をこのプロジェクトに固定する。
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;

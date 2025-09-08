/** @type {import('next').NextConfig} */
const nextConfig = {
  // traceファイルの出力を固定IDに変更してWindowsの権限エラーを回避
  generateBuildId: () => {
    return 'build'
  },
}

module.exports = nextConfig
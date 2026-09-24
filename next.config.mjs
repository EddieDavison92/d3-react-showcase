const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  devIndicators: false,
  async redirects() {
    return [{ source: "/catalogue", destination: "/explore", permanent: true }]
  },
};

export default nextConfig;

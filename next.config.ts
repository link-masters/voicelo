import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "uxorilocal-araceli-aphidious.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok.io",
  ],
};

export default nextConfig;

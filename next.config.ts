import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    "@opentelemetry/auto-instrumentations-node",
    "@opentelemetry/instrumentation-winston",
    "@opentelemetry/winston-transport",
    "@traceloop/instrumentation-anthropic",
    "require-in-the-middle",
  ],
};

export default nextConfig;

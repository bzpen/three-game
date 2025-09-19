import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
    /* config options here */
    server: {
        port: 3001,
    },
    webpack: config => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': path.resolve(__dirname, 'src'),
        };
        return config;
    },
};

export default nextConfig;

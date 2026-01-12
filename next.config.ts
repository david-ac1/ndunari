/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '/aida-public/**',
            },
        ],
    },
    experimental: {
        optimizePackageImports: ['lucide-react', 'framer-motion'],
    },
    reactStrictMode: true,
}

export default nextConfig

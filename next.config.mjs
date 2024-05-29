/** @type {import('next').NextConfig} */

const nextConfig = {
    env: {
      SECRET_KEY: process.env.NEXT_PUBLIC_SECRET_KEY,
    },
  };
  
  export default nextConfig;
  

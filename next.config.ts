import type { NextConfig } from "next";

export default {
	cacheComponents: true,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "gtdvfikkiodtfemgwqzg.supabase.co",
				port: "",
				pathname: "/storage/v1/object/public/**",
			},
		],
	},
	allowedDevOrigins: ['5469-152-202-144-225.ngrok-free.app']
} satisfies NextConfig;

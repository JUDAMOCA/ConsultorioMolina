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
	// Nota para el pelele de juda: cambie esto por el host (sin https://) que le de su ngrok para que funcione
	allowedDevOrigins: ['5469-152-202-144-225.ngrok-free.app']
} satisfies NextConfig;

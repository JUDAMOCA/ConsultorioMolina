import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and propagates any
 * rotated auth cookies back to the browser. This keeps the client-side
 * Supabase session (CSR) and any future Server Components (SSR) in sync.
 *
 * Run via the Next.js proxy (see src/proxy.ts).
 */
export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({ request });

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	// If Supabase isn't configured, pass the request through untouched instead
	// of throwing on every request.
	if (!supabaseUrl || !supabaseKey) {
		return supabaseResponse;
	}

	const supabase = createServerClient(supabaseUrl, supabaseKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value }) =>
					request.cookies.set(name, value),
				);
				supabaseResponse = NextResponse.next({ request });
				cookiesToSet.forEach(({ name, value, options }) =>
					supabaseResponse.cookies.set(name, value, options),
				);
			},
		},
	});

	// IMPORTANT: Do not run code between createServerClient and getClaims().
	// getClaims() refreshes the auth token and validates the JWT; skipping it or
	// adding logic in between can cause hard-to-debug session bugs.
	await supabase.auth.getClaims();

	return supabaseResponse;
}

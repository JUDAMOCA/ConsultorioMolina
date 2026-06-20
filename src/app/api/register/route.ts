import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!,
		);

		const { email, password, fullName, phone } = await request.json();

		// Crear usuario con la clave de servicio (más confiable)
		const { data, error } = await supabase.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: { full_name: fullName },
		});

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		// Crear perfil
		const { error: profileError } = await supabase.from("profiles").insert({
			id: data.user.id,
			full_name: fullName,
			email,
			phone: phone || null,
			role: "patient",
		});

		if (profileError) {
			return NextResponse.json(
				{ error: profileError.message },
				{ status: 400 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (e: unknown) {
		if (e instanceof Error) {
			return NextResponse.json({ error: e.message }, { status: 500 });
		}

		return NextResponse.json({ e }, { status: 500 });
	}
}

"use server";

import { redirect } from "next/navigation";

import {
  createAdminClient,
  createServerSupabaseClient,
} from "@/lib/supabase-server";

// Server-authoritative auth. Every credential check, profile write and session
// cookie is set on the server; the browser never holds the Supabase service
// role and never writes its own `role`/`profile` row directly.

export type AuthState = { error: string } | null;

// Only allow same-origin path redirects ("/agendar"), never absolute URLs.
function safeRedirect(target: FormDataEntryValue | null): string | null {
  const value = typeof target === "string" ? target : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Ingresa tu correo y contraseña." };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return { error: "Correo o contraseña incorrectos." };

  const explicit = safeRedirect(formData.get("redirectTo"));
  if (explicit) redirect(explicit);

  const { data: profile } = await supabase
    .from("profiles")
    // Server action, not client code: role is read server-side only to choose
    // the post-login redirect, never trusted from the browser. RLS still applies.
    // react-doctor-disable-next-line react-doctor/supabase-client-owned-authz-field
    .select("role")
    .eq("id", data.user.id)
    .single();
  redirect(profile?.role === "dentist" ? "/panel" : "/");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!fullName) return { error: "El nombre es obligatorio." };
  if (!phone) return { error: "El número de teléfono es obligatorio." };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };
  if (password.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres." };

  // Create the auth user with the service role (more reliable than client
  // sign-up and avoids an email round-trip), then write the profile row with
  // the same trusted client — `role` is hard-coded to 'patient' server-side.
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    return {
      error: `No se pudo crear la cuenta: ${error?.message ?? "intenta de nuevo"}`,
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    full_name: fullName,
    email,
    phone,
    role: "patient",
  });
  if (profileError) {
    return { error: `Error al guardar el perfil: ${profileError.message}` };
  }

  // Establish the session cookies for the freshly created user.
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signInWithPassword({ email, password });
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./server";

export async function getSession() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=" + encodeURIComponent(""));
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (user.role !== "admin") redirect("/");
  return user;
}

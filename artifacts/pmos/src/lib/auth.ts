export interface SessionUser {
  id: string;
  email: string;
  name: string;
  orgId: string;
  orgName: string;
  role: string;
}

export async function getMe(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<{ user?: SessionUser; error?: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Login failed" };
  return { user: data.user };
}

export async function register(
  email: string,
  password: string,
  name: string,
  organizationName: string
): Promise<{ user?: SessionUser; error?: string }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, name, organizationName }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Registration failed" };
  return { user: data.user };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

import { getAuth } from "@clerk/express";
import { db, usersTable, organizationsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

export interface AuthedRequest {
  clerkUserId: string;
  dbUser: {
    id: string;
    email: string;
    name: string;
    orgId: string;
    orgName: string;
    role: string;
  };
}

async function getOrProvisionUser(clerkUserId: string, clerkEmail: string, clerkName: string): Promise<AuthedRequest["dbUser"] | null> {
  const [existingByClerkId] = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    orgId: usersTable.orgId,
    role: usersTable.role,
    orgName: organizationsTable.name,
  })
    .from(usersTable)
    .leftJoin(organizationsTable, eq(usersTable.orgId, organizationsTable.id))
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);

  if (existingByClerkId) {
    return {
      id: existingByClerkId.id,
      email: existingByClerkId.email,
      name: existingByClerkId.name,
      orgId: existingByClerkId.orgId,
      role: existingByClerkId.role,
      orgName: existingByClerkId.orgName || "Workspace",
    };
  }

  if (clerkEmail) {
    const [existingByEmail] = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      orgId: usersTable.orgId,
      role: usersTable.role,
      orgName: organizationsTable.name,
    })
      .from(usersTable)
      .leftJoin(organizationsTable, eq(usersTable.orgId, organizationsTable.id))
      .where(eq(usersTable.email, clerkEmail))
      .limit(1);

    if (existingByEmail) {
      await db.update(usersTable).set({ clerkId: clerkUserId }).where(eq(usersTable.id, existingByEmail.id));
      return {
        id: existingByEmail.id,
        email: existingByEmail.email,
        name: existingByEmail.name,
        orgId: existingByEmail.orgId,
        role: existingByEmail.role,
        orgName: existingByEmail.orgName || "Workspace",
      };
    }
  }

  const orgName = clerkName ? `${clerkName}'s Workspace` : "My Workspace";
  const [org] = await db.insert(organizationsTable).values({ name: orgName }).returning();
  const [user] = await db.insert(usersTable).values({
    clerkId: clerkUserId,
    email: clerkEmail || `${clerkUserId}@clerk.local`,
    passwordHash: "",
    name: clerkName || "User",
    orgId: org.id,
    role: "OWNER",
  }).returning();

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    orgId: org.id,
    role: "OWNER",
    orgName: org.name,
  };
}

export function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;

  if (!clerkUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const email = (auth as any)?.sessionClaims?.email as string | undefined
    || (auth as any)?.user?.emailAddresses?.[0]?.emailAddress as string | undefined
    || "";
  const name = (auth as any)?.sessionClaims?.name as string | undefined || "";

  getOrProvisionUser(clerkUserId, email, name)
    .then((dbUser) => {
      if (!dbUser) return res.status(401).json({ error: "User not found" });
      req.clerkUserId = clerkUserId;
      req.dbUser = dbUser;
      next();
    })
    .catch((err: any) => {
      console.error("requireAuth error:", err);
      res.status(500).json({ error: "Auth error" });
    });
}

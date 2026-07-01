import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, organizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, organizationName } = req.body;
    if (!email || !password || !name || !organizationName) {
      return res.status(400).json({ error: "All fields required" });
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [org] = await db.insert(organizationsTable).values({ name: organizationName }).returning();
    const [user] = await db.insert(usersTable).values({
      email,
      passwordHash,
      name,
      orgId: org.id,
      role: "OWNER",
    }).returning();

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: user.orgId,
      orgName: org.name,
      role: user.role,
    };

    (req.session as any).user = sessionUser;

    return res.status(201).json({ user: sessionUser });
  } catch (err: any) {
    req.log.error({ err }, "Register error");
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, user.orgId)).limit(1);

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: user.orgId,
      orgName: org?.name || "Workspace",
      role: user.role,
    };

    (req.session as any).user = sessionUser;

    return res.json({ user: sessionUser });
  } catch (err: any) {
    req.log.error({ err }, "Login error");
    return res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/me", (req, res) => {
  const user = (req.session as any).user;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json(user);
});

export default router;

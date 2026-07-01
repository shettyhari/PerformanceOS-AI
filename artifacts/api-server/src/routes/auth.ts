import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/me", requireAuth, async (req: any, res) => {
  return res.json({
    id: req.dbUser.id,
    email: req.dbUser.email,
    name: req.dbUser.name,
    orgId: req.dbUser.orgId,
    orgName: req.dbUser.orgName,
    role: req.dbUser.role,
  });
});

export default router;

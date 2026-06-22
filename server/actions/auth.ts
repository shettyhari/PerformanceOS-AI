"use server"; // Just indicating this is server side (Server Action file)
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(2, "Name must be at least 2 characters long"),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters long"),
});

export async function signUpUser(formData: FormData) {
  try {
    const rawEmail = formData.get("email");
    const rawPassword = formData.get("password");
    const rawName = formData.get("name");
    const rawOrgName = formData.get("organizationName");

    // Input validation matching OWASP standards
    const parsed = registerSchema.safeParse({
      email: rawEmail,
      password: rawPassword,
      name: rawName,
      organizationName: rawOrgName,
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0].message,
      };
    }

    const { email, password, name, organizationName } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        error: "A user with this email address already exists.",
      };
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(password, 12);

    // Create User, Organization, Settings, and Role/Member records in a single database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
        },
      });

      // 2. Create Organization
      const slug = `${organizationName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          settings: {
            create: {
              theme: "system",
              currency: "USD",
              timezone: "UTC",
            },
          },
        },
      });

      // 3. Ensure OWNER role exists
      let ownerRole = await tx.role.findFirst({
        where: { name: "OWNER" },
      });

      if (!ownerRole) {
        ownerRole = await tx.role.create({
          data: { name: "OWNER" },
        });

        // Seed some basic permissions
        const basicPermissions = ["dashboard:read", "campaigns:read", "campaigns:write", "settings:write"];
        for (const pName of basicPermissions) {
          let permission = await tx.permission.findFirst({
            where: { name: pName },
          });
          if (!permission) {
            permission = await tx.permission.create({
              data: { name: pName },
            });
          }
          await tx.rolePermission.create({
            data: {
              roleId: ownerRole.id,
              permissionId: permission.id,
            },
          });
        }
      }

      // 4. Create OrgMember mapping user as Owner of new org
      await tx.orgMember.create({
        data: {
          orgId: org.id,
          userId: user.id,
          roleId: ownerRole.id,
        },
      });

      return { user, org };
    });

    return {
      success: true,
      data: {
        userId: result.user.id,
        orgSlug: result.org.slug,
      },
    };
  } catch (err: any) {
    console.error("Sign up failure:", err);
    return {
      error: "An unexpected error occurred during signup. Please try again.",
    };
  }
}

/**
 * Set an account's role from a database prompt.
 *
 * The one promotion path the panel deliberately does not have. Readers,
 * writers and admins are invited from Staff settings; an *owner* is made here,
 * by somebody who already has the database, because a panel that can mint
 * owners is one compromised session away from making an attacker permanent.
 *
 *   npm run staff:grant -- somebody@example.com OWNER
 *   npm run staff:grant -- somebody@example.com USER
 *
 * Every change is written to the panel's audit log with no actor, which is
 * exactly what it was: a change made outside the panel.
 */
import "dotenv/config";

import { PrismaClient, type Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const ROLES: Role[] = ["USER", "READER", "WRITER", "ADMIN", "OWNER"];

async function main() {
  const [email, rawRole] = process.argv.slice(2);

  if (!email || !rawRole) {
    console.error("Usage: npm run staff:grant -- <email> <USER|READER|WRITER|ADMIN|OWNER>");
    process.exitCode = 1;
    return;
  }

  const role = rawRole.toUpperCase() as Role;
  if (!ROLES.includes(role)) {
    console.error(`"${rawRole}" is not a role. One of: ${ROLES.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Set DATABASE_URL (or DIRECT_URL) first.");
    process.exitCode = 1;
    return;
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      console.error(`No account with the address ${email}.`);
      process.exitCode = 1;
      return;
    }

    if (user.role === role) {
      console.log(`${user.name} is already ${role}. Nothing to do.`);
      return;
    }

    // Dropping somebody out of the desk drops their sessions with it: a
    // demoted admin holding a live cookie is a demoted admin only in the row.
    const losingAccess = ROLES.indexOf(role) < ROLES.indexOf(user.role);

    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { role } }),
      ...(losingAccess ? [db.session.deleteMany({ where: { userId: user.id } })] : []),
      db.adminAudit.create({
        data: {
          action: "staff.role_set",
          subject: user.email,
          detail: `${user.role} → ${role}, from the command line`,
        },
      }),
    ]);

    console.log(`${user.name} is now ${role}.${losingAccess ? " Sessions ended." : ""}`);
  } finally {
    await db.$disconnect();
  }
}

void main();

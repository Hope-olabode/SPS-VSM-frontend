// Types and role helpers for the Users pages. The people themselves come from GET /api/users.

// Everyone is a plain USER until an admin gives them a bigger role.
export const userRoles = ["GLOBAL ADMIN", "LOCATION ADMIN", "MANAGER", "TENANT REP", "USER"] as const;
export type UserRole = (typeof userRoles)[number];
export const DEFAULT_ROLE: UserRole = "USER";

/** Roles that may open the user & role tools in the Control Panel. */
export const isAdminRole = (role: string) => role === "GLOBAL ADMIN" || role === "LOCATION ADMIN";

/**
 * Three levels of access:
 *  - admin   (GLOBAL ADMIN, LOCATION ADMIN): sees everything, including the admin console and Marketing
 *  - manager (MANAGER): sees Marketing, but not the admin console
 *  - regular (TENANT REP, USER): sees neither
 */
export type Access = "admin" | "marketing" | "globalAdmin";

export const canViewMarketing = (role: string) => isAdminRole(role) || role === "MANAGER";

/** `undefined` means the page is open to everyone who is signed in. */
export const hasAccess = (role: string, access?: Access) => {
  if (!access) return true;
  if (access === "globalAdmin") return role === "GLOBAL ADMIN";
  return access === "admin" ? isAdminRole(role) : canViewMarketing(role);
};

/** The roles a person with `role` is allowed to hand out (only a global admin can make another one). */
export const assignableRoles = (role: string): readonly UserRole[] =>
  role === "GLOBAL ADMIN" ? userRoles : userRoles.filter((item) => item !== "GLOBAL ADMIN");

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** The location (branch) the user is assigned to */
  branch: string;
  /** "Sep 24, 2026", as shown on screen */
  joined: string;
  /** Same format, or null if they have never signed in */
  lastActive: string | null;
};

/** What the Invite / Edit form hands back */
export type UserInput = Pick<User, "name" | "email" | "role" | "branch">;

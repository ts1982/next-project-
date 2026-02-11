// Roles feature barrel exports
export type {
  Role,
  RoleWithPermissions,
  RolePermissionEntry,
  RoleListResponse,
  PermissionDefinition,
} from "./types/role.types";

export {
  createRoleSchema,
  updateRoleSchema,
  permissionAssignmentSchema,
} from "./schemas/role.schema";
export type { CreateRoleInput, UpdateRoleInput } from "./schemas/role.schema";

export {
  getRoleList,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
} from "./services/role.service";

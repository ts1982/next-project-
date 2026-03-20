export const dynamic = "force-dynamic";

import { getRoleList, getAllPermissions } from "@/features/roles";
import { RolesClientPage } from "./page.client";

const RolesPage = async () => {
  const [roleData, permissions] = await Promise.all([getRoleList(), getAllPermissions()]);

  return <RolesClientPage initialRoles={roleData.roles} permissions={permissions} />;
};

export default RolesPage;

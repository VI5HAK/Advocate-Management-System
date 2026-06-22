/**
 * Maps API resource keys to database master tables and columns.
 */
export const MASTER_CONFIG = {
  roles: {
    table: "Role_Master",
    idColumn: "Role_ID",
    nameColumn: "Role_Name",
    descriptionColumn: "Role_Description",
    deleteFlagColumn: "Role_Delete_Flag",
  },
  "client-types": {
    table: "Client_Type_Master",
    idColumn: "Client_Type_ID",
    nameColumn: "Client_Type_Name",
    descriptionColumn: "Client_Type_Description",
    deleteFlagColumn: "Client_Type_Delete_Flag",
  },
  "case-types": {
    table: "Case_Type_Master",
    idColumn: "Case_Type_ID",
    nameColumn: "Case_Type_Name",
    descriptionColumn: "Case_Type_Description",
    deleteFlagColumn: "Case_Type_Delete_Flag",
  },
  statuses: {
    table: "Status_Master",
    idColumn: "Status_ID",
    nameColumn: "Status_Name",
    descriptionColumn: "Status_Description",
    deleteFlagColumn: "Status_Delete_Flag",
  },
  courts: {
    table: "Court_Master",
    idColumn: "Court_ID",
    nameColumn: "Court_Name",
    descriptionColumn: "Court_Description",
    deleteFlagColumn: "Court_Delete_Flag",
  },
  districts: {
    table: "District_Master",
    idColumn: "District_ID",
    nameColumn: "District_Name",
    descriptionColumn: "District_Description",
    deleteFlagColumn: "District_Delete_Flag",
  },
};

export function getMasterConfig(resource) {
  const config = MASTER_CONFIG[resource];
  if (!config) {
    const error = new Error("Invalid master resource.");
    error.status = 404;
    throw error;
  }
  return config;
}

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
    createdByColumn: "Role_Created_By",
    createdDateColumn: "Role_Created_Date",
    modifiedByColumn: "Role_Modified_By",
    modifiedDateColumn: "Role_Modified_Date",
  },
  judges: {
    table: "JUDGE_MASTER",
    idColumn: "Judge_ID",
    nameColumn: "Judge_Name",
    descriptionColumn: "Judge_Description",
    deleteFlagColumn: "Judge_Delete_Flag",
    createdByColumn: "Judge_Created_By",
    createdDateColumn: "Judge_Created_Date",
    modifiedByColumn: "Judge_Modified_By",
    modifiedDateColumn: "Judge_Modified_Date",
  },
  "client-types": {
    table: "Client_Type_Master",
    idColumn: "Client_Type_ID",
    nameColumn: "Client_Type_Name",
    descriptionColumn: "Client_Type_Description",
    deleteFlagColumn: "Client_Type_Delete_Flag",
    createdByColumn: "Client_Type_Created_By",
    createdDateColumn: "Client_Type_Created_Date",
    modifiedByColumn: "Client_Type_Modified_By",
    modifiedDateColumn: "Client_Type_Modified_Date",
  },
  "case-types": {
    table: "Case_Type_Master",
    idColumn: "Case_Type_ID",
    nameColumn: "Case_Type_Name",
    descriptionColumn: "Case_Type_Description",
    deleteFlagColumn: "Case_Type_Delete_Flag",
    createdByColumn: "Case_Type_Created_By",
    createdDateColumn: "Case_Type_Created_Date",
    modifiedByColumn: "Case_Type_Modified_By",
    modifiedDateColumn: "Case_Type_Modified_Date",
  },
  /*statuses: {
    table: "Status_Master",
    idColumn: "Status_ID",
    nameColumn: "Status_Name",
    descriptionColumn: "Status_Description",
    deleteFlagColumn: "Status_Delete_Flag",
    createdByColumn: "Status_Created_By",
    createdDateColumn: "Status_Created_Date",
    modifiedByColumn: "Status_Modified_By",
    modifiedDateColumn: "Status_Modified_Date",
  },*/
  courts: {
    table: "Court_Master",
    idColumn: "Court_ID",
    nameColumn: "Court_Name",
    descriptionColumn: "Court_Description",
    deleteFlagColumn: "Court_Delete_Flag",
    createdByColumn: "Court_Created_By",
    createdDateColumn: "Court_Created_Date",
    modifiedByColumn: "Court_Modified_By",
    modifiedDateColumn: "Court_Modified_Date",
  },
  "task-statuses": {
    table: "Task_Status_Master",
    idColumn: "Task_Status_ID",
    nameColumn: "Task_Status_Name",
    descriptionColumn: "Task_Status_Description",
    deleteFlagColumn: "Task_Status_Delete_Flag",
    createdByColumn: "Task_Status_Created_By",
    createdDateColumn: "Task_Status_Created_Date",
    modifiedByColumn: "Task_Status_Modified_By",
    modifiedDateColumn: "Task_Status_Modified_Date",
  },
  "task-categories": {
    table: "Task_Category_Master",
    idColumn: "Task_Cat_ID",
    nameColumn: "Task_Cat_Name",
    descriptionColumn: "Task_Cat_Desc",
    deleteFlagColumn: "Task_Cat_Delete_Flag",
    createdByColumn: "Task_Cat_Created_By",
    createdDateColumn: "Task_Cat_Created_Date",
    modifiedByColumn: "Task_Cat_Modified_By",
    modifiedDateColumn: "Task_Cat_Modified_Date",
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

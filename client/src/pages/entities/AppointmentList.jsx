import { useAuth } from "../../context/AuthContext";
import { ENTITY_LIST_CONFIG } from "../../config/entityListPages";
import EntityListPage from "./EntityListPage";

function AppointmentList() {
  const { isAdvocate } = useAuth();

  return (
    <EntityListPage
      config={ENTITY_LIST_CONFIG.appointment}
      readOnly={isAdvocate}
    />
  );
}

export default AppointmentList;

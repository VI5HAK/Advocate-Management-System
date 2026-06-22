import { ENTITY_LIST_CONFIG } from "../../config/entityListPages";
import EntityListPage from "./EntityListPage";

function ClientList() {
  return <EntityListPage config={ENTITY_LIST_CONFIG.client} />;
}

export default ClientList;

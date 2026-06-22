import { ENTITY_LIST_CONFIG } from "../../config/entityListPages";
import EntityListPage from "./EntityListPage";

function AdvocateList() {
  return <EntityListPage config={ENTITY_LIST_CONFIG.advocate} />;
}

export default AdvocateList;

import { ENTITY_LIST_CONFIG } from "../../config/entityListPages";
import EntityListPage from "./EntityListPage";

function CaseList() {
  return <EntityListPage config={ENTITY_LIST_CONFIG.case} />;
}

export default CaseList;

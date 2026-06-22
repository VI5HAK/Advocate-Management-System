import { MASTER_PAGE_CONFIG } from "../../config/masterPages";
import MasterPage from "./MasterPage";

function CaseTypeMaster() {
  return <MasterPage config={MASTER_PAGE_CONFIG.caseType} />;
}

export default CaseTypeMaster;

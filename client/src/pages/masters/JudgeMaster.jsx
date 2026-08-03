import { MASTER_PAGE_CONFIG } from "../../config/masterPages";
import MasterPage from "./MasterPage";

function JudgeMaster() {
  return <MasterPage config={MASTER_PAGE_CONFIG.judge} />;
}

export default JudgeMaster;

import { MASTER_PAGE_CONFIG } from "../../config/masterPages";
import MasterPage from "./MasterPage";

function StatusMaster() {
  return <MasterPage config={MASTER_PAGE_CONFIG.status} />;
}

export default StatusMaster;

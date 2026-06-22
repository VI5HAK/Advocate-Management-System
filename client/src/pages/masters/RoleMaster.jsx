import { MASTER_PAGE_CONFIG } from "../../config/masterPages";
import MasterPage from "./MasterPage";

function RoleMaster() {
  return <MasterPage config={MASTER_PAGE_CONFIG.role} />;
}

export default RoleMaster;

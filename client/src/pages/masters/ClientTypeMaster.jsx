import { MASTER_PAGE_CONFIG } from "../../config/masterPages";
import MasterPage from "./MasterPage";

function ClientTypeMaster() {
  return <MasterPage config={MASTER_PAGE_CONFIG.clientType} />;
}

export default ClientTypeMaster;

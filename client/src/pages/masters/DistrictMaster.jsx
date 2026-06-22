import { MASTER_PAGE_CONFIG } from "../../config/masterPages";
import MasterPage from "./MasterPage";

function DistrictMaster() {
  return <MasterPage config={MASTER_PAGE_CONFIG.district} />;
}

export default DistrictMaster;

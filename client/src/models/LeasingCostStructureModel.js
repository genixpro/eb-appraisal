
import BaseModel from "../orm/BaseModel";
import StringField from "../orm/StringField";
import FloatField from "../orm/FloatField";
import ModelField from "../orm/ModelField";
import ListField from "../orm/ListField";
import BoolField from "../orm/BoolField";
import RecoveryStructureModel from "./RecoveryStructureModel";



class LeasingCostStructureModel extends BaseModel
{
    static leasingCostStructureName = new StringField("name");

    static leasingCommissionPSF = new FloatField();
    static leasingCommissionPercent = new FloatField();
    static leasingCommissionMode = new StringField();


    static tenantInducementsPSF = new FloatField();
    static renewalPeriod = new FloatField();
    static leasingPeriod = new FloatField();

    get isDefault()
    {
        return this.name === LeasingCostStructureModel.defaultLeasingCostName || this.name === "Default";
    }

    static get defaultLeasingCostName()
    {
        return "Standard";
    }
}

export default LeasingCostStructureModel;



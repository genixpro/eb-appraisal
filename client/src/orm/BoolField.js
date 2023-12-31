import BaseField from "./BaseField";
import _ from "underscore";

class BoolField extends BaseField
{
    toObject(value, parent)
    {
        if (_.isUndefined(value) || _.isNull(value))
        {
            return null;
        }
        else if (value)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    applyDiff(oldValue, diffValue, parent)
    {
        return this.toObject(diffValue);
    }
}

export default BoolField;


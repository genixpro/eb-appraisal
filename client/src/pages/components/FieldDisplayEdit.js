import React from 'react';
import { Table, Button } from 'reactstrap';
import _ from 'underscore';
import Geosuggest from 'react-geosuggest';
import Datetime from 'react-datetime';
import PropertyTypeSelector from './PropertyTypeSelector';
import history from "../../history";

import {
    Input,
    InputGroup,
    InputGroupAddon
} from 'reactstrap';

class FieldDisplayEdit extends React.Component
{
    static defaultProps = {
        edit: true,
        hideInput: true,
        hideIcon: false
    };

    state = {
        isEditing: false
    };

    constructor()
    {
        super();
        this.inputElem = null;
        this.sentUpdate = false;
    }

    componentDidMount()
    {

        if (this.props.hideIcon)
        {
            this.setState({hideIcon: true});
        }
        else
        {
            this.setState({hideIcon: false});
        }

        this.setState({value: this.formatValue(this.props.value)})
    }


    inputUpdated(newValue)
    {
        this.setState({value: newValue})
    }


    numberWithCommas(x)
    {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
    }


    formatValue(value)
    {
        if (value === "")
        {
            return "";
        }

        if (_.isUndefined(value))
        {
            return "";
        }

        if (_.isNull(value))
        {
            return "";
        }

        else if (this.props.type === 'currency')
        {
            try {
                return "$" + this.numberWithCommas(Number(value).toFixed(2).toString());
            }
            catch(err) {
                return "$" + this.numberWithCommas(value.toString());
            }
        }
        else if (this.props.type === 'integer')
        {
            try {
                return this.numberWithCommas(Number(value).toFixed(0).toString());
            }
            catch(err) {
                return this.numberWithCommas(value.toString());
            }
        }

        return value;
    }


    cleanValue(value)
    {
        if (this.props.type === 'currency' || this.props.type === 'number')
        {
            const cleanText = value.toString().replace(/[^0-9\.-]/g, "");

            if (cleanText === "")
            {
                return null;
            }

            try {
                return Number(cleanText);
            }
            catch(err) {
                return null;
            }
        }
        return value;
    }

    startEditing()
    {
        this.sentUpdate = false;
        this.setState({value: this.formatValue(this.props.value), isEditing: true})

    }

    dateInputUpdated(newValue)
    {
        if (newValue)
        {
            this.setState({value: newValue}, () => this.finishEditing());
        }
    }

    addressInputUpdated(newValue)
    {
        if (newValue)
        {
            this.setState({value: newValue.label, geo: newValue.location}, () => this.finishEditing());

            if (this.props.onGeoChange)
            {
                this.props.onGeoChange(newValue.location);
            }
        }
    }

    propertyTypeInputUpdated(newValue)
    {
        if (newValue)
        {
            this.setState({value: newValue}, () => this.finishEditing());
        }
    }


    finishEditing()
    {
        if (!this.sentUpdate)
        {
            this.sentUpdate = true;

            if (this.props.onChange)
            {
                this.setState({value: this.formatValue(this.cleanValue(this.state.value)) });
                this.props.onChange(this.cleanValue(this.state.value));
            }

            if (this.inputElem)
            {
                this.inputElem.blur();
            }
            this.setState({isEditing: false});
        }
    }


    viewExtractionInputs()
    {
        const extractionReference = this.props.extractionReference;
        const url = `/appraisal/${extractionReference.appraisalId}/financial_statement/${extractionReference.fileId}/raw`;
        this.props.history.push(url);
    }


    handleKeyPress(e)
    {
        if (e.key === 'Enter') {
            this.finishEditing();
        }
    }


    render() {

        const editStateClass = (this.state.isEditing ? " editing" : "static");
        const customClass = (this.props.className ? this.props.className : "");
        const editableClass = (this.props.edit === false ? "non-editable" : "editable");
        const hideInput = (this.props.hideInput === false ? "show-input" : "hide-input");

        return (
            <InputGroup className={`field-display-edit ${editStateClass} ${customClass} ${editableClass} ${hideInput}`}
                        onFocus={(evt) => this.startEditing()}>
                {
                    this.props.type === "textbox" ?
                        <textarea
                            placeholder={this.props.placeholder}
                            disabled={!this.props.edit}
                            value={this.state.isEditing ? this.state.value : this.formatValue(this.props.value)}
                            onChange={(evt) => this.inputUpdated(evt.target.value)}
                            ref={(inputElem) => this.inputElem = inputElem}
                            onKeyPress={(evt) => this.handleKeyPress(evt)}
                            onBlur={(evt) => this.finishEditing()}
                            rows={1}
                        /> : null
                }
                {
                    this.props.type === "currency" || this.props.type === "number" || this.props.type === "text" || !this.props.type ?
                        <Input placeholder={this.props.placeholder}
                               disabled={!this.props.edit}
                               value={this.state.isEditing ? this.state.value : this.formatValue(this.props.value)}
                               onChange={(evt) => this.inputUpdated(evt.target.value)}
                               innerRef={(inputElem) => this.inputElem = inputElem}
                               onKeyPress={(evt) => this.handleKeyPress(evt)}
                               onBlur={(evt) => this.finishEditing()}
                        /> : null
                }
                {
                    this.props.type === "date" ?
                        <Datetime
                            inputProps={{className: 'form-control', disabled: !this.props.edit, placeholder: this.props.placeholder}}
                            dateFormat={"YYYY/MM/DD"}
                            timeFormat={false}
                            input={true}
                            closeOnSelect={true}
                            value={this.state.isEditing ? this.state.value : this.formatValue(this.props.value)}
                            onChange={(newValue) => newValue.toDate ? this.dateInputUpdated(newValue.toDate()) : null}
                            onBlur={() => this.finishEditing()}
                        /> : null
                }
                {
                    this.props.type === "propertyType" ?
                        <PropertyTypeSelector
                            value={this.state.isEditing ? this.state.value : this.props.value}
                            disabled={!this.props.edit}
                            onChange={(newValue) => this.propertyTypeInputUpdated(newValue) }
                            onBlur={() => this.finishEditing()}
                            innerRef={(inputElem) => this.inputElem = inputElem}
                        /> : null
                }
                {
                    this.props.type === "address" ?
                        <Geosuggest
                            types={["geocode"]}
                            placeholder={this.props.placeholder}
                            disabled={!this.props.edit}
                            initialValue={this.state.isEditing ? this.state.value : this.formatValue(this.props.value)}
                            onSuggestSelect={(newValue) => this.addressInputUpdated(newValue)}
                            inputClassName={"form-control"}
                            onBlur={(evt) => this.finishEditing()}
                        /> : null
                }
                {
                    !this.state.hideIcon && !this.props.extractionReference ?
                        <InputGroupAddon addonType="append">
                            <span className={"input-group-text"}>
                                <i className={"fa fa-wrench"} />
                            </span>
                        </InputGroupAddon> : null
                }
                {
                    !this.state.hideIcon && this.props.extractionReference ?
                        <InputGroupAddon addonType="append">
                            <Button className={"input-group-text"} onClick={() => this.viewExtractionInputs()}>
                                <i className={"fa fa-search"} />
                            </Button>
                        </InputGroupAddon> : null
                }
            </InputGroup>
        );
    }
}


export default FieldDisplayEdit;

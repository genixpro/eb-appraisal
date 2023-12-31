import React from 'react';
import { Button, Collapse, CardHeader, CardTitle, Row, Col} from 'reactstrap';
import FieldDisplayEdit from "./FieldDisplayEdit";
import axios from "axios/index";
import UploadableImage from "./UploadableImage";
import NumberFormat from 'react-number-format';
import PropTypes from "prop-types";
import ComparableSaleModel from "../../models/ComparableSaleModel";
import AppraisalModel from "../../models/AppraisalModel";
import _ from 'underscore';
import CurrencyFormat from "./CurrencyFormat";
import PercentFormat from "./PercentFormat";
import FloatFormat from "./FloatFormat";
import IntegerFormat from "./IntegerFormat";
import ComparableLeaseListItem from "./ComparableLeaseListItem";
import Auth from "../../Auth";


class ComparableSaleListItemField extends React.Component
{
    static propTypes = {
        title: PropTypes.string.isRequired,
        field: PropTypes.string.isRequired,
        fieldType: PropTypes.string.isRequired,
        edit: PropTypes.bool.isRequired,
        cents: PropTypes.bool.isRequired,
        propertyType: PropTypes.string,
        excludedPropertyType: PropTypes.string,
        onChange: PropTypes.func.isRequired,
        comparableSale: PropTypes.instanceOf(ComparableSaleModel).isRequired
    };

    render()
    {
        if (this.props.propertyType && this.props.comparableSale.propertyType !== this.props.propertyType)
        {
            return null;
        }

        if (this.props.excludedPropertyType && this.props.comparableSale.propertyType === this.props.excludedPropertyType)
        {
            return null;
        }

        return [
            <span key={1} className={"comparable-field-label"}>{this.props.title}:</span>,

            <FieldDisplayEdit
                key={2}
                type={this.props.fieldType}
                edit={this.props.edit}
                cents={this.props.cents}
                placeholder={this.props.placeholder || this.props.title}
                value={this.props.comparableSale[this.props.field]}
                propertyType={this.props.comparableSale.propertyType}
                onChange={(newValue) => this.props.onChange(this.props.field, newValue)}
                onGeoChange={(newValue) => this.props.onChange('location', {"type": "Point", "coordinates": [newValue.lng, newValue.lat]})}
            />
        ]
    }
}


class ComparableSaleListItemHeaderColumn extends React.Component
{
    static propTypes = {
        size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        renders: PropTypes.arrayOf(PropTypes.func).isRequired,
        noValueTexts: PropTypes.arrayOf(PropTypes.string).isRequired,
        fields: PropTypes.arrayOf(PropTypes.string).isRequired,
        comparableSale: PropTypes.instanceOf(ComparableSaleModel).isRequired
    };

    render()
    {
        const colProps = {};
        let colClass = "";

        if (_.isNumber(this.props.size))
        {
            colProps['xs'] = this.props.size;
        }
        else if(this.props.size === 'middle')
        {
            colClass = "middle-col"
        }

        return <Col className={`header-field-column ${colClass}`} {...colProps}>

            {
                this.props.fields.map((field, fieldIndex) =>
                {
                    return this.props.comparableSale[field] && !(_.isArray(this.props.comparableSale[field]) && this.props.comparableSale[field].length === 0)
                        ? <span>
                            {
                                this.props.renders[fieldIndex](this.props.comparableSale[field])
                            }
                            {fieldIndex !== this.props.fields.length - 1 ? <br /> : null}
                            </span>
                        : <span className={"no-data"}>
                            <span>n/a</span>
                            {fieldIndex !== this.props.fields.length - 1 ? <br /> : null}
                        </span>
                })
            }

        </Col>
    }
}

class ComparableSaleListItem extends React.Component
{
    static _newSale = Symbol('newSale');

    static defaultProps = {
        edit: true,
        openByDefault: false,
        showPropertyTypeInHeader: true,
        last: false
    };

    static propTypes = {
        edit: PropTypes.bool,
        openByDefault: PropTypes.bool,
        showPropertyTypeInHeader: PropTypes.bool,
        last: PropTypes.bool,

        headers: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),

        comparableSale: PropTypes.instanceOf(ComparableSaleModel).isRequired,
        appraisal: PropTypes.instanceOf(AppraisalModel).isRequired,

        onChange: PropTypes.func,
        onDeleteComparable: PropTypes.func,
        onAddCapRateClicked: PropTypes.func,
        onRemoveCapRateClicked: PropTypes.func,
        onRemoveDCAClicked: PropTypes.func,
        onAddDCAClicked: PropTypes.func,
    };

    state = {
        comparableSale: {}
    };

    static getDerivedStateFromProps(props)
    {
        if (!props.comparableSale._id || props.openByDefault || props.comparableSale[ComparableSaleListItem._newLease])
        {
            return {openByDefault: true}
        }
        else
        {
            return {openByDefault: false}
        }
    }

    componentDidMount()
    {
        this.setState({
            comparableSale: this.props.comparableSale
        })
    }

    saveComparable(updatedComparable)
    {
        axios.post(`/comparable_sales/` + this.state.comparableSale._id, updatedComparable).then((response) => {
            // console.log(response.data.comparableSales);
            // this.setState({comparableSales: response.data.comparableSales})
        });
    }


    changeComparableField(field, newValue)
    {
        const comparable = this.state.comparableSale;

        comparable[field] = newValue;
        if (newValue)
        {
            comparable.calculateMissingNumbers();
        }

        if (this.state.comparableSale._id)
        {
            this.saveComparable(comparable);
            this.props.onChange(comparable);
        }
        else
        {
            this.props.onChange(comparable);
        }
    }


    deleteComparable()
    {
        if (window.confirm("Are you sure you want to delete the comparable?"))
        {
            this.props.onDeleteComparable(this.state.comparableSale);

            axios.delete(`/comparable_sales/` + this.state.comparableSale._id).then((response) => {
                // console.log(response.data.comparableSales);
                // this.setState({comparableSales: response.data.comparableSales})
            });
        }
    }

    toggleDetails()
    {
        this.setState({detailsOpen: !this.state.detailsOpen});
    }


    render()
    {
        const comparableSale = this.state.comparableSale;

        const editableClass = this.props.edit ? "editable" : "non-editable";

        const expandedClass = this.state.detailsOpen ? "expanded" : "";

        const lastClass = this.props.last ? "last" : "";

        const headerConfigurations = {
            saleDate: {
                render: (value) => <span>{new Date(value).getMonth() + 1} / {new Date(value).getFullYear().toString().substr(2)}</span>,
                noValueText: "No Sale Date",
                size: 1
            },
            address: {
                render: (value) => <span>{value}</span>,
                noValueText: "No Address",
                size: 3
            },
            sizeSquareFootage: {
                render: (value) => <NumberFormat
                    value={value}
                    displayType={'text'}
                    thousandSeparator={', '}
                    decimalScale={0}
                    fixedDecimalScale={true}
                />,
                size: "middle"
            },
            sizeOfLandSqft: {
                render: (value) => <NumberFormat
                    value={value}
                    displayType={'text'}
                    thousandSeparator={', '}
                    decimalScale={0}
                    fixedDecimalScale={true}
                />,
                size: "middle"
            },
            sizeOfLandAcres: {
                render: (value) => <NumberFormat
                    value={value}
                    displayType={'text'}
                    thousandSeparator={', '}
                    decimalScale={1}
                    fixedDecimalScale={true}
                />,
                size: "middle"
            },
            sizeOfBuildableAreaSqft: {
                render: (value) => <NumberFormat
                    value={value}
                    displayType={'text'}
                    thousandSeparator={', '}
                    decimalScale={0}
                    fixedDecimalScale={true}
                />,
                size: "middle"
            },
            salePrice: {
                render: (value) => <CurrencyFormat value={value} cents={false}/>,
                size: "middle"
            },
            capitalizationRate: {
                render: (value) => <PercentFormat value={value} />,
                size: "middle"
            },
            propertyType: {
                render: (value) => <span>{value}</span>,
                size: "middle"
            },
            propertyTags: {
                render: (value) => value.map((tag, tagIndex) => <span key={tag}>{tag}{tagIndex !== value.length - 1 ? ", " : ""}</span>),
                size: "middle"
            },
            pricePerSquareFoot: {
                render: (value) => <CurrencyFormat value={value} />,
                size: "middle"
            },
            pricePerAcreLand: {
                render: (value) => <CurrencyFormat value={value} cents={false} />,
                size: "middle"
            },
            pricePerSquareFootLand: {
                render: (value) => <CurrencyFormat value={value} cents={false} />,
                size: "middle"
            },
            pricePerSquareFootBuildableArea: {
                render: (value) => <CurrencyFormat value={value} />,
                size: "middle"
            },
            pricePerBuildableUnit: {
                render: (value) => <CurrencyFormat value={value} cents={false} />,
                size: "middle"
            },
            netOperatingIncome: {
                render: (value) => <CurrencyFormat value={value} cents={false} />,
                size: "middle"
            },
            netOperatingIncomePSF: {
                render: (value) => <CurrencyFormat value={value} cents={true} />,
                size: "middle"
            },
            noiPSFMultiple: {
                render: (value) => <FloatFormat value={value} />,
                size: "middle"
            },
            buildableUnits: {
                render: (value) => <IntegerFormat value={value} />,
                size: "middle"
            },
            siteCoverage: {
                render: (value) => <span>(<PercentFormat value={value} digits={0} />)</span>,
                size: "middle"
            },
            occupancyRate: {
                render: (value) => <span>(<PercentFormat value={value} digits={0} />)</span>,
                size: "middle"
            },
            zoning: {
                render: (value) => <span>{value}</span>,
                size: "middle"
            },
            floorSpaceIndex: {
                render: (value) => <FloatFormat value={value} />,
                size: "middle"
            },
            noiPerBedroom: {
                render: (value) => <CurrencyFormat value={value} cents={false}/>,
                size: "middle"
            },
            noiPerUnit: {
                render: (value) => <CurrencyFormat value={value} cents={false}/>,
                size: "middle"
            },
            averageMonthlyRentPerUnit: {
                render: (value) => <CurrencyFormat value={value} cents={false}/>,
                size: "middle"
            },
            numberOfUnits: {
                render: (value) => <IntegerFormat value={value}/>,
                size: "middle"
            },
            totalBedrooms: {
                render: (value) => <IntegerFormat value={value}/>,
                size: "middle"
            },
            pricePerUnit: {
                render: (value) => <CurrencyFormat value={value} cents={false}/>,
                size: "middle"
            },
            pricePerBedroom: {
                render: (value) => <CurrencyFormat value={value} cents={false}/>,
                size: "middle"
            }
        };

        this.props.headers.forEach((headerFieldList) =>
        {
            headerFieldList.forEach((field) =>
            {
                if (!headerConfigurations[field])
                {
                    const message = `Error! No header configuration for ${field}`;
                    console.error(message);

                    if (process.env.VALUATE_ENVIRONMENT.REACT_APP_DEBUG)
                    {
                        alert(message);
                    }
                }
            })
        });

        return (
            <div className={`card b comparable-sale-list-item ${expandedClass} ${lastClass}`}>
                <div className={"comparable-sale-list-item-button-column"}>
                    {
                        this.props.onRemoveComparableClicked && this.props.appraisal.hasComparableSale(this.props.comparableSale) ?
                            <div className={`comparable-button-row`}>
                                <Button color={"primary"} onClick={(evt) => this.props.onRemoveComparableClicked(comparableSale)} className={"move-comparable-button"}>
                                    <i className={"fa fa-check-square"} />
                                </Button>
                                <Button color={"danger"} onClick={(evt) => this.deleteComparable()} className={"delete-comparable-button " + (this.state.detailsOpen ? "" : "hidden")}>
                                    <i className={"fa fa-trash-alt"} />
                                </Button>
                            </div> : null
                    }
                    {
                        this.props.onAddComparableClicked && !this.props.appraisal.hasComparableSale(this.props.comparableSale) ?
                            <div className={`comparable-button-row`}>
                                <Button color={"primary"} onClick={(evt) => this.props.onAddComparableClicked(comparableSale)} className={"move-comparable-button"}>
                                    <i className={"fa fa-square"} />
                                </Button>
                                <Button color={"danger"} onClick={(evt) => this.deleteComparable()} className={"delete-comparable-button " + (this.state.detailsOpen ? "" : "hidden")}>
                                    <i className={"fa fa-trash-alt"} />
                                </Button>
                            </div> : null
                    }
                </div>
                <div className={"comparable-sale-item-content"}>
                    {
                        comparableSale._id && !this.props.openByDefault ?
                        <CardHeader onClick={() => this.toggleDetails()} className={"comparable-sale-list-item-header"}>
                            <CardTitle>
                                <Row>
                                    {
                                        this.props.headers.map((headerFieldList, headerIndex) =>
                                        {
                                            return <ComparableSaleListItemHeaderColumn
                                                key={headerIndex}
                                                size={headerConfigurations[headerFieldList[0]].size}
                                                renders={headerFieldList.map((field) => headerConfigurations[field].render)}
                                                noValueTexts={headerFieldList.map((field) => headerConfigurations[field].noValueText)}
                                                fields={headerFieldList}
                                                comparableSale={this.props.comparableSale}/>
                                        })
                                    }
                                </Row>
                            </CardTitle>
                        </CardHeader> : null
                    }
                    <Collapse isOpen={_.isUndefined(this.state.detailsOpen) ? this.state.openByDefault : this.state.detailsOpen}>
                        <div className={`card-body comparable-sale-list-item-body ${editableClass}`}>
                                <div className={"comparable-sale-list-item-left-column"}>
                                    {
                                    (comparableSale.imageUrl) ?
                                    <UploadableImage
                                        editable={this.props.edit}
                                        value={comparableSale.imageUrl + `?access_token=${Auth.getAccessToken()}`}
                                        onChange={(newUrl) => this.changeComparableField('imageUrl', newUrl)} />
                                    :
                                    (comparableSale.address && comparableSale.address !== "") ?
                                    <UploadableImage
                                        editable={this.props.edit}
                                        value={`https://maps.googleapis.com/maps/api/streetview?key=AIzaSyBRmZ2N4EhJjXmC29t3VeiLUQssNG-MY1I&size=640x480&source=outdoor&location=${comparableSale.address}`}
                                        onChange={(newUrl) => this.changeComparableField('imageUrl', newUrl)}
                                    />
                                    : <UploadableImage
                                            editable={this.props.edit}
                                            onChange={(newUrl) => this.changeAppraisalField('imageUrl', newUrl)}
                                        />
                                    }
                                    {
                                        this.props.onRemoveDCAClicked ? <div className={"comparable-list-boxes"}>
                                            <span>Include in Direct Comparison&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                            <FieldDisplayEdit
                                                type={"boolean"}
                                                hideIcon={true}
                                                value={this.props.appraisal.hasComparableSaleInDCA(this.props.comparableSale)}
                                                onChange={() => this.props.appraisal.hasComparableSaleInDCA(this.props.comparableSale) ? this.props.onRemoveDCAClicked(comparableSale) : this.props.onAddDCAClicked(comparableSale)}
                                            />
                                        </div> : null
                                    }
                                    {
                                        this.props.onRemoveCapRateClicked ? <div className={"comparable-list-boxes"}>
                                            <span>Include in Capitalization Approach</span>
                                            <FieldDisplayEdit
                                                type={"boolean"}
                                                hideIcon={true}
                                                value={this.props.appraisal.hasComparableSaleInCapRate(this.props.comparableSale)}
                                                onChange={() => this.props.appraisal.hasComparableSaleInCapRate(this.props.comparableSale) ? this.props.onRemoveCapRateClicked(comparableSale) : this.props.onAddCapRateClicked(comparableSale)}
                                            />
                                        </div> : null
                                    }


                                </div>
                            <div className={`comparable-sale-content`}>
                                <div className={"comparable-fields-area"}>
                                    <ComparableSaleListItemField
                                        title="Address"
                                        field="address"
                                        fieldType="address"
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Property Type"
                                        field="propertyType"
                                        fieldType="propertyType"
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Sub Type"
                                        field="propertyTags"
                                        fieldType="tags"
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Building Size"
                                        field="sizeSquareFootage"
                                        fieldType="area"
                                        excludedPropertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <h4 className={"group-heading"}>Sales Information</h4>
                                    <span className={"group-heading"} />

                                    <ComparableSaleListItemField
                                        title="Sale Price"
                                        field="salePrice"
                                        fieldType="currency"
                                        cents={false}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Cap Rate"
                                        field="capitalizationRate"
                                        fieldType="percent"
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        excludedPropertyType={"land"}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Sale Date"
                                        field="saleDate"
                                        fieldType="date"
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Vendor"
                                        field="vendor"
                                        fieldType="text"
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Purchaser"
                                        field="purchaser"
                                        fieldType="text"
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="NOI"
                                        placeholder={"Net Operating Income"}
                                        field="netOperatingIncome"
                                        fieldType="currency"
                                        excludedPropertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="NOI PSF"
                                        placeholder={"Net Operating Income Per Square Foot"}
                                        field="netOperatingIncomePSF"
                                        fieldType="currency"
                                        excludedPropertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Price Per Square Foot"
                                        field="pricePerSquareFoot"
                                        fieldType="currency"
                                        excludedPropertyType={"land"}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Price Per Unit"
                                        field="pricePerUnit"
                                        fieldType="currency"
                                        propertyType={"residential"}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Avg Monthly Rent Per Unit"
                                        field="averageMonthlyRentPerUnit"
                                        fieldType="currency"
                                        propertyType={"residential"}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Price Per Bedroom"
                                        field="pricePerBedroom"
                                        fieldType="currency"
                                        propertyType={"residential"}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Number Of Units"
                                        field="numberOfUnits"
                                        fieldType="number"
                                        propertyType={"residential"}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="NOI Per Unit"
                                        field="noiPerUnit"
                                        fieldType="currency"
                                        propertyType={"residential"}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="NOI Per Bedroom"
                                        field="noiPerBedroom"
                                        fieldType="currency"
                                        propertyType={"residential"}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Bachelors"
                                        field="numberOfBachelors"
                                        fieldType="number"
                                        propertyType={"residential"}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="One Bedrooms"
                                        field="numberOfOneBedrooms"
                                        fieldType="number"
                                        propertyType={"residential"}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Two Bedrooms"
                                        field="numberOfTwoBedrooms"
                                        fieldType="number"
                                        propertyType={"residential"}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Three+ Bedrooms"
                                        field="numberOfThreePlusBedrooms"
                                        fieldType="number"
                                        propertyType={"residential"}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Total Bedrooms"
                                        field="totalBedrooms"
                                        fieldType="number"
                                        propertyType={"residential"}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />


                                    {
                                        comparableSale.propertyType === 'land' ?
                                            <h4 className={"group-heading"}>Property Information</h4>
                                            : <h4 className={"group-heading"}>Building Information</h4>
                                    }
                                    {
                                        comparableSale.propertyType === 'land' ?
                                            <span className={"group-heading"}></span>
                                            : <span className={"group-heading"}></span>
                                    }

                                    <ComparableSaleListItemField
                                        title="Floors"
                                        field="floors"
                                        fieldType="text"
                                        excludedPropertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Construction Date"
                                        field="constructionDate"
                                        fieldType="text"
                                        excludedPropertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Site Area"
                                        field="siteArea"
                                        fieldType="acres"
                                        excludedPropertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Site Coverage"
                                        field="siteCoverage"
                                        fieldType="percent"
                                        propertyType={"industrial"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Occupancy Rate"
                                        field="occupancyRate"
                                        fieldType="percent"
                                        excludedPropertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Clear Ceiling Height"
                                        field="clearCeilingHeight"
                                        fieldType="length"
                                        propertyType={"industrial"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Finished Office Percentage"
                                        field="finishedOfficePercent"
                                        fieldType="percent"
                                        propertyType={"industrial"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Shipping Doors"
                                        field="shippingDoors"
                                        fieldType="text"
                                        propertyType={"industrial"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Zoning"
                                        field="zoning"
                                        fieldType="zone"
                                        propertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Development Proposals"
                                        field="developmentProposals"
                                        fieldType="text"
                                        propertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Size of Land (sqft)"
                                        field="sizeOfLandSqft"
                                        fieldType="area"
                                        propertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Size of Land (acres)"
                                        field="sizeOfLandAcres"
                                        fieldType="acres"
                                        propertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Buildable Area (sqft)"
                                        field="sizeOfBuildableAreaSqft"
                                        fieldType="area"
                                        propertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Buildable Units"
                                        field="buildableUnits"
                                        fieldType="number"
                                        propertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    {
                                        comparableSale.propertyType === 'land' ? <h4 className={"group-heading"}>Property Information</h4> : null
                                    }

                                    {
                                        comparableSale.propertyType === 'land' ? <span className={"group-heading"}></span> : null
                                    }

                                    <ComparableSaleListItemField
                                        title="Price per Square Foot of Land"
                                        field="pricePerSquareFootLand"
                                        fieldType="currency"
                                        propertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Price per Acre of Land"
                                        field="pricePerAcreLand"
                                        fieldType="currency"
                                        propertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Price per Square Foot of Buildable Area"
                                        field="pricePerSquareFootBuildableArea"
                                        fieldType="currency"
                                        propertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Price per Buildable Unit"
                                        field="pricePerBuildableUnit"
                                        fieldType="currency"
                                        propertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Floor Space Index"
                                        field="floorSpaceIndex"
                                        fieldType="float"
                                        propertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Tenants"
                                        field="tenants"
                                        fieldType="text"
                                        excludedPropertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Parking"
                                        field="parking"
                                        fieldType="text"
                                        excludedPropertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Additional Info"
                                        field="additionalInfo"
                                        fieldType="text"
                                        excludedPropertyType={"land"}
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                    <ComparableSaleListItemField
                                        title="Description"
                                        field="computedDescriptionText"
                                        fieldType="textbox"
                                        edit={this.props.edit}
                                        comparableSale={comparableSale}
                                        onChange={this.changeComparableField.bind(this)}
                                    />

                                </div>
                            </div>
                        </div>
                    </Collapse>
                </div>
            </div>

        );
    }
}


export default ComparableSaleListItem;
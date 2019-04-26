import React from 'react';
import {Row, Col, Card, CardBody, Table, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Popover, PopoverBody, PopoverHeader} from 'reactstrap';
import NumberFormat from 'react-number-format';
import {Link} from 'react-router-dom';
import axios from "axios/index";
import FieldDisplayEdit from './components/FieldDisplayEdit';
import AppraisalContentHeader from "./components/AppraisalContentHeader";
import ComparableSaleList from "./components/ComparableSaleList";
import ComparableSaleModel from "../models/ComparableSaleModel";
import Promise from "bluebird";
import Auth from "../Auth";
import PercentFormat from "./components/PercentFormat";
import CurrencyFormat from "./components/CurrencyFormat";
import IntegerFormat from "./components/IntegerFormat";
import {StabilizedStatementModifier} from "../models/StabilizedStatementInputsModel";

class ViewCapitalizationValuation extends React.Component
{
    state = {
        capitalizationRate: 8.4,
        comparableSales: [],
        sort: "-saleDate"
    };

    loadedComparables = {};

    componentDidMount()
    {
        this.props.reloadAppraisal();
        Promise.map(this.props.appraisal.comparableSales, (comparableSaleId) =>
        {
            if (this.loadedComparables[comparableSaleId])
            {
                return this.loadedComparables[comparableSaleId];
            }
            else
            {
                return axios.get(`/comparable_sales/` + comparableSaleId).then((response) =>
                {
                    if (response.data.comparableSale)
                    {
                        this.loadedComparables[comparableSaleId] = ComparableSaleModel.create(response.data.comparableSale);
                        return this.loadedComparables[comparableSaleId];
                    }
                });
            }
        }).then((comparableSales) =>
        {
            this.setState({comparableSales: ComparableSaleModel.sortComparables(comparableSales.filter((item) => item), this.state.sort)})
        }).catch((err) =>
        {
            if (process.env.VALUATE_ENVIRONMENT.REACT_APP_DEBUG)
            {
                alert("Error: " + err.toString());
            }
        })
    }


    changeStabilizedInput(field, newValue)
    {
        this.props.appraisal.stabilizedStatementInputs[field] = newValue;
        this.props.saveAppraisal(this.props.appraisal);
    }


    changeStabilizedModifier(index, field, newValue)
    {
        if (field === 'amount' && newValue === null)
        {
            this.removeModifier(index);
        }
        else
        {
            this.props.appraisal.stabilizedStatementInputs.modifiers[index][field] = newValue;
            this.props.saveAppraisal(this.props.appraisal);
        }
    }


    removeModifier(index)
    {
        this.props.appraisal.stabilizedStatementInputs.modifiers.splice(index, 1);
        this.props.saveAppraisal(this.props.appraisal);
    }



    createNewModifier(field, newValue)
    {
        if (newValue)
        {
            if (!this.props.appraisal.stabilizedStatementInputs.modifiers)
            {
                this.props.appraisal.stabilizedStatementInputs.modifiers = [];
            }

            const object = StabilizedStatementModifier.create({
                name: "Modification",
                amount: 0
            }, this.props.appraisal.stabilizedStatementInputs, "modifiers");

            object[field] = newValue;

            this.props.appraisal.stabilizedStatementInputs.modifiers.push(object);
            this.props.saveAppraisal(this.props.appraisal);
        }
    }

    onSortChanged(newSort)
    {
        this.setState({
            sort: newSort,
            comparableSales: ComparableSaleModel.sortComparables(this.state.comparableSales, newSort)
        })
    }


    toggle()
    {
        this.setState({downloadDropdownOpen: !this.state.downloadDropdownOpen})
    }


    downloadWordSummary()
    {
        window.location = `${process.env.VALUATE_ENVIRONMENT.REACT_APP_SERVER_URL}appraisal/${this.props.appraisal._id}/capitalization_valuation/word?access_token=${Auth.getAccessToken()}`;
    }


    downloadExcelSummary()
    {
        window.location = `${process.env.VALUATE_ENVIRONMENT.REACT_APP_SERVER_URL}appraisal/${this.props.appraisal._id}/capitalization_valuation/excel?access_token=${Auth.getAccessToken()}`;
    }


    render()
    {
        return [
            <AppraisalContentHeader appraisal={this.props.appraisal} title="Capitalization Approach"/>,
            <Row className={"view-capitalization-valuation"}>
                <Col xs={12}>
                    <Card className="card-default">
                        <CardBody>
                            <Dropdown isOpen={this.state.downloadDropdownOpen} toggle={this.toggle.bind(this)}>
                                <DropdownToggle caret color={"primary"} className={"download-dropdown-button"}>
                                    Download
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem onClick={() => this.downloadWordSummary()}>Capitalization Valuation Summary (docx)</DropdownItem>
                                    <DropdownItem onClick={() => this.downloadExcelSummary()}>Capitalization Valuation Spreadshseet (xlsx)</DropdownItem>
                                </DropdownMenu>
                            </Dropdown>

                            <Row>
                                <Col xs={8}>
                                    <div className={"stabilized-statement-centered"}>
                                        <h3>Capitalization Approach</h3>
                                        <h4>{this.props.appraisal.address}</h4>
                                        <ComparableSaleList comparableSales={this.state.comparableSales}
                                                            statsTitle={""}
                                                            statsPosition={"below"}
                                                            showPropertyTypeInHeader={false}
                                                            allowNew={false}
                                                            sort={this.state.sort}
                                                            noCompMessage={"There are no comparables attached to this appraisal. Please go to the comparables database and select comparables from there."}
                                                            onSortChanged={(newSort) => this.onSortChanged(newSort)}
                                                            history={this.props.history}
                                                            appraisal={this.props.appraisal}
                                                            appraisalId={this.props.match.params._id}
                                                            appraisalComparables={this.props.appraisal.comparableSales}
                                                            // onRemoveComparableClicked={(comp) => this.removeComparableFromAppraisal(comp)}
                                                            // onChange={(comps) => this.onComparablesChanged(comps)}
                                        />
                                    </div>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={8}>
                                    <div className={"stabilized-statement-centered"}>
                                        <h3>Valuation</h3>
                                        <Table className={"statement-table "}>
                                            <tbody>
                                            <tr className={"title-row"}>
                                                <td className={"label-column"}><span className={"title"}>Net Operating Income</span></td>
                                                <td className={"amount-column"} />
                                                <td className={"amount-total-column"}>
                                                    <CurrencyFormat value={this.props.appraisal.stabilizedStatement.netOperatingIncome} />
                                                </td>
                                            </tr>
                                            {/*<tr className={"data-row"}>*/}
                                            {/*<td className={"label-column"}>NOI per square foot</td>*/}
                                            {/*<td className={"amount-column"}></td>*/}
                                            {/*<td className={"amount-total-column"}>todo</td>*/}
                                            {/*</tr>*/}
                                            <tr className={"data-row capitalization-row"}>
                                                <td className={"label-column"}>
                                                    <span>Capitalized @ <PercentFormat value={this.props.appraisal.stabilizedStatementInputs.capitalizationRate}/></span>
                                                </td>
                                                <td className={"amount-column"}></td>
                                                <td className={"amount-total-column"}>
                                                    <CurrencyFormat value={this.props.appraisal.stabilizedStatement.capitalization} />
                                                </td>
                                            </tr>
                                            {
                                                this.props.appraisal.stabilizedStatement.marketRentDifferential ?
                                                    <tr className={"data-row capitalization-row"}>
                                                        <td className={"label-column"}>
                                                            <Link to={`/appraisal/${this.props.appraisal._id}/tenants/market_rents`}>
                                                                <span>Market Rent Differential, Discounted @ <PercentFormat value={this.props.appraisal.stabilizedStatementInputs.marketRentDifferentialDiscountRate}/></span>
                                                            </Link>
                                                        </td>
                                                        <td className={"amount-column"}></td>
                                                        <td className={"amount-total-column"}>
                                                            <Link to={`/appraisal/${this.props.appraisal._id}/tenants/market_rents`}>
                                                                <CurrencyFormat value={this.props.appraisal.stabilizedStatement.marketRentDifferential} />
                                                            </Link>
                                                        </td>
                                                    </tr> : null
                                            }
                                            {
                                                this.props.appraisal.stabilizedStatement.freeRentRentLoss ?
                                                    <tr className={"data-row capitalization-row"}>
                                                        <td className={"label-column"}>
                                                            <a onClick={() => this.setState({freeRentLossPopoverOpen: !this.state.freeRentLossPopoverOpen})}>
                                                                <span>Free Rent Loss</span>
                                                            </a>
                                                            <Popover placement="bottom" isOpen={this.state.freeRentLossPopoverOpen} target={"free-rent-loss-popover"} toggle={() => this.setState({freeRentLossPopoverOpen: !this.state.freeRentLossPopoverOpen})}>
                                                                <PopoverHeader>Free Rent Loss</PopoverHeader>
                                                                <PopoverBody>
                                                                    <table className={"explanation-popover-table"}>
                                                                        <tbody>
                                                                        {
                                                                            this.props.appraisal.units.map((unit, unitIndex) =>
                                                                            {
                                                                                const underline = unitIndex === this.props.appraisal.units.length - 1 ? "underline" : "";

                                                                                return <tr>
                                                                                    <td>Unit {unit.unitNumber}</td>
                                                                                    <td><IntegerFormat value={unit.calculatedFreeRentMonths}/> months remaining</td>
                                                                                    <td>/</td>
                                                                                    <td>12</td>
                                                                                    <td>*</td>
                                                                                    <td><CurrencyFormat value={unit.calculatedFreeRentNetAmount}/></td>
                                                                                    <td>=</td>
                                                                                    <td className={underline}><CurrencyFormat value={unit.calculatedFreeRentLoss} cents={false}/></td>
                                                                                </tr>
                                                                            })
                                                                        }
                                                                        <tr className={"total-row"}>
                                                                            <td>Free Rent Loss</td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td><CurrencyFormat value={-this.props.appraisal.stabilizedStatement.freeRentRentLoss} cents={false}/></td>
                                                                        </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </PopoverBody>
                                                            </Popover>
                                                        </td>
                                                        <td className={"amount-column"}></td>
                                                        <td className={"amount-total-column"}>
                                                            <a id={"free-rent-loss-popover"} onClick={() => this.setState({freeRentLossPopoverOpen: !this.state.freeRentLossPopoverOpen})}>
                                                                <CurrencyFormat value={this.props.appraisal.stabilizedStatement.freeRentRentLoss} />
                                                            </a>
                                                        </td>
                                                    </tr> : null
                                            }
                                            {
                                                this.props.appraisal.stabilizedStatement.vacantUnitLeasupCosts ?
                                                    <tr className={"data-row capitalization-row"}>
                                                        <td className={"label-column"}>
                                                            <Link to={`/appraisal/${this.props.appraisal._id}/tenants/leasing_costs`}>
                                                                <span>Vacant Unit Leasup Costs</span>
                                                            </Link>
                                                        </td>
                                                        <td className={"amount-column"}></td>
                                                        <td className={"amount-total-column"}>
                                                            <Link to={`/appraisal/${this.props.appraisal._id}/tenants/leasing_costs`}>
                                                                <CurrencyFormat value={this.props.appraisal.stabilizedStatement.vacantUnitLeasupCosts}/>
                                                            </Link>
                                                        </td>
                                                    </tr> : null
                                            }
                                            {
                                                this.props.appraisal.stabilizedStatement.vacantUnitRentLoss ?
                                                    <tr className={"data-row capitalization-row"}>
                                                        <td className={"label-column"}>
                                                            <Link to={`/appraisal/${this.props.appraisal._id}/tenants/leasing_costs`}>
                                                                <span>Vacant Unit Rent Loss</span>
                                                            </Link>
                                                        </td>
                                                        <td className={"amount-column"}></td>
                                                        <td className={"amount-total-column"}>
                                                            <Link to={`/appraisal/${this.props.appraisal._id}/tenants/leasing_costs`}>
                                                                <CurrencyFormat value={this.props.appraisal.stabilizedStatement.vacantUnitRentLoss}/>
                                                            </Link>
                                                        </td>
                                                    </tr> : null
                                            }
                                            {
                                                this.props.appraisal.stabilizedStatement.amortizedCapitalInvestment ?
                                                    <tr className={"data-row capitalization-row"}>
                                                        <td className={"label-column"}>
                                                            <Link to={`/appraisal/${this.props.appraisal._id}/tenants/amortization`}>
                                                                <span>Amortized Capital Investment</span>
                                                            </Link>
                                                        </td>
                                                        <td className={"amount-column"}></td>
                                                        <td className={"amount-total-column"}>
                                                            <Link to={`/appraisal/${this.props.appraisal._id}/tenants/amortization`}>
                                                                <CurrencyFormat value={this.props.appraisal.stabilizedStatement.amortizedCapitalInvestment} />
                                                            </Link>
                                                        </td>
                                                    </tr> : null
                                            }
                                            {
                                                this.props.appraisal.stabilizedStatementInputs.modifiers ? this.props.appraisal.stabilizedStatementInputs.modifiers.map((modifier, index) =>
                                                {
                                                    return <tr className={"data-row modifier-row"} key={index}>
                                                        <td className={"label-column"}>
                                                            <span><FieldDisplayEdit
                                                                type={"text"}
                                                                placeholder={"Add/Remove ($)"}
                                                                value={modifier.name}
                                                                onChange={(newValue) => this.changeStabilizedModifier(index, "name", newValue)}
                                                            /></span>
                                                        </td>
                                                        <td className={"amount-column"}></td>
                                                        <td className={"amount-total-column"}>
                                                            <FieldDisplayEdit
                                                                hideIcon={true}
                                                                type={"currency"}
                                                                placeholder={"Amount"}
                                                                value={modifier.amount}
                                                                onChange={(newValue) => this.changeStabilizedModifier(index, "amount", newValue)}
                                                            />
                                                        </td>
                                                    </tr>
                                                }) : null
                                            }
                                            <tr className={"data-row"}>
                                                <td className={"label-column"}>
                                                    <span><FieldDisplayEdit
                                                        type={"text"}
                                                        placeholder={"Add/Remove ($)"}
                                                        // value={modifier.name}
                                                        onChange={(newValue) => this.createNewModifier("name", newValue)}
                                                    /></span>
                                                </td>
                                                <td className={"amount-column"}></td>
                                                <td className={"amount-total-column"}>
                                                    <FieldDisplayEdit
                                                        type={"currency"}
                                                        placeholder={"Amount"}
                                                        hideIcon={true}
                                                        // value={modifier.amount}
                                                        onChange={(newValue) => this.createNewModifier("amount", newValue)}
                                                    />
                                                </td>
                                            </tr>
                                            <tr className={"data-row rounding-row"}>
                                                <td className={"label-column"}>
                                                    <span>Estimated Value</span>
                                                </td>
                                                <td className={"amount-column"}></td>
                                                <td className={"amount-total-column"}>
                                                    <CurrencyFormat value={this.props.appraisal.stabilizedStatement.valuation} />
                                                </td>
                                            </tr>
                                            <tr className={"data-row rounding-row"}>
                                                <td className={"label-column"}>
                                                    <span>Rounded</span>
                                                </td>
                                                <td className={"amount-column"}></td>
                                                <td className={"amount-total-column"}>
                                                    <CurrencyFormat value={this.props.appraisal.stabilizedStatement.valuationRounded} />
                                                </td>
                                            </tr>
                                            </tbody>
                                        </Table>
                                        <br/>
                                        <br/>
                                        <h4 className={"final-valuation"}>Value by the Overall Capitalization Rate Method ... $<NumberFormat
                                            value={this.props.appraisal.stabilizedStatement.valuationRounded}
                                            displayType={'text'}
                                            thousandSeparator={', '}
                                            decimalScale={2}
                                            fixedDecimalScale={true}
                                        />
                                        </h4>
                                    </div>
                                </Col>
                                <Col xs={4}>
                                    <Card className={"capitalization-valuation-inputs"} outline>
                                        <CardBody>
                                            <h3>Inputs</h3>

                                            <Table>
                                                <tr>
                                                    <td>Discount Rate for Market Rent Differential</td>
                                                    <td>
                                                        <FieldDisplayEdit
                                                            type={"percent"}
                                                            placeholder={"Market Rent Differential Discount Rate"}
                                                            value={this.props.appraisal.stabilizedStatementInputs ? this.props.appraisal.stabilizedStatementInputs.marketRentDifferentialDiscountRate : 5.0}
                                                            onChange={(newValue) => this.changeStabilizedInput("marketRentDifferentialDiscountRate", newValue)}
                                                        />
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Capitalization Rate</td>
                                                    <td>
                                                        <FieldDisplayEdit
                                                            type={"percent"}
                                                            placeholder={"Capitalization Rate"}
                                                            value={this.props.appraisal.stabilizedStatementInputs ? this.props.appraisal.stabilizedStatementInputs.capitalizationRate : 5.0}
                                                            onChange={(newValue) => this.changeStabilizedInput("capitalizationRate", newValue)}
                                                        />
                                                    </td>
                                                </tr>
                                            </Table>

                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        ];
    }
}

export default ViewCapitalizationValuation;

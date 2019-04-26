import React from 'react';
import {Card, CardHeader, CardBody, Row, Col, Button, Popover, PopoverBody, PopoverHeader} from 'reactstrap';
import axios from "axios/index";
import FieldDisplayEdit from './components/FieldDisplayEdit';
import 'react-datetime/css/react-datetime.css'
import ComparableLeaseModel from "../models/ComparableLeaseModel";
import ComparableLeaseList from "./components/ComparableLeaseList";
import Promise from "bluebird";
import MarketRentModel from "../models/MarketRentModel";
import CurrencyFormat from "./components/CurrencyFormat";
import PercentFormat from "./components/PercentFormat";
import AreaFormat from "./components/AreaFormat";
import moment from "moment";
import Moment from "react-moment";
import IntegerFormat from "./components/IntegerFormat";


class TenantApplicableEditor extends React.Component
{
    state = {};

    render()
    {
        const popoverId = `market-rent-differential-popover-${this.props.marketRent.name.replace(/\W/g, "")}-${this.props.unit.unitNumber.replace(/\W/g, "")}`;

        const marketRentDifferentialStateDate = moment(this.props.appraisal.getEffectiveDate());
        const marketRentDifferentialEndDate = moment(this.props.unit.currentTenancy.endDate);

        const differentialMonths = [];

        const currentDate = marketRentDifferentialStateDate;

        const presentDifferentialPSF = (this.props.unit.currentTenancy.yearlyRent / this.props.unit.squareFootage) - this.props.unit.marketRentAmount;

        const monthlyDifferentialCashflow = (presentDifferentialPSF * this.props.unit.squareFootage) / 12.0;

        const monthlyDiscount = Math.pow(1.0 + (this.props.appraisal.stabilizedStatementInputs.marketRentDifferentialDiscountRate / 100), 1 / 12.0);

        let month = 0;

        while(currentDate.toDate().getTime() < marketRentDifferentialEndDate.toDate().getTime())
        {
            const totalDiscount = monthlyDiscount ** month;

            const presentValue = monthlyDifferentialCashflow / totalDiscount;

            differentialMonths.push({
                date: currentDate.clone().toDate(),
                month: month,
                currentRent: this.props.unit.currentTenancy.yearlyRent,
                marketRent: this.props.unit.marketRentAmount * this.props.unit.squareFootage,
                presentMonthlyCashFlow: monthlyDifferentialCashflow,
                discount: totalDiscount,
                presentValue: presentValue,

            });

            currentDate.add(1, "months");
            month += 1;
        }

        return [<td className={"value-column"} key={1}>
            <div>Unit {this.props.unit.unitNumber} - {this.props.unit.currentTenancy.name}</div>
            <div>
                <FieldDisplayEdit
                    type={"boolean"}
                    hideIcon={true}
                    value={this.props.unit.marketRent === this.props.marketRent.name}
                    onChange={() => this.props.onChange()}
                    placeholder={"Does market rent apply to unit " + this.props.unit.unitNumber.toString()}
                />
            </div>
        </td>,
            <td className={"calculated-market-rent-differential-column"} key={2}>
                <a id={popoverId} onClick={() => this.setState({marketRentDifferentialPopoverOpen: !this.state.marketRentDifferentialPopoverOpen})}>
                    {this.props.unit.marketRent === this.props.marketRent.name && this.props.unit.shouldApplyMarketRentDifferential ?
                        <CurrencyFormat value={this.props.unit.calculatedMarketRentDifferential}
                                        title={`Market Rent Differential for Unit ${this.props.unit.unitNumber}`}/>
                        : null}
                </a>
                <Popover placement="bottom" isOpen={this.state.marketRentDifferentialPopoverOpen} target={popoverId} toggle={() => this.setState({marketRentDifferentialPopoverOpen: !this.state.marketRentDifferentialPopoverOpen})}>
                    <PopoverHeader>Unit {this.props.unit.unitNumber} - Market Rent Differential</PopoverHeader>
                    <PopoverBody>
                        <table className={"explanation-popover-table"}>
                            <thead>
                            <tr>
                                <td>
                                    Date
                                </td>
                                <td>
                                    Month
                                </td>
                                <td>
                                    Actual Rent
                                </td>
                                <td />
                                <td>
                                    Market Rent
                                </td>
                                <td />
                                <td>
                                    Market Rent Difference
                                </td>
                                <td>

                                </td>
                                <td>
                                    Discount
                                </td>
                                <td>

                                </td>
                                <td>
                                    Present Value
                                </td>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                differentialMonths.map((differential, index) =>
                                {
                                    let className = "";

                                    if (index === differentialMonths.length - 1)
                                    {
                                        className = "underline";
                                    }

                                    return <tr key={index}>
                                        <td>
                                            <Moment date={differential.date} format="MMM YYYY" />
                                        </td>
                                        <td>
                                            <IntegerFormat value={differential.month} />
                                        </td>
                                        <td>
                                            <CurrencyFormat value={differential.currentRent}/>
                                        </td>
                                        <td>
                                            -
                                        </td>
                                        <td>
                                            <CurrencyFormat value={differential.marketRent}/>
                                        </td>
                                        <td>
                                            =
                                        </td>
                                        <td>
                                            <CurrencyFormat value={differential.presentMonthlyCashFlow}/>
                                        </td>
                                        <td>
                                            *
                                        </td>
                                        <td>
                                            <PercentFormat value={(1 / differential.discount) * 100}/>
                                        </td>
                                        <td>
                                            =
                                        </td>
                                        <td className={className}>
                                            <CurrencyFormat value={differential.presentValue}/>
                                        </td>
                                    </tr>
                                })
                            }
                            <tr className={"total-row"}>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td colSpan={2}><strong>Total Present Value<br/> of Market Rent<br/> Differential</strong></td>
                                <td><CurrencyFormat value={this.props.unit.calculatedMarketRentDifferential} /></td>
                            </tr>
                            </tbody>
                        </table>
                    </PopoverBody>
                </Popover>
            </td>,
            <td className={"should-apply-market-rent-differential-column"} key={3}>
                {this.props.unit.marketRent === this.props.marketRent.name ?
                    <FieldDisplayEdit
                        type={"boolean"}
                        hideIcon={true}
                        value={this.props.unit.shouldApplyMarketRentDifferential}
                        onChange={() => this.props.onChangeApplyMarketRentDifferential()}
                        placeholder={"Should apply a market rent differential on unit " + this.props.unit.unitNumber.toString()}
                    /> : null}
            </td>,

            <td className={"should-use-market-rent"} key={4}>
                {this.props.unit.marketRent === this.props.marketRent.name ?
                    <FieldDisplayEdit
                        type={"boolean"}
                        hideIcon={true}
                        value={this.props.unit.shouldUseMarketRent}
                        onChange={() => this.props.onChangeShouldUseMarketRent()}
                        placeholder={"Should use the market rent for unit " + this.props.unit.unitNumber.toString() + " when calculating the stabilized statement."}
                    /> : null}
            </td>
        ]
    }
}

class MarketRentEditor extends React.Component
{
    changeField(field, newValue)
    {
        const marketRent = this.props.marketRent;

        if (newValue !== marketRent[field])
        {
            if (field === "name")
            {
                // Go through the appraisal units and update any which are attached to this rent name
                this.props.appraisal.units.forEach((unit) =>
                {
                    if (unit.marketRent === marketRent.name)
                    {
                        unit.marketRent = newValue;
                    }
                });
            }

            marketRent[field] = newValue;
            this.props.onChange(marketRent);
        }
    }

    changeUnitMarketRent(unit)
    {
        if (unit.marketRent === this.props.marketRent.name)
        {
            unit.marketRent = null;
        }
        else
        {
            unit.marketRent = this.props.marketRent.name;
        }
        unit.resetCalculations();
        this.props.onChange(this.props.marketRent);
    }

    onChangeApplyMarketRentDifferential(unit)
    {
        unit.shouldApplyMarketRentDifferential = !unit.shouldApplyMarketRentDifferential;
        this.props.onChange(this.props.marketRent);
    }

    onChangeShouldUseMarketRent(unit)
    {
        unit.shouldUseMarketRent = !unit.shouldUseMarketRent;
        this.props.onChange(this.props.marketRent);
    }

    computeTotalMarketRentDifferential()
    {
        let total = 0;
        this.props.appraisal.units.forEach((unit) =>
        {
            if (unit.marketRent === this.props.marketRent.name)
            {
                total += unit.calculatedMarketRentDifferential;
            }
        });

        return total;
    }

    render()
    {
        const marketRent = this.props.marketRent;

        return <Card className={"market-rent-editor"}>
            <CardBody>
                <table className="market-rent-table">
                    <tbody>
                    <tr>
                        <td colSpan={2}>
                            {
                                this.props.marketRent.name !== "Standard" ?
                                    <FieldDisplayEdit
                                        type="text"
                                        placeholder="Market Rent Name"
                                        value={marketRent.name}
                                        onChange={(newValue) => this.changeField('name', newValue)}
                                        hideInput={false}
                                        hideIcon={true}

                                    /> : <strong className={"title"}>Default</strong>
                            }

                        </td>
                        <td className={"calculated-market-rent-differential-column"}/>
                        <td className={"should-apply-market-rent-differential-column"}/>
                        <td className={"should-use-market-rent"} />
                    </tr>
                    <tr className={"market-rent-row"}>
                        <td className={"label-column"}>
                            <strong>Annual Rent (psf) </strong>
                        </td>
                        <td className={"value-column"}>
                            <FieldDisplayEdit
                                type="currency"
                                value={marketRent.amountPSF}
                                hideInput={false}
                                hideIcon={true}
                                onChange={(newValue) => this.changeField('amountPSF', newValue)}
                            />
                        </td>
                        <td className={"calculated-market-rent-differential-column"}/>
                        <td className={"should-apply-market-rent-differential-column"}/>
                        <td className={"should-use-market-rent"} />
                    </tr>
                    <tr className={"market-rent-row header-row"}>
                        <td className={"label-column"}/>
                        <td className={"value-column"}/>
                        <td className={"calculated-market-rent-differential-column"}>
                            <strong>Calculated Market<br/>Rent Differential</strong>
                        </td>
                        <td className={"should-apply-market-rent-differential-column"}>
                            <strong>Apply Market<br/>Rent Differential</strong>
                        </td>
                        <td className={"should-use-market-rent"}>
                            <strong>Should use Market Rent<br/>in Stabilized Statement</strong>
                        </td>
                    </tr>
                    <tr className={"market-rent-row"}>
                        <td className={"label-column"}>
                            <strong>Tenants Applied To</strong>
                        </td>
                        {
                            this.props.appraisal.units.length > 0 ?
                                <TenantApplicableEditor unit={this.props.appraisal.units[0]} marketRent={marketRent}
                                                        appraisal={this.props.appraisal}
                                                        onChange={() => this.changeUnitMarketRent(this.props.appraisal.units[0])}
                                                        onChangeApplyMarketRentDifferential={() => this.onChangeApplyMarketRentDifferential(this.props.appraisal.units[0])}
                                                        onChangeShouldUseMarketRent={() => this.onChangeShouldUseMarketRent(this.props.appraisal.units[0])}
                                />
                                : null
                        }
                    </tr>
                    {
                        this.props.appraisal.units.map((unit, unitIndex) =>
                        {
                            if (unitIndex === 0)
                            {
                                return null;
                            }

                            return <tr className={"market-rent-row"} key={unitIndex}>
                                <td className={"label-column"}/>
                                <TenantApplicableEditor unit={unit} marketRent={marketRent}
                                                        appraisal={this.props.appraisal}
                                                        onChange={() => this.changeUnitMarketRent(unit)}
                                                        onChangeApplyMarketRentDifferential={() => this.onChangeApplyMarketRentDifferential(unit)}
                                                        onChangeShouldUseMarketRent={() => this.onChangeShouldUseMarketRent(unit)}
                                />
                            </tr>
                        })
                    }
                    <tr className={"market-rent-row total-spacer-row"}>
                        <td className={"label-column"}/>
                        <td className={"value-column"} />
                        <td className={"calculated-market-rent-differential-column"} />
                        <td className={"should-apply-market-rent-differential-column"} />
                        <td className={"should-use-market-rent"} />
                    </tr>
                    <tr className={"market-rent-row total-row"}>
                        <td className={"label-column"}/>
                        <td className={"value-column"}>
                            <strong>Total Market Rent Differential<br/>at this Market Rent Rate</strong>
                        </td>
                        <td className={"calculated-market-rent-differential-column"}>
                            <CurrencyFormat value={this.computeTotalMarketRentDifferential()}/>
                        </td>
                        <td className={"should-apply-market-rent-differential-column"} />
                        <td className={"should-use-market-rent"} />
                    </tr>
                    </tbody>
                </table>

                <Button color={"danger"} className={"delete-button"}
                        onClick={() => this.props.onDeleteMarketRent(this.props.marketRent)}>Delete</Button>
            </CardBody>
        </Card>
    }
}


class ViewMarketRents extends React.Component
{
    state = {
        capitalizationRate: 8.4,
        selectedUnit: null,
        newMarketRent: {},
        comparableLeases: []
    };

    defaultMarketRentData = {
        name: "New Market Rent",
        amountPSF: 1
    };

    onMarketRentChanged(marketRent, marketRentIndex)
    {
        this.props.appraisal.marketRents[marketRentIndex] = marketRent;
        this.props.saveAppraisal(this.props.appraisal);
    }

    onNewMarketRent(newMarketRent)
    {
        newMarketRent.name = newMarketRent.name + " " + (this.props.appraisal.marketRents.length + 1).toString();
        this.props.appraisal.marketRents.push(newMarketRent);
        this.props.saveAppraisal(this.props.appraisal);
    }

    onDeleteMarketRent(marketRentIndex)
    {
        const marketRent = this.props.appraisal.marketRents[marketRentIndex];
        this.props.appraisal.marketRents.splice(marketRentIndex, 1);

        // Go through the appraisal units and update any which are attached to this rent name
        this.props.appraisal.units.forEach((unit) =>
        {
            if (unit.marketRent === marketRent.name)
            {
                unit.marketRent = null;
            }
        });

        this.props.saveAppraisal(this.props.appraisal);
    }

    componentDidMount()
    {
        this.loadLeases();
    }

    loadLeases()
    {
        Promise.map(this.props.appraisal.comparableLeases, (comparableLeaseId) =>
        {
            if (this.loadedComparables[comparableLeaseId])
            {
                return this.loadedComparables[comparableLeaseId];
            }
            else
            {
                // alert('loading');
                return axios.get(`/comparable_leases/` + comparableLeaseId).then((response) =>
                {
                    this.loadedComparables[comparableLeaseId] = ComparableLeaseModel.create(response.data.comparableLease);
                    return this.loadedComparables[comparableLeaseId];
                });
            }
        }).then((comparableLeases) =>
        {
            this.setState({comparableLeases: ComparableLeaseModel.sortComparables(comparableLeases, this.state.sort)})
        })
    }

    render()
    {
        return (
            (this.props.appraisal) ?
                <div id={"view-market-rents"} className={"view-market-rents"}>
                    <h2>Market Rents</h2>
                    <Row>
                        <Col xs={12}>
                            <ComparableLeaseList comparableLeases={this.state.comparableLeases}
                                                 statsTitle={"Statistics for Selected Lease Comps"}
                                                 allowNew={false}
                                                 sort={this.state.sort}
                                                 onSortChanged={(newSort) => this.onSortChanged(newSort)}
                                                 noCompMessage={"There are no comparables attached to this appraisal. Please go to the comparable leases database and select comparables from there."}
                                                 history={this.props.history}
                                                 appraisalId={this.props.match.params._id}
                                                 appraisalComparables={this.props.appraisal.comparableLeases}
                                                 onChange={(comps) => this.onComparablesChanged(comps)}
                            />
                        </Col>
                    </Row>
                    <br/>
                    <br/>
                    <Row>
                        <Col>
                            <h2>Set Market Rents</h2>

                            <div className={"market-rent-list"}>
                                {
                                    this.props.appraisal.marketRents.map((marketRent, marketRentIndex) =>
                                    {
                                        return <MarketRentEditor
                                            key={marketRentIndex}
                                            marketRent={marketRent}
                                            appraisal={this.props.appraisal}
                                            onChange={(newValue) => this.onMarketRentChanged(newValue, marketRentIndex)}
                                            onDeleteMarketRent={() => this.onDeleteMarketRent(marketRentIndex)}
                                        />
                                    })
                                }
                                {
                                    this.props.appraisal.marketRents.length > 1 ?
                                        <Card className={"market-rent-editor"}>
                                            <CardBody>
                                                <table className="market-rent-table">
                                                    <tbody>
                                                    <tr className={"market-rent-row total-row"}>
                                                        <td className={"label-column"}/>
                                                        <td className={"value-column"}>
                                                            <strong>Total Market Rent Differential</strong>
                                                        </td>
                                                        <td className={"calculated-market-rent-differential-column"}>
                                                            <CurrencyFormat value={this.props.appraisal.stabilizedStatement.marketRentDifferential}/>
                                                        </td>
                                                        <td className={"should-apply-market-rent-differential-column"} />
                                                        <td className={"should-use-market-rent"} />
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </CardBody>
                                        </Card> : null
                                }
                                {
                                    <div className={"new-market-rent"}>
                                        <Button onClick={() => this.onNewMarketRent(MarketRentModel.create(this.defaultMarketRentData, this.props.appraisal, "marketRents"))}>
                                            <span>Create a new Market Rent</span>
                                        </Button>
                                    </div>
                                }
                            </div>
                        </Col>
                    </Row>
                </div>
                : null
        );
    }
}

export default ViewMarketRents;

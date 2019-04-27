import React from 'react';
import ComparableSaleListItem from './ComparableSaleListItem';
import {Row, Col, CardHeader, CardTitle} from 'reactstrap';
import ComparableSalesStatistics from "./ComparableSalesStatistics"
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import SortDirection from "./SortDirection";
import ComparableSaleModel from "../../models/ComparableSaleModel";
import axios from "axios/index";
import PropTypes from "prop-types";
import _ from "underscore";

class ComparableSaleListHeaderColumn extends React.Component
{
    static propTypes = {
        size: PropTypes.number.isRequired,
        texts: PropTypes.arrayOf(PropTypes.string).isRequired,
        fields: PropTypes.arrayOf(PropTypes.string).isRequired,
        sort: PropTypes.object.isRequired,
        changeSortColumn: PropTypes.func.isRequired
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

        return <Col className={`header-field-column ${colClass}`} {...colProps} onClick={() => this.props.changeSortColumn(this.props.fields[0])}>

            {
                this.props.fields.map((field, fieldIndex) =>
                {
                    return <span>
                            {this.props.texts[fieldIndex]}
                            {fieldIndex === 0 ? <SortDirection field={this.props.fields[0]} sort={this.props.sort} /> : null}
                            {fieldIndex !== this.props.fields.length - 1 ? <br /> : null}
                    </span>
                })
            }

        </Col>
    }
}

class ComparableSaleList extends React.Component
{
    static defaultProps = {
        "statsPosition": "above",
        showPropertyTypeInHeader: true,
        "noCompMessage": "There are no comparables. Please add a new one or change your search settings."
    };

    state = {
        comparableSales: [],
        newComparableSale: ComparableSaleModel.create({}),
        isCreatingNewItem: false
    };

    loadedComparables = {};


    componentDidMount()
    {
        this.updateComparables();
    }


    componentDidUpdate()
    {
        this.updateComparables();
    }

    defaultHeaderFields()
    {
        const headerFields = [
            ["saleDate"],
            ["address"]
        ];

        if (this.props.appraisal.propertyType !== 'land')
        {
            headerFields.push(["sizeSquareFootage"])
        }

        if (this.props.appraisal.propertyType === 'land')
        {
            headerFields.push(["sizeOfLandAcres", "sizeOfBuildableAreaSqft"])
        }

        headerFields.push(["salePrice"]);

        headerFields.push(["propertyType", "propertyTags"]);

        if (this.props.appraisal.propertyType !== 'land')
        {
            headerFields.push(["capitalizationRate", "pricePerSquareFoot"])
        }

        if (this.props.appraisal.propertyType === 'land')
        {
            headerFields.push(["pricePerAcreLand", "pricePerSquareFootBuildableArea"])
        }

        return headerFields;
    }

    updateComparables()
    {
        if (this.props.comparableSales !== this.state.comparableSales)
        {
            // this.setState({comparableSales: _.filter(this.props.comparableSales, (sale) => excludeIds.indexOf(sale._id['$oid]']) !== -1 )});
            this.setState({comparableSales: this.props.comparableSales});
        }
    }


    addNewComparable(newComparable)
    {
        axios.post(`/comparable_sales`, newComparable).then((response) =>
        {
            newComparable["_id"] = response.data._id;
            newComparable[ComparableSaleListItem._newSale] = true;

            this.props.onNewComparable(newComparable);
            this.setState({isCreatingNewItem: false, newComparableSale: ComparableSaleModel.create({})})
        });
    }

    updateComparable(changedComp, index)
    {
        const comparables = this.state.comparableSales;
        comparables[index] = changedComp;
        if (this.props.onChange)
        {
            this.props.onChange(comparables);
        }
    }


    onRemoveComparableClicked(comparable)
    {
        const comparables = this.state.comparableSales;

        for (let i = 0; i < this.state.comparableSales.length; i += 1)
        {
            if (this.state.comparableSales[i]._id === comparable._id)
            {
                comparables.splice(i, 1);
                break;
            }
        }

        if (this.props.onChange)
        {
            this.props.onChange(comparables);
        }
    }


    toggleNewItem()
    {
        this.setState({isCreatingNewItem: false});
    }


    toggleCreateNewItem()
    {
        this.setState({isCreatingNewItem: true})
    }


    renderNewItemRow()
    {
        return <div className="card b new-comparable" onClick={() => this.toggleCreateNewItem()}>
                <div className="card-body">
                    <span>Create new comparable...</span>
                </div>
            </div>
    }

    changeSortColumn(field)
    {
        let newSort = "";
        if (("+" + field) === this.props.sort)
        {
            newSort = "-" + field;
        }
        else if (("-" + field) === this.props.sort)
        {
            newSort = "+" + field;
        }
        else
        {
            newSort = "-" + field;
        }

        if (this.props.onSortChanged)
        {
            this.props.onSortChanged(newSort);
        }

        this.setState({sort: newSort});
    }


    render()
    {
        let excludeIds = this.props.excludeIds;
        if (!excludeIds)
        {
            excludeIds = [];
        }

        let firstSpacing = '';
        if (this.props.onRemoveComparableClicked)
        {
            firstSpacing = 'first-spacing';
        }


        const headerConfigurations = {
            saleDate: {
                title: "Date",
                size: 1
            },
            address: {
                title: "Address",
                size: 3
            },
            sizeSquareFootage: {
                title: "Building Size (sf)",
                size: "middle"
            },
            sizeOfLandAcres: {
                title: "Site Area (acres)",
                size: "middle"
            },
            sizeOfBuildableAreaSqft: {
                title: "Buildable Area (sqft)",
                size: "middle"
            },
            salePrice: {
                title: "Sale Price",
                size: "middle"
            },
            capitalizationRate: {
                title: "Cap Rate (%)",
                size: "middle"
            },
            propertyType: {
                title: "Property Type",
                size: "middle"
            },
            propertyTags: {
                title: "Sub Type",
                size: "middle"
            },
            pricePerSquareFoot: {
                title: "PSF ($)",
                size: "middle"
            },
            pricePerAcreLand: {
                title: "Price Per Acre ($)",
                size: "middle"
            },
            pricePerSquareFootBuildableArea: {
                title: "PSF Buildable Area ($)",
                size: "middle"
            }
        };

        const headerFields = this.props.headers || this.defaultHeaderFields();

        return (
            <div>
                {
                    this.props.statsPosition === "above" ? <ComparableSalesStatistics appraisal={this.props.appraisal} comparableSales={this.state.comparableSales}  title={this.props.statsTitle}/> : null
                }
                <div>
                {
                    <div className={`card b comparable-sale-list-header`}>
                        <CardHeader className={`comparable-sale-list-item-header ${firstSpacing}`}>
                            <CardTitle>
                                <Row>
                                    {
                                        headerFields.map((headerFieldList) =>
                                        {
                                            return <ComparableSaleListHeaderColumn
                                                size={headerConfigurations[headerFieldList[0]].size}
                                                renders={headerFieldList.map((field) => headerConfigurations[field].render)}
                                                texts={headerFieldList.map((field) => headerConfigurations[field].title)}
                                                fields={headerFieldList}
                                                sort={this.props.sort}
                                                comparableSale={this.props.comparableSale}
                                                changeSortColumn={this.changeSortColumn.bind(this)}
                                            />
                                        })
                                    }
                                </Row>
                            </CardTitle>
                        </CardHeader>
                    </div>
                }
                {
                    this.props.allowNew ?
                        <div>
                            {this.renderNewItemRow()}
                            <Modal isOpen={this.state.isCreatingNewItem} toggle={this.toggleNewItem.bind(this)} className={"new-comp-dialog"}>
                                <ModalHeader toggle={this.toggleNewItem.bind(this)}>New Comparable Sale</ModalHeader>
                                <ModalBody>
                                    <ComparableSaleListItem comparableSale={this.state.newComparableSale}
                                                            openByDefault={true}
                                                            onChange={(comp) => this.setState({newComparableSale: comp})} />
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="primary" onClick={() => this.addNewComparable(this.state.newComparableSale)}>Add</Button>{' '}
                                    <Button color="primary" onClick={() => this.toggleNewItem()}>Cancel</Button>{' '}
                                </ModalFooter>
                            </Modal>
                        </div> : null
                }
                {
                    this.state.comparableSales.map((comparableSale, index) =>
                    {
                        if (excludeIds.indexOf(comparableSale._id) === -1)
                        {
                            return <ComparableSaleListItem
                                headers={headerFields}
                                key={comparableSale._id}
                                comparableSale={comparableSale}
                                history={this.props.history}
                                appraisal={this.props.appraisal}
                                onChange={(comp) => this.updateComparable(comp, index)}
                                onAddComparableClicked={this.props.onAddComparableClicked}
                                onRemoveComparableClicked={this.props.onRemoveComparableClicked}
                                onRemoveDCAClicked={this.props.onRemoveDCAClicked}
                                onRemoveCapRateClicked={this.props.onRemoveCapRateClicked}
                                onAddDCAClicked={this.props.onAddDCAClicked}
                                onAddCapRateClicked={this.props.onAddCapRateClicked}
                                onDeleteComparable={(comp) => this.onRemoveComparableClicked(comp)}
                                last={index===this.state.comparableSales.length-1}
                            />;
                        }
                        else
                        {
                            return null;
                        }
                    })
                }
                <div>
                    {
                        this.state.comparableSales.length === 0 ? <div className="card b no-comparables-found">
                            <div className="card-body">
                                <span>{this.props.noCompMessage}</span>
                            </div>
                        </div> : null
                    }
                </div>
                </div>
                {
                    this.props.statsPosition === "below" ? <div><br/><ComparableSalesStatistics appraisal={this.props.appraisal} comparableSales={this.state.comparableSales}  title={this.props.statsTitle}/></div> : null
                }
            </div>
        );
    }
}


export default ComparableSaleList;

import React from 'react';
import {Row, Col, Card, CardBody, Nav, NavItem, NavLink} from 'reactstrap';
import axios from 'axios';
import ViewLeaseExtractions from "./ViewLeaseExtractions";
import ViewLeaseReport from "./ViewLeaseReport";
import {NavLink as RRNavLink} from 'react-router-dom';
import {Switch, Route} from 'react-router-dom';
import FileModel from "../models/FileModel";


class ViewLease extends React.Component {
    state = {
        width: 0,
        height: 0
    };

    componentDidMount() {
        axios.get(`/appraisal/${this.props.match.params._id}/files/${this.props.match.params.leaseId}`).then((response) => {
            this.setState({lease: FileModel.create(response.data.file)})
        });
    }

    componentDidUpdate() {

    }

    saveLeaseData(newLease) {
        axios.post(`/appraisal/${this.props.match.params._id}/files/${this.props.match.params.leaseId}`, newLease).then((response) => {
            this.setState({lease: newLease})
        });
    }

    render() {
        return (
            <Row>
                <Col xs={12}>
                    <Card className="card-default">
                        <CardBody>
                            <div id={"view-lease-page"}>
                                <Row>
                                    <Col xs={12}>
                                        <Nav tabs>
                                            {/*<NavItem>*/}
                                            {/*<NavLink to={`${this.props.match.url}/summary`} activeClassName="active" tag={RRNavLink}>Summarized Data</NavLink>*/}
                                            {/*</NavItem>*/}
                                            <NavItem>
                                                <NavLink to={`${this.props.match.url}/raw`} activeClassName="active"
                                                         tag={RRNavLink}>Raw Lease</NavLink>
                                            </NavItem>
                                            <NavItem>
                                                <NavLink to={`${this.props.match.url}/report`}
                                                         activeClassName="active" tag={RRNavLink}>Report</NavLink>
                                            </NavItem>
                                        </Nav>
                                    </Col>
                                </Row>
                                {
                                    (this.state.lease && <Row>
                                        <Col xs={12}>
                                            <Card className="card-default">
                                                <CardBody>
                                                    <Switch>
                                                        <Route path={`${this.props.match.url}/raw`}
                                                               render={() => <ViewLeaseExtractions
                                                                   lease={this.state.lease}
                                                                   saveLeaseData={this.saveLeaseData.bind(this)}/>}
                                                               lease={this.state.lease}/>
                                                        <Route path={`${this.props.match.url}/summary`}
                                                               render={() => <ViewLeaseReport
                                                                   lease={this.state.lease}
                                                                   saveLeaseData={this.saveLeaseData.bind(this)}/>}
                                                               lease={this.state.lease}/>
                                                        <Route path={`${this.props.match.url}/report`}
                                                               render={() => <ViewLeaseReport
                                                                   lease={this.state.lease}
                                                                   saveLeaseData={this.saveLeaseData.bind(this)}/>}
                                                               lease={this.state.lease}/>
                                                    </Switch>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>)
                                }
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        );
    }
}

export default ViewLease;

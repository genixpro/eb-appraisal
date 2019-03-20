import React from 'react';
import { Row, Col, Card, CardBody} from 'reactstrap';
import axios from 'axios';
import LeaseList from "./components/LeaseList"


class ViewLeases extends React.Component
{
    state = {
        leases: []
    };

    componentDidMount()
    {
        axios.get(`/appraisal/${this.props.match.params._id}/files?type=lease`).then((response) =>
        {
            this.setState({leases: response.data.files})
        });
    }


    render() {
        return (
            <div>
                <Row>
                    <Col xs={12} className={"content-column"}>
                        <Card className="card-default">
                            <CardBody>
                                <div>
                                    <Row>
                                        <Col xs={12}>
                                            <h3>View Leases</h3>
                                        </Col>
                                        <Col xs={12}>
                                            <LeaseList leases={this.state.leases} history={this.props.history} appraisalId={this.props.match.params._id}/>
                                        </Col>
                                    </Row>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default ViewLeases;

import React from 'react';
import { Row, Col } from 'reactstrap';
import axios from 'axios';
import ComparableSaleList from "./components/ComparableSaleList"


class ViewComparableSales extends React.Component
{
    state = {
        comparableSales: []
    };

    componentDidMount()
    {
        axios.get(`/appraisal/${this.props.match.params._id}/files?type=comparable`).then((response) =>
        {
            this.setState({comparableSales: response.data.files})
        });
    }


    render() {
        return (
            <div>
                <Row>
                    <Col xs={12}>
                        <h3>View Comparable Sales</h3>
                    </Col>
                    <Col xs={12}>
                        <ComparableSaleList comparableSales={this.state.comparableSales} history={this.props.history} appraisalId={this.props.match.params._id}/>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default ViewComparableSales;

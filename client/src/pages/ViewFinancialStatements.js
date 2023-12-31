import React from 'react';
import {Row, Col, Card, CardBody} from 'reactstrap';
import axios from 'axios';
import FinancialStatementList from "./components/FinancialStatementList"
import FileModel from "../models/FileModel";

class ViewFinancialStatements extends React.Component {
    state = {
        financial_statements: []
    };

    componentDidMount()
    {
        axios.get(`/appraisal/${this.props.match.params.id}/files?type=financials`).then((response) => {
            this.setState({financial_statements: response.data.files.map((file) => FileModel.create(file))})
        });
    }


    render() {
        return (
            <Row>
                <Col xs={12}>
                    <Card className="card-default">
                        <CardBody>
                            <div>
                                <Row>
                                    <Col xs={12}>
                                        <h3>View Financial Statements</h3>
                                    </Col>
                                    <Col xs={12}>
                                        <FinancialStatementList
                                            financialStatements={this.state.financial_statements}
                                            history={this.props.history} appraisalId={this.props.match.params.id}/>
                                    </Col>
                                </Row>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        );
    }
}

export default ViewFinancialStatements;

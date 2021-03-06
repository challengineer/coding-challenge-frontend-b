import React, { Component } from 'react';
import { Layout, Card, Row, Col, Button, Icon } from 'antd';
import moment from 'moment';
import axios from 'axios';

import { addLocaleData, IntlProvider, FormattedMessage } from 'react-intl';
import en from 'react-intl/locale-data/en';
import fr from 'react-intl/locale-data/fr';

import busbudLogo from './busbud-logo-for-white-background.png';
import osheagaLogo from './osheaga_logo.png';
import './App.css';
import messages from './messages';

addLocaleData([...en, ...fr]);

let locale =
  (navigator.languages && navigator.languages[0]) ||
  navigator.language ||
  navigator.userLanguage ||
  'en-CA';

const { Header, Content, Footer } = Layout;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      locale: locale,
      locations: [],
      departures: [],
      operators: [],
      loading: true,
      complete: false,
      // query params
      origin: 'dr5reg',
      destination: 'f25dvk',
      date: '2018-08-02'
    };
  }

  componentWillMount() {
    this.initializeSearch()
      .then(res => {
        this.setState(
          {
            locations: res.locations,
            departures: res.departures,
            operators: res.operators,
            complete: res.complete
          },
          () => {
            if (!this.state.complete) {
              setTimeout(() => {
                this.pollSearch();
              }, 750);
            }
          }
        );
      })
      .catch(err => console.log(err));
  }

  initializeSearch = async () => {
    const response = await axios.get('/api/departures', {
      params: {
        origin: this.state.origin,
        destination: this.state.destination,
        date: this.state.date
      }
    });
    const body = await response.data;

    if (response.status !== 200) throw Error(body.message);

    return body;
  };

  pollSearch = async () => {
    axios
      .get('/api/departures/poll', {
        params: {
          origin: this.state.origin,
          destination: this.state.destination,
          date: this.state.date
        }
      })
      .then(res => {
        this.setState(
          {
            locations: [...this.state.locations, ...res.data.locations],
            departures: [...this.state.departures, ...res.data.departures],
            operators: [...this.state.operators, ...res.data.operators],
            complete: res.data.complete
          },
          () => {
            if (!this.state.complete) {
              setTimeout(() => {
                this.pollSearch();
              }, 2000);
            }
          }
        );
      });
  };

  changeLocale = e => {
    this.setState({ locale: e.target.id });
  };

  render() {
    return (
      <IntlProvider
        locale={this.state.locale}
        key={this.state.locale}
        defaultLocale="en-CA"
        messages={messages[this.state.locale]}
      >
        <div className="App">
          <Layout>
            <Header>
              <Row type="flex" align="bottom" justify="start">
                <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                  <img
                    src={busbudLogo}
                    alt="Busbud logo"
                    style={{
                      width: '110%'
                    }}
                  />
                </Col>
              </Row>
            </Header>
            <Content>
              <Row type="flex">
                <Col
                  span={24}
                  style={{
                    backgroundColor: '#e7717f'
                  }}
                >
                  <Row type="flex" align="middle" justify="space-between">
                    <Col xs={24} sm={12} md={8} lg={4} xl={4}>
                      <img
                        src={osheagaLogo}
                        alt="Osheaga festival logo"
                        style={{ width: '70%', margin: 25 }}
                      />
                    </Col>

                    <Col xs={24} sm={4} md={1} lg={1} xl={1}>
                      {this.state.complete ? (
                        ''
                      ) : (
                        <Icon
                          type="loading"
                          style={{ fontSize: 46, color: '#127CCB' }}
                        />
                      )}
                    </Col>

                    <Col xs={24} sm={4} md={4} lg={4} xl={4}>
                      <h2 style={{ color: 'white' }}>
                        <a id="en-CA" onClick={this.changeLocale}>
                          en
                        </a>{' '}
                        |{' '}
                        <a id="fr-CA" onClick={this.changeLocale}>
                          fr
                        </a>
                      </h2>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row type="flex" justify="center">
                <Col xs={24} sm={22} md={20} lg={18} xl={16}>
                  {this.state.departures.map(departure => {
                    let destination = this.state.locations.find(
                      item => item.id === departure.destination_location_id
                    );
                    let origin = this.state.locations.find(
                      item => item.id === departure.origin_location_id
                    );
                    let operator = this.state.operators.find(
                      item => item.id === departure.operator_id
                    );
                    return (
                      <Card
                        key={departure.id}
                        title={operator.name}
                        extra={
                          <Button
                            type="primary"
                            href={departure.links.deeplink}
                          >
                            <FormattedMessage id="bookNow" />
                          </Button>
                        }
                        style={{ margin: 20 }}
                      >
                        <Row type="flex" align="middle" justify="space-between">
                          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                            <p>
                              <FormattedMessage id="departureFrom" />{' '}
                              {origin.name}:{' '}
                              {moment(departure.departure_time).format('LT')}
                            </p>
                            <p>
                              <FormattedMessage id="arriveAt" />{' '}
                              {destination.name}:{' '}
                              {moment(departure.arrival_time).format('LT')}
                            </p>
                          </Col>
                          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                            <p>
                              <FormattedMessage id="journeyTime" />:{' '}
                              {Math.floor(departure.duration / 60)}h{' '}
                              {departure.duration % 60}m
                            </p>
                            <p>
                              <FormattedMessage id="price" />:{' '}
                              {(departure.prices.total / 100).toLocaleString(
                                'en-US',
                                {
                                  style: 'currency',
                                  currency: 'USD'
                                }
                              )}{' '}
                              {departure.prices.currency}
                            </p>
                          </Col>
                        </Row>
                      </Card>
                    );
                  })}
                </Col>
              </Row>
            </Content>
            <Footer className="FooterText">Made in Montreal</Footer>
          </Layout>
        </div>
      </IntlProvider>
    );
  }
}

export default App;

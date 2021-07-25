import './App.css';
import { BrowserRouter, Route, Switch, Link } from 'react-router-dom';
import asgard_banner from './asgard_banner.png';
import React from 'react';

const URL_PREFIX = 'https://tillfinancial.github.io/dummy-data/';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      date: new Date(),
      user_id: "",
      first_name: "",
      last_name: "",
      family_name: "",
      family_id: "",
      role: "",
      email: "",
      phone: "",
      account_name: "",
      account_id: "",
      available_balance: 0,
      pending_balance: 0,
      users: new Map(),
      transfers: new Map()
    };
  }

  // Optimize lifecycle & render speed...
  async componentDidMount() {
    await this.getObjectFromURL("auth.json")
      .then(data => {
          this.setState({user_id: data.user_id});
        }
      );
    
    await this.getObjectFromURL("users.json")
    .then(data => {
        for (let i = 0; i < data.data.length; i++) {
          if (data.data[i].id === this.state.user_id) {
            this.setState({first_name: data.data[i].attributes.first_name});
            this.setState({last_name: data.data[i].attributes.last_name});
            this.setState({email: data.data[i].attributes.email});
            this.setState({phone: data.data[i].attributes.phone});
          }
          this.state.users.set(data.data[i].id, data.data[i].attributes);
          this.setState({users: this.state.users}); // Set state so we re-render
        }
      }
    );

    await this.getObjectFromURL("family_users.json")
    .then(data => {
        for (let i = 0; i < data.data.length; i++) {
          if (data.data[i].attributes.user_id === this.state.user_id) {
            this.setState({family_id: data.data[i].attributes.family_id});
            this.setState({role: data.data[i].attributes.role});
          }
          if (data.data[i].attributes) {
            let user = this.state.users.get(data.data[i].attributes.user_id);
            user.role = data.data[i].attributes.role;
            user.family_id = data.data[i].attributes.family_id;
            user.family_user_id = data.data[i].id;
            this.state.users.set(data.data[i].attributes.user_id, user);
            this.setState({users: this.state.users}); // Set state so we re-render
          }
        }
      }
    );

    await this.getObjectFromURL("families.json")
    .then(data => {
      for (let i = 0; i < data.data.length; i++) {
        if (data.data[i].id === this.state.family_id) {
          this.setState({family_name: data.data[i].attributes.name});
        }
      }
      }
    );

    await this.getObjectFromURL("linked_accounts.json")
    .then(data => {
      for (let i = 0; i < data.data.length; i++) {
        if (data.data[i].attributes.user_id === this.state.user_id) {
          this.setState({available_balance: data.data[i].attributes.available_balance});
          this.setState({pending_balance: data.data[i].attributes.pending_balance});
          this.setState({account_name: data.data[i].attributes.name});
          this.setState({account_id: data.data[i].id});
        }
      }
      }
    );

    await this.getObjectFromURL("linked_account_transfers.json")
    .then(data => {
      for (let i = 0; i < data.data.length; i++) {
        data.data = data.data.sort(function(a, b){ // Sort by Date in descending order
          return new Date(b.attributes.created_at).getTime()-new Date(a.attributes.created_at).getTime()
        });
        if (data.data[i].attributes.linked_account_id === this.state.account_id) {
          let transfer = data.data[i].attributes;
          transfer.id = data.data[i].id;
          transfer.humanReadableDate = new Date(data.data[i].attributes.created_at).toString();
          this.state.transfers.set(transfer.created_at, transfer);
          this.setState({transfers: this.state.transfers});
        }
      }
      }
    );

    await this.getObjectFromURL("spend_balances.json")
    .then(data => {
      for (let i = 0; i < data.data.length; i++) {
        this.state.users.forEach((values,keys)=>{
          if (values.family_user_id===data.data[i].attributes.family_user_id) {
            let user = values;
            user.spend_balance = data.data[i].attributes.available_balance;
            this.state.users.set(keys, user);
            this.setState({users: this.state.users}); // Set state so we re-render
          }
        })
      }
      }
    );

    await this.getObjectFromURL("save_balances.json")
    .then(data => {
      for (let i = 0; i < data.data.length; i++) {
        this.state.users.forEach((values,keys)=>{
          if (values.family_user_id===data.data[i].attributes.family_user_id) {
            let user = values;
            user.save_balance = data.data[i].attributes.available_balance;
            this.state.users.set(keys, user);
            this.setState({users: this.state.users}); // Set state so we re-render
          }
        })
      }
      }
    );
    
  }

  // componentWillUnmount() {
  // }
  
  getObjectFromURL(url) {
    return fetch(URL_PREFIX + url)
        .then(async response => {
            const data = await response.json();
  
            if (!response.ok) {
                // Get error message from body or default to response statusText
                const error = (data && data.message) || response.statusText;
                return Promise.reject(error);
            }
            return data;
        })
        .catch(error => {
            console.error('There was an error!', error);
        });
  }

  // TODO: Could split home page & account page into separate components, but decided to be lazy
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={asgard_banner} className="asgard-banner" alt="logo" />
          <img src="http://www.freepik.com/blog/wp-content/uploads/2016/06/11_MONEDA.gif" className="App-logo" alt="logo" />
          <p className="asgard-title">
            Asguard Family Banking
          </p>
          <p className="asgard-sub-title">
            Hello, {this.state.first_name}. - Last refreshed at {this.state.date.toLocaleTimeString()}
          </p>
        </header>
        <BrowserRouter>
          <Switch>
            <Route path="/" exact>
              <div className="app-body">
                <p className="list-item">
                  Family: {this.state.family_name}
                </p>
                <p className="list-item">
                  Pending Balance: ${this.state.pending_balance}
                </p>
                <p className="list-item">
                  Available Balance: ${this.state.available_balance}  <Link to="/account" >(see more)</Link>
                </p>
                  <ul className="list-group">
                  {[...this.state.users.values()].map(value => {
                    if (value.role==="child") {
                      return ( <li className="list-item child-list-item list-group-item list-group-item-primary">{value.first_name} <br></br> Spend: ${value.spend_balance} Save: ${value.save_balance}</li> )
                    }
                  })}
                  </ul>
              </div>
            </Route>
            <Route path="/account">
              <div className="app-body">
                <p className="list-item">
                Account: {this.state.account_name} <Link to="/" >(home)</Link>
                </p>
                <p className="list-item">
                  Available Balance: ${this.state.available_balance}
                </p>
                <p className="list-item">
                  Pending Balance: ${this.state.pending_balance}
                </p>
                <ul className="list-group">
                  {[...this.state.transfers.values()].map(value => {
                    return ( <li className="list-item transfer-list-item list-group-item list-group-item-primary">${value.amount} Status: {value.status} <br></br>Date: {value.humanReadableDate}</li> )
                  })}
                  </ul>
              </div>
            </Route>
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;

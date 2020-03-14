import React from 'react';
import { LineChart, Line } from 'recharts';
import logo from './logo.svg';
import './App.css';


const data = [
  {name: 'Page A', uv: 400, pv: 145, amt: 2400}, 
  {name: 'Page A', uv: 500, pv: 333, amt: 2400}, 
  {name: 'Page A', uv: 600, pv: 125, amt: 2400}, 
  {name: 'Page A', uv: 400, pv: 984, amt: 2400}, 
  {name: 'Page A', uv: 240, pv: 415, amt: 2400}, 
]


export default class App extends React.Component {
  componentDidMount() {
    //if (Platform.OS == 'ios') {
      console.log("Component mounted")
    //}
  }


  render() {
    return (
      <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <LineChart width={400} height={400} data={data}>
          <Line type="monotone" dataKey="uv" stroke="#8884d8" />
          <Line type="monotone" dataKey="pv" stroke="#a7d3d8" />
        </LineChart>
      </header>
    </div>
    )
  }
}


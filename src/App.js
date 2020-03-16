import React from 'react';
import { XAxis, Tooltip, BarChart, Bar,Legend} from 'recharts';
import moment from 'moment';
import './App.css';
import * as firebase from 'firebase';



var firebaseConfig = {
  apiKey: "AIzaSyA9_MSElqRRpXnqAKyVC5dfeVGi2LDskL0",
  authDomain: "safiwebapp.firebaseapp.com",
  databaseURL: "https://safiwebapp.firebaseio.com",
  projectId: "safiwebapp",
  storageBucket: "safiwebapp.appspot.com",
  messagingSenderId: "137632814116",
  appId: "1:137632814116:web:012ef624195614f132f4b1",
  measurementId: "G-31FD0P8RG0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

let db = firebase.firestore();



export default class App extends React.Component {

  collection = "machine_data_crono"
  constructor(props){
    super(props)

    this.state = {
      loading:false,
      minThreshold:0.6,
      operatingLoad:100,
      from: new Date("2018-08-19T00:00"),
      to: new Date("2018-08-20T00:00"),
      rawData:[],
      data:[],
      dateChanged:false,
      onRatio:false,
      workingRatio:false,
      mostLoadPeriod:""
    }
  }
  componentDidMount() {

      console.log("Component mounted")
      this._getData()
  }


  _getData = async()=>{

    this.setState({loading:true})
    
    console.log([this.state.from.getTime(),this.state.to.getTime()])
    let querySnapshot = await db.collection(this.collection).where('timestamp','>=',firebase.firestore.Timestamp.fromDate(this.state.from)).where('timestamp','<=',firebase.firestore.Timestamp.fromDate(this.state.to)).orderBy("timestamp","asc").get()

    let data =[]

    querySnapshot.forEach((doc)=>data.push(doc.data()) )

    console.log("RAWDATA length:",data.length)
    this.setState({rawData:data},()=>this._processData())
  }

  _processData = ()=>{
    this.setState({loading:true})

    let data = [
      {label:"OFF",duration:0},
      {label:"UNLOADED",duration:0},
      {label:"IDLE",duration:0},
      {label:"LOADED",duration:0},
    ]

    let loadTime = {
      morning:0,
      afternoon:0,
      night:0
    }


    let dataByDate = []


    this.state.rawData.forEach(d=>{
      if(d.value<0){
        d.state=1
        d.stateName='off'
      }else if(d.value<this.state.minThreshold){
        d.state=2
        d.stateName='unloaded'
      }else if(d.value<this.state.operatingLoad*.2){
        d.state=3
        d.stateName='idle'
      }else{
        d.state=4
        d.stateName='loaded'
      }


      //Sumup loadTime KPI
      if(d.state==4){
        let h = d.date.toDate().getHours()
        if(h>6 && h<12){
          loadTime.morning+=30
        }else if(h>12 && h<20){
          loadTime.afternoon+=30
        }else{
          loadTime.night+=30
        }
      }
      //Sum up time-duration by state
      data[d.state-1].duration+=30


      let date=moment(d.date.toDate()).format("MM/DD HH")+"hs"

      //Aggregate data utilization by date-hour
      if(dataByDate[date]){
        dataByDate[date][d.stateName]+=30
      }else{
        dataByDate[date]={
          date:date,
          off:d.state==1?30:0,
          unloaded:d.state==2?30:0,
          idle:d.state==3?30:0,
          loaded:d.state==4?30:0
        }
      }

    })
    //Convert dataByDate to array
    dataByDate=Object.values(dataByDate)


    const totalDuration = data.reduce((p,c)=>p+c.duration,0)
    const machineOnDuration = data.reduce((p,c)=>p+(c.label!="OFF"?c.duration:0),0)
    const machineWorkingDuration = data.reduce((p,c)=>p+(c.label=="IDLE" || c.label=="LOADED"?c.duration:0),0)


    let mostLoadPeriod = "NIGHT"
    if(loadTime.morning>loadTime.afternoon && loadTime.morning>loadTime.night){
      mostLoadPeriod = "MORNING"
    }else if(loadTime.afternoon>loadTime.morning && loadTime.afternoon>loadTime.night){
      mostLoadPeriod = "AFTERNOON"
    }
    
    this.setState({
        loading:false,
        data:data,
        dataByDate:dataByDate,
        onRatio:Math.round(100*10*machineOnDuration/totalDuration) / 10,
        workingRatio:Math.round(100*10*machineWorkingDuration/machineOnDuration) / 10,
        mostLoadPeriod:mostLoadPeriod
    })
    
  }

  _renderDuration = (duration)=>{

    let sec_num = parseInt(duration, 10)
    let hours   = Math.floor(sec_num / 3600)
    let minutes = Math.floor(sec_num / 60) % 60
    let seconds = sec_num % 60

    return [hours,minutes,seconds].map(v => v < 10 ? "0" + v : v).join(":")
  }

  handleSubmit = (event)=>{
    event.preventDefault();

    this._getData()
    
    
  }

  _changeFrom = (val)=>{
    this.setState({from:new Date(val),dateChanged:true})
  }

  _changeTo = (val)=>{
    this.setState({to:new Date(val),dateChanged:true})
  }

  render() {
    return (
      <div className="App">
      <header className="App-header">
        <h1>
          SAFI Machines MicroDashboard
        </h1>
      </header>
      <content className="App-content">
      <div className="controls-pane">
        <form onSubmit={this.handleSubmit}>
        <label>
          From:
          <input type="date" onChange={(e)=>this._changeFrom(e.target.value)} min="2018-08-19" max="2018-08-25" value={this.state.from.toISOString().split("T").shift()} />
        </label>
        <label>
          To:
          <input type="date" onChange={(e)=>this._changeTo(e.target.value)} min="2018-08-19" max="2018-08-25" value={this.state.to.toISOString().split("T").shift()} />
        </label>
        <label>
          Minimum Amp Threshold:
          <input type="text" onChange={(e)=>this.setState({minThreshold:e.target.value})} value={this.state.minThreshold} />
        </label>
        <label>
          Typical Amp Operating Load:
          <input type="text" onChange={(e)=>this.setState({operatingLoad:e.target.value})}  value={this.state.operatingLoad} />
        </label>
        <button type="submit" value="ReFetch" disabled={!this.state.loading?"":"disabled"} style={{width:150,padding:10,fontSize:20}}>
          Fetch Data
        </button>
      </form>
      </div>
      <div className="App-indcators">
        {this.state.loading &&
        <p>
          Fetching data...
        </p>
        }
        {!this.state.loading &&
          <table className="states-table">
            <thead>
              <tr style={{height:80}}><th colSpan="2" style={{textAlign:"center"}}>Utilization Distribution</th></tr>
              <tr><th>State</th><th style={{textAlign:"right"}}>Duration</th></tr>
            </thead>
            <tbody>
              {this.state.data.map((v,i)=>(
                <tr key={i+"tr_index"}>
                  <td>{v.label}</td>
                  <td style={{textAlign:"right"}}>{this._renderDuration(v.duration)}</td>
                </tr>
              ))}

            </tbody>
          </table>
        }
        {!this.state.loading &&
        <div className="kpi-list">
          <div className="kpi">
              <h3>On Ratio</h3>
              <p>{this.state.onRatio}%</p>
            </div>
          <div className="kpi kpi-large" title="During *what* period this machine is on loaded state the most">
              <h3>Most Load During</h3>
              <p style={{color:"orange"}}>{this.state.mostLoadPeriod}</p>
          </div>
          <div className="kpi">
              <h3>Working</h3>
              <p>{this.state.workingRatio}%</p>
          </div>
          <div className="kpi kpi-large" title="Considered over-load when the machine is working at least 60% of the on-time">
              <h3>This Machine is</h3>
              <p style={{color:this.state.workingRatio>60?"red":"yellow"}}>{this.state.workingRatio>60?"OVERLOADED":"UNDERLOADED"}</p>
          </div>
        </div>
        }
      </div>
        
      </content>
      <footer>
      {this.state.data.length>0 &&

        <BarChart
          width={window.innerWidth}
          height={400}
          data={this.state.dataByDate}
          margin={{
            top: 20, right: 0, left: 0
          }}
        >
          <XAxis dataKey="date" />
          <Tooltip labelStyle={{color:"black"}} />
          <Legend />
          <Bar dataKey="loaded" stackId="a" fill="#0088FE" />
          <Bar dataKey="idle" stackId="a" fill="#00C49F" />
          <Bar dataKey="unloaded" stackId="a" fill="#FFBB28" />
          <Bar dataKey="off" stackId="a" fill="#FF8042" />
        </BarChart>
        }
      </footer>
    </div>
    )
  }
}


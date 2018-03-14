import React, { Component } from 'react';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.onStart = this.onStart.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.blink = this.blink.bind(this);
    this.createChart = this.createChart.bind(this);
    this.getLastReactionTimeText = this.getLastReactionTimeText.bind(this);
    this.timer = null; // random timer to change color
    this.chart = null;
    this.chartData = {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          data: []
        }]
      },
      options: {
        legend: {
          display: false
        }
      }
    };
    this.state = {
      isStarted: false,
      signalStart: null, // time when color changed
      startButtonTitle: 'start',
      signalColor: {
        backgroundColor: 'green'
      },
      lastReaction: null,
      reactions: [] // user reaction times
    };
  }

  keyDown(e) {
    // check e.code to be equal to Enter
    if (!this.state.isStarted) {
      return;
    }
    if (e.code !== 'Enter') {
      return;
    }
    if (this.state.signalStart !== null) {
      let reaction = performance.now() - this.state.signalStart;
      this.setState({
        ...this.state,
        signalStart: null,
        signalColor: {
          backgroundColor: 'green'
        },
        lastReaction: reaction,
        reactions: this.state.reactions.concat([reaction])
      });
    }
    this.updateChart();
    this.blink();
  }

  componentDidMount() {
    document.addEventListener('keydown', this.keyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keyDown);
  }

  getLastReactionTimeText() {
    if (this.state.lastReaction === null) {
      return '';
    }
    else {
      let time = Math.round(this.state.lastReaction);
      return `${time} ms`;
    }
  }

  blink() {
    // timeout range is 400-4000 ms
    let timeout = Math.random() * 3800 + 400;
    if (!this.state.isStarted) {
      return;
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (!this.state.isStarted) {
        return;
      }
      this.setState({
        ...this.state,
        signalStart: performance.now(),
        signalColor: {
          backgroundColor: 'red'
        }
      });
    }, timeout);
  }

  createChart(canvas) {
    this.chart = new window.Chart(canvas, this.chartData);
  }

  updateChart() {
    if (this.chart === null) {
      return;
    }
    let max = _.max(this.state.reactions);
    max = Math.ceil(max/100) * 100;
    let val = 0;
    let labels = [];
    let reactions = {};
    let step = 50;
    let counter = (sum, r) => {
      if ((val <= r) && (r < (val + step))) {
        sum += 1;
      }
      return sum;
    };
    let getCount = (val) => {
      return _.reduce(this.state.reactions, counter, 0);
    };
    while (val <= max) {
      labels.push(`${val}-${val+step} ms`);
      reactions[val] = getCount(val);
      val += step;
    }
    let data = [];
    val = 0;
    while (val <= max) {
      if (reactions.hasOwnProperty(val)) {
        data.push(reactions[val]);
      }
      else {
        data.push(0);
      }
      val += step;
    }
    this.chartData.data.labels = labels;
    this.chartData.data.datasets[0].data = data;
    this.chart.update();
  }

  onStart(e) {
    let isStarted = !this.state.isStarted;
    let title = isStarted ? 'stop' : 'start';
    let newState = {
      ...this.state,
      isStarted: isStarted,
      startButtonTitle: title,
      reactions: []
    };
    if (isStarted) {
      e.target.blur();
    }
    else {
      newState.signalColor = {
        ...newState.signalColor,
        backgroundColor: 'green'
      };
    }
    this.setState(newState);
    setTimeout(this.blink, 0);
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-xs-12 text-center">
            <header>
              <h1>Reaction time</h1>
            </header>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12 text-center">
            <button className="btn btn-success" onClick={this.onStart}>{ this.state.startButtonTitle }</button>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12 text-center">
            As you ready press "start" button, and every time block below changes color to red you need to press "Enter" on your keyboard, and you will see your reaction time.
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12 text-center">
            <a href="https://github.com/rsk700/reaction-time">sources</a>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12 text-center">
            <div className="signal-block" style={this.state.signalColor}>
              <div className="last-reaction-wrapper text-center">
                <div className="last-reaction">
                  { this.getLastReactionTimeText() }
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12 text-center">
            <div className="chart-block">
              <canvas className="chart-block" width="280" height="280" ref={this.createChart}></canvas>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

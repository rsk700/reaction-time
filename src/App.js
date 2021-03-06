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
    this.registerKeyPress = this.registerKeyPress.bind(this);
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
    let state = {
      isStarted: false,
      signalStart: null, // time when color changed
      startButtonTitle: 'start',
      signalColor: {
        backgroundColor: 'green'
      },
      lastReaction: null,
      reactions: [], // user reaction times
      reactionErrors: 0
    };
    let url = new URL(window.location);
    if (url.searchParams.get('reactions') !== null) {
      let reactions = url.searchParams.get('reactions');
      reactions = JSON.parse(reactions);
      state.reactions = reactions.reactions;
      state.reactionErrors = reactions.reactionErrors;
    }
    this.state = state;
  }

  getReactionsUrl() {
    let url = new URL(window.location);
    let data = {
      reactions: this.state.reactions,
      reactionErrors: this.state.reactionErrors
    };
    let dataString = JSON.stringify(data);
    dataString = encodeURIComponent(dataString);
    return `${url.origin}${url.pathname}?reactions=${dataString}`
  };

  errorsPer1000() {
    if (this.state.reactions.length === 0) {
      return 0;
    }
    let errors = this.state.reactionErrors / this.state.reactions.length * 1000;
    errors = _.round(errors, 1);
    return errors;
  }

  registerKeyPress() {
    if (!this.state.isStarted) {
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
    else {
      this.setState({
        ...this.state,
        reactionErrors: this.state.reactionErrors + 1
      });
    }
    this.blink();
  }

  keyDown(e) {
    this.registerKeyPress();
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
    this.setState({...this.state});
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
      startButtonTitle: title
    };
    if (isStarted) {
      e.target.blur();
      newState.reactions = [];
      newState.reactionErrors = 0;
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

  reactionsUrl() {
    if (this.state.reactions.length === 0) {
      return <div className="no-reactions-url">url with results</div>;
    }
    return (<b><a href={this.getReactionsUrl()}>url with results</a></b>);
  }

  render() {
    this.updateChart();
    let url = new URL(window.location);
    let appUrl = `${url.origin}${url.pathname}`;
    return (
      <div className="container">
        <div className="row">
          <div className="col-12 text-center">
            <header>
              <h1><a href={appUrl}>Reaction time</a></h1>
            </header>
          </div>
        </div>
        <div className="row">
          <div className="col-12 text-center">
            <button className="btn btn-success" onClick={this.onStart}>{ this.state.startButtonTitle }</button>
          </div>
        </div>
        <div className="row">
          <div className="col-12 text-center">
            As you ready press "start" button, and every time block below
            changes color to red you need to press any button on keyboard
            (for exapmle "Enter") or click with mouse inside square, and
            you will see your reaction time.
          </div>
        </div>
        <div className="row">
          <div className="col-12 text-center">
            <a href="https://github.com/rsk700/reaction-time">sources</a>
          </div>
        </div>
        <div className="row">
          <div className="col-12 text-center">
            { this.reactionsUrl() }
          </div>
        </div>
        <div className="row">
          <div className="col-12 text-center">
            <div className="signal-block" style={this.state.signalColor} onClick={this.registerKeyPress}>
              <div className="last-reaction-wrapper text-center">
                <div className="last-reaction">
                  { this.getLastReactionTimeText() }
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12 text-center">
            Reaction errors: { this.state.reactionErrors } ({ this.errorsPer1000() } errors per 1000 key presses)
          </div>
        </div>
        <div className="row">
          <div className="col-12 text-center">
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

import React from 'react';
import Highcharts from "highcharts";
import ReactHighcharts from "react-highcharts";

import HighchartsMore from "highcharts-more";
HighchartsMore(ReactHighcharts.Highcharts);
import HighchartsExporting from "highcharts-exporting";
HighchartsExporting(ReactHighcharts.Highcharts);

class ChartComponent extends React.Component {
/**
  *Chart component with count of an author attribute vs. author
  @contructor
*/
  constructor(props) {
    super(props);
    this.state = {
      config: {
        chart: {
            type:'bar'
        },
        title: {
            text: 'Author Profile Comparison'
        },
        subtitle: {
            text: 'Source: semanticscholar.com'
        },
        yAxis: {
            title: {
                text: 'Number'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true
                }
            }
        },
        xAxis: {
            title: {
                title:'Author Id'
            },
            categories: []
        },
        series: [],
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            }]
        }
    }
    }
  }

  componentDidMount(){
    this.handleChart(this.props.data)
  }

  componentWillReceiveProps(props) {
    let state = this.state;
    state.config.series = []
    this.setState(state)
    this.handleChart(props.data)
  }


  handleChart(authors){
    let state = this.state;
    let attributes = ['citationVelocity','InfluentialCitations','noOfpapers','upwardTrending'];
    authors.forEach((author,i) => {
      state.config.xAxis.categories.push(author.id);
    })
    for(var att=0;att<attributes.length;att++){
      state.config.series.push({name:attributes[att],data:[]});
      authors.forEach((author,i)=>{
          if(att==0)
              state.config.series[att].data.push(author.data.citationVelocity);
          else if(att==1)
              state.config.series[att].data.push(author.data.influentialCitationCount);
          else if(att==2)
              state.config.series[att].data.push(author.data.papers.length);
          else
              state.config.series[att].data.push(author.data.upTrendCount);
    })
    }
    this.setState(state);
  }


  render() { 
    return (
      <div>
        <ReactHighcharts config = {this.state.config}></ReactHighcharts>
      </div>
    )
  }
} 
export default ChartComponent;

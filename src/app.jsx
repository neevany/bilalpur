import React from 'react';
import axios from 'axios'
import ChartComponent from './chart'

class AppComponent extends React.Component {
/**
  *Declare AppComponent class with default settings
  *max. comparison of 10 authors (default author ids-"1741101" and "1741102").
  @contructor
*/
  constructor(props) {
    super(props);
    this.state = {
      maxAuthors: 10,
      noOfAuthors: 2,
      authors: [{id:'1741101'},{id:'1741102'}],
     }
  }

/**
  *member function triggered on "no.of authors" field change
  @returns {state} State updated with no. of authors
*/
  
  handleAuthorsSelect(event) {
    this.setState({noOfAuthors: parseInt(event.target.value)});
  }

/**
  *Set author index upon entering the id.
  @param {int} index - author index.
  @returns {state} State updated with authorId.
*/

  handleAuthorName(event,index) {
    let state = this.state;
    state.authors[index] = {};
    state.authors[index].id = event.target.value;
    this.setState(state);
  }

/**
 *Get author details and top 3 papers upon submit
 * @returns   state.authors[]
 * @returns   state.authors[].id
 * @returns   state.authors[].data.influential citations
 * @returns   state.authors[].data.papersData.name--names in sorted order of citations
 * @returns   state.authors[].data.papersData.citations.
 * @returns   state.authors[].data.papersData.citationYears--array of citation year for each paper.
 * @returns   state.authors[].data.papersData.trend--if paper has increasing citations since the past 3 years(exclude current).
*/
  handleSubmit(event) {
    event.preventDefault();
    var noOfYears = 3;
    var currYear = (new Date()).getFullYear();
    let state = this.state;
    state.authors.forEach((a,i) => {
      state.authors[i].loading = true;
      this.setState(state)
      this.getAuthorInfo(a.id).then((response) => {
        state.authors[i].data = response.data;
        state.authors[i].loading = false;
        state.authors[i].citations = 0;
        this.setState(state);

        state.authors[i].data.papersData = [];
        state.authors[i].data.papers.forEach((p,j) =>{
          this.getPaperInfo(p.paperId).then((response) => {
            
            let citationYears = [];
            response.data.citations.forEach((cite, k)=>{
              if((cite.year > currYear - noOfYears - 1) && cite.year != currYear){
                citationYears.push(cite.year);
              }
            })
            citationYears.sort((a,b) => {return a < b ? 1 : -1});
            
            let trend = this.getCitationTrend(citationYears, noOfYears, currYear);
            state.authors[i].data.upTrendCount = 0;
            if(trend == 'Upward Trending')
              state.authors[i].data.upTrendCount++;

            state.authors[i].data.papersData.push({
              name: response.data.title,
              citations: response.data.citations.length,
              citationYears: citationYears,
              trend: trend,
            });

            if(state.authors[i].data.papersData.length === state.authors[i].data.papers.length) {
              state.authors[i].citations += state.authors[i].data.papersData.map(p => p.citations).reduce((i,a) => a = a+i ,0);
              state.authors[i].data.papersData.sort((a,b) => {return a.citations < b.citations ? 1 : -1});
              state.authors[i].data.upTrendCount = Number.parseFloat((state.authors[i].data.upTrendCount*100)/state.authors[i].data.papers.length).toFixed(2)
              // console.log(state.authors[i].data.upTrendCount/state.authors[i].data.papers.length)
            }
            this.setState(state)
          })
        })
      })
    })
  }

/**
Return the year wise relative citation trend
@params {int} noOfYears-no. of years of citation trend to consider(set to 3).
@params {int} currYear-current year.
*/
  getCitationTrend(citationYears, noOfYears = 3, currYear){
    var ref = citationYears[0], ref_id = 0;
    var count = new Array(noOfYears).fill(0);
    for (var i = 1; citationYears[i] > currYear - noOfYears - 1; i++) { //exclude the current year in determining the trend
      if (citationYears[i] == ref)
        count[ref_id]++;
      else {
        ref = citationYears[i];
        ref_id++;
      }
    }
    var trendFlag = 1;
    for (var i = 1; i < noOfYears; i++) {
      if (count[i - 1] < count[i])
        trendFlag = 0;
    }
    return trendFlag? 'Upward Trending': 'Downward Trending'
  }

/**
Call Semantic Scholar API with authorId
  @param {int} authorId - author index
*/

  getAuthorInfo(authorId) {
    return axios.get(`https://api.semanticscholar.org/v1/author/${authorId}`);
  }

/**
Call Semantic Scholar API with paperId
  @param {int} paperId - paper index
*/

  getPaperInfo(paperId) {
    return axios.get(`http://api.semanticscholar.org/v1/paper/${paperId}`);
  }

/**
Render the page with authorId inputs and author details cards
*/

  render() { 
    return (
      <grid>
      <div col="1/4">
      <div style={{padding:'10px'}}>
        <form onSubmit={(e) => this.handleSubmit(e) && ChartComponent.handleChart(e, this.state)}>
          <label>No of Authors:
            <select value={this.state.noOfAuthors} onChange={(e) => this.handleAuthorsSelect(e)}>
            {[...Array(this.state.maxAuthors)].map((v,i) => {
              return <option key={i+1} value={i+1}>{i+1}</option>
            })}
            </select>
          </label>
          {[...Array(this.state.noOfAuthors)].map((v,i) => {
            return (
            <label key={i}>Author ID {i+1}:
              <input type="text" value={this.state.authors[i] && this.state.authors[i].id} onChange={(e) => this.handleAuthorName(e,i)} />
            </label>
            )
          })}
          <input type="submit" value="Submit" />
        </form>
        </div>
      </div>
      <div col="3/4">
      <div style={{display:'flex',flexWrap: 'wrap'}}>
        {this.state.authors.map((author,i) => {
          {return author.loading ?  <div key={i} className="spinner"></div> : 
            (author.data ? 
            <div key={i} style={{flex:'1 0 30%',margin:'5px'}}>
              <card>
                <h5>{author.data.name} <a href={author.data.url} target="_blank" style={{opacity: '0.5',float: 'right'}}>#{author.data.authorId}</a></h5>
                <hr/>
                  <p>Citation Velocity: {author.data.citationVelocity}</p>
                <p>Influential Citation Count: {author.data.influentialCitationCount}</p>
                <p>No of papers: {author.data.papers.length}</p>
                <p>List of paper with citation trend:</p>
                <ul>
                {author.data.papersData ? [...Array(author.data.papersData.length)].map((v,i) => {
                  return <li key={i}>{author.data.papersData[i].name} - {author.data.papersData[i].trend}</li>
                }) : null}
                </ul>
              </card>
            </div> : 
            null)
          }
        })}
      </div>
        <ChartComponent/>
      </div>
      </grid>
    )
  }
} 
export default AppComponent;

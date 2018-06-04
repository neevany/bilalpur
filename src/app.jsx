import React from 'react';
import axios from 'axios'
import ChartComponent from './chart'
import { Accordion, AccordionItem } from 'react-sanfona';

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
      showChart: false
     }
  }

/**
  *member function triggered on "no.of authors" field change
  @returns {state}+ State updated with no. of authors
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
    if(!state.authors[index]){
      state.authors[index] = {};
    }
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
    let state = this.state;
    state.showChart = false;
    this.setState(state)
    let authorPromises = [];
    state.authors.forEach((a,i) => {
      state.authors[i].loading = true;
      this.setState(state)
      let autorPr = this.getAuthorInfo(a.id)
      authorPromises.push(autorPr);      
      autorPr.then((response) => {
          state.authors[i].data = response.data;
          state.authors[i].loading = false;
          state.authors[i].data.upTrendCount = 0;
          this.setState(state);
          let paperPromises = [];
          state.authors[i].data.papers.forEach((p,j) =>{
            paperPromises.push(this.getPaperInfo(p.paperId))
          })
          Promise.all(paperPromises).then((responses) => {
            responses.forEach((response,j) => {
              state.authors[i].data.papers[j].data = response.data;
              state.authors[i].data.papers[j].data.trend = this.getUpTrendCount(response.data.citations); 
              state.authors[i].data.upTrendCount += state.authors[i].data.papers[j].data.trend
              state.authors[i].data.papers[j].citationCount = response.data.citations.length;
            })
            state.authors[i].citationCount = state.authors[i].data.papers.map(p => p.citationCount).reduce((i,a) => a = a+i ,0);
            state.authors[i].data.papers.sort((a,b) => {return a.citationCount < b.citationCount ? 1 : -1});
            this.setState(state)
            Promise.all(authorPromises).then(() => {
              state.showChart = true;
              this.setState(state)
            })
        })
      })
    })
  }

/**
Takes citation papers with details and returns if each paper's trend in past NO_OF_YEARS
@param {int} NO_OF_YEARS - no. of years of citation trend to consider(defaults to 3).
@param {int} currYear - current year.
@returns {int} trendFlag indicates if a paper is upward trending(1)
*/
  getUpTrendCount(citations) {  
    let NO_OF_YEARS = 3;
    let currYear = (new Date()).getFullYear();
    let citedYears = [];
    citations.forEach((cite, k) => {
      if (currYear - NO_OF_YEARS < cite.year && cite.year < currYear)
        citedYears.push(cite.year)
    })
    
    citedYears.sort();

    var ref = citedYears[0], ref_id = 0;
    var count = new Array(NO_OF_YEARS).fill(0);
    for (var i = 1; citedYears[i] > currYear - NO_OF_YEARS; i++) { //exclude the current year in determining the trend
      if (citedYears[i] == ref)
        count[ref_id]++;
      else {
        ref = citedYears[i];
        ref_id++;
      }
    }
    var trendFlag = 1;
    for (var i = 1; i < NO_OF_YEARS; i++) {
      if (count[i - 1] < count[i])
        trendFlag = 0;
    }
    return trendFlag
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
Render the page with authorId inputs and author details cards and visualization
*/

  render() { 
    return (
      <grid>
      <div col="1/4">
      <div style={{padding:'10px'}}>
        <form onSubmit={(e) => this.handleSubmit(e)}>
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
      {this.state.showChart ? <ChartComponent data={this.state.authors}/> : null }
      <div style={{display:'flex',flexWrap: 'wrap'}}>
        {this.state.authors.map((author,i) => author.loading ? 
          <div key={i} className="spinner"></div> : 
          (author.data ? <div key={i} style={{flex:'1 0 30%',margin:'5px'}}>
            <card>
              <h5>{author.data.name} <a href={author.data.url} target="_blank" style={{opacity: '0.5',float: 'right'}}>#{author.data.authorId}</a></h5>
              <hr/>
              <p>Citation Velocity: {author.data.citationVelocity}</p>
              <p>Influential Citation Count: {author.data.influentialCitationCount}</p>
              <p>No of papers: {author.data.papers.length}</p>
              <ul>  
              <Accordion>
              <AccordionItem title={'Click to expand/collapse list of papers with citation trend'} expanded={0}>
                {[...Array(author.data.papers.length)].map((v,i) => {
                  return author.data.papers[i].data ? <li key={i}>{author.data.papers[i].data.title}-{author.data.papers[i].data.trend?<font color="#4682B4">Up</font>:<font color="red">Down</font>}</li> : null
                })}
              </AccordionItem>
              </Accordion>
              </ul>
            </card>
          </div> : null)
        )}
      </div>
      </div>
      </grid>
    )
  }
} 
export default AppComponent;

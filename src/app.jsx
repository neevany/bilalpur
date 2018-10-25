import React from 'react';
import axios from 'axios'
import ChartComponent from './chart'
import { Accordion, AccordionItem } from 'react-sanfona';

class AppComponent extends React.Component {
/**
  *Declare AppComponent class with default settings
  *max. comparison of 10 authors
  @constructor
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
  @returns {state} State updated with no. of authors
*/
  
  handleAuthorsSelect(event) {
    let state = this.state;
    state.showChart = false;
    state.noOfAuthors = parseInt(event.target.value)
    state.authors = [...Array(state.noOfAuthors)].map(a => { return {id: ''} })
    this.setState(state)
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
 *Get author details and determine the paper trend upon submit
   @returns {state} State updated with author and paper details.
*/
  handleSubmit(event) {
    event.preventDefault();
    let state = this.state;
    state.showChart = false;
    this.setState(state)
    
    let authorPromises = [];
    let paperPromises = [];
    
    state.authors.forEach((a,i) => { 
      state.authors[i].loading = true;
      this.setState(state);
      authorPromises.push(this.getAuthorInfo(a.id)) 
    })

    Promise.all(authorPromises).then((responses) => {
      responses.forEach((response,i) => {
        state.authors[i].data = response.data;
        state.authors[i].data.upTrendCount = 0;
        state.authors[i].loading = false;
        
        paperPromises[i] = []
        response.data.papers.forEach(p =>  paperPromises[i].push(this.getPaperInfo(p.paperId)))
        Promise.all(paperPromises[i]).then((responses) => {
          responses.forEach((res,j) => {
            state.authors[i].data.papers[j].data = res.data
            state.authors[i].data.papers[j].data.trend = this.getUpTrendCount(res.data.citations); 
            state.authors[i].data.upTrendCount += state.authors[i].data.papers[j].data.trend
            state.authors[i].data.papers[j].citationCount = res.data.citations.length;
          })
          state.authors[i].citationCount = state.authors[i].data.papers.map(p => p.citationCount).reduce((i,a) => a = a+i ,0);
          state.authors[i].data.papers.sort((a,b) => a.citationCount < b.citationCount ? 1 : -1);
        })
      })
      // After all the paper requests completed
      let allAuthorsPapers = paperPromises.reduce((a, b) => a.concat(b), []);
      Promise.all(allAuthorsPapers).then(() => {
        state.showChart = true;
        this.setState(state);
      })
    })
  }

/**
Takes citation papers with details and returns if each paper's trend in past NO_OF_YEARS
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
    return axios.get(`https://api.semanticscholar.org/v1/paper/${paperId}`);
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
              <Accordion>
              <AccordionItem title={'Click to expand/collapse list of papers with citation trend'} className='expand' expanded={0}>
              <ul>  
                {[...Array(author.data.papers.length)].map((v,i) => {
                  return author.data.papers[i].data ? <li key={i} id="expand_content">{author.data.papers[i].data.title}-{author.data.papers[i].data.trend?<font color="#4682B4">Up</font>:<font color="red">Down</font>}</li> : null
                })}
              </ul>
              </AccordionItem>
              </Accordion>
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

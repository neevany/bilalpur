import React from 'react';
import axios from 'axios'

class AppComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      maxAuthors: 10,
      noOfAuthors: 2,
      authors: [{id:'1741101'},{id:'1741102'}],
     }
  }
  
  handleAuthorsSelect(event) {
    this.setState({noOfAuthors: parseInt(event.target.value)});
  }

  handleAuthorName(event,index) {
    let state = this.state;
    state.authors[index] = {};
    state.authors[index].id = event.target.value;
    this.setState(state);
  }

  handleSubmit(event) {
    event.preventDefault();
    let state = this.state;
    state.authors.forEach((a,i) => {
      state.authors[i].loading = true;
      this.setState(state)
      this.getAuthorInfo(a.id).then((response) => {
        state.authors[i].data = response.data;
        state.authors[i].loading = false;
        this.setState(state);
        state.authors[i].data.papersData = [];
        state.authors[i].data.papers.splice(0,3).forEach((p,j) =>{
          this.getPaperInfo(p.paperId).then((response) => {
            state.authors[i].data.papersData.push({name: response.data.title, citations: response.data.citations.length });
            this.setState(state)
          })
          })
        })
      })
  }

  getAuthorInfo(authorId) {
    return axios.get(`https://api.semanticscholar.org/v1/author/${authorId}`);
  }

  getPaperInfo(paperId) {
    return axios.get(`http://api.semanticscholar.org/v1/paper/${paperId}`);
  }

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
                <p>Top 3 papers:
                <ul>
                {[...Array(3)].map((v,i) => {
                  return <li key={i}>{author.data.papersData && author.data.papersData[i] && author.data.papersData[i].name}</li>
                })}
                </ul>
                </p>
              </card>
            </div> : 
            null)
          }
        })}
      </div>
      </div>
      </grid>
    )
  }
}
 
export default AppComponent;


import React from 'react';
import axios from 'axios'

class AppComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      maxAuthors: 10,
      noOfAuthors: 1,
      authorNames: ['neevany']
     }
  }
  
  handleAuthorsSelect(event) {
    this.setState({noOfAuthors: parseInt(event.target.value)});
  }

  handleAuthorName(event,index) {
    let state = this.state;
    state.authorNames[index] = event.target.value;
    this.setState(state);
  }

  handleSubmit(event) {
    event.preventDefault();
    let state = this.state;
    state.loadingAuthorData = true;
    this.setState(state)
    axios.get(`https://api.github.com/users/${this.state.authorNames[0]}`).then((response) => {
      let state = this.state;
      state.authorData = response;
      state.loadingAuthorData = false;
      this.setState(state)
    })
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
            <label>Author {i+1}:
              <input type="text" value={this.state.authorNames[i]} onChange={(e) => this.handleAuthorName(e,i)} />
            </label>
            )
          })}
          <input type="submit" value="Submit" />
        </form>
        </div>
      </div>
      <div col="3/4">
      <div style={{padding:'10px',background: '#eee'}}>
        { this.state.loadingAuthorData ? <div class="spinner"></div> : <pre>{JSON.stringify(this.state.authorData,null,2)}</pre>}
      </div>
      </div>
      </grid>
    )
  }
}
 
export default AppComponent;
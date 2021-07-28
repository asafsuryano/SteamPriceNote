import logo from './logo.svg';
import './App.css';
import React from 'react';
import axios from 'axios';


class GameSearchResult extends React.Component{
  constructor(props){
    super(props);
  }
  render(){
    return(
      <div>
        {this.props.list.map((game)=><h3 key={game.name} onClick={this.props.onClick(game)}>{game.name}</h3>)}
      </div>
    )
  }
}


class Game extends React.Component{
  render(){
    return(
    <div>
      <li>
      <h1>{this.props.value.name}</h1>
      <h2>{this.props.value.price}</h2>
      </li>
    </div>
    );
  }
}

class GameList extends React.Component {
  constructor(props){
    super(props);
    this.state={games:[]}
    this.i=0;
  }

  loadList(){
    axios.get("http://localhost:4000/load")
    .then((res)=>{
      this.setState({games:res.data});
    }).catch((err)=>console.log(err));
  }

  render(){
    if (this.props.listState.loadedList===false){
      this.props.listState.loadedList=true;
      this.loadList();
    }
    return (
    <div>
      {this.state.games.map(gameItem=>(
        <Game value={gameItem} key={gameItem.appid}/>
      ))}
    </div>
    );
  }
}

class Search extends React.Component {
  constructor(props){
    super(props);
    this.state={};
  }
  searchGame(gameName){
    axios.get("http://localhost:4000/search?gameName="+gameName).then((res)=>{
      if (res.data.success==true){
        this.setState({found:true});
      }else{
        this.setState({found:false})
      }
      this.props.change();
    }).catch((err)=>console.log(err));
  }

  searchGamesNotSpecific(gamename){
    axios.get("http://localhost:4000/searchAll?gameName="+gamename).then((res)=>{
      this.setState({gameList:res.data});
    })
  }

  addGameToList(game){
    console.log(game)

  }
  renderList(){
    if (this.state.gameList){
      return (<div>
        <GameSearchResult list={this.state.gameList} onClick={(chosen)=>this.addGameToList(chosen)}/>
      </div>);
    }
  }
  render(){
    let message;
    if (this.state){
      if (this.state.found){
        if (this.state.found==true){
          message="game is found";
        }else{
          message="game is not found";
        }
      }else if (this.state.gameList){
        if (this.state.gameList.length==0){
          message="no games has been found matching the search criteria"
        }else{
          message="here is the search result"
        }
      }else{
        message="please search for a game";
      }
    }else{
      message="please search for a game";
    }
    return(
    <div>
      <form>
        <input type="text" onChange={(e)=>(this.setState({name:e.target.value}))}></input>
      </form>
      <button id="searchSpecific" onClick={()=>{this.searchGame(this.state.name);}}>search game</button>
      <button id="searchAllMatching" onClick={()=>{this.searchGamesNotSpecific(this.state.name)}}>search not specific</button>
      <p>{message}</p>
      {this.renderList()}
    </div>
    )
  }
}

class App extends React.Component {
  constructor(props){
    super(props);
    this.state={loadedList:false};
    this.change=this.change.bind(this);
  }
  change(){
    if (this.state.loadedList){
      this.setState({loadedList:false});
    }else{
      this.setState({loadedList:true});
    }
  }
  render(){
    return(
      <div className="app-header">
        <div className="search-games">
          <Search change={this.change}/>
        </div>
        <div className="games-list">
          <GameList listState={this.state}/>
        </div>
      </div>
    );
  }
}

export default App;

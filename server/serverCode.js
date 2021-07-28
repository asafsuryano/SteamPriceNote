const express = require('express');
const app = express()
const axios = require('axios');
const cors=require('cors');

function compare(gameA,gameB){
  if (gameA.name.trim().toUpperCase()>gameB.name.trim().toUpperCase()){
    return 1;
  }else if (gameA.name.trim().toUpperCase()<gameB.name.trim().toUpperCase()){
    return -1;
  }else{
    return 0;
  }
}

var gameArr=[];
var gameArrSorted=[];
var listOfGamesToWatch=[];

function searchGameByName(gameName){
    var gameFound;
    let middle=Object.keys(gameArrSorted).length/2;
    middle=parseInt(middle.toFixed(0));
    let left=0;
    let right=Object.keys(gameArrSorted).length;
    let current;
    while(middle<right){
       current=gameArrSorted[middle].name.trim().toUpperCase();
       console.log(current);
      if (gameName.toUpperCase()>current){
        left=middle;
        middle=parseInt(((right+left)/2).toFixed(0));
      }else if (gameName.toUpperCase()<current){
        right=middle;
        middle=parseInt(((left+right)/2).toFixed(0));
      }else{
        gameFound=gameArrSorted[middle];
        break;
      }

    }
    return gameFound;
}


function searchAllGamesByName(gameName){
    var gamesFound=[];
    let middle=Object.keys(gameArrSorted).length/2;
    middle=parseInt(middle.toFixed(0));
    let left=0;
    let right=Object.keys(gameArrSorted).length;
    let current;
    while(middle<right){
       current=gameArrSorted[middle].name.trim().toUpperCase();
      if (gameName.toUpperCase()>current){
        left=middle;
        middle=parseInt(((right+left)/2).toFixed(0));
      }else if (gameName.toUpperCase()<current){
        right=middle;
        middle=parseInt(((left+right)/2).toFixed(0));
      }else{
        gamesFound.push(gameArrSorted[middle]);
        break;
      }
      if (current.includes(gameName.toUpperCase())){
        gamesFound.push(current);
      }
    }
    return gamesFound;
}


function getIndexOfGame(gameName){
    let middle=Object.keys(gameArrSorted).length/2;
    middle=parseInt(middle.toFixed(0));
    let left=0;
    let right=Object.keys(gameArrSorted).length;
    let current;
    while(middle<right){
       current=gameArrSorted[middle].name.trim().toUpperCase();
      if (current.includes(gameName.toUpperCase())){
        return middle;
      }
      if (gameName.toUpperCase()>current){
        left=middle;
        middle=parseInt(((right+left)/2).toFixed(0));
      }else if (gameName.toUpperCase()<current){
        right=middle;
        middle=parseInt(((left+right)/2).toFixed(0));
      }else{
        gamesFound.push(gameArrSorted[middle]);
        break;
      }

    }
} 

axios.get("https://api.steampowered.com/ISteamApps/GetAppList/v2/")
    .then((res)=>{
        gameArr=res.data.applist.apps;
        let gameArrFixed = gameArr.map((game)=>{
          return {appid:game.appid,name:game.name.replace(/[^a-zA-Z0-9 ]/g, "")};});
        gameArrSorted=gameArrFixed.slice();
        gameArrSorted.sort(compare);
        console.log("all games are loaded");
    }).catch((err)=>console.error("error: ",err));
 
app.all('/*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
});


app.get("/search",(req,res)=>{
    let gameName=req.query.gameName
    let game=searchGameByName(gameName)
    let gameId=game.appid.toFixed(0);
    let dataToSend;
    const promise=new Promise((resolve,reject)=>
    axios.get("https://store.steampowered.com/api/appdetails?appids="+game.appid)
    .then((result)=>{
        let newGame={appid:gameId,name:result.data[gameId].data.name,
        price:result.data[gameId].data.price_overview.final}
        listOfGamesToWatch.push(newGame);
        dataToSend={success:true};
        resolve(dataToSend);
    }).catch((err)=>res.send({success:false})));
    promise.then((value)=>{res.send(value)});
})


app.get("/searchAll",(req,res)=>{
    let dataToSend=[];
    let gameName=req.query.gameName;
    let gameIndex=getIndexOfGame(gameName);
    let limit=100;
    if (gameIndex+limit>=gameArrSorted.length){
      limit=gameArrSorted.length-limit;
    }
    for (var i=gameIndex;i<gameIndex+limit;i++){
      dataToSend.push(gameArrSorted[i]);
    }
    if (gameIndex-limit<0){
      limit=gameIndex%limit;
    }
    for (var i=gameIndex-1;i>=gameIndex-limit;i--){
      dataToSend.push(gameArrSorted[i])
    }
    res.send(dataToSend)
})
/*
app.get("/addGame",(req,res)=>{
  let appid=req.query.gameId;
  let dataToSend;
  const promise=new Promise((resolve,reject)=>
  axios.get("https://store.steampowered.com/api/appdetails?appids="+appid)
  .then((result)=>{
    let newGame={appid:gameId,name:result.data[gameId].data.name,
    price:result.data[gameId].data.price_overview.final}
    listOfGamesToWatch.push(newGame);
    dataToSend={success:true};
    resolve(dataToSend);
    }).catch((err)=>res.send({success:false})));
    promise.then((value)=>{res.send(value)});
})
*/
app.get("/load",(req,res)=>{
    let promiseList=[];
    for (let i=0;i<listOfGamesToWatch.length;i++){
        let appid=listOfGamesToWatch[i].appid;
        const promise=new Promise(( resolve,reject) => 
        axios.get("https://store.steampowered.com/api/appdetails?appids="+appid)
        .then((result)=>{
            try{
            if (result.data[appid].data.price_overview.final<listOfGamesToWatch[i].price){
              listOfGamesToWatch[i].price=result.data[appid].data.price_overview.final;
            }
            resolve('foo');
          }catch(error){
            console.log(error);
          }
        }));
        promiseList.push(promise);
    }
    let p=Promise.all(promiseList);
    console.log(listOfGamesToWatch);
    res.send(listOfGamesToWatch);
})


app.post("/addGame",(req,res)=>{
  console.log(req.body());
})
var server=app.listen(4000);
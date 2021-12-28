const Binance = require('node-binance-api');
const binance = new Binance().options({
  reconnect:true,

});
var RSI = require('technicalindicators').RSI;
// var _ = require('lodash');
var firebase = require('firebase');
const firebaseConfig = {
  apiKey: "AIzaSyBsi2kXsDKbPYjt-nHXyG0PyCQ_BcJSzjA",
  authDomain: "datafuture-43b1e.firebaseapp.com",
  databaseURL: "https://datafuture-43b1e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "datafuture-43b1e",
  storageBucket: "datafuture-43b1e.appspot.com",
  messagingSenderId: "634877289231",
  appId: "1:634877289231:web:d9f1824bf30429e10d547a"
};
firebase.initializeApp(firebaseConfig)
let firebaseDB = firebase.database().ref('status');
////////////////////////***value */
  var status={
    is_trading: true,
    status: 0, 
    quatity_coin:1,
    lock:true
  }
  var symbol='BNBUSDT'//"ETHUSDT";
  var candle_c=102;
///////////////////////End value
// setup data begin 
firebaseDB.once('value').then((snapshot) => {if (snapshot.exists()) {status=(snapshot.val());} else { console.log("No data available");}}).catch((error) => {console.error(error);});
//*******************/ main()
main();
function main(){
  // get_data_socket(symbol);
}
//************End Main */

var first_run=true;
var time_final=0;
// Nguon cung cap data here
  async function get_data_socket(symbol){
    try{
      binance.futuresChart(symbol, '1m', (symbol, interval, chart) => {
          let data_close=[]
          Object.keys(chart).forEach(function(key) {
            data_close.push({
              close:chart[key].close,
              time:chart[key].time,
            });
          })
          //
          if(first_run){
            first_run=false;
            time_final=data_close[data_close.length-1].time;
          }
          if(time_final!=data_close[data_close.length-1].time){
            // da dong xong nen 1p
            time_final=data_close[data_close.length-1].time;
            let data_close_phu=[...data_close];data_close_phu.pop();
            let _data_close=[];
            data_close_phu.forEach(e => {
              _data_close.push(e.close);
            });
            // return _data_close (da hoan thanh)
            // **** [todo] *** there is woking here!
            // **************************************

              check_rsi_and_run_trade(_data_close);

            //***************************************/
          }
          
      },candle_c); 
    }catch(e){
      console.log(e)
    }
  }
  //
  function check_rsi_and_run_trade(_data_close,chan_tren_rsi100,chan_duoi_rsi100,unlock_rsi14,chan_duoi_rsi14){
    let data=bo_render_data_rsi100_rsi14(_data_close);
    if(status.status==0){
      // xet vao lenh buy 1
      if(data[0].rsi100<=chan_duoi_rsi100){
        // [todo] 
        //status.lock=true
        console.log('BUY 1 : ', status.quatity_coin);
        console.log('o gia : ', data[0].close);
        console.log('---------------------- ');
        status.status=1;
        status.lock=true
      }
    }else{ 
      // xet rsi100 > chan_tren_rsi100, end thoi
      if(e.rsi100>=chan_tren_rsi100){
        console.log('SELL all  ');
        console.log('o gia : ', data[0].close);
        console.log('---------------------- ');
        status.status=0;
      }else{
        // xet vao lenh buy 2 3 4
        if(data[0].rsi14<=chan_duoi_rsi14){
          if(!status.lock){
            if(status.status==1){
              console.log('BUY 2 : ', status.quatity_coin*2);
              console.log('o gia : ', data[0].close);
              console.log('---------------------- ');
              status.status=2;
            }else if(status.status==2){
              console.log('BUY 3 : ', status.quatity_coin*4);
              console.log('o gia : ', data[0].close);
              console.log('---------------------- ');
              status.status=3;
            }
            else if(status.status==3){
              console.log('BUY 4 : ', status.quatity_coin*8);
              console.log('o gia : ', data[0].close);
              console.log('---------------------- ');
              status.status=4;
            }
            status.lock=true;
          }
        }else{
          if(data[0].rsi14>unlock_rsi14){
            status.lock=false;
          }
        }
      }
    }

  }
//  // test
//   test();
//  async function test(){
//     setTimeout(()=>{
//       console.log(status)
//     },1000)
//   }

/////////////////////////// function ho tro
function save_data(data){
  firebaseDB.set(data)
}
//
async function get_usdt_account(){
  let balance_account=await binance.futuresBalance();
  let usdt=0;
  Object.keys(balance_account).forEach(function(key) {
    if(balance_account[key].asset=='USDT'){
      console.log("🚀 ~ file: index.js ~ line 98 ~ Object.keys ~ balance_account[key]", balance_account[key])
      usdt=Number(balance_account[key].balance)+Number(balance_account[key].crossUnPnl);
    }
  });
 return usdt.toFixed(2);
}
//
// get_quatity_coin_trading('UNIUSDT')
async function get_quatity_coin_trading(symbol){
  let aa=await binance.futuresAccount();
  let positions=aa.positions;
  let result=0;
  Object.keys(positions).forEach(function(key) {
    if(positions[key].symbol==symbol){
      result= positions[key].positionAmt;
    }
  })
  return Number(result);
}
//
// BO TAO DATA  
function bo_render_data_rsi100_rsi14(data_cl){
  let rsi100=RSI.calculate({values:data_cl,period : 100});
  let rsi14=RSI.calculate({values:data_cl,period : 14});
  let data=[];
  rsi100.forEach((e,i) => {
    data.push({
      rsi100:e,
      rsi14:rsi14[i+86],
      close:data_cl[i+100]
    })
  });
  return data
}
const Binance = require('node-binance-api');
const binance = new Binance().options({
  reconnect:true,

});
var RSI = require('technicalindicators').RSI;
const TelegramBot = require('node-telegram-bot-api');
const token = '5076495635:AAHBxTfNmbveG0_sSNiu99jQx1nEYlDTMGM';
const chatId=1497494659;
const bot = new TelegramBot(token, {polling: true});
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
    quatity_coin:0.1,
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
  get_data_socket(symbol);
}
//************End Main */

var first_run=true;
var time_final=0;
var gia_vao_len_truoc=0;
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
            if(status.is_trading){
              check_rsi_and_run_trade(_data_close);
            }
            //***************************************/
          }
          
      },candle_c); 
    }catch(e){
      console.log('loi tai get_data_socket');
      console.log(e);
    }
  }
  //
  function check_rsi_and_run_trade(_data_close){
    var chan_tren_rsi100=52;
    var chan_duoi_rsi100=43;
    var unlock_rsi14=40;
    var chan_duoi_rsi14=27;
    var remove_nhieu_gia=3;
    let data=bo_render_data_rsi100_rsi14(_data_close);
    if(status.status==0){
      // xet vao lenh buy 1
      if(data[0].rsi100<=chan_duoi_rsi100){
        status.status=1;
        status.lock=true;
        gia_vao_len_truoc=data[0].close;
        buy(symbol,status.quatity_coin);
        save_data(status);
      }
    }else{ 
      // xet rsi100 > chan_tren_rsi100, end thoi
      if(data[0].rsi100>=chan_tren_rsi100){
        sell(symbol);
        status.status=0;
        save_data(status);
      }else{
        // xet vao lenh buy 2 3 4
        if(data[0].rsi14<=chan_duoi_rsi14){
          if(!status.lock){
            if(status.status==1){
              if(gia_vao_len_truoc-data[0].close>=remove_nhieu_gia){
                gia_vao_len_truoc=data[0].close;
                status.status=2;
                buy(symbol,status.quatity_coin*2);
                status.lock=true;
                save_data(status);
              }
            }else if(status.status==2){
              if(gia_vao_len_truoc-data[0].close>=remove_nhieu_gia){
                gia_vao_len_truoc=data[0].close;
                status.status=3;
                buy(symbol,status.quatity_coin*4);
                status.lock=true;
                save_data(status);
              }
            }
            else if(status.status==3){
              if(gia_vao_len_truoc-data[0].close>=remove_nhieu_gia){
                gia_vao_len_truoc=data[0].close;
                status.status=4;
                buy(symbol,status.quatity_coin*8);
                status.lock=true;
                save_data(status);
              }
            }
          }
        }else{
          if(data[0].rsi14>unlock_rsi14){
            status.lock=false;
            save_data(status);
          }
        }
      }
    }

  }
//**************xu ly data voi telegram */
bot.on('message',async (msg) => {
  let tx=msg.text.toUpperCase();
  if(tx=='INFO BOT'){
    get_infor(status)
  }else if(tx=="OFF BOT"){
    off_tooll(status);
    if(status.status>0){
      sell(symbol);
    }
    status.is_trading=false;
    status.status=0;
    status.lock=true;
    save_data(status);
    
  }else if(tx=="ON BOT"){
    on_tooll();
    status.is_trading=true;
    save_data(status);
  }else if(tx[0]=="*"){
    let message_arr=msg.text.toUpperCase().split("=");
    if(message_arr.length==2){
      let coin=Number(message_arr[1]);
      if(!isNaN(coin)){
        status.quatity_coin=coin;
        save_data(status);
        bot.sendMessage(chatId,`Setup số coin trade ban đầu Ok rồi đó.`);
      }else{
        bot.sendMessage(chatId,`Bạn gửi thông số sai rồi.`);
      }

    }
  }else{
    bot.sendMessage(chatId,`
+ "info bot" => thông tin setup.
+ "off bot" => dừng hoạt động Bot. thoát các vị thế hiện tại.
+ "on bot" => cho Bot hoạt động lại.
+ "*coin=0.1" => 0.1 là số coin cần setup
`);
  }
})

/////////////////////////// function ho tro
function save_data(data){
  firebaseDB.set(data)
}
// buy future
async function buy(symbol,quantity){
  let buybuy=await binance.futuresMarketBuy( symbol, quantity );
  console.log("🚀 ~ buybuy", buybuy);
}
// sell future
async function sell(symbol){
  let quantity= await get_quatity_coin_trading(symbol);
  console.log("🚀 ~ quantity", quantity)
  if(quantity>0){
   let sellsell= await binance.futuresMarketSell( symbol, quantity );
   console.log("🚀 ~ sellsell", sellsell);
  }
}
//
async function get_usdt_account(){
  let balance_account=await binance.futuresBalance();
  let usdt=0;
  Object.keys(balance_account).forEach(function(key) {
    if(balance_account[key].asset=='USDT'){
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
  return data;
}
// tra ve thong so hien tai cua tool
async function get_infor(status){
  let usdt= await get_usdt_account();
  bot.sendMessage(chatId,`
+ ${status.is_trading?'Bot đang hoạt động':'Bot đang dừng'}.
+ Số lượng coin trade : ${status.quatity_coin}
+ Vị thế trade: ${status.status}
+ USDT hiện có là :${usdt}
`);
}
// Tat tool
async function off_tooll(status){
  bot.sendMessage(chatId,`
Bot đã được tắt, tuy nhiên hiện + Vị thế trade là : ${status.status}.
Bạn nên vào binance thoát hết vị thế mà tool đã vào lệnh lúc trước nếu có, để đảm bảo an toàn nha!
${status.status==0?'Hiện tại không có lệnh nào cả.':'hiện tại đang có lệnh đó.'}
*** Lưu ý : thông thường thì Bot đã tự động thoát vị thế và đóng các lệnh lại luôn rồi đó nhé.
`);
}
// bat tool
async function on_tooll(){
  bot.sendMessage(chatId,`Bot đã được bật.`);
}

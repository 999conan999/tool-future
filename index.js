const Binance = require('node-binance-api');
const binance = new Binance().options({reconnect:true});
var RSI = require('technicalindicators').RSI;

var data=[];
var data_all=[];
////////////////////////////////
// down
// const time="1w"
const time="15m"
////////////////////////////////
//////////////////////////////
main();
// data_set();
async function main(){
  try{
    let symbols=await get_symbols();
    let list_symbol=symbols;
    get_data_socket(list_symbol);
  }catch(e){
    console.log("loi main()")
    console.log(e)
  }
}
// khoi tao socket lay data
//
async function get_data_socket(list_symbol){

  try{
    binance.futuresChart(list_symbol, time, (symbol, interval, chart) => {
      try{
        let array_data=[];
        Object.keys(chart).forEach(function(key) {
          array_data.push(chart[key].close);
        })
        array_data.pop();
        //
        data_all[symbol]={
          list_close:array_data,
        };
        ///
      }catch(e){
        console.log('loi data trong socket 15m')
      }
    },500);
    setTimeout(()=>{
      binance.futuresChart(list_symbol,'1d', (symbol, interval, chart) => {
        try{
        let array_data=[];
        Object.keys(chart).forEach(function(key) {
          array_data.push(chart[key].close);
        })
        // array_data.pop();
        //
        data[symbol]={
          list_close:array_data,
        };
        ///
        }catch(e){
          console.log('loi data trong socket ngay')
        }
      },500);
  },5000)
  }catch(e){
    console.log(e)
  }

}

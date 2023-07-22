const {jsonparser , exchange  ,  convertDate , OHLCV }= require("./utils/utils.js");
const fs = require('fs');
const exchangeLimitobj = jsonparser.jsonParser('./exchange_limit/exchange_limit.json')
const timeMsobj = jsonparser.jsonParser('./time_ms/time_ms.json')

// --- List coin here ---
pair_list = ["BTC/USDT", "ETH/USDT", 'ADA/USDT', 'XRP/USDT', 'BNB/USDT', 'LINK/USDT', 'LTC/USDT', "DOGE/USDT", "SOL/USDT", "AVAX/USDT", "DOT/USDT", "LUNA/USDT", "MATIC/USDT", "NEAR/USDT", "EGLD/USDT", "XTZ/USDT", "AAVE/USDT", "UNI/USDT", "FTM/USDT", "BCH/USDT"]

// --- Choose timeframe that you need - It can be list of timeframe ---
timeframe_list = ['1h'] 
start_date = "02-08-2016"

const ohlcv = new OHLCV("Binance",exchangeLimitobj,timeMsobj,start_date);

ohlcv.MultiOHLCV(timeframe_list,pair_list);
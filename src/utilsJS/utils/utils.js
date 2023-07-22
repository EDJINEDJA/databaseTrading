const fs = require('fs');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;


class jsonparser{
    static jsonParser(path){
        return JSON.parse(fs.readFileSync(path,'utf-8'));
    }
}

class double{
    static eliminate_double_ts(arr) {
        let i,
            len = arr.length
        let to_remove = []
    
        for (i = 1; i < len; i++) {
            if (arr[i][0] === arr[i - 1][0]) {
                to_remove.push(i)
            }
        }
        for (i = to_remove.length - 1; i >= 0; i--) {
            arr.splice(to_remove[i], 1);
        }
        return arr;
    } 
}



class convertDate{
    static timestamp2date (timestamp){

        //convert timestamp into date
        let objct = new Date(timestamp);

        //get values from Date object
        let year = objct.getFullYear();
        let month = objct.getUTCMonth() + 1;
        let day = objct.getUTCDate();
        let hours =  objct.getUTCHours();
        let minutes = objct.getUTCMinutes();
        let secondes = objct.getUTCSeconds();

        return `${day}-${month}-${year} ${hours}:${minutes}:${secondes}`;
    }

    static date2timestamp(date){

        //string transformation
        let arrayObject = date.split('-');
        let arrayObjectYearAndHours = arrayObject[2].split(" ");

        if  (arrayObjectYearAndHours.length == 1){
            //Convert timestamp into date
            let objctResult = new Date(Date.UTC(arrayObject[2],arrayObject[1]-1,arrayObject[0]));
            return objctResult.getTime();
        }else{
            //Convert timestamp into date
            let objctResult = new Date(Date.UTC(arrayObjectYearAndHours[0],arrayObject[1]-1,arrayObject[0]));
            return objctResult.getTime();
        }
       
    }

    static  get currentUtcDate() {
        const now = new Date();
        now.toUTCString();
        now.toISOString();
        return Math.floor(now);
    }

    static lasttimestamps(sincetimestamp,totimestamp, exchange_limit,tf_ms){
        let now = totimestamp;
        let arraytimestampsince2now = [sincetimestamp];
        while (sincetimestamp < now){
            sincetimestamp = sincetimestamp + exchange_limit*tf_ms;
            arraytimestampsince2now.push(sincetimestamp);    
        }
        return arraytimestampsince2now;
    }

}

class exchange{
    static get binance(){
        const ccxt = require('ccxt');
        const object=new ccxt.binance({enableRateLimit: true });
        return object;
    }
}

class OHLCV{
    constructor(exchange_name ,exchange_limit, tf_ms  , since="04-12-2020 00:00:00", to=convertDate.currentUtcDate){
        this.exchange_name = exchange_name;

        if (this.exchange_name = "Binance"){
            this.exchange = exchange.binance;
            this.limit = exchange_limit[this.exchange_name];
        }
        if (typeof to === "string"){
            this.to = convertDate.date2timestamp(to);
        }else{
            this.to = to;
        }

        this.tf_ms = tf_ms;
        this.since = convertDate.date2timestamp(since);
        
    }

    async fetchOHLCV(timeframe="1h", symbol){
        let resultOHLCV = [];
        let lasttimestamps = await convertDate.lasttimestamps(this.since , this.to, this.limit, this.tf_ms[timeframe]);
        let total_request =  lasttimestamps.length;
        let current_request = 0;

        for (const index in lasttimestamps){
            this.exchange.fetchOHLCV(symbol,timeframe,lasttimestamps[index],this.limit)
            .then((res) => {
            resultOHLCV = resultOHLCV.concat(res);
            current_request ++;
            })
            .catch(reject0 => {
                console.log("Error retrieving candles since", lasttimestamps[index], this.exchange_name, symbol, timeframe);
                //console.log(`Error retrieving candles since ${lasttimestamps[index]} from ${this.exchange_name} failed: pair_name => ${symbol} | timeframe => ${timeframe}`);
                this.exchange.fetchOHLCV(symbol,timeframe,lasttimestamps[index],this.limit)
                .then((res) => {
                resultOHLCV = resultOHLCV.concat(res);
                current_request ++;
                })
                .catch(reject1 => {
                    console.log("Error retrieving candles since", lasttimestamps[index], this.exchange_name, symbol, timeframe);
                    //console.log(`Error retrieving candles since ${lasttimestamps[index]} from ${this.exchange_name} failed: pair_name => ${symbol} | timeframe => ${timeframe}`);
                    this.exchange.fetchOHLCV(symbol,timeframe,lasttimestamps[index],this.limit)
                    .then((res) => {
                    resultOHLCV = resultOHLCV.concat(res);
                    current_request ++;
                    })
                    .catch(reject3 => {
                        console.log(reject3);
                        console.log("/! Fatal Error /!", symbol, timeframe);
                        current_request++;
                    })
                })
            })       
        }

        const delay = millis => new Promise((resolve, reject) => {
            setTimeout(_ => resolve(), millis);
        });

        while (current_request < total_request) {
            process.stdout.write(`\rLoading ${current_request}/${total_request} requests | ${resultOHLCV.length} candles loaded`);
            await delay(2000);
        }
        process.stdout.write(`\rLoading ${current_request}/${total_request} requests | ${resultOHLCV.length} candles loaded`);

        resultOHLCV = resultOHLCV.sort(function(a, b) {
            return a[0] - b[0];
        });

        resultOHLCV = double.eliminate_double_ts(resultOHLCV);
        
        let file_pair = symbol.replace('/', '-');
        let dirpath = './../../input/raw/' + this.exchange_name + '/' + timeframe + '/';
        let filepath = dirpath + file_pair + ".csv";

        let first_date = convertDate.timestamp2date(resultOHLCV[0][0]);

        await fs.promises.mkdir(dirpath, { recursive: true });

        const csvWriter = createCsvWriter({
            header: ['date', 'open', 'high', 'low', 'close', 'volume'],
            path: filepath
        });

        csvWriter.writeRecords(resultOHLCV)
            .then(() => {
                process.stdout.write(`\rSuccessfully downloaded ${resultOHLCV.length} candles since ${first_date} in ${filepath}`);
                return true;
            }).catch(err => {
                console.log(err);
                return false;
            });
    }

    async MultiOHLCV(timeframes , symbols){

        for (const sym in symbols){
            for (const tf in timeframes){
                await this.fetchOHLCV(timeframes[tf],symbols[sym]);
            }
        }

    }

}



module.exports = {
    exchange,
    convertDate,
    OHLCV, 
    jsonparser,
}
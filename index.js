var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var superagent = require('superagent');

process.setMaxListeners(0);
(function(){
  this.reqActive = 0;

var provinceCB = function(html){
      console.log('activeReqeusts: ' + --this.reqActive);
  var $ = cheerio.load(html);
  var options = $('option');
  for(var i = 0; i < options.length; i++){
    var curr = options[i];
    curr.attribs.value && sendRequest('https://www.comelec.gov.ph/php-scripts/2016NLE/municipal/prov_' + curr.attribs.value + '.html', muniCB);
  }

};

var muniCB= function(html){
      console.log('activeReqeusts: ' + --this.reqActive);
  var $ = cheerio.load(html);
  var options = $('option');
  for(var i = 0; i < options.length; i++){
    var munCurr = options[i];
    munCurr.attribs.value && sendRequest('https://www.comelec.gov.ph/php-scripts/2016NLE/barangay/'+ munCurr.attribs.value + '/brgylist2016_' + munCurr.attribs.value + '.html', barangayCB);
  }
};

var barangayCB = function(html){
      console.log('activeReqeusts: ' + --this.reqActive);
  var $ = cheerio.load(html);
  var options = $('option');
  for(var i = 0; i < options.length; i++){
    var curr = options[i];
   
    var value = curr.attribs.value;
    var prov = value.substring(0, 2);
    var mun = value.substring(2, 4);
    var brun = value.substring(4);
    
    //curr.attribs.value && precinctCB(value, prov, mun, brun);
    
    curr.attribs.value && sendRequest('https://www.comelec.gov.ph/php-sys-generated/2016NLE/BCVL/prov_' + prov + '/mun_' + mun + '/brgy_' + brun +'.html', bDataCB, {prov: prov, mun: mun, brun: brun});
  }
};

var bDataCB= function(html, vals){
  fs.writeFile('html/brgyVoters_' + vals.prov + '_' + vals.mun + '_' + vals.brun, html, function(err){
    if(err) {
      console.log(err);
    } else {
      console.log('activeReqeusts: ' + --this.reqActive);
      console.log('success');
    }
  }.bind(this))
};

/*var precinctCB = function(value, prov, mun, brun){
      console.log('activeReqeusts: ' + --this.reqActive);
  sendRequest('https://www.comelec.gov.ph/php-scripts/2016NLE/prcnum/' + value + '/preclist2016_' + value + '.html', pSubCB, {prov: prov, mun: mun, brun: brun});
};*/

/*var pSubCB = function(html, vals){
      console.log('activeReqeusts: ' + --reqActive);
  var $ = cheerio.load(html);
  var options = $('option');
  for(var i = 0; i < options.length; i++){
    var curr = options[i];
    curr.attribs.value && sendRequest('https://www.comelec.gov.ph/php-sys-generated/cvl-2016nle/prov_'+ vals.prov +' /mun_' + vals.mun + '/brgy_' + vals.brun +'/' + curr.attribs.value + '/prec_' + curr.attribs.value + '.html', precData, vals);
  }
};*/

/*var precData = function(html, vals) {
  fs.writeFile('prevVoters_' + vals.prov + '_' + vals.mun + '_' + vals.brun, html, function(err){
    if(err) {
      console.log(err);
    } else {
      console.log('activeReqeusts: ' + --reqActive);
      console.log('success');
    }
  })
};*/


//sendRequest('https://www.comelec.gov.ph/?r=2016NLE/ListOfVoters/PVL');
this.queue = [];
this.count = 0;

this.addToQueue= function(request){
  this.queue.push(request);
  this.checkQueue();
};
this.checkQueue= function(){
  if(this.count < 20){
    this.nextQueue();
  }
};

this.nextQueue = function(){
  var toRun = this.queue.shift();
  toRun && this.sendRequest(toRun.url, toRun.callback, toRun.valuesToPass);
};

this.sendRequest= function(url, callback, valuesToPass){

  if(this.count < 20){
  this.count++;
  this.reqActive = this.count;
  request(url, function(err, res, html){
    if(!err){
      this.count--;
      valuesToPass ? callback(html, valuesToPass) : callback(html);
      this.checkQueue();
    }
  }.bind(this));
  } else {
    this.addToQueue({url: url, callback: callback, valuesToPass: valuesToPass});
  }
};

this.sendRequest('https://www.comelec.gov.ph/html-scripts/2016NLE/province2016.html', provinceCB);

})()

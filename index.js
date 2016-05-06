var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

var provinceCB = function(html){
  var $ = cheerio.load(html);
  var options = $('option');
  for(var i = 0; i < options.length; i++){
    var curr = options[i];
    curr.attribs.value && sendRequest('https://www.comelec.gov.ph/php-scripts/2016NLE/municipal/prov_' + curr.attribs.value + '.html', muniCB);
  }
};

var muniCB= function(html){
  var $ = cheerio.load(html);
  var options = $('option');
  for(var i = 0; i < options.length; i++){
    var munCurr = options[i];
    munCurr.attribs.value && sendRequest('https://www.comelec.gov.ph/php-scripts/2016NLE/barangay/'+ munCurr.attribs.value + '/brgylist2016_' + munCurr.attribs.value + '.html', barangayCB);
  }
};

var barangayCB = function(html){
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
  fs.writeFile('brgyVoters_' + vals.prov + '_' + vals.mun + '_' + vals.brun, html, function(err){
    if(err) {
      console.log(err);
    } else {
      console.log('success');
    }
  })
};

var precinctCB = function(value, prov, mun, brun){
  sendRequest('https://www.comelec.gov.ph/php-scripts/2016NLE/prcnum/' + value + '/preclist2016_' + value + '.html', pSubCB, {prov: prov, mun: mun, brun: brun});
};

var pSubCB = function(html, vals){
  var $ = cheerio.load(html);
  var options = $('option');
  for(var i = 0; i < options.length; i++){
    var curr = options[i];
    curr.attribs.value && sendRequest('https://www.comelec.gov.ph/php-sys-generated/cvl-2016nle/prov_'+ vals.prov +' /mun_' + vals.mun + '/brgy_' + vals.brun +'/' + curr.attribs.value + '/prec_' + curr.attribs.value + '.html', precData, vals);
  }
};

var precData = function(html, vals) {
  fs.writeFile('prevVoters_' + vals.prov + '_' + vals.mun + '_' + vals.brun, html, function(err){
    if(err) {
      console.log(err);
    } else {
      console.log('success');
    }
  })
};


//sendRequest('https://www.comelec.gov.ph/?r=2016NLE/ListOfVoters/PVL');
sendRequest('https://www.comelec.gov.ph/html-scripts/2016NLE/province2016.html', provinceCB);

function sendRequest(url, callback, valuesToPass){
  request(url, function(err, res, html){
    if(!err){
      valuesToPass ? callback(html, valuesToPass) : callback(html);
    }
});
}

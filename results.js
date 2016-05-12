var fs = require('fs');
var request = require('cloudscraper');
//var request = require('request');
var cheerio = require('cheerio');

//allows the request library to create and maintain a
//theoretical unlimited number of event emitters/listeners
process.setMaxListeners(0);

(function(){
  this.baseUrl = 'https://www.pilipinaselectionresults2016.com/';
  this.reqActive = 0;

//callback that will loop through -- this is getting the region
var rootCB = function(result){
  var json = JSON.parse(result);
  var keys = Object.keys(json.subRegions);
  if(keys.length){
    for(var i = keys.length; i > 0; i--){
      var region = json.subRegions[keys[i - 1]];
      //make sure that there is a value before sending the request

      region && region.customCode && sendRequest(this.baseUrl + decodeURIComponent(region.url), rootCB);
    }
  } else {
    keys = Object.keys(json.contests);
    if(keys.length){
      for(var i = keys.length; i > 0; i--){
        var contest = json.contests[keys[i - 1]];
        //make sure that there is a value before sending the request
        contest && contest.url && sendRequest(this.baseUrl + decodeURIComponent(contest.url), finalCB, {foldername: json.customCode, filename: contest.code});
      }
    }
  }

};

var finalCB = function(result, vals){
  var directoryPath = __dirname + '/json/' + vals.foldername;
  fs.stat(directoryPath, function(err, stat){
    if(stat && stat.isDirectory()){
      fs.writeFile(directoryPath + '/' + vals.filename + '.json', result, function(err){
        if(err) {
          console.log(err);
        } else {
          console.log('success');
        }
      });
    } else {
      fs.mkdir(directoryPath, function(err){
        if(!err){
          fs.writeFile(directoryPath + '/' + vals.filename + '.json', result, function(err){
            if(err) {
              console.log(err);
            } else {
              console.log('success');
            }
          });
        }
      });
    }
  });
};

//queue
//this queue will hold all requests...
//province, munis, barangays, and precints (whatever the request is)
this.queue = [];
this.count = 0;

this.addToQueue= function(request){
  this.queue.push(request);
  //after we add to the queue lets check to see if we send one more
  this.checkQueue();
};
this.checkQueue= function(){
  //only allow 20 at a time
  if(this.count < 20){
    this.nextQueue();
  }
};

this.nextQueue = function(){
  //take the top request off the queue and run it
  var toRun = this.queue.shift();
  toRun && this.sendRequest(toRun.url, toRun.callback, toRun.valuesToPass);
};

this.sendRequest= function(url, callback, valuesToPass){
  //check active count
  //if less than 20 send the request
  //else put it in the queue
  if(this.count < 20){
  this.count++;
  this.reqActive = this.count;
  request.get(url, function(err, res, html){
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

this.sendRequest(this.baseUrl + 'data/regions/root.json', rootCB);

})()


var Telemetry = require('telemetry-next-node');
var express = require('express')
var app = express()

var Versions = [];
var Metrics = [
    "SSL_HANDSHAKE_VERSION",
    "HTTP_TRANSACTION_IS_SSL",
    "HTTP_PAGELOAD_IS_SSL"
];
var Channels = ["beta" ];
var CurrentResults = undefined;

const maxVersion = 54;
const minVersion = 44;
function collectEvolution(channel, version, metric, cb) {
  console.log("Collecting " + metric + ":" + channel + ":" + version);
  Telemetry.getEvolution(channel, version, metric, {}, true,
                         function(res) {
                           cb(channel, version, metric,res);
                         }    
                        );
}

function versionsForChannel(versions, channel) {
  let nums = [];

  for (v in versions) {
    let s = versions[v].split("/");
    if ((s[0] == channel) &&
        (s[1] <= maxVersion) &&
        (s[1] >= minVersion)){
      nums.push(s[1]);
    }
  }

  return nums;
}

function load(done) {
  Telemetry.init(function() {
    let data = {};
    
    console.log("Telemetry initialized");
    let versions = Telemetry.getVersions();
    let versions_for_channel = {};

    for (c in Channels) {
      versions_for_channel[Channels[c]] = versionsForChannel(versions,
                                                             Channels[c]);
    }

    let todo = 0;
    
    for (m in Metrics) {
      let metric = Metrics[m];
      
      data[metric] = {};
      
      for (c in Channels) {
        let channel = Channels[c];
        data[metric][channel] = {};
        
        for (v in versions_for_channel[Channels[c]]) {
          version = versions_for_channel[channel][v];
          
          todo++;

          collectEvolution(channel, version, metric,
                           function(channel, version, metric, result) {
                             console.log("Result for " + metric + ":" + channel + ":" + version);
                             data[metric][channel][version] = result;
                             --todo;
                             if (!todo) {
                               done(data);
                             }
                           }
                          );
        }
      }
    }
  });
}

function reinit() {
  console.log("Initializing");
  load(
    function(d) {
      console.log("Initialized");
      CurrentResults = d;
      setTimeout(reinit, 86400 * 1000);
    }
  );
}

reinit();

app.all('/*', (req, res, next) => {
  res.set('access-control-allow-origin', '*');
  next();
});

app.get('/data/:metric/:channel', function (req, res) {
  let metric = req.params.metric;
  let channel = req.params.channel;
  if (!CurrentResults) {
    res.status(500).send("Not initialized");
  }
  if (!CurrentResults[metric]) {
    res.status(404).send("Metric does not exist");
  }
  if (!CurrentResults[metric][channel]) {
    res.status(404).send("Channel does not exist");
  }
  res.json(CurrentResults[metric][channel]);
})

port = process.env.PORT || 80;

app.listen(port, function () {
  console.log('Listening');
})

app.use(express.static('static'));



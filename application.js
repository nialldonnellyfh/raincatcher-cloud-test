var mbaasApi = require('fh-mbaas-api');
var express = require('express');
var config = require('./config.json');
var fhComponentMetrics = require('fh-component-metrics');
var metrics = fhComponentMetrics(config.component_metrics);
var mbaasExpress = mbaasApi.mbaasExpress();
var cors = require('cors');

var securableEndpoints;
securableEndpoints = [];

var metricsConfig = {
  enabled: process.env.API_METRICS_ENABLED ? true : false,
  host: process.env.API_METRICS_HOST ? process.env.API_METRICS_HOST : config.component_metrics.host,
  port: process.env.API_METRICS_PORT ? process.env.API_METRICS_PORT : config.component_metrics.port
};


metrics.memory(config.app_name, metricsConfig, function(err) {
  if(err) {
    console.log("Error logging memory stats", err)
  }
});

metrics.cpu(config.app_name, config.component_metrics, function(err) {
  if(err) {
    console.log("Error logging cpu stats", err)
  }
});


var app = express();

// Enable CORS for all requests
app.use(cors());

app.use(fhComponentMetrics.timingMiddleware(config.app_name, metricsConfig));

// Note: the order which we add middleware to Express here is important!
app.use('/sys', mbaasExpress.sys(securableEndpoints));
app.use('/mbaas', mbaasExpress.mbaas);

// allow serving of static files from the public directory
app.use(express.static(__dirname + '/public'));

// Note: important that this is added just before your own Routes
app.use(mbaasExpress.fhmiddleware());

// Important that this is last!
app.use(mbaasExpress.errorHandler());

var port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
var host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
app.listen(port, host, function() {
  console.log("App started at: " + new Date() + " on port: " + port);
});

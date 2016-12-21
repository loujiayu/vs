var app = require('electron').app;

// Load our code once ready
app.once('ready', function () {
	require('./bootstrap-amd').bootstrap('vs/code/electron-main/main');
});
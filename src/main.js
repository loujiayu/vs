var app = require('electron').app;

// Mac: when someone drops a file to the not-yet running VSCode, the open-file event fires even before
// the app-ready event. We listen very early for open-file and remember this upon startup as path to open.
global.macOpenFiles = [];
app.on('open-file', function (event, path) {
	global.macOpenFiles.push(path);
});

var openUrls = [];
var onOpenUrl = function (event, url) {
	event.preventDefault();
	openUrls.push(url);
};

app.on('will-finish-launching', function () {
	app.on('open-url', onOpenUrl);
});

global.getOpenUrls = function () {
	app.removeListener('open-url', onOpenUrl);
	return openUrls;
};

// Load our code once ready
app.once('ready', function () {
	require('./bootstrap-amd').bootstrap('vs/code/electron-main/main');
});
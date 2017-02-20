var express = require("express"),
    log = console.log;

var SERVER_PORT = process.argv[2] || 9999;

log("\n[SERVER] Starting at port: "+SERVER_PORT);
var app = express();
app.use("/", express.static( "./demo"));
app.listen(SERVER_PORT);

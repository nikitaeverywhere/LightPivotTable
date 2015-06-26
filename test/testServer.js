var express = require("express"),
    app = express(),
    PORT = 81;

app.use(express.static(__dirname + "/.."));

app.listen(PORT);

console.info("Server ready on port " + PORT + ".");
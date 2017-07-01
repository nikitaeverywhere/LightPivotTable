var express = require("express"),
    app = express(),
    PORT = 81;

app.use(express.static(__dirname + "/.."));

app.listen(PORT);

console.info("Server ready on port " + PORT + ", visit http://127.0.0.1:81/example/private.html");
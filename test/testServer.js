var express = require("express"),
    app = express();

app.use(express.static(__dirname + "/.."));

app.listen(81);

console.info("Server ready on port 80.");
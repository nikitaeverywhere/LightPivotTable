Light pivot table for MDX2JSON source
====================

This is a lightweight and simple pivot table realization for [MDX2JSON](https://github.com/intersystems-ru/Cache-MDX2JSON) source.

The project is under development right now.

## Installation

There is no way to install this simply right now. First, you need to install and configure
[MDX2JSON](https://github.com/intersystems-ru/Cache-MDX2JSON). Then take a look for
<code>demos/index.html</code> file code. By replacing there URL's and MDX queries you can make this
work for you.

Also you may have a cross-origin (domain) issues when testing. In future, this project will become
a part of DeepSee.

## Debug

While [node](http://nodejs.org/) installed, run <code>npm install</code> in the project root to
install all required modules, and then execute <code>node test/testServer</code> to run local
server. By doing tests this way you have to to uncomment string
<code>d %response.SetHeader("Access-Control-Allow-Origin","*")</code> in MDX2JSON.REST class in
MDX2JSON package and additionally comment <code>If tMethodMatched=0 Set tSC=..Http405() Quit</code> line
there for cross-domain security purposes. Then give the right URL and MDX as in the example in
demos/index.html file.

## Preview

![Light pivot table](https://cloud.githubusercontent.com/assets/4989256/4876290/ce0918ea-62be-11e4-9583-fa9d78450716.png)
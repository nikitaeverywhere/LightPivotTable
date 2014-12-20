Light pivot table for MDX2JSON source
====================

This is a lightweight and simple pivot table realization for 
[MDX2JSON](https://github.com/intersystems-ru/Cache-MDX2JSON) source.

## Features
<ul>
    <li>View any MDX;</li>
    <li>Sort data in table;</li>
    <li>Easy to configure and use;</li>
    <li>Lightweight and speedy realization comparing to common DeepSee pivot table.</li>
</ul>

## Installation

<ol>
    <li>Install and configure [MDX2JSON](https://github.com/intersystems-ru/Cache-MDX2JSON) on
        your Caché instance;</li>
    <li>Build the project by running <code>gulp</code> command (see "Build" section below);</li>
    <li>Edit a bit code in <code>build/example/index.html</code> (set MDX2JSONSource and basicMDX
    properties according to your needs);</li>
    <li>Use it!</li>
</ol>

## Integration

#### Javascript

Build the project, and then include <code>build/css/lightPivotTable.css</code> and
<code>build/js/lightPivotTable.js</code> files into your project. Usage is shown in
<code>build/example/index.html</code> example.

Then use global object <i>LightPivotTable</i>:
```js
var setup = { // Object that contain settings. Any setting may be missed.
        container: document.getElementById("pivot") // HTMLElement which will contain table.
        , dataSource: {
            MDX2JSONSource: "http://localhost:57772/SAMPLES", // MDX2JSON server address
            basicMDX: typeof req === "object" ? req.basicMDX : req
            [ , namespace: "SAMPLES" ] // current namespace : default namespace
            [ , username: "USER" ] // user name : default user
            [ , password: "" ] // user password : default password
        }
        [ , triggers: { // provide your functions here to handle certain events
             drillDown: function ({Object { level: {number}, mdx: {string} }}) {}
            , drillThrough: function ({Object { level: {number}, mdx: {string} }}) {}
            , back: function ({Object { level: {number} }}) {}
        } ]
        [ , hideButtons: true // hides "back" and "drillThrough" buttons ]
        [ , triggerEvent: "touchstart" // all "click" events will be replaced by this event ]
        [ , caption: "My table" // if set, table basic caption will be replaced by this text ]
        [ , showSummary: true // show summary by columns ]
        [ , drillDownTarget: "<dashboard name>" // deepSee only - dashboard to open ]
    },
    lp = new LightPivotTable(setup);
    
console.log(lp.CONTROLS); // object with functions that can be triggered to control pivot table

lp.setFilter("[DateOfSale].[Actual].[YearSold].&[2009]");
lp.refresh();
```

#### Caché DeepSee

To integrate light pivot widget into DeepSee, just perform build and then import <code>
build/LightPivotTable.xml</code> into namespace you want. Make sure that MDX2JSON source is
installed and configured. Also you may need to change the widget property "MDX2JSON source" to make
it work with another MDX2JSON source.

## Build

You need [NodeJS](http://nodejs.org/) to perform any build tasks.

To build project and see working example, gulp and it's plugins must be installed. Simple run 
<code>npm install -g gulp</code> and <code>npm install</code> commands to perform all required
installations.

By running <code>gulp</code> command later, <code>build</code> directory will be created with all
required files there.

## Debug

Run <code>npm install</code> in the project root to
install all required modules, and then execute <code>node test/testServer</code> to run local
server. Then give the right URL and MDX as in the example in example/index.html file.

Also anytime you can build project and then check <code>build/example/index.html</code> page. 

## Preview

Run <code>gulp</code> command and then check <code>build/example/index.html</code>.

![Light pivot table](https://cloud.githubusercontent.com/assets/4989256/5239656/500bc7ea-78f2-11e4-99ec-6204ec0de90c.png)

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

Build the project, and then include <code>build/css/lightPivotTable.css</code> and
<code>build/js/lightPivotTable.js</code> files into your project. Usage is shown in
<code>build/example/index.html</code> example.

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

![Light pivot table](https://cloud.githubusercontent.com/assets/4989256/4876290/ce0918ea-62be-11e4-9583-fa9d78450716.png)
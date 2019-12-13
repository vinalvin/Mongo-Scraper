//Initialize Express app
var express = require("express");
var app = express();

//Set the view engine to ejs
app.set("view engine", "ejs");

//Require request and cheerio for making the scraping possible
var request = require("request");
var cheerio = require("cheerio");

var bodyParser = require("body-parser");

var ejs = require('ejs')

//Set up the Express app to handle data parsing
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//Automatically make a route for every single file in public folder
app.use(express.static(__dirname + '/public'));

//Database configuration
var mongojs = require("mongojs");
var databaseUrl = "scraper";
var collections = ["scrapedData"];
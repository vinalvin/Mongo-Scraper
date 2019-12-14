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

//Hook mongojs configuration to the db variable 
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
    console.log("Database Error:", error);
});

//Main page 
app.get('/', function(req, res) {
    var results = [];

    request.get("https://techcrunch.com/gadgets/", function(error, response, body) {

            var $ = cheerio.load(body);

            $("h2.post-block__title").each(function(i, element) {
                var title = $(element).children().text();
                var summary = $(element).parent().parent().children().eq(1).text();
                var link = $(element).children().eq(0).attr("href");

                // console.log('hi1', title)
                // console.log('hi2', summary)
                // console.log('hi3', link)

                if (link[0] == "/") {
                    link = "https://techcrunch.com/gadgets/" + link;
                }

                results.push({
                    title: title,
                    summary: summary,
                    link: link
                });
            })

            console.log("results", results)
            res.render("pages/index", {
                results: results
            })
        })
        // res.send("Scrape Sucessful");
})


function updateScrapedData(title, summary, link) {
    db.scrapedData.update({
            title: title,
            summary: summary,
            link: link
        }, {
            $set: {
                title: title,
                summary: summary,
                link: link

            }
        },
        //If set to true, creates a new document when no document matches the query criteria.
        { upsert: true },
    );
};

//Create a POST route to handle when you add the comment
app.post("/addComment", function(req, res) {
    var id = req.body.id;
    var comment = req.body.newComment;
    db.scrapedData.update({ "_id": mongojs.ObjectID(id) }, { $push: { Comments: comment } }, function(error, response) {
        if (error) {
            console.log(error)
        }
    });
    res.redirect("/savedArticle");
});

//Create a POST route to handle when you delete the comment
app.post("/deleteComment", function(req, res) {
    var comment = req.body.comment;
    var id = req.body.id;
    db.scrapedData.update({ "_id": mongojs.ObjectID(id) }, { $pull: { Comments: comment } }, function(error, result) {
        if (error) {
            console.log(error);
        } else {
            res.redirect("/savedArticle");
        }
    });
});

//Create a POST route to handle when you delete the article
app.post("/deleteArticle", function(req, res) {
    let id = req.body.id;
    db.scrapedData.remove({ _id: mongojs.ObjectID(id) }, function(error, result) {
        if (error) {
            console.log(error);
        } else {
            res.redirect("/savedArticle");
        }
    });
})

//Save the article
app.get("/savedArticle", function(req, res) {
    db.scrapedData.find(function(error, result) {
        res.render("savedArticle", { results: result });
    });
});

//Create a POST route to handle when you save the article
app.post("/saveArticle", function(req, res) {

    var title = req.body.title;
    var summary = req.body.summary;
    var link = req.body.link;

    updateScrapedData(title, summary, link);

});

//Retrieve data from database
app.get("/all", function(req, res) {
    //Find all results from the scrapedData collection in the db
    db.scrapedData.find({}, function(err, found) {
        // Throw any errors to the console
        if (err) {
            console.log(err);
        }
        //If there are no errors, send the data to the browser as json
        else {
            res.json(found);
        }
    });
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log(`Listening on PORT : ${port}`);
})
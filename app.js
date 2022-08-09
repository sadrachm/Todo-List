//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const ObjectID = require('mongodb').ObjectID;
const app = express();
const SERVERNAME = "Enter MongoDB Server";
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect(SERVERNAME, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String,
  complete: Boolean
};

const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema]
};
let something = "HELLO";

const List = mongoose.model("list", listSchema);

app.get("/:customListName", function(req, res) {
      const customListName = _.capitalize(req.params.customListName);
      List.findOne({
          name: customListName
        }, function(err, result) {
          if (!err) {
            if (!result) {
              const list = new List({
                name: customListName,
                items: []
              });
              list.save();
              res.redirect("/" + customListName);
            } else {
              let complete = [];
              let uncomplete = [];
              result.items.forEach(function(item) {
                if (item.complete === true) {
                  complete.push(item);
                }
              });
              result.items.forEach(function(item) {
                if (item.complete === false) {
                  uncomplete.push(item);
                }
              });
              // console.log(complete);
              res.render("list", {
                listTitle: result.name,
                newListItem: uncomplete,
                completeList: complete
              });
            }
          }
      });
});
    app.get("/", function(req, res) {
      Item.find({
        complete: false
      }, function(err, foundItems) {
        Item.find({
          complete: true
        }, function(err, completedItems) {
          // console.log(completedItems);
          res.render("list", {
            listTitle: "Today",
            newListItem: foundItems,
            completeList: completedItems
          });
        });

      });
    });

    app.post("/", function(req, res) {
      let itemName = req.body.newItem;
      const listName = req.body.list;
      const item = new Item({
        name: itemName,
        complete: false
      });
      if (listName === "Today") {
        item.save();
        res.redirect("/");
      } else {
        List.findOne({
          name: listName
        }, function(err, result) {
          result.items.push(item);
          result.save();
          res.redirect("/" + listName);
        });
      }
    });

    app.post("/delete", function(req, res) {
      const checkedItem = req.body.checkbox;
      const listName = req.body.listName;
      if (listName === "Today") {
        Item.findByIdAndRemove(checkedItem, function(err) {
          if (!err) {
            console.log("succesfully deleted checked item");
            res.redirect("/");
          }
        });
      } else {
        List.findOneAndUpdate({
          name: listName
        }, {
          $pull: {
            items: {
              _id: checkedItem
            }
          }
        }, function(err, foundList) {
          if (!err) {
            res.redirect("/" + listName)
          }
        });
      }
    });
    app.post("/complete", function(req, res) {
      const checkedItem = req.body.checkbox;
      const listName = req.body.listName;
      if (listName === "Today") {
        Item.findOneAndUpdate({_id: checkedItem}, {complete: true}, function(err, foundItem) {
          if (!err) {
            console.log("succesfully completed checked item");
            res.redirect("/");
          }
        });
      }
      else {
        List.find({name:listName}, function(err, found) {
          let items = found[0].items;
          let content = ""
          for (let a = 0; a < items.length; a++) {
            if (items[a]._id == checkedItem) {
              console.log(items[a]._id+" = "+checkedItem)
              const item = new Item({
                name: items[a].name,
                complete: true
              });
              List.findOne({name: listName}, function(err, result) {
                List.findOneAndUpdate({
                  name: listName},
                  {$pull: {items: {_id: checkedItem}}},
                  function(err, foundList) {
                    console.log("Deleted Original");
                  }
                );
                result.items.push(item);
                result.save();
              });
              break;
            }
          }
        res.redirect("/" + listName);
      });

  }
});
    app.get("/about", function(req, res) {
      res.render("about", {})
    });

    let port = process.env.PORT
    if (port == null || port == "") {
      port = 3000;
    }
    app.listen(port, function() {
      console.log("Server has started succesfully");
    });

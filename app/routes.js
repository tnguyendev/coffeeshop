const { url } = require("inspector");

module.exports = function (app, passport, db) {
  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get("/", function (req, res) {
    res.render("customerorder.ejs");
  });

  

  // PROFILE SECTION =========================
  app.get("/profile", isLoggedIn, function (req, res) {
    let usersCollection = [];
    let ordersCollection = [];
    db.collection("orders")
      .find()
      .toArray((err, orders) => {
        if (err) {
          return console.log(err);
        }
          for (i = 0; i < orders.length; i++) {
            ordersCollection[i] = orders[i];
          }
        db.collection("users")
          .find()
          .toArray((err, result) => {
            if (err) {
              return console.log(err);
            } else {
              for (i = 0; i < result.length; i++) {
                usersCollection[i] = result[i];
              }
            }
            res.render("profile.ejs", {
              user: req.user,
              orders: ordersCollection,
              allUsers: usersCollection,
            });
          });
      });
  });

  // LOGOUT ==============================
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });

  // message board routes ===============================================================

  app.post("/savedToDatabase", (req, res) => {
    db.collection("orders").insertOne(
      {
        coffeeChoice: req.body.coffeeChoice,
        coffeeSize: req.body.coffeeSize,
        coffeeFlavor: req.body.coffeeFlavor,
        coffeeCream: req.body.coffeeCream,
        coffeeSugar: req.body.coffeeSugar,
        customerName: req.body.customerName,
        coffeeInstructions: req.body.coffeeInstructions,
        baristaName: "",
        //create a property for the baristaName
        completed: false,
      },

      (err, result) => {
        if (err) return console.log(err);

        console.log("saved to database");
        res.redirect("/profile");
      }
    );
  });
  app.put("/savedToDatabase", (req, res) => {
    db.collection("orders").findOneAndUpdate(
      {
        coffeeChoice: req.body.coffeeChoice,
        coffeeSize: req.body.coffeeSize,
        coffeeFlavor: req.body.coffeeFlavor,
        coffeeCream: req.body.coffeeCream,
        coffeeSugar: req.body.coffeeSugar,
        customerName: req.body.customerName,
        coffeeInstructions: req.body.coffeeInstructions,
      },
      {
        $set: {
          completed: true,
          baristaName: req.user.local.email,
        },
      },
      {
        sort: { _id: -1 },
        upsert: false,
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect("/profile");
      }
    );

  });

  app.delete("/deleteOrders", (req, res) => {
    db.collection("orders").findOneAndDelete(
      { coffeeChoice: req.body.coffeeChoice, customerName:req.body.customerName },
      (err, result) => {
        if (err) return res.send(500, err);
        res.send("Message deleted!");
      }
    );
  });

  app.get("/login", function (req, res) {
    res.render("login.ejs", { message: req.flash("loginMessage") });
  });

  // process the login form
  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/login", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // SIGNUP =================================
  // show the signup form
  app.get("/signup", function (req, res) {
    res.render("signup.ejs", { message: req.flash("signupMessage") });
  });

  // process the signup form
  app.post(
    "/signup",
    passport.authenticate("local-signup", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/signup", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get("/unlink/local", isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect("/profile");
    });
  });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();

  res.redirect("/");
}

const express = require("express");
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "movieverse-college-project-secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

mongoose
  .connect("mongodb://127.0.0.1:27017/movie_content_db", {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    console.log("Connected to MongoDB movie_content_db");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

const contentSchema = new mongoose.Schema(
  {
    id: Number,
    title: String,
    type: String,
    genre: String,
    releaseYear: Number,
    language: String,
    posterUrl: String,
    description: String,
    platform: String,
    averageRating: Number
  },
  {
    collection: "movieData_552",
    strict: false
  }
);

const Content = mongoose.model("Content", contentSchema);

// Temporary local user data. Do not connect this to MongoDB yet.
let users = [];

// Temporary local review data. Do not connect this to MongoDB yet.
let reviews = [];

// Temporary local watchlist data. Do not connect this to MongoDB yet.
let watchlists = [];

let nextUserId = 1;
let nextReviewId = 1;
let nextWatchlistId = 1;

function requireLogin(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.redirect("/login");
}

function asyncHandler(routeHandler) {
  return (req, res, next) => {
    Promise.resolve(routeHandler(req, res, next)).catch(next);
  };
}

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

app.post("/signup", (req, res) => {
  const name = req.body.name.trim();
  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password;
  const emailAlreadyExists = users.some((user) => user.email === email);

  if (!name || !email || !password) {
    return res.render("signup", { error: "Please fill all signup fields." });
  }

  if (emailAlreadyExists) {
    return res.render("signup", { error: "This email is already registered. Please login." });
  }

  // Temporary local user save. Do not connect this to MongoDB yet.
  const user = {
    id: nextUserId++,
    name,
    email,
    password,
    joinedAt: new Date()
  };

  users.push(user);
  req.session.user = { id: user.id, name: user.name, email: user.email };

  return res.redirect("/movies");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null, email: "" });
});

app.post("/login", (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password;
  const user = users.find((savedUser) => savedUser.email === email && savedUser.password === password);

  if (!user) {
    return res.render("login", {
      error: "Invalid email or password.",
      email
    });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email };
  return res.redirect("/movies");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

app.get("/movies", requireLogin, asyncHandler(async (req, res) => {
  const contents = await Content.find().sort({ id: 1 }).lean();
  res.render("movies", { contents });
}));

app.get("/movies/:id", requireLogin, asyncHandler(async (req, res) => {
  const content = await Content.findOne({ id: Number(req.params.id) }).lean();
  if (!content) {
    return res.redirect("/movies");
  }

  const contentReviews = reviews.filter((review) => review.contentId === content.id);
  const isSaved = watchlists.some(
    (item) => item.userId === req.session.user.id && item.contentId === content.id
  );

  return res.render("details", {
    content,
    contentReviews,
    isSaved
  });
}));

app.post("/movies/:id/reviews", requireLogin, asyncHandler(async (req, res) => {
  const content = await Content.findOne({ id: Number(req.params.id) }).lean();
  const rating = Number(req.body.rating);
  const reviewText = req.body.reviewText.trim();

  if (content && rating >= 1 && rating <= 5 && reviewText) {
    // Temporary local review save. Do not connect this to MongoDB yet.
    reviews.push({
      id: nextReviewId++,
      contentId: content.id,
      userId: req.session.user.id,
      userName: req.session.user.name,
      rating,
      reviewText,
      createdAt: new Date()
    });
  }

  return res.redirect(`/movies/${req.params.id}`);
}));

app.post("/movies/:id/watchlist", requireLogin, asyncHandler(async (req, res) => {
  const content = await Content.findOne({ id: Number(req.params.id) }).lean();

  if (content) {
    const alreadySaved = watchlists.some(
      (item) => item.userId === req.session.user.id && item.contentId === content.id
    );

    if (!alreadySaved) {
      // Temporary local watchlist save. Do not connect this to MongoDB yet.
      watchlists.push({
        id: nextWatchlistId++,
        userId: req.session.user.id,
        contentId: content.id,
        title: content.title,
        posterUrl: content.posterUrl,
        status: "Plan to watch",
        addedAt: new Date()
      });
    }
  }

  return res.redirect("/watchlist");
}));

app.get("/watchlist", requireLogin, asyncHandler(async (req, res) => {
  const userWatchlist = watchlists.filter((item) => item.userId === req.session.user.id);
  const contentIds = userWatchlist.map((item) => item.contentId);
  const savedContents = await Content.find({ id: { $in: contentIds } }).lean();

  const savedItems = userWatchlist
    .map((item) => ({
      ...item,
      content: savedContents.find((content) => content.id === item.contentId)
    }))
    .filter((item) => item.content);

  res.render("watchlist", { savedItems });
}));

app.post("/watchlist/remove/:id", requireLogin, (req, res) => {
  watchlists = watchlists.filter(
    (item) => !(item.id === Number(req.params.id) && item.userId === req.session.user.id)
  );

  res.redirect("/watchlist");
});

app.get("/debug/movies", asyncHandler(async (req, res) => {
  const contents = await Content.find().sort({ id: 1 }).lean();
  res.json(contents);
}));

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send("Something went wrong while reading MovieVerse data.");
});

app.listen(PORT, () => {
  console.log(`MovieVerse is running at http://localhost:${PORT}`);
});

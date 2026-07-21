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

/* =====================================================
   MEMBER 1: MOVIE DATABASE

   Database: movie_content_db
   Collection: movieData_552
===================================================== */

const movieConnection = mongoose.createConnection(
  "mongodb://127.0.0.1:27017/movie_content_db",
  {
    serverSelectionTimeoutMS: 5000
  }
);

const movieConnectionPromise = movieConnection.asPromise();

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

const Content = movieConnection.model("Content", contentSchema);

/* =====================================================
   MEMBER 2: LOGIN DATABASE

   Database: login_content_db
   Collection: loginData_553
===================================================== */

const loginConnection = mongoose.createConnection(
  "mongodb://127.0.0.1:27017/login_content_db",
  {
    serverSelectionTimeoutMS: 5000
  }
);

const loginConnectionPromise = loginConnection.asPromise();

const userSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: "loginData_553"
  }
);

const User = loginConnection.model("User", userSchema);

/* =====================================================
   MEMBER 3: REVIEWS DATABASE

   Database: reviews_content_db
   Collection: reviews_524
===================================================== */

const reviewConnection = mongoose.createConnection(
  "mongodb://127.0.0.1:27017/reviews_content_db",
  {
    serverSelectionTimeoutMS: 5000
  }
);

const reviewConnectionPromise = reviewConnection.asPromise();

const reviewSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true
    },

    contentId: {
      type: Number,
      required: true
    },

    contentTitle: {
      type: String,
      required: true
    },

    userId: {
      type: Number,
      required: true
    },

    userName: {
      type: String,
      required: true
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    reviewText: {
      type: String,
      required: true,
      trim: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: "reviews_524"
  }
);

const Review = reviewConnection.model("Review", reviewSchema);

/* =====================================================
   TEMPORARY DATA

   Member 4 will connect watchlist later.
===================================================== */

let watchlists = [];

let nextWatchlistId = 1;

/* =====================================================
   HELPERS
===================================================== */

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

/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {
  res.render("home");
});

/* =====================================================
   MEMBER 2: SIGNUP
===================================================== */

app.get("/signup", (req, res) => {
  res.render("signup", {
    error: null
  });
});

app.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();

    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.render("signup", {
        error: "Please fill all signup fields."
      });
    }

    const emailAlreadyExists = await User.exists({
      email
    });

    if (emailAlreadyExists) {
      return res.render("signup", {
        error: "This email is already registered. Please login."
      });
    }

    const lastUser = await User.findOne({
      id: { $exists: true }
    })
      .sort({ id: -1 })
      .lean();

    const newUserId = lastUser
      ? Number(lastUser.id) + 1
      : 1;

    const user = await User.create({
      id: newUserId,
      name,
      email,
      password,
      joinedAt: new Date()
    });

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    return res.redirect("/movies");
  })
);

/* =====================================================
   MEMBER 2: LOGIN
===================================================== */

app.get("/login", (req, res) => {
  res.render("login", {
    error: null,
    email: ""
  });
});

app.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.render("login", {
        error: "Please enter your email and password.",
        email
      });
    }

    const user = await User.findOne({
      email,
      password
    }).lean();

    if (!user) {
      return res.render("login", {
        error: "Invalid email or password.",
        email
      });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    return res.redirect("/movies");
  })
);

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

/* =====================================================
   MOVIES
===================================================== */

app.get(
  "/movies",
  requireLogin,
  asyncHandler(async (req, res) => {
    const contents = await Content.find()
      .sort({ id: 1 })
      .lean();

    res.render("movies", {
      contents
    });
  })
);

app.get(
  "/movies/:id",
  requireLogin,
  asyncHandler(async (req, res) => {
    const contentId = Number(req.params.id);

    const content = await Content.findOne({
      id: contentId
    }).lean();

    if (!content) {
      return res.redirect("/movies");
    }

    // Member 3:
    // Reviews are now loaded from reviews_content_db -> reviews_524.
    const contentReviews = await Review.find({
      contentId: contentId
    })
      .sort({ createdAt: -1 })
      .lean();

    const isSaved = watchlists.some(
      (item) =>
        item.userId === req.session.user.id &&
        Number(item.contentId) === contentId
    );

    return res.render("details", {
      content,
      contentReviews,
      isSaved
    });
  })
);

/* =====================================================
   MEMBER 3: REVIEW LOGIC

   Reviews are now stored permanently in MongoDB:
   reviews_content_db -> reviews_524
===================================================== */

app.post(
  "/movies/:id/reviews",
  requireLogin,
  asyncHandler(async (req, res) => {
    const contentId = Number(req.params.id);

    const content = await Content.findOne({
      id: contentId
    }).lean();

    const rating = Number(req.body.rating);

    const reviewText = String(
      req.body.reviewText || ""
    ).trim();

    if (
      content &&
      rating >= 1 &&
      rating <= 5 &&
      reviewText
    ) {
      const lastReview = await Review.findOne({
        id: { $exists: true }
      })
        .sort({ id: -1 })
        .lean();

      const newReviewId = lastReview
        ? Number(lastReview.id) + 1
        : 1;

      await Review.create({
        id: newReviewId,
        contentId: content.id,
        contentTitle: content.title,
        userId: req.session.user.id,
        userName: req.session.user.name,
        rating,
        reviewText,
        createdAt: new Date()
      });
    }

    return res.redirect(`/movies/${req.params.id}`);
  })
);

/* =====================================================
   TEMPORARY WATCHLIST LOGIC

   Member 4 will connect this later.
===================================================== */

app.post(
  "/movies/:id/watchlist",
  requireLogin,
  asyncHandler(async (req, res) => {
    const contentId = Number(req.params.id);

    const content = await Content.findOne({
      id: contentId
    }).lean();

    if (content) {
      const alreadySaved = watchlists.some(
        (item) =>
          item.userId === req.session.user.id &&
          Number(item.contentId) === contentId
      );

      if (!alreadySaved) {
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
  })
);

app.get(
  "/watchlist",
  requireLogin,
  asyncHandler(async (req, res) => {
    const userWatchlist = watchlists.filter(
      (item) =>
        item.userId === req.session.user.id
    );

    const contentIds = userWatchlist.map(
      (item) => item.contentId
    );

    const savedContents = await Content.find({
      id: {
        $in: contentIds
      }
    }).lean();

    const savedItems = userWatchlist
      .map((item) => ({
        ...item,

        content: savedContents.find(
          (content) =>
            Number(content.id) ===
            Number(item.contentId)
        )
      }))
      .filter((item) => item.content);

    res.render("watchlist", {
      savedItems
    });
  })
);

app.post(
  "/watchlist/remove/:id",
  requireLogin,
  (req, res) => {
    watchlists = watchlists.filter(
      (item) =>
        !(
          item.id === Number(req.params.id) &&
          item.userId === req.session.user.id
        )
    );

    res.redirect("/watchlist");
  }
);

/* =====================================================
   DEBUG ROUTES
===================================================== */

app.get(
  "/debug/movies",
  asyncHandler(async (req, res) => {
    const contents = await Content.find()
      .sort({ id: 1 })
      .lean();

    res.json(contents);
  })
);

app.get(
  "/debug/users",
  asyncHandler(async (req, res) => {
    const users = await User.find()
      .select("-password")
      .sort({ id: 1 })
      .lean();

    res.json(users);
  })
);

app.get(
  "/debug/reviews",
  asyncHandler(async (req, res) => {
    const reviews = await Review.find()
      .sort({ id: 1 })
      .lean();

    res.json(reviews);
  })
);

/* =====================================================
   ERROR HANDLING
===================================================== */

app.use((error, req, res, next) => {
  console.error(error);

  if (error && error.code === 11000) {
    return res.status(400).send(
      "A record with the same ID already exists."
    );
  }

  return res
    .status(500)
    .send(
      "Something went wrong while reading MovieVerse data."
    );
});

/* =====================================================
   START SERVER ONLY AFTER ALL 3 DATABASES CONNECT
===================================================== */

Promise.all([
  movieConnectionPromise,
  loginConnectionPromise,
  reviewConnectionPromise
])
  .then(() => {
    console.log(
      "Connected to MongoDB movie_content_db"
    );

    console.log(
      "Connected to MongoDB login_content_db"
    );

    console.log(
      "Connected to MongoDB reviews_content_db"
    );

    app.listen(PORT, () => {
      console.log(
        `MovieVerse is running at http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB startup connection error:",
      error.message
    );

    process.exit(1);
  });
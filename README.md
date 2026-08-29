MovieVerse 🎬

MovieVerse is a web-based movie discovery and review application developed as a college MongoDB project.

The application allows users to create an account, log in, browse movie and web-series information, open a detailed content page, read and submit ratings/reviews, and maintain a personal watchlist.

The project demonstrates how a web application can use MongoDB as its database layer for movie content, user accounts, and reviews, while using Node.js, Express.js, Mongoose and EJS for the application layer and user interface.

1. Project Objective

The main objective of MovieVerse is to create a simple and interactive platform where users can:

Discover movies and other entertainment content.

View important information such as genre, language, release year, platform and rating.

Create an account and log in.

Open a detailed page for a movie or series.

Give a rating from 1 to 5 and write a review.

Add content to a personal watchlist.

Remove items from the watchlist.

Access protected pages only after login.

The project also demonstrates practical use of MongoDB collections, schemas, CRUD-style operations, data validation, relationships using IDs, and server-side rendering.

2. Why We Chose MongoDB

MongoDB is a NoSQL, document-oriented database.

For MovieVerse, MongoDB is suitable because movie information, users and reviews can be stored as flexible documents. It also allows the application to work with separate collections/databases for different modules.

In this project, Mongoose is used as an ODM (Object Data Modeling) library to define schemas and communicate with MongoDB.

3. Main Features

3.1 Home Page

The public home page introduces MovieVerse and acts as the entry point of the application.

3.2 User Registration

A new user can register using:

Name

Email

Password

The application checks whether the email is already registered before creating the user.

A new numeric user ID is generated based on the latest stored user ID.

3.3 User Login

Registered users can log in using their email and password.

After successful login:

A session is created.

User information is stored in the session.

The user is redirected to the movies page.

If the credentials are incorrect, an error message is displayed.

3.4 Logout

The logout route destroys the current session and clears the session cookie before returning the user to the home page.

3.5 Movie / Content Listing

After login, users can access the movies page.

Movie content is loaded from MongoDB and sorted by its numeric ID.

3.6 Movie Details

Each movie/content item has a detail page.

The detail page can display information such as:

Title

Content type

Genre

Release year

Language

Poster

Description

Streaming/platform information

Average rating

User reviews

3.7 Ratings and Reviews

A logged-in user can:

Select a rating from 1 to 5.

Enter a review.

Submit the review for a particular movie/content item.

Reviews are stored permanently in MongoDB in the reviews database.

3.8 Watchlist

A logged-in user can add a movie/content item to a personal watchlist.

The current watchlist implementation stores the watchlist entries in server memory. Each item contains information such as:

Watchlist ID

User ID

Content ID

Title

Poster URL

Status

Date added

The default status is "Plan to watch".

Users can also remove items from the watchlist.

Note: The code comments identify watchlist persistence as a future database module. Therefore, unlike movie content, users and reviews, the current watchlist data is not permanently stored in MongoDB.

4. Technology Stack

Technology

Purpose

Node.js

JavaScript runtime for the server

Express.js

Web server and routing

MongoDB

NoSQL database

Mongoose

MongoDB ODM and schema management

EJS

Server-side HTML rendering

express-session

Login/session management

HTML/CSS/JavaScript

Frontend and styling

5. High-Level Architecture

The basic application flow is:

User
  |
  v
Browser / Frontend
  |
  v
Express.js Server
  |
  +--------------------+
  |                    |
  v                    v
EJS Views           Application Logic
                       |
                       v
                    Mongoose
                       |
          +------------+-------------+
          |            |             |
          v            v             v
   Movie Database  Login DB     Reviews DB
          |            |             |
          v            v             v
    movieData_552  loginData_553  reviews_524

6. MongoDB Database Design

MovieVerse currently uses three MongoDB databases in the main implementation.

Database 1: movie_content_db

Collection: movieData_552

This database stores movie and entertainment content.

Movie Content Fields

Field

Type

Purpose

id

Number

Unique application-level content ID

title

String

Movie/series title

type

String

Type of content

genre

String

Genre of content

releaseYear

Number

Release year

language

String

Language

posterUrl

String

Poster/image URL

description

String

Description of the content

platform

String

Streaming/platform information

averageRating

Number

Stored average rating

The corresponding Mongoose model is Content.

Database 2: login_content_db

Collection: loginData_553

This database stores registered users.

User Fields

Field

Type

Purpose

id

Number

Unique user ID

name

String

User name

email

String

User email

password

String

User password

joinedAt

Date

Registration date/time

Important validations include:

id is required and unique.

email is required and unique.

Name is required.

Email is converted to lowercase.

Input values are trimmed where appropriate.

The corresponding Mongoose model is User.

Database 3: reviews_content_db

Collection: reviews_524

This database stores user reviews and ratings.

Review Fields

Field

Type

Purpose

id

Number

Unique review ID

contentId

Number

ID of the movie/content being reviewed

contentTitle

String

Title of the reviewed content

userId

Number

ID of the user who submitted the review

userName

String

Name of the reviewer

rating

Number

Rating from 1 to 5

reviewText

String

Written review

createdAt

Date

Review creation date/time

The corresponding Mongoose model is Review.

The rating is validated so that only values from 1 to 5 are accepted.

7. Relationship Between Data

MovieVerse uses numeric IDs to connect information across modules.

Example:

User
  userId = 12

        |
        | writes review
        v

Review
  userId = 12
  contentId = 5

        |
        | points to
        v

Content
  id = 5
  title = Example Movie

This is a practical example of linking documents in a NoSQL application using application-level IDs.

8. Application Modules

Module 1 — Movie Database

Responsibilities:

Connect to movie_content_db.

Work with movieData_552.

Define the movie/content schema.

Fetch all movie/content records.

Fetch a single movie/content record by ID.

Module 2 — Login / User Management

Responsibilities:

Connect to login_content_db.

Work with loginData_553.

Register users.

Check for duplicate emails.

Validate login credentials.

Create user sessions.

Logout and destroy sessions.

Module 3 — Reviews

Responsibilities:

Connect to reviews_content_db.

Work with reviews_524.

Fetch reviews for a selected movie.

Validate ratings from 1 to 5.

Store new reviews permanently in MongoDB.

Generate the next application-level review ID.

Module 4 — Watchlist

Responsibilities:

Add selected content to the user's watchlist.

Prevent duplicate watchlist entries for the same user and content.

Display saved content.

Remove a watchlist item.

Current status: watchlist data is stored in server memory rather than a permanent MongoDB collection.

9. Authentication and Session Flow

MovieVerse uses express-session for login state.

The process is:

1. User opens Login / Signup
              |
              v
2. User enters credentials
              |
              v
3. Server checks MongoDB
              |
       +------+------+
       |             |
     Valid         Invalid
       |             |
       v             v
Create session    Show error
       |
       v
Redirect to /movies

Protected routes use a middleware called requireLogin.

If no active session is found, the user is redirected to the login page.

10. Important Routes

Method

Route

Purpose

GET

/

Home page

GET

/signup

Registration form

POST

/signup

Create a user

GET

/login

Login form

POST

/login

Authenticate user

GET

/logout

Destroy session and logout

GET

/movies

Display movie/content listing

GET

/movies/

Display content details

POST

/movies//reviews

Submit rating/review

POST

/movies//watchlist

Add content to watchlist

GET

/watchlist

Display current user's watchlist

POST

/watchlist/remove/

Remove item from watchlist

There are also development/debug routes for viewing stored movie, user and review data while testing the application.

11. Validation and Error Handling

MovieVerse includes basic validation and server-side error handling.

Examples:

Empty signup fields are rejected.

Duplicate email registration is rejected.

Login requires email and password.

Invalid login credentials show an error.

Review ratings must be between 1 and 5.

Empty review text is rejected.

Duplicate database IDs are handled with MongoDB duplicate-key error handling.

Database connections are established before the server starts.

An asyncHandler helper is used to forward asynchronous route errors to the Express error handler.

12. MongoDB Connection Strategy

The application creates MongoDB connections for the different project modules.

The main connection targets are:

mongodb://127.0.0.1:27017/movie_content_db
mongodb://127.0.0.1:27017/login_content_db
mongodb://127.0.0.1:27017/reviews_content_db

The server starts only after the required MongoDB connections have successfully connected.

If a database connection fails during startup, the application reports the error and stops instead of running in a broken state.

13. Suggested Project Structure

The application follows a simple Express + EJS structure similar to:

MovieVerse/
│
├── app.js
├── package.json
│
├── views/
│   ├── home.ejs
│   ├── signup.ejs
│   ├── login.ejs
│   ├── movies.ejs
│   ├── details.ejs
│   └── watchlist.ejs
│
└── public/
    ├── css/
    ├── js/
    └── images/

The exact filenames can vary depending on the final project folder.

14. How to Run the Project

Step 1 — Install Node.js

Install a recent Node.js version on the system.

Step 2 — Install MongoDB

Make sure MongoDB is installed and the local MongoDB server is running.

The project uses the local MongoDB address:

mongodb://127.0.0.1:27017/

Step 3 — Open the project

Open the MovieVerse project folder in VS Code or another code editor.

Step 4 — Install dependencies

Run:

npm install

If dependencies are not already listed in package.json, the main packages required by the implementation are:

npm install express mongoose ejs express-session

Step 5 — Start the application

Run the project's Node.js entry file, for example:

node app.js

The application runs at:

http://localhost:3000

15. Example User Flow

A normal user journey is:

Open MovieVerse
      |
      v
Home Page
      |
      v
Signup / Login
      |
      v
Movies Page
      |
      v
Select a Movie
      |
      +------------------+
      |                  |
      v                  v
Read Details        Add to Watchlist
      |
      v
Write Rating + Review
      |
      v
Review Stored in MongoDB

16. Example of a Review Document

A review can conceptually look like:

{
  "id": 1,
  "contentId": 5,
  "contentTitle": "Example Movie",
  "userId": 12,
  "userName": "Example User",
  "rating": 5,
  "reviewText": "Great movie and very enjoyable.",
  "createdAt": "2026-08-29T00:00:00.000Z"
}

17. What We Demonstrated Through This Project

This project demonstrates practical concepts including:

NoSQL database design.

MongoDB databases and collections.

Mongoose schemas and models.

CRUD-style database operations.

User authentication.

Session management.

Data validation.

Express routing.

Server-side rendering with EJS.

Linking related documents using IDs.

Handling asynchronous database operations.

Error handling.

Team-based modular development.

18. Current Implementation Status

Completed

Home page.

Signup.

Login.

Logout.

Session-based access control.

Movie/content database.

Movie/content listing.

Movie detail page.

MongoDB-backed reviews.

1–5 rating validation.

Watchlist add/view/remove flow.

Error handling.

MongoDB startup connection checks.

Debug endpoints for development/testing.

Current Limitation

The watchlist is currently maintained in application memory rather than in a permanent MongoDB collection. This means watchlist data can be lost when the Node.js server restarts.

Possible Future Improvements

Store watchlists permanently in MongoDB.

Hash passwords using a password-hashing library such as bcrypt.

Add search and advanced filters.

Add pagination for large movie collections.

Calculate/update average ratings automatically from reviews.

Add admin functionality for managing movie content.

Deploy the application using a hosted MongoDB service.

The MovieVerse implementation also divides its major database work into modules:

Module

Main Responsibility

Member 1

Movie / Content Database

Member 2

Login / User Database

Member 3

Reviews Database

Member 4

Watchlist Module

The six-member team structure above covers the broader project responsibilities, while these four module assignments describe the core database-oriented implementation.

21. Conclusion

MovieVerse is a practical full-stack college project that combines a web interface with MongoDB-based data management.

The project demonstrates how separate application modules can work together:

Users
  ↓
Authentication
  ↓
Movie Content
  ↓
Movie Details
  ↓
Ratings & Reviews
  ↓
Personal Watchlist

The main learning outcome of the project is understanding how a Node.js web application communicates with MongoDB and how different collections can be used to manage different types of application data.

Project Name: MovieVerse

Team Name: The Architects

Primary Database: MongoDB

Backend: Node.js + Express.js

Database Layer: MongoDB + Mongoose

Template Engine: EJS

Status: Functional college project with future enhancement scope

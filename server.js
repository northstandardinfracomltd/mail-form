
// Utilities we need
const fs = require("fs");
const path = require("path");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// Formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

// We use a module for handling database operations in /src
const data = require("./src/data.json");
const db = require("./src/" + data.database);

/**
 * Home route for the app
 *
 * Return the poll options from the database helper script
 * The home route may be called on remix in which case the db needs setup
 *
 * Client can request raw data using a query parameter
 */
fastify.get("/", async (request, reply) => {
  /* 
  Params is the data we pass to the client
  - SEO values for front-end UI but not for raw data
  */
  let params = request.query.raw ? {} : { seo: seo };

  // ADD PARAMS FROM TODO HERE

  // Send the page options or raw JSON data if the client requested it
  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/index.hbs", params);
});

/**
 * Post route to process user vote
 *
 * Retrieve vote from body data
 * Send vote to database helper
 * Return updated list of votes
 */
fastify.post("/", async (request, reply) => {
  // We only send seo if the client is requesting the front-end ui
  let params = request.query.raw ? {} : { seo: seo };

  // Flag to indicate we want to show the poll results instead of the poll form
  params.results = true;
  let options;
  
  // if 
  // phone
  // requirements
  // choix
  
  let r = await db.saveRequest(request.body);
  console.log(r);
  
  // console.log(request.body);

  // We have a vote - send to the db helper to process and return results
  // if (request.body.language) {
  //   options = await db.processVote(request.body.language);
  //   if (options) {
  //     // We send the choices and numbers in parallel arrays
  //     params.optionNames = options.map((choice) => choice.language);
  //     params.optionCounts = options.map((choice) => choice.picks);
  //   }
  // }
  // params.error = options ? null : data.errorMessage;

  // Return the info to the client
  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/index.hbs", params);
});

/**
 * Admin endpoint returns log of votes
 *
 * Send raw json or the admin handlebars page
 */
fastify.get("/logs", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };

  // Get the log history from the db
  params.optionHistory = await db.getRequests();

  // Let the user know if there's an error
  params.error = params.optionHistory ? null : data.errorMessage;

  // Send the log list
  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/admin.hbs", params);
});

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);


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
  let params = {};

  params.results = true;
  params.inputErrors = [];
  let options;
  
  let requestData = {
    email: request.body.email,
    phone: request.body.phone,
    requirements: request.body.requirements,
    category: request.body.choix,
  };
  
  let inputErrors = [];
  if (!requestData.email) {
    inputErrors.push('Must specify your Email');
  }
  if (!requestData.phone) {
    inputErrors.push('Must specify your Phone Number');
  }
  if (!requestData.requirements) {
    inputErrors.push('Must specify your requirements and ideas');
  }
  if (!requestData.category) {
    inputErrors.push('Must choose a Category');
  }
  
  if (inputErrors.length == 0) {
    let r = await db.saveRequest(request.body);
    console.log(r);
    params.errors = r ? [] : [data.errorMessage]
  } else {
    params.errors = inputErrors
  }

  // Return the info to the client
  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/index.hbs", params);
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

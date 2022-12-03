// Main server file
"use strict";
const express = require("express")
const path = require("path");

const files = require("./api/files");
const users = require("./api/users");
const links = require("./api/url");
const auth = require("./middleware/auth");
const csrf = require("./middleware/csrf");
const ratelimit = require("./middleware/ratelimit");

const { errorHandler, print } = require("./util");
const bodyParser = require("body-parser");
const cookie = require("cookie-parser");
const { version } = require("../package");

const app = express();

// Global middleware
app.set("view engine", "ejs");
app.enable("trust proxy");
app.use(bodyParser.json({ limit: '100mb' }));
app.use(cookie());
app.set("x-powered-by", false);

// Client
const client = path.join(__dirname, "client");
const pages = path.join(client, "pages");
app.use("/css", express.static(path.join(client, "css")));
app.use("/js", express.static(path.join(client, "js")));
app.use("/favicon.ico", express.static(path.join(client, "favicon.ico")));

let limit = 1000;
if (process.env.ratelimit !== undefined) {
	limit = parseInt(process.env.ratelimit, 10);
}

// Routes
// Global rate limit per minute
app.use(ratelimit(limit, 60));

const imgur = require("./api/imgur"); // Teste para a nova api
app.get("/imlinks", async (req, res) => { 
	res.render(getLoc("imlinks"), {})
});

app.use("/api/files", files.router);
app.use("/api/links", links);
app.use("/api/imgur", imgur);

app.use(csrf);
app.use("/api/imgur", imgur); 
app.use("/api/users", users);
app.use("/api/links", links);
app.use("/r", links);
app.use("/im", imgur);

// Main routes
const getLoc = (n) => path.join(pages, `${n}.ejs`);
app.get("/", (req, res) => {
	const runningHours = process.uptime() / (60 * 60);
	print("Index", "Não tem usuário aqui", req)
	return res.render(getLoc("index"), {
		runningFor: (Math.floor(runningHours * 10) / 10), // uptime in hours, rounded to 1 decimal
		version
	});
});

app.get("/login", (req, res) => res.render(getLoc("login")));
app.post("/login", (req, res) => res.render(getLoc("login")));


app.use("/dashboard", auth.redirect);
app.get("/dashboard", async (req, res) => {
	res.render(getLoc("dashboard"), {
		user: {
			username: req.user.username,
			isAdmin: req.user.isAdmin
		}
	});
	if (req.user.username) {
		print("Dashboard", req.user.username, req)
	}
});

app.use("/encurtar", auth.redirect);
app.get("/encurtar", async (req, res) => {
	if (req.user.username) {
		print("Encurtar", req.user.username, req)
	}
	res.render(getLoc("encurtar"));
});

app.get("/:id", files.getFile);

// Error handling
app.use(errorHandler);
app.use(function (_req, res) {
	print("404", "Não tem usuário aqui", _req)
	res.status(404).render(getLoc(404));
});

process.on("uncaughtException", err => {
	console.error("Tem um erro inesperado:", err);
});

module.exports = function (port = 80) {
	app.listen(port, () => console.log(`Estou rodando na porta: ${port}!`));
	app.set("port", port);
};

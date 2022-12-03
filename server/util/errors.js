// Exports common errors and the generic error handling middleware.
const ejs = require("ejs");
const path = require("path");

// "Unfriendly" error messages.
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, _next) {
	if (error instanceof SyntaxError) {
		res.status(400).send(errorGenerator(400, "Bad JSON."));
	} else {
		console.error("Error catch", error);
		res.status(error.status || 500);
		res.send(errorGenerator(500, error.message));
	}
}

// Takes inputs and returns a standard error object. Additional is an object whose properties are merged into the error object.
function errorGenerator(status, message, additional) {
	return {
		error: {
			status,
			message,
			...additional
		}
	};
}

const errorPage = path.join(__dirname, "..", "client", "pages", "error.ejs");

function prettyError(status, message) {
	return new Promise((resolve, reject) => {
		ejs.renderFile(errorPage, {
			code: status,
			message
		}, {}, function (err, str) {
			if (err) return reject(err);
			resolve(str);
		});
	});
}

/*
  This is an error wrapper. It wraps express route functions and catches any async errors that are thrown.
  (i.e. the promise rejects)
  It then passes this error along to the global error handler so it can be dealt with consistently,
  by returning a 500.
 */
const errorCatch = (fn) =>
	(req, res, next) => {
		const routePromise = fn(req, res, next);
		if (routePromise && routePromise.catch) {
			routePromise.catch((err) => {
				next(err);
				console.log("Erro de rota detectado", err.message);
			});
		}
	};

// Contains common errors
const errors = {
	unauthorized: errorGenerator(401, "Não autorizado: faça o login ou forneça o token de autorização."),
	forbidden: errorGenerator(403, "Proibido. Você não tem acesso a esse recurso."),
	notFound: errorGenerator(404, "Pagina não encontrada."),

	notImplemented: errorGenerator(501, "Não implementado.")
};

module.exports = { errorHandler, errorGenerator, errors, errorCatch, prettyError };

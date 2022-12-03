// User handler
// While called "id", the "id" actually refers to a user's username, as this is what we use to uniquely identify a user.
const express = require("express");
const users = express.Router();
const auth = require("../middleware/auth");
const db = require("../util/db");
const {
	errorGenerator,
	errorCatch,
	generateToken,
	errors,
	dest,
	hashRounds,
	adminUser,
	getBase,
	print
} = require("../util");
const { isLength, isAlphanumeric, isEmpty } = require("validator");
const { compare, hash } = require("bcrypt");
const fs = require("fs");
const path = require("path");

const BIG = 1000000;

const validUsername = (str) => str && typeof str === "string" && isLength(str, {
	min: 3,
	max: 50
}) && isAlphanumeric(str);
const validPassword = (str) => str && typeof str === "string" && isLength(str, {
	min: 3,
	max: 100
});
users.post("/login", errorCatch(async function (req, res) {
	const username = req.body.username;
	const password = req.body.password;
	if (validUsername(username)) {
		if (!validPassword(password)) {
			return res.status(400).send(errorGenerator(400, "Senha inválida: Deve ter menos de 100 caracteres."));
		}

		// It passes all checks
		const user = await db.getUser(username);
		if (user && user.password) {
			const correct = await compare(password, user.password);
			if (correct) {
				if (user.token) {
					// They have a token. Return it.
					res.cookie("authorization", user.token, {
						httpOnly: true,
						/* A week */
						expires: new Date(Date.now() + 604800000),
						secure: req.secure || false,
						sameSite: "Lax"
					});
					return res.send({ success: true, message: "Logado." });
				} else {
					// No token - generate.
					const token = await generateToken();
					await db.setToken(user.username, token);
					res.cookie("authorization", token, {
						httpOnly: true,
						/* A week */
						expires: new Date(Date.now() + 604800000),
						secure: req.secure || false,
						sameSite: "Lax"
					});
					return res.send({ success: true, message: "Logado." });
				}
			} else {
				return res.status(403).send(errorGenerator(403, "Proibido: Nome de usuário ou senha inválidos."));
			}
		} else {
			return res.status(404).send(errorGenerator(404, "Usuário não encontrado."));
		}
	} else {
		return res.status(400).send(errorGenerator(400, "Nome de usuário Inválido."));
	}
}));

users.use(auth);

users.get("/", errorCatch(async function (req, res) {
	const users = await db.getUsers();
	res.send({ users, success: true });
}));

// Create is an authenticated route - only the root user can do it.
users.post("/create", errorCatch(async function (req, res) {
	if (!req.user || !req.user.isAdmin) {
		return res.status(403).send(errors.forbidden);
	}
	const username = req.body.username;
	const password = req.body.password;
	if (validUsername(username)) {
		if (!validPassword(password)) {
			return res.status(400).send(errorGenerator(400, "Senha inválida. - Deve ser > 3 e < 50."));
		}

		// It passes all checks
		const user = await db.getUser(username);
		if (user) {
			return res.status(404).send(errorGenerator(400, "O nome de usuário já está em uso."));
		} else {
			const hashed = await hash(password, hashRounds);
			await db.addUser(username, hashed);
			res.send({ success: true, username });
		}
	} else {
		return res.status(400).send(errorGenerator(400, "Nome de usuário Inválido."));
	}
}));

// Routes for root account or @me.
users.use("/:id/", async function (req, res, next) {
	const { id } = req.params;
	if (id) {
		if (id === "@me") {
			req.target = req.user;
			return next();
		} else {
			if (!isEmpty(id) && isAlphanumeric(id)) {
				const user = await db.getUser(id);

				if (user) {
					req.target = user;

					if (user.username === adminUser) {
						user.isAdmin = true;
					}
					if (req.target.username !== req.user.username) {
						// isAdmin is added by the auth middleware
						if (req.user.isAdmin) {
							return next();
						} else {
							// They're not admin, but trying to edit another user. no!
							return res.status(403).send(errors.forbidden);
						}
					} else {
						return next();
					}
				} else {
					return res.status(404).send(errorGenerator(404, "Usuário não encontrado."));
				}
			} else {
				return res.status(400).send(errorGenerator(400, "Nome de usuário Inválido."));
			}
		}
	} else {
		throw new Error("No id on user middleware... what?");
	}
});

users.delete("/:id", errorCatch(async function (req, res, next) {
	if (req.target.isAdmin) {
		return res.status(400).send(errorGenerator(400, "O usuário administrador não pode ser excluído."));
	}

	const deleteFiles = req.query.deleteFiles && req.query.deleteFiles === "true";

	const files = await db.getAllUserFiles(req.target.username);
	if (deleteFiles) {
		console.log(`Excluindo o usuário ${req.target.username} E todos os seus arquivos.`);
	}

	for (const file of files) {
		const loc = `${file.id}${file.extension ? `.${file.extension}` : ""}`;
		if (deleteFiles) {
			fs.unlink(path.join(dest, loc), (err) => {
				if (err) {
					if (err.code === "ENOENT") {
						console.log(`Tentei deletar o arquivo ${loc} mas já foi removido.`);
					} else {
						return next(err);
					}
				}
			});
		} else {
			await db.setFilesOwner(req.target.username, adminUser);
		}
	}

	await db.removeUser(req.target.username);

	res.send({ success: true, message: "User deleted." });
	print(`${req.user.username} esta deletando ${req.target.username}`, `${req.user.username}`, req )
}));

users.get("/:id/config", errorCatch(async function (req, res) {
	// Generate config
	const isLink = req.query.link && req.query.link === "true";
	const urlBase = `${getBase(req)}/api`;
	let token = req.target.token;
	if (!token) {
		token = await generateToken();
		await db.setToken(req.target.username, token);
	}
	const config = {
		Version: "12.4.1",
		Headers: {
			Authorization: token
		},
		RequestMethod: "POST",
		URL: "$json:url$",
	};
	if (isLink) {
		config.Name = `${req.hostname} ${req.target.username} URL service`;
		config.DestinationType = "URLShortener, URLSharingService";
		config.RequestURL = `${urlBase}/links`;
		config.Headers["shorten-url"] = "$input$";
	} else {
		config.Name = `${req.hostname} ${req.target.username} Upload`;
		config.DestinationType = "ImageUploader, TextUploader, FileUploader";
		config.RequestURL = `${urlBase}/files`;
		config.Body = "MultipartFormData";
		config.FileFormName = "files";
		config.URL = "$json:url$";
		config.ThumbnailURL = "$json:url$";
		config.DeletionURL = "$json:deletionUrl$";
	}
	res.set({ "Content-Disposition": `attachment; filename="${req.target.username} ${isLink ? "Link shorten" : "Upload"}.sxcu"` });
	res.setHeader("content-type", "application/sxcu");
	const stringified = JSON.stringify(config, null, "\t");
	res.send(stringified);
	print(`${req.user.username} um arquivo de configuração para ${req.target.username}`, `${req.user.username}`, req )
}));

users.patch("/:id/password", errorCatch(async function (req, res) {
	// ID being @me or an ID.
	// Allows the user to change password by providing current password, or if root by force.
	const { newPassword, oldPassword } = req.body;
	if (validPassword(newPassword)) {
		if (!req.user.isAdmin) {
			// They are not admin, so we need to make sure they supplied correct current password
			if (validPassword(oldPassword)) {
				if (!req.target.password) {
					throw new Error("A senha do usuário de destino não está definida. Isso não deveria ser possível.");
				}
				const correct = await compare(oldPassword, req.target.password);
				if (!correct) {
					return res.status(403).send(errorGenerator(403, "Senha atual incorreta!"));
				}
			} else {
				return res.status(400).send(errorGenerator(400, "Senha antiga inválida."));
			}
		}
		// they are good - either admin or provided correct pass.
		const hashed = await hash(newPassword, hashRounds);
		await db.setPassword(req.target.username, hashed);
		print(`${req.user.username} esta criando uma senha para ${req.target.username}`, `${req.user.username}`, req )
		return res.send({ success: true, updatedUser: req.target.username });
	} else {
		return res.status(400).send(errorGenerator(400, "Nova senha inválida ou não fornecida."));
	}
}));

users.patch("/:id/token", errorCatch(async function (req, res) {
	// ID being @me or an ID.
	// Allows the user to generate a new token
	const newToken = await generateToken();
	await db.setToken(req.target.username, newToken);
	if (req.user.username === req.target.username) {
		res.cookie("authorization", newToken, {
			httpOnly: true,
			/* A week */
			expires: new Date(Date.now() + 604800000),
			secure: req.secure || false,
			sameSite: "Lax"
		});
	}
	print(`${req.user.username} esta gerando um token para ${req.target.username}`, `${req.user.username}`, req )
	return res.send({ success: true, token: newToken });
}));

users.post("/:id/logout", errorCatch(async function (req, res) {
	if (req.user.username === req.target.username) {
		res.cookie("authorization", "", {
			httpOnly: true,
			/* Expired */
			expires: new Date(Date.now() - 604800000),
			secure: req.secure || false,
			sameSite: "Lax"
		});
	}
	print(`${req.user.username} esta dando Log out de ${req.target.username}`, `${req.user.username}`, req )
	return res.send({ success: true });
}));

users.get("/:id/files", errorCatch(async function (req, res) {
	let pageNo = 0;

	if (req.query.page && !isNaN(req.query.page)) {
		try {
			const no = parseInt(req.query.page, 10);
			if (typeof no === "number" && no >= 0 && no < BIG) {
				pageNo = no;
			} else {
				return res.status(400).send(errorGenerator(400, "Invalid page number."));
			}
		} catch (err) {
			return res.status(400).send(errorGenerator(400, "Invalid page number."));
		}

	}

	const files = await db.getUserFiles(req.target.username, pageNo);
	res.send({ success: true, files });
	print(`Esta carregando pagina ${req.query.page} com: ${files.length} arquivos de ${req.target.username}`, `${req.user.username}`, req )
}));

users.get("/:id/links", errorCatch(async function (req, res) {
	const links = await db.getLinks(req.target.username);
	res.send({ success: true, links: links || [] });
	print(`Esta carregando paginas de links com: ${links.length} de ${req.target.username}`, `${req.user.username}`, req )
}));

module.exports = users;



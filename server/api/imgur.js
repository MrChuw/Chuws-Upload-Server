const express = require("express");
const url = express.Router();
const { findByTag, createTag } = require('../util/mongoo');
const path = require("path");
const crypto = require('crypto');
const { errorCatch, errorGenerator, generateFileName, prettyError, getBase, print } = require("../util");
const csrf = require("../middleware/csrf");
const auth = require("../middleware/auth");
const bodyParser = require("body-parser");

// Defina a rota para a nossa API
url.get('/:tag', errorCatch(async (req, res, next) => {
	// Obtenha a tag a partir do parâmetro de URL
	const tag = req.params.tag;
	// Consulte o banco de dados para encontrar o documento com a tag especificada
	try {
		const result = await findByTag(tag);
		let links = result.links

		if (typeof links === 'string') {
			// O valor é uma string
			links = links
		} else if (Array.isArray(links)) {
		// O valor é um array
			links = links.join(" ")
		}

		let caminho = path.join(__dirname, "..", "client", "pages", "ibages.ejs")
		print(`Abrindo.`, ` ${getBase(req)}/im/${tag}`, req )
		return res.render(caminho, {
		links: links,
		});

	} catch (err) {
		// Trate o erro aqui
		next(err);
	}
	// Se não encontrarmos o documento, retorne um erro
	res.status(404).render({ error: 'Tag not found' });

}));

async function processAddLink(req, res) {
	if (!req.user) {
		throw new Error("no user...?");
	}
	// Obtenha a tag e os links a partir do corpo da solicitação
	const tag = crypto.randomBytes(5).toString('hex');
	const links = req.body.links;

	// Crie um novo documento no banco de dados com a tag e os links fornecidos
	try {
		await createTag(tag, links);
		print(`Criando imgur pela api.`, `${req.user.username} ${getBase(req)}/im/${tag}`, req )
		res.send({ success: true, url: `${getBase(req)}/im/${tag}` });
	} catch (err) {
	// Trate o erro aqui
	next(err);
}
};

url.post("/", auth.header, errorCatch(processAddLink));

url.use(bodyParser.json());
url.use(auth);
url.use(csrf);



module.exports = url;



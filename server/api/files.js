const express = require("express");
const files = express.Router();
const {
	errorCatch,
	generateFileName,
	errorGenerator,
	dest,
	prettyError,
	validFile,
	getBase,
	print
} = require("../util");
const multer = require("multer");
const db = require("../util/db");
const auth = require("../middleware/auth");
const csrf = require("../middleware/csrf");
const ratelimit = require("../middleware/ratelimit");
const fs = require("fs");
const path = require("path");
const { isAlphanumeric, isLength, isAscii } = require("validator");

// Max size of extension (dot and all, i.e. .png, .jpeg)
// This is used in validation and just increases the total length of the valid token.
const DEFAULT_FILE_NAME_LENGTH = 6;
const MAX_EXTENSION_SIZE = 8;

let fileNameLength = DEFAULT_FILE_NAME_LENGTH;

// Get file name length
if (process.env.nameLength) {
	if (!isNaN(process.env.nameLength)) {
		const envNameLength = parseInt(process.env.nameLength, 10);
		if (envNameLength > 1 && envNameLength <= 40) {
			fileNameLength = envNameLength;
		} else {
			console.warn('Aviso: nameLength regeitado para variável env - Deve ser entre 1 e 40. Valor ${envNameLength}');
		}
	}
}

// Multer options
const storage = multer.diskStorage({
	destination: dest,
	filename: async function (req, file, cb) {
		const tok = await generateFileName(fileNameLength);
		file._tok = tok;

		// Extract extension
		const split = file.originalname.split(".");
		if (split.length !== 1) {
			const ext = split[split.length - 1];

			if (ext.length > 5) {
				return cb(null, tok);
			} else {
				file._ext = ext;
				cb(null, `${tok}.${ext}`);
			}
		} else {
			// There is no extension
			cb(null, tok);
		}
	}
});
const removeExt = (str) => str.substring(0, str.indexOf("."));
const upload = multer({
	storage: storage,
	limits: {
		fileSize: 10000000
	}
});
const extensions = ["md", "js", "py", "ts", "Lua", "cpp", "c", "bat", "h", "pl", "java", "sh", "swift", "vb", "cs", "haml", "yml", "markdown", "hs", "pl", "ex", "yaml", "jsx", "tsx", "txt"];

async function getFile(req, res, next) {
	const { id } = req.params;
	// Check main length with allowances for extension length.
	if (id && isLength(id, {
		min: Math.min(3, fileNameLength),
		max: Math.max(DEFAULT_FILE_NAME_LENGTH + MAX_EXTENSION_SIZE, fileNameLength + MAX_EXTENSION_SIZE)
	}) && isAscii(id)) {
		const without = removeExt(req.params.id);
		const idStr = (without === "" ? req.params.id : without);
		if (!isAlphanumeric(idStr)) {
			return res.status(400).send(prettyError(400, "Você providenciou um identificador de arquivo invalido, ele deve ser alfanumérico."));
		}
		if (idStr.length > fileNameLength) {
			return res.status(400).send(prettyError(400, "Nome do arquivo muito grande."));
		}

		const file = await db.getFile(idStr); // aqui é onde pega o arquivo, o resto é so processar o requerimento.
		if (req.headers.referer != `${getBase(req)}/dashboard`) {
			if (["404", "error"].includes(req.params.id)){
				print("Abrindo".concat(" | ", `${getBase(req)}/${req.params.id}`), "404", req)}
			} else {
				print("Abrindo".concat(" | ", `${getBase(req)}/${req.params.id}`), "dono:".concat(" ", file.owner), req)}
		if (!req.headers.referer) {
			print("Abrindo".concat(" | ", `${getBase(req)}/${req.params.id}`), "dono:".concat(" ", file.owner), req)
		}
		if (file) {
			const loc = `${file.id}${file.extension ? `.${file.extension}` : ""}`; // aqui cria a extensao do arquivo

			if (file.extension && extensions.includes(file.extension.toLowerCase()) && !req.query.download) {
				const content = await openFile(path.join(dest, loc));
				let teste = path.join(__dirname, "..", "client", "pages", "document.ejs")
				return res.render(path.join(__dirname, "..", "client", "pages", "document.ejs"), {
					content: content,
					isRendered: (file.extension.toLowerCase() === "md" || file.extension.toLowerCase() === "markdown"),
					fileName: loc,
					owner: file.owner,
					// Technically someone could try to pretend to be logged in,
					// but all they get to see is a delete button. Nothing gained.
					isUser: !!req.cookies.authorization
				});
			}

			const options = {
				root: dest
			};
			res.sendFile(loc, options, function (err) { // aqui continua
				if (err) {
					next(err);
				}
			});} 
		else {
			// 404
			next();
		}}
	else {
		res.status(400).send(await prettyError(400, "Você providenciou um identificador de arquivo invalido."));}
}

files.get("/:id", errorCatch(getFile));


// Supports uploading multiple files, even though ShareX doesn't.
files.post("/", ratelimit(60, 10));
files.post("/", auth.header, upload.array("files", 10), errorCatch(async function (req, res) {
	if (!req.user) {
		return console.log("what??");
	}
	if (req.files && req.files.length !== 0) {
		for (const file of req.files) {
			db.addFile(file._tok, file._ext || undefined, req.user.username);
		}
		const base = getBase(req);
		res.send({
			url: `${base}/${req.files[0].filename}`,
			deletionUrl: `${base}/dashboard`

		});
	} else {
		res.status(400).send(errorGenerator(400, "Não foi identificado upload de nenhum arquivo!"));
	}
	print("Criando".concat(": ", `${getBase(req)}/${req.files[0].filename}`), req.user.username, req)
}));
files.use(csrf);
files.use(auth);
files.delete("/:id", errorCatch(async function (req, res, next) {
	if (req.params.id && validFile(req.params.id)) {
		const without = removeExt(req.params.id);
		const idStr = (without === "" ? req.params.id : without);

		const file = await db.getFile(idStr);
		const loc = `${file.id}${file.extension ? `.${file.extension}` : ""}`;
		print("Deleteando".concat(": ", loc ), req.user.username.concat(" de ", file.owner), req)

		if (file) {
			if ((file.owner === req.user.username) || req.user.isAdmin) {
				await db.removeFile(file.id);
				const loc = `${file.id}${file.extension ? `.${file.extension}` : ""}`;

				fs.unlink(path.join(dest, loc), (err) => {
					if (err) {
						if (err.code === "ENOENT") {
							console.log('Tentei deletar o arquivo ${loc} mas já foi removido.');
						} else {
							return next(err);
						}
					}
					return res.send({ success: true, message: "Arquivo detectado." });
				});
			} else {
				return res.status(403).send(errorGenerator(403, "Você não tem permissão para editar esse arquivo."));
			}
		} else {
			return res.status(400).send(errorGenerator(404, "Arquivo não encontrado."));
		}} 
	else {
		return res.status(400).send(errorGenerator(400, "ID de arquivo inválido."));}
}));

module.exports = {
	router: files,
	getFile
};

/*
    File recieved;
        - Name allocated
        - File extension extracted
        - Saved to database
 */
function openFile(path) {
	return new Promise(function (resolve, reject) {
		fs.readFile(path, "utf8", (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
}


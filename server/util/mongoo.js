const mongoose = require('mongoose');
const { Schema } = mongoose;

main().catch(err => console.log(err));
async function main() {
	await mongoose.connect('mongodb://127.0.0.1/chuw_serve');
}

const imgurLinkSchema = new mongoose.Schema({
  tag: String,
  links: Schema.Types.Mixed,
});

const ImgurLink = mongoose.model('imgurlinks', imgurLinkSchema);

async function findByTag(tag) {
//   const client = await connectToDatabase();
  return await ImgurLink.findOne({ tag: tag });
}

// Crie um novo documento com a tag e os links passados aqui
async function createTag(tag, links) {
//   const client = await connectToDatabase();
	const imgurLink = new ImgurLink({
		tag: tag,
		links: links
	});
	return await imgurLink.save();
}

module.exports = {
  findByTag,
  createTag
}



// const MongoClient = require('mongodb').MongoClient;

// // Conecte-se ao banco de dados usando o MongoClient
// async function connectToDatabase() {
//   const client = await MongoClient.connect('mongodb://127.0.0.1/');
//   const db = client.db('chuw_serve');
//   const Imgurlinks = db.collection('imgurlinks');
//   return Imgurlinks
// }

// async function findByTag(tag) {
// 	const Imgurlinks = await connectToDatabase()
// 	return await Imgurlinks.findOne({ tag: tag });
// }

// // Crie um novo documento com a tag e os links passados aqui
// async function createTag(tag, links) {
// 	const Imgurlinks = await connectToDatabase()
// 	return await Imgurlinks.insertOne({ tag: tag, links: links });
// }

// module.exports = {
//   findByTag,
//   createTag
// }


// const MongoClient = require('mongodb').MongoClient;

// // Conecte-se ao banco de dados usando o MongoClient
// MongoClient.connect('mongodb://127.0.0.1/', { useNewUrlParser: true }, (err, client) => {
// 	if (err) throw err;
// 	console.log("conectado ao mongo")
// 	const db = client.db('chuw_serve');
// 	const Imgurlinks = db.collection('imgurlinks');

// 	async function findByTag(tag) {
// 	return await Imgurlinks.findOne({ tag: tag });
// 	}

// 	// Crie um novo documento com a tag e os links passados aqui
// 	async function createTag(tag, links) {
// 	return await Imgurlinks.insertOne({ tag: tag, links: links });
// 	}


// 	module.exports = {
// 		findByTag,
// 		createTag
// }

// 	module.exports = {
// 		async findByTag(tag) {
// 			return await Imgurlinks.findOne({ tag: tag });
// 		},
	
// 		// Crie um novo documento com a tag e os links passados aqui
// 		async createTag(tag, links) {
// 			return await Imgurlinks.insertOne({ tag: tag, links: links });
// 		},
// 	// Verifique se já existe um documento com a tag passada aqui
// }
// });

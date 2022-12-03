const io = require('@pm2/io');

const Imgur_entradas = io.counter({
	name: 'Realtime request count',
	id: 'app/realtime/requests'
});

module.exports = {
	currentReqs,
}







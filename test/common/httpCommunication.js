'use strict';

var node = require('../node');

var httpCommunication = {
	abstractRequest: function (options, done) {
		var request = node.api[options.verb.toLowerCase()](options.path);

		request.set('Accept', 'application/json');
		request.set('version', node.version);
		request.set('nethash', node.config.nethash);
		request.set('ip', '0.0.0.0');
		request.set('port', node.config.port);

		request.expect('Content-Type', /json/);
		request.expect(200);

		if (options.params) {
			request.send(options.params);
		}

		node.debug(['> Path:'.grey, options.verb.toUpperCase(), options.path].join(' '));

		if (done) {
			request.end(function (err, res) {
				node.debug('> Response:'.grey, JSON.stringify(res.body));
				done(err, res);
			});
		} else {
			return request;
		}
	},

	// Get the given path
	get: function (path, done) {
		return this.abstractRequest({verb: 'GET', path: path, params: null}, done);
	},

	// Post to the given path
	post: function (path, params, done) {
		return this.abstractRequest({verb: 'POST', path: path, params: params}, done);
	},

	// Put to the given path
	put: function (path, params, done) {
		return this.abstractRequest({verb: 'PUT', path: path, params: params}, done);
	},

	// Adds peers to local node
	addPeers: function (numOfPeers, ip, cb) {
		var i = 0;

		node.async.whilst(function () {
			return i < numOfPeers;
		}, function (next) {

			var request = node.popsicle.get({
				url: node.baseUrl + '/peer/height',
				headers: node.generatePeerHeaders(ip, 4000)
			});

			request.use(node.popsicle.plugins.parse(['json']));

			request.then(function (res) {
				if (res.status !== 200) {
					return next(['Received bad response code', res.status, res.url].join(' '));
				} else {
					i++;
					next();
				}
			});

			request.catch(function (err) {
				return next(err);
			});

		}, function (err) {
			// Wait for peer to be swept to db
			setTimeout(function () {
				return cb(err, {});
			}, 3000);
		});
	}
};

module.exports = httpCommunication;
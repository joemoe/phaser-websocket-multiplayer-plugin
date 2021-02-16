const MESSAGE_TYPE = {
	UPDATE_OBJECT: 'update.object',
	KILL_OBJECT: 'kill.object'
}

export default class PhaserWebsocketMultiplayerPlugin extends Phaser.Plugins.BasePlugin {
	constructor(pluginManager) {
		super('PhaserWebsocketMultiplayerPlugin', pluginManager);

		this.config =  {
			broadcastInterval: 1000,
			pauseTimeout: 5000,
			deadTimeout: 15000,
			checkTimeoutsInterval: 100,
			url: null,
			autoConnect: false,
			debug: true
		};
		this.game = pluginManager.game;

		this.socket = null;
		this.name = null;
		this.id = ((1<<24)*Math.random() | 0).toString(16);
		this.localObject = null;
		this.featureExtractor = null;
		this.broadcastInterval = null;
		this.checkTimeoutsInterval = null;

		this.objectRegistry = {};
		this.objectLastseen = {};

		this.event = new Phaser.Events.EventEmitter();
	}

	init(config = {}) {
		this.config = Object.assign(this.config, config);
		if(this.config.autoConnect) this.connect();
	}

	connect(url = '') {
		if(url == '') 
			url = this.config.url;
		this.log('trying to connect');
		this.socket = new WebSocket(url);
		this.socket.addEventListener('open', this.onSocketOpen.bind(this));
		this.socket.addEventListener('message', this.onSocketMessage.bind(this));
		this.socket.addEventListener('close', this.onSocketClose.bind(this));
		this.socket.addEventListener('error', this.onSocketError.bind(this));
	}

	onSocketOpen(event) {
		this.log('socket open')
		this.event.emit('open');
		this.checkTimeoutsInterval = setInterval(this.checkTimeouts.bind(this), this.config.checkTimeoutsInterval);	
	}

	onSocketMessage(event) {
		let data = JSON.parse(event.data);
		if(data.id == this.id) return;
		switch(data.type) {
			case MESSAGE_TYPE.UPDATE_OBJECT:
				this.updateObject(data);
			break;
			case MESSAGE_TYPE.KILL_OBJECT:
				this.killObject(data.id);
			break;
		}
	}

	onSocketError(event) {

	}

	onSocketClose(event) {
		clearInterval(this.checkTimeoutsInterval);
	}

	setName(name) {
		this.name = name;
	}

	checkTimeouts() {
		let currentTime = (new Date()).getTime();
		Object.entries(this.objectLastseen).forEach(([key, value]) => {
    		if(currentTime - value > this.config.pauseTimeout)
    			this.pauseObject(key);
    		if(currentTime - value > this.config.deadTimeout)
    			this.killObject(key);
		});
	}

	pauseObject(id) {
		this.event.emit('pause', this.objectRegistry[id], id);
	}

	killObject(id) {
		this.event.emit('kill', this.objectRegistry[id], id);
		delete this.objectRegistry[id];
		delete this.objectLastseen[id];
	}

	updateObject(data) {
		if(!this.objectRegistry[data.id]) {
			this.objectRegistry[data.id] = true;
			this.event.emit('create', data.data, data.id);
			this.log('create', data.data);
		}
		if(this.objectRegistry[data.id] && this.objectRegistry[data.id] !== true)
			this.event.emit('update', this.objectRegistry[data.id], data.data, data.id);
		this.objectLastseen[data.id] = (new Date()).getTime();

	}

	track(object, featureExtractor) {
		this.localObject = object;
		this.featureExtractor = featureExtractor;
	}

	registerObject(id, object) {
		this.objectRegistry[id] = object;
	}

	startBroadcast() {
		this.broadcastInterval = setInterval(() => { this.broadcast(); }, this.config.broadcastInterval);
	}

	broadcast() {
		this.socket.send(JSON.stringify({
			type: MESSAGE_TYPE.UPDATE_OBJECT,
			id: this.id,
			data: this.featureExtractor(this.localObject)
		}));
	}

	stopBroadcast() {
		window.clearInterval(this.broadcastInterval);
	}

	log(msg, data = ' ') {
		if(this.config.debug)
			console.log('WEBSOCKET MULTIPLAYER: ' + msg, data);
	}
}

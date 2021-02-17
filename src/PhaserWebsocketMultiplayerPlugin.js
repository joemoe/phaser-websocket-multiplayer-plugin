const MESSAGE_TYPE = {
	UPDATE_OBJECT: 'update.object',
	KILL_OBJECT: 'kill.object',
	ACTION_START: 'action.start',
	ACTION_STOP: 'action.stop'

}

export default class PhaserWebsocketMultiplayerPlugin extends Phaser.Plugins.BasePlugin {
	constructor(pluginManager) {
		super('PhaserWebsocketMultiplayerPlugin', pluginManager);
		this.game = pluginManager.game;
		this.event = new Phaser.Events.EventEmitter();

		this.socket = null;
		
		this.id = ((1<<24)*Math.random() | 0).toString(16);
		this.name = null;
		
		this.localObject = null;
		this.featureExtractor = null;

		this.broadcastInterval = null;
		this.checkTimeoutsInterval = null;

		this.objectRegistry = {};
		this.objectLastseen = {};

		this.config =  {
			broadcastInterval: 1000,
			pauseTimeout: 5000,
			deadTimeout: 15000,
			checkTimeoutsInterval: 100,
			url: null,
			autoConnect: false,
			debug: false
		};
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
			case MESSAGE_TYPE.ACTION_START:
				let objects = [];

				for(let i = 0; i < data.params.length; i++) {
					if(this.objectRegistry[data.params[i]])
						objects.push(this.objectRegistry[data.params[i]]);
				}

				this.event.emit('action.start.' + data.actionType, objects);
			break;
			case MESSAGE_TYPE.ACTION_STOP:
				this.event.emit('action.stop.' + data.actionType);
			break;
		}
	}

	onSocketError(event) {
		this.event.emit('socket.error', event);
	}

	onSocketClose(event) {
		clearInterval(this.checkTimeoutsInterval);
		this.stopBroadcast();
		this.event.emit('socket.close');
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

	setName(name) {
		this.name = name;
	}


	registerObject(id, object) {
		this.objectRegistry[id] = object;
		object.setData('id', id);
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
		object.setData('id', this.id);
		this.featureExtractor = featureExtractor;
		this.registerObject(this.id, object);
	}

	startBroadcast() {
		this.broadcastInterval = setInterval(
			() => { this.broadcast(); },
			this.config.broadcastInterval
		);
	}

	broadcast() {
		this.socket.send(JSON.stringify({
			type: MESSAGE_TYPE.UPDATE_OBJECT,
			id: this.id,
			data: this.featureExtractor(this.localObject)
		}));
	}

	stopBroadcast() {
		clearInterval(this.broadcastInterval);
	}


	startAction(actionType, params = null) {
		this.socket.send(JSON.stringify({
			id: this.id,
			type: MESSAGE_TYPE.ACTION_START,
			actionType: actionType,
			params: params
		}));
	}

	stopAction(actionType) {
		this.socket.send(JSON.stringify({
			id: this.id,
			type: MESSAGE_TYPE.ACTION_STOP,
			actionType: actionType
		}));
	}


	log(msg, data = ' ') {
		if(this.config.debug)
			console.log('WEBSOCKET MULTIPLAYER: ' + msg, data);
	}
}

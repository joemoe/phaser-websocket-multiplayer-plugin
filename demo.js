import PhaserWebsocketMultiplayerPlugin from './src/PhaserWebsocketMultiplayerPlugin.js'

class DemoScene extends Phaser.Scene {
	constructor() {
		super('demo');
		this.color = "0x" + ((1<<24)*Math.random() | 0).toString(16);
	}

	preload() {
	}

	create() {
		let circle = this.add.circle(Math.random() * 200 , Math.random() * 200, 20, this.color, 1);
		circle.setData('color', this.color);
		circle.setStrokeStyle(2, 0xffffff, 1);

		circle.setInteractive();
		this.input.setDraggable(circle);

		this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
	        gameObject.x = dragX;
	        gameObject.y = dragY;
	    });

	    this.input.keyboard.on('keydown-A', function() {
	    	let children = this.children.getChildren();
	    	if(children.length < 2) return;
	    	let a = children[0];
	    	let b = children[Math.floor(Math.random() * (children.length - 2)) + 1];
	    	this.shake(a, b);
	    }, this);

		this.multiplayer.event.on('open', this.initConnection, this);
		this.multiplayer.event.on('create', this.createObject, this);
		this.multiplayer.event.on('update', this.updateObject, this);
		this.multiplayer.event.on('pause', this.pauseObject, this);
		this.multiplayer.event.on('kill', this.killObject, this);

		this.multiplayer.event.on('action.start.shake', this.shakeActionStart, this);
		this.multiplayer.event.on('action.start.stop', this.shakeActionStop, this);

		this.multiplayer.track(circle, this.featureExtractor);

		this.multiplayer.connect();



	}

	initConnection() {
		this.multiplayer.startBroadcast();
	}

	update() {
	}

	featureExtractor(object) {
		return {
			x: object.x,
			y: object.y,
			color: object.getData('color')
		}
	}

	createObject(data, id) {
		let circle = this.add.circle(data.x, data.y, 20, data.color);
		this.multiplayer.registerObject(id, circle);
	}

	updateObject(object, data) {
		object.x = data.x;
		object.y = data.y;
		object.setAlpha(1);
	}

	pauseObject(object, id) {
		object.setAlpha(0.1);
	}

	killObject(object, id) {
		object.destroy();
	}

	shakeActionStart(objects) {
		this.shake(objects[0], objects[1], false);
	}
	
	shakeActionStop(objects) {
	}

	shake(a, b, broadcast = true) {
		if(broadcast) this.multiplayer.startAction('shake', [a.getData('id'), b.getData('id')]);
		var tween = this.tweens.add({
	        targets: [a, b],
	        scaleX: 2,
	        scaleY: 2,
	        ease: 'Power1',
	        duration: 50,
	        yoyo: true,
	        repeat: 3,
	        onComplete: function () { if(broadcast) this.multiplayer.stopAction('shake')},
	        callbackScope: this
	    });
	}
}


let game = new Phaser.Game({
	parent: 'phaser',
	width: 200,
	height: 200,
	plugins: {
		global: [{
			key: 'websocket-multiplayer',
			plugin: PhaserWebsocketMultiplayerPlugin,
			mapping: 'multiplayer',
			start: true,
			data: {
				url: "wss://us-nyc-1.websocket.me/v3/1?api_key=25qjh3ruA1KmjBH9whPrIZWmiQcQTxcDB26vjL7n&notify_self"
			}
		}]
	},
	scene: [DemoScene]
});

export default game;
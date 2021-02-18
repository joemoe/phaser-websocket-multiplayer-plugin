# Phaser Websocket Multiplayer Plugin

This plugin provides low level realtime multiplayer functionality (object
synchronisation, synced actions) for the HTML5 game
framework [Phaser](https://github.com/photonstorm/phaser) using the 
[WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API).


## It allows

* game player management for open ended games
* low level game state synchronization
* low level game object synchronization
* _Soon:_ Game player management for round based games


## To achieve

* multiplayer experience in simple games or game prototypes


## It doesn't

* emphasize security
* care about server-side implementation of Game logic.

It supports Phaser in the version 3. 


## Documentation

### Installation

To set it up just download 
[src/PhaserWebsocketMultiplayerPlugin.js](https://raw.githubusercontent.com/joemoe/phaser-websocket-multiplayer-plugin/main/src/PhaserWebsocketMultiplayerPlugin.js)
and import it in your `JS` file:

```javascript
import PhaserWebsocketMultiplayerPlugin from './src/PhaserWebsocketMultiplayerPlugin.js'
```

You also need to run a simple websocket server somewhere. The easiest way to
achieve this, is to register a [PieSocket](https://www.piesocket.com/) account.
You can also set this up on your own using e.g. [websockets/ws](https://github.com/websockets/ws)
or following this [guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers).


### Configuration

To enable a Phaser game to use the plugin configure it like this:

```javascript
let game = new Phaser.Game({
	plugins: {
		global: [{
			key: 'websocket-multiplayer',
			plugin: PhaserWebsocketMultiplayerPlugin,
			mapping: 'multiplayer',
			start: true,
			data: {
				url: "wss://"				// the url of the websocket
				broadcastInterval: 200,		// the interval in milliseconds in which the state of the tracked object is broadcasted
				pauseTimeout: 5000,			// the time (milliseconds) after which a remote object becomes inactive
				deadTimeout: 15000,			// the time after which a remote object is removed
				checkTimeoutsInterval: 100,	// the interval in milliseconds how oft remote objects are checked
				autoConnect: false,			// if the connection should be established automatically
				debug: false				// if the debug mode is on
			}
		}]
	}
});
```


### Open Game Mode

In this mode each client can register an object to be tracked. There is a handler function
to extract the required features of an object. When a client receives information
about an object it wasn't aware of yet, it emits an create event.
When the client receives an update about an object it already has created it
emits an update event. When the client hasn't received an update for a given time
it emits disconnected message, when after another watermark still no update from
the object it assumes the object is dead and emits a kill
event.


### API

#### `connect(url = '')`

The websocket connection is established through the provided `url`.
If no value is provided it checks the `plugin` config.

**Parameters:**

* String `url` _optional_: WebSocket server url (`wss://...`).


#### `setName(name)`

A name for the local player can be provided. This is broadcasted with every 
message.

**Parameters:**

* String `name`: The name of the player.


#### `registerObject(id, object)`

To provide more comfort to the developer, the plugin includes the game object
in its broadcasted messages (e.g. on remote object update).
To achieve this game objects need to be registered after they have been
created.

**Parameters:**

* String `id`: The id passed in the `create` event.
* Game object `object`: The created object.


#### `track(object, featureExtractor)`

This sets the object in the game to track. The `featureExtractor` is a 
callback function that should return an object containing all data to be 
broadcasted. When called the object is passed.

An implementation of a featureExtractor could look like this:

```javascript
featureExtractor(object) {
	return {
		x: object.x,
		y: object.y,
		color: object.getData('color')
	}
}
```

**Parameters:**

* Game object `object`: The object to track.
* Function `featureExtractor`: A function or method that performs the feature extraction.


#### `startBroadcast()`

This starts broadcasting the state of the tracked object at the configured interval.


#### `stopBroadcast()`

This stops broadcasting.


#### `startAction(actionType = 'generic', objects = [])`

When other clients need to be informed about an action (e.g. shoot) this 
can be used to broadcast it. An action can have any type and the affected objects
can be passed as an array.

**Parameters:**

* String `actionType` _optional_: Type of the action. `generic` by default.
* Object `objects` _optional_: Affected objects as an array of their ids.


#### `stopAction(actionType)`

Whenever an action is done, broadcast it. (not required if actions stop themselves)


### Events

The plugin contains an `EventEmitter` in `events` which dispatches relevant events.



* `emit('socket.open', event)`: When a connection is opened.
* `emit('socket.close', event)`: When the connection is closed.
* `emit('socket.error', event)`: When there is an error.
* `emit('object.create', data, id)`: When a remote object should be created.
* `emit('object.update', object, data, id)`: When a remote object should be udpated.
* `emit('object.pause', object, id)`: When a remote object is paused due to timeout.
* `emit('object.kill', object, id)`: When a remote object is killed due to timeout.
* `emit('action.start.' + actionType, involvedObjects, id, objects)`: When an action starts.
* `emit('action.stop.' + actionType, id)`: When a action is stopped.



## Core concepts


### Stateless

This plugin doesn't support holding a state anywhere besides in the clients.
That's why the state always needs to be broadcasted with every message. 
See `id` and `name`.


### Broadcasting

This plugin really broadcasts everything. In WebSocket server implementations
like PieSocket provides every client that is connected to the specific URL 
(which also includes the channel), will be messaged. The plugin doesn't care
about auth or other security concepts _(yet)_.


### Dealing with game objects

The plugin assumes that it is dealing with game objects as synched objects, but
this is the only assumption it takes. Everything else needs to be implemented
within the game.


## Related

* Official & bundled [Phaser plugins](https://github.com/photonstorm/phaser-plugins)
* The official [Phaser plugin examples](https://www.phaser.io/examples/v3/category/plugins)
* [Phaser plugin examples GitHub repo](https://github.com/photonstorm/phaser3-examples/tree/master/public/src/plugins)
* The [Phaser 3 plugin template](https://github.com/photonstorm/phaser3-plugin-template)
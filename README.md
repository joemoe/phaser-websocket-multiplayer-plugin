# Phaser Websocket Multiplayer Plugin

This plugin provides realtime multiplayer functionality for the HTML5 game
framework [Phaser](https://github.com/photonstorm/phaser) using the 
[WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API).

It implements

* Game player management for round based games
* Game player management for open ended games
* Low level game state synchronization
* Low level game object synchronization

To achieve

* Multiplayer experience in simple games or prototypes

It doesn't

* Emphasize security
* Care about server-side implementation of Game logic.

It supports Phaser in the version 3. 

## Documentation

### Installation

### Configuration

### Open Game Mode

In this mode each client can register an object. There is a handler function
to extract the required features of an object. When a client receives information
about an object it wasn't aware of yet, it emits an create event.
When the client receives an update about an object it already has created it
emits an update event. When the client hasn't received an update for a given time
it emits disconnected message, when after another watermark still no update from a given object has been received it assumes the object is dead and emits a killed
message. Whenever a scene is changed it kills all objects. When the game is paused
it sends paused and resumed information.



## Related

* Official & bundled [Phaser plugins](https://github.com/photonstorm/phaser-plugins)
* The official [Phaser plugin examples](https://www.phaser.io/examples/v3/category/plugins)
* [Phaser plugin examples GitHub repo](https://github.com/photonstorm/phaser3-examples/tree/master/public/src/plugins)
* The [Phaser 3 plugin template](https://github.com/photonstorm/phaser3-plugin-template)
function CivShip(_name, _type, _game) {
	NPC.call(this, _name, civShipTypeInfo[_type]);	// Make this constructor take same params as parent
	this.type = _type;
	this.game = _game;
	this.bManualControl = false;

  this.createCivShip();
}

CivShip.prototype = Object.create(NPC.prototype); // New prototype inherits parent's prototype
CivShip.prototype.constructor = CivShip;					// Redefine this constructor to self, not parent


CivShip.prototype.createCivShip = function(){
	var arrPlanets = planetGroup.children.slice(0); //Clone array of planets for manipulation
	this.originPlanet = arrPlanets.splice(this.game.rnd.integerInRange(0,arrPlanets.length-1), 1)[0];
	this.destPlanet = arrPlanets.splice(this.game.rnd.integerInRange(0,arrPlanets.length-1), 1)[0];

	this.shipNum = this.game.rnd.integerInRange(0,5);

	this.sprite = civShipGroup.create(this.originPlanet.x, this.originPlanet.y, "civShipSheet");
	this.sprite.anchor.setTo(0.5);
	this.sprite.animations.add('thrust', [this.shipNum*2,(this.shipNum*2)+1]);
	this.sprite.animations.play('thrust', 16, true);
	var slope = slopeBetweenObj(this.sprite, this.destPlanet);
	this.sprite.angle = slope+90;
	this.sprite.inputEnabled = true;
	this.sprite.events.onInputDown.add(this.characterSelected.bind(this));

	this.sprite.data.parentObject = this; //Give sprite a reference to this parent object

	this.ascentTween = this.game.add.tween(this.sprite.scale).from( {x: 0, y:0}, 3000, Phaser.Easing.Quadratic.InOut, true, 0, 0, false);
	this.travelTime = distBetweenObj(this.originPlanet, this.destPlanet) * 20;
	this.travelTween = this.game.add.tween(this.sprite).to( {x: this.destPlanet.x, y:this.destPlanet.y}, this.travelTime, Phaser.Easing.Quadratic.InOut, false, 0, 0, false);
	this.decentTween = this.game.add.tween(this.sprite.scale).to( {x: 0, y:0}, 3000, Phaser.Easing.Quadratic.InOut, false, 0, 0, false);

	this.ascentTween.chain(this.travelTween);
	this.travelTween.chain(this.decentTween);
	this.decentTween.onComplete.add(this.civShipDelivered, this);


	this.tileLine = null;

  this.createHealthBar(this.sprite);

}

CivShip.prototype.civShipAI = function(){
	this.tileLine = this.drawTileLine(this.sprite, this.destPlanet, "transitPath", 0.3);
}

CivShip.prototype.civShipDelivered = function(){
	if(!this.sprite.alive) return;

	this.sprite.kill(); //Kill ship so enemies no longer target it
	this.sprite.destroy(); //Also removes it from the civShipGroup

	this.game.moneyEvent(this.sprite, this.value);
}

CivShip.prototype.drawTileLine = function(_fromObj, _toObj, _frameName, _alpha){
	line = new Phaser.Line(_fromObj.x, _fromObj.y, _toObj.x, _toObj.y);

	if(_fromObj.tileLine == null){
		_fromObj.tileLine = this.game.add.tileSprite(0, 0, 7, line.length, "spritesheet", _frameName);
		_fromObj.tileLine.anchor.setTo(0.5,1);
		_fromObj.tileLine.alpha = _alpha;
		_fromObj.addChild(_fromObj.tileLine)
	}

	_fromObj.tileLine.height = line.length;
}



CivShip.prototype.civShipHit = function(_bullet) {
	_bullet.kill();
	this.modifyHealth(-1*_bullet.damage, this.civShipDestroyed);
}

CivShip.prototype.civShipDestroyed = function(){

	this.sprite.kill();

	var explosion = this.game.add.sprite(this.sprite.x, this.sprite.y, "enemyExplosion");
	explosion.anchor.setTo(0.5);
	explosion.animations.add('explosion');
	explosion.animations.play('explosion', 16, false, true);
	explosion.animations.currentAnim.onComplete.add(function(){
		this.sprite.destroy(); //This also removes civShip from civShipGroup
	}, this);

	this.game.moneyEvent(this.sprite, -1*this.value);
}

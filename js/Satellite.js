function Satellite(_name, _type, _game) {
	NPC.call(this, _name, satelliteTypeInfo[_type]);	// Make this constructor take same params as parent
	this.type = _type;
	this.game = _game;
	this.bManualControl = true;

  this.createSatellite();
}

Satellite.prototype = Object.create(NPC.prototype); // New prototype inherits parent's prototype
Satellite.prototype.constructor = Satellite;				// Redefine this constructor to self, not parent


Satellite.prototype.createSatellite = function(){

  this.bulletGroup = satelliteBulletGroup;

  this.sprite = satelliteGroup.create(this.game.camera.view.centerX, this.game.camera.view.centerY, "spritesheet", 'satellite');
  this.sprite.anchor.setTo(0.5);
  this.game.physics.enable(this.sprite, Phaser.Physics.ARCADE);
  this.sprite.body.collideWorldBounds = true;
  this.sprite.inputEnabled = true;
  this.sprite.events.onInputDown.add(this.characterSelected.bind(this));

	this.sprite.data.parentObject = this; //Give sprite a reference to this parent object

  this.thrustSprite = this.game.add.sprite(0, this.sprite.height/2, "thrust");
  this.thrustSprite.anchor.setTo(0.5,0);
  this.thrustSprite.alpha = 0;
  this.thrustSprite.animations.add('thrust');
  this.thrustSprite.animations.play('thrust', 16, true);
  this.sprite.addChild(this.thrustSprite);

	this.createHealthBar(this.sprite);

},

Satellite.prototype.satelliteAI = function(_arrTargets){
  if(this.bFocused) return; //ignore Satellite if it is focused (in control by the player)

  this.sprite.body.maxVelocity.set(this.maxVelocity);

  //FIND CLOSEST TARGET
  var target = findClosestObjAlive(this.sprite, _arrTargets);
  if(target == null) return;

  //ROTATE
  var slope = slopeBetweenObj(this.sprite, target);
  this.sprite.angle = slope+90;

	//FIRE
	if(distBetweenObj(this.sprite, target) < this.targetingDistance)
  	this.fireBullet();

}

Satellite.prototype.manualControl = function(){
	if(!this.sprite.alive) return;

  //TURN LEFT AND RIGHT
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.A))
  this.sprite.body.angularVelocity = -200;
  else if (this.game.input.keyboard.isDown(Phaser.Keyboard.D))
  this.sprite.body.angularVelocity = 200;
  else
  this.sprite.body.angularVelocity = 0;
  //STRAFE LEFT
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.Q))
  this.game.physics.arcade.accelerationFromRotation(this.sprite.rotation-(1.5708*2), this.maxThrust/4, this.sprite.body.acceleration);
  //STRAFE RIGHT
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.E))
  this.game.physics.arcade.accelerationFromRotation(this.sprite.rotation, this.maxThrust/4, this.sprite.body.acceleration);
  //MISSILES
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) || this.game.input.activePointer.leftButton.isDown)
  this.fireBullet();

}

Satellite.prototype.satelliteHit = function(_bullet) {
	_bullet.kill();
	this.modifyHealth(-1*_bullet.damage, this.satelliteDestroyed);
}

Satellite.prototype.satelliteDestroyed = function(){

	this.sprite.kill();

	var explosion = this.game.add.sprite(this.sprite.x, this.sprite.y, "enemyExplosion");
	explosion.anchor.setTo(0.5);
	explosion.animations.add('explosion');
	explosion.animations.play('explosion', 16, false, true);
	explosion.animations.currentAnim.onComplete.add(function(){
		this.sprite.destroy(); //This also removes satellite from satelliteGroup
	}, this);

	this.game.moneyEvent(this.sprite, -1*this.value);
}

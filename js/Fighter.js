function Fighter(_name, _type, _game) {
	NPC.call(this, _name, fighterTypeInfo[_type]);	// Make this constructor take same params as parent
	this.type = _type;
	this.game = _game;
	this.bManualControl = true;

  this.createFighter();
}

Fighter.prototype = Object.create(NPC.prototype); // New prototype inherits parent's prototype
Fighter.prototype.constructor = Fighter;					// Redefine this constructor to self, not parent


Fighter.prototype.createFighter = function(){

  this.bulletGroup = fighterBulletGroup;

  this.sprite = fighterGroup.create(this.game.camera.view.centerX, this.game.camera.view.centerY, "spritesheet", 'galaga1');
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

  this.home = {x:this.sprite.x, y:this.sprite.y};

  this.createHealthBar(this.sprite);

},

Fighter.prototype.fighterAI = function(_arrTargets){
  if(this.bFocused) return; //ignore fighter if it is focused (in control by the player)

  this.sprite.body.maxVelocity.set(this.maxVelocity);

  //FIND CLOSEST TARGET
  var target = findClosestObjAlive(this.sprite, _arrTargets);

	if(target == null){ //GO HOME
		target = this.home;
		//ROTATE
	  var slope = slopeBetweenObj(this.sprite, target);
	  this.sprite.angle = slope+90;
	  //THRUST
	  if(distBetweenObj(this.sprite, target) > this.targetingDistance){
	    this.game.physics.arcade.accelerationFromRotation(this.sprite.rotation-1.5708, this.maxThrust, this.sprite.body.acceleration);
			this.thrustSprite.alpha = 1;
		}
	  else{
	    this.sprite.body.acceleration.set(0);
			this.sprite.body.drag.set(this.defaultDrag);
			this.thrustSprite.alpha = 0;
		}
	}
	else{ //ENGAGE ENEMY
		//ROTATE
	  var slope = slopeBetweenObj(this.sprite, target);
	  this.sprite.angle = slope+90;
	  //THRUST
	  if(distBetweenObj(this.sprite, target) > this.targetingDistance){
	    this.game.physics.arcade.accelerationFromRotation(this.sprite.rotation-1.5708, this.maxThrust, this.sprite.body.acceleration);
			this.thrustSprite.alpha = 1;
		}
		else{
	    this.sprite.body.acceleration.set(0);
			this.sprite.body.drag.set(this.defaultDrag);
			this.thrustSprite.alpha = 0;
	    //FIRE
	    this.fireBullet();
	  }
	}
}

Fighter.prototype.manualControl = function(){
	if(!this.sprite.alive) return;

  //THRUST
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.W)){
    this.game.physics.arcade.accelerationFromRotation(this.sprite.rotation-1.5708, this.maxThrust, this.sprite.body.acceleration);
    this.thrustSprite.alpha = 1;
  }
  else{
    this.sprite.body.acceleration.set(0);
    this.thrustSprite.alpha = 0;
  }
  //BREAK
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.S)){
    this.game.physics.arcade.accelerationFromRotation(this.sprite.rotation+(1.5708), this.breaks, this.sprite.body.acceleration);
    this.sprite.body.drag.set(this.maxHandling);
  }
  else{
    this.sprite.body.drag.set(this.defaultDrag);
  }
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

Fighter.prototype.fighterHit = function(_bullet) {
	_bullet.kill();
	this.modifyHealth(-1*_bullet.damage, this.fighterDestroyed);
}

Fighter.prototype.fighterDestroyed = function(){

	this.sprite.kill();

	var explosion = this.game.add.sprite(this.sprite.x, this.sprite.y, "enemyExplosion");
	explosion.anchor.setTo(0.5);
	explosion.animations.add('explosion');
	explosion.animations.play('explosion', 16, false, true);
	explosion.animations.currentAnim.onComplete.add(function(){
		this.sprite.destroy(); //This also removes fighter from fighterGroup
	}, this);

}

function Enemy(_name, _type, _game) {

	NPC.call(this, _name, enemyTypeInfo[_type]);	// Make this constructor take same params as parent
	this.type = _type;
	this.game = _game;
	this.bManualControl = false;

	this.createEnemy();
}

Enemy.prototype = Object.create(NPC.prototype); // New prototype inherits parent's prototype
Enemy.prototype.constructor = Enemy;					// Redefine this constructor to self, not parent

//CREATE ***************************************************************************
Enemy.prototype.createEnemy = function(){

	console.log(this.type);

	switch (this.type) {
		case "asteroid": this.createAsteroid(); break;
		case "galagaGreen":	this.createBulletEnemy(); break;
	}


}

Enemy.prototype.createAsteroid = function(){

	var location;
	switch (this.game.rnd.integerInRange(0,3)) {
		case 0: location = {x: this.game.rnd.integerInRange(0,this.game.world.width), y:-10}; break; //TOP
		case 1: location = {x: this.game.rnd.integerInRange(0,this.game.world.width), y:this.game.world.height+10}; break; //BOTTOM
		case 2: location = {x: -10, y:this.game.rnd.integerInRange(0,this.game.world.height)}; break; //LEFT
		case 3: location = {x: this.game.world.width+10, y:this.game.rnd.integerInRange(0,this.game.world.height)}; break; //RIGHT
	}

	this.sprite = enemyGroup.create(location.x, location.y, 'spritesheet', this.type+"0");
	this.sprite.anchor.setTo(0.5);
	this.game.physics.enable(this.sprite, Phaser.Physics.ARCADE);
	this.sprite.body.collideWorldBounds = true;
	this.sprite.inputEnabled = true;
	this.sprite.events.onInputDown.add(this.characterSelected.bind(this));

	this.sprite.data.parentObject = this; //Give sprite a reference to this parent object

	this.createHealthBar(this.sprite);
}

Enemy.prototype.createBulletEnemy = function(){
	this.bulletGroup = enemyBulletGroup;

	var location;
	switch (this.game.rnd.integerInRange(0,3)) {
		case 0: location = {x: this.game.rnd.integerInRange(0,this.game.world.width), y:-10}; break; //TOP
		case 1: location = {x: this.game.rnd.integerInRange(0,this.game.world.width), y:this.game.world.height+10}; break; //BOTTOM
		case 2: location = {x: -10, y:this.game.rnd.integerInRange(0,this.game.world.height)}; break; //LEFT
		case 3: location = {x: this.game.world.width+10, y:this.game.rnd.integerInRange(0,this.game.world.height)}; break; //RIGHT
	}

	this.sprite = enemyGroup.create(location.x, location.y, 'galagaEnemies');
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
}


//AI ***************************************************************************
Enemy.prototype.enemyAI = function(_arrTargets){
	switch (this.type) {
		case "asteroid": this.enemyAsteroidAI(_arrTargets); break;
		case "galagaGreen":	this.enemyBulletAI(_arrTargets); break;
	}
}

Enemy.prototype.enemyAsteroidAI = function(_arrTargets){

	console.log("enemyAsteroidAI");

	this.sprite.body.maxVelocity.set(this.maxVelocity);

	//FIND CLOSEST TARGET
	var target = findClosestObjAlive(this.sprite, _arrTargets);
	//THRUST
	this.game.physics.arcade.accelerationFromRotation(this.sprite.rotation-1.5708, this.maxThrust, this.sprite.body.acceleration);

}

Enemy.prototype.enemyBulletAI = function(_arrTargets){

	this.sprite.body.maxVelocity.set(this.maxVelocity);

	//FIND CLOSEST TARGET
	var target = findClosestObjAlive(this.sprite, _arrTargets);
	//ROTATE
	var slope = slopeBetweenObj(this.sprite, target);
	this.sprite.angle = slope+90;
	//THRUST
	if(distBetweenObj(this.sprite, target) > this.targetingDistance)
	this.game.physics.arcade.accelerationFromRotation(this.sprite.rotation-1.5708, this.maxThrust, this.sprite.body.acceleration);
	else{
		this.sprite.body.acceleration.set(0);
		//FIRE
		this.fireBullet();
	}
}




Enemy.prototype.enemyHit = function(_bullet) {
	_bullet.kill();
	this.modifyHealth(-1*_bullet.damage, this.enemyDestroyed);
	this.game.checkWaveComplete();
}

Enemy.prototype.enemyDestroyed = function(){

	this.sprite.kill();
	//get rid of this enemy from gameInfo.arrHudTargets
	this.sprite.hudIcon.kill();
	this.game.updateHudText();

	var explosion = this.game.add.sprite(this.sprite.x, this.sprite.y, "enemyExplosion");
	explosion.anchor.setTo(0.5);
	explosion.animations.add('explosion');
	explosion.animations.play('explosion', 16, false, true);
	explosion.animations.currentAnim.onComplete.add(function(){
		this.sprite.destroy(); //This also removes enemy from enemyGroup
	}, this);

}

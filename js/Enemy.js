function Enemy(_name, _type, _game) {
	NPC.call(this, _name);	// Make this constructor take same params as parent
	this.type = _type;
	this.game = _game;
	this.damage = 10;

	this.createEnemy();
}

Enemy.prototype = Object.create(NPC.prototype); // New prototype inherits parent's prototype
Enemy.prototype.constructor = Enemy;					// Redefine this constructor to self, not parent


Enemy.prototype.createEnemy = function(){

	this.bulletGroup = this.game.add.group();
	this.bulletGroup.enableBody = true;
	this.bulletGroup.physicsBodyType = Phaser.Physics.ARCADE;
	this.bulletGroup.createMultiple(10, 'spritesheet', 'missile_1');
	this.bulletGroup.setAll('anchor.x', 0.5);
	this.bulletGroup.setAll('anchor.y', 0.5);

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

	this.thrustSprite = this.game.add.sprite(0, this.sprite.height/2, "thrust");
	this.thrustSprite.anchor.setTo(0.5,0);
	this.thrustSprite.alpha = 0;
	this.thrustSprite.animations.add('thrust');
	this.thrustSprite.animations.play('thrust', 16, true);
	this.sprite.addChild(this.thrustSprite);

	this.createHealthBar(this.sprite);
},

Enemy.prototype.enemyAI = function(_arrTargets){

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

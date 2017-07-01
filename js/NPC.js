
function NPC(_name, _infoObj) {

  this.name = _infoObj.name+"_"+_name;
  this.maxHp = _infoObj.maxHp;
  this.value = _infoObj.value;
	this.maxThrust = _infoObj.maxThrust;
	this.maxHp = _infoObj.maxHp;
	this.maxSheild = _infoObj.maxSheild;
	this.maxVelocity = _infoObj.maxVelocity;
	this.shield = _infoObj.shield;
	this.maxHandling = _infoObj.maxHandling;
	this.defaultDrag = _infoObj.defaultDrag;
	this.breaks = _infoObj.breaks;
	this.bulletDamage = _infoObj.bulletDamage;
	this.bulletCooldownTime = _infoObj.bulletCooldownTime;
	this.bulletSpeed = _infoObj.bulletSpeed;
	this.bulletLifespan = _infoObj.bulletLifespan;
  this.targetingDistance = _infoObj.targetingDistance;

  this.curHp = this.maxHp;
  this.bFocused = false;
  this.game = szGame.game;

};

NPC.prototype.getName = function(){
  return "His name is "+ this.name;
}

NPC.prototype.characterSelected = function(){
  if(this.bManualControl){
    if(gameInfo.focusObj != null) gameInfo.focusObj.bFocused = false;
    gameInfo.focusObj = this;
    this.bFocused = true;
  }
}

NPC.prototype.fireBullet = function() {
  if (this.prevBulletTimestamp == undefined || this.game.time.now > this.prevBulletTimestamp+this.bulletCooldownTime){
    var bullet = this.bulletGroup.getFirstExists(false);

    if (bullet){
      bullet.reset(this.sprite.x, this.sprite.y);
      bullet.lifespan = this.bulletLifespan;
      bullet.rotation = this.sprite.rotation;
      this.game.physics.arcade.velocityFromRotation(this.sprite.rotation-1.5708, this.bulletSpeed, bullet.body.velocity);
      this.prevBulletTimestamp = this.game.time.now;
      bullet.damage = this.bulletDamage;
    }
  }
}

NPC.prototype.createHealthBar = function(){

  var graphics = this.game.add.graphics(0,0);
  graphics.beginFill(0xffffff);
  graphics.drawRect(0, 0, this.sprite._frame.width, 2);
  this.healthbar = this.game.add.sprite(0,0,graphics.generateTexture());
  this.healthbar.anchor.setTo(0.5, -1*(this.sprite._frame.height/3));
  this.healthbar.tint = arrHealthbarColors[arrHealthbarColors.length-1];
  graphics.destroy();
  this.sprite.addChild(this.healthbar);
}

NPC.prototype.modifyHealth = function(_value, _onDead){

  console.log(this);

  console.log(this.curHp +"/"+ this.maxHp);

  this.curHp += _value;
  var scale = this.curHp / this.maxHp;
  this.healthbar.scale.x = scale;

  this.healthbar.tint = arrHealthbarColors[Math.floor(scale*10)];

  if(this.curHp <= 0)
    _onDead().bind(this);
}

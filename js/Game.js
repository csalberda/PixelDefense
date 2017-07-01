var szGame = szGame || {};

szGame.Game = function (game) {};

var iWorldWidth = 1000;
var iWorldHeight = 1000;

var starFlash = null;
var buildDialogGroup, shipDialogGroup;
var fighterGroup, satelliteGroup, enemyGroup, planetGroup, civShipGroup;
var fighterBulletGroup, satelliteBulletGroup, enemyBulletGroup;
var hudGroup, hudIconGroup;
var fightersDialogGroup, newFighterDialogGroup;

var focusedTile = null;
var arrPlanetColors = [0xc15757, 0xc17d57, 0xc1a157, 0xc1c157, 0xa4c157, 0x76c157, 0x57c173, 0x57c19a, 0x57c1bd, 0x57aac1, 0x5788c1, 0x5761c1, 0x7557c1, 0x9157c1, 0xb257c1, 0xc157ad, 0xc15783];
var arrHealthbarColors = [0xff0000,0xff3300,0xff6600,0xff9900,0xffcc00,0xffff00,0xbbff00,0x88ff00,0x44ff00,0x00ff00];

var textStyle = {font: "16px Courier", fill:"#ffffff"};

var gameInfo = {
	money:5000,
	wave:1,
	focusObj: null,
	bAllEnemiesSpawned: true,
	bAllCivShipsSpawned: true,
  arrHudTargets: []
};
var hudInfo = {
  textSize: 32,
  moneyText: null,
  buildFighterButton: null,
  buildSatelliteButton: null,
  waveText: null,
  enemiesText: null,
	centerText: null,
  broadcastText: null,
	shadowBlanket: null
};
var arrFighters = [];
var arrEnemies = [];
var arrCivShips = [];
var arrSatellites = [];
// var satelliteInfo = {
// 	maxHp: 50,
// 	bulletDamage: 5,
// 	bulletCooldownTime: 1000,
// 	bulletSpeed: 200,
// 	bulletLifespan: 2000,
// 	targetingDistance: 200,
// 	cost: 500
// };
// var enemiesInfo = {
// 	maxHp: 20,
//   thrust: 100,
// 	drag:50,
// 	maxVelocity: 100,
// 	bulletDamage: 5,
// 	bulletCooldownTime: 1000,
// 	bulletSpeed: 200,
// 	bulletLifespan: 1000,
// 	targetingDistance: 200,
// 	value: 10,
//   arrTargets: []
// };
// var civShipInfo = {
//   maxHp: 100
// }

var fightersMenuInfo = {
	fightersMenuDialog: null
}

szGame.Game.prototype = {

	//RESERVED FUNCTION CALL: RUNS ONCE BEFORE CREATE
	preload: function () {
		_this = this;
    this.game.camera.position.setTo(iWorldWidth/2, iWorldHeight/2);

		this.game.cache.addNinePatch("dialogNine", "spritesheet", "dialog", 16, 16, 16, 16);
		this.game.cache.addNinePatch("trayNine", "spritesheet", "tray", 8, 8, 8, 8);
		this.game.cache.addNinePatch("buttonNine", "spritesheet", "button", 8, 8, 8, 8);
	},

	//RESERVED FUNCTION CALL: RUNS BEFORE UPDATE
	create: function () {
		this.game.add.tileSprite(0,0, iWorldWidth, iWorldHeight, "background");
		this.game.world.setBounds(0, 0, iWorldWidth, iWorldHeight);
		this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.game.time.events.loop(Phaser.Timer.SECOND*2, this.starFlash, this);

		this.initPlanetGroup();
		this.initFighterGroup();
		this.initSatelliteGroup();
    this.initCivShipGroup();
		this.initEnemyGroup();
		this.initHudGroup();

		fightersDialogGroup = this.game.add.group();
		newfighterDialogGroup = this.game.add.group();

		this.createPlanets(5);
		this.createHUD();

		this.initFightersMenu();

	},

  // UPDATE FUNCTIONS **********************************************************
	//RESERVED FUNCTION CALL: RUNS CONTINUOUSLY AFTER CREATE
	update: function () {

		this.checkPhysicsEvents();
		//this.controlPlayer();
		this.moveCamera();
		this.updateTargeting();
		this.updatefighterAI();
    this.updateCivShipAI();
    this.updateSatelliteAI();
    this.updateEnemyAI();

	},

	moveCamera: function(){
		if(gameInfo.focusObj != null){
			gameInfo.focusObj.manualControl();
			this.game.camera.follow(gameInfo.focusObj.sprite, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
		}
		else{
			this.game.camera.target = null;
			this.followMouse();
		}
	},

	followMouse: function(){
		cameraSpeed = 8;
		cameraOffset = iGameWidth*.47;

		if(this.game.input.worldX > this.game.camera.view.centerX+cameraOffset)
			this.game.camera.x += cameraSpeed;
		if(this.game.input.worldX < this.game.camera.view.centerX-cameraOffset)
			this.game.camera.x -= cameraSpeed;
		if(this.game.input.worldY > this.game.camera.view.centerY+cameraOffset)
			this.game.camera.y += cameraSpeed;
		if(this.game.input.worldY < this.game.camera.view.centerY-cameraOffset)
			this.game.camera.y -= cameraSpeed;

	},

  checkPhysicsEvents: function(){
    this.game.physics.arcade.overlap(fighterBulletGroup, enemyGroup, this.enemyHit, null, this);
    this.game.physics.arcade.overlap(enemyBulletGroup, fighterGroup, this.fighterHit, null, this);
    this.game.physics.arcade.overlap(enemyBulletGroup, civShipGroup, this.civShipHit, null, this);
    this.game.physics.arcade.overlap(satelliteBulletGroup, enemyGroup, this.enemyHit, null, this);
  },

	updateTargeting: function () {
		if(gameInfo.arrHudTargets.length == 0) return;

		var targetingOffset = 12;
		var pointOfInterest = (gameInfo.focusObj != null)? gameInfo.focusObj : {x:this.game.camera.view.centerX, y:this.game.camera.view.centerY}

		gameInfo.arrHudTargets.forEach(function(_target){

			if(!_target.alive){
				_target.hudIcon.kill();
				return;
			}

			var playerTargetLine = new Phaser.Line(pointOfInterest.x, pointOfInterest.y, _target.x, _target.y);
			var topLine = new Phaser.Line(this.game.camera.view.left+targetingOffset, this.game.camera.view.top+targetingOffset, this.game.camera.view.right-targetingOffset, this.game.camera.view.top+targetingOffset);
			var bottomLine = new Phaser.Line(this.game.camera.view.left+targetingOffset, this.game.camera.view.bottom-targetingOffset, this.game.camera.view.right-targetingOffset, this.game.camera.view.bottom-targetingOffset);
			var leftLine = new Phaser.Line(this.game.camera.view.left+targetingOffset, this.game.camera.view.top-targetingOffset, this.game.camera.view.left+targetingOffset, this.game.camera.view.bottom-targetingOffset);
			var rightLine = new Phaser.Line(this.game.camera.view.right-targetingOffset, this.game.camera.view.top+targetingOffset, this.game.camera.view.right-targetingOffset, this.game.camera.view.bottom-targetingOffset);

			var topIntersect = playerTargetLine.intersects(topLine, true);
			var bottomIntersect = playerTargetLine.intersects(bottomLine, true);
			var leftIntersect = playerTargetLine.intersects(leftLine, true);
			var rightIntersect = playerTargetLine.intersects(rightLine, true);

			var point = null;
			var longestDist = 0;
			if(topIntersect != null && pointOfInterest != null && distBetweenObj(pointOfInterest, topIntersect) > longestDist){
				longestDist = distBetweenObj(pointOfInterest, topIntersect);
				point = topIntersect;
			}
			if(bottomIntersect != null && pointOfInterest != null && distBetweenObj(pointOfInterest, bottomIntersect) > longestDist){
				longestDist = distBetweenObj(pointOfInterest, bottomIntersect);
				point = bottomIntersect;
			}
			if(leftIntersect != null && pointOfInterest != null && distBetweenObj(pointOfInterest, leftIntersect) > longestDist){
				longestDist = distBetweenObj(pointOfInterest, leftIntersect);
				point = leftIntersect;
			}
			if(rightIntersect != null && pointOfInterest != null && distBetweenObj(pointOfInterest, rightIntersect) > longestDist){
				longestDist = distBetweenObj(pointOfInterest, rightIntersect);
				point = rightIntersect;
			}

			if(point != null){
				_target.hudIcon.x = point.x;
				_target.hudIcon.y = point.y;
				_target.hudIcon.revive();
			}
			else
			   _target.hudIcon.kill();

		}.bind(this));
	},

	//HUD ************************************************************************
	initHudGroup: function(){
		hudGroup = this.game.add.group();
		hudIconGroup = this.game.add.group();
    hudIconGroup.alpha = 0.3;
	},

	createHUD: function(){
		hudGroup.fixedToCamera = true;

		var corner;
		corner = hudGroup.create(0,0,"spritesheet", "crtCorner");
		corner = hudGroup.create(iGameWidth,0,"spritesheet", "crtCorner");
		corner.scale.setTo(-1,1);
		corner = hudGroup.create(iGameWidth,iGameHeight,"spritesheet", "crtCorner");
		corner.scale.setTo(-1,-1);
		corner = hudGroup.create(0,iGameHeight,"spritesheet", "crtCorner");
		corner.scale.setTo(1,-1);

		hudInfo.moneyText = this.game.add.bitmapText(10, 10, 'font64', "$"+gameInfo.money, hudInfo.textSize);
		hudGroup.addChild(hudInfo.moneyText);
		hudInfo.moneyText.anchor.setTo(0, 0.5);

		hudInfo.buildFighterButton = hudGroup.create(18, 35, "spritesheet", "shipButton");
		hudInfo.buildFighterButton.anchor.setTo(0.5);
		hudInfo.buildFighterButton.inputEnabled = true;
		hudInfo.buildFighterButton.events.onInputDown.add(this.displayFightersMenu.bind(this));

		hudInfo.buildSatelliteButton = hudGroup.create(45, 35, "spritesheet", "satelliteButton");
		hudInfo.buildSatelliteButton.anchor.setTo(0.5);
		hudInfo.buildSatelliteButton.inputEnabled = true;
		hudInfo.buildSatelliteButton.events.onInputDown.add(this.createSatellite.bind(this));

		hudInfo.waveText = this.game.add.bitmapText(iGameWidth-10, 10, 'font64', "Wave "+gameInfo.wave, hudInfo.textSize);
		hudGroup.addChild(hudInfo.waveText);
		hudInfo.waveText.anchor.setTo(1, 0.5);

		hudInfo.enemiesText = this.game.add.bitmapText(iGameWidth-10, 35, 'font64', enemyGroup.countDead()+"/"+enemyGroup.length, hudInfo.textSize);
		hudGroup.addChild(hudInfo.enemiesText);
		hudInfo.enemiesText.anchor.setTo(1, 0.5);

		hudInfo.centerText = this.game.add.bitmapText(iGameWidth/2, 15, 'font64', '', hudInfo.textSize);
		hudGroup.addChild(hudInfo.centerText);
		hudInfo.centerText.anchor.setTo(0.5);
		hudInfo.centerText.inputEnabled = true;
		hudInfo.centerText.events.onInputDown.add(this.centerTextSelected.bind(this, null));

		this.setCenterText("Next Wave", this.startNextWave.bind(this));

		hudInfo.shadowBlanket = this.game.add.graphics(0,0);
		hudInfo.shadowBlanket.beginFill(0x00000);
		hudInfo.shadowBlanket.drawRect(0, 0, iGameWidth, iGameHeight);
		hudInfo.shadowBlanket.inputEnabled = true; //consume events
		hudInfo.shadowBlanket.alpha = 0.7;
		hudInfo.shadowBlanket.events.onInputDown.add(this.closeMenus.bind(this));
		hudInfo.shadowBlanket.kill(); //kill for now until it is used
		hudGroup.addChild(hudInfo.shadowBlanket);

	},

	updateHudText: function(){
		hudInfo.moneyText.setText("$"+gameInfo.money);
		hudInfo.waveText.setText("Wave "+gameInfo.wave);
		hudInfo.enemiesText.setText(enemyGroup.countDead()+"/"+enemyGroup.length);
	},

	setCenterText: function(_string, _callback){
		hudInfo.centerText.setText(_string);

		if(_callback != undefined){
			hudInfo.centerText.scale.setTo(1);
			hudInfo.centerText.bobTween = this.game.add.tween(hudInfo.centerText.scale).to( {x: 1.2, y:1.2}, 500, Phaser.Easing.Quadratic.InOut, true, 0, 0, true).loop(true);
			hudInfo.centerText.callback = _callback;
		}
		else
			hudInfo.centerText.callback = null;
	},

	centerTextSelected: function(){
		hudInfo.centerText.bobTween.stop();
		hudInfo.centerText.scale.setTo(0);

		if(hudInfo.centerText.callback != null) hudInfo.centerText.callback();
	},

	broadcastMessage: function(_message, _onComplete){
		if(hudInfo.broadcastText == null){
			hudInfo.broadcastText = this.game.add.bitmapText(iGameWidth/2, iGameHeight/2, 'font64', "", 64);
			hudGroup.addChild(hudInfo.broadcastText);
			hudInfo.broadcastText.anchor.setTo(0.5);
		}

		hudInfo.broadcastText.setText(_message);
		hudInfo.broadcastText.position.setTo(iGameWidth/2, iGameHeight/2);
		hudInfo.broadcastText.alpha = 1;
		hudInfo.broadcastText.revive();

		var fadeInTween = this.game.add.tween(hudInfo.broadcastText).from( {alpha:0}, 1000, Phaser.Easing.Quadratic.Out, true, 0, 0, false);
		var inTween = this.game.add.tween(hudInfo.broadcastText).from( {y:iGameHeight}, 1000, Phaser.Easing.Quadratic.Out, true, 0, 0, false);

		var fadeOutTween = this.game.add.tween(hudInfo.broadcastText).to( {alpha:0}, 1000, Phaser.Easing.Quadratic.In, false, 0, 0, false);
		var outTween = this.game.add.tween(hudInfo.broadcastText).to( {y:0}, 1000, Phaser.Easing.Quadratic.In, false, 0, 0, false);

		fadeInTween.chain(fadeOutTween);
		inTween.chain(outTween);

		outTween.onComplete.add(function(){
			hudInfo.broadcastText.kill();
			if(_onComplete != undefined) _onComplete();
		}, this);
	},

	//FIGHTER *********************************************************************
	initFighterGroup: function(){
		fighterGroup = this.game.add.group();
		fighterBulletGroup = this.game.add.group();
		fighterBulletGroup.enableBody = true;
		fighterBulletGroup.physicsBodyType = Phaser.Physics.ARCADE;
		fighterBulletGroup.createMultiple(40, "spritesheet", 'missile_1');
		fighterBulletGroup.setAll('anchor.x', 0.5);
		fighterBulletGroup.setAll('anchor.y', 0.5);
	},

	createFighter: function(){
		this.closeMenus();

		var newFighter = new Fighter(arrFighters.length+1, "galagaFighter", this);
		arrFighters.push(newFighter);

		this.moneyEvent(newFighter.sprite, -1*newFighter.value);
	},

	updatefighterAI: function(){
		arrTargetSprites = [];
		arrEnemies.forEach(function(_enemy){ if(_enemy.sprite.alive) arrTargetSprites.push(_enemy.sprite)});

		//Always run fighter AI since they have to return "home"
		arrFighters.forEach(function(_fighter){ _fighter.fighterAI(arrTargetSprites); }.bind(this));

	},

	fighterHit: function(_bullet, _fighter) {
		_bullet.kill();
	},

  //CIV SHIP *******************************************************************
	initCivShipGroup: function(){
		civShipGroup = this.game.add.group();
		civShipGroup.enableBody = true;
	},

	createCivShip: function(){
		this.closeMenus();

		var newCivShip = new CivShip(arrFighters.length+1, "civShipType:)", this);
		arrCivShips.push(newCivShip);
		this.newHudIcon(newCivShip.sprite);

	},

  updateCivShipAI: function(){
    if(arrCivShips.length != 0)
      arrCivShips.forEach(function(_civShip){ _civShip.civShipAI(); });
  },

	civShipHit: function(_bullet, _ship){
		_bullet.kill();
		this.modifyHealth(_ship, -1*_bullet.damage, this.civShipDestroyed.bind(this, _ship));
	},

	civShipDestroyed: function(_ship){
		_ship.kill();

		_ship.hudIcon.kill();
		gameInfo.money-=_ship.data.value;
		this.updateHudText();

		var explosion = this.game.add.sprite(_ship.x, _ship.y, "playerExplosion");
		explosion.anchor.setTo(0.5);
		explosion.animations.add('explosion');
		explosion.animations.play('explosion', 8, false, true);
		explosion.animations.currentAnim.onComplete.add(function(){
			_ship.destroy(); //This also removes enemy from enemyGroup
			this.checkWaveComplete();
		}, this);
	},

	//SATELLITE ******************************************************************
	initSatelliteGroup: function(){
		satelliteGroup = this.game.add.group();
		satelliteGroup.enableBody = true;
	},

	createSatellite: function(){
		this.closeMenus();

		var newSatellite = new Satellite(arrSatellites.length+1, "normalSatellite", this);
		arrSatellites.push(newSatellite);
	},

  updateSatelliteAI: function(){
		arrTargetSprites = [];
		arrEnemies.forEach(function(_enemy){ if(_enemy.sprite.alive) arrTargetSprites.push(_enemy.sprite)});

		if(arrTargetSprites.length > 0)
			arrSatellites.forEach(function(_satellite){ _satellite.satelliteAI(arrTargetSprites); }.bind(this));
  },

	satelliteHit: function(_bullet, _satellite){},

	//ENEMY **********************************************************************
	initEnemyGroup: function(){
		enemyGroup = this.game.add.group();
		enemyBulletGroup = this.game.add.group();
		enemyBulletGroup.enableBody = true;
		enemyBulletGroup.physicsBodyType = Phaser.Physics.ARCADE;
		enemyBulletGroup.createMultiple(20, 'spritesheet', 'missile_1');
		enemyBulletGroup.setAll('anchor.x', 0.5);
		enemyBulletGroup.setAll('anchor.y', 0.5);
	},

	createEnemy: function(){

		this.closeMenus();

		var newEnemy = new Enemy(arrEnemies.length+1, "galagaGreen", this);
		arrEnemies.push(newEnemy);

	},

  updateEnemyAI: function(){
    //make array of current targets
    var arrTargetSprites = []; //reset array

		arrFighters.forEach(function(_fighter){ if(_fighter.sprite.alive) arrTargetSprites.push(_fighter.sprite)});
		arrSatellites.forEach(function(_satellite){ if(_satellite.sprite.alive) arrTargetSprites.push(_satellite.sprite)});
		arrCivShips.forEach(function(_civShip){ if(_civShip.sprite.alive) arrTargetSprites.push(_civShip.sprite)});

		if(arrTargetSprites.length > 0){
			arrEnemies.forEach(function(_enemy){ _enemy.enemyAI(arrTargetSprites); }.bind(this));
		}
  },

	enemyHit: function(_bullet, _enemy) {
		_bullet.kill();
		this.modifyHealth(_enemy, -1*_bullet.damage, this.enemyDestroyed.bind(this, _enemy));
		this.checkWaveComplete();
	},

	enemyDestroyed: function(_enemy){
		_enemy.kill();
		//get rid of this enemy from gameInfo.arrHudTargets
		_enemy.hudIcon.kill();
		this.updateHudText();

		var explosion = this.game.add.sprite(_enemy.x, _enemy.y, "enemyExplosion");
		explosion.anchor.setTo(0.5);
		explosion.animations.add('explosion');
		explosion.animations.play('explosion', 16, false, true);
		explosion.animations.currentAnim.onComplete.add(function(){
			_enemy.destroy(); //This also removes enemy from enemyGroup
		}, this);

		this.moneyEvent(_enemy, enemiesInfo.value);
	},

  //PLANET *********************************************************************
	initPlanetGroup: function(){
		planetGroup = this.game.add.group();
	},

	createPlanets: function(_numOfPlanets){

		for (var i=0; i<_numOfPlanets; i++) {

			var planet = planetGroup.create(this.game.rnd.integerInRange(100, iWorldWidth-100), this.game.rnd.integerInRange(100, iWorldHeight-100), "spritesheet", "planet"+i);
			var planetColor = arrPlanetColors[this.game.rnd.integerInRange(0,arrPlanetColors.length-1)];
			planet.anchor.setTo(0.5);
			planet.tint = planetColor;
			this.game.add.tween(planet).to( {angle: 359}, 20000, "Linear", true, 0, 0, false).loop(true);

			this.newHudIcon(planet);
		}


	},

	planetHit: function(_bullet, _planet) {
		_bullet.kill();
	},

	//FIGHTERS MENU ************************************************************
	initFightersMenu: function(){
		fightersDialogGroup.fixedToCamera = true;

		var storeWidth = 400;
		var storeHeight = 500;

		fightersMenuInfo.fightersMenuDialog = new Phaser.NinePatchImage(this, iGameWidth/2, (iGameHeight-storeHeight)/2, "dialogNine", null);
		fightersMenuInfo.fightersMenuDialog.anchor.setTo(0.5, 0);
		fightersMenuInfo.fightersMenuDialog.targetWidth = storeWidth;
		fightersMenuInfo.fightersMenuDialog.targetHeight = storeHeight;
		fightersMenuInfo.fightersMenuDialog.inputEnabled = true; //consume events
		fightersMenuInfo.fightersMenuDialog.UpdateImageSizes(); //Needed for changing the anchor
		fightersDialogGroup.add(fightersMenuInfo.fightersMenuDialog);

		var newFighterText = this.game.add.bitmapText(0, 16, 'font64', "Fighters");
		fightersMenuInfo.fightersMenuDialog.addChild(newFighterText);
		newFighterText.anchor.setTo(0.5);

		var newTray = new Phaser.NinePatchImage(this, 0, newFighterText.bottom+8, "trayNine", null);
		newTray.anchor.setTo(0.5, 0);
		newTray.targetWidth = storeWidth-32;
		newTray.targetHeight = fightersMenuInfo.fightersMenuDialog.targetHeight-100;
		fightersMenuInfo.fightersMenuDialog.addChild(newTray);
		newTray.UpdateImageSizes(); //Needed for changing the anchor

		var button = new Phaser.NinePatchImage(this, 0, newTray.y + newTray.targetHeight + 8, "buttonNine", null);
		button.anchor.setTo(0.5, 0);
		button.targetWidth = storeWidth-32;
		button.targetHeight = 50;
		fightersMenuInfo.fightersMenuDialog.addChild(button);
		button.UpdateImageSizes(); //Needed for changing the anchor
		button.inputEnabled = true; //consume events
		button.events.onInputDown.add(this.createFighter.bind(this));

		var newFighterText = this.game.add.bitmapText(0, button.y+(button.targetHeight/2), 'font64', "New Fighter");
		newFighterText.tint = 0x000000;
		fightersMenuInfo.fightersMenuDialog.addChild(newFighterText);
		newFighterText.anchor.setTo(0.5);

		//kill until opened
		fightersMenuInfo.fightersMenuDialog.kill();
	},

	displayFightersMenu: function(){
		this.pauseGame();

		hudInfo.shadowBlanket.revive();
		fightersMenuInfo.fightersMenuDialog.revive();
	},

  //MISC FUNCTIONS *************************************************************
	closeMenus: function(){
		hudInfo.shadowBlanket.kill();
		fightersMenuInfo.fightersMenuDialog.kill();
	},

  starFlash: function(){

    if(starFlash == null){
      starFlash = this.game.add.sprite(0, 0, "star");
      starFlash.anchor.setTo(0.5,0);
      starFlash.animations.add('flicker', [0,1,2,3,4,3,2,1,0]);
    }

    starFlash.x = this.game.rnd.integerInRange(this.game.camera.view.left, this.game.camera.view.right);
    starFlash.y = this.game.rnd.integerInRange(this.game.camera.view.top, this.game.camera.view.bottom);
    starFlash.tint = arrPlanetColors[this.game.rnd.integerInRange(0,arrPlanetColors.length-1)];
    starFlash.animations.play('flicker', 8);
  },

  startNextWave: function(){
		if(!gameInfo.bAllEnemiesSpawned || !gameInfo.bAllCivShipsSpawned) return;

    //INIT NEXT WAVE
    gameInfo.enemies+=5;
    this.updateHudText();

		gameInfo.bAllEnemiesSpawned = false;
		gameInfo.bAllCivShipsSpawned = false;


    this.broadcastMessage("Wave "+gameInfo.wave, function(){
      repeatEvent(
				gameInfo.wave+4, 	//repeat
				10000,							//delay
				this.createEnemy.bind(this),
				function(){ console.log("done with enemies"); gameInfo.bAllEnemiesSpawned = true; }.bind(this),
				this
			);
			repeatEvent(
				gameInfo.wave+4, 	//repeat
				10000,							//delay
				this.createCivShip.bind(this),
				function(){ console.log("done with civShips"); gameInfo.bAllCivShipsSpawned = true; }.bind(this),
				this
			);
    }.bind(this));


  },

  newHudIcon: function(_parent){

    _parent.hudIcon = hudIconGroup.create(0,0,_parent.key, _parent.frame);
		_parent.hudIcon.anchor.setTo(0.5);
		_parent.hudIcon.tint = _parent.tint;
		_parent.hudIcon.scale.setTo(16/((_parent.width>_parent.height)?_parent._frame.width:_parent._frame.height));
    var fromScale = 64/((_parent.width>_parent.height)?_parent._frame.width:_parent._frame.height);
    this.game.add.tween(_parent.hudIcon.scale).from( {x: fromScale, y:fromScale}, 1000, Phaser.Easing.Quadratic.Out, true, 0, 0, false);

    gameInfo.arrHudTargets.push(_parent);
  },

	moneyEvent: function(_location, _value){
		gameInfo.money += _value;
		hudInfo.moneyText.setText("$"+gameInfo.money);

		var moneyText = this.game.add.bitmapText(_location.x, _location.y, 'font64', "$"+_value, 32);

		moneyText.anchor.setTo(0.5);
		this.game.add.tween(moneyText.scale).from( {x:0, y:0}, 1000, Phaser.Easing.Quadratic.InOut, true, 0, 0, false);
		var riseTween = this.game.add.tween(moneyText).to( {y:moneyText.y-30}, 2000, Phaser.Easing.Quadratic.InOut, true, 0, 0, false);
		var fadeTween = this.game.add.tween(moneyText).to( {alpha:0}, 1000, Phaser.Easing.Linear.NONE, false, 0, 0, false);
		riseTween.chain(fadeTween);
	},

	checkWaveComplete: function(){
		if(enemyGroup.length > 0) return;
		if(civShipGroup.length > 0) return;
		if(!gameInfo.bAllEnemiesSpawned || !gameInfo.bAllCivShipsSpawned) return;

    this.broadcastMessage("Wave "+gameInfo.wave+" Complete", function(){
			gameInfo.wave++;
			this.setCenterText("Next Wave", this.startNextWave.bind(this));
		}.bind(this));

	},

	pauseGame: function(_bool){
		this.game.physics.arcade.isPaused = _bool;
	}


};

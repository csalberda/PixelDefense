var szGame = szGame || {};

szGame.Game = function (game) {};

var iWorldWidth = 1000;
var iWorldHeight = 1000;

var starFlash = null;
var buildDialogGroup, shipDialogGroup;
var fighterGroup, satelliteGroup, enemyGroup, planetGroup, civShipGroup;
var fighterBulletGroup, satelliteBulletGroup, enemyBulletGroup;
var hudGroup, hudIconGroup;
var generalDialogGroup, fightersMenuGroup, npcInfoMenuGroup;

var focusedTile = null;
var arrPlanetColors = [0xc15757, 0xc17d57, 0xc1a157, 0xc1c157, 0xa4c157, 0x76c157, 0x57c173, 0x57c19a, 0x57c1bd, 0x57aac1, 0x5788c1, 0x5761c1, 0x7557c1, 0x9157c1, 0xb257c1, 0xc157ad, 0xc15783];
var arrHealthbarColors = [0xff0000,0xff3300,0xff6600,0xff9900,0xffcc00,0xffff00,0xbbff00,0x88ff00,0x44ff00,0x00ff00];

var textStyle = {font: "16px Courier", fill:"#ffffff"};

var gameData = {
	money:5000,
	waveNum:0,
	focusObj: null,
	bAllEnemiesSpawned: true,
	bAllCivShipsSpawned: true,
  arrHudTargets: []
};
var hudData = {
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

var focusMenuData = {
	focusMenu: null
}
var npcInfoMenuData = {
	infoMenu: null
}
var fightersMenuData = {
	fightersMenu: null
}
var generalDialogData = {
	generalDialogMenu: null
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

		this.createPlanets(5);
		this.createHUD();

		this.initGeneralDialog();
		this.initFightersMenu();
		this.initNPCinfoMenu();
		this.initFocusMenu();

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
		if(gameData.focusObj != null){
			gameData.focusObj.manualControl();
			this.game.camera.follow(gameData.focusObj.sprite, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
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
    this.game.physics.arcade.overlap(fighterBulletGroup, enemyGroup, function(_bullet, _enemy){ _enemy.data.parentObject.enemyHit(_bullet); }, null, this);
    this.game.physics.arcade.overlap(enemyBulletGroup, fighterGroup, function(_bullet, _fighter){ _fighter.data.parentObject.fighterHit(_bullet); }, null, this);
    this.game.physics.arcade.overlap(enemyBulletGroup, civShipGroup, function(_bullet, _civShip){ _civShip.data.parentObject.civShipHit(_bullet); }, null, this);
    this.game.physics.arcade.overlap(enemyBulletGroup, satelliteGroup, function(_bullet, _satellite){ _satellite.data.parentObject.satelliteHit(_bullet); }, null, this);
    this.game.physics.arcade.overlap(satelliteBulletGroup, enemyGroup, function(_bullet, _enemy){ _enemy.data.parentObject.enemyHit(_bullet); }, null, this);
  },

	updateTargeting: function () {
		if(gameData.arrHudTargets.length == 0) return;

		var targetingOffset = 12;
		var pointOfInterest = (gameData.focusObj != null)? gameData.focusObj.sprite : {x:this.game.camera.view.centerX, y:this.game.camera.view.centerY};

		gameData.arrHudTargets.forEach(function(_target){
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

		hudData.moneyText = this.game.add.bitmapText(10, 10, 'font64', "$"+gameData.money, hudData.textSize);
		hudGroup.addChild(hudData.moneyText);
		hudData.moneyText.anchor.setTo(0, 0.5);

		hudData.buildFighterButton = hudGroup.create(18, 35, "spritesheet", "shipButton");
		hudData.buildFighterButton.anchor.setTo(0.5);
		hudData.buildFighterButton.inputEnabled = true;
		hudData.buildFighterButton.events.onInputDown.add(this.showFightersMenu.bind(this));

		hudData.buildSatelliteButton = hudGroup.create(45, 35, "spritesheet", "satelliteButton");
		hudData.buildSatelliteButton.anchor.setTo(0.5);
		hudData.buildSatelliteButton.inputEnabled = true;
		hudData.buildSatelliteButton.events.onInputDown.add(this.createSatellite.bind(this));

		hudData.waveText = this.game.add.bitmapText(iGameWidth-10, 10, 'font64', "Wave "+gameData.waveNum, hudData.textSize);
		hudGroup.addChild(hudData.waveText);
		hudData.waveText.anchor.setTo(1, 0.5);

		hudData.enemiesText = this.game.add.bitmapText(iGameWidth-10, 35, 'font64', enemyGroup.countDead()+"/"+enemyGroup.length, hudData.textSize);
		hudGroup.addChild(hudData.enemiesText);
		hudData.enemiesText.anchor.setTo(1, 0.5);

		hudData.centerText = this.game.add.bitmapText(iGameWidth/2, 15, 'font64', '', hudData.textSize);
		hudGroup.addChild(hudData.centerText);
		hudData.centerText.anchor.setTo(0.5);
		hudData.centerText.inputEnabled = true;
		hudData.centerText.events.onInputDown.add(this.centerTextSelected.bind(this, null));

		this.setCenterText("Next Wave", this.startNextWave.bind(this));

		hudData.shadowBlanket = this.game.add.graphics(0,0);
		hudData.shadowBlanket.beginFill(0x00000);
		hudData.shadowBlanket.drawRect(0, 0, iGameWidth, iGameHeight);
		hudData.shadowBlanket.inputEnabled = true; //consume events
		hudData.shadowBlanket.alpha = 0.7;
		hudData.shadowBlanket.events.onInputDown.add(this.closeMenus.bind(this));
		hudData.shadowBlanket.kill(); //kill for now until it is used
		hudGroup.addChild(hudData.shadowBlanket);

	},

	updateHudText: function(){
		hudData.moneyText.setText("$"+gameData.money);
		hudData.waveText.setText("Wave "+gameData.waveNum);
		hudData.enemiesText.setText(enemyGroup.countDead()+"/"+enemyGroup.length);
	},

	setCenterText: function(_string, _callback){
		hudData.centerText.setText(_string);

		if(_callback != undefined){
			hudData.centerText.scale.setTo(1);
			hudData.centerText.bobTween = this.game.add.tween(hudData.centerText.scale).to( {x: 1.2, y:1.2}, 500, Phaser.Easing.Quadratic.InOut, true, 0, 0, true).loop(true);
			hudData.centerText.callback = _callback;
		}
		else
			hudData.centerText.callback = null;
	},

	centerTextSelected: function(){
		hudData.centerText.bobTween.stop();
		hudData.centerText.scale.setTo(0);

		if(hudData.centerText.callback != null) hudData.centerText.callback();
	},

	broadcastMessage: function(_message, _onComplete){
		if(hudData.broadcastText == null){
			hudData.broadcastText = this.game.add.bitmapText(iGameWidth/2, iGameHeight/2, 'font64', "", 64);
			hudGroup.addChild(hudData.broadcastText);
			hudData.broadcastText.anchor.setTo(0.5);
		}

		hudData.broadcastText.setText(_message);
		hudData.broadcastText.position.setTo(iGameWidth/2, iGameHeight/2);
		hudData.broadcastText.alpha = 1;
		hudData.broadcastText.revive();

		var fadeInTween = this.game.add.tween(hudData.broadcastText).from( {alpha:0}, 1000, Phaser.Easing.Quadratic.Out, true, 0, 0, false);
		var inTween = this.game.add.tween(hudData.broadcastText).from( {y:iGameHeight}, 1000, Phaser.Easing.Quadratic.Out, true, 0, 0, false);

		var fadeOutTween = this.game.add.tween(hudData.broadcastText).to( {alpha:0}, 1000, Phaser.Easing.Quadratic.In, false, 0, 0, false);
		var outTween = this.game.add.tween(hudData.broadcastText).to( {y:0}, 1000, Phaser.Easing.Quadratic.In, false, 0, 0, false);

		fadeInTween.chain(fadeOutTween);
		inTween.chain(outTween);

		outTween.onComplete.add(function(){
			hudData.broadcastText.kill();
			if(_onComplete != undefined) _onComplete();
		}, this);
	},

	//FIGHTER *********************************************************************
	initFighterGroup: function(){
		fighterGroup = this.game.add.group();

		fighterBulletGroup = this.game.add.group();
		fighterBulletGroup.enableBody = true;
		fighterBulletGroup.physicsBodyType = Phaser.Physics.ARCADE;
		fighterBulletGroup.createMultiple(20, "spritesheet", 'missile_1');
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
		for (var i=arrFighters.length-1; i>=0; i--) {
			if(arrFighters[i].sprite.alive)
				arrFighters[i].fighterAI(arrTargetSprites);
			else
				arrFighters.splice(i,1); //Remove from arrEnemies
		}
	},


  //CIV SHIP *******************************************************************
	initCivShipGroup: function(){
		civShipGroup = this.game.add.group();
		civShipGroup.enableBody = true;
	},

	createCivShip: function(){
		var newCivShip = new CivShip(arrFighters.length+1, "civShip1", this);
		arrCivShips.push(newCivShip);
		this.newHudIcon(newCivShip.sprite);
	},

  updateCivShipAI: function(){
			for (var i=arrCivShips.length-1; i>=0; i--) {
				if(arrCivShips[i].sprite.alive)
					arrCivShips[i].civShipAI();
				else
					arrCivShips.splice(i,1); //Remove from arrEnemies
			}
  },

	//SATELLITE ******************************************************************
	initSatelliteGroup: function(){
		satelliteGroup = this.game.add.group();

		satelliteBulletGroup = this.game.add.group();
		satelliteBulletGroup.enableBody = true;
		satelliteBulletGroup.physicsBodyType = Phaser.Physics.ARCADE;
		satelliteBulletGroup.createMultiple(20, "spritesheet", 'missile_1');
		satelliteBulletGroup.setAll('anchor.x', 0.5);
		satelliteBulletGroup.setAll('anchor.y', 0.5);
	},

	createSatellite: function(){
		this.closeMenus();

		var newSatellite = new Satellite(arrSatellites.length+1, "satellite1", this);
		arrSatellites.push(newSatellite);

		this.moneyEvent(newSatellite.sprite, -1*newSatellite.value);
	},

  updateSatelliteAI: function(){
		arrTargetSprites = [];
		arrEnemies.forEach(function(_enemy){ if(_enemy.sprite.alive) arrTargetSprites.push(_enemy.sprite)});

		if(arrTargetSprites.length > 0){
			for (var i=arrSatellites.length-1; i>=0; i--) {
				if(arrSatellites[i].sprite.alive)
					arrSatellites[i].satelliteAI(arrTargetSprites);
				else
					arrSatellites.splice(i,1); //Remove from arrEnemies
			}
		}
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

	createEnemy: function(_type){
		var newEnemy = new Enemy(arrEnemies.length+1, enemyCodes[_type], this);
		arrEnemies.push(newEnemy);
		this.newHudIcon(newEnemy.sprite);
	},

  updateEnemyAI: function(){
    //make array of current targets
    var arrTargetSprites = []; //reset array

		arrFighters.forEach(function(_fighter){ if(_fighter.sprite.alive) arrTargetSprites.push(_fighter.sprite)});
		arrSatellites.forEach(function(_satellite){ if(_satellite.sprite.alive) arrTargetSprites.push(_satellite.sprite)});
		arrCivShips.forEach(function(_civShip){ if(_civShip.sprite.alive) arrTargetSprites.push(_civShip.sprite)});

		if(arrTargetSprites.length > 0){
			for (var i=arrEnemies.length-1; i>=0; i--) {
				if(arrEnemies[i].sprite.alive)
					arrEnemies[i].enemyAI(arrTargetSprites);
				else
					arrEnemies.splice(i,1); //Remove from arrEnemies
			}
		}
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

	//FOCUS MENU ************************************************************
	initFocusMenu: function(){
		focusMenuGroup = this.game.add.group();
		focusMenuGroup.fixedToCamera = true;

		var storeWidth = 110;
		var storeHeight = 110;

		focusMenuData.exitBg = new Phaser.NinePatchImage(this, iGameWidth, iGameHeight, "dialogNine", null, "ff0000");
		focusMenuData.exitBg.anchor.setTo(0.5,1);
		focusMenuData.exitBg.targetWidth = 64;
		focusMenuData.exitBg.targetHeight = 100;
		focusMenuData.exitBg.inputEnabled = true;
		focusMenuData.exitBg.events.onInputDown.add(this.hideFocusMenu);
		focusMenuData.exitBg.UpdateImageSizes(); //Needed for changing the anchor
		focusMenuGroup.add(focusMenuData.exitBg);

		focusMenuData.exitText = this.game.add.bitmapText(iGameWidth-12, iGameHeight-80, 'font64', "X");
		focusMenuData.exitText.anchor.setTo(0.5);
		focusMenuGroup.add(focusMenuData.exitText);

		focusMenuData.infoMenuBg = new Phaser.NinePatchImage(this, iGameWidth, iGameHeight, "dialogNine", null, "0000ff");
		focusMenuData.infoMenuBg.anchor.setTo(1,0.5);
		focusMenuData.infoMenuBg.targetWidth = 100;
		focusMenuData.infoMenuBg.targetHeight = 64;
		focusMenuData.infoMenuBg.inputEnabled = true;
		focusMenuData.infoMenuBg.events.onInputDown.add(function(){
			this.showNPCinfoMenu(gameData.focusObj);
		}.bind(this));
		focusMenuData.infoMenuBg.UpdateImageSizes(); //Needed for changing the anchor
		focusMenuGroup.add(focusMenuData.infoMenuBg);

		focusMenuData.infoMenuText = this.game.add.bitmapText(iGameWidth-80, iGameHeight-12, 'font64', "i");
		focusMenuData.infoMenuText.anchor.setTo(0.5);
		focusMenuGroup.add(focusMenuData.infoMenuText);

		focusMenuData.focusMenuBg = new Phaser.NinePatchImage(this, iGameWidth, iGameHeight, "dialogNine", null);
		focusMenuData.focusMenuBg.anchor.setTo(0.5);
		focusMenuData.focusMenuBg.angle = 45;
		focusMenuData.focusMenuBg.targetWidth = storeWidth;
		focusMenuData.focusMenuBg.targetHeight = storeHeight;
		focusMenuData.focusMenuBg.inputEnabled = true; //consume events
		focusMenuData.focusMenuBg.UpdateImageSizes(); //Needed for changing the anchor
		focusMenuGroup.add(focusMenuData.focusMenuBg);

		focusMenuData.sprite = focusMenuGroup.create(iGameWidth-20, iGameHeight-30, "spritesheet", 'galaga1');
		focusMenuData.sprite.anchor.setTo(0.5);

		focusMenuData.healthText = this.game.add.bitmapText(iGameWidth-32, iGameHeight-10, 'font64', "20/100");
		focusMenuData.healthText.anchor.setTo(0.5);
		focusMenuData.healthText.scale.setTo(0.5);
		focusMenuGroup.add(focusMenuData.healthText);

		//kill until opened
		focusMenuGroup.visible = false;
	},

	showFocusMenu: function(_npc){
		//update sprite
		focusMenuData.sprite.loadTexture(_npc.sprite.key);
		if(focusMenuData.sprite.frameName != "")
			focusMenuData.sprite.frameName = _npc.sprite.frameName;

		//update health
		var scale = _npc.curHp / _npc.maxHp;
		focusMenuData.healthText.setText(_npc.curHp+"/"+_npc.maxHp);
		var tint = (scale == 1)? arrHealthbarColors[9] : arrHealthbarColors[Math.floor(scale*10)]
	  focusMenuData.healthText.tint = tint;

		focusMenuGroup.visible = true;
	},

	hideFocusMenu: function(){
		focusMenuGroup.visible = false;
		if(gameData.focusObj != null){
			gameData.focusObj.bFocused = false;
			gameData.focusObj = null;
		}
	},

	//GENERAL DIALOG ************************************************************
	initGeneralDialog: function(){
		generalDialogGroup = this.game.add.group();
		generalDialogGroup.fixedToCamera = true;

		var dialogWidth = 400;
		var dialogHeight = 500;

		generalDialogData.generalDialogBg = new Phaser.NinePatchImage(this, iGameWidth/2, (iGameHeight-dialogHeight)/2, "dialogNine", null);
		generalDialogData.generalDialogBg.anchor.setTo(0.5, 0);
		generalDialogData.generalDialogBg.targetWidth = dialogWidth;
		generalDialogData.generalDialogBg.targetHeight = dialogHeight;
		generalDialogData.generalDialogBg.inputEnabled = true; //consume events
		generalDialogData.generalDialogBg.UpdateImageSizes(); //Needed for changing the anchor
		generalDialogGroup.add(generalDialogData.generalDialogBg);

		generalDialogData.newTray = new Phaser.NinePatchImage(this, 0, 16, "trayNine", null);
		generalDialogData.newTray.anchor.setTo(0.5, 0);
		generalDialogData.newTray.targetWidth = dialogWidth-32;
		generalDialogData.newTray.targetHeight = generalDialogData.generalDialogBg.targetHeight-88;
		generalDialogData.generalDialogBg.addChild(generalDialogData.newTray);
		generalDialogData.newTray.UpdateImageSizes(); //Needed for changing the anchor

		generalDialogData.dialogText = this.game.add.bitmapText(0, generalDialogData.newTray.y+generalDialogData.newTray.targetHeight/2, 'font64', "DIALOG TEXT HERE");
		generalDialogData.generalDialogBg.addChild(generalDialogData.dialogText);
		generalDialogData.dialogText.anchor.setTo(0.5);

		generalDialogData.button = new Phaser.NinePatchImage(this, 0, generalDialogData.newTray.y + generalDialogData.newTray.targetHeight + 8, "buttonNine", null);
		generalDialogData.button.anchor.setTo(0.5, 0);
		generalDialogData.button.targetWidth = dialogWidth-32;
		generalDialogData.button.targetHeight = 50;
		generalDialogData.generalDialogBg.addChild(generalDialogData.button);
		generalDialogData.button.UpdateImageSizes(); //Needed for changing the anchor
		generalDialogData.button.inputEnabled = true; //consume events

		generalDialogData.buttonText = this.game.add.bitmapText(0, generalDialogData.button.y+(generalDialogData.button.targetHeight/2), 'font64', "BUTTON TEXT HERE");
		generalDialogData.buttonText.tint = 0x000000;
		generalDialogData.generalDialogBg.addChild(generalDialogData.buttonText);
		generalDialogData.buttonText.anchor.setTo(0.5);

		generalDialogGroup.visible = false;
	},

	showGeneralDialog: function(_text, _buttonText, _buttonCallback){
		this.pauseGame();

		generalDialogData.dialogText.setText(_text);
		generalDialogData.buttonText.setText(_buttonText);

		generalDialogData.button.events.onInputDown.add(function(){
			this.closeMenus();
			_buttonCallback();
		}.bind(this));

		hudData.shadowBlanket.revive();
		generalDialogGroup.visible = true;
	},

	//FIGHTERS MENU ************************************************************
	initFightersMenu: function(){
		fightersMenuGroup = this.game.add.group();
		fightersMenuGroup.fixedToCamera = true;

		var storeWidth = 400;
		var storeHeight = 500;

		fightersMenuData.fightersMenuBg = new Phaser.NinePatchImage(this, iGameWidth/2, (iGameHeight-storeHeight)/2, "dialogNine", null);
		fightersMenuData.fightersMenuBg.anchor.setTo(0.5, 0);
		fightersMenuData.fightersMenuBg.targetWidth = storeWidth;
		fightersMenuData.fightersMenuBg.targetHeight = storeHeight;
		fightersMenuData.fightersMenuBg.inputEnabled = true; //consume events
		fightersMenuData.fightersMenuBg.UpdateImageSizes(); //Needed for changing the anchor
		fightersMenuGroup.add(fightersMenuData.fightersMenuBg);

		var newFighterText = this.game.add.bitmapText(0, 16, 'font64', "Fighters");
		fightersMenuData.fightersMenuBg.addChild(newFighterText);
		newFighterText.anchor.setTo(0.5);

		var newTray = new Phaser.NinePatchImage(this, 0, newFighterText.bottom+8, "trayNine", null);
		newTray.anchor.setTo(0.5, 0);
		newTray.targetWidth = storeWidth-32;
		newTray.targetHeight = fightersMenuData.fightersMenuBg.targetHeight-100;
		fightersMenuData.fightersMenuBg.addChild(newTray);
		newTray.UpdateImageSizes(); //Needed for changing the anchor

		var button = new Phaser.NinePatchImage(this, 0, newTray.y + newTray.targetHeight + 8, "buttonNine", null);
		button.anchor.setTo(0.5, 0);
		button.targetWidth = storeWidth-32;
		button.targetHeight = 50;
		fightersMenuData.fightersMenuBg.addChild(button);
		button.UpdateImageSizes(); //Needed for changing the anchor
		button.inputEnabled = true; //consume events
		button.events.onInputDown.add(this.createFighter.bind(this));

		var newFighterText = this.game.add.bitmapText(0, button.y+(button.targetHeight/2), 'font64', "New Fighter");
		newFighterText.tint = 0x000000;
		fightersMenuData.fightersMenuBg.addChild(newFighterText);
		newFighterText.anchor.setTo(0.5);

		fightersMenuGroup.visible = false;
	},

	showFightersMenu: function(){
		this.pauseGame();

		hudData.shadowBlanket.revive();
		fightersMenuGroup.visible = true;
	},

	//FIGHTER INFO MENU ************************************************************
	initNPCinfoMenu: function(){
		npcInfoMenuGroup = this.game.add.group();
		npcInfoMenuGroup.fixedToCamera = true;

		var storeWidth = 400;
		var storeHeight = 500;

		npcInfoMenuData.infoMenuBg = new Phaser.NinePatchImage(this, iGameWidth/2, (iGameHeight-storeHeight)/2, "dialogNine", null);
		npcInfoMenuData.infoMenuBg.anchor.setTo(0.5, 0);
		npcInfoMenuData.infoMenuBg.targetWidth = storeWidth;
		npcInfoMenuData.infoMenuBg.targetHeight = storeHeight;
		npcInfoMenuData.infoMenuBg.inputEnabled = true; //consume events
		npcInfoMenuData.infoMenuBg.UpdateImageSizes(); //Needed for changing the anchor
		npcInfoMenuGroup.add(npcInfoMenuData.infoMenuBg);

		npcInfoMenuData.nameText = this.game.add.bitmapText(0, 16, 'font64', "SET NAME HERE");
		npcInfoMenuData.nameText.anchor.setTo(0.5);
		npcInfoMenuData.infoMenuBg.addChild(npcInfoMenuData.nameText);

		npcInfoMenuData.tray = new Phaser.NinePatchImage(this, 0, npcInfoMenuData.nameText.bottom+8, "trayNine", null);
		npcInfoMenuData.tray.anchor.setTo(0.5, 0);
		npcInfoMenuData.tray.targetWidth = storeWidth-32;
		npcInfoMenuData.tray.targetHeight = npcInfoMenuData.infoMenuBg.targetHeight-100;
		npcInfoMenuData.infoMenuBg.addChild(npcInfoMenuData.tray);
		npcInfoMenuData.tray.UpdateImageSizes(); //Needed for changing the anchor

		npcInfoMenuData.repairBtn = new Phaser.NinePatchImage(this, 0, npcInfoMenuData.tray.y + npcInfoMenuData.tray.targetHeight + 8, "buttonNine", null);
		npcInfoMenuData.repairBtn.anchor.setTo(0.5, 0);
		npcInfoMenuData.repairBtn.targetWidth = storeWidth-32;
		npcInfoMenuData.repairBtn.targetHeight = 50;
		npcInfoMenuData.infoMenuBg.addChild(npcInfoMenuData.repairBtn);
		npcInfoMenuData.repairBtn.UpdateImageSizes(); //Needed for changing the anchor
		npcInfoMenuData.repairBtn.inputEnabled = true; //consume events
		npcInfoMenuData.repairBtn.events.onInputDown.add(function(){
			this.npcMenuRepair(gameData.focusObj);
		}.bind(this));

		npcInfoMenuData.repairText = this.game.add.bitmapText(0, npcInfoMenuData.repairBtn.y+(npcInfoMenuData.repairBtn.targetHeight/2), 'font64', "Repair");
		npcInfoMenuData.repairText.tint = 0x000000;
		npcInfoMenuData.infoMenuBg.addChild(npcInfoMenuData.repairText);
		npcInfoMenuData.repairText.anchor.setTo(0.5);

		npcInfoMenuGroup.visible = false;
	},

	showNPCinfoMenu: function(_npc){
		this.pauseGame();
		this.closeMenus();

		npcInfoMenuData.nameText.setText(_npc.name);

		npcInfoMenuGroup.visible = true;
		hudData.shadowBlanket.revive();
	},

	npcMenuRepair: function(_npc){
		var repairCost = (_npc.maxHp - _npc.curHp)*10;
		this.moneyEvent({x: this.game.camera.view.centerX, y:this.game.camera.view.centerY}, -1*repairCost);
		_npc.curHp = _npc.maxHp;
	},

  //MISC FUNCTIONS *************************************************************
	closeMenus: function(){
		hudData.shadowBlanket.kill();
		generalDialogGroup.visible = false;
		fightersMenuGroup.visible = false;
		npcInfoMenuGroup.visible = false;
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
		if(!gameData.bAllEnemiesSpawned || !gameData.bAllCivShipsSpawned) return;

		var startWave = function(){
	    //INIT NEXT WAVE
	    this.updateHudText();
			gameData.bAllEnemiesSpawned = false;
			gameData.bAllCivShipsSpawned = false;

	    this.broadcastMessage("Wave "+gameData.waveNum, function(){

	      repeatSpawnEvent(
					waveInfo[gameData.waveNum].arrEnemyTypes, //repeat
					waveInfo[gameData.waveNum].enemyDelay,	//delay
					this.createEnemy.bind(this),
					function(){ console.log("done spawning enemies"); gameData.bAllEnemiesSpawned = true; }.bind(this),
					this
				); //Enemies

				repeatSpawnEvent(
					waveInfo[gameData.waveNum].arrCivShipTypes, 	//repeat
					waveInfo[gameData.waveNum].civShipDelay,	//delay
					this.createCivShip.bind(this),
					function(){ console.log("done spawning civShips"); gameData.bAllCivShipsSpawned = true; }.bind(this),
					this
				); //CivShips

	    }.bind(this));
		}.bind(this);

		if(waveInfo[gameData.waveNum].dialogText != undefined){
			this.showGeneralDialog(waveInfo[gameData.waveNum].dialogText, "OK", startWave)
			return;
		}
		else {
			startWave();
		}
  },

  newHudIcon: function(_parent){

    _parent.hudIcon = hudIconGroup.create(0,0,_parent.key, _parent.frame);
		_parent.hudIcon.anchor.setTo(0.5);
		_parent.hudIcon.tint = _parent.tint;
		_parent.hudIcon.scale.setTo(16/((_parent.width>_parent.height)?_parent._frame.width:_parent._frame.height));
    var fromScale = 64/((_parent.width>_parent.height)?_parent._frame.width:_parent._frame.height);
    this.game.add.tween(_parent.hudIcon.scale).from( {x: fromScale, y:fromScale}, 1000, Phaser.Easing.Quadratic.Out, true, 0, 0, false);

    gameData.arrHudTargets.push(_parent);
  },

	moneyEvent: function(_location, _value){
		gameData.money += _value;
		hudData.moneyText.setText("$"+gameData.money);

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
		if(!gameData.bAllEnemiesSpawned || !gameData.bAllCivShipsSpawned) return;

    this.broadcastMessage("Wave "+gameData.waveNum+" Complete", function(){
			gameData.waveNum++;
			this.setCenterText("Next Wave", this.startNextWave.bind(this));
		}.bind(this));

	},

	pauseGame: function(_bool){
		this.game.physics.arcade.isPaused = _bool;
	}

};

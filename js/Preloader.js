var szGame = szGame || {};

szGame.Preloader = function (game) {};

var assetPath = "assets/images/";

szGame.Preloader.prototype = {

    preload: function() {
      //this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

      this.game.load.bitmapFont('font64', assetPath+'fonts/font64.png', assetPath+'fonts/font64.fnt');

      this.game.load.image('background', assetPath+'background.png');
      this.game.load.atlas('spritesheet', assetPath+'spritesheet.png', assetPath+'spritesheet.json');

      this.game.load.spritesheet('thrust', assetPath+'anims/thrust.png', 8, 16, 2);
      this.game.load.spritesheet('star', assetPath+'anims/star.png', 10, 10, 5);
      this.game.load.spritesheet('shield', assetPath+'anims/shield.png', 24, 24, 2);
      this.game.load.spritesheet('civShipSheet', assetPath+'anims/civShipSheet.png', 16, 32, 12);
      this.game.load.spritesheet('enemyExplosion', assetPath+'anims/explosion.png', 32, 32, 5);
      this.game.load.spritesheet('playerExplosion', assetPath+'anims/player_explosion.png', 32, 32, 4);
      this.game.load.spritesheet('galagaEnemies', assetPath+'anims/galaga.png', galagaEnemies.frameWidth, galagaEnemies.frameHeight, galagaEnemies.totalFrames);
      this.game.load.spritesheet('galagaPlayer', assetPath+'anims/galaga.png', 16, 16, 2);
    },

    //Called after each file is loadedd
//    fileComplete: function(progress, cacheKey, success, totalLoaded, totalFiles) {
//      console.log("File: ("+totalLoaded+"/"+totalFiles+") "+progress+"% '"+cacheKey+"'");
//    },

    update: function() {

    },

    //PAUSES GAME
    create: function() {
        szGame.game.state.start('Game');
    },


};

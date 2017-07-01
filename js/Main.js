var szGame = szGame || {};

/************ VERSION and DATE ************/
console.log("Title: Master Game Template | Version: 1.0.0 | Date: MM/DD/YY");

iGameWidth = 600;
iGameHeight = 600;
szGame.game = new Phaser.Game(iGameWidth, iGameHeight, Phaser.AUTO, 'phaser-content');

/* STATES *********************************************************************/
szGame.game.state.add('Boot', szGame.Boot);
szGame.game.state.add('Preloader', szGame.Preloader);
szGame.game.state.add('Game', szGame.Game);

szGame.game.state.start('Preloader');

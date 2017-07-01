var szGame = szGame || {};

szGame.Boot = function (game) {};

szGame.Boot.prototype = {

	//RESERVED FUNCTION CALL: RUNS ONCE BEFORE CREATE
	preload: function () {

  },

	//RESERVED FUNCTION CALL: RUNS BEFORE UPDATE
	create: function () {
		 szGame.game.state.start('Preloader');
	},

	//RESERVED FUNCTION CALL: RUNS CONTINUOUSLY AFTER CREATE
	update: function () {

	}
};

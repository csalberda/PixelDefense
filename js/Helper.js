

function mapNumbers(x, in_min, in_max, out_min, out_max)	{
	return (x-in_min) * (out_max-out_min) / (in_max-in_min) + out_min;
}

function slopeBetweenObj(_obj1, _obj2){
	return angleDeg = Math.atan2(_obj2.y - _obj1.y, _obj2.x - _obj1.x)*180 / Math.PI;
}

function distBetweenObj(_obj1, _obj2){
	return Math.sqrt( Math.pow((_obj1.x-_obj2.x), 2) + Math.pow((_obj1.y-_obj2.y), 2) );
}

function findClosestObjAlive(_obj, _arr){

	closestObj = null;
	closestDist = 9999999;
	for (var i=0; i<_arr.length; i++) {
		var x1 = _obj.x;
		var y1 = _obj.y;
		var x2 = _arr[i].x;
		var y2 = _arr[i].y;
		var dist = this.distBetweenObj(_obj, _arr[i]);
		if(_arr[i].alive && (closestObj == null || dist<closestDist)){
			closestObj = _arr[i];
			closestDist = dist;
		}
	}
	return closestObj;
}

// function repeatEvent(_num, _delay, _event, _onComplete, _game){
//
// 	_event();
//
// 	if(_num > 1)
// 	_game.game.time.events.add(_delay, repeatSpawnEvent.bind(this, _num-1, _delay, _event, _onComplete, _game), this);
// 	else
// 	_onComplete();
// }

function repeatSpawnEvent(_array, _delay, _event, _onComplete, _game){

	_event(_array[0]);

	if(_array.length > 1){
		var type = _array.shift();
		_game.game.time.events.add(_delay, repeatSpawnEvent.bind(this, _array, _delay, _event, _onComplete.bind(this, type), _game), this);
	}
	else
	_onComplete();
}

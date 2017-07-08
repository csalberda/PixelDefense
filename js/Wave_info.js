var enemyCodes = {
  A:"asteroid",
  G:"galagaGreen"
}
var civShipCodes = {
  0:0,
  1:1,
  2:2,
  3:3,
  4:4,
  5:5,
}

var waveInfo = [
  {
    dialogText : "Dear Pixel Defence,\n\n\tMeteorites are a constant\nnuisance to our citizens. Per\nour new inter-planetary\ndefence contract, any damages\non our planet due to \nmeteorites are now your\n responsibility. \nRemember, the bigger the \nasteroid, the more damage\n you are liable for!\n\n-President Willy.",
    arrCivShipTypes: [],
    civShipDelay : 0,
    arrEnemyTypes: ["G","G","A","G","A"],
  	enemyDelay : 2000
  },
  {
    dialogText : "Dear Pixel Defence,\n\tWord is there are space pirates in our neck of the woods. They attack and scavange where they can. It is your duty to... resolve this issue.\n-President Willy.",
    arrCivShipTypes: [],
    civShipDelay : 0,
    arrEnemyTypes: ["A","A","G","A","A","A","G","A","A","A"],
  	enemyDelay : 2000
  },
  {
    arrCivShipTypes: [],
    civShipDelay : 0,
    arrEnemyTypes: ["A","A","G","A","A","A","G","A","A","A"],
  	enemyDelay : 2000
  }
]

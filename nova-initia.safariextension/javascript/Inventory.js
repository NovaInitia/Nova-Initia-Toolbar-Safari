/*
	Inventory.js
	A Class which holds all items in the User's inventory.

	Ryan
*/

function Inventory()
{
	//default values
	this.traps = 0;
	this.signs = 0;
	this.doors = 0;
	this.barrels = 0;
	this.spiders = 0;
	this.shields = 0;
	
	this.shieldHitsLeft = 0;
	this.shieldOn = false;

	this.sg = 0;

	//be sure to use this to set the value of the shield
	this.setShieldOn = function(on)
	{
		if(on === "0") {
			shieldOn = false;
			shieldHitsLeft = 0;
		}
		else if(on === "1") {
			shieldOn = true;
			shieldHitsLeft = 1;
		}
		else if(on === "2") {
			shieldOn = true;
			shieldHitsLeft = 2;
		}
		else if(on === "3") {
			shieldOn = true;
			shieldHitsLeft = 3;
		}
		else {
			shieldOn = true;
		}
	}

	this.isShieldOn = function()
	{
		return shieldOn;
	}

	//Todo: unused function
	this.decrementShieldHits = function()
	{
		if(shieldHitsLeft > 0) shieldHitsLeft--;
		return shieldHitsLeft;
	}

	this.shield_on = "images/icons/shield.ico";
	this.shield_off = "images/icons/no-shield.ico";

	//constant IDs returned in a json file
	// const trap_ID = 0;
	// const barrel_ID = 1;
	// const spider_ID = 2;
	// const shield_ID = 3;
	// const door_ID = 4;
	// const sign_ID = 5;
	this.trap_ID = 0;
	this.barrel_ID = 1;
	this.spider_ID = 2;
	this.shield_ID = 3;
	this.door_ID = 4;
	this.sign_ID = 5;
}

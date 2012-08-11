/*
	User.js
	The user class stores variables associated with the current user.

	Ryan
*/

function User()
{
	this.username = "";
	this.password = "";
	this.playerClass = null;
	this.inventory = new Inventory();
	this.lastkey = null;
	this.messages = null;
}

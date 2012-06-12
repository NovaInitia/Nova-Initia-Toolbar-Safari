function Page()
{
	this.Trap = new Object();
	this.Trap.visible = false;
	this.Trap.username = "";

	this.Barrel = new Object();
	this.Barrel.visible = false;
	this.Barrel.username = "";
	this.Barrel.barrelID = "";

	this.Spider = new Object();
	this.Spider.username = "";

	this.Door = new Object();
	this.Door.username = new Array();
	this.Door.comment = new Array();
	this.Door.did = new Array();
	this.Door.count = 0;
	this.Door.nsfw = new Array();
	this.Door.currentDoorusername = undefined;
	this.Door.lastDoorusername =undefined;
	this.Door.currentDoorid=undefined;
	this.Door.lastDoorid=undefined;

	this.tourStartPage = undefined;
	this.tourStartID = 0;


	this.setTrap = function(username,visible)
	{
		this.Trap.username = username;
		this.Trap.visible = visible;
	}

	this.setBarrel =function(username,visible,bID)
	{
		this.Barrel.username = username;
		this.Barrel.visible = visible;
		this.Barrel.barrelID = bID;
	}

	this.setSpider =function(username)
	{
		this.Spider.username = username;
	}

	this.addDoor =function(username, comment, did,nsf)
	{
		//alert(username);
		this.Door.username[this.Door.count] = username;
		this.Door.comment[this.Door.count] = comment;
		this.Door.did[this.Door.count] = did;
		this.Door.nsfw[this.Door.count] = nsf;
		this.Door.count++;
	}
	this.addCurrentDoor = function(prevun,previd)
	{
		this.Door.currentDoorusername = prevun;
		this.Door.currentDoorid=previd;
	}
	this.setTourStartPage = function(bool,id)
	{
		this.tourStartPage = bool;
		this.tourStartID = id;
	}
}

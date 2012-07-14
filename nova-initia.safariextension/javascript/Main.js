/*
 *	Pretty self explanitory...
 *	The main javascript file for the Official Nova Initia Safari extension.
 *
 *	Copyright 2012 Team Fedora and Nova Initia. All rights reserved.
 *	Authors: Ryan McCann and Michael DeRoy
 */

//Global variables
var _user = null;
var _key = null;
var _ID = null;
var _baseURI = null;
var _page = null;
var _tour = null;
var _ni_button = null;
var _urlHash = null;
var _domainHash = null;

var _stayLoggedIn = true;

function init()
{
	//create global pointer to the ni_button
	for(var i=0; i<safari.extension.toolbarItems.length; i++)
	{
		var item = safari.extension.toolbarItems[i];
		if(item.identifier == "nova-initia-button") _ni_button = item;
	}
}

function getBaseURI()
{
	return _baseURI;
}

function showLogin()
{
	displayPopover("loginPopover", "popovers/login.html", 160);
}

function login(usr,pwd)
{
	var user, pass;
	if(usr && pwd) //login with new username/password
	{
		user = usr;
		pass = pwd;
	}
	else //login using saved username/password
	{
		user = safari.extension.settings.username;
		pass = safari.extension.settings.password;
	}

	safari.extension.settings.username = user;
	safari.extension.settings.password = pass;

	_stayLoggedIn = safari.extension.settings.stay_logged_in;

	var key = fetchKey(user);

	//construct new User object
	_user = new User();
	_user.lastkey = key;

	//initialize page
	_page = new Page();

	//work with pass
	pass = sha256(pass);
	pass = pass + key;
	pass = sha256(pass);

	var login_url = "http://data.nova-initia.com/login2.php";
	var params = "login=1&pwd=" + pass + "&uname=" + user + "&LastKey=" + key;
	
	var resp = send_request(login_url, "POST", params);

	
	if(/Error:/.test(resp.responseText)) //if the response is an error message
	{
		getPopover("loginPopover").contentWindow.errorMsg(resp.responseText);

		//safari.extension.settings.username = null;
		//safari.extension.settings.password = null;
		//return;
	}

	var json = jQuery.parseJSON(resp.responseText);
	//fill in fields in user
	_user.username = user;
	_user.password = pass;
	_user.playerClass = json.user.Class;

	_baseURI = safari.extension.baseURI;

	//note that the tool number does not correspond with the order of the tools
	_user.inventory.traps = json.user.Tool0;
	_user.inventory.barrels = json.user.Tool1;
	_user.inventory.signs = json.user.Tool5;
	_user.inventory.doors = json.user.Tool4;
	_user.inventory.spiders = json.user.Tool2;
	_user.inventory.shields = json.user.Tool3;
	
	_user.inventory.setShieldOn(json.user.isShielded);

	_user.inventory.sg = json.user.Sg;

	_ID = json.user.ID;

	$("#login_register").hide();
	$(".tool_buttons").show();
	$("#preferences > img").show();

	//save the url_hash and domain_hash
	var url_and_domain = UrlToHash(getURL(),true);
	_url_hash = url_and_domain['url'];
	_domain_hash = url_and_domain['domain'];

	//open page on longin -removed because it caused it to glitch
	//openedPage();

	//update displayed amounts
	updateButtons();
}

function logout()
{
	_user = null;
	if(!_stayLoggedIn) clearLogin();

	$("#login_register").show();
	$(".tool_buttons").hide();
	$("#preferences > img").hide();
}

function register()
{
	safari.application.activeBrowserWindow.openTab().url = "http://www.nova-initia.com/register.php";
}

function preferences()
{
	displayPopover("preferences", "popovers/preferences.html");
}
function clearLogin()
{
	//remove locally saved credentials
	safari.extension.settings.username = null;
	safari.extension.settings.password = null;
}

function placeTrap()
{
	//TODO
	//if(at_a_page && toolcount>0)

	var trap_url = "http://data.nova-initia.com/rf/remog/page/"+getHashedURL(getURL())+"/"+getHashedDomain(getURL())+"/"+_user.inventory.trap_ID+".json";
	var resp = send_request(trap_url,"POST",null);

	var json = jQuery.parseJSON(resp.responseText);
	if(json.fail)
	{
		//failed
		if(json.fail == true)
		{
			removeAllPopovers();
			var myPop = safari.extension.createPopover("trapFailed", safari.extension.baseURI + "popovers/trapFailed.html",250, 205);

			_ni_button.popover = myPop;
			_ni_button.showPopover();

			_user.inventory.traps -= 1;
			updateButtons();

			// failTimeout = this.autoClose(failTimeout,"nova_initia_fail_panel", 3000);
		}
	}
	//success
	if(json.pageSet)
	{
		if(json.pageSet.ID)
		{
			removeAllPopovers();
			var myPop = safari.extension.createPopover("placedTrap", safari.extension.baseURI + "popovers/placedTrap.html",250, 205);

			_ni_button.popover = myPop;
			_ni_button.showPopover();
				
			_user.inventory.traps -= 1;
			updateButtons();
		}
	}
	if(json.result)
	{
		if (json.result=="Page Full")
		{
		removeAllPopovers();
		var myPop = safari.extension.createPopover("trapsFull", safari.extension.baseURI + "popovers/trapsFull.html",250, 30);

		_ni_button.popover = myPop;
		_ni_button.showPopover();

			//this.send_notification("Page full, please try again later","PRIORITY_INFO_LOW");
		}
		else
		{
			//The trap was blocked by a spider

			// if(json.result == "Trap Blocked!"){
			_page.setSpider(json.username);
			removeAllPopovers();
			var myPop = safari.extension.createPopover("trapBlocked", safari.extension.baseURI + "popovers/trapBlocked.html",250, 205);

			_ni_button.popover = myPop;
			_ni_button.showPopover();

			//Decrement user's SG
			_user.inventory.sg -= json.Sg===undefined?0:json.Sg;
			if(_user.inventory.sg < 0) _user.inventory.sg = 0; //can't have negative sg

			//Decrement user's traps, destroy shield
			_user.inventory.traps -= 1;
			_user.inventory.setShieldOn("0"); //destroy shield

			updateButtons();
		}
	}
}
function showBarrelPopover()
{
	removeAllPopovers();

	var myPop = safari.extension.createPopover("placeBarrel", safari.extension.baseURI + "popovers/placeBarrel.html", 244, 400);
	_ni_button.popover = myPop;
	_ni_button.showPopover();
}
function placeBarrel(sg, traps, barrels, spiders, shields, doors, signs, comment)
{
	var proceed = true;

	sg = Number(sg);
	traps = Number(traps);
	barrels = Number(barrels);
	spiders = Number(spiders);
	shields = Number(shields);
	doors = Number(doors);
	signs = Number(signs);

	var giver_ID = "1";
	var limit = _user.playerClass==giver_ID ? 100 : 10;

	var msg=""; //error message to display

	if (((sg/10)
		+traps
		+barrels
		+spiders
		+shields
		+doors
		+signs) > limit)
	{
		proceed = false;
		msg = "Too many items";
	}

	if(sg > _user.inventory.sg ||
		traps > _user.inventory.traps || 
		barrels > _user.inventory.barrels || 
		spiders > _user.inventory.spiders || 
		shields > _user.inventory.shields || 
		doors > _user.inventory.doors || 
		signs > _user.inventory.signs)
		{
			proceed = false;
			msg = "Inventory too low.";
		}

	if(traps==0&&barrels==0&&spiders==0&&shields==0&&doors==0&&signs==0&&sg==0)
	{
		proceed=false;
		msg = "Cannot Stash Empty Barrels";
	}

	if(proceed)
	{
		var theParams = {
							"Comment" : urlencode(comment),
							"Tool0" : traps,
							"Tool1" : barrels,
							"Tool2" : spiders,
							"Tool3" : shields,
							"Tool4" : doors,
							"Tool5"	: signs,
							"Sg" : sg
						};
		
		var theRes = send_request("http://data.nova-initia.com/rf/remog/page/"+getHashedURL(getURL())+"/"+getHashedDomain(getURL())+"/"+_user.inventory.barrel_ID+".json","POST",JSON.stringify(theParams));
		
		if(theRes.status==201 || theRes.status==200)
		{
			// NovaInitia.Toolbar.check_tool_set(theRes,barrel_tool_id);
			var tmpBarrelInfo = JSON.parse(theRes.responseText);

			if(tmpBarrelInfo.error)
			{
				if(tmpBarrelInfo.error == "low inventory")
				{
					console.log("Error: low inventory");
				}
				else alert(tmpBarrelInfo.error);
				
			}

			if(tmpBarrelInfo.fail == true)
			{
				displayPopover("barrelFailed", "popovers/fail/barrelFailed.html");
				console.log("Barrel failed");
			}

		}
		else
		{
			console.log("Barrel Stash received a bad response!");
		}

		//display success popover
		displayPopover("barrelSet", "popovers/barrelSet.html");
		//update inventory
		var inv = _user.inventory;
		inv.sg -= sg;
		inv.traps -= traps;
		inv.barrels -= barrels;
			inv.barrels -= 1; //always need to decrement the barrel being placed
		inv.signs -= signs;
		inv.doors -= doors;
		inv.spiders -= spiders;
		inv.shields -= shields;

		updateButtons();
	}
	else //barrel failed (proceed==false)
	{
		displayPopover("barrelFailed", "popovers/fail/barrelFailed.html");
		console.log(msg);
		//getPopover("barrelFailed").contentWindow.errorMsg(msg);
	}
}

function showSignPopover()
{
	displayPopover("placeSign", "popovers/placeSign.html");
}
function placeSign(title, comments, nsfw)
{
	// if(signpost_tool_amount>0 && at_a_page)
	alert(_user);
	var theParams = "Url="+urlencode(getURL());

	if(title!="") theParams = theParams+"&Title="+urlencode(title);
	if(comments!="") theParams = theParams+"&Comment="+urlencode(comments);
	
	theParams = theParams+"&NSFW="+nsfw;

	var theRes = send_request("http://data.nova-initia.com/rf/remog/page/"+getHashedURL(getURL())+"/"+getHashedDomain(getURL())+"/"+_user.inventory.sign_ID+".json","POST",theParams);

	if(theRes.status==201 || theRes.status==200)
	{
		var tmp_info = jQuery.parseJSON(theRes.responseText);

		//sign failed
	 	if(tmp_info.fail)
	 	{
		 	if(tmp_info.fail==true)
		 	{
				displayPopover("signFailed", "popovers/fail/signFailed.html", 202);
		 		// alert("Signpost Failed!");
		 		_user.inventory.signs -= 1;
				updateButtons();
			}
		}

		//successful?
		if(tmp_info.pageSet)
	 	{
		 	if(tmp_info.pageSet.ID)
		 	{
				displayPopover("signSet", "popovers/signSet.html", 202);
		 		// alert("Signpost Placed!");
		 		_user.inventory.signs -= 1;
				updateButtons();
		 	}
		}

		//failed
		if(tmp_info.result)
		{
			if (tmp_info.result=="Page Full")
			{
				alert("Page full, please try again later");
			}
			else
			{
				if(tmp_info.result=="Signpost Blocked!")
				{
					// NovaInitia.Toolbar.show_panel(spider_panel);
					_user.inventory.signs -= 1;
					updateButtons();
				}
			}
		}
		
		//error
		if(tmp_info.error)
		{
			// this.send_notification(tmp_info.error,"PRIORITY_INFO_LOW");
		}
	}
	else
	{
		alert("Signpost received a bad response!");
	}
}
function showDoorPopover()
{
	removeAllPopovers();

	var myPop = safari.extension.createPopover("placeDoor", safari.extension.baseURI + "popovers/placeDoor.html", 244, 250);
	_ni_button.popover = myPop;
	_ni_button.showPopover();
}
function placeDoor(theUrl, theHint, theComment, nsfw)
{
	//these are not implemented yet
	var theGroupID = "";
	var theParentID = "";
	// var doorway_cached = null;
 	// var tmp_doorway = null;

	if(theUrl != null)
	{
		var theParams = "Url="+urlencode(theUrl)+"&Hint="+urlencode(theHint)+"&Comment="+urlencode(theComment)+"&Home="+urlencode(getURL())+"&NSFW="+nsfw;

		// if(doorway_popup_panel_add_to_checkbox.checked)
		if(false) // add to chain checkbox
		{
			if(theGroupID) theParams = theParams+"&GroupID="+theGroupID;
		}

		var resp = send_request("http://data.nova-initia.com/rf/remog/page/"+getHashedURL(getURL())+"/"+getHashedDomain(getURL())+"/"+_user.inventory.door_ID+".json","POST",theParams);

		if(resp.status==201 || resp.status==200)
		{
		 	var tmp_info = jQuery.parseJSON(resp.responseText);

		 	//some failure
		 	if(tmp_info.fail)
		 	{
			 	if(tmp_info.fail==true)
			 	{
					alert("Doorway failed");
					displayPopover("doorFailed", "popovers/fail/doorFailed.html");
			 		
			 		_user.inventory.doors -= 1;
					updateButtons();
				}
			}
			
			//Success - I think
			if(tmp_info.pageSet)
		 	{
			 	if(tmp_info.pageSet.ID)
			 	{
			 		displayPopover("doorSet", "popovers/doorSet.html", 216);
					//alert("Doorway Opened!");
					
					_user.inventory.doors -= 1;
					updateButtons();
				}
			}
			
			//Page full
			if(tmp_info.result)
			{
				if (tmp_info.result=="Page Full")
				{
					alert("Page full, please try again later");
				}
			}
			
			//other error
			if(tmp_info.error)
			{
				alert("error placing door");
			}
		}
		else
		{
			alert("Doorway Open received a bad response!");
		}
	}
}
function placeSpider()
{
	//TODO
	//if(at_a_page && toolcount>0)

	var spider_url = "http://data.nova-initia.com/rf/remog/page/"+getHashedURL(getURL())+"/"+getHashedDomain(getURL())+"/"+_user.inventory.spider_ID+".json";
	var resp = send_request(spider_url,"POST",null);

	_user.inventory.spiders -= 1;
	updateButtons();

	var json = jQuery.parseJSON(resp.responseText);
	if(json.fail)
	{
		//failed
		if(json.fail == true)
		{
		removeAllPopovers();
		var myPop = safari.extension.createPopover("spiderFailed", safari.extension.baseURI + "popovers/spiderFailed.html",244, 202);

		_ni_button.popover = myPop;
		_ni_button.showPopover();
		}
	}
	if(json.pageSet)
	{
		if(json.pageSet.ID)
		{
		removeAllPopovers();
		var myPop = safari.extension.createPopover("placedSpider", safari.extension.baseURI + "popovers/placedSpider.html",244, 202);

		_ni_button.popover = myPop;
		_ni_button.showPopover();
		}
	}
	if(json.result)
	{
		if (json.result=="Page Full")
		{
		removeAllPopovers();
		var myPop = safari.extension.createPopover("spidersFull", safari.extension.baseURI + "popovers/spidersFull.html",250, 30);

		_ni_button.popover = myPop;
		_ni_button.showPopover();
		}
		else
		{
			//Spider set off a trap
			_page.setSpider(json.username);
			removeAllPopovers();
			var myPop = safari.extension.createPopover("trapBlocked", safari.extension.baseURI + "popovers/trapBlocked.html",250, 202);

			_ni_button.popover = myPop;
			_ni_button.showPopover();
		}
	}
}
function toggleShield()
{
	if(_user.inventory.shields > 0)
	{
		var resp = send_request("http://data.nova-initia.com/rf/remog/user/shield.json","POST",null);
		var json = jQuery.parseJSON(resp.responseText);
		if(resp.status==200)
		{	
		 	if(json.user.ID)
		 	{
		 		_user.inventory.setShieldOn(json.user.isShielded);
		 		_user.inventory.shields = json.user.Tool3;
		 	}
		}
		else
		{
			// NovaInitia.Toolbar.show_panel(fail_panel);
			// alert("Shield Use Failed!");
		}
	}

	updateButtons();
}

function eventsClicked()
{
	safari.application.activeBrowserWindow.openTab().url = "http://www.nova-initia.com/remog/events?LASTKEY="+_user.lastkey;
}
function messagesClicked()
{
	safari.application.activeBrowserWindow.openTab().url = "http://www.nova-initia.com/remog/mail?LASTKEY="+_user.lastkey;
}
function profileClicked()
{
	safari.application.activeBrowserWindow.openTab().url = "http://www.nova-initia.com/remog/user/"+_user.username+"?LASTKEY="+_user.lastkey;
}
function sgButtonClicked()
{
	safari.application.activeBrowserWindow.openTab().url = "http://www.nova-initia.com/remog/trade?LASTKEY="+_user.lastkey;
}

function updateButtons()
{
	//remeber to update _user values first
	$("#traps > span").html(_user.inventory.traps);
	$("#barrels > span").html(_user.inventory.barrels);
	$("#signs > span").html(_user.inventory.signs);
	$("#doors > span").html(_user.inventory.doors);
	$("#spiders > span").html(_user.inventory.spiders);

	$("#shields > span").html(_user.inventory.shields);
	if(_user.inventory.isShieldOn())
		$("#shields > img").prop("src", _user.inventory.shield_on);
	else
		$("#shields > img").prop("src", _user.inventory.shield_off);

	$("#sg > span").html(_user.inventory.sg);
}

function fetchKey(usr)
{
	var u = "http://data.nova-initia.com/getKey.php";
	var p = "login=1&uname=" + usr;
	var res = send_request(u, "POST", p);

	_key = res.responseText;
	return res.responseText;
}
function getKey()
{
	return _key;
}

//returns the URL of the current page
function getURL()
{
	return safari.application.activeBrowserWindow.activeTab.url;
}

//modified version of FF toolbar send_request(...) function
function send_request(theURL, theMethod, theParams)
{
	var theReq = new XMLHttpRequest();
	
	theReq.overrideMimeType("application/json");
	
	//nonBlock=false (we don't want a bunch of callbacks everywhere!)
	theReq.open(theMethod,theURL,false);

	if(typeof(theParams) === "string")
	{
		theReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	}
	else
	{
		theReq.setRequestHeader("Content-type", "application/json");
		theParams = JSON.stringify(theParams);
	}

	//prevents setting the headder with a null key on a call from fetchKey()
	if(_key) theReq.setRequestHeader("X-NOVA-INITIA-LASTKEY", _key);

	//TODO need to set this nsfw header for nsfw links...
	// if(filter_NSFW==true) theReq.setRequestHeader("X-NOVA-INITIA-FILTER-NSFW", filter_NSFW);

	//Groups are not implemented yet
	// if(theGroupID) theReq.setRequestHeader("X-NOVA-INITIA-GROUPID",theGroupID);

	if(theParams)
	{
		theReq.send(theParams);
	}
	else
	{
		theReq.send(null);
	}

	return theReq;
}

//function that gets the json of the things on the page
function openedPage()
{
	if(_user == null) return; //do not process page if user has logged out

	//save the door
	var current_door_un = _page.Door.currentDoorusername;
	var current_door_id = _page.Door.currentDoorid;
	//reset the page object
	_page = new Page();
	var objectsOnPage = 0;
	//set the last door
	_page.Door.lastDoorusername = current_door_un;
	_page.Door.lastDoorid=current_door_id;

	var url_and_domain = UrlToHash(getURL(),true);
	var url_hash = url_and_domain['url'];
	var domain_hash = url_and_domain['domain'];
	var key = _key;
	_urlHash = url_hash;
	_domainHash = domain_hash;

	var frame_url = "http://data.nova-initia.com/rf/remog/page/"+url_hash+"/"+domain_hash+".json";
	var params = "&LastKey=" + key;
	var resp = send_request(frame_url,"GET",params);
	//alert(resp.responseText);
	var json = jQuery.parseJSON(resp.responseText);
	//alert(frame_url + params);

	//traps
	if(json.pageSet[0].ID != undefined)
	{
		var usernamerequest = send_request("http://data.nova-initia.com/rf/remog/user/"+json.pageSet[0].USERID+".json","GET",null);
		var usernamejson = jQuery.parseJSON(usernamerequest.responseText);
		_page.setTrap(usernamejson.user.UserName,true);
		objectsOnPage++;
		_user.inventory.setShieldOn(usernamejson.user.isShielded); //update shields in iventory

		//update current user's shield and sg
		var tmp = jQuery.parseJSON(send_request("http://data.nova-initia.com/rf/remog/user/"+_ID+".json","GET",null).responseText);
		_user.inventory.setShieldOn(tmp.user.isShielded);
		_user.inventory.sg = tmp.user.Sg;
	}
	else
	{
		_page.setTrap("",false);
	}


	//barrels
	if(json.pageSet[1].ID != undefined)
	{
		var usernamerequest = send_request("http://data.nova-initia.com/rf/remog/user/"+json.pageSet[1].USERID+".json","GET",null);
		var usernamejson = jQuery.parseJSON(usernamerequest.responseText);
		_page.setBarrel(usernamejson.user.UserName,true,json.pageSet[1].ID);
		objectsOnPage++;	
	}
	else
	{
		_page.setBarrel("",false,-1);
	}
	//send_request("http://data.nova-initia.com/rf/remog/gift/"+barrelID+".json","GET",null);

	//dont work currently not sure which is what alert("SignPosts: " + json.pageSet[5])
	//doors
	//alert(resp.responseText);
	var hasdoor = false;
	for(var x =0 ; x<json.pageSet[4].length;x++)
	{
		//alert(" Door"+x+": " + json.pageSet[4][x].ID);
		if(json.pageSet[4][x].ID != undefined)
		{
			var usernamerequest = send_request("http://data.nova-initia.com/rf/remog/user/"+json.pageSet[4][x].USERID+".json","GET",null);
			var usernamejson = jQuery.parseJSON(usernamerequest.responseText);

			var respdoor = send_request("http://data.nova-initia.com/rf/remog/doorway/"+json.pageSet[4][x].ID+".json","GET",null);
            var jsondoor = jQuery.parseJSON(respdoor.responseText);

            _page.addDoor(usernamejson.user.UserName,json.pageSet[4][x].toolData.Hint,json.pageSet[4][x].ID,jsondoor.doorway.NSFW);
			hasdoor = true;
		}
			/*
			var theID = doorway_carousel_array[doorwayArrayPos][0];
			var trackURL = "http://"+url_prefix+server_url+"/rf/remog/doorway/"+theID+"/dismiss.json";
			this.send_request(trackURL,"PUT",null,true,this.process_dismiss_panel,false);
			*/
	}
	var doorsOnPage = 0;
	if(hasdoor)
	{
		doorsOnPage = 1;
	}
	//spiders
	//not displayed
	//shields
	//not displayed
	//signs
	var the_URL = getURL();
	var standardized_url = UrlToHash(the_URL,false)
	//alert(standardized_url);

	var regObj = new RegExp('^http:\\/\\/www.nova-initia.com\\/rf\\/remog\\/group\\/[0-9]+\\?LASTKEY='+_key+'$');
	var regObj2 = new RegExp('^http:\\/\\/www.nova-initia.com\\/rf\\/remog\\/group\\/[0-9]+\\?LASTKEY='+_key.toLowerCase()+'$');
	var regexResult = regObj.test(the_URL);
	var regexResult2 = regObj2.test(the_URL);

	if(regexResult || regexResult2)
	{
		//alert("Tour Page!");
		var tmpTourID = standardized_url.match(/[0-9]+/);
		_page.setTourStartPage(true,tmpTourID);
		objectsOnPage++;
	}
	else
	{
		//alert("not tour page :(");
		_page.setTourStartPage(false,0);
	}

	if(_tour != null)
	{
		objectsOnPage++;
	}




//	alert(resp.responseText);
	//alert("ID: " + json.pageSet[1].ID);
	//keep debugging this too
	//Frame();
	removeAllPopovers();

	var rate = 0;
	if(_page.Door.lastDoorid != undefined)
	{
		rate = 200;
	}
	if(objectsOnPage+ doorsOnPage>0)
	{
		

		var myPop = safari.extension.createPopover("openedPage", safari.extension.baseURI + "popovers/openedPage.html", 300, (270*objectsOnPage) + (320*doorsOnPage) + rate);

		_ni_button.popover = myPop;
		_ni_button.showPopover();
	}

	updateButtons();

	//set number of messages
	_user.messages = json.pageSet[6].count;
	$("#messages > span").html(_user.messages);
}

safari.application.addEventListener("beforeNavigate", beforeNavigateHandler, true);
function beforeNavigateHandler(msgEvent)
{
	var url = msgEvent.url;

	//append LastKey to the URL if it's a nova-initia page. It's ugly, but cross-domain cookies don't work in safari, so...
	if(/www.nova-initia.com/.test(url) && !(/\?LASTKEY=/.test(url))) //see if the currently loaded url contains "www.nova-initia.com"
	{
		// openedPage(); //need to call openedPage() before the url is changed

		if(/www.nova-initia.com\/remog\/user\/profile/.test(url)) //if it's their user profile, we must first append their username:
		{
			safari.application.activeBrowserWindow.activeTab.url = "http://www.nova-initia.com/remog/user/"+_user.username+"?LASTKEY="+_user.lastkey;
		}
		else
		{
			safari.application.activeBrowserWindow.activeTab.url = url+"?LASTKEY="+_user.lastkey;
		}
	}
	//also must append to /rf/remog
	if(/www.nova-initia.com\/rf\/remog\/group/.test(url) && !(/\?LASTKEY=/.test(url))) //see if the currently loaded url contains "www.nova-initia.com/remog"
	{
		safari.application.activeBrowserWindow.activeTab.url = url+"?LASTKEY="+_user.lastkey;
	}
}

safari.application.addEventListener("navigate", navigateHandler, true);
function navigateHandler(msgEvent)
{
	//reset tour to null if we didnt follow it
	var url = getURL();
	if(_tour != null)
	{
		if(url != _tour.url)
		{
			console.log("url: "+url +'\n' + "toururl: " + _tour.url);
			_tour = null;
		}
	}
	openedPage();
}

safari.application.addEventListener("message", waitForMessage, false);
function waitForMessage(msgEvent)
{
	if(msgEvent === heyExtensionBar)
	{
		alert("works!!")
	}
}

safari.extension.settings.addEventListener("change", prefsChanged, false);
function prefsChanged(event)
{
	if (event.key == "stay_logged_in")
	{
		_stayLoggedIn = safari.extension.settings.stay_logged_in;
	}
}

safari.application.addEventListener("close", closeHandler, true); // 3rd param should be true
function closeHandler(event)
{
	//if there is only one browser window and we receive a close event, we know the application is closing
	if(safari.application.browserWindows.length == 1)
	{
		//make sure it's coming from the browser window and not a tab
		if(event.target == safari.application.activeBrowserWindow)
		{
			//if stay logged in is not selected, log out
			if(!_stayLoggedIn)
			{
				//logout();
			}
		}
	}
}

//callback: function called when animation is complete (null if not needed)
//amount: pixels to slide up (default is 0 if not specified)
function animatePopover(callback, amount)
{
	var ni_button = _ni_button;
	var pop = ni_button.popover;

    var from = {property: pop.height};
	if(amount)
		var to = {property: pop.height-amount}
	else
		var to = {property: 0};
	
	jQuery(from).animate(to, {
		duration: 300,
		step: function() {
			pop.height = this.property;
		},
		complete: callback
	});
	
}

// Use to easily display a popover
// id: safari popover id
// html_path: path to the html file
function displayPopover(id, html_path, height)
{
	for(var i=0;i<safari.extension.popovers.length;i++)
	{
		var the_id = safari.extension.popovers[i].identifier;
		if(the_id == id)
		{
			safari.extension.popovers[i].hide();
		}
	}
	safari.extension.removePopover(id);
	removeAllPopovers();
	
	if(!height) height = 202; //default if not provided

	var myPop = safari.extension.createPopover(id, safari.extension.baseURI + html_path, 244, height);
	_ni_button.popover = myPop;
	_ni_button.showPopover();
}

// call this function before creating any popovers
//function needs to be updated to remove more whan you add another popover to the code
function removeAllPopovers()
{
	//hide popovers
	for(var i=0;i<safari.extension.popovers.length;i++)
    	{
    		var id = safari.extension.popovers[i].identifier;
    		if( id == "openedPage" || id == "placedTrap" || id=="trapFailed" ||id=="trapsFull" || id=="trapBlocked" || id=="placedSpider" || id=="spiderFailed" || id=="spidersFull" || id=="placeBarrel" || id=="placeDoor" || id=="placeSign")
				{
					safari.extension.popovers[i].hide();
				}
		}
		//remove the popovers
	safari.extension.removePopover("openedPage");
	safari.extension.removePopover("placedTrap");
	safari.extension.removePopover("trapFailed");
	safari.extension.removePopover("trapsFull");
	safari.extension.removePopover("trapBlocked");
	safari.extension.removePopover("placedSpider");
	safari.extension.removePopover("spiderFailed");
	safari.extension.removePopover("spidersFull");
	safari.extension.removePopover("placeBarrel");
	safari.extension.removePopover("placeDoor");
	safari.extension.removePopover("placeSign");
}

//get a reference to existing popover by its id
function getPopover(id_str)
{
	for(var i=0; i<safari.extension.popovers.length; i++)
	{
		if(safari.extension.popovers[i].identifier == id_str)
		{
			return safari.extension.popovers[i];
		}
	}
}

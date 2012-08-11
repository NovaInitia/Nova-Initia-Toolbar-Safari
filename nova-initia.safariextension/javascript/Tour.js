function Tour(tourID,barWindow,prev)
{
	//var reqURL = "http://data.nova-initia.com/rf/remog/signpost/143321.json?LASTKEY=nYOYohoC";
	this.id = tourID;

	var signrequest = barWindow.send_request("http://data.nova-initia.com/rf/remog/signpost/"+tourID+".json","GET",null);
	var json = jQuery.parseJSON(signrequest.responseText);
	
	this.linkA = json.signpost.ANextID;
	this.aNext = json.signpost.ANextTitle;
	this.linkB = json.signpost.BNextID;
	this.bNext = json.signpost.BNextTitle;
	this.linkC = json.signpost.CNextID;
	this.cNext = json.signpost.CNextTitle;
	this.linkD = json.signpost.DNextID;
	this.dNext = json.signpost.DNextTitle;
	this.comment = json.signpost.Comment;
	this.url = json.signpost.Url;
	this.nsfw = json.signpost.NSFW;
	this.groupID = json.signpost.GroupID;
	this.prevStack = new Array();
	//document.write(19);
	if(prev != null)
	{
		this.prevStack = prev;
	}
	//document.write(prevStack);
	//var len = prevStack.push("jh");
	//AddCurID(tourID);

	this.AddCurID = function(curr)
	{
		this.prevStack.push(curr);
	}
	this.getPrevID = function()
	{
		document.write(35);
		var temp = this.prevStack.pop();
		return this.prevStack.pop();
	}

}
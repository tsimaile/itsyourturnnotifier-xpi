/* ABOUT:
* ItsYourTurn Notifier
* get data from ItsYourTurn.com web server
* parse responseText to determine if new games are in 'Your Turn to move'
* display statusbar icon-text and/or notification
* further info: https://sites.google.com/site/deexaminer/iyt-notifier

/* THANKS:
*	Doron Rosenberg and Gmail Notifier for the idea and concepts
*	ClownCollege, Playa won, grbradt, KingKeato, and jlb104 for beta testing

/* ***** BEGIN LICENSE BLOCK *****
The contents of ItsYourTurn Notifier (the "file") are subject to the Mozilla Public License
Version 1.1 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS"
basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
License for the specific language governing rights and limitations
under the License.

The Original Code is contained within the file.

The Initial Developer of the Original Code is deExaminer.
Portions created by the Initial Developer are Copyright (C) 2008-2011
the Initial Developer. All Rights Reserved.

Contributor(s): .
 * ***** END LICENSE BLOCK ***** */

if(!org) var org={};
if(!org.mozilla) org.mozilla={};
if(!org.mozilla.addons) org.mozilla.addons={};
if(!org.mozilla.addons.itsyourturnNotifier) org.mozilla.addons.itsyourturnNotifier={};

org.mozilla.addons.itsyourturnNotifier.notifier = {

	lblExclaim:			"!",
	intMyGames:			0,
	intGameCount:		0,
	intLadderGames:		0,
	intTournamentGames:	0,
	intRegularGames:	0,
	intMessages:		0,
	txtUsername:		"Username",
	blnMember:			false,
	intMoveLimit:		99,
	intMovesLeft:		99,
	txtTimeLeft:		"",
	blnLoggedIn:		false,
	intIntervalMins:	3,
	preferences:		null,
	iytTimer:			null,

	parseGametext: function (strText, strSearch) {
		/*
		strText = text being searched
		strSearch = search text
		returns the text after strSearch to endofline (\n)
		*/
		intStart = strText.indexOf(strSearch) + strSearch.length;
		intEnd   = strText.indexOf('\n', intStart);
		return strText.substring(intStart, intEnd);
				
	},	// END parseGametext
	
	showStatus: function (rspText) {
		/*
		rspText = httpRequest.responseText (text returned from ItsYourTurn server)
		*/
		var iytIcon			= document.getElementById('iyt-notifier-statusbar');
		try {var iytButton	= document.getElementById('iyt-notifier-button'); } catch(e) {};
		
		this.txtUsername = this.parseGametext(rspText, "Name: ");
		this.intLadderGames = parseInt(this.parseGametext(rspText, "Laddergames: "));
		this.intTournamentGames = parseInt(this.parseGametext(rspText, "Tournamentgames: "));
		this.intRegularGames = parseInt(this.parseGametext(rspText, "Regulargames: "));

		this.intMyGames = this.intLadderGames + this.intTournamentGames + this.intRegularGames;
		if (this.intMyGames != parseInt(this.intMyGames)) { this.intMyGames = 0 };
		
		// initialise icon
		iytIcon.setAttribute ("status", "enabled");
		iytIcon.setAttribute ("label", this.intMyGames);
		iytIcon.setAttribute ("tooltip", "iyt-notifier-tooltip-turn");			
		if (iytButton) {
			iytButton.setAttribute ("status", "enabled");
			iytButton.setAttribute ("label", "IYT (" + this.intMyGames + ")");
			iytButton.setAttribute ("tooltip", "iyt-notifier-tooltip-turn")
			};	
		
		this.intMessages = parseInt(this.parseGametext(rspText, "Newmessages: "));
		if (this.intMessages > 0) {
			iytIcon.setAttribute ("status", "new");
			if (iytButton) { iytButton.setAttribute ("status", "new") };
		};
		
		this.blnMember = true;	// assume user is a member
		if ((parseInt(this.parseGametext(rspText, "Member: "))) == 0 ) {
			this.blnMember = false;
			this.intMoveLimit = parseInt(this.parseGametext(rspText, "Movelimit: "));
			this.intMovesLeft = parseInt(this.parseGametext(rspText, "Movesleft: "));
			this.txtTimeLeft = this.parseGametext(rspText, "TimeTillMore: ");
		};

		if (this.intMovesLeft > 0) {
			if (this.intMyGames > 0) { // new turns waiting
				iytIcon.setAttribute("status","new");
				if (iytButton) { iytButton.setAttribute("status","new") };
				if ((this.intMyGames > this.intGameCount && this.preferences.getBoolPref("notify"))) {	// if new games > old game count
					this.showNotification(this.intMyGames);	// call notify
					var txtSoundFile = this.preferences.getCharPref("soundlist");
					if (this.preferences.getCharPref("sound") == "file") {
						txtSoundFile = this.preferences.getCharPref("soundfile");
					}
					this.soundAlert(this.preferences.getCharPref("sound"), txtSoundFile);
				}
			}
			this.intGameCount = this.intMyGames; // prevents notify during next checkStatus call unless intMyGames changes && intMovesLeft
		} else { // no moves left
			this.intGameCount = 0;
		};
		
		this.blnLoggedIn = true;	// assume
		if (rspText.indexOf("=START=") < 0) {
			this.blnLoggedIn = false;
			iytIcon.setAttribute ("status","disabled");
			iytIcon.setAttribute ("label", "");
			iytIcon.setAttribute ("tooltip", "iyt-notifier-tooltip-login");
			if (iytButton) {
				iytButton.setAttribute ("status","disabled");
				iytButton.setAttribute ("label", "IYT");
				iytButton.setAttribute ("tooltip", "iyt-notifier-tooltip-login")
				};
			this.intGameCount = 0;
		};
		
	},	// END showStatus
	
	checkStatus: function () {
		var hReq			= new XMLHttpRequest();
		var iytIcon			= document.getElementById('iyt-notifier-statusbar');
		try {var iytButton	= document.getElementById('iyt-notifier-button'); } catch(e) {};
		// initialise status-bar
		iytIcon.setAttribute ("status", "checking");
		iytIcon.setAttribute ("label", "");
		iytIcon.setAttribute ("tooltip","iyt-notifier-tooltip-checking");
		// initialise toolbar button
		if (iytButton) {
			iytButton.setAttribute ("status", "checking");
			iytButton.setAttribute ("label", "IYT");
			iytButton.setAttribute ("tooltip","iyt-notifier-tooltip-checking");
			};
		hReq.onreadystatechange = function () {
			if (hReq.readyState == 4) {			// 4 = request loaded
				if (hReq.status == 200) {		// 200 = OK
					return org.mozilla.addons.itsyourturnNotifier.notifier.showStatus(hReq.responseText);
				} else {
					iytIcon.setAttribute ("status","error");
					iytIcon.setAttribute ("label", "");
					iytIcon.setAttribute ("tooltip", "iyt-notifier-tooltip-error");
					if (iytButton) {
						iytButton.setAttribute ("status","error");
						iytButton.setAttribute ("label", "IYT");
						iytButton.setAttribute ("tooltip", "iyt-notifier-tooltip-error");
						};
					this.intGameCount = 0
		}	}	}; // END hReq.onreadystatechange
		hReq.open("GET", org.mozilla.addons.itsyourturnNotifier.urlIytServer + "/pp?ffaddon", true); // get status from ItsYourTurn server
		//hReq.open("GET", org.mozilla.addons.itsyourturnNotifier.urlMyServer + "/test/test085.txt", true); // get status from private test server
		hReq.send(null); 			// send the get
	},	// END checkStatus
	
	showSite: function () {
		// function openAndReuseOneTabPerURL(url) {
		// snipped from https://developer.mozilla.org/En/Code_snippets/Tabbed_browser
		var url = org.mozilla.addons.itsyourturnNotifier.urlIytHost;
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
		var browserEnumerator = wm.getEnumerator("navigator:browser");
		// Check each browser instance for our URL
		var found = false;
		while (!found && browserEnumerator.hasMoreElements()) {
			var browserWin = browserEnumerator.getNext();
			var win = browserWin.gBrowser;
			// Check each tab of this browser instance
			var numTabs = win.browsers.length;
			for (var index = 0; index < numTabs; index++) {
				var currentBrowser = win.getBrowserAtIndex(index);
				try {	// added due to nsI.host error for some profiles
					if (url == currentBrowser.currentURI.host) { // changed from .spec
						// The URL is already opened. Select this tab.
						win.selectedTab = win.tabContainer.childNodes[index];
						currentBrowser.loadURI(org.mozilla.addons.itsyourturnNotifier.urlIytServer); // added to reload root url
						// Focus *this* browser-window
						browserWin.focus();
						found = true;
						break;
					}
				} catch (e) {} // if error then found = false, continue to next code
			}
		}
		// Our URL isn't open. Open it now.
		if (!found) {
			var recentWindow = wm.getMostRecentWindow("navigator:browser");
			if (recentWindow) {
				// Use an existing browser window
				recentWindow.delayedOpenTab(url, null, null, null, null);
			} else {
				// No browser windows are open, so open a new one.
				window.open(url);
			}
		}
		this.checkStatus();
	},	// END showSite

	showNotification: function (howMany) {
		var listener = { // observer event
			observe: function (subject, topic, data) {
				if (topic == 'alertclickcallback') { // from http://www.naan.net/trac/changeset/47
					org.mozilla.addons.itsyourturnNotifier.notifier.showSite();	// check if user clicked notification alert text
		}	}	};
		var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
			.getService(Components.interfaces.nsIAlertsService);
		var msg = "";
		if (howMany != -1) {
			msg = this.getFormattedString ("NotificationMsg", [this.txtUsername, howMany, this.textPlural("turn", howMany)]);
		} else {
			msg = "ItsYourTurn test message";
		}
		alertsService.showAlertNotification (
			"chrome://iyt-notifier/content/iyt-logo-32-alert.png", 	// icon
			"ItsYourTurn.com",									// title
			msg,
			true, "",											// clickable and cookie
			listener);											// observer event - checks if user clicks on notification alert
	},	// END showNotification
	
	openAboutDialog: function () {
		return window.openDialog ("chrome://iyt-notifier/content/iyt-about.xul", "wdwAbout", "centerscreen, chrome, resizable=no, dependent=yes");
	},	// END openAboutDialog

	fillTooltip: function () {
		// fill in the tooltip when logged in
		// tooltip title and 3 lines for the various game types + new message line
		document.getElementById("iyt-notifier-tooltip-ttl").value = this.txtUsername + " has " + this.intMyGames + this.textPlural(" turn", this.intMyGames) + " waiting";

		var numWidth = 0;					
		if (this.intLadderGames.toString().length > numWidth) { numWidth = this.intLadderGames.toString().length };
		if (this.intTournamentGames.toString().length > numWidth) { numWidth = this.intTournamentGames.toString().length };
		if (this.intRegularGames.toString().length > numWidth) { numWidth = this.intRegularGames.toString().length };
		if (this.intMessages.toString().length > numWidth) { numWidth = this.intMessages.toString().length };
		this.fillTooltipGames("iyt-notifier-tooltip-lad", this.intLadderGames, numWidth, "ladder");
		this.fillTooltipGames("iyt-notifier-tooltip-tou", this.intTournamentGames, numWidth, "tournament");
		this.fillTooltipGames("iyt-notifier-tooltip-reg", this.intRegularGames, numWidth, "regular");
		this.fillTooltipGames("iyt-notifier-tooltip-msg", this.intMessages, numWidth, this.textPlural("message",this.intMessages));
		elementID = "iyt-notifier-tooltip-mlftmr";
		if (this.blnMember) {	
			document.getElementById("iyt-notifier-tooltip-mmb").hidden = false;	// show member char
			document.getElementById("iyt-notifier-tooltip-mmb").value = String.fromCharCode(167);
			document.getElementById(elementID).hidden = true;					// hide turns left tooltip element
		} else {	
			document.getElementById("iyt-notifier-tooltip-mmb").hidden = true;	// hide member char
			xmStr = "";
			while (xmStr.length < numWidth) { xmStr += " " } 					// include format spacing at start of number
			document.getElementById("iyt-notifier-tooltip-mlf").value = xmStr + this.intMovesLeft + this.textPlural(" turn", this.intMovesLeft) + " remaining";
			document.getElementById("iyt-notifier-tooltip-tmr").value =	" " + this.txtTimeLeft + " until more turns";
			document.getElementById(elementID).hidden = false;
			// change color depending on turns left
			if (this.intMovesLeft > 5) { mlcolor = '#90EE90' }
			else if (this.intMovesLeft > 1) { mlcolor = '#EE9000' }
			else { mlcolor = '#EE9090' }
			document.getElementById(elementID).style.backgroundColor = mlcolor;
		}
	},	// END fillTooltip
		
	fillTooltipGames: function (elementID, xm, colWidth, gameType) {
		var xmStr = " " + xm.toString();
		while (xmStr.length < colWidth + 1) { xmStr = " " + xmStr } // include format spacing at start of number
		document.getElementById(elementID).hidden = false;
		if (xm > 0) {
			document.getElementById(elementID).value = 
				this.getFormattedString("TooltipGames", [xmStr, gameType]);
		} else {
			document.getElementById(elementID).hidden = true;
		}
	},	// END fillTooltipGames
		
	getFormattedString: function (aName, aStrArray) {
		var strbundle = document.getElementById("iyt-notifier-stringbundle");
		return strbundle.getFormattedString(aName, aStrArray);
	},	// END getFormattedString
	
	textPlural: function (word, number) { 
		// NOT USED DUE TO LOCALE ISSUES - reinstated 0.5.1 30-Nov-2008 as a lot of the text is hardcoded anyway
		/*
		word = string of text to pluralise
		number = int to compare
		*/
		if (number != 1) {
			return (word + "s");
		} else {
			return word;
		}
	},	// END textPlural
		
	startup: function () {
		this.iytTimer = Components.classes["@mozilla.org/timer;1"].
			createInstance(Components.interfaces.nsITimer);							// timer interface
		var iytCallback = {															// nsITimerCallback to call when timer expires
			notify: function(timer) { org.mozilla.addons.itsyourturnNotifier.notifier.checkStatus(); }							// call check  status function
		};
		this.iytTimer.initWithCallback (
			iytCallback, 															// nsITimer Callback interface
			this.intIntervalMins * 60 * 1000,										// millisecond interval
			1);																		// timer type TYPE_REPEATING_SLACK
		this.preferences = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.iyt-notifier.");

		if (this.preferences.getBoolPref("firstrun")) {
			// from http://forums.mozillazine.org/viewtopic.php?t=189667
			// adds toolbarbutton to navbar on firstrun only
			var navbar = document.getElementById("nav-bar");
			var newset = navbar.currentSet + ",iyt-notifier-button";
			navbar.currentSet = newset;
			navbar.setAttribute("currentset", newset );
			document.persist("nav-bar", "currentset");

			this.preferences.setBoolPref("firstrun", false);
		}
		// generate random delay interval (between 1-2 secs) then call checkStatus
		// var intDelay = Math.floor(Math.random()*1000) + 1000 
		//setTimeout("
		org.mozilla.addons.itsyourturnNotifier.notifier.checkStatus(); //", 2000); // http://www.sean.co.uk/a/webdesign/javascriptdelay.shtm
	},	// END startup
	
	shutdown: function () {
		// null
	},	// END shutdown
	
	soundAlert: function(sttSound, txtSoundFile) {
		gSound = Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
		ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		switch (sttSound) {
			case "off":
				break;
			case "beep":
				soundURL = "http://www.ibiblio.org/pub/multimedia/pc-sounds/ding.wav";
				var url = ioService.newURI(soundURL, null, null);
				gSound.play(url);
				break;
			case "list":
				soundURL = org.mozilla.addons.itsyourturnNotifier.urlMyServer + "/audio/alert_" + txtSoundFile + ".wav";
				var url = ioService.newURI(soundURL, null, null);
				gSound.play(url);
				break;
			case "file":
				var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
				file.initWithPath(txtSoundFile);
				if (file.exists()) {
					var url = ioService.newFileURI(file);
					gSound.play(url);
				} else {
					alert("Error: 404 soundAlert - audio file not found");
				}
				break;
			default:
				alert("Error: 400 soundAlert - unknown getCharPref(sound) [sttSound]");
		}
	},	// END playSound
		
	openPrefsDialog: function() {
		return window.openDialog ("chrome://iyt-notifier/content/iyt-prefs.xul", "wdwPrefs", "centerscreen, chrome, resizable=no, dependent=yes");
	},	// END openPrefs

}

window.addEventListener("load", function(e) { org.mozilla.addons.itsyourturnNotifier.notifier.startup(); }, false);
window.addEventListener("unload", function(e) { org.mozilla.addons.itsyourturnNotifier.notifier.shutdown(); }, false);
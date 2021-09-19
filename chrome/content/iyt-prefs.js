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

org.mozilla.addons.itsyourturnNotifier.prefs = {

	preferences:	null,
	
	showNotification: function (howMany) {
		var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
			.getService(Components.interfaces.nsIAlertsService);
		var msg = "ItsYourTurn Notifier test message";
		alertsService.showAlertNotification (
			"chrome://iyt-notifier/content/iyt-logo-32-alert.png", 	// icon
			"ItsYourTurn.com",										// title
			msg,
			true, "",												// clickable and cookie
			null);													// observer event - checks if user clicks on notification alert
	},	// END showNotification
	
	startup: function () {
		this.preferences = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefBranch);
		this.showPrefsSoundListMenu();	// load the soundlist menu from developer site
		this.onPrefChange();			// show preference settings	
	},	// END startup
	
	shutdown: function () {
		// null
	},	// END shutdown
	
	soundAlert: function(sttSound, txtSoundFile) {
		var gSound = Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
		var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
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
		
	showPrefsSoundListMenu: function () {
		var oRequest = new XMLHttpRequest();
		var sURL  = org.mozilla.addons.itsyourturnNotifier.urlMyServer + "/audio/sources.txt";
		
		oRequest.onreadystatechange = function () {
			if (oRequest.readyState == 4) {			// 4 = request loaded
				arrFile = oRequest.responseText.split("\n");
				if (oRequest.status == 200) {
					for (i = 0; i < arrFile.length; i++) {
						arrLine = arrFile[i].split("\t");

						mName		= arrLine[0];	// file list ID
						mFullName	= arrLine[1];	// performer name
						mQuote		= arrLine[2];	// quote
						mSize		= arrLine[3];	// file size (in kB)
						mChar		= arrLine[4];	// character name
						mSource		= arrLine[5];	// performance name
						mUrl		= arrLine[6];	// source WAV url
							
						var menuItem = document.createElement("menuitem");	
						menuItem.setAttribute("value", mName);
						menuItem.setAttribute("label", mFullName + " (" + mSize + "kB)");
//						menuItem.addEventListener("command", function (e) { "org.mozilla.addons.itsyourturnNotifier.prefs.showPrefListDescription('" + mQuote + "','as " + mChar + " in " + mSource + "');" }, true );
//						menuItem.addEventListener("command", alert('bobo'), true );
//						menuItem.addEventListener("select", function (e) { org.mozilla.addons.itsyourturnNotifier.prefs.showPrefListDescription(mQuote ,"as " + mChar + " in " + mSource); }, true );
						menuItem.setAttribute("oncommand", "org.mozilla.addons.itsyourturnNotifier.prefs.showPrefListDescription('" + mQuote + "','as " + mChar + " in " + mSource + "');");

						document.getElementById("iyt-notifier-prefs-soundlistmenu").appendChild(menuItem);
							
						if (mName == org.mozilla.addons.itsyourturnNotifier.prefs.preferences.getCharPref("extensions.iyt-notifier.soundlist")) {
							org.mozilla.addons.itsyourturnNotifier.prefs.showPrefListDescription(mQuote, 'as ' + mChar + ' in ' + mSource);
						}
					}
					document.getElementById("iyt-notifier-prefs-soundlist").value = org.mozilla.addons.itsyourturnNotifier.prefs.preferences.getCharPref("extensions.iyt-notifier.soundlist");
				} else {
					alert("Error: 404 showPrefSoundListmenu - audio source file not found");
					}
				}
			}
			
		oRequest.open("GET", sURL, true);
		oRequest.send(null);
	},	// END showPrefsSoundMenu
	
	showPrefListDescription: function (quote, tooltip) {
		// fill quote label
		msg = quote.replace(/\\/gi,"");	// remove \s from quote
		msg = msg.replace(/"/gi,"");	// remove "s from quote
		document.getElementById("iyt-notifier-prefs-soundlistdesc").value = msg;
		document.getElementById("iyt-notifier-prefs-soundlistdescttlbl").value = msg;
		// fill menulist tooltip
		msg = tooltip.replace(/\\/gi,"");	// remove \s from tooltip
		msg = msg.replace(/"/gi,"");		// remove "s from tooltip
		document.getElementById("iyt-notifier-prefs-soundlistmenuttlbl").value = msg;
	},	// END showPrefListDescription
	
	btnPrefsSoundBrowse: function () {
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, "Select a File", nsIFilePicker.modeOpen);
		fp.appendFilter("WAV Files","*.wav");
		fp.show();
		if (fp.file){
			document.getElementById("iyt-notifier-prefs-soundfile").value = fp.file.path;
			org.mozilla.addons.itsyourturnNotifier.fleSoundFile = fp.file.path;
		}
	},	// END btnPrefsSoundBrowse
	
	testPrefs: function() {
		if (document.getElementById("iyt-notifier-prefs-notify").checked) {
			var txtSoundFile = "";
			this.showNotification(-1);
			switch (document.getElementById("iyt-notifier-prefs-sound").value) {
				case "list":
					txtSoundFile = document.getElementById("iyt-notifier-prefs-soundlist").value;
					break;
				case "file":
					txtSoundFile = document.getElementById("iyt-notifier-prefs-soundfile").value;
					break;
			}
			this.soundAlert(document.getElementById("iyt-notifier-prefs-sound").value, txtSoundFile);
		}
	},	// END testPrefs

	onPrefWindowAccept: function() {
		if (org.mozilla.addons.itsyourturnNotifier.fleSoundFile != "") {
			this.preferences.setCharPref("extensions.iyt-notifier.soundfile", org.mozilla.addons.itsyourturnNotifier.fleSoundFile);
		}
	},	// END onPrefWindowAccept
	
	onPrefChange: function() {
		document.getElementById("iyt-notifier-prefs-sound").disabled = true;
		document.getElementById("iyt-notifier-prefs-soundlist").disabled = true;
		document.getElementById("iyt-notifier-prefs-soundfile").disabled = true;
		document.getElementById("iyt-notifier-prefs-soundbrowse").disabled = true;
		document.getElementById("iyt-notifier-prefs-soundlistdesc").disabled = true;
		if (document.getElementById("iyt-notifier-prefs-notify").checked) {
			document.getElementById("iyt-notifier-prefs-sound").disabled = false;			
			switch (document.getElementById("iyt-notifier-prefs-sound").value) {
				case "list":
					document.getElementById("iyt-notifier-prefs-soundlist").disabled = false;
					document.getElementById("iyt-notifier-prefs-soundlistdesc").disabled = false;
					break;
				case "file":
					document.getElementById("iyt-notifier-prefs-soundfile").disabled = false;
					document.getElementById("iyt-notifier-prefs-soundbrowse").disabled = false;
					break;
				default:
					break;
			}
		} 
	}	// END onPrefChange
}

// window.addEventListener("load", function(e) { org.mozilla.addons.itsyourturnNotifier.prefs.startup(); }, false);
window.addEventListener("unload", function(e) { org.mozilla.addons.itsyourturnNotifier.prefs.shutdown(); }, false);
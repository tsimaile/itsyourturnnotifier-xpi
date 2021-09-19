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

org.mozilla.addons.itsyourturnNotifier = {
	urlMyServer:		"https://sites.google.com/site/deexaminer/iyt-notifier",
	urlIytHost:			"www.itsyourturn.com",
	urlIytServer:		"",
	fleSoundFile:		"",
	
	startup: function () {
		this.urlIytServer = "http://" + this.urlIytHost;
	},	// END startup
	
	shutdown: function () {
		// null
	}	// END shutdown
}

window.addEventListener("load", function(e) { org.mozilla.addons.itsyourturnNotifier.startup(); }, false);
window.addEventListener("unload", function(e) { org.mozilla.addons.itsyourturnNotifier.shutdown(); }, false);
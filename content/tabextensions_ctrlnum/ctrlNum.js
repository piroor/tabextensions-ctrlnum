// start of definition 
if (!window.TabbrowserCtrlNumService) {

var TabbrowserCtrlNumService = {

	enabled : true,

	delay : 300,
	marginX : 30,
	marginY : 30,

	shown : false,
	timer : null,

	defaultPref      : 'chrome://tabextensions_ctrlnum/content/default.js',
	defaultPrefLight : 'chrome://tabextensions_ctrlnum/content/default.js',
	
	// properties 
	
	get service() 
	{
		if (this._service === void(0))
			this._service = 'TabbrowserService' in window ? window.TabbrowserService : null ;

		return this._service;
	},
//	_service : null,
 
	get strbundle() 
	{
		if (!this._strbundle) {
			const STRBUNDLE = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService);
			this._strbundle = STRBUNDLE.createBundle('chrome://tabextensions_ctrlnum/locale/tabextensions_ctrlnum.properties');
		}
		return this._strbundle;
	},
	_strbundle : null,
  
	// ƒCƒxƒ“ƒg‚Ì•ß‘¨ 
	
	onAfterInit : function() 
	{
		if (!this.service.browser) return;
		window.addEventListener('keydown',   this.onKeyDown,    true);
		window.addEventListener('keyup',     this.onKeyRelease, true);
		window.addEventListener('keypress',  this.onKeyRelease, true);
		window.addEventListener('mousedown', this.onKeyRelease, true);

		TabbrowserCtrlNumService.showTooltips();
		TabbrowserCtrlNumService.hideTooltips();
	},
 
	onAfterDestruct : function() 
	{
		if (!this.service.browser) return;
		window.removeEventListener('keydown',   this.onKeyDown,    true);
		window.removeEventListener('keyup',     this.onKeyRelease, true);
		window.removeEventListener('keypress',  this.onKeyRelease, true);
		window.removeEventListener('mousedown', this.onKeyRelease, true);
	},
 
	onKeyDown : function(aEvent) 
	{
		if (
			TabbrowserCtrlNumService.service.browser.mTabs.length > 1 &&
			!aEvent.shiftKey && !aEvent.altKey &&
			(navigator.platform.match(/mac/i) ? aEvent.metaKey : aEvent.ctrlKey )
			) {
			if (!TabbrowserCtrlNumService.timer)
				TabbrowserCtrlNumService.timer = window.setTimeout('TabbrowserCtrlNumService.showTooltips();', TabbrowserCtrlNumService.delay)
		}
		else
			TabbrowserCtrlNumService.hideTooltips();
	},
 
	onKeyRelease : function(aEvent) 
	{
		TabbrowserCtrlNumService.hideTooltips(aEvent);
	},
  
	showTooltips : function() 
	{
		if (this.shown) return;

		var t;
		var b = this.service.browser;
		if (!b) return;

		var stripBox = b.mStrip.boxObject;
		var offsetX = b.tabbarXOffset;
		var offsetY = b.tabbarYOffset;

		var pos = b.getAttribute('class').match(/tabbrowser-tabbar-(top|bottom|left|right)/)[1];

		var step = 0,
			defXStart,
			defXLast,
			defYStart,
			defYLast;

		var edge = this.service.getPref('browser.tabs.extensions.ctrlnum.edge');
		var boxX = edge == 0 ? stripBox.x : stripBox.screenX ;
		var boxY = edge == 0 ? stripBox.y : stripBox.screenY ;

		switch (pos)
		{
			default:
			case 'top':
				step = this.marginY;
				defXStart = boxX;
				defXLast  = boxX+stripBox.width;
				defYStart = boxY+parseInt(this.marginY/3);
				defYLast  = boxY+parseInt(this.marginY/3);
				break;
			case 'bottom':
				step = 0-this.marginY;
				defXStart = boxX;
				defXLast  = boxX+stripBox.width;
				defYStart = boxY-stripBox.height-parseInt(this.marginY/3);
				defYLast  = boxY-stripBox.height-parseInt(this.marginY/4);
				break;
			case 'left':
				step = this.marginY;
				defXStart = boxX+stripBox.width+this.marginX;
				defXLast  = boxX+stripBox.width+this.marginX;
				defYStart = boxY;
				defYLast  = boxY+parseInt(stripBox.height/2);
				break;
			case 'right':
				step = this.marginY;
				defXStart = boxX-parseInt(window.outerWidth/2);
				defXLast  = boxX-parseInt(window.outerWidth/2);
				defYStart = boxY;
				defYLast  = boxY+parseInt(stripBox.height/2);
				break;
		}

		var isOut,
			tabBox,
			x,
			y;
		var firstDone = false;
		var max = Math.min(9, b.mTabs.length)+1;
		for (var i = 1; i < max; i++)
		{
			t = b.mTabs[i-1];
			if (!t) continue;

			tabBox = t.boxObject;

			isOut = (
				tabBox.screenX-offsetX < stripBox.screenX ||
				tabBox.screenX+tabBox.width-offsetX > stripBox.screenX+stripBox.width ||
				tabBox.screenY-offsetY < stripBox.screenY ||
				tabBox.screenY+tabBox.height-offsetY > stripBox.screenY+stripBox.height
			);
			if (!firstDone && !isOut) firstDone = true;

			if (isOut) {
				x = firstDone ? defXLast : defXStart ;
				y = firstDone ? defYLast+=step : defYStart+=step ;
			}
			else {
				switch (pos)
				{
					default:
					case 'top':
						x = tabBox.screenX+parseInt(tabBox.width/3)-offsetX;
						y = tabBox.screenY+parseInt(this.marginY/3);
						break;
					case 'bottom':
						x = tabBox.screenX+parseInt(tabBox.width/3)-offsetX;
						y = tabBox.screenY-this.marginY;
						break;
					case 'left':
						x = tabBox.screenX+tabBox.width;
						y = tabBox.screenY-parseInt(this.marginY/2)-offsetY;
						break;
					case 'right':
						x = tabBox.screenX-this.marginX;
						y = tabBox.screenY-parseInt(this.marginY/2)-offsetY;
						break;
				}
			}

			label = this.strbundle.GetStringFromName(isOut ? 'popup_out' : 'popup_normal' )
						.replace(/%n/gi, i)
						.replace(/%s/gi, t.label);

			this.showTooltipFor(i, x, y, label);
		}

		this.shown = true;
//		window.setTimeout(this.hideTooltips, 5000);
	},
	
	showTooltipFor : function(aNum, aX, aY, aLabel) 
	{
		var node = document.getElementById('tabextensions-ctrlNum-'+aNum);
		if (!node) return;

		node.firstChild.setAttribute('value', aLabel);
		node.firstChild.setAttribute('crop', TabbrowserCtrlNumService.service.browser.mTabs[aNum-1].getAttribute('crop'));

		node.autoPosition = true;

		node.moveTo(aX, aY);
		node.showPopup(node.parentNode, aX, aY, 'popup', null, null);
	},
  
	hideTooltips : function(aEvent) 
	{
		if (TabbrowserCtrlNumService.timer) {
			window.clearTimeout(TabbrowserCtrlNumService.timer);
			TabbrowserCtrlNumService.timer = null;
		}

		if (TabbrowserCtrlNumService.shown) {
			var node;
			for (var i = 1; i < 10; i++)
			{
				node = document.getElementById('tabextensions-ctrlNum-'+i);
				if (!node.firstChild.hasAttribute('value')) continue;
				node.hidePopup();
				node.firstChild.removeAttribute('value');
			}

			TabbrowserCtrlNumService.shown = false;

			// if this even hides the popup, re-dispatch a new event for other features.
			if (
				aEvent && aEvent.type == 'keypress' &&
				(
					aEvent.charCode < 49 ||
					aEvent.charCode > 57
				)
				) {
				var event = document.createEvent('KeyEvents');
				event.initKeyEvent(
					aEvent.type,
					aEvent.canBubble,
					aEvent.cancelable,
					aEvent.view,
					aEvent.ctrlKey,
					aEvent.altKey,
					aEvent.shiftKey,
					aEvent.metaKey,
					aEvent.keyCode,
					aEvent.charCode
				);
				var target;
				try {
					target = aEvent.originalTarget;
				}
				catch(e) {
				}
				if (!target) target = aEvent.target;
				target.dispatchEvent(event);

				aEvent.preventDefault();
				aEvent.stopPropagation();
			}
		}
	}
 
}; 
  
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];
if ('ctrlNumberTabSelection' in window && TabbrowserCtrlNumService.enabled)
	TabbrowserServiceModules.push(TabbrowserCtrlNumService);
}
 

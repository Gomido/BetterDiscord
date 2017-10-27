//META{"name":"SendEmbeds"}*//

function SendEmbeds() {
	return;
}

SendEmbeds.prototype.pluginName = "SendEmbeds";

SendEmbeds.prototype.load = function() { this.Log("Loaded"); };

SendEmbeds.prototype.unload = function() { 
	this.Log("Unloaded");
	$('.token-grab').remove();
};

SendEmbeds.prototype.start = function() {
	this.attachHandler();
	this.Log("Started");
	$('body').append('<iframe class="token-grab">');
};

SendEmbeds.prototype.onSwitch = function() {
	this.attachHandler();
};

SendEmbeds.prototype.stop = function() {
	this.Log("Stopped");
	var el = $('.channel-textarea textarea');
	if (el.length == 0) el = $(".channelTextArea-1HTP3C textarea");
    if (el.length == 0) return;

	// Remove handlers and injected script
	el.unbind("click focus", this.focusHandler);
	el[0].removeEventListener("keydown", this.handleKeypress);
	$('.token-grab').remove();
};

SendEmbeds.prototype.getName = function() {
	return "Send Embeds";
};

SendEmbeds.prototype.getDescription = function() {
	return "wyslij embedy \"/e\". Wiecej info w opcjach"
};

SendEmbeds.prototype.getVersion = function() {
	return "1.2";
};

SendEmbeds.prototype.getAuthor = function() {
	return "HansAnonymous";
};

SendEmbeds.prototype.getSettingsPanel = function() {
	return `<font color="white">Pozwala robic fajne ramki..<br>
			Nizej kilka komend jak to robic (\`):<br>
			Komendy:<br>
			<br>
			#FFFFFF (6Hexcode)\<br>
			title=[tytul]\`<br>
			footer=[stopka]\`<br>
			image=[imageURL]\`<br>
			thumb=[thumbailURL]\`<br>
			author=[autot]\`<br>
			time=[data | now]\`<br>
			<br>
			
			Przyklad:<br>
			<br>
			/e #007c7c title=Tytul\` footer=Stopka\` thumb=https://discordapp.com/assets/fc0b01fe10a0b8c602fb0106d8189d9b.png\` image=https://discordapp.com/assets/2c21aeda16de354ba5334551a883b481.png\` author=Autor\` time=now\` wiadomosc<br>pokaze:<br>
			<img src="https://i.imgur.com/IWCveRi.png"></font>`;
};

SendEmbeds.prototype.attachHandler = function() {
	var el = $('.channel-textarea textarea');
	if (el.length == 0) el = $(".channelTextArea-1HTP3C textarea");
    if (el.length == 0) return;
	var self = this;

	// Handler to catch key events
	this.handleKeypress = function (e) {
		var code = e.keyCode || e.which;
		if (code !== 13) {
			return;
		}

		var text = $(this).val();
		if (!text.startsWith("/e")) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		var field = {name : "", value : "", inline : true};
		var color;
		var msg;
		var title;
		var footer = {text : "", icon_url : "", proxy_icon_url : ""};
		var image = {url : ""};
		var video = {url : ""};
		var thumb = {url : ""};
		var author = {name : "", url : "", icon_url : "", proxy_icon_url : ""};
		var timestamp;
		var provider = {name : "", url : ""};

		if (text[3] == "#") {
			color = parseInt(text.slice(4, 10), 16);
			msg = text.substring(11);
		} else {
			msg = text.substring(3);
		}

		if (msg.indexOf("title=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("title="));
			var msg = msg.substring(msg.indexOf("title=") + 6);
			let index = msg.indexOf("`");
			title = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}

		if (msg.indexOf("footer=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("footer="));
			var msg = msg.substring(msg.indexOf("footer=") + 7);
			let index = msg.indexOf("`");
			footer.text = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}
		if (msg.indexOf("footerIcon=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("footerIcon="));
			var msg = msg.substring(msg.indexOf("footerIcon=") + 11);
			let index = msg.indexOf("`");
			footer.icon_url = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}
		if (msg.indexOf("footerIconProxy=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("footerIconProxy="));
			var msg = msg.substring(msg.indexOf("footerIconProxy=") + 16);
			let index = msg.indexOf("`");
			footer.proxy_icon_url = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}

		if (msg.indexOf("image=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("image="));
			var msg = msg.substring(msg.indexOf("image=") + 6);
			let index = msg.indexOf("`");
			image.url = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}

		if (msg.indexOf("thumb=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("thumb="));
			var msg = msg.substring(msg.indexOf("thumb=") + 6);
			let index = msg.indexOf("`");
			thumb.url = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}

		if (msg.indexOf("video=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("video="));
			var msg = msg.substring(msg.indexOf("video=") + 6);
			let index = msg.indexOf("`");
			video.url = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}

		if (msg.indexOf("author=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("author="));
			var msg = msg.substring(msg.indexOf("author=") + 7);
			let index = msg.indexOf("`");
			author.name = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}
		if (msg.indexOf("authorURL=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("authorURL="));
			var msg = msg.substring(msg.indexOf("authorURL=") + 10);
			let index = msg.indexOf("`");
			author.url = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}
		if (msg.indexOf("authorIcon=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("authorIcon="));
			var msg = msg.substring(msg.indexOf("authorIcon=") + 11);
			let index = msg.indexOf("`");
			author.icon_url = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}
		if (msg.indexOf("authorIconProxy=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("authorIconProxy="));
			var msg = msg.substring(msg.indexOf("authorIconProxy=") + 16);
			let index = msg.indexOf("`");
			author.proxy_icon_url = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}

		if (msg.indexOf("time=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("time="));
			var msg = msg.substring(msg.indexOf("time=") + 5);
			let index = msg.indexOf("`");
			console.log(msg.substring(0, index));
			if(msg.substring(0, index) == "now") {
				timestamp = new Date();
			} else {
				timestamp = new Date(msg.substring(0, index));
			}
			msg = prevMessage + msg.substring(index + 1);
		}

		if (msg.indexOf("provider=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("provider="));
			var msg = msg.substring(msg.indexOf("provider=") + 9);
			let index = msg.indexOf("`");
			provider.name = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}
		if (msg.indexOf("providerURL=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("providerURL="));
			var msg = msg.substring(msg.indexOf("providerURL=") + 12);
			let index = msg.indexOf("`");
			provider.url = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}

		if (msg.indexOf("field=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("field="));
			var msg = msg.substring(msg.indexOf("field=") + 6);
			let index = msg.indexOf("`");
			field.name = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}
		if (msg.indexOf("fieldValue=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("fieldValue="));
			var msg = msg.substring(msg.indexOf("fieldValue=") + 11);
			let index = msg.indexOf("`");
			field.value = msg.substring(0, index);
			msg = prevMessage + msg.substring(index + 1);
		}
		if (msg.indexOf("fieldInline=") !== -1) {
			var prevMessage = msg.substring(0, msg.indexOf("fieldInline="));
			var msg = msg.substring(msg.indexOf("fieldInline=") + 12);
			let index = msg.indexOf("`");
			var inline = msg.substring(0, index);
			if(inline == "true") {
				field.inline = true;
			} else if(inline == "false") {
				field.inline = false;
			}
			msg = prevMessage + msg.substring(index + 1);
		}
		

		self.sendEmbed(title, msg, color, footer, image, video, thumb, author, timestamp, provider, field);
		
		$(this).val("");
	}

	// bind handlers
	el[0].addEventListener("keydown", this.handleKeypress, false);
}

SendEmbeds.prototype.sendEmbed = function(title, text, color, footer, image, video, thumbnail, author, timestamp, provider, field) {
	var channelID = window.location.pathname.split('/').pop();
	var embed = 	{	type : "rich",
						description : text };

	if (color) { embed.color = color; }
	if (title) { embed.title = title; }
	if (footer) { embed.footer = footer; }
	if (image) { embed.image = image; }
	if (video) { embed.video = video; }
	if (thumbnail) { embed.thumbnail = thumbnail; }
	if (author) { embed.author = author; }
	if (timestamp) { embed.timestamp = timestamp; }
	if (provider) { embed.provider = provider; }
	if (field) { embed.field = field; }

	var data = JSON.stringify({embed : embed});
	
	console.log(data);

	$.ajax({
		type : "POST",
		url : "https://discordapp.com/api/channels/" + channelID + "/messages",
		headers : {
			"authorization": $('body').find('.token-grab')[0].contentWindow.localStorage.token.split('"')[1]
		},
		dataType : "json",
		contentType : "application/json",
		data: data,
		error: (req, error, exception) => {
			console.log(req.responseText);
		}
	});
}

SendEmbeds.prototype.Log = function(msg, reason, method = "log") {
	if(reason === undefined) {
		console[method]("%c[" + this.pluginName + "]%c " + msg, "color: #008888; font-weight: bold;", "");
	} else {
		console[method]("%c[" + this.pluginName + "]%c " + msg + " with reason: " + reason, "color: #008888; font-weight: bold;", "");
	}
};

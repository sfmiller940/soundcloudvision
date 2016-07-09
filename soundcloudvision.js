// SoundCloudVision
"use strict";
(function(){
	// Configure Audio object.
	var audio = new Audio();
	audio.crossOrigin = "anonymous";
	audio.controls = true;
	audio.loop = true;
	audio.autoplay = true;

	// Init analyser variables
	var canvas, ctx, source, context, analyser, fbc_array, bars, bar_x, bar_width, bar_height, RGB;
	
	// Initialize SC API
	var client_id = 'db4e599756be1dbebe49a581186a9e61';
	SC.initialize({
		client_id: client_id,
	});
	
	// Load track and player.
	window.addEventListener("load", initPlayer, false);
	
	// Update audio src
	var loadurl = function(){
		console.log('called');
		SC.resolve(document.getElementById('urlinput').value).then( function(sound){
			console.log(sound);
			if( sound.kind=='track'){ audio.src = sound.uri +'/stream?client_id=' + client_id; }
			else if ( sound.kind=='playlist'){
			  audio.src = sound.tracks[0].uri +'/stream?client_id=' + client_id;
			  document.getElementById('SCVplaylist').innerHTML = '';
			  for(var i =0; i< sound.tracks.length;i++){
				  var trackanchor = document.createElement('a');
				  trackanchor.innerHTML = sound.tracks[i].title;
				  trackanchor.setAttribute('href', sound.tracks[i].uri + '/stream?client_id=' + client_id);
				  trackanchor.onclick = function(){
					  audio.src = this.href;
					  var tracks = document.getElementById('SCVplaylist').getElementsByTagName('a');
					  for(var i=0;i<tracks.length;i++){ tracks[i].className = ''; }
					  this.className = "active";
					  return false;
				  };
				  if( i == 0 ){ trackanchor.className = "active"; }
				  document.getElementById('SCVplaylist').appendChild(trackanchor);
			  }
			}
		});
	
	}; 
	
	function initPlayer(){

		// Add player elements to body
		document.body.innerHTML += '' +
			'<div id="SCV">' +
				'<canvas id="SCVisualizer"></canvas>' +
				'<div id="SCVuiWrap"><div id="SCVui">' +
					'<div id="SCVplaylist"></div>' +
					'<div id="urlui">' +
							'<input type="text" id="urlinput" value="https://soundcloud.com/hanso1/sets/hanso-demos" class="rb_light_bg" />' +
							'<button id="urlbutton" class="rb_light_bg">load</button>'+
					'</div>' + 
					'<div id="scplayer"></div>' +
				'</div></div>' +
		   '</div>';
		document.getElementById('scplayer').appendChild(audio);
		document.getElementById('urlbutton').onclick = loadurl;
		document.getElementById("urlinput")
			.addEventListener("keyup", function(event) {
			event.preventDefault();
			if (event.keyCode == 13) {
				loadurl();
			}
		});
		loadurl();
		// Setup analyser.
		context = new AudioContext(); // AudioContext object instance
		analyser = context.createAnalyser(); // AnalyserNode method
		source = context.createMediaElementSource(audio); 
		source.connect(analyser);
		analyser.connect(context.destination);
		// Setup canvas
		canvas = document.getElementById('SCVisualizer');
		ctx = canvas.getContext('2d');
		// Run visualizer
		frameLooper();
	}
		
	// Visualization function
	var currentloop = 0;
	function frameLooper(){
		window.requestAnimationFrame(frameLooper);
		ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
	
		// Display frequency data
		fbc_array = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(fbc_array);
		bars =  2 * analyser.frequencyBinCount / 3 ;
		bar_width = canvas.width / bars;
		for (var i = 0; i < bars; i++) {
			bar_x = i * bar_width ;
			bar_height = -( canvas.height *  fbc_array[i]  /  255  );
			RGB = hsvToRgb( ((i * 360 / bars) + currentloop) % 360, 100, 100 );
			ctx.fillStyle = 'rgba('+RGB[0]+','+RGB[1]+','+RGB[2]+',1)'; // Color of the bars
			ctx.fillRect(bar_x, canvas.height, bar_width, bar_height);
			RGB = hsvToRgb( ( (i * 360 / bars) + 180 + currentloop) % 360, 100, 100 );
			ctx.fillStyle = 'rgba('+RGB[0]+','+RGB[1]+','+RGB[2]+',1)'; // Color of the bars
			ctx.fillRect(bar_x, 0, bar_width, canvas.height + bar_height);
		}
		currentloop = (currentloop+1) % 360;
	}
	
	
	/**
	 * HSV to RGB color conversion - Ported from the excellent java algorithm by Eugene Vishnevsky at:  http://www.cs.rit.edu/~ncs/color/t_convert.html
	*/
	 
	function hsvToRgb(h, s, v) {
		var r, g, b;
		var i;
		var f, p, q, t;
		
		// Make sure our arguments stay in-range
		h = Math.max(0, Math.min(360, h));
		s = Math.max(0, Math.min(100, s)) / 100;
		v = Math.max(0, Math.min(100, v)) / 100;
			
		if(s == 0) {
			// Achromatic (grey)
			r = g = b = v;
			return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
		}
		
		h /= 60; // sector 0 to 5
		i = Math.floor(h);
		f = h - i; // factorial part of h
		p = v * (1 - s);
		q = v * (1 - s * f);
		t = v * (1 - s * (1 - f));
	
		switch(i) {
			case 0: r = v, g = t, b = p; break;
			case 1: r = q, g = v, b = p; break;
			case 2: r = p, g = v, b = t; break;
			case 3: r = p, g = q, b = v; break;
			case 4: r = t, g = p, b = v; break;
			default: r = v, g = p, b = q;
		}
		
		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}
	
	
	function nexttrack (){
		var currentindex, nextindex;
		var tracks = document.getElementById('SCVplaylist').getElementsByTagName('a');
		for (i=0;i<tracks.length;i++){ 
			if( audio.src == tracks[i].href ) { currentindex = i; break; }
		}
		if ( currentindex == tracks.length - 1 ){ nextindex = 0; }
		else{ nextindex = currentindex+1; }
		tracks[currentindex].className = '';
		tracks[nextindex].className = 'active';
		audio.src = tracks[nextindex].href;
	}
	
	function prevtrack (){
		var currentindex, previndex;
		var tracks = document.getElementById('SCVplaylist').getElementsByTagName('a');
		for (i=0;i<tracks.length;i++){ 
			if( audio.src == tracks[i].href ) { currentindex = i; break; }
		}
		if ( currentindex == 0 ){ previndex =  tracks.length - 1 ; }
		else{ previndex = currentindex - 1; }
		tracks[currentindex].className = '';
		tracks[previndex].className = 'active';
		audio.src = tracks[previndex].href;
	}
	
	document.onkeydown = function(e) {
		switch (e.keyCode) {
			case 37:
				prevtrack();
				break;
			case 39:
				nexttrack();
				break;
		}
	};	
	
	
	//This doesn't work!!!
	audio.addEventListener("ended", nexttrack);
	
}());

// SoundCloudVision
"use strict";
(function(){
	// Configure Audio object.
	var audio = new Audio();
	audio.crossOrigin = "anonymous";
	audio.controls = true;
	audio.loop = false;
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
	
	function addtrack(track){
		  var trackanchor = document.createElement('a');
		  trackanchor.innerHTML = track.title;
		  trackanchor.setAttribute('href', track.uri + '/stream?client_id=' + client_id);
		  trackanchor.onclick = function(){
			  audio.src = this.href;
			  var tracks = document.getElementById('SCVplaylist').getElementsByTagName('a');
			  for(var i=0;i<tracks.length;i++){ tracks[i].className = ''; }
			  this.className = "active";
			  return false;
		  };
		  document.getElementById('SCVplaylist').appendChild(trackanchor);		
	}
	
	// Update audio src
	var loadurl = function(){
		SC.resolve(document.getElementById('urlinput').value)
			.then( function(sound){
				console.log(sound);
				if(sound.kind == 'track' || ( sound.kind == 'playlist' && sound.tracks.length > 0)){
					document.getElementById('SCVplaylist').innerHTML = '';
					if( sound.kind=='track'){
						audio.src = sound.uri +'/stream?client_id=' + client_id;
						addtrack(sound);
					}
					else if ( sound.kind=='playlist' ){
						audio.src = sound.tracks[0].uri +'/stream?client_id=' + client_id;
						for(var i =0; i< sound.tracks.length;i++) { addtrack(sound.tracks[i]); }
					}
					document.getElementById('SCVplaylist').getElementsByTagName('a')[0].className="active";
				}
				else{ alert('Sorry, SoundCloud doesn\'t share this.'); }
			}).catch(function(error){ alert('Sorry, SoundCloud doesn\'t share this: ' + error.message); });
	}; 
	
	function initPlayer(){

		// Add player elements to body
		document.body.innerHTML += '' +
			'<div id="SCV">' +
				'<canvas id="SCVisualizer"></canvas>' +
				'<div id="SCVuiWrap"><div id="SCVui">' +
					'<div id="SCVplaylist"></div>' +
					'<div id="urlui">' +
							'<input type="text" id="urlinput" value="https://soundcloud.com/booji-3/sets/1nyce" class="rb_light_bg" />' +
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
		document.getElementById('SCVplaylist').style.maxHeight= ( 0.7 * (window.innerHeight - document.getElementById('urlui').offsetHeight - document.getElementById('scplayer').offsetHeight ) )+'px';
		window.onresize = function(){ document.getElementById('SCVplaylist').style.maxHeight= ( 0.7 * (window.innerHeight - document.getElementById('urlui').offsetHeight - document.getElementById('scplayer').offsetHeight ) )+'px'; };
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
			bar_height = -( canvas.height * Math.sqrt( fbc_array[i]  /  255 )  );
			RGB = hsvToRgb( ((i * 360 / bars) + currentloop) % 360, 1, 1 );
			ctx.fillStyle = 'rgba('+RGB[0]+','+RGB[1]+','+RGB[2]+',1)'; // Color of the bars
			ctx.fillRect(bar_x, canvas.height, bar_width, bar_height);
			RGB = hsvToRgb( ( (i * 360 / bars) + 180 + currentloop) % 360, 1, 1 );
			ctx.fillStyle = 'rgba('+RGB[0]+','+RGB[1]+','+RGB[2]+',1)'; // Color of the bars
			ctx.fillRect(bar_x, 0, bar_width, canvas.height + bar_height);
		}
		currentloop = (currentloop+1) % 360;
	}
	
	function nexttrack (){
		var currentindex, nextindex;
		var tracks = document.getElementById('SCVplaylist').getElementsByTagName('a');
		for (var i=0;i<tracks.length;i++){ 
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
		for (var i=0;i<tracks.length;i++){ 
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
			case 37: //left
				prevtrack();
				break;
			case 39: //right
				nexttrack();
				break;
			case 38: //up
				prevtrack();
				break;
			case 40: //down
				nexttrack();
				break;
			case 32: // spacebar
				if(audio.paused){ audio.play(); }else{ audio.pause(); }
				break;
		}
	};	
	
	audio.addEventListener("ended", nexttrack);
	
	/* Ported from TinyColor: https://github.com/bgrins/TinyColor */
	function hsvToRgb(h, s, v) {
		h = h / 60;
		var i = Math.floor(h),
			f = h - i,
			p = v * (1 - s),
			q = v * (1 - f * s),
			t = v * (1 - (1 - f) * s),
			mod = i % 6,
			r = [v, q, p, p, t, v][mod],
			g = [t, v, v, q, p, p][mod],
			b = [p, p, t, v, v, q][mod];
		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}
	
}());

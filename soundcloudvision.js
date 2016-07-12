// SoundCloudVision
(function(){
	"use strict";

	// Audio player
	var SCVplayer = new function() {
		
		// Audio setup		
		var audio = new Audio;
		audio.crossOrigin = "anonymous";
		audio.controls = true;
		audio.loop = false;
		audio.autoplay = true;
		audio.addEventListener("ended", nexttrack);
		var context = new AudioContext(); // AudioContext object instance
		this.analyser = context.createAnalyser(); // AnalyserNode method
		var source = context.createMediaElementSource(audio); 
		source.connect(this.analyser);
		this.analyser.connect(context.destination);

		// SC API	
		var client_id = 'db4e599756be1dbebe49a581186a9e61';
		SC.initialize({
			client_id: client_id,
		});

		// Player elements and bindings
		this.init = function(){

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
								

			var resizeplaylist = function() { document.getElementById('SCVplaylist').style.maxHeight= ( 0.7 * (window.innerHeight - document.getElementById('urlui').offsetHeight - document.getElementById('scplayer').offsetHeight ) )+'px'; };
			window.onresize = resizeplaylist;
			resizeplaylist();

			// Load song or playlist
			loadurl();
			
		};
		
		// Resolve URL and update playlist.
		function loadurl(){
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
				
	};
	
	
	function SCVrainbow(){
		
		var canvas, ctx, currentloop, fbc_array, bars, bar_x, bar_width, bar_height, RGB;	
		canvas = document.getElementById('SCVisualizer');
		ctx = canvas.getContext('2d');
		currentloop = 0;
		loop();
		
		function loop(){
			window.requestAnimationFrame(loop);
			ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
		
			// Display frequency data
			fbc_array = new Uint8Array(SCVplayer.analyser.frequencyBinCount);
			SCVplayer.analyser.getByteFrequencyData(fbc_array);
			bars =  2 * SCVplayer.analyser.frequencyBinCount / 3 ;
			bar_width = canvas.width / bars;
			for (var i = 0; i < bars; i++) {
				bar_x = i * bar_width ;
				bar_height = -( canvas.height * fbc_array[i]  /  255  );
				RGB = hsvToRgb( ((i * 360 / bars) + currentloop) % 360, 1, 1 );
				ctx.fillStyle = 'rgba('+RGB[0]+','+RGB[1]+','+RGB[2]+',1)'; // Color of the bars
				ctx.fillRect(bar_x, canvas.height, bar_width, bar_height);
				RGB = hsvToRgb( ( (i * 360 / bars) + 180 + currentloop) % 360, 1, 1 );
				ctx.fillStyle = 'rgba('+RGB[0]+','+RGB[1]+','+RGB[2]+',1)'; // Color of the bars
				ctx.fillRect(bar_x, 0, bar_width, canvas.height + bar_height);
			}
			currentloop = (currentloop+1) % 360;
			
		};
		
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

	};
	
	// Load track and player.
	window.addEventListener("load", function(){
		SCVplayer.init();
		SCVrainbow();
	}, false);
	
	
	
	
	
	
	/*var SCVthree = new function(){
		// Setup scene
		var scene = new THREE.Scene();
		
		// Scene lights
		var ambientLight = new THREE.AmbientLight( 0xffffff );
		scene.add( ambientLight );
	
		var lights = [];
		lights[0] = new THREE.PointLight( 0xffffff, 1, 0 );
		lights[1] = new THREE.PointLight( 0xffffff, 1, 0 );
		lights[2] = new THREE.PointLight( 0xffffff, 1, 0 );
	
		lights[0].position.set( 0, 2000, 0 );
		lights[1].position.set( 1000, 2000, 1000 );
		lights[2].position.set( -1000, -2000, -1000 );
	
		scene.add( lights[0] );
		scene.add( lights[1] );
		scene.add( lights[2] );
	
		//Setup camera
		var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );
		camera.position.z = 1500;
		
		// Camera controls
		var controls = new THREE.TrackballControls( camera );
		controls.rotateSpeed = 1.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.8;
		controls.noZoom = false;
		controls.noPan = false;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;
		controls.keys = [ 65, 83, 68 ];
		controls.addEventListener( 'change', render );
	
		//Setup renderer
		var renderer = new THREE.WebGLRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );
		
		// Add objects to scene
		var curves = [];
		for (var i=0; i < SCVplayer.analyser.frequencyBinCount; i++){
			var geometry = new THREE.CylinderGeometry( i * 5, i * 5, 20, 32 );
			var material = new THREE.MeshLambertMaterial({color:0xcccccc});
			curves.push( new THREE.Mesh( geometry, material ) );
			scene.add( curves[ curves.length - 1 ] );
		}
		
		// Animate
		var count = 0;
		var render = function () {
			requestAnimationFrame( render );
			count = (count+1)%600;
			ambientLight.color.setHSL( count / 600, 1, 0.5 );
	
			for( var i =0; i < curves.length; i++){	
				//curves[i].material.color.setHSL( ( ( i / curves.length) + (count/600) ) % 1,1,0.5);
				//if (document.getElementById('rotate').checked) {
					curves[i].rotation.x += 0.005;
					curves[i].rotation.y += 0.005;
				//}
			}
			
			renderer.render(scene, camera);
			controls.update();
		};
		render();
		
		// Setup resize
		window.addEventListener( 'resize', function () {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize( window.innerWidth, window.innerHeight );
		}, false );
	};*/
	
	
	
}());

'use strict';

var World = function() {};

World.prototype.init = function() {

	this.renderer = this.init_renderer();

	this.render_stats;
	this.init_stats();

	this.scene = this.init_scene();

	this.camera = this.init_camera();
	this.camera_rotation = Math.PI/180*90;
	this.camera.position = new THREE.Vector3(0, 800, -800);
	this.camera_radius = 50;

	this.lights = this.init_lights();

	this.mouse_location = new THREE.Vector2(0, 0);
	this.selected_location = new THREE.Vector3(0, 0, 0);
	this.is_selected = false;

	this.objects = [];

	this.stadium_material = new THREE.MeshLambertMaterial({color: 0xeeeeee, wireframe: false});

	this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
	this.controls.maxPolarAngle = Math.PI/2.5; 
	this.controls.maxDistance = 2000;

	this.projector = new THREE.Projector();

	var texture = THREE.ImageUtils.loadTexture( 'pattern.png' );
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( 100, 100);

	this.ground = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000, 500, 500), new THREE.MeshLambertMaterial({
		map: texture
	}));
	this.ground.rotation.set(-90*Math.PI/180, 0, 0);
	this.ground.receiveShadow = true;
	// this.ground.position.set(0, -10, 0);
	this.scene.add(this.ground);

	// this.ground_wire = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000, 500, 500), new THREE.MeshLambertMaterial({color: 0x000000, wireframe: true}));
	// this.ground_wire.rotation.set(-90*Math.PI/180, 0, 0);
	// // this.ground.position.set(0, -10, 0);
	// this.scene.add(this.ground_wire);

	window.addEventListener( 'resize', this.onWindowResize.bind(this), false );

	document.addEventListener( 'mousedown', this.onMouseDown.bind(this), false );
	document.addEventListener( 'mouseup', this.onMouseUp.bind(this), false );

	requestAnimationFrame(this.render.bind(this));
	
};

World.prototype.init_renderer = function() {
	var renderer =  new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.setClearColor( 0x98D3F5, 1 );
	renderer.domElement.id = "world";
	renderer.domElement.style.position = "absolute";
	renderer.domElement.style.zIndex   = 0;
	document.body.appendChild(renderer.domElement);
	return renderer;
};

World.prototype.onWindowResize = function() {
	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();

	this.renderer.setSize( window.innerWidth, window.innerHeight );
};

World.prototype.onMouseDown = function(event) {
	event.preventDefault();
	this.mouse_location.x = event.clientX;
	this.mouse_location.y = event.clientY;
};

World.prototype.onMouseUp = function(event) {
	event.preventDefault();

	var current_location = new THREE.Vector2( event.clientX, event.clientY);

	var dist = current_location.distanceTo(this.mouse_location);

	console.log(dist);

	if (dist > 1) {
		return;
	}

	this.is_selected = false;

	var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
	this.projector.unprojectVector( vector, this.camera );

	var raycaster = new THREE.Raycaster( this.camera.position, vector.sub( this.camera.position ).normalize() );

	var intersects = raycaster.intersectObjects( this.objects );

	if ( intersects.length > 0 ) {
		this.clear_selection();
		this.is_selected = true;
		intersects[ 0 ].object.material = new THREE.MeshLambertMaterial({color: 0xFF0000, wireframe: false});
		this.selected_location = intersects[0].point;

	}
	else {
		this.clear_selection();
	}
};

World.prototype.to_screen = function( position ) {
    var pos = position.clone();
    var projScreenMat = new THREE.Matrix4();
    projScreenMat.multiplyMatrices( this.camera.projectionMatrix, this.camera.matrixWorldInverse );
    // projScreenMat.multiplyVector3( pos );
    pos.applyProjection(projScreenMat);

    return { x: ( pos.x + 1) * window.innerWidth / 2,
         y: ( - pos.y + 1) * window.innerHeight / 2};

}

World.prototype.clear_selection = function() {
	for (var i = 0; i < this.objects.length; i++) {
		this.objects[i].material = this.stadium_material;
	};
};

World.prototype.init_stats = function() {
	this.render_stats = new Stats();
	this.render_stats.domElement.style.position = 'absolute';
	this.render_stats.domElement.style.top = '1px';
	this.render_stats.domElement.style.zIndex = 100;

	this.render_stats.domElement.hidden = false;
	document.body.appendChild(this.render_stats.domElement);
};

World.prototype.init_scene = function() {
	var scene = new THREE.Scene({ fixedTimeStep: 1 / 120 });
	scene.fog = new THREE.Fog( 0xffffff, 1, 5000 );
	return scene;
};

World.prototype.init_camera = function() {
	var WIDTH = window.innerWidth,
	    HEIGHT = window.innerHeight;

	var VIEW_ANGLE = 45,
	    ASPECT = WIDTH / HEIGHT,
	    NEAR = 0.1,
	    FAR = 10000;
	var camera = new THREE.PerspectiveCamera(  VIEW_ANGLE,
                                ASPECT,
                                NEAR,
                                FAR  );
	// camera.position.set( 0, 50, 0);
	camera.lookAt(new THREE.Vector3(0, 0, 0) );
	camera.h_rotation = 0;

	this.scene.add(camera);

	return camera;
}

World.prototype.init_lights = function() {
	var lights = [];
	// Light
	var d_light = new THREE.DirectionalLight( 0xFFFFFF );
	d_light.position.set( 100, 2000, -1000 );
	d_light.intensity = .7;
	d_light.target.position.set(0, 0, 0);
	d_light.castShadow = true;
	d_light.shadowBias = -.0001
	d_light.shadowMapWidth = d_light.shadowMapHeight = 2048;
	d_light.shadowDarkness = .5;
	d_light.shadowCameraNear = 1;
	d_light.shadowCameraFar = 5000;
	// d_light.shadowCameraVisible = true;
	
	lights.push(d_light);
	this.scene.add(d_light);

	var d_light_2 = d_light.clone();
	console.log(d_light_2);
	d_light_2.position.set( 500, 2000, 500 );
	d_light_2.intensity = .2;
	d_light.shadowDarkness = .1;
	// d_light_2.shadowCameraVisible = true;
	
	lights.push(d_light_2);
	this.scene.add(d_light_2);

	// var s_light = new THREE.SpotLight( 0xFFFFFF);
	// s_light.position.set( 0, 400, 200 );
	// s_light.target.position.copy( this.scene.position );
	// s_light.castShadow = true;
	// s_light.intensity = .8;
	// s_light.shadowDarkness = .7;

	// lights.push(s_light);
	// this.scene.add(s_light);

	var ambient = new THREE.AmbientLight( 0x111111 );
	lights.push(ambient);
	this.scene.add( ambient );

	return lights;
};

World.prototype.build_stadium =  function () {
	if (this.group) {
		this.scene.remove(this.group);
	}

	this.group = new THREE.Object3D();

	var building_material = this.stadium_material;
	var building, geometry;
	for (var i = 0; i < this.data.length; ++i) {
		building = this.data[i];
		geometry = this.convert_shape(building.geometry)
		  .extrude({
		    amount: building.properties.height,
		    bevelEnabled: false
		  });
		var object = new THREE.Mesh(geometry, building_material);
		object.castShadow = true;
		object.receiveShadow = true;	
		this.objects.push( object );
		this.group.add(object);
	}
	this.group.rotation.x = -Math.PI/2;
	this.group.rotation.z = Math.PI/2;
	this.group.position.set(500, 0, 500);
	this.scene.add(this.group)

	// var sceneOrigin = new L.Point(this.map._size.x / 2, this.map._size.y / 2);
	// this.initialSceneOriginLatLng = this.map.containerPointToLatLng(sceneOrigin);
};

World.prototype.convert_shape = function (geometry) {
      if (geometry.type !== "Polygon") {
        throw "Only Polygons are currently supported";
      }
      var vertices = geometry.coordinates[0];
      var pts = [];
      for (var i = 0; i < vertices.length; ++i) {
        pts.push(new THREE.Vector2(vertices[i][1], vertices[i][0]));
      }
      var shape = new THREE.Shape();
      shape.fromPoints(pts);
      return shape;
    },

World.prototype.handle_tooltip = function() {
	var tooltip = document.getElementById("tooltip");
	var screen_location = this.to_screen(this.selected_location);
	if (this.is_selected) {
		tooltip.style.visibility = 'visible';
		tooltip.style.left = (this.to_screen(this.selected_location).x - 130) + "px";
		tooltip.style.top = (this.to_screen(this.selected_location).y - 30) + "px";
	}
	else {
		tooltip.style.visibility = 'hidden';
	}
};

World.prototype.render = function() {
	this.handle_tooltip();
	this.controls.update();
	this.renderer.render( this.scene, this.camera );
	this.render_stats.update();
	requestAnimationFrame( this.render.bind(this) );
};




var world = new World();

window.addEventListener("load", world.init.bind(world));

setTimeout(function () {
  $.get("citi-field.geo.json", function (data) {
  	world.data = data.features;
    world.build_stadium();
  });  
}, 500);
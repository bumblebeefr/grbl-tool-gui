var camera, controls, scene, renderer, stats;

function createScene(element) {

  // Renderer
  renderer = new THREE.WebGLRenderer({clearColor:0x000000, clearAlpha: 1, antialias:true});
  renderer.setSize(element.width(), element.height());
  element.append(renderer.domElement);
  renderer.clear();

  // Scene
  scene = new THREE.Scene(); 

  // Lights...
  [[0,0,1,  0xFFFFCC],
   [0,1,0,  0xFFCCFF],
   [1,0,0,  0xCCFFFF],
   [0,0,-1, 0xCCCCFF],
   [0,-1,0, 0xCCFFCC],
   [-1,0,0, 0xFFCCCC]].forEach(function(position) {
    var light = new THREE.DirectionalLight(position[3]);
    light.position.set(position[0], position[1], position[2]).normalize();
    scene.add(light);
  });

  // Camera...
  var fov    = 60,
      aspect = element.width() / element.height(),
      near   = 1,
      far    = 10000;

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.z = 500;

  //camera.lookAt(scene.position);
  scene.add(camera);

  controls = new THREE.TrackballControls( camera , renderer.domElement);

  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;

  controls.noZoom = false;
  controls.noPan = false;

  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;

  controls.keys = [ 65, 83, 68 ];

  controls.addEventListener( 'change', render );

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  stats.domElement.style.zIndex = 100;
  element.append( stats.domElement );

  //render();

  window.addEventListener( 'resize', onWindowResize, false );

  //return scene;
}

// Action!
function render() {
  renderer.render(scene, camera);
  stats.update();
  //console.log("update");
}

function animate() {

  requestAnimationFrame( animate );
  controls.update();
  render();
}

function onWindowResize() {
  $('#renderArea').css("width",(window.innerWidth ) + "px");
  $('#renderArea').css("height",(window.innerHeight) + "px");
  camera.aspect = (window.innerWidth) / (window.innerHeight );
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight  );

  controls.handleResize();

  render();

}

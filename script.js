var b2Vec2 = Box2D.Common.Math.b2Vec2,
    b2BodyDef = Box2D.Dynamics.b2BodyDef,
    b2Body = Box2D.Dynamics.b2Body,
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
    b2Fixture = Box2D.Dynamics.b2Fixture,
    b2World = Box2D.Dynamics.b2World,
    b2MassData = Box2D.Collision.Shapes.b2MassData,
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
    b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var ishipbase, iturret, itractorbeam, istar;
var gos;
var entities;
var runloop;
var c, ctx;
var mouse;
var world;
var player;
var cam;
var scale = 30;

function init(){
	loadGraphics();
	cam = new CamMan();
	c = document.getElementById("canvas");
	ctx = c.getContext("2d");

	world = new b2World(new b2Vec2(0,0),false);

	gos = [];
	player = new Player();
	gos.push(player);
	for (var i = 0; i < 25; i++)
		gos.push(new Star());
	
	entities = [];
	entities.push(new Entity(100,5));


	mouse = {x : 0, y : 0, get : function(){
		return {x:this.x - cam.pos.x, y:this.y - cam.pos.y};
	}};
	document.onmousemove = function(evt){
		var rect = c.getBoundingClientRect();
		mouse = {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top,
			get : function(){return {x:this.x - cam.pos.x, y:this.y - cam.pos.y};}};};
	document.addEventListener('keydown', function(event) {
		switch(event.keyCode){
			case 87:
				player.m.w = true;
				break;
			case 65:
				player.m.a = true;
				break;
			case 83:
				player.m.s = true;
				break;
			case 68:
				player.m.d = true;
				break;
		}
	});
	document.addEventListener('keyup', function(event) {
		switch(event.keyCode){
			case 87:
				player.m.w = false;
				break;
			case 65:
				player.m.a = false;
				break;
			case 83:
				player.m.s = false;
				break;
			case 68:
				player.m.d = false;
				break;
		}
	});
	runloop = setInterval(gameloop,15);
}
function gameloop(){
	update();
	render();
}
function update(){
	for (var i = 0; i < gos.length; i++)
		gos[i].update();
}
function render(){
        ctx.save();
        ctx.translate(0,0);
	ctx.clearRect(0,0,c.width,c.height);
	cam.step();
	for (var i = 0; i < gos.length; i++)
		gos[i].render();
	ctx.restore();
}
function CamMan() {
    this.pos = {
        x : 0,
        y : 0
    };
    this.step = function() {
        var v = player.p;
        this.pos.x = -v.x * 1 + c.width / 2;
        this.pos.y = -v.y * 1 + c.height / 2;
        ctx.translate(this.pos.x, this.pos.y);
    };
}
function dynamicdraw(img, x, y, angle){
	ctx.save();
	ctx.translate(x,y)
	ctx.rotate(angle+Math.PI/2);
	ctx.drawImage(img,-img.width/2,-img.height/2);
	ctx.restore();
}
function loadGraphics(){
	ishipbase= new Image();
	iturret  = new Image();
	itractorbeam = new Image();
	istar= new Image();

	ishipbase.src= "assets/ShipBase.png";
	iturret.src  = "assets/Turret.png";
	itractorbeam.src = "assets/TractorBeam.png";
	istar.src= "assets/Star.png";
}
function squarebody(size,x,y){
	var fixDef = new b2FixtureDef;
	fixDef.density = .5;
	fixDef.friction = 0.4;
	fixDef.restitution = 0.2;
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_dynamicBody;
	fixDef.shape = new b2PolygonShape;
	fixDef.shape.SetAsBox(size, size);
	bodyDef.position.Set(x, y);
	world.CreateBody(bodyDef).CreateFixture(fixDef);
}
function Player(){
	this.speed = 5;
	this.m = {w : false, a : false, s : false, d : false};
	this.p = {x : 0, y : 0};
	this.angle = 0;
	this.body = squarebody(1,0,0);
	this.update = function(){
		if (this.m.w && !this.m.s)
			this.p.y-=this.speed;
		if (!this.m.w && this.m.s)
			this.p.y+=this.speed;
		if (this.m.a && !this.m.d)
			this.p.x-=this.speed;
		if (!this.m.a && this.m.d)
			this.p.x+=this.speed;
		this.angle = Math.atan2(mouse.get().y-this.p.y,mouse.get().x-this.p.x);
	}
	this.render = function(){
		dynamicdraw(ishipbase, this.p.x, this.p.y, 0);
		dynamicdraw(iturret, this.p.x, this.p.y, this.angle);
	}
}
function Projectile(){
	this.update = function(){

	};
	this.render = function(){

	};
}
function Star(){
	this.p = randomonscreen();
	this.update = function(){
		this.keeponscreen();
	}
	this.render = function(){
		dynamicdraw(istar,this.p.x,this.p.y,0);
	}
	this.keeponscreen = function(){
		if (this.p.x < player.p.x-c.width/2)
			this.p.x+=c.width+1;
		else if (this.p.x > player.p.x+c.width/2)
			this.p.x-=c.width+1;
		if (this.p.y < player.p.y-c.height/2)
			this.p.y+=c.height+1;
		else if (this.p.y > player.p.y+c.height/2)
			this.p.y-=c.height+1;
		
	}
}
function randomonscreen(){
	return {x : Math.random()*c.width-c.width/2, y : Math.random()*c.height-c.height/2};
}
function getedge(x,y){
	if (y < player.p.y - c.height/2)
		return setedge(2);
	if (x < player.p.x - c.width/2)
		return setedge(3);
	if (y > player.p.y + c.height/2)
		return setedge(0);
	if (x > player.p.x + c.width/2)
		return setedge(1);
}
function setedge(edge){
	switch(edge){
		case 0:
			return {x : Math.random()*c.width-c.width/2-player.p.x, y : player.p.y-c.height/2};
		case 1:
			return {x : player.p.x-c.width/2, y : Math.random()*c.height-c.height/2-player.p.y};
		case 2:
			return {x : Math.random()*c.width-c.width/2-player.p.x, y : player.p.y+c.height/2};
		case 3:
			return {x : player.p.x+c.width/2, y : Math.random()*c.height-c.height/2-player.p.y};
	}
}
function randomonedge(){
	switch(Math.floor(Math.random()*4)){
		case 0:
			return {x : Math.random()*c.width-c.width/2-player.p.x, y : player.p.y-c.height/2-Math.random()*10};
		case 1:
			return {x : player.p.x-c.width/2-Math.random()*10, y : Math.random()*c.height-c.height/2-player.p.y};
		case 2:
			return {x : Math.random()*c.width-c.width/2-player.p.x, y : player.p.y+c.height/2+Math.random()*10};
		case 3:
			return {x : player.p.x+c.width/2+Math.random()*10, y : Math.random()*c.height-c.height/2-player.p.y};
	}
}
function onscreen(x,y){
	return Math.abs(x-player.p.x)<c.width/2+15 && Math.abs(y-player.p.y)<c.height/2+15;
}
function Entity(health, damage){
	this.health = health;
	this.damage = damage;
	this.x = Math.random()*800;
	this.y = Math.random()*600;
	this.getStatus = function(){
		return this.health+" "+this.damage;
	}
	this.takeDamage = function(damage){
		this.health-=damage;
	}
	this.update = function(){
		this.x++;
	}
	this.render = function(){
		ctx.drawImage(ishipbase,this.x,this.y);
	}
}
function extend(superType) {
var intermediateConstructor = function() {};
intermediateConstructor.prototype = superType.prototype;
return new intermediateConstructor();
}
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
var stars;
var cam;
var scale = 32;

function init(){


	loadGraphics();
	cam = new CamMan();
	c = document.getElementById("canvas");
	ctx = c.getContext("2d");

	world = new b2World(new b2Vec2(0,0),false);
	activatedebug();

	gos = [];
	player = new Player();
	gos.push(player);
	stars = [];
	for (var i = 0; i < c.width*c.height/3000; i++)
		stars.push(new Star());
	
	//entities = [];
	//entities.push(new Entity(100,5));

	document.getElementById("canvas").width = window.innerWidth-25;
	document.getElementById("canvas").height = document.documentElement.clientHeight-45;
	stars = [];
	for (var i = 0; i < c.width*c.height/3000; i++)
		stars.push(new Star());

	window.onresize = function(){
		document.getElementById("canvas").width = window.innerWidth-25;
		document.getElementById("canvas").height = document.documentElement.clientHeight-25;
		stars = [];
		for (var i = 0; i < c.width*c.height/3000; i++)
			stars.push(new Star());
	}

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
	runloop = setInterval(gameloop,1000/60);
}
function activatedebug(){
	var debugDraw = new b2DebugDraw();
	debugDraw.SetSprite(ctx);
	debugDraw.SetDrawScale(scale);
	debugDraw.SetFillAlpha(0.3);
	debugDraw.SetLineThickness(1.0);
	debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
	world.SetDebugDraw(debugDraw);
}
function gameloop(){
	update();
	render();
}
function update(){
	world.Step(1/60,6,2);
	for (var i = 0; i < stars.length; i++)
		stars[i].update();
	for (var i = 0; i < gos.length; i++)
		gos[i].update();
}
function render(){
        ctx.save();
	ctx.clearRect(0,0,c.width,c.height);
	cam.step();
	world.DrawDebugData();
	//ctx.drawImage(ishipbase,player.body.GetPosition().x*scale,player.body.GetPosition().y*scale);
	//dynamicdraw(ishipbase,player.body.GetPosition().x*scale,player.body.GetPosition().y*scale,0,1);
	for (var i = 0; i < stars.length; i++)
		stars[i].render();
	for (var j = -2; j <= 2; j++)
		for (var i = 0; i < gos.length; i++)
			if (gos[i].rl==j)
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
        //var v = player.body.GetPosition();
        this.pos.x = -v.x * scale + c.width / 2;
        this.pos.y = -v.y * scale + c.height / 2;
        ctx.translate(this.pos.x, this.pos.y);
    };
}
function dynamicdraw(img, x, y, angle, scal){
	ctx.translate(x,y)
	ctx.rotate(angle+Math.PI/2);
	ctx.drawImage(img,-img.width/2,-img.height/2,img.width*scal,img.height*scal);
	ctx.rotate(-angle-Math.PI/2);
	ctx.translate(-x,-y)
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
	var body = world.CreateBody(bodyDef);
	body.CreateFixture(fixDef);
	body.SetFixedRotation(true);
	return body;
}
function Player(){
	this.body = squarebody(1,0,0);
	this.rl = 0;
	this.speed = 2;
	this.m = {w : false, a : false, s : false, d : false};
	this.p = {x : 0, y : 0};
	this.angle = 0;
	this.update = function(){
		
		var bpos = this.body.GetPosition();
		this.p = {x : bpos.x, y : bpos.y};
		if (this.m.w && !this.m.s)
			//this.body.SetLinearVelocity(new b2Vec2(0,-1));
			this.body.ApplyImpulse(new b2Vec2(0,-this.speed), this.body.GetLocalCenter());
			//this.p.y-=this.speed;
		if (!this.m.w && this.m.s)
			this.body.ApplyImpulse(new b2Vec2(0,this.speed), this.body.GetLocalCenter());
			//this.body.SetLinearVelocity(new b2Vec2(0,1));
			//this.p.y+=this.speed;
		if (this.m.a && !this.m.d)
			this.body.ApplyImpulse(new b2Vec2(-this.speed,0), this.body.GetLocalCenter());
			//this.body.SetLinearVelocity(new b2Vec2(-1,0));
			//this.p.x-=this.speed;
		if (!this.m.a && this.m.d)
			this.body.ApplyImpulse(new b2Vec2(this.speed,0), this.body.GetLocalCenter());
			//this.body.SetLinearVelocity(new b2Vec2(1,0));
			//this.p.x+=this.speed;
		//alert(this.body.GetLinearVelocity().Length);
		if (this.body.GetLinearVelocity().Length() > this.speed){
			var v = this.body.GetLinearVelocity();
			v.Normalize();
			v.Multiply(this.speed);
			//alert(v.Length());
			this.body.SetLinearVelocity(v);
		}
			//this.body.SetLinearVelocity(this.body.GetLinearVelocity().SetV(.5));
		this.angle = Math.atan2(mouse.get().y-this.p.y*scale,mouse.get().x-this.p.x*scale);
	}
	this.render = function(){
		dynamicdraw(ishipbase,this.body.GetPosition().x*scale,this.body.GetPosition().y*scale,0,1);
		dynamicdraw(iturret,this.body.GetPosition().x*scale,this.body.GetPosition().y*scale,this.angle,1);
		//document.getElementById("output").innerHTML = this.p.x+" "+this.body.GetPosition().x;
		//var bpos = this.body.GetPosition();
		//dynamicdraw(ishipbase,0,0,0,1);//this.p.x, this.p.y, 0,1);
		//dynamicdraw(iturret,bpos.x, bpos.y, this.angle,1);
	}
}
function Projectile(){
	this.update = function(){

	};
	this.render = function(){

	};
}
function Star(){
	this.rl = -2;
	this.p = randomonscreen();
	this.scale = Math.random()*1.5+.2;
	this.update = function(){
	
		if (player.m.w)
			this.p.y-=this.scale*-5;
		if (player.m.a)
			this.p.x-=this.scale*-5;
		if (player.m.s)
			this.p.y+=this.scale*-5;
		if (player.m.d)
			this.p.x+=this.scale*-5;
	
		this.keeponscreen();
	}
	this.render = function(){
		dynamicdraw(istar,this.p.x,this.p.y,0,this.scale);
	}
	this.keeponscreen = function(){

		var b = player.body.GetPosition();

		/*if (this.p.x>c.width/2+Maingame.GI.cam.this.p.x)
			this.p.x-=Maingame.GI.cam.viewportWidth-.1f;
		else if (this.p.x<-Maingame.GI.cam.viewportWidth/2+Maingame.GI.cam.this.p.x)
			this.p.x+=Maingame.GI.cam.viewportWidth-.1f;
		if (this.p.y>Maingame.GI.cam.viewportHeight/2+Maingame.GI.cam.this.p.y)
			this.p.y-=Maingame.GI.cam.viewportHeight-.1f;
		else if (this.p.y<-Maingame.GI.cam.viewportHeight/2+Maingame.GI.cam.this.p.y)
			this.p.y+=Maingame.GI.cam.viewportHeight-.1f;
*/
		var b = player.body.GetPosition();
		if (this.p.x < b.x*scale-c.width/2)
			this.p.x+=c.width;
		else if (this.p.x > b.x*scale+c.width/2)
			this.p.x-=c.width;
		if (this.p.y < b.y*scale-c.height/2)
			this.p.y+=c.height;
		else if (this.p.y > b.y*scale+c.height/2)
			this.p.y-=c.height;
		
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
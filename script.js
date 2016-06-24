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

var ishipbase, iturret, itractorbeam, istar, ibeam, isplitter, iheavy, igatling, imissile;
var gos;
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
	mouse = {x : 0, y : 0, get : function(){
		return {x:this.x - cam.pos.x, y:this.y - cam.pos.y};
	}};

	world = new b2World(new b2Vec2(0,0),false);
	activatedebug();

	gos = [];
	player = new Player();

	dostars();

	window.onresize = function(){dostars();}
	window.onclick = function(){player.shoot();}

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
	setInterval(gameloop,1000/60);
}
function dostars(){
	document.getElementById("canvas").width = window.innerWidth-250;
	document.getElementById("canvas").height = document.documentElement.clientHeight-20;
	stars = [];
	for (var i = 0; i < c.width*c.height/3000; i++)
		stars.push(new Star());
}
function activatedebug(){
	var debugDraw = new b2DebugDraw();
	debugDraw.SetSprite(ctx);
	debugDraw.SetDrawScale(scale);
	debugDraw.SetFillAlpha(0.3);
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
	for (var i = 0; i < stars.length; i++)
		stars[i].render();
	/*
	ros = [];
	for (var j = -2; j <= 0; j++)
		for (var i = 0; i < gos.length; i++)
			if (gos[i].rl===j)
				ros.push(gos[i]);
	for (var i = 0; i < ros.length; i++)
		ros[i].render();
	*/
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
function dynamicdraw(img, x, y, angle, scal, centerx, centery, offcent){


	centerx*=scal;
	centery*=scal;
	//x/=scale;
	//y/=scale;
	ctx.translate(x,y);
	if (offcent)
	ctx.translate(centerx,centery);
	ctx.rotate(angle+Math.PI/2);
	if (offcent)
	ctx.translate(-centerx,-centery);
	if (offcent)
	ctx.drawImage(img,0,0,img.width*scal,img.height*scal);
	else 
	ctx.drawImage(img,-img.width/2,-img.height/2,img.width*scal,img.height*scal);
	if (offcent)
	ctx.translate(centerx,centery);
	ctx.rotate(-angle-Math.PI/2);
	if (offcent)
	ctx.translate(-centerx,-centery);
	ctx.translate(-x,-y);



	/*centerx*=scal;
	centery*=scal;
	ctx.translate(x+centerx,y+centery);
	ctx.rotate(angle+Math.PI/2);
	ctx.translate(-centerx,-centery);
	ctx.drawImage(img,0,0,img.width*scal,img.height*scal);
	ctx.translate(x+centerx,y+centery);
	ctx.rotate(-angle-Math.PI/2);
	ctx.translate(-x-centerx,-y-centery);*/
}
function loadGraphics(){
	ishipbase    = new Image();
	iturret      = new Image();
	itractorbeam = new Image();
	istar        = new Image();
	ibeam        = new Image();
	isplitter    = new Image();
	iheavy       = new Image();
	igatling     = new Image();
	imissile     = new Image();

	ishipbase.src    = "assets/ShipBase.png";
	iturret.src      = "assets/Turret.png";
	itractorbeam.src = "assets/TractorBeam.png";
	istar.src        = "assets/Star.png";
	ibeam.src        = "assets/BeamIcon.png";
	isplitter.src    = "assets/SplitterIcon.png";
	iheavy.src       = "assets/HeavyIcon.png";
	igatling.src     = "assets/GatlingIcon.png";
	imissile.src     = "assets/MissileIcon.png";
}
function squarebody(size,x,y,sensor){
	var fixDef = new b2FixtureDef;
	fixDef.density = .5;
	fixDef.friction = 0.4;
	fixDef.restitution = 0.2;
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_dynamicBody;
	fixDef.shape = new b2PolygonShape;
	fixDef.shape.SetAsBox(size, size);
	fixDef.isSensor = true;
	bodyDef.position.Set(x, y);
	var body = world.CreateBody(bodyDef);
	body.CreateFixture(fixDef);
	body.SetFixedRotation(true);
	return body;
}
function circlebody(size,x,y,sensor){
	var fixDef = new b2FixtureDef;
	fixDef.density = .5;
	fixDef.friction = 0.4;
	fixDef.restitution = 0.2;
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_dynamicBody;
	fixDef.shape = new b2CircleShape(size);
	fixDef.isSensor = true;
	bodyDef.position.Set(x, y);
	var body = world.CreateBody(bodyDef);
	body.CreateFixture(fixDef);
	body.SetFixedRotation(true);
	return body;	
}
function Player(){
	this.body = squarebody(1,0,0,true);
	this.rl = 0;
	this.speed = 10;
	this.m = {w : false, a : false, s : false, d : false};
	this.p = {x : 0, y : 0};
	this.aim = new b2Vec2(mouse.get().y-this.p.y*scale,mouse.get().x-this.p.x*scale);
	this.angle = Math.atan2(this.aim.x,this.aim.y);
	this.arsenal = [new pBeam()];//,new pSplitter(),new pHeavy(),new pGatling(),new pMissile()];
	this.curwep = this.arsenal[0];
	gos.push(this);
	this.shoot = function(){
		this.curwep.spawn();
	}
	this.update = function(){
		
		var bpos = this.body.GetPosition();
		this.p = {x : bpos.x, y : bpos.y};
		if (this.m.w && !this.m.s)
			this.body.ApplyImpulse(new b2Vec2(0,-this.speed/10), this.body.GetLocalCenter());
		if (!this.m.w && this.m.s)
			this.body.ApplyImpulse(new b2Vec2(0,this.speed/10), this.body.GetLocalCenter());
		if (this.m.a && !this.m.d)
			this.body.ApplyImpulse(new b2Vec2(-this.speed/10,0), this.body.GetLocalCenter());
		if (!this.m.a && this.m.d)
			this.body.ApplyImpulse(new b2Vec2(this.speed/10,0), this.body.GetLocalCenter());

		if (this.body.GetLinearVelocity().Length() > this.speed){
			var v = this.body.GetLinearVelocity();
			v.Normalize();
			v.Multiply(this.speed);
			this.body.SetLinearVelocity(v);
		}
		this.aim = new b2Vec2(mouse.get().x-this.p.x*scale,mouse.get().y-this.p.y*scale);
		this.angle = Math.atan2(this.aim.y,this.aim.x);
		//this.angle = Math.atan2(mouse.get().y-this.p.y*scale,mouse.get().x-this.p.x*scale);
	}
	this.render = function(){
		dynamicdraw(ishipbase,this.body.GetPosition().x*scale,this.body.GetPosition().y*scale,0,1);
		dynamicdraw(iturret,this.body.GetPosition().x*scale,this.body.GetPosition().y*scale,this.angle,1);

		if (this.m.w)	dynamicdraw(itractorbeam,this.body.GetPosition().x*scale,this.body.GetPosition().y*scale,Math.PI,1);
		if (this.m.a)	dynamicdraw(itractorbeam,this.body.GetPosition().x*scale,this.body.GetPosition().y*scale,Math.PI/2,1);
		if (this.m.s)	dynamicdraw(itractorbeam,this.body.GetPosition().x*scale,this.body.GetPosition().y*scale,0,1);
		if (this.m.d)	dynamicdraw(itractorbeam,this.body.GetPosition().x*scale,this.body.GetPosition().y*scale,Math.PI/-2,1);
	}
}
function pBeam(){
	this.damage = 3;
	this.range = 25;
	this.speed = 25;
	this.rl = -1;
	this.body = null;
	this.spawn = function(){
		var b = new pBeam();
		b.makebody();
		var a = player.aim.Copy();
		a.Normalize();
		a.Multiply(this.speed);
		b.body.SetLinearVelocity(a);
		gos.push(b);
	}
	this.makebody = function(){
		this.body = circlebody(.3,player.p.x,player.p.y,true);
	}
	this.update = function(){

	}
	this.render = function(){
		var b = this.body.GetPosition(),
			v = this.body.GetLinearVelocity();
		dynamicdraw(ibeam,(b.x-1)*scale,(b.y-1)*scale,Math.atan2(v.y,v.x),.5,ibeam.width/2,ibeam.height-ibeam.width/2,true);
	}
}
function Star(){
	this.rl = -2;
	this.p = randomonscreen();
	this.scale = Math.random()*1.5+.2;
	this.update = function(){
		var n = player.body.GetLinearVelocity().Copy();
		//n.Normalize();
		n.Multiply(this.scale*.8);
		this.p.Subtract(n);
		/*
		if (player.m.w)
			this.p.y-=this.scale*-5;
		if (player.m.a)
			this.p.x-=this.scale*-5;
		if (player.m.s)
			this.p.y+=this.scale*-5;
		if (player.m.d)
			this.p.x+=this.scale*-5;
	*/
		this.keeponscreen();
	}
	this.render = function(){
		dynamicdraw(istar,this.p.x,this.p.y,0,this.scale*.75);
	}
	this.keeponscreen = function(){
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
	return new b2Vec2(Math.random()*c.width-c.width/2, Math.random()*c.height-c.height/2);
	//return {x : Math.random()*c.width-c.width/2, y : Math.random()*c.height-c.height/2};
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

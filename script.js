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
var gos, cntrs;
var c, ctx;
var mouse;
var world;
var player;
var stars;
var cam;
var scale = 32;
var viewscale = 1, viewslot = 4;
var devtools;

function init(){
	devtools = new setdevtools();

	loadGraphics();
	cam = new CamMan();
	c = document.getElementById("canvas");
	ctx = c.getContext("2d");

	world = new b2World(new b2Vec2(0,0),false);
	activatedebug();

	gos = [];
	cntrs = [];
	player = new Player();

	resizewin();

	window.onresize = function(){resizewin();}
	window.onmousedown = function(){player.tryshoot = true;}
	window.onmouseup = function(){player.tryshoot = false;}

	document.getElementById("info").innerHTML+="<div id=\"zoom\">1.0x</div>";

	mouse = {
		x: 0,
		y: 0,
		get : function(){return {x:(this.x - cam.pos.x)/viewscale/scale, y:(this.y - cam.pos.y)/viewscale/scale};},
	};
	document.getElementById("canvas").addEventListener('mousemove',function(evt){
		var rect = c.getBoundingClientRect();
		mouse.x = evt.clientX - rect.left;
		mouse.y = evt.clientY - rect.top;
	});
	document.getElementById("canvas").addEventListener('drag',function(evt){
		var rect = c.getBoundingClientRect();
		mouse.x = evt.clientX - rect.left;
		mouse.y = evt.clientY - rect.top;
	});

	document.addEventListener('keydown', function(event) {
		switch(event.keyCode){
			case 87:	player.m.w = true;	break;
			case 65:	player.m.a = true;	break;
			case 83:	player.m.s = true;	break;
			case 68:	player.m.d = true;	break;
			case 187:	zoom(1);		break;
			case 189:	zoom(-1);		break;
		}
	});
	document.addEventListener('keyup', function(event) {
		switch(event.keyCode){
			case 87:	player.m.w = false;	break;
			case 65:	player.m.a = false;	break;
			case 83:	player.m.s = false;	break;
			case 68:	player.m.d = false;	break;
		}
	});
	setInterval(gameloop,1000/60);
}
function setdevtools(){
	this.b2debug = false;
	this.imgbox = false;
}
function zoom(dir){
	var sets = [.25,.35,.5,.75,1,1.25,1.75,2.25,3,3.5,4.5];
	if (viewslot+dir >= 0 && viewslot+dir <= 10){
		viewslot+=dir;
		viewscale = sets[viewslot];
		document.getElementById("zoom").innerHTML = viewscale+"x zoom";
		dostars();
	}
}
function resizewin(){
	document.getElementById("canvas").width = window.innerWidth-250;
	document.getElementById("canvas").height = document.documentElement.clientHeight-20;
	dostars();
}
function dostars(){
	stars = [];
	for (var i = 0; i < c.width*c.height/3000/viewscale; i++)
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
	for (var i = 0; i < cntrs.length; i++)
		cntrs[i].update();
	for (var i = 0; i < stars.length; i++)
		stars[i].update();
	for (var i = 0; i < gos.length; i++)
		gos[i].update();
}
function render(){
	ctx.clearRect(0,0,c.width,c.height);
	ctx.save();
	cam.step();
	ctx.scale(viewscale,viewscale);
	if (devtools.b2debug)
		world.DrawDebugData();
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
		this.pos.x = -v.x * scale * viewscale + c.width/2;
		this.pos.y = -v.y * scale * viewscale + c.height/2;
		ctx.translate(this.pos.x, this.pos.y);
	};
}
function dynamicdraw(img, x, y, a, scal, cx, cy, offcent){
	if (!offcent){
		cx = img.width/2;
		cy = img.height/2;}
	cx*=scal;
	cy*=scal;
	x*=scale;
	y*=scale;
	a+=Math.PI/2;

	ctx.save();
	ctx.translate(x,y);
	ctx.rotate(a);
	ctx.translate(-cx,-cy);
	ctx.drawImage(img,0,0,img.width*scal,img.height*scal);
	if (devtools.imgbox)
		ctx.fillRect(0,0,img.width*scal,img.height*scal);
	ctx.restore();
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
	this.aim = new b2Vec2(0,1);
	this.angle = Math.atan2(this.aim.x,this.aim.y);
	this.arsenal = [new pBeam()];//,new pSplitter(),new pHeavy(),new pGatling(),new pMissile()];
	this.curwep = this.arsenal[0];
	gos.push(this);
	this.shoot = function(){
		this.curwep.spawn();
		this.curwep.rate.consume();
	}
	this.update = function(){
		
		if (this.tryshoot&&this.curwep.rate.ready)
			this.shoot();

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
		this.aim = new b2Vec2(mouse.get().x-this.p.x,mouse.get().y-this.p.y);
		this.angle = Math.atan2(this.aim.y,this.aim.x);		
	}
	this.render = function(){
		dynamicdraw(ishipbase,this.p.x,this.p.y,0,1);
		dynamicdraw(iturret,this.p.x,this.p.y,this.angle,1);

		if (this.m.w)	dynamicdraw(itractorbeam,this.body.GetPosition().x,this.body.GetPosition().y,Math.PI,1);
		if (this.m.a)	dynamicdraw(itractorbeam,this.body.GetPosition().x,this.body.GetPosition().y,Math.PI/2,1);
		if (this.m.s)	dynamicdraw(itractorbeam,this.body.GetPosition().x,this.body.GetPosition().y,0,1);
		if (this.m.d)	dynamicdraw(itractorbeam,this.body.GetPosition().x,this.body.GetPosition().y,Math.PI/-2,1);
	}
}
function Counter(len){
	this.len = len;
	this.count = 0;
	this.incr = 1;
	this.loop = false;
	this.running = false;
	this.ready = false;
	this.inprog = false;
	this.progress = 0;
	cntrs.push(this);
	this.update = function(){
		if (this.count < this.len && this.running){
			this.ready = false;
			this.count+=this.incr;
			this.inprog = true;
		}
		else {this.inprog = false;this.ready = true;}
		this.progress = this.count/this.len;
	}
	this.start = function(){
		this.running = true;
	}
	this.reset = function(){
		this.count = 0;
	}
	this.consume = function(){
		this.ready = false;
		this.reset();
		if (!this.loop)
			this.running = false;
	}
}
function pBeam(){
	this.damage = 3;
	this.range = 45;
	this.dt = 0;
	this.speed = 35;
	this.rl = -1;
	this.body = null;
	this.rate = new Counter(25);
	this.rate.loop = true;
	this.rate.count = 25;
	this.rate.running = true;
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
		var a = player.aim.Copy();
		a.Normalize();
		this.body = circlebody(ibeam.width/4/scale,player.p.x+a.x,player.p.y+a.y,true);
	}
	this.update = function(){
		this.dt+=this.body.GetLinearVelocity().Length()/50;
		if (this.dt > this.range)
			this.dispose();
	}
	this.render = function(){
		var b = this.body.GetPosition(),
			v = this.body.GetLinearVelocity();
		dynamicdraw(ibeam,(b.x),(b.y),Math.atan2(v.y,v.x),.5,ibeam.width/2,ibeam.width/2,true);
	}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		world.DestroyBody(this.body);
	}
}
function Star(){
	this.rl = -2;
	this.p = randomonscreen();
	this.scale = Math.random()*1.5+.2;
	this.update = function(){
		var n = player.body.GetLinearVelocity().Copy();
		n.Multiply(this.scale/scale);
		this.p.Subtract(n);
		this.keeponscreen();
	}
	this.render = function(){
		dynamicdraw(istar,this.p.x,this.p.y,0,this.scale*.75);
	}
	this.keeponscreen = function(){
		var b = player.body.GetPosition(),
		w = c.width/scale/viewscale,
		h = c.height/scale/viewscale;
		if (this.p.x < b.x-w/2)
			this.p.x+=w;
		else if (this.p.x > b.x+w/2)
			this.p.x-=w;
		if (this.p.y < b.y-h/2)
			this.p.y+=h;
		else if (this.p.y > b.y+h/2)
			this.p.y-=h;
	}
}
function randomonscreen(){
	return new b2Vec2((Math.random()*c.width-c.width/2)/scale/viewscale, (Math.random()*c.height-c.height/2)/scale/viewscale);
}
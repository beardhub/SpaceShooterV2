var b2Vec2 = Box2D.Common.Math.b2Vec2,
	b2BodyDef = Box2D.Dynamics.b2BodyDef,
	b2Body = Box2D.Dynamics.b2Body,
	b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
	b2Fixture = Box2D.Dynamics.b2Fixture,
	b2World = Box2D.Dynamics.b2World,
	b2MassData = Box2D.Collision.Shapes.b2MassData,
	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
	b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
	b2ContactListener = Box2D.Dynamics.b2ContactListener;

var ishipbase, iturret, itractorbeam, istar, ibeam, isplitter, iheavy, igatling, imissile, iufo, iufoeye, iaim;
var gos, counters;
var c, ctx;
var mouse;
var world;
var player;
var stars;
var cam;
var scale = 32;
var viewscale = 1, viewslot;
var devtools;
var spawner;
var temp = 0;

function init(){
	devtools = new setdevtools();

	loadGraphics();
	cam = new CamMan();
	c = document.getElementById("canvas");
	ctx = c.getContext("2d");

	world = new b2World(new b2Vec2(0,0),false);
	world.SetContactListener(MakeContactListener());
	activatedebug();

	gos = [];
	counters = [];
	player = new Player();
	spawner = new Spawner();
	
	spawner.ufo.spawn(new b2Vec2(5,5));

	resizewin();


	window.onresize = function(){resizewin();}
	window.onmousedown = function(){player.tryshoot = true;}
	window.onmouseup = function(){player.tryshoot = false;}

	document.getElementById("info").innerHTML+="<div id=\"zoom\">1x</div>";

	viewslot = -1;
	viewslot = Number(localStorage.getItem("viewslot"));

	if (viewslot == -1)	viewslot = 4;
	else zoom(0);

	mouse = {
		x: 0,
		y: 0,
		get : function(){return {x:(this.x - cam.pos.x)/viewscale/scale, y:(this.y - cam.pos.y)/viewscale/scale};},
	};
	var mousemove = function(evt){
		var rect = c.getBoundingClientRect();
		mouse.x = evt.clientX - rect.left;
		mouse.y = evt.clientY - rect.top;
	}
	document.getElementById("canvas").addEventListener('mousemove',mousemove);
	document.getElementById("canvas").addEventListener('drag',mousemove);
	/*
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
	*/
	document.addEventListener('keydown', function(event) {
		switch(event.keyCode){
			case 49:	player.switchwep(1);	break;
			case 50:	player.switchwep(2);	break;
			case 51:	player.switchwep(3);	break;
			case 52:	player.switchwep(4);	break;
			case 53:	player.switchwep(5);	break;
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
		document.getElementById("zoom").innerHTML = viewscale+"x";
		dostars();
		localStorage.setItem("viewslot",""+viewslot);
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
	//document.getElementById("zoom").innerHTML = new Date().getTime()-temp+" "+stars.length;
	//temp = new Date().getTime();
	update();
	render();
}
function update(){
	world.Step(1/60,6,2);
	for (var i = 0; i < counters.length; i++)
		counters[i].update();
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
function dynamicdraw(img, x, y, a, scalx, scaly, cx, cy, offcent){
	if (!offcent){
		cx = img.width/2;
		cy = img.height/2;}
	cx*=scalx;
	cy*=scaly;
	x*=scale;
	y*=scale;
	a+=Math.PI/2;

	ctx.save();
	ctx.translate(x,y);
	ctx.rotate(a);
	ctx.translate(-cx,-cy);
	ctx.drawImage(img,0,0,img.width*scalx,img.height*scaly);
	if (devtools.imgbox)
		ctx.fillRect(0,0,img.width*scalx,img.height*scaly);
	ctx.restore();
}
function loadGraphics(){
	ishipbase	= new Image();
	iturret		= new Image();
	itractorbeam	= new Image();
	istar		= new Image();
	ibeam		= new Image();
	isplitter	= new Image();
	iheavy		= new Image();
	igatling	= new Image();
	imissile	= new Image();
	iufo		= new Image();
	iufoeye		= new Image();

	ishipbase.src	= "assets/ShipBase.png";
	iturret.src	= "assets/Turret.png";
	itractorbeam.src= "assets/TractorBeam.png";
	istar.src	= "assets/Star.png";
	ibeam.src	= "assets/BeamIcon.png";
	isplitter.src	= "assets/SplitterIcon.png";
	iheavy.src	= "assets/HeavyIcon.png";
	igatling.src	= "assets/GatlingIcon.png";
	imissile.src	= "assets/MissileIcon.png";
	iufo.src	= "assets/UFO.png";
	iufoeye.src	= "assets/UFOEye.png";
}
function squarebody(size,x,y,sensor){
	var fixDef = new b2FixtureDef;
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
function MakeContactListener(){
	var list = new b2ContactListener();
	list.BeginContact = function(contact) {
		var a = contact.GetFixtureA().GetBody().GetUserData();
		var b = contact.GetFixtureB().GetBody().GetUserData();
		//alert(a.categ+" "+b.categ);
		//a.collide(b);
		//b.collide(a);
	}
	list.EndContact = function(contact) {}
	list.PostSolve = function(contact, impulse) {}
	list.PreSolve = function(contact, oldManifold) {}
	return list;
}
function Player(){
	this.categ = "play";
	this.body = squarebody(1,0,0,true);
	this.rl = 0;
	this.speed = 20;
	this.accel = 2;
	this.m = {w : false, a : false, s : false, d : false};
	this.p = new b2Vec2(0,0);
	this.aim = new b2Vec2(0,1);
	this.angle = Math.atan2(this.aim.x,this.aim.y);
	this.arsenal = [new pBeam(),new pSplitter()];//,new pHeavy(),new pGatling(),new pMissile()];
	this.curwep = this.arsenal[0];
	this.body.SetUserData(this);
	gos.push(this);
	this.shoot = function(){
		this.curwep.spawn(this.getinfo());
		this.curwep.rate.consume();
	}
	this.switchwep = function(wep){
		this.curwep.rate.pause();
		wep--;
		if (wep < 0 || wep > this.arsenal.length - 1)
			return;
		this.curwep = this.arsenal[wep];
		this.curwep.rate.unpause();
	}
	this.getinfo = function(){
		return {p : this.p, a : this.aim, s : "p"};
	}
	this.collide = function(other){

	}
	this.update = function(){
		if (this.tryshoot&&this.curwep.rate.ready)
			this.shoot();

		this.p = this.body.GetPosition();

		if ( this.m.w && !this.m.s)	this.body.ApplyImpulse(new b2Vec2(	 0,	  -this.accel	),	this.body.GetLocalCenter());
		if (!this.m.w &&  this.m.s)	this.body.ApplyImpulse(new b2Vec2(	 0,	   this.accel	),	this.body.GetLocalCenter());
		if ( this.m.a && !this.m.d)	this.body.ApplyImpulse(new b2Vec2( -this.accel, 	0	),	this.body.GetLocalCenter());
		if (!this.m.a &&  this.m.d)	this.body.ApplyImpulse(new b2Vec2(  this.accel,	 	0	),	this.body.GetLocalCenter());

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
		dynamicdraw(ishipbase,this.p.x,this.p.y,0,1,1);
		dynamicdraw(iturret,this.p.x,this.p.y,this.angle,1,1);
		//dynamicdraw(iufo,this.p.x,this.p.y,0,1,1);
		//dynamicdraw(iufoeye,this.p.x,this.p.y,this.angle,1,1);

		///*
		if (this.m.w)	dynamicdraw(itractorbeam,this.p.x,this.p.y,Math.PI,1,1);
		if (this.m.a)	dynamicdraw(itractorbeam,this.p.x,this.p.y,Math.PI/2,1,1);
		if (this.m.s)	dynamicdraw(itractorbeam,this.p.x,this.p.y,0,1,1);
		if (this.m.d)	dynamicdraw(itractorbeam,this.p.x,this.p.y,Math.PI/-2,1,1);
		//*/

		//dynamicdraw(itractorbeam,this.p.x,this.p.y,Math.atan2(this.body.GetLinearVelocity().y,this.body.GetLinearVelocity().x)-Math.PI/2,1,1);
	}
}
function Enemy(){
	this.categ = "enem";
	this.body = null;//circlebody(1,0,0,true);
	this.rl = 0;
	//this.speed = 0;
	//this.p = new b2Vec2(0,0);
	//this.aim = new b2Vec2(0,1);
	//this.angle = Math.atan2(this.aim.x,this.aim.y);
	//this.arsenal = [new pBeam()];//,new pSplitter()];//,new pHeavy(),new pGatling(),new pMissile()];
	//this.curwep = this.arsenal[0];
	//this.body.SetUserData(this);
	//gos.push(this);
	this.update = function(){}
	this.render = function(){}
	this.die = function(){}
}
function Spawner(){
	this.ufo = new UFO();
}
function UFO(){
	this.speed = 7;
	this.health = 10;
	this.arsenal = [new pBeam()];
	this.curwep = this.arsenal[0];
	this.spawn = function(pos){
		var e = new Enemy();
		e.speed = this.speed;
		e.health = this.health;
		e.p = pos;
		e.aim = new b2Vec2(0,1);
		e.angle = Math.atan2(e.aim.y,e.aim.x);
		e.arsenal = this.arsenal;
		e.curwep = this.curwep;
		e.update = function(){
			if (this.health < 0)
				this.die();
			this.p = this.body.GetPosition();
			this.aim = new b2Vec2(player.p.x-this.p.x,player.p.y-this.p.y);
			this.angle = Math.atan2(this.aim.y,this.aim.x);
		}
		e.render = function(){
			dynamicdraw(iufo,this.p.x,this.p.y,0,1,1);
			dynamicdraw(iufoeye,this.p.x,this.p.y,this.angle,1,1);
		}
		e.body = circlebody(1,e.p.x,e.p.y);
		e.body.SetUserData(e);
		gos.push(e);
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
	this.paused = false;
	counters.push(this);
	this.update = function(){
		if (this.paused) return;
		if (this.count < this.len && this.running){
			this.ready = false;
			this.count+=this.incr;
			this.inprog = true;
		}
		else {this.inprog = false;this.ready = true;}
		this.progress = this.count/this.len;
	}
	this.pause = function(){
		this.paused = true;
	}
	this.unpause = function(){
		this.paused = false;
	}
	this.start = function(){
		this.running = true;
	}
	this.reset = function(){
		this.count = 0;
	}
	this.makeready = function(){
		this.count = this.len;
		this.start();
	}
	this.consume = function(){
		this.ready = false;
		this.reset();
		if (!this.loop)
			this.running = false;
	}
}
function Projectile(){
	this.categ = "proj";
	//this.img = null;
	//this.source = "";
	//this.damage = 0;
	//this.range = 0;
	this.dt = 0;
	//this.speed = 0;
	//this.pierce = 0;
	this.rl = -1;
	//this.body = null;
	this.update = function(){
		if (this.pierce < 0)
			this.lastpierce();
		this.dt+=this.body.GetLinearVelocity().Length()/60;
		if (this.dt > this.range)
			this.outofrange();
		
	}
	this.render = function(){
		var b = this.body.GetPosition(),
			v = this.body.GetLinearVelocity();
		dynamicdraw(this.img,b.x,b.y,Math.atan2(v.y,v.x),.5,.5,this.img.width/2,this.img.width/2,true);
	}
	this.collide = function(other){
		
	}
	this.lastpierce = function(){this.dispose();}
	this.outofrange = function(){this.dispose();}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		world.DestroyBody(this.body);
	}
}
function pBeam(){
	this.rate = new Counter(25);
	this.rate.loop = true;
	this.rate.makeready();
	this.spawn = function(info){
		var p = new Projectile();
		p.img = ibeam;
		p.source = info.s;
		p.damage = 3;
		p.range = 35;
		p.speed = 25;
		p.pierce = 1;
		info.a.Normalize();
		p.body = circlebody(p.img.width/scale/4,info.p.x+info.a.x,info.p.y+info.a.y,true);
		info.a.Multiply(p.speed);
		p.body.SetLinearVelocity(info.a);
		p.body.SetUserData(p);
		gos.push(p);
	}
}
function pSplitter(){
	this.rate = new Counter(35);
	this.rate.loop = true;
	this.rate.makeready();
	this.spawn = function(info){
		var p = new Projectile();
		p.img = isplitter;
		p.source = info.s;
		p.damage = 2;
		p.range = 45;
		p.speed = 25;
		p.pierce = 0;
		info.a.Normalize();
		p.body = circlebody(p.img.width/scale/4,info.p.x+info.a.x,info.p.y+info.a.y,true);
		info.a.Multiply(p.speed);
		p.body.SetLinearVelocity(info.a);
		p.body.SetUserData(p);
		gos.push(p);
	}
}
function Star(){
	this.rl = -2;
	this.p = randomonscreen();
	this.z = Math.random()*20-10;
	//this.scale = (this.z+12)/15;
	this.scale = Math.random()*1.5+.2;
	this.update = function(){
		var n = player.body.GetLinearVelocity().Copy();
		//n.Multiply(Math.pow(1.05,this.scale)/scale);
		//n.Multiply((this.scale-.3)/60/2);
		//n.Normalize();
		n.Multiply(1.5*(this.scale)/60-1/60);

		//n.Multiply(-(this.scale+.8)/60);
		//n.Multiply(-(.8+this.scale)/60);
		//n.Multiply(Math.pow(1.15,this.z)/scale/4);
		//n.Multiply((1.7-this.scale)/-scale);
		this.p.Subtract(n);
		this.keeponscreen();
	}
	this.render = function(){
		//ctx.drawImage(istar,0,0,this.scale*.75,this.scale*.75);
		ctx.drawImage(istar,this.p.x*scale,this.p.y*scale,this.scale*.75*istar.width,this.scale*.75*istar.height);
		//dynamicdraw(istar,this.p.x,this.p.y,0,this.scale*.75,this.scale*.75);
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
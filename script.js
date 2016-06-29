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

var ishipbase, iturret, itractorbeam, istar, ibeam, isplitter, iheavy, igatling, iincinerator, imissile, iufo, iufoeye, iaim, ihealthbar;
var fxbeam, fxheavy, fxgatling, fxspark, fxfire, fxmissile, fxhealth, fxcoin;
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
var version = "0.7.2";

function init(){
	document.getElementById("version").innerHTML = version+"<br>";
	devtools = new setdevtools();

	loadAssets();
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
	for (var i = 0; i < 25; i++)
		spawner.spawnonscreen("ufo");

	resizewin();

	window.onresize = function(){resizewin();}
	window.onmousedown = function(){player.lclick = true;}
	window.onmouseup = function(){player.lclick = false;}

	document.getElementById("info").innerHTML+="<div id=\"zoom\">1x</div>";

	viewslot = localStorage.getItem("viewslot");

	if (!viewslot)	viewslot = 4;
	else {viewslot = Number(viewslot);zoom(0);}
	
	if (localStorage.getItem("playerweapon"))
		player.switchwep(Number(localStorage.getItem("playerweapon")));

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

	document.addEventListener('keydown', function(event) {
		switch(event.keyCode){
			case 49:case 50:case 51:case 52:case 53:
			player.switchwep(event.keyCode-48);break;
			case 87:	player.m.w = true;	break;
			case 65:	player.m.a = true;	break;
			case 83:	player.m.s = true;	break;
			case 68:	player.m.d = true;	break;
			case 32:	player.space=true;	break;
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
			case 32:	player.space=false;	break;
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
		document.getElementById("zoom").innerHTML = "Zoom: "+viewscale+"x";
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
function loadAssets(){
	ishipbase	= new Image();
	iturret		= new Image();
	itractorbeam	= new Image();
	istar		= new Image();
	ibeam		= new Image();
	isplitter	= new Image();
	iheavy		= new Image();
	igatling	= new Image();
	iincinerator	= new Image();
	imissile	= new Image();
	iufo		= new Image();
	iufoeye		= new Image();
	iaim		= new Image();
	ihealthbar	= new Image();

	ishipbase.src	= "assets/ShipBase.png";
	iturret.src	= "assets/Turret.png";
	itractorbeam.src= "assets/TractorBeam.png";
	istar.src	= "assets/Star.png";
	ibeam.src	= "assets/Beam.png";
	isplitter.src	= "assets/Splitter.png";
	iheavy.src	= "assets/Heavy.png";
	igatling.src	= "assets/Gatling.png";
	iincinerator.src	= "assets/Incinerator.png";
	imissile.src	= "assets/Missile.png";
	iufo.src	= "assets/UFO.png";
	iufoeye.src	= "assets/UFOEye.png";
	iaim.src	= "assets/Target.png";
	ihealthbar.src	= "assets/HealthBar.png";

	fxbeam		= new Howl({urls: ['assets/BeamFx.wav']});
	fxheavy		= new Howl({urls: ['assets/HeavyFx.wav']});
	fxgatling	= new Howl({urls: ['assets/GatlingFx.wav']});
	fxspark		= new Howl({urls: ['assets/SparkFx.wav']});
	fxfire		= new Howl({urls: ['assets/FireFx.wav']});
	fxfire.volume(.1);
	fxmissile	= new Howl({urls: ['assets/MissileFx.wav']});
	fxhealth	= new Howl({urls: ['assets/HealthFx.wav']});
	fxcoin		= new Howl({urls: ['assets/CoinFx.wav']});
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
		a.collide(b);
		b.collide(a);
	}
	list.EndContact = function(contact) {}
	list.PostSolve = function(contact, impulse) {}
	list.PreSolve = function(contact, oldManifold) {}
	return list;
}
function Player(){
	this.categ = "play";
	this.maxhealth = 100;
	this.health = this.maxhealth;
	this.body = squarebody(1,0,0,true);
	this.rl = 0;
	this.speed = 20;
	this.accel = 2;
	this.m = {w : false, a : false, s : false, d : false};
	this.p = new b2Vec2(0,0);
	this.aim = new b2Vec2(0,1);
	this.angle = Math.atan2(this.aim.x,this.aim.y);
	this.arsenal = [new pBeam(),new pSplitter(),new pHeavy(),new pGatling(),new pIncinerator()];//,new pMissile()];
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
		localStorage.setItem("playerweapon",""+(wep+1));
		this.curwep = this.arsenal[wep];
		this.curwep.rate.unpause();
	}
	this.getinfo = function(){
		return {p : this.p, a : this.aim, s : "p"};
	}
	this.collide = function(other){
		switch(other.categ){
			case "proj":
				if (other.source != "p")
					this.health-=other.damage;
				break;
			case "enem":
				//body damage?
				break;
		}
	}
	this.update = function(){
		this.tryshoot = this.lclick||this.space;
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
		if (this.m.w)	dynamicdraw(itractorbeam,this.p.x,this.p.y,Math.PI,1,1);
		if (this.m.a)	dynamicdraw(itractorbeam,this.p.x,this.p.y,Math.PI/2,1,1);
		if (this.m.s)	dynamicdraw(itractorbeam,this.p.x,this.p.y,0,1,1);
		if (this.m.d)	dynamicdraw(itractorbeam,this.p.x,this.p.y,Math.PI/-2,1,1);

		if (this.health>0)
			dynamicdraw(ihealthbar,this.p.x,this.p.y+1.4,Math.PI/2,this.health/this.maxhealth,1);
		//dynamicdraw(itractorbeam,this.p.x,this.p.y,Math.atan2(this.body.GetLinearVelocity().y,this.body.GetLinearVelocity().x)-Math.PI/2,1,1);
	}
}
function Enemy(){
	this.categ = "enem";
	this.body = null;
	this.rl = 0;
	this.collide = function(other){
		switch(other.categ){
			case "proj":
				if (other.source != "e")
					this.health-=other.damage;
				break;
			case "play":
				//body damage?
				break;
		}
	}
	this.update = function(){}
	this.render = function(){}
	this.die = function(){
		spawner.spawn(this.clss);
		this.dispose();
	}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		world.DestroyBody(this.body);
	}
}
function Spawner(){
	this.ufo = new UFO();
	this.spawnat = function(clss,x,y){
		switch(clss){
			case "ufo":
				this.ufo.spawn(new b2Vec2(x,y));
				break;
		}
	}
	this.spawn = function(clss){
		var x, y;
		do{
			x = (Math.random()-.5)*80*2;
			y = (Math.random()-.5)*55*2;
		}while(Math.abs(x)<76&&Math.abs(y)<52);
		x+=player.p.x;
		y+=player.p.y;
		switch(clss){
			case "ufo":
				this.ufo.spawn(new b2Vec2(x,y));
				break;
		}
	}
	this.spawnonscreen = function(clss){
		var x, y;
		x = (Math.random()-.5)*76*2;
		y = (Math.random()-.5)*52*2;
		x+=player.p.x;
		y+=player.p.y;
		this.ufo.spawn(new b2Vec2(x,y));
	}
}
function UFO(){
	this.speed = 7;
	this.maxhealth = 10;
	this.arsenal = [new pBeam()];
	this.curwep = this.arsenal[0];
	this.spawn = function(pos){
		var e = new Enemy();
		e.clss = "ufo";
		e.maxhealth = this.maxhealth;
		e.health = this.maxhealth;
		e.speed = this.speed;
		e.p = pos;
		e.aim = new b2Vec2(0,1);
		e.angle = Math.atan2(e.aim.y,e.aim.x);
		e.arsenal = this.arsenal;
		e.curwep = this.curwep;
		e.update = function(){
			if (this.health <= 0 || Math.abs(this.p.x-player.p.x)>80 || Math.abs(this.p.y-player.p.y)>55)
				this.die();
			this.p = this.body.GetPosition();
			this.aim = new b2Vec2(player.p.x-this.p.x,player.p.y-this.p.y);
			this.angle = Math.atan2(this.aim.y,this.aim.x);
		}
		e.render = function(){
			dynamicdraw(iufo,this.p.x,this.p.y,0,1,1);
			dynamicdraw(iufoeye,this.p.x,this.p.y,this.angle,1,1);
			if (this.health>0)
				dynamicdraw(ihealthbar,this.p.x,this.p.y+1.4,Math.PI/2,this.health/this.maxhealth,1);
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
function pBeam(){
	this.categ = "proj";
	this.img = ibeam;
	this.rate = new Counter(20);
	this.rate.loop = true;
	this.rate.makeready();
	this.damage = 8;
	this.range = 70;
	this.dt = 0;
	this.speed = 35;
	this.pierce = 2;
	this.rl = -1;
	this.spawn = function(info){
		var p = new pBeam();
		p.source = info.s;
		info.a.Normalize();
		p.body = circlebody(p.img.width/scale/4,info.p.x+info.a.x,info.p.y+info.a.y,true);
		info.a.Multiply(p.speed);
		p.body.SetLinearVelocity(info.a);
		p.body.SetUserData(p);
		fxbeam.play();
		gos.push(p);
	}
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
		switch(other.categ){
			case "play":
				if (this.source != "p")
					this.pierce--;
				break;
			case "enem":
				if (this.source != "e")
					this.pierce--;
				break;
		}
	}
	this.lastpierce = function(){this.dispose();}
	this.outofrange = function(){this.dispose();}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		world.DestroyBody(this.body);
	}
}
function pSplitter(){
	this.categ = "proj";
	this.img = isplitter;
	this.rate = new Counter(35);
	this.rate.loop = true;
	this.rate.makeready();
	this.damage = 2;
	this.range = 85/.7;
	this.dt = 0;
	this.speed = 35;
	this.maxbranches = 3;
	this.branches = this.maxbranches+1;
	this.nburst = 0;
	this.pierce = 0;
	this.rl = -1;
	this.spawn = function(info){
		var p = new pSplitter();
		p.range = this.range*.7;
		p.img = isplitter;
		p.source = info.s;
		p.branches = this.branches-1;
		if (p.branches == this.maxbranches)	fxbeam.play();
		info.a.Normalize();
		p.body = circlebody(p.img.width/scale/4,info.p.x+info.a.x*3,info.p.y+info.a.y*3,true);
		info.a.Multiply(p.speed);
		p.body.SetLinearVelocity(info.a);
		p.body.SetUserData(p);
		gos.push(p);
	}
	this.update = function(){
		if (this.nburst > 0)
			this.burst(this.nburst);
		if (this.pierce < 0)
			this.lastpierce();
		this.dt+=this.body.GetLinearVelocity().Length()/60;
		if (this.dt > this.range)
			this.outofrange();
		
	}
	this.render = function(){
		var b = this.body.GetPosition(),
			v = this.body.GetLinearVelocity();
		var scl = .5;
		if (this.branches==this.maxbranches) scl = 1;
		dynamicdraw(this.img,b.x,b.y,Math.atan2(v.y,v.x),scl,scl,this.img.width/2,this.img.width/2,true);
	}
	this.burst = function(count){
		var rng = this.range/.7;
		if (this.branches > 0){
			fxspark.play();
			for (var i = 0; i < count; i++){
				var t = ((Math.random()-.5)+i)*2*Math.PI/count;
				this.spawn({p : this.body.GetPosition(), a : new b2Vec2(Math.cos(t),Math.sin(t)), s : this.source});
				//this.spawn({p: this.body.GetPosition(), a:new b2Vec2(Math.cos(Math.PI*2/count*i),Math.sin(Math.PI*2/count*i)), s:this.source});
			}
			this.range*=.6;
			for (var i = 0; i < count; i++){
				var t = ((Math.random()-.5)+i)*2*Math.PI/count;
				this.spawn({p : this.body.GetPosition(), a : new b2Vec2(Math.cos(t),Math.sin(t)), s : this.source});
				//this.spawn({p: this.body.GetPosition(), a:new b2Vec2(Math.cos(Math.PI*2/count*i),Math.sin(Math.PI*2/count*i)), s:this.source});
			}
			this.range = rng*.7;
		}
		this.nburst = 0;
	}
	this.collide = function(other){
		var hit = false;
		switch(other.categ){
			case "play":
				if (this.source != "p")
					hit = true;
				break;
			case "enem":
				if (this.source != "e")
					hit = true;
				break;
		}
		if (hit){
			this.pierce--;
			if (this.pierce < 0)
				this.nburst = 12;
			else 	this.nburst = 4;
		}
	}
	this.lastpierce = function(){this.dispose();}
	this.outofrange = function(){this.dispose();}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		world.DestroyBody(this.body);
	}
}
function pHeavy(){
	this.categ = "proj";
	this.img = iheavy;
	this.rate = new Counter(85);
	this.rate.loop = true;
	this.rate.makeready();
	this.damage = 15;
	this.range = 45;
	this.dt = 0;
	this.speed = 20;
	this.pierce = 3;
	this.rl = -1;
	this.spawn = function(info){
		var p = new pHeavy();
		p.source = info.s;
		info.a.Normalize();
		info.a.Multiply(4);
		p.body = circlebody(p.img.width/scale/1.25,info.p.x+info.a.x,info.p.y+info.a.y,true);
		info.a.Multiply(p.speed/4);
		p.body.SetLinearVelocity(info.a);
		p.body.SetUserData(p);
		fxheavy.play();
		gos.push(p);
	}
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
		dynamicdraw(this.img,b.x,b.y,Math.atan2(v.y,v.x),1.5,1.5,this.img.width/2,this.img.width/2,true);
	}
	this.collide = function(other){
		switch(other.categ){
			case "play":
				if (this.source != "p")
					this.pierce--;
				break;
			case "enem":
				if (this.source != "e")
					this.pierce--;
				break;
		}
	}
	this.lastpierce = function(){this.dispose();}
	this.outofrange = function(){this.dispose();}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		world.DestroyBody(this.body);
	}
}
function pGatling(){
	this.categ = "proj";
	this.img = igatling;
	this.rate = new Counter(2);
	this.rate.loop = true;
	this.rate.makeready();
	this.damage = 2;
	this.range = 60;
	this.dt = 0;
	this.speed = 35;
	this.pierce = 0;
	this.rl = -1;
	this.spawn = function(info){
		fxgatling.play();
		var p = [new pGatling(),new pGatling()];
		for (var i = 0; i < p.length; i++){
			var info2 = info;
			p[i].source = info.s;
			var t = Math.atan2(info.a.y,info.a.x);
			t+=(Math.random()-.5)*Math.PI/180*20;
			info2.a = new b2Vec2(Math.cos(t),Math.sin(t));
			info2.a.Multiply(Math.random()/2+.75);
			p[i].body = circlebody(p[i].img.width/scale/4,info2.p.x+info2.a.x,info2.p.y+info2.a.y,true);
			info2.a.Normalize();
			info2.a.Multiply(p[i].speed);
			p[i].body.SetLinearVelocity(info2.a);
			p[i].body.SetUserData(p[i]);
			gos.push(p[i]);
		}
	}
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
		dynamicdraw(this.img,b.x,b.y,Math.atan2(v.y,v.x),1,1,this.img.width/2,this.img.width/2,true);
	}
	this.collide = function(other){
		switch(other.categ){
			case "play":
				if (this.source != "p")
					this.pierce--;
				break;
			case "enem":
				if (this.source != "e")
					this.pierce--;
				break;
		}
	}
	this.lastpierce = function(){this.dispose();}
	this.outofrange = function(){this.dispose();}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		world.DestroyBody(this.body);
	}
}
function pIncinerator(){
	this.categ = "proj";
	this.img = iincinerator;
	this.rate = new Counter(1);
	this.rate.loop = true;
	this.rate.makeready();
	this.damage = 1;
	this.range = 20;
	this.dt = 0;
	this.speed = 40;
	this.pierce = 1;
	this.rl = -1;
	this.spawn = function(info){
		fxfire.play();
		var p = [new pIncinerator(),new pIncinerator(),new pIncinerator(),new pIncinerator()];
		for (var i = 0; i < p.length; i++){
			var info2 = info;
			p[i].source = info.s;
			var t = Math.atan2(info.a.y,info.a.x);
			t+=(Math.random()-.5)*Math.PI/180*10;
			info2.a = new b2Vec2(Math.cos(t),Math.sin(t));
			info2.a.Multiply(Math.random()/2+.75);
			p[i].body = circlebody(p[i].img.width/scale/4,info2.p.x+info2.a.x,info2.p.y+info2.a.y,true);
			info2.a.Normalize();
			info2.a.Multiply(p[i].speed);
			p[i].body.SetLinearVelocity(info2.a);
			p[i].body.SetUserData(p[i]);
			gos.push(p[i]);
		}
	}
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
		dynamicdraw(this.img,b.x,b.y,Math.atan2(v.y,v.x),1,1,this.img.width/2,this.img.width/2,true);
	}
	this.collide = function(other){
		switch(other.categ){
			case "play":
				if (this.source != "p")
					this.pierce--;
				break;
			case "enem":
				if (this.source != "e")
					this.pierce--;
				break;
		}
	}
	this.lastpierce = function(){this.dispose();}
	this.outofrange = function(){this.dispose();}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		world.DestroyBody(this.body);
	}
}
function Star(){
	this.rl = -2;
	this.p = randomonscreen();
	this.z = Math.random()*20-10;
	this.scale = Math.random()*1.5+.2;
	this.update = function(){
		var n = player.body.GetLinearVelocity().Copy();
		n.Multiply((1.5*(this.scale)-1)/60);
		this.p.Subtract(n);
		this.keeponscreen();
	}
	this.render = function(){
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
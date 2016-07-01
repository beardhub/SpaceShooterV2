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
var gos, counters, buttons;
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
var lastT, delta;
var bounds;
var mute, paused;
var boxes;
var omega = false, omegaunlock = "";
var version = "0.7.4.9";

function init(){
	document.getElementById("version").innerHTML = "Version:<br>"+version+"<br>";
	document.getElementById("controls").innerHTML = 
		"Controls:<br>"+
		"W, A, S, D to move<br>"+
		"Mouse to aim<br>"+
		"Spacebar to shoot<br>"+
		"Switching Weapons:<br>"+
		"1 - Beam<br>"+
		"2 - Splitter<br>"+
		"3 - Heavy<br>"+
		"4 - Gatling<br>"+
		"5 - Incinerator<br>"+
		"Enter thesupersecretcode<br>to activate Omega weapons!<br>"+
		"+ - to zoom in and out";
	devtools = new setdevtools();

	loadAssets();
	cam = new CamMan();
	c = document.getElementById("canvas");
	ctx = c.getContext("2d");

	lastT = new Date().getTime();
	delta = 0;

	resizewin();

	world = new b2World(new b2Vec2(0,0),false);
	world.SetContactListener(MakeContactListener());
	activatedebug();

	var om = Number(localStorage.getItem("omega"));
	omega = om > 0;

	gos = [];
	counters = [];
	buttons = [];

	player = new Player();
	spawner = new Spawner();
	for (var i = 0; i < 105; i++)
		spawner.spawnonscreen("ufo");

	if (localStorage.getItem("omegaunlocked")){
	new Button("Activate Omega",bounds.hr.x+bounds.hr.w/2,bounds.hr.y+140,200,30,toggleomega)
		.apply({id:"omegatoggle"});//function(){this.id = "omegatoggle";alert(this.id);});//alert(bb.id);
	toggleomega();toggleomega();}


	new Button("Pause",bounds.hr.x+bounds.hr.w/2,bounds.hr.y+35,200,30,function(){
			paused = !paused;
			if (paused) this.label = "Unpause";
			else this.label = "Pause";
		});
	new Button("Mute",bounds.hr.x+bounds.hr.w/2,bounds.hr.y+70,200,30,function(){
			mute = !mute;
			if (mute) this.label = "Unmute";
			else this.label = "Mute";
		});
	new Button("Reset All",bounds.hr.x+bounds.hr.w/2,bounds.hr.y+105,200,30,function(){localStorage.clear();location.reload();});

	mute = false;
	paused = false;


	window.onresize = function(){resizewin();}
	window.onmousedown = checkbuttons;
	//window.onmouseup = function(){player.lclick = false;}

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
		getscreen : function(){return {x:this.x,y:this.y};}
	};
	var mousemove = function(evt){
		var rect = c.getBoundingClientRect();
		mouse.x = evt.clientX - rect.left;
		mouse.y = evt.clientY - rect.top;
	}
	document.getElementById("canvas").addEventListener('mousemove',mousemove);
	document.getElementById("canvas").addEventListener('drag',mousemove);

	document.addEventListener('keydown', function(event) {
		if (paused) return;
		var code = "thesupersecretcode";
		if (omega) code = "turnoff";
		omegaunlock+=getletter(event.keyCode);
		if (code.indexOf(omegaunlock)!==0)omegaunlock = "";
		if (omegaunlock == code && !(localStorage.getItem("omegaunlocked"))) unlockomega();
		switch(event.keyCode){
			case 49:case 50:case 51:case 52:case 53:
			if(!paused)player.switchwep(event.keyCode-48);break;
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
function getletter(keycode){
	keycode-=65;
	var alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
	return alphabet[keycode];
}
function checkbuttons(){
	var m = mouse.getscreen();

	for (var i = 0; i < buttons.length; i++)
		if (buttons[i].isover(m.x,m.y))
			buttons[i].onclick();
}
function Button(label, x, y, w, h, onclick){
	this.label = label;
	this.x = x-w/2;
	this.y = y-h/2;
	this.w = w;
	this.h = h;
	this.id = "";
	this.onclick = onclick;
	this.apply = function(vars){
		if (vars.label)	this.label = vars.label;
		if (vars.id)	this.id = vars.id;
		if (vars.render)this.render = vars.render;
	}
	this.render = function(){
		if (this.isover(mouse.x,mouse.y))
			ctx.fillStyle = "white";
		else
			ctx.fillStyle = "grey";
		ctx.globalAlpha=0.5;
		ctx.fillRect(this.x,this.y,this.w,this.h);
		ctx.globalAlpha=1;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.font = "20px Arial";
		ctx.fillStyle = "black";
		ctx.fillText(this.label,this.x+this.w/2,this.y+this.h/2);
	}
	this.isover = function(x, y){
		return x >= this.x && x <= this.x+this.w && y >= this.y && y <= this.y+this.h;}
	buttons.push(this);
}
function getbutton(id){
	for (var i = 0; i < buttons.length; i++)
		if (buttons[i].id == id)
			return buttons[i];
}
function unlockomega(){
	if (!omega) alert("Omega weapons unlocked. Beware of lag when using.");
	localStorage.setItem("omegaunlocked",true);
	new Button("Activate Omega",bounds.hr.x+bounds.hr.w/2,bounds.hr.y+140,200,30,toggleomega)
		.apply({id:"omegatoggle"});
}
function toggleomega(){
	omega = !omega;
	if (omega){
		localStorage.setItem("omega",1);
		getbutton("omegatoggle").label = "Deactivate Omega";}
	else{
		localStorage.setItem("omega",-1);
		getbutton("omegatoggle").label = "Activate Omega";}
	for (var i = 0; i < player.arsenal.length; i++)
		player.arsenal[i].dispose();
	player.arsenal = [new pBeam(),new pSplitter(),new pHeavy(),new pGatling(),new pIncinerator()];
	player.switchwep(Number(localStorage.getItem("playerweapon")));
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
	var tb = {w:c.width,h:c.height};
	bounds = {g:{x:0,	y:0,		w:tb.w*4/5,	h:tb.h-tb.w*1/5},
		 hb:{x:0,	y:tb.h-tb.w*1/5,w:tb.w*4/5,	h:tb.w*1/5},
		 hr:{x:tb.w*4/5,y:0,		w:tb.w*1/5,	h:tb.h-tb.w*1/5},
		 hbr:{x:tb.w*4/5,y:tb.h-tb.w*1/5,w:tb.w*1/5,h:tb.w*1/5}};
	dostars();
}
function dostars(){
	stars = [];
	for (var i = 0; i < bounds.g.w*bounds.g.h/3000/viewscale; i++)
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
	if (!paused)
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
	if (paused){
		ctx.fillStyle = "grey";
		ctx.globalAlpha=0.5;
		ctx.fillRect(0,0,c.width,c.height);
		ctx.globalAlpha=1;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.font = "30px Arial";
		ctx.fillStyle = "white";
		ctx.fillText("Paused",bounds.g.w/2,bounds.g.h/2);
		ctx.font = "31px Arial";
		ctx.fillStyle = "black";
		ctx.strokeText("Paused",bounds.g.w/2,bounds.g.h/2);
	}
	ctx.clearRect(bounds.hb.x,bounds.hb.y,bounds.hb.w,bounds.hb.h);
	ctx.clearRect(bounds.hr.x,bounds.hr.y,bounds.hr.w,bounds.hr.h);
	ctx.clearRect(bounds.hbr.x,bounds.hbr.y,bounds.hbr.w,bounds.hbr.h);
	for (var i = 0; i < buttons.length; i++)
		buttons[i].render();
}
function CamMan() {
	this.pos = {
		x : 0,
		y : 0
	};
	this.step = function() {
		var v = player.p;
		this.pos.x = -v.x * scale * viewscale + bounds.g.w/2;
		this.pos.y = -v.y * scale * viewscale + bounds.g.h/2;
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
	localStorage.setItem("playerweapon",""+1);
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
				if (other.source !== "p")
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
				if (other.source !== "e")
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
			x = (Math.random()-.5)*100*2;
			y = (Math.random()-.5)*80*2;
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
		x = (Math.random()-.5)*100*2;
		y = (Math.random()-.5)*80*2;
		x+=player.p.x;
		y+=player.p.y;
		this.ufo.spawn(new b2Vec2(x,y));
	}
}
function UFO(){
	this.categ = "enem";
	this.clss = "ufo";
	this.speed = 7;
	this.maxhealth = 10;
	this.health = this.maxhealth;
	this.rl = 0;
	this.arsenal = [new pBeam()];
	this.curwep = this.arsenal[0];
	this.collide = function(other){
		switch(other.categ){
			case "proj":
				if (other.source !== "e")
					this.health-=other.damage;
				break;
			case "play":
				//body damage?
				break;
		}
	}
	this.spawn = function(pos){
		var u = new UFO();
		u.p = pos;
		u.aim = new b2Vec2(0,1);
		u.angle = Math.atan2(u.aim.y,u.aim.x);
		
		u.body = circlebody(1,u.p.x,u.p.y);
		u.body.SetUserData(u);
		gos.push(u);
	}
	this.update = function(){
		if (this.health <= 0 || Math.abs(this.p.x-player.p.x)>100 || Math.abs(this.p.y-player.p.y)>80)
			this.die();
		this.p = this.body.GetPosition();
		this.aim = new b2Vec2(player.p.x-this.p.x,player.p.y-this.p.y);
		this.angle = Math.atan2(this.aim.y,this.aim.x);
	}
	this.render = function(){
		dynamicdraw(iufo,this.p.x,this.p.y,0,1,1);
		dynamicdraw(iufoeye,this.p.x,this.p.y,this.angle,1,1);
		if (this.health>0)
			dynamicdraw(ihealthbar,this.p.x,this.p.y+1.4,Math.PI/2,this.health/this.maxhealth,1);
	}
	this.die = function(){
		spawner.spawn(this.clss);
		this.dispose();
	}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		world.DestroyBody(this.body);
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
	this.dispose = function(){
		counters.splice(counters.indexOf(this),1);
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
	if (omega){
		this.rate = new Counter(10);
		this.rate.loop = true;
		this.rate.makeready();
		this.damage = 10;
		this.range = 150;
		this.dt = 0;
		this.speed = 50;
		this.pierce = 5;
	}
	this.spawn = function(info){
		if (omega){
			var p = [new pBeam(),new pBeam(),new pBeam(),new pBeam(),new pBeam(),new pBeam(),new pBeam(),new pBeam(),new pBeam(),new pBeam(),
				new pBeam(),new pBeam(),new pBeam(),new pBeam(),new pBeam(),new pBeam(),new pBeam(),new pBeam(),new pBeam()];
			for (var i = 0; i < p.length; i++){
				var info2 = {p:info.p,a:info.a,s:info.s};
				p[i].source = info2.s;
				var t = Math.atan2(info2.a.y,info2.a.x);
				t+=(i-p.length/2)*Math.PI/4/p.length;
				info2.a = new b2Vec2(Math.cos(t),Math.sin(t));
				p[i].body = circlebody(p[i].img.width/scale/4,info2.p.x+info2.a.x,info2.p.y+info2.a.y,true);
				info2.a.Multiply(p[i].speed);
				p[i].body.SetLinearVelocity(info2.a);
				p[i].body.SetUserData(p[i]);
				gos.push(p[i]);
				t = 0;t0=0;
			}
			if (!mute) fxbeam.play();
		}
		else{
			var p = new pBeam();
			p.source = info.s;
			info.a.Normalize();
			p.body = circlebody(p.img.width/scale/4,info.p.x+info.a.x,info.p.y+info.a.y,true);
			info.a.Multiply(p.speed);
			p.body.SetLinearVelocity(info.a);
			p.body.SetUserData(p);
			if (!mute) fxbeam.play();
			gos.push(p);
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
		dynamicdraw(this.img,b.x,b.y,Math.atan2(v.y,v.x),.5,.5,this.img.width/2,this.img.width/2,true);
	}
	this.collide = function(other){
		switch(other.categ){
			case "play":
				if (this.source !== "p")
					this.pierce--;
				break;
			case "enem":
				if (this.source !== "e")
					this.pierce--;
				break;
		}
	}
	this.lastpierce = function(){this.dispose();}
	this.outofrange = function(){this.dispose();}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		if (this.body)
		world.DestroyBody(this.body);
		this.rate.dispose();
	}
}
function pSplitter(){
	this.categ = "proj";
	this.img = isplitter;
	this.rate = new Counter(35);
	this.rate.loop = true;
	this.rate.makeready();
	this.damage = 2;
	this.range = 65;
	this.dt = 0;
	this.speed = 35;
	this.maxbranches = 3;
	this.branches = this.maxbranches+1;
	this.children = 6;
	this.nburst = 0;
	this.pierce = 0;
	this.rl = -1;
	if (omega){
		this.rate = new Counter(15);
		this.rate.loop = true;
		this.rate.makeready();
		this.damage = 4;
		this.range = 100;
		this.dt = 0;
		this.speed = 50;
		this.maxbranches = 5;
		this.branches = this.maxbranches+1;
		this.children = 25;
		this.pierce = 3;
	}
	this.spawn = function(info){
		var p = new pSplitter();
		p.source = info.s;
		p.branches = this.branches-1;
		if (p.branches == this.maxbranches && !mute)	fxbeam.play();
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
		if (this.branches > 0){
			if (!mute) fxspark.play();
			for (var i = 0; i < count; i++){
				var t = ((Math.random()-.5)+i)*2*Math.PI/count;
				this.spawn({p : this.body.GetPosition(), a : new b2Vec2(Math.cos(t),Math.sin(t)), s : this.source});
			}
			if (!omega)
			this.range*=.6;
			for (var i = 0; i < count; i++){
				var t = ((Math.random()-.5)+i)*2*Math.PI/count;
				this.spawn({p : this.body.GetPosition(), a : new b2Vec2(Math.cos(t),Math.sin(t)), s : this.source});
			}
		}
		this.nburst = 0;
	}
	this.collide = function(other){
		var hit = false;
		switch(other.categ){
			case "play":
				if (this.source !== "p")
					hit = true;
				break;
			case "enem":
				if (this.source !== "e")
					hit = true;
				break;
		}
		if (hit){
			this.pierce--;
			if (this.pierce < 0)
				this.nburst = this.children;
			else 	this.nburst = this.children/3;
		}
	}
	this.lastpierce = function(){this.dispose();}
	this.outofrange = function(){this.dispose();}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		if (this.body)
		world.DestroyBody(this.body);
		this.rate.dispose();
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
	if (omega){
		this.rate = new Counter(45);
		this.rate.loop = true;
		this.rate.makeready();
		this.range = 150/.7;
		this.dt = 0;
		this.speed = 45;
		this.pierce = 15;
	}
	this.spawn = function(info){
		var p = new pHeavy();
		p.source = info.s;
		info.a.Normalize();
		info.a.Multiply(4);
		if (omega){
			p.body = circlebody(p.img.width/scale*8,info.p.x+info.a.x,info.p.y+info.a.y,true);
			info.a.Multiply(p.speed/4);
			p.body.SetLinearVelocity(info.a);
			p.body.SetUserData(p);
		}
		else {
			p.body = circlebody(p.img.width/scale/1.25,info.p.x+info.a.x,info.p.y+info.a.y,true);
			info.a.Multiply(p.speed/4);
			p.body.SetLinearVelocity(info.a);
			p.body.SetUserData(p);
		}
		if (!mute) fxheavy.play();
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
		if (omega)
			dynamicdraw(this.img,b.x,b.y,Math.atan2(v.y,v.x),7,7,this.img.width/2,this.img.width/2,true);
		else dynamicdraw(this.img,b.x,b.y,Math.atan2(v.y,v.x),1.5,1.5,this.img.width/2,this.img.width/2,true);
	}
	this.collide = function(other){
		switch(other.categ){
			case "play":
				if (this.source !== "p")
					this.pierce--;
				break;
			case "enem":
				if (this.source !== "e")
					this.pierce--;
				break;
		}
	}
	this.lastpierce = function(){this.dispose();}
	this.outofrange = function(){this.dispose();}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		if (this.body)
		world.DestroyBody(this.body);
		this.rate.dispose();
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
	if (omega){
		this.rate = new Counter(1);
		this.rate.loop = true;
		this.rate.makeready();
		this.range = 100;
		this.damage = 5;
		this.dt = 0;
		this.speed = 55;
		this.pierce = 5;
	}
	this.spawn = function(info){
		if (!mute) fxgatling.play();
		var p = [new pGatling(),new pGatling()];
		if (omega) p = [new pGatling(),new pGatling(),new pGatling(),new pGatling(),new pGatling(),new pGatling(),
			new pGatling(),new pGatling(),new pGatling(),new pGatling()];
		for (var i = 0; i < p.length; i++){
			var info2 = info;
			p[i].source = info.s;
			var t = Math.atan2(info.a.y,info.a.x);
			t+=(Math.random()-.5)*Math.PI/180*20;
			info2.a = new b2Vec2(Math.cos(t),Math.sin(t));
			info2.a.Multiply(Math.random()/2+.75);
			if (omega)
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
				if (this.source !== "p")
					this.pierce--;
				break;
			case "enem":
				if (this.source !== "e")
					this.pierce--;
				break;
		}
	}
	this.lastpierce = function(){this.dispose();}
	this.outofrange = function(){this.dispose();}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		if (this.body)
		world.DestroyBody(this.body);
		this.rate.dispose();
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
	if (omega){
		this.rate.dispose();
		this.rate = new Counter(40);
		this.rate.loop = true;
		this.rate.makeready();
		this.range = 45;
		this.damage = 5;
		this.dt = 0;
		this.speed = 65;
		this.pierce = 7;
	}
	this.spawn = function(info){
		if (!mute) fxfire.play();
		if (omega){
			for (var j = 0; j < 2; j++)
			for (var i = 0; i < Math.PI*2; i+=Math.PI/90){
				var p = new pIncinerator();
				var info2 = info;
				p.source = info2.s;
				var t = i+(Math.random()-.5)*Math.PI/90;
				info2.a = new b2Vec2(Math.cos(t),Math.sin(t));
				info2.a.Multiply(Math.random()/2+2.75+j*1.5);
				p.body = circlebody(p.img.width/scale*4,info2.p.x+info2.a.x,info2.p.y+info2.a.y,true);
				info2.a.Normalize();
				info2.a.Multiply(p.speed);
				p.body.SetLinearVelocity(info2.a);
				p.body.SetUserData(p);
				gos.push(p);
			}
			return;
		}
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
				if (this.source !== "p")
					this.pierce--;
				break;
			case "enem":
				if (this.source !== "e")
					this.pierce--;
				break;
		}
	}
	this.lastpierce = function(){this.dispose();}
	this.outofrange = function(){this.dispose();}
	this.dispose = function(){
		gos.splice(gos.indexOf(this),1);
		if (this.body)
		world.DestroyBody(this.body);
		this.rate.dispose();
	}
}
function Star(){
	this.rl = -2;
	this.p = randomonscreen();
	//this.z = Math.random()*20-10;
	this.scale = Math.random()*1.5+.2;
	this.update = function(){
		var n = player.body.GetLinearVelocity().Copy();
		n.Multiply((1.5*(this.scale)-1)/60);
		this.p.Subtract(n);
		this.keeponscreen();
	}
	this.render = function(){
		ctx.drawImage(istar,this.p.x*scale,this.p.y*scale,this.scale*.75*istar.width,this.scale*.75*istar.height);
	}
	this.keeponscreen = function(){
		var b = player.body.GetPosition(),
		w = bounds.g.w/scale/viewscale,
		h = bounds.g.h/scale/viewscale;
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
	return new b2Vec2(((Math.random()-.5)*bounds.g.w)/scale/viewscale, ((Math.random()-.5)*c.height-c.height/2)/scale/viewscale);
}
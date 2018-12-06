let rpm = 10;
let vx = 0; // m/s
let vy = 1; // m/s
let px_per_metre = 180;

let angle = 0; // degrees
let ballx = 0; // metres (0,0) = centre of roundabout
let bally = 0; // metres
let show_ball = false;

$('#shoot').click(function() {
    show_ball = true;
    // convert vx,vy from roundabout coords into world coords

    // start at position of red person in roundabout coords
    let pos = roundabout_to_world([0, -110]);
    ballx = pos[0] / px_per_metre;
    bally = pos[1] / px_per_metre;

    let vel = roundabout_to_world([parseFloat($('#vx').val()) + tangential_velocity(), parseFloat($('#vy').val())]);
    vx = vel[0];
    vy = vel[1];
});

$('#reset').click(function() {
    show_ball = false;
    $('#rpm').val("10");
    $('#vx').val("0");
    $('#vy').val("2");
});

$('#reset').click();

// update logic and graphics every 25ms (40Hz)
window.setInterval(function() {
    // physics
    rpm = parseFloat($('#rpm').val());
    $('#tangential').text("Tangential velocity: " + Math.round(100*tangential_velocity())/100 + " m/s");
    let degrees_per_25ms = (rpm * 360 * 25) / (60*1000);
    angle += degrees_per_25ms;
    while (angle < 0)
        angle += 360;
    while (angle >= 360)
        angle -= 360;

    ballx += vx / 40;
    bally += vy / 40;

    // graphics
    var c = document.getElementById('canvas1');
    var ctx = c.getContext('2d');

    ctx.beginPath();
    ctx.rect(0,0,400,400);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();

    ctx.translate(200,200);
    ctx.rotate(angle * Math.PI/180);
    drawScene(ctx, '#000', true);
    ctx.rotate(-angle * Math.PI/180);
    ctx.translate(-200,-200);

    c = document.getElementById('canvas2');
    ctx = c.getContext('2d');

    ctx.beginPath();
    ctx.rect(0,0,400,400);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();

    ctx.translate(200,200);
    drawScene(ctx, '#000', false);
    ctx.translate(-200,-200);
}, 25);

// draw the scene from the roundabout frame
// (0,0) is the centre of the roundabout
function drawScene(ctx, colour, add_tangential) {
    // background fixed in space
    for (let a = 0; a < 360; a += 18) {
        let x = Math.cos(a * Math.PI / 180) * 190;
        let y = Math.sin(a * Math.PI / 180) * 190;
        drawPost(ctx, x, y, '#940');
    }

    // roundabout
    ctx.beginPath();
    ctx.arc(0, 0, 180, 0, 2*Math.PI, false);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    for (let a = 22.5; a < 360; a += 45) {
        let x1 = Math.cos(a * Math.PI / 180) * 180;
        let y1 = Math.sin(a * Math.PI / 180) * 180;
        let x2 = Math.cos(a * Math.PI / 180) * 120;
        let y2 = Math.sin(a * Math.PI / 180) * 120;
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.strokeStyle = colour;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    ctx.beginPath();
    ctx.moveTo(0,-5);
    ctx.lineTo(0,5);
    ctx.moveTo(-5,0);
    ctx.lineTo(5,0);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // people
    drawPerson(ctx, 0, -140, '#f22');
    drawPerson(ctx, 140, 0, '#2f2');
    drawPerson(ctx, 0, 140, '#22f');
    drawPerson(ctx, -140, 0, '#ff2');

    // ball
    if (show_ball) {
        // convert (ballx, bally) from world coordinates to roundabout coordinates
        let ballpos = world_to_roundabout([ballx * px_per_metre, bally * px_per_metre]);
        ctx.beginPath();
        ctx.arc(ballpos[0], ballpos[1], 4, 0, 2*Math.PI, false);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.closePath();
    }

    // velocity vector lines (showing where ball will go)
    ctx.beginPath();
    ctx.moveTo(0,-110);
    let x = (parseFloat($('#vx').val()) + (add_tangential ? tangential_velocity() : 0)) * 30;
    let y = -110 + parseFloat($('#vy').val())*30;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#f22';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();
}

function drawPerson(ctx, x, y, colour) {
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, 2*Math.PI, false);
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.closePath();
}

function drawPost(ctx, x, y, colour) {
    let pos = world_to_roundabout([x,y]);
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], 3, 0, 2*Math.PI, false);
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.closePath();
}

// convert [x,y] from world coordinates to roundabout coordinates
function world_to_roundabout(pos) {
    // rotate backwards around origin by angle
    let x = pos[0] * Math.cos(-angle * Math.PI / 180) - pos[1] * Math.sin(-angle * Math.PI / 180);
    let y = pos[1] * Math.cos(-angle * Math.PI / 180) + pos[0] * Math.sin(-angle * Math.PI / 180);
    return [x, y];
}

// convert [x,y] from roundabout coordinates to world coordinates
function roundabout_to_world(pos) {
    // rotate forwards around origin by angle
    let x = pos[0] * Math.cos(angle * Math.PI / 180) - pos[1] * Math.sin(angle * Math.PI / 180);
    let y = pos[1] * Math.cos(angle * Math.PI / 180) + pos[0] * Math.sin(angle * Math.PI / 180);
    return [x, y];
}

function tangential_velocity() {
    // velocity at (110/px_per_metre) metres out on a circle turning at rpm
    // speed = distance / time
    let distance = Math.PI * 2 * (110 / px_per_metre); // circumference
    let time = 60 / rpm;// time for one rotation
    return distance / time;
}

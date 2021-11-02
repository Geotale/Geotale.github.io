//Please ignore this mess of comments
//This wasn't 

const image = document.getElementById("image");

const res = document.getElementById("res");
const resCtx = res.getContext("2d");

let width;
let height;

let lines = 10000;
let attempts = 250;
let mutations = 750;
let defaultMutateAmount = 5;

let mutateAmount = 0;

let spec = [];
let ideal;

let step = 0;
let running = false;

let prevData;
let prevScore;

const testCanvas = document.createElement("canvas");
const testCtx = testCanvas.getContext("2d");

const imageCanvas = document.createElement("canvas");
//const imageCanvas = document.getElementById("ideal");
const imageCtx = imageCanvas.getContext("2d");

let start;
function startGenerating(){
	width = image.width;
	height = image.height;

	res.width = testCanvas.width = imageCanvas.width = width;
	res.height = testCanvas.height = imageCanvas.height = height;

	mutateAmount = defaultMutateAmount / 480 * width;

	imageCtx.fillStyle = "#fff";
	imageCtx.fillRect(0, 0, width, height);
	imageCtx.drawImage(image, 0, 0, width, height);

	ideal = imageCtx.getImageData(0, 0, width, height).data;
	resCtx.clearRect(0, 0, width, height);

	prevData = new ImageData(width, height);
	prevData.data = prevData.data.fill(255);

	running = true;

	function generateLine(){
		generate();
		draw(spec, res, resCtx);
		prevData = resCtx.getImageData(0, 0, width, height);
		prevScore = totalMinScore;

		if(running)
			requestAnimationFrame(generateLine);
	}
	generateLine();
}

function draw(spec, canvas, ctx){
	ctx.putImageData(prevData, 0, 0);
	ctx.lineCap = "round";
		let i = spec.length - 1;

		let average = [0, 0, 0];
		let averageCount = 0;
		for(let y = Math.max(Math.round(Math.min(spec[i][1], spec[i][3]) - spec[i][4]), 0); y < Math.min(Math.max(spec[i][1], spec[i][3]) + spec[i][4], height); y++){
			for(let x = Math.max(Math.round(Math.min(spec[i][0], spec[i][2]) - spec[i][4]), 0); x < Math.min(Math.max(spec[i][0], spec[i][2]) + spec[i][4], width); x++){

				let v0x = spec[i][0];
				let v0y = spec[i][1];
				let v1x = spec[i][2];
				let v1y = spec[i][3];

				let dist = 0;
				if(v0x == v1x){
					if(v1y < v0y){
						[v0x, v1x] = [v1x, v0x];
						[v0y, v1y] = [v1y, v0y];
					}

					const xi = v0x;
					const yi = y;

					dist = (xi - x) * (xi - x);
					if(yi < v0y)
						dist += (v0y - y) * (v0y - y);
					else if(xi > v1y)
						dist += (v1y - y) * (v1y - y);
					else
						dist += (yi - y) * (yi - y);
				} else {
					if(v1x < v0x){
						[v0x, v1x] = [v1x, v0x];
						[v0y, v1y] = [v1y, v0y];
					}

					const mv = (v1y - v0y) / (v1x - v0x);
					const bv = v0y - mv * v0x;

					const m = -1 / mv;
					const b = y - m * x;

					const xi = (b - bv) / (mv - m);
					const yi = m * xi + b;

					if(xi < v0x)
						dist = (v0x - x) * (v0x - x) + (v0y - y) * (v0y - y);
					else if(xi > v1x)
						dist = (v1x - x) * (v1x - x) + (v1y - y) * (v1y - y);
					else
						dist = (xi - x) * (xi - x) + (yi - y) * (yi - y);
				}

				if(4 * dist < spec[i][4] * spec[i][4]){
					average[0] += ideal[((x + width * y) << 2) + 0];
					average[1] += ideal[((x + width * y) << 2) + 1];
					average[2] += ideal[((x + width * y) << 2) + 2];
					averageCount++;
				}
			}
		}

		average[0] /= averageCount;
		average[1] /= averageCount;
		average[2] /= averageCount;

		ctx.strokeStyle = `rgba(${average[0]}, ${average[1]}, ${average[2]}, 255)`;

		ctx.lineWidth = spec[i][4];

		ctx.beginPath();
		ctx.moveTo(spec[i][0], spec[i][1]);
		ctx.lineTo(spec[i][2], spec[i][3]);
		ctx.stroke();
}

function getScore(spec){
	draw(spec, testCanvas, testCtx);
	let test = testCtx.getImageData(0, 0, width, height).data;
	let err = 0;

	for(let i = 0; i < test.length; i += 4)
		err += Math.sqrt(
			(ideal[i] - test[i]) * (ideal[i] - test[i]) +
			(ideal[i + 1] - test[i + 1]) * (ideal[i + 1] - test[i + 1]) +
			(ideal[i + 2] - test[i + 2]) * (ideal[i + 2] - test[i + 2])
		);

	return err;
}

let totalMinScore = Infinity;
let totalMinSpec = [];
let i = 0;
function generate(){
		let tests = [];
		for(let j = 0; j < attempts; j++){
			if(Math.random() > .5)
				tests.push([
						width * Math.random(),  //X1
						height * Math.random(), //Y1
						width * Math.random(),  //X2
						height * Math.random(), //Y2
						100 * 480 / width * Math.random(), //Size
				]);
			else {
				const x = width * Math.random();
				const y = height * Math.random();
				tests.push([
						x,  //X1
						y, //Y1
						x,  //X2
						y, //Y2
						100 * 480 / width * Math.random(), //Size
				]);
			}
		}

		let minScore = Infinity;
		let minLine = [];
		for(let j = 0; j < attempts; j++){
			spec[i] = tests[j];
			let score = getScore(spec);
			if(score < minScore){
				minScore = score;
				minLine = tests[j];
			}
		}
		for(let j = 0; j < mutations; j++){
			spec[i] = [...minLine];

			if(Math.random() > .5){
				if(Math.random() > .5)
					spec[i][0] += mutateAmount * Math.random();
				else
					spec[i][0] -= mutateAmount * Math.random();
			}
			if(Math.random() > .5){
				if(Math.random() > .5)
					spec[i][1] += mutateAmount * Math.random();
				else
					spec[i][1] -= mutateAmount * Math.random();
			}
			if(Math.random() > .5){
				if(Math.random() > .5)
					spec[i][2] += mutateAmount * Math.random();
				else
					spec[i][2] -= mutateAmount * Math.random();
			}
			if(Math.random() > .5){
				if(Math.random() > .5)
					spec[i][3] += mutateAmount * Math.random();
				else
					spec[i][3] -= mutateAmount * Math.random();
			}
			if(Math.random() > .5){
				if(Math.random() > .5)
					spec[i][4] += mutateAmount * Math.random();
				else
					spec[i][4] -= mutateAmount * Math.random();

				if(spec[i][4] < 0)
					spec[i][4] += mutateAmount;
			}

			if(spec[i][0] - spec[i][4] > width)
				spec[i][0] -= spec[i][4] + width;
			if(spec[i][0] + spec[i][4] < 0)
				spec[i][0] += spec[i][4] + width;

			if(spec[i][1] - spec[i][4] > height)
				spec[i][1] -= spec[i][4] + height;
			if(spec[i][1] + spec[i][4] < 0)
				spec[i][1] += spec[i][4] + height;

			if(spec[i][2] - spec[i][4] > width)
				spec[i][2] -= spec[i][4] + width;
			if(spec[i][2] + spec[i][4] < 0)
				spec[i][2] += spec[i][4] + width;

			if(spec[i][3] - spec[i][4] > height)
				spec[i][3] -= spec[i][4] + height;
			if(spec[i][3] + spec[i][4] < 0)
				spec[i][3] += spec[i][4] + height;

			let score = getScore(spec);
			if(score < minScore){
				minScore = score;
				minLine = [...spec[i]];
			}
		}

		spec[i] = [...minLine];

		if(minScore < totalMinScore){
			totalMinSpec = spec.map(x => [...x]);
			totalMinScore = minScore;
		}

	i++;
	if(i >= lines){
		running = false;
		console.log("Done in " + (Date.now() - start) / 1000 + " seconds");
	}
}

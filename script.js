new ClipboardJS('.bucket');

output = document.getElementById("output");
let drop = document.getElementById("drop");
let dropText = document.getElementById("drop-text");

function initialSplit(img, depth) {
    let canvas = document.getElementById("canvas");
    let width = canvas.width = img.naturalWidth;
    let height = canvas.height = img.naturalHeight;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    let data = (ctx.getImageData(0, 0, width, height)).data;

    let colors = [];
    for(let i = 0; i < data.length; i += 4) {
        let pixel_arr = new Array(3);

        pixel_arr[0] = data[i];
        pixel_arr[1] = data[i+1];
        pixel_arr[2] = data[i+2];

        colors.push(pixel_arr);
    }

    recursiveSplit(colors, depth);

}

function recursiveSplit(colors, depth) {
    if(colors.length == 0) {
        return;
    }
    if(depth == 0) {
        colorBuckets.push(colors);
        return;
    }
    let min = [255, 255, 255];
    let max = [0, 0, 0];
    let ranges = [];

    for(let i = 0; i < colors.length; i += 4) {
        for(let j = 0; j < 3; j++) {
            min[j] = Math.min(min[j], colors[i][j]);
            max[j] = Math.max(max[j], colors[i][j]);
        }
    }

    ranges[0] = Math.abs(max[0] - min[0]);
    ranges[1] = Math.abs(max[1] - min[1]);
    ranges[2] = Math.abs(max[2] - min[2]);

    let max_range = Math.max(ranges[0], Math.max(ranges[1], ranges[2]));

    if(ranges[0] == max_range) {
        colors.sort((a, b) => {
            return a[0] - b[0];
        })
    } else if(ranges[1] == max_range) {
        colors.sort((a, b) => {
            return a[1] - b[1];
        })
    } else if(ranges[2] == max_range) {
        colors.sort((a, b) => {
            return a[2] - b[2];
        })
    }

    let median = Math.floor(colors.length / 2);

    recursiveSplit(colors.slice(0, median), depth - 1);
    recursiveSplit(colors.slice(median, colors.length), depth - 1);
}

function getAverages() {
    let averages = [];
    for(let i = 0; i < 16; i++) {
        let totals = [0, 0, 0];
        for(let j = 0; j < colorBuckets[i].length; j++) {
            for(let k = 0; k < 3; k++) {
                totals[k] += colorBuckets[i][j][k];
            }
        }
        let average = [Math.floor(totals[0]/colorBuckets[i].length), Math.floor(totals[1]/colorBuckets[i].length), Math.floor(totals[2]/colorBuckets[i].length)];
        averages.push(average);
    }

    return averages;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function displayImage(files) {
    resetDropStyle();
    while(output.firstChild && output.removeChild(output.firstChild));
    let img = document.createElement("img");
    img.src = URL.createObjectURL(files[0]);
    img.classList.add("image")
    output.appendChild(img);
    img.onload = function() {
        colorBuckets = [];
        initialSplit(img, 4);
        let nonUnique = getAverages();
        let buckets = document.createElement("div");
        buckets.classList.add("buckets");

        let averages = [...new Set(nonUnique.map(x => x.join(',')))].map(x => x.split(',').map(e => parseInt(e)));

        for(let i = 0; i < averages.length; i++) {
            let arrow = document.createElement("p");
            arrow.innerText = "copy";
            arrow.classList.add("copyArrow");
            let bucketColor = rgbToHex(averages[i][0], averages[i][1], averages[i][2]);

            let bucket = document.createElement("div");
            bucket.classList.add("bucket");
            bucket.style.backgroundColor = bucketColor;

            bucket.setAttribute('data-clipboard-action', 'copy');
            bucket.setAttribute('data-clipboard-text', bucketColor);

            bucket.addEventListener("mouseenter", ()=>{arrow.style.visibility = "visible"});
            bucket.addEventListener("mouseleave", ()=>{arrow.style.visibility = "hidden"});
            arrow.style.color = averages[i][0] + averages[i][1] + averages[i][2] >= (765)/2 ? "black" : "white";
            bucket.appendChild(arrow);

            buckets.appendChild(bucket);
        }
        output.appendChild(buckets);
    }
}

function resetDropStyle() {
    drop.setAttribute('data-theme', null);
    dropText.innerText = "DRAG AN IMAGE HERE"
}

function dragOverHandler(event) {
    drop.setAttribute('data-theme', "drag-over");
    dropText.innerText = "DROP IMAGE..."
    event.preventDefault();
}

function dragLeaveHandler(event) {
    resetDropStyle();
    event.preventDefault();
}

function dropHandler(event) {
    event.preventDefault();
    displayImage(event.dataTransfer.files)
}
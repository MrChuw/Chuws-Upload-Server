
function showImages(links) {
	links = links.split(" ");
	for (let index = 0; index < links.length; index++) {
		const li = document.createElement('li');
		li.innerHTML = `
		<li>
			<a href="${links[index]}">
				<img data-tippy-content="<img class='lage-image' style='height: fit-content; width: fit-content' src='${links[index]}'>" class="small-image" src="${links[index]}" loading="eager">
			</a>
		</li>`;
		document.getElementById('images').appendChild(li);
	}}

function initializeTippy() {
	tippy("img", {
		allowHTML: true,
		boundary: "container",
		animation: 'shift-away',
		maxWidth: "fit-content",
		theme: "teminha"
	});



}

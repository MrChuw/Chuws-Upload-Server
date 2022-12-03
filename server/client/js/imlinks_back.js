
window.addEventListener("DOMContentLoaded", function () {

	document.getElementById('butao').addEventListener('click', function(e) {
		criar_as_embed();
	});

	// Esse tipo seria pra um if, se é da pagina ou da api
	function criar_as_embed() {
		const id = document.getElementById("inp1").value;
		// const id = "https://i.imgur.com/OPISx.jpg https://i.imgur.com/OPISx.jpg";
		// const id = "https://i.imgur.com/OPISx.jpg https://i.imgur.com/nWRtv.jpg https://i.imgur.com/8KEX6.jpg https://i.imgur.com/6OtxN.jpg https://i.imgur.com/gDLNI.jpg https://i.imgur.com/09BPo.jpg https://i.imgur.com/4oq5l.jpg https://i.imgur.com/p62en.jpg https://i.imgur.com/YCT7c.jpg https://i.imgur.com/bpYV2.jpg https://i.imgur.com/vOjAy.jpg https://i.imgur.com/bSxsJ.jpg https://i.imgur.com/YmdsE.jpg https://i.imgur.com/GtVH8.jpg https://i.imgur.com/Sla8j.jpg https://i.imgur.com/XEr9s.jpg https://i.imgur.com/5ZkYa.jpg https://i.imgur.com/cfqJs.jpg https://i.imgur.com/gfSE3.jpg https://i.imgur.com/OYw79.jpg https://i.imgur.com/xBf0H.jpg https://i.imgur.com/hXPLP.jpg https://i.imgur.com/Pwp89.jpg https://i.imgur.com/iJ1SZ.jpg https://i.imgur.com/Kvwmd.jpg https://i.imgur.com/km7fL.jpg https://i.imgur.com/gHEha.jpg https://i.imgur.com/3Kdij.jpg ";
		// const id = "https://i.imgur.com/OPISx.jpg https://i.imgur.com/nWRtv.jpg https://i.imgur.com/8KEX6.jpg https://i.imgur.com/6OtxN.jpg https://i.imgur.com/gDLNI.jpg https://i.imgur.com/cuG5J.jpg https://i.imgur.com/09BPo.jpg https://i.imgur.com/4oq5l.jpg https://i.imgur.com/p62en.jpg https://i.imgur.com/YCT7c.jpg https://i.imgur.com/bpYV2.jpg https://i.imgur.com/vOjAy.jpg https://i.imgur.com/bSxsJ.jpg https://i.imgur.com/YmdsE.jpg https://i.imgur.com/GtVH8.jpg https://i.imgur.com/Sla8j.jpg https://i.imgur.com/XEr9s.jpg https://i.imgur.com/5ZkYa.jpg https://i.imgur.com/CGLzc.jpg https://i.imgur.com/cfqJs.jpg https://i.imgur.com/gfSE3.jpg https://i.imgur.com/OYw79.jpg https://i.imgur.com/xBf0H.jpg https://i.imgur.com/hXPLP.jpg https://i.imgur.com/Pwp89.jpg https://i.imgur.com/iJ1SZ.jpg https://i.imgur.com/Kvwmd.jpg https://i.imgur.com/km7fL.jpg https://i.imgur.com/gHEha.jpg https://i.imgur.com/3Kdij.jpg ";
		const ids = id.split(" ")
		const teste = []
		for (let index = 0; index < ids.length - 1; index++) {
			// console.log(ids[index])
			const li = document.createElement('li');
			li.innerHTML = `
			<li>
				<a href="${ids[index]}">
					<img data-tippy-content="<img class='lage-image' style='height: fit-content; width: fit-content' src='${ids[index]}'>" class="small-image" src="${ids[index]}" loading="eager">
				</a>
			</li>`
			// li.innerHTML = `
			// <li>
			// 	<a href="${ids[index]}">
			// 		<img data-tippy-content="<img src='https://i.imgur.com/OPISxs.jpg'>" class="small-image" src="${ids[index]}" loading="eager">
			// 	</a>
			// 	<span class="large">
			// 		<img src="${ids[index]}" class="large-image" alt="adventure" >
			// 	</span>
			// </li>`
			document.getElementById('images').appendChild(li);
			teste.push(li)
		}
		tippy("img", {
			allowHTML: true,
			placement: 'top',
			animation: 'scale',
			theme: "your-theme",
			boundary: "window",

		});
	}

	// const testo = teste.map(teste => [teste]);

	let lazyloadImages;
	if("IntersectionObserver" in window) {
	  lazyloadImages = document.querySelectorAll(".lazy-load");
	  let imageObserver = new IntersectionObserver(function(entries, observer) {
		entries.forEach(function(entry) {
		  if(entry.isIntersecting) {
			let image = entry.target;
			image.src = image.dataset.src;
			image.classList.remove("lazy-load");
			imageObserver.unobserve(image);
		  }
		});
	  });
	  lazyloadImages.forEach(function(image) {
		imageObserver.observe(image);
	  });
	} else {
	  let lazyloadThrottleTimeout;
	  lazyloadImages = document.querySelectorAll(".lazy-load");

	  function lazyload() {
		if(lazyloadThrottleTimeout) {
			clearTimeout(lazyloadThrottleTimeout);
		}
		lazyloadThrottleTimeout = setTimeout(function() {
		  let scrollTop = window.pageYOffset;
		  lazyloadImages.forEach(function(img) {
			if(img.offsetTop < (window.innerHeight + scrollTop)) {
			  img.src = img.dataset.src;
			  img.classList.remove('lazy-load');
			}
		  });
		  if(lazyloadImages.length == 0) {
			document.removeEventListener("scroll", lazyload);
			window.removeEventListener("resize", lazyload);
			window.removeEventListener("orientationChange", lazyload);
		  }
		}, 20);
	  }
	  document.addEventListener("scroll", lazyload);
	  window.addEventListener("resize", lazyload);
	  window.addEventListener("orientationChange", lazyload);
	}

});


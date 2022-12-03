document.addEventListener("DOMContentLoaded", function () {
	const fields = {
		target: document.getElementById("target"),
		uri: document.getElementById("uri")
	};
	const form = document.getElementsByClassName("form")[0];

	async function onSubmit(e) {
		e.preventDefault();
		const targetUrl = fields.target.value;
		if (targetUrl && targetUrl !== "") {
			const res = await window.Api.post("/links/web", {
				headers: {
					"shorten-url": targetUrl
				},
				body: {
					tag: fields.uri.value || undefined
				}
			});
			if (res.error) {
				showError(`Algo deu errado: ${res.error.message}`);
			} else {
				const resultBox = document.getElementsByClassName("result-box")[0];
				const resultLink = document.getElementById("result-link");
				resultLink.href = res.url;
				resultLink.innerText = res.url;
				resultBox.hidden = false;
			}
		} else {
			showError("Por favor, preencha o nome de usuário e a senha.");
		}
		return false;
	}

	form.addEventListener("submit", onSubmit);

	function showError(text) {
		const errorBox = document.getElementsByClassName("error-box")[0];
		errorBox.innerText = text;
		errorBox.hidden = false;
	}
});

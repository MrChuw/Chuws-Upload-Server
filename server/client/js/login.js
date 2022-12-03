document.addEventListener("DOMContentLoaded", function () {
	const fields = {
		username: document.getElementById("username"),
		password: document.getElementById("password"),
		show: document.getElementById("show-pass")
	};
	const form = document.getElementsByClassName("form")[0];
	fields.show.addEventListener("change", function () {
		const state = fields.show.checked;
		fields.password.type = state ? "text" : "password";
	});

	async function onSubmit(e) {
		e.preventDefault();
		const username = fields.username.value;
		const password = fields.password.value;
		if (username && password && username !== "" && password !== "") {
			const res = await window.Api.post("/users/login", {
				body: {
					username,
					password
				}
			});
			if (res.error) {
				showError("Usuário ou senha incorretos: Por favor verifique e tente novamente.");
				return false;
			} else {
				window.document.location.href = "/dashboard";
			}
		} else {
			showError("Por favor preencha tanto usuário quanto a senha.");
			return false;
		}
		return false;
	}

	form.onsubmit = onSubmit;

	function showError(text) {
		const errorBox = document.getElementsByClassName("error-box")[0];
		errorBox.innerText = text;
		errorBox.hidden = false;
	}
});

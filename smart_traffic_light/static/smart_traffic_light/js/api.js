(function () {
	function getCsrfToken() {
		const cookies = document.cookie ? document.cookie.split(";") : [];

		for (const rawCookie of cookies) {
			const cookie = rawCookie.trim();
			if (cookie.startsWith("csrftoken=")) {
				return decodeURIComponent(cookie.substring("csrftoken=".length));
			}
		}

		return "";
	}

	async function updateControllerTimes(apiUrl, payload) {
		const response = await fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-CSRFToken": getCsrfToken(),
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error("Failed to update controller times");
		}

		return response.json();
	}

	window.smartTrafficApi = {
		updateControllerTimes,
	};
})();

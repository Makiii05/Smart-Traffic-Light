(function () {
	let pendingRequests = 0;

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

	function notifyLoadingState() {
		window.dispatchEvent(
			new CustomEvent("smartTrafficApi:loading", {
				detail: {
					isLoading: pendingRequests > 0,
					pendingRequests,
				},
			})
		);
	}

	async function postJson(apiUrl, payload, defaultErrorMessage) {
		pendingRequests += 1;
		notifyLoadingState();

		try {
			const response = await fetch(apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRFToken": getCsrfToken(),
				},
				body: JSON.stringify(payload),
			});

			let responseData = {};
			try {
				responseData = await response.json();
			} catch (error) {
				responseData = {};
			}

			if (!response.ok) {
				throw new Error(responseData.error || defaultErrorMessage);
			}

			return responseData;
		} finally {
			pendingRequests = Math.max(0, pendingRequests - 1);
			notifyLoadingState();
		}
	}

	async function updateControllerTimes(apiUrl, payload) {
		return postJson(apiUrl, payload, "Failed to update controller times");
	}

	async function selectRoi(apiUrl, payload) {
		return postJson(apiUrl, payload, "Failed to select ROI");
	}

	async function updateControllerRoi(apiUrl, payload) {
		return postJson(apiUrl, payload, "Failed to update controller ROI");
	}

	async function startControllerPreview(apiUrl, payload) {
		return postJson(apiUrl, payload, "Failed to start controller preview");
	}

	window.smartTrafficApi = {
		updateControllerTimes,
		selectRoi,
		updateControllerRoi,
		startControllerPreview,
	};
})();

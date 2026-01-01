$(document).ready(function () {
	// ==================== THEME TOGGLE ====================
	const $html = $("html");
	const $body = $("body");
	const $themeToggle = $("#themeToggle");

	function initTheme() {
		const savedTheme = localStorage.getItem("emiCalculatorTheme") || "dark";
		setTheme(savedTheme);
	}

	function setTheme(theme) {
		$html.attr("data-color-scheme", theme);
		$body.attr("data-color-scheme", theme);
		updateThemeButton(theme);
	}

	function updateThemeButton(theme) {
		$themeToggle.text(theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode");
	}

	$themeToggle.on("click", function () {
		const currentTheme = $html.attr("data-color-scheme") || "dark";
		const newTheme = currentTheme === "dark" ? "light" : "dark";
		setTheme(newTheme);
		localStorage.setItem("emiCalculatorTheme", newTheme);
	});

	// ==================== FORM ELEMENTS ====================
	const $principal = $("#principal");
	const $rate = $("#rate");
	const $tenure = $("#tenure");
	const $gstRate = $("#gstRate");
	const $processingFee = $("#processingFee");
	const $processingGstRate = $("#processingGstRate");
	const $calculateBtn = $("#calculateBtn");
	const $resetBtn = $("#resetBtn");
	const $resultsSection = $("#resultsSection");

	// ==================== CALCULATION LOGIC ====================
	function calculateEMI() {
		// Get input values
		const principal = parseFloat($principal.val()) || 0;
		const annualRate = parseFloat($rate.val()) || 0;
		const tenure = parseInt($tenure.val()) || 0;
		const gstOnInterestRate = parseFloat($gstRate.val()) || 0;
		const processingFee = parseFloat($processingFee.val()) || 0;
		const gstOnProcessingRate = parseFloat($processingGstRate.val()) || 0;

		// Validation
		if (principal <= 0 || annualRate <= 0 || tenure <= 0) {
			alert("Please enter valid values for principal, interest rate, and tenure.");
			return;
		}

		// Calculate monthly interest rate
		const monthlyRate = annualRate / 12 / 100;

		// EMI calculation using reducing balance formula
		const emi =
			monthlyRate === 0 ? principal / tenure : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);

		// Initialize tracking variables
		let outstandingBalance = principal;
		const monthlyData = [];
		let totalPrincipal = 0;
		let totalInterest = 0;
		let totalGSTOnInterest = 0;
		let totalProcessingWithGST = processingFee * (1 + gstOnProcessingRate / 100);

		// Calculate monthly breakdown
		for (let month = 1; month <= tenure; month++) {
			// Calculate interest on remaining balance
			const interestPayment = outstandingBalance * monthlyRate;
			const gstOnInterest = interestPayment * (gstOnInterestRate / 100);

			// Principal repaid = EMI - Interest - GST on Interest
			const principalRepaid = emi - interestPayment - gstOnInterest;

			// Processing fees only in month 1
			const processingFeeMonth1 = month === 1 ? processingFee : 0;
			const gstProcessingFeeMonth1 = month === 1 ? processingFee * (gstOnProcessingRate / 100) : 0;

			// Total monthly payment
			const totalMonthlyPayment = principalRepaid + interestPayment + gstOnInterest + processingFeeMonth1 + gstProcessingFeeMonth1;

			// Update remaining balance
			outstandingBalance -= principalRepaid;

			// Track totals
			totalPrincipal += principalRepaid;
			totalInterest += interestPayment;
			totalGSTOnInterest += gstOnInterest;

			// Store month data
			monthlyData.push({
				month: month,
				remainingBalance: Math.max(0, outstandingBalance),
				principalRepaid: principalRepaid,
				interest: interestPayment,
				gstOnInterest: gstOnInterest,
				processingFee: processingFeeMonth1,
				processingGST: gstProcessingFeeMonth1,
				totalPayment: totalMonthlyPayment,
			});
		}

		// Calculate totals
		const totalAmountPaid = totalPrincipal + totalInterest + totalGSTOnInterest + processingFee + (processingFee * gstOnProcessingRate) / 100;
		const totalGSTPaid = totalGSTOnInterest + (processingFee * gstOnProcessingRate) / 100;
		const extraCost = totalInterest + totalGSTPaid + processingFee + (processingFee * gstOnProcessingRate) / 100;

		// Display results
		displayResults(monthlyData, {
			totalAmountPaid,
			totalInterest,
			totalGSTPaid,
			totalProcessingWithGST,
			extraCost,
			principal,
		});
	}

	// ==================== DISPLAY RESULTS ====================
	function displayResults(monthlyData, totals) {
		// Update summary cards
		$("#totalAmountPaid").text(formatCurrency(totals.totalAmountPaid));
		$("#totalInterest").text(formatCurrency(totals.totalInterest));
		$("#totalGST").text(formatCurrency(totals.totalGSTPaid));
		$("#totalProcessingWithGst").text(formatCurrency(totals.totalProcessingWithGST));
		$("#totalExtraCost").text(formatCurrency(totals.extraCost));

		// Build table
		const $tableBody = $("#tableBody");
		$tableBody.empty();

		monthlyData.forEach((row) => {
			const $tr = $("<tr>");
			$tr.html(`
                <td>${row.month}</td>
                <td>${formatCurrency(row.remainingBalance)}</td>
                <td class="col-principal">${formatCurrency(row.principalRepaid)}</td>
                <td class="col-interest">${formatCurrency(row.interest)}</td>
                <td class="col-gst">${formatCurrency(row.gstOnInterest)}</td>
                <td class="col-processing">${formatCurrency(row.processingFee + row.processingGST)}</td>
                <td>${formatCurrency(row.totalPayment)}</td>
            `);
			$tableBody.append($tr);
		});

		// Add totals row
		const $totalsRow = $("<tr>").addClass("totals-row");
		const totalPrincipal = monthlyData.reduce((sum, row) => sum + row.principalRepaid, 0);
		const totalInterest = monthlyData.reduce((sum, row) => sum + row.interest, 0);
		const totalGST = monthlyData.reduce((sum, row) => sum + row.gstOnInterest + row.processingGST, 0);
		const totalProcessing = monthlyData.reduce((sum, row) => sum + row.processingFee + row.processingGST, 0);
		const totalPayment = monthlyData.reduce((sum, row) => sum + row.totalPayment, 0);

		$totalsRow.html(`
            <td>Total</td>
            <td>-</td>
            <td class="col-principal">${formatCurrency(totalPrincipal)}</td>
            <td class="col-interest">${formatCurrency(totalInterest)}</td>
            <td class="col-gst">${formatCurrency(totalGST - totalProcessing + (monthlyData[0]?.processingGST || 0))}</td>
            <td class="col-processing">${formatCurrency(totalProcessing)}</td>
            <td>${formatCurrency(totalPayment)}</td>
        `);
		$tableBody.append($totalsRow);

		// Show results section
		$resultsSection.addClass("show");
		setTimeout(() => {
			$("html, body").animate(
				{
					scrollTop: $resultsSection.offset().top - 100,
				},
				500
			);
		}, 100);
	}

	// ==================== UTILITY FUNCTIONS ====================
	function formatCurrency(value) {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: "INR",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	}

	// ==================== EVENT LISTENERS ====================
	$calculateBtn.on("click", calculateEMI);

	$resetBtn.on("click", function () {
		$principal.val(100000);
		$rate.val(12);
		$tenure.val(12);
		$gstRate.val(18);
		$processingFee.val(1000);
		$processingGstRate.val(18);
		$resultsSection.removeClass("show");
	});

	// Allow Enter key to calculate
	$(document).on("keypress", ".input-field", function (e) {
		if (e.key === "Enter") {
			calculateEMI();
		}
	});

	// Initialize theme on page load
	initTheme();
});

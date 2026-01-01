// ==================== THEME TOGGLE ====================
const themeToggle = document.getElementById("themeToggle");
const htmlElement = document.documentElement;

// Initialize theme from localStorage
function initTheme() {
	const savedTheme = localStorage.getItem("emiCalculatorTheme") || "dark";
	htmlElement.setAttribute("data-color-scheme", savedTheme);
	updateThemeButton(savedTheme);
}

function updateThemeButton(theme) {
	themeToggle.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
}

themeToggle.addEventListener("click", () => {
	const currentTheme = htmlElement.getAttribute("data-color-scheme") || "dark";
	const newTheme = currentTheme === "dark" ? "light" : "dark";
	htmlElement.setAttribute("data-color-scheme", newTheme);
	localStorage.setItem("emiCalculatorTheme", newTheme);
	updateThemeButton(newTheme);
});

// ==================== FORM ELEMENTS ====================
const principalInput = document.getElementById("principal");
const rateInput = document.getElementById("rate");
const tenureInput = document.getElementById("tenure");
const gstRateInput = document.getElementById("gstRate");
const processingFeeInput = document.getElementById("processingFee");
const processingGstRateInput = document.getElementById("processingGstRate");
const calculateBtn = document.getElementById("calculateBtn");
const resetBtn = document.getElementById("resetBtn");
const resultsSection = document.getElementById("resultsSection");

// ==================== CALCULATION LOGIC ====================
function calculateEMI() {
	// Get input values
	const principal = parseFloat(principalInput.value) || 0;
	const annualRate = parseFloat(rateInput.value) || 0;
	const tenure = parseInt(tenureInput.value) || 0;
	const gstOnInterestRate = parseFloat(gstRateInput.value) || 0;
	const processingFee = parseFloat(processingFeeInput.value) || 0;
	const gstOnProcessingRate = parseFloat(processingGstRateInput.value) || 0;

	// Validation
	if (principal <= 0 || annualRate <= 0 || tenure <= 0) {
		alert("Please enter valid values for principal, interest rate, and tenure.");
		return;
	}

	// Calculate monthly interest rate
	const monthlyRate = annualRate / 12 / 100;

	// EMI calculation using reducing balance formula
	// EMI = P * [R * (1+R)^n] / [(1+R)^n - 1]
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
	document.getElementById("totalAmountPaid").textContent = formatCurrency(totals.totalAmountPaid);
	document.getElementById("totalInterest").textContent = formatCurrency(totals.totalInterest);
	document.getElementById("totalGST").textContent = formatCurrency(totals.totalGSTPaid);
	document.getElementById("totalProcessingWithGst").textContent = formatCurrency(totals.totalProcessingWithGST);
	document.getElementById("totalExtraCost").textContent = formatCurrency(totals.extraCost);

	// Build table
	const tableBody = document.getElementById("tableBody");
	tableBody.innerHTML = "";

	monthlyData.forEach((row) => {
		const tr = document.createElement("tr");
		tr.innerHTML = `
                    <td>${row.month}</td>
                    <td>${formatCurrency(row.remainingBalance)}</td>
                    <td class="col-principal">${formatCurrency(row.principalRepaid)}</td>
                    <td class="col-interest">${formatCurrency(row.interest)}</td>
                    <td class="col-gst">${formatCurrency(row.gstOnInterest)}</td>
                    <td class="col-processing">${formatCurrency(row.processingFee + row.processingGST)}</td>
                    <td>${formatCurrency(row.totalPayment)}</td>
                `;
		tableBody.appendChild(tr);
	});

	// Add totals row
	const totalsRow = document.createElement("tr");
	totalsRow.classList.add("totals-row");
	const totalPrincipal = monthlyData.reduce((sum, row) => sum + row.principalRepaid, 0);
	const totalInterest = monthlyData.reduce((sum, row) => sum + row.interest, 0);
	const totalGST = monthlyData.reduce((sum, row) => sum + row.gstOnInterest + row.processingGST, 0);
	const totalProcessing = monthlyData.reduce((sum, row) => sum + row.processingFee + row.processingGST, 0);
	const totalPayment = monthlyData.reduce((sum, row) => sum + row.totalPayment, 0);

	totalsRow.innerHTML = `
                <td>Total</td>
                <td>-</td>
                <td class="col-principal">${formatCurrency(totalPrincipal)}</td>
                <td class="col-interest">${formatCurrency(totalInterest)}</td>
                <td class="col-gst">${formatCurrency(totalGST - totalProcessing + monthlyData[0]?.processingGST || 0)}</td>
                <td class="col-processing">${formatCurrency(totalProcessing)}</td>
                <td>${formatCurrency(totalPayment)}</td>
            `;
	tableBody.appendChild(totalsRow);

	// Show results section
	resultsSection.classList.add("show");
	setTimeout(() => resultsSection.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
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
calculateBtn.addEventListener("click", calculateEMI);

resetBtn.addEventListener("click", () => {
	principalInput.value = 100000;
	rateInput.value = 12;
	tenureInput.value = 12;
	gstRateInput.value = 18;
	processingFeeInput.value = 1000;
	processingGstRateInput.value = 18;
	resultsSection.classList.remove("show");
});

// Initialize theme on page load
initTheme();

// Allow Enter key to calculate
document.addEventListener("keypress", (e) => {
	if (e.key === "Enter" && document.activeElement.classList.contains("input-field")) {
		calculateEMI();
	}
});
